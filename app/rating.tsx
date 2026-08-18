// ═══════════════════════════════════════════════════════════════
// RETTA — app/rating.tsx
// Pantalla de rating (2026-07-22): se abre al tocar la gráfica del
// perfil (propio o público). Muestra la gráfica AMPLIADA con la misma
// curva del perfil + la explicación del sistema de nivel v2:
//   escala 1-10, calibración oculta de 3 partidos, Elo por resultado,
//   goles (próximamente) y estrellas de compañeros.
// Sin params → tu propio rating. Con ?usuario_id → el de otro jugador.
// ═══════════════════════════════════════════════════════════════
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { RatingChart, RatingPunto, CALIB_PARTIDOS, nivelDeRating, FIRE1 } from '@/components/PerfilBloques';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import BalonIcon from '@/components/BalonIcon';

const CHART_AMPLIADA_H = 210;

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// El balón de SISTEMA DE NIVEL RETTA es el mismo del perfil
// (Rafael 2026-08-07): un solo balón en toda la app.

function fechaCorta(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}

// ─── Desglose del historial ──────────────────────────────────────
// Título, subtítulo e icono de cada movimiento del rating. La info
// del partido llega enriquecida desde el backend (complejo, cancha,
// marcador); si no viene, cae a textos genéricos.
function infoMovimiento(h: RatingPunto) {
  const f = new Date(h.created_at);
  const fecha = f.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
  if (h.fuente === 'inicial') {
    return { titulo: 'Punto de partida', sub: `${fecha} · todos arrancan en 5.0`, tipo: 'inicio' as const };
  }
  const pj = h.partidos;
  const lugar = pj?.complejos?.nombre
    ? `${pj.complejos.nombre}${pj.canchas?.nombre ? ` · ${pj.canchas.nombre}` : ''}`
    : null;
  const marcador = (pj && typeof pj.goles_a === 'number' && typeof pj.goles_b === 'number')
    ? ` · ${pj.goles_a}–${pj.goles_b}` : '';
  if (h.fuente === 'calificacion') {
    return {
      titulo: 'Calificación de compañeros',
      sub: lugar ? `${fecha} · ${lugar}` : `${fecha} · estrellas al final del partido`,
      tipo: 'estrellas' as const,
    };
  }
  return {
    titulo: lugar || 'Partido',
    sub: `${fecha}${marcador}`,
    tipo: 'partido' as const,
  };
}

function EstrellaIcon() {
  return (
    <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3z" stroke={DT.primary} strokeWidth="1.6" strokeLinejoin="round"/>
    </Svg>
  );
}
function BanderaIcon() {
  return (
    <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <Path d="M5 21V4M5 4h13l-2.5 4L18 12H5" stroke={DT.primary} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function RatingScreen() {
  const { usuario_id, nombre } = useLocalSearchParams<{ usuario_id?: string; nombre?: string }>();
  const { user } = useAuth();
  const { request } = useApi();
  const router = useRouter();

  const esOtro = !!usuario_id && usuario_id !== user?.id;

  const [loading, setLoading]     = useState(true);
  const [historial, setHistorial] = useState<RatingPunto[]>([]);
  const [rating, setRating]       = useState(5.0);
  const [calibrando, setCalibrando] = useState(false);
  const [partidosCalib, setPartidosCalib] = useState(0);
  const [chartW, setChartW]       = useState(0);
  const [selIdx, setSelIdx]       = useState<number | null>(null);

  useEffect(() => { setSelIdx(null); load(); }, [usuario_id]);

  async function load() {
    setLoading(true);
    try {
      if (esOtro) {
        const p = await request(`/usuarios/${usuario_id}/perfil`);
        setHistorial(p.rating_historial || []);
        setRating(p.rating ?? 5.0);
        setCalibrando(p.rating_calibrando ?? false);
        setPartidosCalib(p.partidos_calibracion ?? 0);
      } else {
        const h = await request('/usuarios/me/rating-historial').catch(() => ({ historial: [] }));
        setHistorial(h.historial || []);
        setRating(user?.rating ?? 5.0);
        setCalibrando(user?.rating_calibrando ?? false);
        setPartidosCalib(user?.partidos_calibracion ?? 0);
      }
    } catch {}
    setLoading(false);
  }

  // Cambio de la última semana (mismo cálculo que la card del perfil)
  const haceUnaSemana = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const puntoBase = [...historial].reverse().find(h => new Date(h.created_at).getTime() <= haceUnaSemana) || historial[0];
  const deltaSemana = puntoBase ? +(rating - puntoBase.rating).toFixed(1) : 0;

  const datosChart: RatingPunto[] = historial.length
    ? historial
    : [{ rating, delta: 0, fuente: 'inicial', created_at: new Date().toISOString() }];
  const primerPunto = historial[0] ? fechaCorta(new Date(historial[0].created_at)) : 'inicio';

  return (
    <View style={st.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Topbar estándar */}
        <View style={st.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={st.topbarTitle}>Rating</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator color={DT.primary} size="large" />
            </View>
          ) : (
            <View style={st.heroCard} onLayout={e => setChartW(e.nativeEvent.layout.width - 36)}>
              {esOtro && !!nombre && <Text style={st.heroNombre}>{nombre}</Text>}

              {calibrando ? (
                <View style={st.calibHero}>
                  <Text style={st.calibHeroTitle}>Calibrando · {Math.min(partidosCalib, CALIB_PARTIDOS)}/{CALIB_PARTIDOS}</Text>
                  <Text style={st.calibHeroSub}>
                    {esOtro
                      ? 'Este jugador aún está en sus primeros 3 partidos. Su rating se revela al cerrar el 3°.'
                      : 'Vas en tus primeros 3 partidos. Tu rating se revela al cerrar el 3°.'}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={st.heroTop}>
                    <View>
                      <Text style={st.heroLabel}>RATING ACTUAL</Text>
                      <View style={st.nivelPillMini}>
                        <Text style={st.nivelPillMiniTxt}>{nivelDeRating(rating)}</Text>
                      </View>
                    </View>
                    <View style={st.heroNumRow}>
                      <Text style={st.heroBig}>{rating.toFixed(1)}</Text>
                      {deltaSemana !== 0 && (
                        <Text style={[st.heroDelta, { color: deltaSemana > 0 ? DT.success : DT.error }]}>
                          {deltaSemana > 0 ? '▲' : '▼'} {Math.abs(deltaSemana).toFixed(1)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {chartW > 0 && (
                    <View style={{ marginTop: 16 }}>
                      <RatingChart
                        historial={datosChart}
                        width={chartW}
                        height={CHART_AMPLIADA_H}
                        strokeWidth={2.5}
                        selected={selIdx}
                        onSelect={setSelIdx}
                      />
                    </View>
                  )}
                  <View style={st.heroScale}>
                    <Text style={st.heroScaleTxt}>{primerPunto}</Text>
                    <Text style={st.heroScaleTxt}>hoy</Text>
                  </View>

                  {/* Detalle del punto tocado en la gráfica */}
                  {selIdx != null && datosChart[selIdx] ? (() => {
                    const h = datosChart[selIdx];
                    const inf = infoMovimiento(h);
                    return (
                      <View style={st.selBar}>
                        <View style={{ flex: 1 }}>
                          <Text style={st.selTitulo} numberOfLines={1}>{inf.titulo}</Text>
                          <Text style={st.selSub} numberOfLines={1}>{inf.sub}</Text>
                        </View>
                        {h.delta !== 0 && (
                          <Text style={[st.selDelta, { color: h.delta > 0 ? DT.success : DT.error }]}>
                            {h.delta > 0 ? '+' : ''}{h.delta.toFixed(2)}
                          </Text>
                        )}
                        <Text style={st.selRating}>{h.rating.toFixed(2)}</Text>
                      </View>
                    );
                  })() : (
                    historial.length > 1 && <Text style={st.selHint}>Toca la gráfica para ver cada movimiento</Text>
                  )}
                </>
              )}
            </View>
          )}

          {/* ─── Desglose: cuánto sumó cada partido ─────────────── */}
          {!loading && !calibrando && historial.length > 1 && (
            <>
              <View style={st.sectionHead}>
                <Text style={st.sectionTitle}>DESGLOSE · MOVIMIENTO POR MOVIMIENTO</Text>
              </View>
              <View style={st.desgloseCard}>
                {[...historial].map((h, i) => ({ h, i })).reverse().map(({ h, i }, k, arr) => {
                  const inf = infoMovimiento(h);
                  const activo = selIdx === i;
                  const esUltimaFila = k === arr.length - 1;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[st.movRow, esUltimaFila && { borderBottomWidth: 0 }, activo && st.movRowActiva]}
                      activeOpacity={0.7}
                      onPress={() => setSelIdx(activo ? null : i)}
                    >
                      <View style={st.movIcono}>
                        {inf.tipo === 'partido' ? <BalonIcon size={15} /> : inf.tipo === 'estrellas' ? <EstrellaIcon /> : <BanderaIcon />}
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={st.movTitulo} numberOfLines={1}>{inf.titulo}</Text>
                        <Text style={st.movSub} numberOfLines={1}>{inf.sub}</Text>
                      </View>
                      {h.delta !== 0 ? (
                        <View style={[st.movDeltaChip, { backgroundColor: h.delta > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(255,138,115,0.12)' }]}>
                          <Text style={[st.movDeltaTxt, { color: h.delta > 0 ? DT.success : DT.error }]}>
                            {h.delta > 0 ? '+' : ''}{h.delta.toFixed(2)}
                          </Text>
                        </View>
                      ) : (
                        <View style={st.movDeltaChip}>
                          <Text style={[st.movDeltaTxt, { color: DT.onSurfaceVar }]}>{h.fuente === 'inicial' ? '5.0' : '0.00'}</Text>
                        </View>
                      )}
                      <Text style={st.movRating}>{h.rating.toFixed(2)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={st.desgloseHint}>
                El número de la derecha es el rating con el que quedó después de ese movimiento.
              </Text>
            </>
          )}

          {/* ─── Sistema de nivel Retta ─────────────────────────── */}
          <View style={st.sectionHead}>
            <BalonIcon size={18} />
            <Text style={st.sectionTitle}>SISTEMA DE NIVEL RETTA</Text>
          </View>

          {/* Copy SIMPLE (Rafael 2026-08-02): cero tecnicismos — nada de
              "Elo", cifras de deltas, ni la palabra "calibración" a secas.
              Tampoco cifras internas (5.0 inicial, zona 3-7). Los goles se
              presentan como parte normal del sistema (sin "próximamente"). */}
          <View style={st.card}>
            <Text style={st.cardTitle}>Tu nivel va del 1 al 10</Text>
            <Text style={st.cardBody}>
              Es un número que refleja cómo juegas, y se mueve partido a partido.
            </Text>
            <View style={st.escala}>
              <LinearGradient
                colors={[DT.primary, DT.primaryStrong]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={st.escalaTrack}
              />
              <View style={st.escalaLabels}>
                <Text style={[st.escalaNum, { left: '0%' }]}>1</Text>
                <Text style={[st.escalaNum, { right: 0 }]}>10</Text>
              </View>
            </View>
          </View>

          <View style={st.card}>
            <View style={st.cardTitleRow}>
              <Text style={st.cardTitle}>Tus primeros 3 partidos</Text>
            </View>
            <Text style={st.cardBody}>
              Retta te va midiendo con tus resultados. Al terminar el tercer partido,
              te asigna tu nivel.
            </Text>
          </View>

          <View style={st.card}>
            <Text style={st.cardTitle}>¿Cómo sube y baja?</Text>

            <View style={st.via}>
              <View style={st.viaBadge}><Text style={st.viaBadgeTxt}>1</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.viaTitle}>Ganar o perder — lo que más pesa</Text>
                <Text style={st.viaBody}>
                  Si tu equipo gana, subes; si pierde, bajas. Ganarle a un equipo
                  mejor sube más, y ganar jugando con uno menos vale doble.
                </Text>
              </View>
            </View>

            <View style={st.via}>
              <View style={st.viaBadge}><Text style={st.viaBadgeTxt}>2</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.viaTitle}>Tus goles</Text>
                <Text style={st.viaBody}>Meter gol te da un empujón extra. Los goles solo suman, nunca restan.</Text>
              </View>
            </View>

            <View style={[st.via, { marginBottom: 0 }]}>
              <View style={st.viaBadge}><Text style={st.viaBadgeTxt}>3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.viaTitle}>Las estrellas de tus compañeros</Text>
                <Text style={st.viaBody}>
                  Al final del partido tus compañeros te califican en anónimo:
                  buenas estrellas suman un poquito, malas restan.
                </Text>
              </View>
            </View>
          </View>

          <View style={st.reglaCard}>
            <Text style={st.reglaTxt}>
              Lo que más mueve tu nivel siempre es ganar.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DT.bg },

  topbar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.gutter, paddingVertical: 14 },
  backBtn:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  topbarTitle:  { fontSize: 16, color: DT.onBg, letterSpacing: 0.3, fontFamily: FONTS.heading },

  scroll:       { paddingHorizontal: SPACING.gutter, paddingBottom: 40 },

  heroCard:     { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 18, marginBottom: 22 },
  heroNombre:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.bodyMed, marginBottom: 10 },
  heroTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLabel:    { fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.6, color: DT.primary },
  heroNumRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  heroBig:      { fontSize: 44, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -1, lineHeight: 48 },
  heroDelta:    { fontSize: 12.5, fontFamily: FONTS.bodyBold },
  heroScale:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  heroScaleTxt: { fontSize: 10, color: DT.outline, fontFamily: FONTS.body },
  nivelPillMini:    { alignSelf: 'flex-start', backgroundColor: 'rgba(110,101,234,0.28)', borderWidth: 1, borderColor: 'rgba(173,168,245,0.4)', borderRadius: RADIUS.full, paddingHorizontal: 11, paddingVertical: 3, marginTop: 7 },
  nivelPillMiniTxt: { fontSize: 11.5, color: DT.primary, fontFamily: FONTS.bodyMed },

  calibHero:      { alignItems: 'center', paddingVertical: 18, gap: 8 },
  calibHeroTitle: { fontSize: 20, color: FIRE1, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  calibHeroSub:   { fontSize: 12.5, color: DT.onSurfaceVar, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 19, paddingHorizontal: 10 },

  sectionHead:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1.8, color: DT.primary },

  card:         { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 18, marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle:    { fontSize: 15.5, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.2, marginBottom: 7 },
  cardBody:     { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body, lineHeight: 20 },

  escala:       { marginTop: 14 },
  escalaTrack:  { height: 8, borderRadius: 4, opacity: 0.9 },
  escalaLabels: { height: 16, marginTop: 6 },
  escalaNum:    { position: 'absolute', fontSize: 10.5, color: DT.onSurfaceVar, fontFamily: FONTS.mono },

  via:          { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 2 },
  viaBadge:     { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(110,101,234,0.28)', borderWidth: 1, borderColor: 'rgba(173,168,245,0.4)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  viaBadgeTxt:  { fontSize: 12.5, color: DT.primary, fontFamily: FONTS.bodyBold },
  viaTitle:     { fontSize: 13.5, color: DT.onBg, fontFamily: FONTS.bodyBold, marginBottom: 3 },
  viaBody:      { fontSize: 12.5, color: DT.onSurfaceVar, fontFamily: FONTS.body, lineHeight: 19 },

  selBar:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: 'rgba(110,101,234,0.10)', borderWidth: 1, borderColor: 'rgba(173,168,245,0.3)', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 9 },
  selTitulo:    { fontSize: 12.5, color: DT.onBg, fontFamily: FONTS.bodySemi },
  selSub:       { fontSize: 11, color: DT.onSurfaceVar, fontFamily: FONTS.body, marginTop: 1 },
  selDelta:     { fontSize: 13, fontFamily: FONTS.bodyBold },
  selRating:    { fontSize: 13, color: DT.onBg, fontFamily: FONTS.display },
  selHint:      { fontSize: 10.5, color: DT.outline, fontFamily: FONTS.body, textAlign: 'center', marginTop: 10 },

  desgloseCard: { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 8 },
  movRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: DT.glassBorder, gap: 10 },
  movRowActiva: { backgroundColor: 'rgba(110,101,234,0.10)' },
  movIcono:     { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(110,101,234,0.14)', alignItems: 'center', justifyContent: 'center' },
  movTitulo:    { fontSize: 12.5, color: DT.onBg, fontFamily: FONTS.bodyMed },
  movSub:       { fontSize: 10.5, color: DT.onSurfaceVar, fontFamily: FONTS.body, marginTop: 1 },
  movDeltaChip: { minWidth: 52, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  movDeltaTxt:  { fontSize: 11.5, fontFamily: FONTS.bodyBold },
  movRating:    { fontSize: 12, color: DT.onSurfaceVar, fontFamily: FONTS.mono, minWidth: 34, textAlign: 'right' },
  desgloseHint: { fontSize: 10.5, color: DT.outline, fontFamily: FONTS.body, textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },

  reglaCard:    { backgroundColor: 'rgba(110,101,234,0.12)', borderWidth: 1, borderColor: 'rgba(173,168,245,0.3)', borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  reglaTxt:     { fontSize: 13, color: DT.primary, fontFamily: FONTS.bodyMed, textAlign: 'center', lineHeight: 19 },
});
