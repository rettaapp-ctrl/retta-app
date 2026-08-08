// ═══════════════════════════════════════════════════════════════
// RETTA — constants/designTokens.ts
//
// Tokens del REDISEÑO (rama `rediseno`). Tema dark premium con
// glassmorphism y acentos índigo/lavanda, basado en el diseño de
// Google Stitch.
//
// Estos tokens viven aparte de constants/index.ts (COLORS viejo) para
// que el rediseño sea aislable. Las pantallas rediseñadas importan de
// aquí; las que aún no se tocan siguen con el COLORS viejo.
// ═══════════════════════════════════════════════════════════════

export const DT = {
  // ── Superficies (paleta oficial del manual de marca 2026) ──
  bg:            '#0B0B14',  // Negro Retta — fondo base
  surfaceLowest: '#08080F',  // más oscuro que bg (bottom nav)
  surfaceLow:    '#14142A',  // Panel — tarjetas y superficies
  surface:       '#1A1A32',  // ligeramente más claro para overlays
  surfaceHigh:   '#22223E',
  surfaceHighest:'#2C2C4A',

  // ── Acentos violeta (marca oficial) ──
  // Primary "fuerte" para CTAs / botones grandes / marca
  primary:         '#ADA8F5',  // Lavanda — texto de acento e iconos activos
  primaryStrong:   '#6E65EA',  // Violeta Retta — el primary "real" del manual
  primaryHover:    '#8B7BFF',  // Violeta brillante — hover y énfasis
  primaryContainer:'#6E65EA',  // alias de primaryStrong para código legacy
  inversePrimary:  '#5A4DE6',  // Violeta profundo (end del degradado)
  secondary:       '#8B7BFF',

  // ── Texto (blanco hueso del manual) ──
  onBg:           '#F3F2FB',  // Blanco hueso — texto principal sobre oscuro
  onSurfaceVar:   '#C6C4E0',  // texto secundario (lavanda-gris)
  outline:        '#8785A0',  // texto terciario / deshabilitado
  outlineVariant: '#3D3D5A',  // bordes sutiles, divisores

  // ── Semánticos oficiales del manual ──
  error:          '#FF8A73',  // Coral — estados de alerta
  success:        '#34D399',  // Verde — estados confirmado
  warning:        '#FAC775',  // amarillo (no está en manual, se conserva)

  // ── Glassmorphism (ajustado al nuevo bg) ──
  glassBg:        'rgba(20,20,42,0.55)',    // panel con alpha
  glassBorder:    'rgba(243,242,251,0.08)', // blanco hueso con alpha
  glassBorderStrong: 'rgba(243,242,251,0.20)',

  // ── Overlays sobre imágenes ──
  imgOverlay:     'rgba(11,11,20,0.65)',
  chipBg:         'rgba(0,0,0,0.4)',
} as const;

// Gradientes — usan la paleta oficial del manual (violetas Retta)
export const GRADIENTS = {
  // Fondo de pantalla: glow violeta arriba que se desvanece a Negro Retta
  pageBg:    ['rgba(110,101,234,0.35)', '#0B0B14', '#0B0B14'] as const,
  // Botón principal — degradado hero oficial del manual: #8273FF → #5A4DE6
  button:    ['#8273FF', '#6E65EA', '#5A4DE6'] as const,
  // Pill del día activo (HOY)
  dayActive: ['#8B7BFF', '#6E65EA'] as const,
  // Barra de progreso de cupo — violeta a lavanda
  progress:  ['#6E65EA', '#ADA8F5'] as const,
  // Cupo cuando el partido ya alcanzó el mínimo para jugarse
  confirmado:['#34D399', '#6EE7B7'] as const,
  // Texto de acento (para títulos con gradiente vía MaskedView si se usa)
  text:      ['#ADA8F5', '#6E65EA'] as const,
} as const;

// Tipografía — según el manual de marca 2026:
//   • Sora     → títulos (SemiBold 600 / Bold 700)
//   • Inter    → cuerpo, etiquetas, datos (Regular / Medium / SemiBold)
//   • Space Grotesk → solo el logo (Bold 700) — no usar en UI
//
// FONTS.mono se mantiene con el mismo nombre por retrocompatibilidad, pero
// ahora apunta a Inter Medium (labels en mayúsculas van en Inter, no en
// JetBrains Mono). Cuando toda la app migre, se puede renombrar a "label".
export const FONTS = {
  display:   'Sora_700Bold',        // títulos grandes (H1)
  displayMed:'Sora_600SemiBold',    // títulos medianos (H2/H3)
  heading:   'Sora_600SemiBold',    // headlines de cards
  body:      'Inter_400Regular',    // texto corrido
  bodyMed:   'Inter_500Medium',
  bodySemi:  'Inter_600SemiBold',   // etiquetas que necesitan cuerpo sobre fondo oscuro
  bodyBold:  'Inter_700Bold',
  // Labels en mayúsculas — antes JetBrains Mono, ahora Inter según manual.
  mono:      'Inter_500Medium',
  monoMed:   'Inter_600SemiBold',
} as const;

// Espaciados (del diseño de Stitch)
export const SPACING = {
  xs:  4,
  sm:  12,
  base: 8,
  md:  24,
  lg:  48,
  gutter: 24,
} as const;

// Radios
export const RADIUS = {
  md:   16,
  lg:   24,
  xl:   28,   // cards (Stitch usa 3rem pero en móvil 28 se ve mejor)
  full: 9999,
} as const;
