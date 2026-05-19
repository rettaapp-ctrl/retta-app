export const API_URL = 'https://retta-backend-production.up.railway.app/api';

// Supabase — anon key es público (no es secreto), pero centralizado para
// que cualquier rotación futura toque un solo lugar.
export const SUPABASE_URL      = 'https://nfdmnpkojrzqfkpdxuxb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZG1ucGtvanJ6cWZrcGR4dXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDcxNzIsImV4cCI6MjA5MTUyMzE3Mn0.TMnkFFPtI3g-jTHywrKosmIcmzvYQx5v5oaaz_FF_78';

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
