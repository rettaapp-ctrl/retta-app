// ═══════════════════════════════════════════════════════════════
// RETTA — lib/analytics.ts
// Wrapper centralizado de PostHog para no atar la app al SDK.
// Si mañana cambiamos de proveedor, es 1 archivo el que se edita.
//
// Convenciones:
//  • Eventos en snake_case y en español, prefijo por dominio.
//      auth_*       → registro, login, logout, verify
//      partido_*    → ver/inscribir/cancelar/compartir
//      amigo_*      → agregar/aceptar/invitar
//      invitado_*   → pagar/cancelar invitado
//      reporte_*    → marcador, peer-rating, reporte
//      app_*        → eventos de plataforma (abierta, error, etc.)
//  • Propiedades en snake_case también.
//  • NUNCA mandar PII (email, teléfono, nombre real). Solo user_id.
// ═══════════════════════════════════════════════════════════════
import PostHog from 'posthog-react-native';

// PostHog Project API Key (pública para mobile SDK — equivalente al DSN de Sentry).
// Si en el futuro queremos rotarla o usar diferente proyecto por entorno,
// la movemos a expo-constants.extra. Por ahora hardcoded está bien.
const POSTHOG_KEY  = 'phc_vqyzguguZYzqXveM7WjxuJFNhtnwqBbshJvheVyZk746';
const POSTHOG_HOST = 'https://us.i.posthog.com';

// Instancia singleton. Se crea en _layout.tsx vía PostHogProvider y la
// guardamos acá para que el resto de la app pueda hacer track() sin
// pasar el cliente por contexto.
let phClient: PostHog | null = null;

/**
 * Registrar la instancia creada por el provider.
 * Solo se llama desde _layout.tsx una vez al iniciar la app.
 */
export function registerAnalyticsClient(client: PostHog | null) {
  phClient = client;
}

/**
 * Track de un evento. No-op si:
 *  • Estamos en desarrollo (__DEV__ === true) → para no contaminar prod
 *  • El cliente aún no se inicializa (race condition al boot)
 */
export function track(event: string, properties?: Record<string, any>) {
  if (__DEV__) return;
  if (!phClient) return;
  try {
    phClient.capture(event, properties || {});
  } catch {}
}

/**
 * Vincular eventos a un usuario. Se llama después de login/register/verify.
 * Propiedades = solo info no sensible útil para segmentar (ciudad, nivel, etc.).
 */
export function identify(userId: string, properties?: Record<string, any>) {
  if (__DEV__) return;
  if (!phClient) return;
  try {
    phClient.identify(userId, properties || {});
  } catch {}
}

/**
 * Limpiar identidad. Se llama en logout para que los eventos anónimos
 * posteriores no sigan asociados al usuario anterior.
 */
export function resetAnalytics() {
  if (__DEV__) return;
  if (!phClient) return;
  try {
    phClient.reset();
  } catch {}
}

// Re-export constants para que _layout.tsx no tenga que conocerlos.
export const POSTHOG_CONFIG = {
  apiKey: POSTHOG_KEY,
  host:   POSTHOG_HOST,
} as const;
