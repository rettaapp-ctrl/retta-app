import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants';
import * as Sentry from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';
import { TUTORIAL_SEEN_KEY } from './tutorial';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { POSTHOG_CONFIG, registerAnalyticsClient } from '@/lib/analytics';

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
    const inAuthGroup  = segments[0] === '(auth)';
    const inOnboarding = segments[1] === 'onboarding-perfil';
    const inTutorial   = segments[0] === 'tutorial';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }
    if (user && user.onboarding_completo === false && !inOnboarding) {
      router.replace('/(auth)/onboarding-perfil');
      return;
    }
    // Después de onboarding-perfil pero antes de tabs: mostrar tutorial 1 vez
    if (user && user.onboarding_completo !== false && !tutorialSeen && !inTutorial) {
      router.replace('/tutorial');
      return;
    }
    if (user && user.onboarding_completo !== false && tutorialSeen && inAuthGroup) {
      router.replace('/(tabs)/partidos');
    }
  }, [user, loading, tutorialSeen, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tutorial"     options={{ animation: 'fade' }} />
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
  return (
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
        <StatusBar style="light" />
        <RootLayoutNav />
      </AuthProvider>
    </PostHogProvider>
  );
}

// Sentry.wrap envuelve el root para capturar errores no manejados de React.
export default Sentry.wrap(RootLayout);
