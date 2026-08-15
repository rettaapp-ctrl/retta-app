// ═══════════════════════════════════════════════════════════════
// RETTA — components/PerfilBloques.tsx
// Bloques compartidos del diseño de perfil (2026-07-21), usados por
// el perfil PROPIO (app/(tabs)/perfil.tsx) y el PÚBLICO
// (app/usuario/[id].tsx) para que se vean idénticos:
//   • StatsRow      — jugados / ganados / amigos con íconos
//                     (clicables solo si se pasa handler)
//   • PosNivelRow   — Posición: XXX | Nivel: [pill]
//   • RatingCard    — número grande + gráfica de evolución
//   • RachaCard     — flama + track de semanas en fuego
// ═══════════════════════════════════════════════════════════════
import { DT, FONTS, RADIUS } from '@/constants/designTokens';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BalonIcon from '@/components/BalonIcon';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, Line as SvgLine } from 'react-native-svg';

export interface RatingPunto {
  rating: number;
  delta: number;
  fuente: string;
  created_at: string;
}

// ─── Sistema de rating v2 (escala 1-10) ──────────────────────────
// El nivel YA NO se declara en el onboarding: se deriva del rating
// que calcula el sistema (Elo + estrellas) después de la calibración.
export const CALIB_PARTIDOS = 3;

export function nivelDeRating(rating: number): string {
  if (rating < 4.5) return 'Principiante';
  if (rating < 6.5) return 'Intermedio';
  return 'Avanzado';
}

// Colores de fuego para la racha (mockup aprobado del Foco)
export const FIRE1 = '#FFB45E';
export const FIRE2 = '#F4603E';

// ─── Íconos ──────────────────────────────────────────────────────
// El balón vive en components/BalonIcon.tsx — es EL balón de toda la
// app (Rafael 2026-08-07). Aquí solo se importa.

function TrofeoIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path d="M7 4h10v4a5 5 0 0 1-10 0V4z" stroke={DT.primary} strokeWidth="1.6" strokeLinejoin="round"/>
      <Path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" stroke={DT.primary} strokeWidth="1.5"/>
      <Path d="M12 13v3M8.5 20h7M10 20v-2.2a2 2 0 0 1 4 0V20" stroke={DT.primary} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

// Cancha con portería al centro (Rafael 2026-08-15): icono de
// PARTIDOS JUGADOS. El balón pasó a la celda de GOLES.
function CanchaIcon() {
  return <MaterialCommunityIcons name="soccer-field" size={26} color={DT.primary} />;
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

export function FlameIcon({ size = 20, color = FIRE1, filled = false }: { size?: number; color?: string; filled?: boolean }) {
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

// ─── Gráfica: path suavizado (Catmull-Rom → Bézier) ──────────────
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

function computeChart(historial: RatingPunto[], width: number, height: number = CHART_H) {
  const vals = historial.length >= 2
    ? historial.map(h => h.rating)
    : [historial[0]?.rating ?? 5.0, historial[0]?.rating ?? 5.0];

  const x0 = 4;
  const x1 = Math.max(x0 + 10, width - 14);
  const yTop = 10;
  const yBot = height - 8;

  let min = Math.min(...vals);
  let max = Math.max(...vals);
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

  return { linePath, areaPath, lastX: xs[xs.length - 1], lastY: ys[ys.length - 1], baseY: ys[0] };
}

function fechaCorta(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}

function mondayOf(d: Date): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // lunes = 0
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

// ═══ StatsRow ════════════════════════════════════════════════════
export function StatsRow({
  jugados, ganados, goles,
  onJugados, onGanados, onGoles,
}: {
  jugados: number; ganados: number; goles: number;
  onJugados?: () => void; onGanados?: () => void; onGoles?: () => void;
}) {
  return (
    <View style={s.statsRow}>
      <TouchableOpacity style={s.statCell} onPress={onJugados} disabled={!onJugados} activeOpacity={0.6}>
        <CanchaIcon />
        <Text style={s.statLabel}>PARTIDOS{'\n'}JUGADOS</Text>
        <Text style={s.statNum}>{jugados}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.statCell, s.statCellBorder]} onPress={onGanados} disabled={!onGanados} activeOpacity={0.6}>
        <TrofeoIcon />
        <Text style={s.statLabel}>GANADOS</Text>
        <Text style={s.statNum}>{ganados}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.statCell, s.statCellBorder]} onPress={onGoles} disabled={!onGoles} activeOpacity={0.6}>
        <BalonIcon />
        <Text style={s.statLabel}>GOLES</Text>
        <Text style={s.statNum}>{goles}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Chip de amigos: vive junto a "Editar perfil" (rediseño 2026-08-14).
// El badge naranja son solicitudes pendientes.
export function AmigosChip({ count, badge = 0, onPress }: { count: number; badge?: number; onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.amigosChip} onPress={onPress} disabled={!onPress} activeOpacity={0.75}>
      <AmigosIcon />
      <Text style={s.amigosChipTxt}>{count} {count === 1 ? 'amigo' : 'amigos'}</Text>
      {badge > 0 && (
        <View style={s.statBadge}>
          <Text style={s.statBadgeTxt}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ═══ PosNivelRow ═════════════════════════════════════════════════
// El nivel se DERIVA del rating (sistema v2). Durante la calibración
// (primeros 3 partidos) el pill dice "Calibrando" en tono fuego.
export function PosNivelRow({
  posicion, rating, calibrando = false,
}: {
  posicion?: string | null; rating?: number | null; calibrando?: boolean;
}) {
  const nivel = calibrando ? null : nivelDeRating(rating ?? 5.0);
  return (
    <View style={s.posRow}>
      <View style={s.posCell}>
        <Text style={s.posLabel}>Posición:</Text>
        <Text style={s.posVal}>{posicion || '—'}</Text>
      </View>
      <View style={[s.posCell, s.posCellBorder]}>
        <Text style={s.posLabel}>Nivel:</Text>
        <View style={[s.nivelPill, calibrando && s.nivelPillCalib]}>
          <Text style={[s.nivelPillTxt, calibrando && s.nivelPillTxtCalib]}>
            {calibrando ? 'Calibrando' : nivel}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ═══ RatingChart ═════════════════════════════════════════════════
// La gráfica sola (línea suavizada + área). Exportada para que la
// pantalla /rating la dibuje ampliada con la MISMA curva del perfil.
export function RatingChart({
  historial, width, height = CHART_H, strokeWidth = 2,
}: {
  historial: RatingPunto[]; width: number; height?: number; strokeWidth?: number;
}) {
  if (width <= 0) return null;
  const chart = computeChart(historial, width, height);
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="pbLineGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={DT.primary} />
          <Stop offset="1" stopColor={DT.primaryStrong} />
        </SvgGradient>
        <SvgGradient id="pbAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={DT.primaryStrong} stopOpacity="0.30" />
          <Stop offset="1" stopColor={DT.primaryStrong} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <SvgLine
        x1="4" y1={chart.baseY} x2={width - 4} y2={chart.baseY}
        stroke="rgba(243,242,251,0.10)" strokeWidth="1" strokeDasharray="3 4"
      />
      <Path d={chart.areaPath} fill="url(#pbAreaGrad)" />
      <Path d={chart.linePath} fill="none" stroke="url(#pbLineGrad)" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={chart.lastX} cy={chart.lastY} r="7" fill="none" stroke="rgba(110,101,234,0.35)" strokeWidth="4" />
      <Circle cx={chart.lastX} cy={chart.lastY} r="4.5" fill="#fff" stroke={DT.primaryStrong} strokeWidth="3" />
    </Svg>
  );
}

// ═══ RatingCard ══════════════════════════════════════════════════
// calibrando: el rating arranca OCULTO — en vez del número se muestra
// el avance de la calibración (partido X de 3), sin gráfica.
// onPress: hace la card clicable (abre /rating con la gráfica ampliada
// y la explicación del sistema).
export function RatingCard({
  rating, historial, calibrando = false, partidosCalibracion = 0, onPress,
}: {
  rating: number; historial: RatingPunto[];
  calibrando?: boolean; partidosCalibracion?: number; onPress?: () => void;
}) {
  const [chartW, setChartW] = useState(0);

  // Cambio de la última semana (▲/▼ junto al número)
  const haceUnaSemana = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const puntoBase = [...historial].reverse().find(h => new Date(h.created_at).getTime() <= haceUnaSemana) || historial[0];
  const deltaSemana = puntoBase ? +(rating - puntoBase.rating).toFixed(1) : 0;

  const datosChart: RatingPunto[] = historial.length
    ? historial
    : [{ rating, delta: 0, fuente: 'inicial', created_at: new Date().toISOString() }];
  const primerPunto = historial[0] ? fechaCorta(new Date(historial[0].created_at)) : 'inicio';

  const contenido = calibrando ? (
    <>
      <View style={s.ratingHead}>
        <Text style={s.ratingLabel}>RATING</Text>
        {onPress && <Text style={s.ratingVerMas}>¿Cómo funciona? ›</Text>}
      </View>
      <View style={s.calibWrap}>
        <View style={s.calibDots}>
          {Array.from({ length: CALIB_PARTIDOS }, (_, i) => (
            <View key={i} style={[s.calibDot, i < partidosCalibracion && s.calibDotOn]}>
              {i < partidosCalibracion && (
                <Svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12L10 17L19 8" stroke="#FFF3E4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              )}
            </View>
          ))}
        </View>
        <Text style={s.calibTitle}>Calibrando · {Math.min(partidosCalibracion, CALIB_PARTIDOS)}/{CALIB_PARTIDOS}</Text>
        <Text style={s.calibSub}>
          Tus primeros 3 partidos miden tu nivel.{'\n'}Al terminar el 3° se revela tu rating.
        </Text>
      </View>
    </>
  ) : (
    <>
      <View style={s.ratingHead}>
        <View>
          <Text style={s.ratingLabel}>RATING</Text>
          {onPress && <Text style={s.ratingVerMas}>Ver más ›</Text>}
        </View>
        <View style={s.ratingNumRow}>
          <Text style={s.ratingBig}>{rating.toFixed(1)}</Text>
          {deltaSemana !== 0 && (
            <Text style={[s.ratingDelta, { color: deltaSemana > 0 ? DT.success : DT.error }]}>
              {deltaSemana > 0 ? '▲' : '▼'} {Math.abs(deltaSemana).toFixed(1)}
            </Text>
          )}
        </View>
      </View>

      {chartW > 0 && (
        <View style={{ marginTop: 12 }}>
          <RatingChart historial={datosChart} width={chartW} />
        </View>
      )}

      <View style={s.ratingScale}>
        <Text style={s.ratingScaleTxt}>{primerPunto}</Text>
        <Text style={s.ratingScaleTxt}>hoy</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={s.ratingCard}
        onLayout={e => setChartW(e.nativeEvent.layout.width - 36)}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {contenido}
      </TouchableOpacity>
    );
  }
  return (
    <View style={s.ratingCard} onLayout={e => setChartW(e.nativeEvent.layout.width - 36)}>
      {contenido}
    </View>
  );
}

// ═══ RachaCard ═══════════════════════════════════════════════════
// onBuscarPartido: solo en el perfil propio — muestra el CTA de fuego
// cuando no hay racha. En perfil público se omite (sin CTA).
export function RachaCard({
  racha, rachaMax, onBuscarPartido,
}: {
  racha: number; rachaMax: number; onBuscarPartido?: () => void;
}) {
  const lunesActual = mondayOf(new Date());
  const semanasMostradas = Math.min(racha, 3);
  const nodosRacha = Array.from({ length: semanasMostradas }, (_, i) => {
    const lunes = new Date(lunesActual);
    lunes.setDate(lunes.getDate() - (semanasMostradas - i) * 7);
    return fechaCorta(lunes);
  });

  return (
    <View style={s.rachaCard}>
      <View style={s.rachaTop}>
        <View style={[s.rachaIcon, racha === 0 && s.rachaIconOff]}>
          <FlameIcon size={26} color={racha > 0 ? FIRE1 : DT.outline} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rachaTitle, racha === 0 && { color: DT.outline }]}>RACHA</Text>
          <Text style={s.rachaNum}>
            {racha > 0 ? `${racha} ${racha === 1 ? 'semana' : 'semanas'}` : 'Sin racha'}
          </Text>
          <Text style={s.rachaSub}>
            {racha > 0
              ? `Se mantiene jugando cada semana${rachaMax > 0 ? ` · Récord: ${rachaMax}` : ''}`
              : rachaMax > 0 ? `Récord: ${rachaMax} ${rachaMax === 1 ? 'semana' : 'semanas'}` : 'Se prende jugando una semana'}
          </Text>
        </View>
      </View>

      {racha > 0 ? (
        <View style={s.streak}>
          {nodosRacha.map((label, i) => (
            <React.Fragment key={label}>
              <View style={s.sNode}>
                <LinearGradient colors={[FIRE1, FIRE2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.sCircleDone}>
                  <FlameIcon size={18} color="#FFF3E4" filled />
                </LinearGradient>
                <Text style={s.sLabel}>{i === 0 && racha > 3 ? `+${racha - 3}` : label}</Text>
              </View>
              <LinearGradient colors={[FIRE1, FIRE2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sLine} />
            </React.Fragment>
          ))}
          <View style={s.sNode}>
            <View style={s.sCircleNow}>
              <FlameIcon size={18} color="rgba(255,180,94,0.6)" />
            </View>
            <Text style={[s.sLabel, s.sLabelNow]}>Hoy</Text>
          </View>
        </View>
      ) : onBuscarPartido ? (
        <TouchableOpacity onPress={onBuscarPartido} activeOpacity={0.85}>
          <LinearGradient colors={[FIRE1, FIRE2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ctaFire}>
            <FlameIcon size={16} color="#FFF7EF" filled />
            <Text style={s.ctaFireTxt}>BUSCAR PARTIDO</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  statsRow:       { flexDirection: 'row', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
  statCell:       { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 6, gap: 7 },
  statCellBorder: { borderLeftWidth: 1, borderColor: DT.glassBorder },
  statBadge:      { position: 'absolute', top: 8, right: 10, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: DT.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  statBadgeTxt:   { fontSize: 11, color: '#5a0006', fontFamily: FONTS.bodyBold },
  statNum:        { fontSize: 25, color: DT.onBg, fontFamily: FONTS.display, lineHeight: 28 },
  amigosChip:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 15 },
  amigosChipTxt:  { fontSize: 13.5, color: DT.onBg, fontFamily: FONTS.bodySemi },
  statLabel:      { fontSize: 9, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 13, fontFamily: FONTS.mono, letterSpacing: 0.8, minHeight: 26 },

  posRow:         { flexDirection: 'row', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 12 },
  posCell:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 8 },
  posCellBorder:  { borderLeftWidth: 1, borderColor: DT.glassBorder },
  posLabel:       { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  posVal:         { fontSize: 15, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  nivelPill:      { backgroundColor: 'rgba(110,101,234,0.28)', borderWidth: 1, borderColor: 'rgba(173,168,245,0.4)', borderRadius: RADIUS.full, paddingHorizontal: 13, paddingVertical: 4 },
  nivelPillTxt:   { fontSize: 12.5, color: DT.primary, fontFamily: FONTS.bodyMed },
  nivelPillCalib:    { backgroundColor: 'rgba(255,180,94,0.14)', borderColor: 'rgba(255,180,94,0.4)' },
  nivelPillTxtCalib: { color: FIRE1 },

  ratingCard:     { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 18, paddingBottom: 14, marginBottom: 12 },
  ratingHead:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  ratingLabel:    { fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.6, color: DT.primary, marginBottom: 6 },
  ratingNumRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  ratingBig:      { fontSize: 30, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, lineHeight: 32 },
  ratingDelta:    { fontSize: 11.5, fontFamily: FONTS.bodyBold },
  ratingScale:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  ratingScaleTxt: { fontSize: 10, color: DT.outline, fontFamily: FONTS.body },
  ratingVerMas:   { fontSize: 10.5, color: DT.onSurfaceVar, fontFamily: FONTS.body, marginTop: 3 },

  calibWrap:      { alignItems: 'center', paddingVertical: 16, gap: 10 },
  calibDots:      { flexDirection: 'row', gap: 14 },
  calibDot:       { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,180,94,0.45)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,180,94,0.05)' },
  calibDotOn:     { backgroundColor: FIRE1, borderColor: FIRE1, borderStyle: 'solid' },
  calibTitle:     { fontSize: 16, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  calibSub:       { fontSize: 11.5, color: DT.onSurfaceVar, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 17 },

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
