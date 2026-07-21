import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DT } from '@/constants/designTokens';
import { LEGAL_VERSION } from '@/constants';
import * as Sentry from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { TUTORIAL_SEEN_KEY } from './tutorial';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { POSTHOG_CONFIG, registerAnalyticsClient } from '@/lib/analytics';
import { AppAlertHost } from '@/lib/appAlert';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@/constants';
// ── Fuentes oficiales del manual de marca 2026 ──
// - Sora (títulos) + Inter (cuerpo/labels/datos) son las únicas que usa FONTS.
// - Se quitaron Space Grotesk y JetBrains Mono: ninguna pantalla las
//   referencia (FONTS mapea solo a Sora/Inter), así que ya no se cargan.
import { useFonts as useAppFonts } from '@expo-google-fonts/inter';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

// ─────────────────────────────────────────────────────────────
// Sentry — solo activo en builds de producción (no en Expo Go dev).
// El DSN se compila al cliente y es "público"; el linter de Sentry no
// considera secret estos identificadores para mobile/web SDKs.
// ─────────────────────────────────────────────────────────────
Sentry.init({
  dsn: 'https://07f256b3441c9691773a0a1ee2952269@o4511294811930624.ingest.us.sentry.io/4511294831525889',
  enabled: !__DEV__,
  // Solo errores — sin tracing ni replay para conservar plan free.
  tracesSampleRate: 0,
  profilesSampleRate: 0,
  // Privacidad: no recolectar PII por defecto
  sendDefaultPii: false,
});

// Nota: el handler de notificaciones en foreground
// (Notifications.setNotificationHandler) vive en AuthContext.tsx —
// no duplicarlo aquí: el último en registrarse pisa al anterior.

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router   = useRouter();
  // null = aún no verificamos, false = no visto, true = ya visto
  const [tutorialSeen, setTutorialSeen] = useState<boolean | null>(null);

  // Cargar estado del tutorial al inicio
  useEffect(() => {
    SecureStore.getItemAsync(TUTORIAL_SEEN_KEY)
      .then(v => setTutorialSeen(v === '1'))
      .catch(() => setTutorialSeen(true)); // si falla, asumimos visto (no molestar)
  }, []);

  // ─── Deep-link de notificaciones ───
  // Cuando el usuario toca una notificación push, el backend mete data:
  // { partido_id: '...' } en el payload. Aquí escuchamos ese tap y
  // navegamos directo al partido en vez de dejarlo en la pantalla actual.
  // Soporta:
  //   • cold-start (app estaba cerrada y se abre tocando la notif)
  //   • foreground/background (app abierta o suspendida)
  useEffect(() => {
    // 1) Cold-start: revisar si la última notif tocada al abrir trae partido_id
    Notifications.getLastNotificationResponseAsync().then(response => {
      const partidoId = response?.notification?.request?.content?.data?.partido_id;
      if (partidoId && typeof partidoId === 'string') {
        // Delay para asegurar que el routing inicial terminó antes de navegar
        setTimeout(() => router.push(`/partido/${partidoId}?desde=notificacion`), 600);
      }
    }).catch(() => {});

    // 2) Foreground/background: listener vivo de cualquier notif tocada
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const partidoId = response?.notification?.request?.content?.data?.partido_id;
      if (partidoId && typeof partidoId === 'string') {
        router.push(`/partido/${partidoId}?desde=notificacion`);
      }
    });
    return () => sub.remove();
  }, []);

  // Re-verifica el flag del tutorial cada vez que cambia la pantalla.
  // Esto evita el bug donde después de apretar "Empezar" en el tutorial,
  // el useEffect de routing veía tutorialSeen=false (stale) y redirigía
  // de regreso a /tutorial en loop.
  useEffect(() => {
    if (!user) return;
    SecureStore.getItemAsync(TUTORIAL_SEEN_KEY).then(v => {
      const seen = v === '1';
      if (seen !== tutorialSeen) setTutorialSeen(seen);
    }).catch(() => {});
  }, [segments]);

  useEffect(() => {
    if (loading || tutorialSeen === null) return;
    const inAuthGroup    = segments[0] === '(auth)';
    const inOnboarding   = segments[1] === 'onboarding-perfil';
    const inTutorial     = segments[0] === 'tutorial';
    const inAceptarLegal = segments[0] === 'aceptar-legal';
    // Los documentos legales deben poder ABRIRSE desde login (checkbox),
    // onboarding y aceptar-legal. Sin esta excepción, el guard rebotaba
    // la navegación (links "muertos" en login) o REMONTABA el onboarding
    // (perdías todo el progreso al tocar "Aviso de Privacidad").
    const inLegalDocs = segments[0] === 'terminos' || segments[0] === 'privacidad';

    if (!user && !inAuthGroup && !inLegalDocs) {
      router.replace('/(auth)/login');
      return;
    }
    if (user && user.onboarding_completo === false && !inOnboarding && !inLegalDocs) {
      router.replace('/(auth)/onboarding-perfil');
      return;
    }
    // Bloqueo legal: si el usuario no aceptó la versión vigente de T&C +
    // Aviso de Privacidad, lo redirigimos a /aceptar-legal antes de cualquier
    // otra pantalla. Esto incluye usuarios previos a esta feature (NULL) y
    // a quienes les bumpeamos LEGAL_VERSION por cambios al texto.
    if (
      user &&
      user.onboarding_completo !== false &&
      user.legal_aceptado_version !== LEGAL_VERSION &&
      !inAceptarLegal &&
      !inLegalDocs
    ) {
      router.replace('/aceptar-legal');
      return;
    }
    // Después de onboarding-perfil pero antes de tabs: mostrar tutorial 1 vez.
    // OJO: agregamos `!inTabs` como guard. Sin él, cuando finish() del tutorial
    // navega a /(tabs)/partidos, este useEffect corría con `tutorialSeen`
    // stale (false) porque el otro useEffect que re-lee SecureStore es async,
    // redirigiendo al usuario de regreso al tutorial (segunda ronda).
    const inTabs = segments[0] === '(tabs)';
    if (
      user && user.onboarding_completo !== false &&
      user.legal_aceptado_version === LEGAL_VERSION &&
      !tutorialSeen && !inTutorial && !inTabs && !inLegalDocs
    ) {
      router.replace('/tutorial');
      return;
    }
    if (
      user && user.onboarding_completo !== false &&
      user.legal_aceptado_version === LEGAL_VERSION &&
      tutorialSeen && (inAuthGroup || inAceptarLegal)
    ) {
      router.replace('/(tabs)/partidos');
    }
  }, [user, loading, tutorialSeen, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: DT.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={DT.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#11131b' } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tutorial"     options={{ animation: 'fade' }} />
      <Stack.Screen name="aceptar-legal" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="partido/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="usuario/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="amigos"       options={{ presentation: 'card' }} />
    </Stack>
  );
}

// Hook puente: registra el cliente de PostHog (creado por el provider)
// en nuestro wrapper de lib/analytics.ts para que el resto de la app
// pueda hacer track() sin pasar el cliente por contexto.
function AnalyticsBridge() {
  const posthog = usePostHog();
  useEffect(() => {
    registerAnalyticsClient(posthog || null);
    return () => registerAnalyticsClient(null);
  }, [posthog]);
  return null;
}

function RootLayout() {
  // Cargar las fuentes del rediseño. Mientras no estén listas, mostramos
  // un loader para evitar el "flash" de fuente del sistema.
  const [fontsLoaded] = useAppFonts({
    // Manual de marca 2026 — Sora + Inter son las oficiales
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#11131b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#bec2ff" size="large" />
      </View>
    );
  }

  return (
    // GestureHandlerRootView envuelve TODA la app para que los componentes
    // de react-native-gesture-handler (Swipeable, etc.) funcionen. Sin este
    // wrapper, los gestos de swipe-to-delete en notificaciones no responden.
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PostHogProvider
      apiKey={POSTHOG_CONFIG.apiKey}
      options={{
        host:                       POSTHOG_CONFIG.host,
        // Solo enviar eventos en builds reales — igual que Sentry.
        // En __DEV__ el wrapper de analytics también es no-op por defensa.
        disabled:                   __DEV__,
        captureAppLifecycleEvents:  true,
      }}
      autocapture={false}
    >
      <AnalyticsBridge />
      <AuthProvider>
        {/* StripeProvider wrappea toda la app para que confirmar-pago.tsx
            (o cualquier otra pantalla futura) pueda usar el Payment Sheet
            nativo de Stripe. La publishable key es pública (sí va en bundle);
            para cambiar de test a live, actualizar STRIPE_PUBLISHABLE_KEY
            en constants/index.ts y hacer un OTA (no requiere rebuild). */}
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.mx.retta.app"
        >
          <StatusBar style="light" />
          <RootLayoutNav />
          {/* Host del AppAlert global */}
          <AppAlertHost />
        </StripeProvider>
      </AuthProvider>
    </PostHogProvider>
    </GestureHandlerRootView>
  );
}

// Sentry.wrap envuelve el root para capturar errores no manejados de React.
export default Sentry.wrap(RootLayout);
