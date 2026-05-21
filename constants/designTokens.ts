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
  // ── Superficies (de más oscuro a más claro) ──
  bg:            '#11131b',  // fondo principal
  surfaceLowest: '#0c0e16',  // bottom nav, lo más oscuro
  surfaceLow:    '#191b24',
  surface:       '#1d1f28',
  surfaceHigh:   '#282a33',
  surfaceHighest:'#32343e',

  // ── Acentos índigo / lavanda ──
  primary:        '#bec2ff',  // lavanda claro — texto de acento, iconos activos
  primaryContainer:'#505ce6', // índigo — botones, gradientes
  inversePrimary: '#414cd7',  // índigo profundo
  secondary:      '#bbc3ff',

  // ── Texto ──
  onBg:           '#e1e1ee',  // texto principal (casi blanco)
  onSurfaceVar:   '#c6c5d7',  // texto secundario (lavanda-gris)
  outline:        '#908fa0',  // texto terciario / deshabilitado
  outlineVariant: '#454654',  // bordes sutiles, divisores

  // ── Semánticos ──
  error:          '#ffb4ab',
  success:        '#9FE1CB',
  warning:        '#FAC775',

  // ── Glassmorphism ──
  glassBg:        'rgba(13,16,28,0.55)',
  glassBorder:    'rgba(255,255,255,0.08)',
  glassBorderStrong: 'rgba(255,255,255,0.20)',

  // ── Overlays sobre imágenes ──
  imgOverlay:     'rgba(17,19,27,0.6)',
  chipBg:         'rgba(0,0,0,0.4)',
} as const;

// Gradientes (arrays de colores para expo-linear-gradient)
export const GRADIENTS = {
  // Fondo de pantalla: glow índigo arriba que se desvanece a oscuro
  pageBg:    ['rgba(80,92,230,0.40)', '#11131b', '#11131b'] as const,
  // Botón principal "Unirse a Retta"
  button:    ['#2a44e3', '#4b39ef', '#70a3ff'] as const,
  // Pill del día activo (HOY)
  dayActive: ['#404bd7', '#505ce6'] as const,
  // Barra de progreso de cupo
  progress:  ['#505ce6', '#ced3ff'] as const,
  // Texto de acento (para títulos con gradiente vía MaskedView si se usa)
  text:      ['#bec2ff', '#505ce6'] as const,
} as const;

// Tipografía — nombres de las fuentes cargadas en _layout.tsx
export const FONTS = {
  display:   'SpaceGrotesk_700Bold',     // títulos grandes
  displayMed:'SpaceGrotesk_500Medium',
  heading:   'SpaceGrotesk_700Bold',     // headlines de cards
  body:      'Inter_400Regular',         // texto corrido
  bodyMed:   'Inter_500Medium',
  bodyBold:  'Inter_700Bold',
  mono:      'JetBrainsMono_400Regular', // labels técnicos, stats, horas
  monoMed:   'JetBrainsMono_500Medium',
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
