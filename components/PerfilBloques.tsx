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
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, Line as SvgLine } from 'react-native-svg';

export interface RatingPunto {
  rating: number;
  delta: number;
  fuente: string;
  created_at: string;
}

// Colores de fuego para la racha (mockup aprobado del Foco)
export const FIRE1 = '#FFB45E';
export const FIRE2 = '#F4603E';

// ─── Íconos ──────────────────────────────────────────────────────
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

function computeChart(historial: RatingPunto[], width: number) {
  const vals = historial.length >= 2
    ? historial.map(h => h.rating)
    : [historial[0]?.rating ?? 1.0, historial[0]?.rating ?? 1.0];

  const x0 = 4;
  const x1 = Math.max(x0 + 10, width - 14);
  const yTop = 10;
  const yBot = CHART_H - 8;

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
  jugados, ganados, amigos, badge = 0,
  onJugados, onGanados, onAmigos,
}: {
  jugados: number; ganados: number; amigos: number; badge?: number;
  onJugados?: () => void; onGanados?: () => void; onAmigos?: () => void;
}) {
  return (
    <View style={s.statsRow}>
      <TouchableOpacity style={s.statCell} onPress={onJugados} disabled={!onJugados} activeOpacity={0.6}>
        <BalonIcon />
        <Text style={s.statLabel}>PARTIDOS{'\n'}JUGADOS</Text>
        <Text style={s.statNum}>{jugados}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.statCell, s.statCellBorder]} onPress={onGanados} disabled={!onGanados} activeOpacity={0.6}>
        <TrofeoIcon />
        <Text style={s.statLabel}>PARTIDOS{'\n'}GANADOS</Text>
        <Text style={s.statNum}>{ganados}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.statCell, s.statCellBorder]} onPress={onAmigos} disabled={!onAmigos} activeOpacity={0.6}>
        <AmigosIcon />
        <Text style={s.statLabel}>AMIGOS</Text>
        <Text style={s.statNum}>{amigos}</Text>
        {badge > 0 && (
          <View style={s.statBadge}>
            <Text style={s.statBadgeTxt}>{badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ═══ PosNivelRow ═════════════════════════════════════════════════
export function PosNivelRow({ posicion, nivel }: { posicion?: string | null; nivel?: string | null }) {
  return (
    <View style={s.posRow}>
      <View style={s.posCell}>
        <Text style={s.posLabel}>Posición:</Text>
        <Text style={s.posVal}>{posicion || '—'}</Text>
      </View>
      <View style={[s.posCell, s.posCellBorder]}>
        <Text style={s.posLabel}>Nivel:</Text>
        <View style={s.nivelPill}>
          <Text style={s.nivelPillTxt}>{nivel || '—'}</Text>
        </View>
      </View>
    </View>
  );
}

// ═══ RatingCard ══════════════════════════════════════════════════
export function RatingCard({ rating, historial }: { rating: number; historial: RatingPunto[] }) {
  const [chartW, setChartW] = useState(0);

  // Cambio de la última semana (▲/▼ junto al número)
  const haceUnaSemana = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const puntoBase = [...historial].reverse().find(h => new Date(h.created_at).getTime() <= haceUnaSemana) || historial[0];
  const deltaSemana = puntoBase ? +(rating - puntoBase.rating).toFixed(1) : 0;

  const datosChart: RatingPunto[] = historial.length
    ? historial
    : [{ rating, delta: 0, fuente: 'inicial', created_at: new Date().toISOString() }];
  const chart = chartW > 0 ? computeChart(datosChart, chartW) : null;
  const primerPunto = historial[0] ? fechaCorta(new Date(historial[0].created_at)) : 'inicio';

  return (
    <View style={s.ratingCard} onLayout={e => setChartW(e.nativeEvent.layout.width - 36)}>
      <View style={s.ratingHead}>
        <Text style={s.ratingLabel}>RATING</Text>
        <View style={s.ratingNumRow}>
          <Text style={s.ratingBig}>{rating.toFixed(1)}</Text>
          {deltaSemana !== 0 && (
            <Text style={[s.ratingDelta, { color: deltaSemana > 0 ? DT.success : DT.error }]}>
              {deltaSemana > 0 ? '▲' : '▼'} {Math.abs(deltaSemana).toFixed(1)}
            </Text>
          )}
        </View>
      </View>

      {chart && (
        <Svg width={chartW} height={CHART_H} style={{ marginTop: 12 }}>
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
            x1="4" y1={chart.baseY} x2={chartW - 4} y2={chart.baseY}
            stroke="rgba(243,242,251,0.10)" strokeWidth="1" strokeDasharray="3 4"
          />
          <Path d={chart.areaPath} fill="url(#pbAreaGrad)" />
          <Path d={chart.linePath} fill="none" stroke="url(#pbLineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={chart.lastX} cy={chart.lastY} r="7" fill="none" stroke="rgba(110,101,234,0.35)" strokeWidth="4" />
          <Circle cx={chart.lastX} cy={chart.lastY} r="4.5" fill="#fff" stroke={DT.primaryStrong} strokeWidth="3" />
        </Svg>
      )}

      <View style={s.ratingScale}>
        <Text style={s.ratingScaleTxt}>{primerPunto}</Text>
        <Text style={s.ratingScaleTxt}>hoy</Text>
      </View>
      {historial.length < 2 && (
        <Text style={s.ratingHint}>La gráfica se dibuja partido a partido</Text>
      )}
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
