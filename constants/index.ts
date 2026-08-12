export const API_URL = 'https://retta-backend-production.up.railway.app/api';

// Cloudflare Worker que hospeda al chatbot "Retta IA" (Llama 3.1 8B vía Workers AI).
// Es público sin auth — el rate limiting vive del lado del Worker.
export const CHAT_URL = 'https://retta-chat.rettaapp.workers.dev';

// Token de aplicación para el Worker de chat. El Worker exige el header
// X-Retta-App-Token; la app lo manda en cada request para filtrar tráfico que
// no venga de la app. NO es un secreto de alto valor (termina en el bundle),
// solo una barrera básica anti-abuso.
//
// El valor se inyecta en build via EXPO_PUBLIC_CHAT_WORKER_TOKEN (EAS secret o
// .env local) y DEBE coincidir con el secreto APP_TOKEN del Worker de
// Cloudflare (`wrangler secret put APP_TOKEN`). Se lee de env en vez de
// hardcodearse para poder rotarlo sin tocar el código ni dejarlo en el
// historial de git. Si queda vacío, el Worker responde 401 (falla visible).
export const CHAT_WORKER_TOKEN = process.env.EXPO_PUBLIC_CHAT_WORKER_TOKEN ?? '';

// ─────────────────────────────────────────────────────────────────
// LEGAL_VERSION
// Versión actual de Términos y Aviso de Privacidad.
// CUANDO ACTUALICES el texto de terminos.tsx o privacidad.tsx, sube
// esta cadena (ej: '2026-08-15') — todos los usuarios verán la
// pantalla bloqueante /aceptar-legal en la siguiente apertura y deberán
// aceptar de nuevo para poder usar la app.
// Convención: fecha ISO de la actualización.
// ─────────────────────────────────────────────────────────────────
export const LEGAL_VERSION = '2026-08-12';

// Supabase — anon key es público (no es secreto), pero centralizado para
// que cualquier rotación futura toque un solo lugar.
export const SUPABASE_URL      = 'https://nfdmnpkojrzqfkpdxuxb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZG1ucGtvanJ6cWZrcGR4dXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDcxNzIsImV4cCI6MjA5MTUyMzE3Mn0.TMnkFFPtI3g-jTHywrKosmIcmzvYQx5v5oaaz_FF_78';

// Stripe — publishable key ES PÚBLICA (no es secreto). Sí va en el bundle.
// Empieza con "pk_test_" en test mode, "pk_live_" en producción.
// Cuando cambies a live, actualiza este valor y haz un OTA.
// PENDIENTE: Rafael debe reemplazar el placeholder con la key real de Test.
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TLF4RRw77bTNn7b4D0w1pNsOfggpLF6JPMeFLXqm7eLRDkPHOe5rIIaWcXs75jHiyZSg2rK0qZkldCKKsaDNYsY00peRNHl6U';

export const COLORS = {
  bg:          '#0A0A0A',
  surface:     '#111111',
  surface2:    '#181818',
  surface3:    '#222222',
  border:      'rgba(255,255,255,0.07)',
  border2:     'rgba(255,255,255,0.13)',
  accent:      '#7AB800',
  accentBright:'#8FCC00',
  accentDim:   'rgba(122,184,0,0.12)',
  txt:         '#F2F1EF',
  txt2:        'rgba(242,241,239,0.55)',
  txt3:        'rgba(242,241,239,0.28)',
  green:       '#2E9E50',
  red:         '#C23B2B',
  yellow:      '#C47A00',
  blue:        '#1A6DB5',
};

export const STATUS_COLORS: Record<string, string> = {
  abierto:    '#1A6DB5',
  lleno:      '#2E9E50',
  en_juego:   '#C47A00',
  finalizado: 'rgba(242,241,239,0.28)',
  cancelado:  '#C23B2B',
};

export const STATUS_LABELS: Record<string, string> = {
  abierto:    'Abierto',
  lleno:      'Lleno',
  en_juego:   'En juego',
  finalizado: 'Finalizado',
  cancelado:  'Cancelado',
};
