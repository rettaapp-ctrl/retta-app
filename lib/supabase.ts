// ─────────────────────────────────────────────────────────────
// Cliente Supabase compartido para la app móvil.
// Todas las pantallas que necesiten Supabase Storage o queries directas
// deben importar desde aquí en lugar de crear su propio cliente.
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
