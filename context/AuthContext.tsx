import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_URL, LEGAL_VERSION } from '@/constants';
import { identify, resetAnalytics, track } from '@/lib/analytics';

// Configura cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

interface User {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  ciudad?: string;
  telefono?: string;
  posicion?: string;
  nivel?: string;            // auto-declarado en onboarding (Principiante/Intermedio/Avanzado)
  rating?: number;           // calculado tipo Playtomic (1.0 → ∞)
  genero?: 'M' | 'F' | 'O' | null;
  fecha_nacimiento?: string;
  avatar_url?: string;
  partidos_jug?: number;
  partidos_gan?: number;
  racha_actual?: number;
  racha_max?: number;
  expo_push_token?: string;
  email_verificado?: boolean;
  onboarding_completo?: boolean;
  legal_aceptado_version?: string | null;
  legal_aceptado_at?: string | null;
}

export interface OnboardingPerfilData {
  posicion: 'POR' | 'DEF' | 'MED' | 'DEL';
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado';
  genero: 'M' | 'F' | 'O';
  telefono?: string;
  avatar_url?: string;
}

// register/login pueden requerir verificación; el caller navega a /(auth)/verificar
export type AuthResult =
  | { ok: true }
  | { requiere_verificacion: true; email: string };

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  verifyEmail: (email: string, codigo: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, codigo: string, password_nueva: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  completarOnboarding: (data: OnboardingPerfilData) => Promise<void>;
  handleUnauthorized: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
  aceptarLegal: () => Promise<void>;
}

interface RegisterData {
  nombre: string;
  apellido?: string;
  email: string;
  password: string;
  ciudad?: string;
  fecha_nacimiento: string;  // 'YYYY-MM-DD' — requerido (edad mínima 16)
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY         = 'retta_token';
const REFRESH_TOKEN_KEY = 'retta_refresh_token';
const USER_KEY          = 'retta_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs paralelos al state para que useApi pueda leer el valor actual
  // sin recrear el callback en cada cambio.
  const refreshTokenRef = useRef<string | null>(null);
  // Promise singleton: si N requests fallan con 401 simultáneamente,
  // todas comparten el mismo refresh en vez de disparar N refreshes.
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => { loadSession(); }, []);

  async function registerPushToken(authToken: string) {
    try {
      if (!Device.isDevice) return;

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Retta',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
        projectId: '5cb77489-94e7-40cc-ab40-e9a80723ff81',
      });
      if (!pushToken) return;

      await fetch(`${API_URL}/usuarios/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ expo_push_token: pushToken }),
      });
    } catch {}
  }

  async function loadSession() {
    try {
      const savedToken        = await SecureStore.getItemAsync(TOKEN_KEY);
      const savedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const savedUser         = await SecureStore.getItemAsync(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        refreshTokenRef.current = savedRefreshToken;
      }
    } catch {}
    setLoading(false);
  }

  // ── Persistir tokens + user (helper interno) ──
  async function persistSession(newToken: string, newRefreshToken: string | null, newUser: User) {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    if (newRefreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
      refreshTokenRef.current = newRefreshToken;
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    registerPushToken(newToken);

    // Analytics: vincular eventos al usuario. NO mandamos email/teléfono/nombre
    // — solo info útil para segmentar que no es PII estricta.
    identify(newUser.id, {
      ciudad:               newUser.ciudad || null,
      nivel:                newUser.nivel || null,
      posicion:             newUser.posicion || null,
      genero:               newUser.genero || null,
      onboarding_completo:  newUser.onboarding_completo !== false,
      partidos_jug:         newUser.partidos_jug || 0,
    });
  }

  // ── Refresh: pide nuevo access + rota refresh ──
  // Devuelve el nuevo access token, o null si el refresh falló (sesión muerta).
  // Singleton: si ya hay un refresh en vuelo, devuelve esa misma promesa.
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      try {
        const rt = refreshTokenRef.current;
        if (!rt) return null;

        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.token || !data.refresh_token) return null;

        // Persistir el nuevo par. NO cambiamos al user.
        await SecureStore.setItemAsync(TOKEN_KEY, data.token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refresh_token);
        refreshTokenRef.current = data.refresh_token;
        setToken(data.token);
        return data.token as string;
      } catch {
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // ── Login ──
  async function login(email: string, password: string): Promise<AuthResult> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    // Backend manda 403 con requiere_verificacion si el email aún no se verifica.
    // En ese caso ya mandó un nuevo código por email.
    if (res.status === 403 && data.requiere_verificacion) {
      track('auth_login_requiere_verificacion');
      return { requiere_verificacion: true, email: data.email };
    }
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

    await persistSession(data.token, data.refresh_token || null, data.usuario);
    track('auth_login_completado');
    return { ok: true };
  }

  // ── Registro: SIEMPRE requiere verificación de email ──
  // Manda legal_version porque el registro implica aceptar T&C + Aviso.
  // El backend lo guarda con timestamp como prueba de consentimiento.
  async function register(registerData: RegisterData): Promise<AuthResult> {
    const res = await fetch(`${API_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...registerData, legal_version: LEGAL_VERSION }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrarse');

    track('auth_registro_completado', {
      ciudad: registerData.ciudad || null,
    });
    return { requiere_verificacion: true, email: data.email };
  }

  // ── Verificar email con código → emite tokens ──
  async function verifyEmail(email: string, codigo: string) {
    const res = await fetch(`${API_URL}/auth/verificar-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, codigo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Código incorrecto');

    await persistSession(data.token, data.refresh_token || null, data.usuario);
    track('auth_email_verificado');
  }

  // ── Reenviar código de verificación ──
  async function resendCode(email: string) {
    const res = await fetch(`${API_URL}/auth/reenviar-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo reenviar el código');
  }

  // ── Forgot password (manda código) ──
  async function forgotPassword(email: string) {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo enviar el código');
  }

  // ── Reset password (valida código y guarda nueva contraseña) ──
  async function resetPassword(email: string, codigo: string, password_nueva: string) {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, codigo, password_nueva }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo restablecer la contraseña');
  }

  async function clearLocalSession() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    refreshTokenRef.current = null;
    setToken(null);
    setUser(null);
  }

  async function logout() {
    // Track ANTES de limpiar la sesión para que el evento aún se vincule
    // al user_id correcto antes del reset.
    track('auth_logout');
    resetAnalytics();
    // Best-effort: avisar al backend para revocar el refresh token.
    const rt = refreshTokenRef.current;
    if (rt) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
      } catch {}
    }
    await clearLocalSession();
  }

  async function handleUnauthorized() {
    // Token expirado y refresh falló — limpiar sesión y mandar al login
    await clearLocalSession();
  }

  async function completarOnboarding(data: OnboardingPerfilData) {
    const res = await fetch(`${API_URL}/auth/onboarding-perfil`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar el perfil');

    const newUser = { ...user, ...json.usuario } as User;
    setUser(newUser);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
    // Re-identify con datos actualizados de onboarding para que PostHog
    // ya tenga posicion/nivel/genero al segmentar futuros eventos.
    if (newUser.id) {
      identify(newUser.id, {
        ciudad:               newUser.ciudad || null,
        nivel:                newUser.nivel || null,
        posicion:             newUser.posicion || null,
        genero:               newUser.genero || null,
        onboarding_completo:  true,
      });
    }
    track('auth_onboarding_completado', {
      posicion: data.posicion,
      nivel:    data.nivel,
      genero:   data.genero,
    });
  }

  // Pulls fresh user data from /auth/me — incluye stats actualizadas
  // (rating, racha_actual, racha_max, partidos_jug, partidos_gan).
  // El backend recalcula en cada llamada antes de devolver.
  async function refreshUser() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const fresh = await res.json();
      setUser(fresh);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(fresh));
    } catch {}
  }

  // ── Aceptar la versión actual de Términos + Aviso de Privacidad ──
  // La llama la pantalla bloqueante /aceptar-legal cuando el usuario
  // tap "Acepto y continúo". Persiste con timestamp en el backend.
  //
  // Maneja auto-refresh del access token igual que useApi: si el token
  // local está caducado (401), pide uno nuevo con refreshAccessToken y
  // reintenta UNA vez. Si el refresh falla, cierra sesión limpia.
  // Es importante porque la pantalla bloqueante suele dispararse al abrir
  // la app después de horas/días — es justo cuando los tokens caducan.
  async function aceptarLegal() {
    if (!token) throw new Error('Sesión inválida');

    const doFetch = (tk: string) => fetch(`${API_URL}/usuarios/me/aceptar-legal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tk}`,
      },
      body: JSON.stringify({ version: LEGAL_VERSION }),
    });

    let res = await doFetch(token);

    // Token expirado → refresh transparente y reintento único
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        await handleUnauthorized();
        throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
      }
      res = await doFetch(newToken);
      if (res.status === 401) {
        await handleUnauthorized();
        throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
      }
    }

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'No se pudo registrar la aceptación');

    const newUser = {
      ...user,
      legal_aceptado_version: json.legal_aceptado_version,
      legal_aceptado_at:      json.legal_aceptado_at,
    } as User;
    setUser(newUser);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
    track('legal_aceptado', { version: LEGAL_VERSION });
  }

  async function updateUser(data: Partial<User>) {
    const res = await fetch(`${API_URL}/usuarios/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    if (!res.ok) throw new Error(updated.error || 'Error al actualizar perfil');

    const newUser = { ...user, ...updated } as User;
    setUser(newUser);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register,
      verifyEmail, resendCode,
      forgotPassword, resetPassword,
      logout, updateUser, completarOnboarding,
      handleUnauthorized, refreshAccessToken, refreshUser,
      aceptarLegal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
