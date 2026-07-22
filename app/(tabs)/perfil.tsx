// ═══════════════════════════════════════════════════════════════
// RETTA — Perfil (rediseño 2026-07-21, aprobado por Rafael y Foco)
// Layout estilo Plei adaptado a marca Retta (Sora/Inter, violeta):
//   avatar grande sin subtítulo → Editar perfil → stats con íconos
//   (los 3 clicables: Jugados y Ganados abren /historial-partidos,
//   Amigos abre /amigos) → Posición|Nivel → RATING con gráfica de
//   evolución (rating_historial) → Racha con track de semanas.
// El historial de partidos vive en su propia pantalla.
// ═══════════════════════════════════════════════════════════════
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useNotificacionesCount } from '@/hooks/useNotificacionesCount';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, Line as SvgLine } from 'react-native-svg';

interface RatingPunto {
  rating: number;
  delta: number;
  fuente: string;
  created_at: string;
}

// Colores de fuego para la racha (aprobados en el mockup del Foco)
const FIRE1 = '#FFB45E';
const FIRE2 = '#F4603E';

// ─── Íconos ──────────────────────────────────────────────────────
function SettingsIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={DT.onBg} strokeWidth="1.8"/>
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={DT.onBg} strokeWidth="1.8"/>
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={DT.onBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={DT.onBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function EditIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={DT.onBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function BalonIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.2" stroke={DT.primary} strokeWidth="1.6"/>
      <Path d="M12 7.2l3.4 2.5-1.3 4h-4.2l-1.3-4L12 7.2z" stroke={DT.primary} strokeWidth="1.5" strokeLinejoin="round"/>
      <Path d="M12 2.8v4.4M20.8 9.4l-5.4.3M18.4 19l-3-3.3M5.6 19l3-3.3M3.2 9.4l5.4.3" stroke={DT.primary} strokeWidth="1.2"/>
    </Svg>
  );
}

function TrofeoIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path d="M7 4h10v4a5 5 0 0 1-10 0V4z" stroke={DT.primary} strokeWidth="1.6" strokeLinejoin="round"/>
      <Path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" stroke={DT.primary} strokeWidth="1.5"/>
      <Path d="M12 13v3M8.5 20h7M10 20v-2.2a2 2 0 0 1 4 0V20" stroke={DT.primary} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

function AmigosIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8.5" r="3.4" stroke={DT.primary} strokeWidth="1.6"/>
      <Path d="M2.5 19.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" stroke={DT.primary} strokeWidth="1.6" strokeLinecap="round"/>
      <Circle cx="17" cy="9.5" r="2.6" stroke={DT.primary} strokeWidth="1.5"/>
      <Path d="M16 14.3c3.1-.4 5.5 1.6 5.5 4.2" stroke={DT.primary} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}

function FlameIcon({ size = 20, color = FIRE1, filled = false }: { size?: number; color?: string; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 6 9 6 14a6 6 0 0 0 12 0c0-1.5-.5-3-1.5-4-.4 1-1.5 1.5-2.5 1-1.4-.7-1-2.6 0-4 .5-.7.5-2-1-3-1 .5-1.5 2-1 4z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}

function AvatarPlaceholder() {
  return (
    <Svg width="60" height="60" viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="18" r="9" fill={DT.outline}/>
      <Path d="M6 42C6 33.2 14.1 26 24 26C33.9 26 42 33.2 42 42" fill={DT.outline}/>
    </Svg>
  );
}

// ─── Gráfica de rating: path suavizado (Catmull-Rom → Bézier) ────
function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0].x} ${pts[0].y}`;
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

const CHART_H = 96;

// Throttle del refetch del perfil: cada focus del tab disparaba 4 requests
// (amigos, solicitudes, historial de rating y /auth/me con recálculo de
// stats). Cambiando de tab seguido eso ayudó a tirar el rate limiter global
// (issue Sentry 2026-07-21). Con 30s de TTL el focus repetido reutiliza lo
// que ya se tiene; el pull-to-refresh siempre fuerza.
const PERFIL_TTL_MS = 30_000;
let ultimoLoadPerfil = 0;

function computeChart(historial: RatingPunto[], width: number) {
  // Con 0 o 1 puntos dibujamos línea plana con el valor disponible
  const vals = historial.length >= 2
    ? historial.map(h => h.rating)
    : [historial[0]?.rating ?? 1.0, historial[0]?.rating ?? 1.0];

  const x0 = 4;
  const x1 = Math.max(x0 + 10, width - 14); // margen para el punto final
  const yTop = 10;
  const yBot = CHART_H - 8;

  let min = Math.min(...vals);
  let max = Math.max(...vals);
  // Padding del dominio; garantiza un rango mínimo para que una línea
  // plana no "haga zoom" al ruido.
  if (max - min < 0.6) {
    const mid = (max + min) / 2;
    min = mid - 0.3;
    max = mid + 0.3;
  } else {
    min -= 0.15;
    max += 0.2;
  }

  const xs = vals.map((_, i) => x0 + ((x1 - x0) * i) / (vals.length - 1));
  const ys = vals.map(v => yBot - ((v - min) / (max - min)) * (yBot - yTop));
  const pts = xs.map((x, i) => ({ x, y: ys[i] }));

  const linePath = buildSmoothPath(pts);
  const areaPath = `${linePath} L${x1.toFixed(1)} ${(yBot + 2).toFixed(1)} L${x0} ${(yBot + 2).toFixed(1)} Z`;

  return {
    linePath,
    areaPath,
    lastX: xs[xs.length - 1],
    lastY: ys[ys.length - 1],
    baseY: ys[0],
    baseVal: vals[0],
  };
}

// ─── Semanas de la racha (lunes como inicio de semana) ───────────
function mondayOf(d: Date): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // lunes = 0
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

function fechaCorta(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}

export default function PerfilScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { request } = useApi();
  const [historial, setHistorial]   = useState<RatingPunto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [amigosCount, setAmigosCount] = useState(0);
  const [solicitudesCount, setSolicitudesCount] = useState(0);
  const [chartW, setChartW]         = useState(0);
  const { count: notiCount } = useNotificacionesCount();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load(force = false) {
    if (!force && Date.now() - ultimoLoadPerfil < PERFIL_TTL_MS) {
      setRefreshing(false);
      return;
    }
    try {
      const [amigosRes, pendRes, ratingRes] = await Promise.all([
        request('/amistades').catch(() => ({ amigos: [] })),
        request('/amistades/pendientes').catch(() => ({ solicitudes: [] })),
        request('/usuarios/me/rating-historial').catch(() => ({ historial: [] })),
        refreshUser().catch(() => {}),
      ]);
      ultimoLoadPerfil = Date.now();
      setHistorial(ratingRes.historial || []);
      setAmigosCount((amigosRes.amigos || []).length);
      setSolicitudesCount((pendRes.solicitudes || []).length);
    } catch {}
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, []);

  const rating    = user?.rating ?? 1.0;
  const racha     = user?.racha_actual ?? 0;
  const rachaMax  = user?.racha_max ?? 0;
  const nivel     = user?.nivel || '—';

  // Cambio de la última semana (para el ▲/▼ junto al número)
  const haceUnaSemana = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const puntoBase = [...historial].reverse().find(h => new Date(h.created_at).getTime() <= haceUnaSemana) || historial[0];
  const deltaSemana = puntoBase ? +(rating - puntoBase.rating).toFixed(1) : 0;

  // Si aún no hay historial (endpoint caído o cuenta pre-migración sin
  // seed), dibujamos línea plana con el rating actual — nunca spinner eterno.
  const datosChart: RatingPunto[] = historial.length
    ? historial
    : [{ rating, delta: 0, fuente: 'inicial', created_at: new Date().toISOString() }];
  const chart = chartW > 0 ? computeChart(datosChart, chartW) : null;
  const primerPunto = historial[0] ? fechaCorta(new Date(historial[0].created_at)) : 'inicio';

  // Track de la racha: hasta 3 semanas recientes + "Hoy"
  const lunesActual = mondayOf(new Date());
  const semanasMostradas = Math.min(racha, 3);
  const nodosRacha = Array.from({ length: semanasMostradas }, (_, i) => {
    const lunes = new Date(lunesActual);
    lunes.setDate(lunes.getDate() - (semanasMostradas - i) * 7);
    return fechaCorta(lunes);
  });

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/configuracion')}>
              <SettingsIcon />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notificaciones')}>
              <BellIcon />
              {notiCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeTxt}>{notiCount > 9 ? '9+' : notiCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Hero: avatar grande, nombre solo, botón editar */}
          <View style={styles.hero}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {user?.avatar_url
                  ? <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 70 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                  : <AvatarPlaceholder />
                }
              </View>
            </View>
            <Text style={styles.profileName}>
              {(user?.nombre || '')} {(user?.apellido || '')}
            </Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/editar-perfil')} activeOpacity={0.75}>
              <Text style={styles.editBtnTxt}>Editar perfil</Text>
              <EditIcon />
            </TouchableOpacity>
          </View>

          {/* Stats con íconos — los 3 clicables */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCell}
              onPress={() => router.push({ pathname: '/historial-partidos', params: { filtro: 'jugados' } })}
              activeOpacity={0.6}
            >
              <BalonIcon />
              <Text style={styles.statLabel}>PARTIDOS{'\n'}JUGADOS</Text>
              <Text style={styles.statNum}>{user?.partidos_jug ?? 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCell, styles.statCellBorder]}
              onPress={() => router.push({ pathname: '/historial-partidos', params: { filtro: 'ganados' } })}
              activeOpacity={0.6}
            >
              <TrofeoIcon />
              <Text style={styles.statLabel}>PARTIDOS{'\n'}GANADOS</Text>
              <Text style={styles.statNum}>{user?.partidos_gan ?? 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCell, styles.statCellBorder]}
              onPress={() => router.push('/amigos')}
              activeOpacity={0.6}
            >
              <AmigosIcon />
              <Text style={styles.statLabel}>AMIGOS</Text>
              <Text style={styles.statNum}>{amigosCount}</Text>
              {solicitudesCount > 0 && (
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeTxt}>{solicitudesCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Posición | Nivel */}
          <View style={styles.posRow}>
            <View style={styles.posCell}>
              <Text style={styles.posLabel}>Posición:</Text>
              <Text style={styles.posVal}>{user?.posicion || '—'}</Text>
            </View>
            <View style={[styles.posCell, styles.posCellBorder]}>
              <Text style={styles.posLabel}>Nivel:</Text>
              <View style={styles.nivelPill}>
                <Text style={styles.nivelPillTxt}>{nivel}</Text>
              </View>
            </View>
          </View>

          {/* RATING — gráfica de evolución */}
          <View style={styles.ratingCard} onLayout={e => setChartW(e.nativeEvent.layout.width - 36)}>
            <View style={styles.ratingHead}>
              <Text style={styles.ratingLabel}>RATING</Text>
              <View style={styles.ratingNumRow}>
                <Text style={styles.ratingBig}>{rating.toFixed(1)}</Text>
                {deltaSemana !== 0 && (
                  <Text style={[styles.ratingDelta, { color: deltaSemana > 0 ? DT.success : DT.error }]}>
                    {deltaSemana > 0 ? '▲' : '▼'} {Math.abs(deltaSemana).toFixed(1)}
                  </Text>
                )}
              </View>
            </View>

            {chart ? (
              <Svg width={chartW} height={CHART_H} style={{ marginTop: 12 }}>
                <Defs>
                  <SvgGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={DT.primary} />
                    <Stop offset="1" stopColor={DT.primaryStrong} />
                  </SvgGradient>
                  <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={DT.primaryStrong} stopOpacity="0.30" />
                    <Stop offset="1" stopColor={DT.primaryStrong} stopOpacity="0" />
                  </SvgGradient>
                </Defs>
                {/* línea de referencia del punto de arranque */}
                <SvgLine
                  x1="4" y1={chart.baseY} x2={chartW - 4} y2={chart.baseY}
                  stroke="rgba(243,242,251,0.10)" strokeWidth="1" strokeDasharray="3 4"
                />
                <Path d={chart.areaPath} fill="url(#areaGrad)" />
                <Path d={chart.linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* punto actual */}
                <Circle cx={chart.lastX} cy={chart.lastY} r="7" fill="none" stroke="rgba(110,101,234,0.35)" strokeWidth="4" />
                <Circle cx={chart.lastX} cy={chart.lastY} r="4.5" fill="#fff" stroke={DT.primaryStrong} strokeWidth="3" />
              </Svg>
            ) : (
              <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                <ActivityIndicator color={DT.primary} />
              </View>
            )}

            <View style={styles.ratingScale}>
              <Text style={styles.ratingScaleTxt}>{primerPunto}</Text>
              <Text style={styles.ratingScaleTxt}>hoy</Text>
            </View>
            {historial.length < 2 && (
              <Text style={styles.ratingHint}>Tu gráfica se dibuja partido a partido</Text>
            )}
          </View>

          {/* RACHA — track de semanas en fuego */}
          <View style={styles.rachaCard}>
            <View style={styles.rachaTop}>
              <View style={[styles.rachaIcon, racha === 0 && styles.rachaIconOff]}>
                <FlameIcon size={26} color={racha > 0 ? FIRE1 : DT.outline} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rachaTitle, racha === 0 && { color: DT.outline }]}>RACHA</Text>
                <Text style={styles.rachaNum}>
                  {racha > 0 ? `${racha} ${racha === 1 ? 'semana' : 'semanas'}` : 'Sin racha'}
                </Text>
                <Text style={styles.rachaSub}>
                  {racha > 0
                    ? `Juega esta semana para mantenerla viva${rachaMax > 0 ? ` · Récord: ${rachaMax}` : ''}`
                    : 'Juega esta semana para empezar tu racha'}
                </Text>
              </View>
            </View>

            {racha > 0 ? (
              <View style={styles.streak}>
                {nodosRacha.map((label, i) => (
                  <React.Fragment key={label}>
                    <View style={styles.sNode}>
                      <LinearGradient colors={[FIRE1, FIRE2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sCircleDone}>
                        <FlameIcon size={18} color="#FFF3E4" filled />
                      </LinearGradient>
                      <Text style={styles.sLabel}>{i === 0 && racha > 3 ? `+${racha - 3}` : label}</Text>
                    </View>
                    <LinearGradient colors={[FIRE1, FIRE2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sLine} />
                  </React.Fragment>
                ))}
                <View style={styles.sNode}>
                  <View style={styles.sCircleNow}>
                    <FlameIcon size={18} color="rgba(255,180,94,0.6)" />
                  </View>
                  <Text style={[styles.sLabel, styles.sLabelNow]}>Hoy</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => router.push('/(tabs)/partidos')} activeOpacity={0.85}>
                <LinearGradient colors={[FIRE1, FIRE2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaFire}>
                  <FlameIcon size={16} color="#FFF7EF" filled />
                  <Text style={styles.ctaFireTxt}>BUSCAR PARTIDO</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: DT.bg },
  scroll:         { padding: SPACING.gutter, paddingBottom: 40 },
  // Idéntico paddingTop/Bottom que partidos.tsx y reservas.tsx para que la
  // campana quede alineada al pixel exacto al cambiar de tab.
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingBottom: 14 },
  iconBtn:        { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, position: 'relative' },
  bellBadge:      { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: DT.error, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: DT.bg },
  bellBadgeTxt:   { fontSize: 9, color: '#5a0006', fontFamily: FONTS.bodyBold, lineHeight: 12 },

  hero:           { alignItems: 'center', paddingVertical: 14 },
  avatarRing:     { width: 148, height: 148, borderRadius: 74, padding: 5, borderWidth: 3, borderColor: DT.primaryStrong, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: DT.primaryContainer, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  avatarInner:    { width: '100%', height: '100%', borderRadius: 70, backgroundColor: DT.surfaceHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileName:    { fontSize: 27, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, lineHeight: 32, textAlign: 'center' },
  editBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, paddingHorizontal: 22, paddingVertical: 11, borderRadius: RADIUS.full, backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorderStrong },
  editBtnTxt:     { fontSize: 13, color: DT.onBg, fontFamily: FONTS.monoMed, letterSpacing: 0.3 },

  statsRow:       { flexDirection: 'row', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
  statCell:       { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 6, gap: 7 },
  statCellBorder: { borderLeftWidth: 1, borderColor: DT.glassBorder },
  statBadge:      { position: 'absolute', top: 8, right: 10, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: DT.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  statBadgeTxt:   { fontSize: 11, color: '#5a0006', fontFamily: FONTS.bodyBold },
  statNum:        { fontSize: 25, color: DT.onBg, fontFamily: FONTS.display, lineHeight: 28 },
  statLabel:      { fontSize: 9, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 13, fontFamily: FONTS.mono, letterSpacing: 0.8, minHeight: 26 },

  posRow:         { flexDirection: 'row', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 12 },
  posCell:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 8 },
  posCellBorder:  { borderLeftWidth: 1, borderColor: DT.glassBorder },
  posLabel:       { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  posVal:         { fontSize: 15, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  nivelPill:      { backgroundColor: 'rgba(110,101,234,0.28)', borderWidth: 1, borderColor: 'rgba(173,168,245,0.4)', borderRadius: RADIUS.full, paddingHorizontal: 13, paddingVertical: 4 },
  nivelPillTxt:   { fontSize: 12.5, color: DT.primary, fontFamily: FONTS.bodyMed },

  ratingCard:     { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 18, paddingBottom: 14, marginBottom: 12 },
  ratingHead:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  ratingLabel:    { fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.6, color: DT.primary, marginBottom: 6 },
  ratingNumRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  ratingBig:      { fontSize: 30, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, lineHeight: 32 },
  ratingDelta:    { fontSize: 11.5, fontFamily: FONTS.bodyBold },
  ratingScale:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  ratingScaleTxt: { fontSize: 10, color: DT.outline, fontFamily: FONTS.body },
  ratingHint:     { fontSize: 11, color: DT.outline, fontFamily: FONTS.body, textAlign: 'center', marginTop: 8 },

  rachaCard:      { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 18, marginBottom: 12, gap: 18 },
  rachaTop:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rachaIcon:      { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(244,96,62,0.16)', alignItems: 'center', justifyContent: 'center' },
  rachaIconOff:   { backgroundColor: 'rgba(243,242,251,0.06)' },
  rachaTitle:     { fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.6, color: FIRE1 },
  rachaNum:       { fontSize: 21, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.3, marginTop: 3 },
  rachaSub:       { fontSize: 11.5, color: DT.outline, marginTop: 3, fontFamily: FONTS.body },

  streak:         { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 2 },
  sNode:          { alignItems: 'center', gap: 7 },
  sCircleDone:    { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: FIRE2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 4 },
  sCircleNow:     { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244,96,62,0.07)', borderWidth: 1.5, borderColor: 'rgba(255,180,94,0.55)', borderStyle: 'dashed' },
  sLine:          { flex: 1, height: 3, borderRadius: 2, marginTop: 20 },
  sLabel:         { fontSize: 10, color: DT.onSurfaceVar, fontFamily: FONTS.body, letterSpacing: 0.3 },
  sLabelNow:      { color: FIRE1, fontFamily: FONTS.bodyMed },
  ctaFire:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 14, borderRadius: RADIUS.full },
  ctaFireTxt:     { fontSize: 13, color: '#FFF7EF', fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },

});
