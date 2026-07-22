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

const CHART_AMPLIADA_H = 210;

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function BalonMini() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.2" stroke={DT.primary} strokeWidth="1.6"/>
      <Path d="M12 7.2l3.4 2.5-1.3 4h-4.2l-1.3-4L12 7.2z" stroke={DT.primary} strokeWidth="1.5" strokeLinejoin="round"/>
      <Path d="M12 2.8v4.4M20.8 9.4l-5.4.3M18.4 19l-3-3.3M5.6 19l3-3.3M3.2 9.4l5.4.3" stroke={DT.primary} strokeWidth="1.2"/>
    </Svg>
  );
}

function fechaCorta(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
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

  useEffect(() => { load(); }, [usuario_id]);

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
                      <RatingChart historial={datosChart} width={chartW} height={CHART_AMPLIADA_H} strokeWidth={2.5} />
                    </View>
                  )}
                  <View style={st.heroScale}>
                    <Text style={st.heroScaleTxt}>{primerPunto}</Text>
                    <Text style={st.heroScaleTxt}>hoy</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* ─── Sistema de nivel Retta ─────────────────────────── */}
          <View style={st.sectionHead}>
            <BalonMini />
            <Text style={st.sectionTitle}>SISTEMA DE NIVEL RETTA</Text>
          </View>

          {/* La escala */}
          <View style={st.card}>
            <Text style={st.cardTitle}>Escala del 1 al 10</Text>
            <Text style={st.cardBody}>
              Tu nivel es un número entre 1 y 10. La mayoría de los jugadores queda entre 3 y 7.
            </Text>
            <View style={st.escala}>
              <View style={st.escalaTrack}>
                <View style={st.escalaZona} />
              </View>
              <View style={st.escalaLabels}>
                <Text style={[st.escalaNum, { left: '0%' }]}>1</Text>
                <Text style={[st.escalaNum, { left: '22.2%' }]}>3</Text>
                <Text style={[st.escalaNum, { left: '66.7%' }]}>7</Text>
                <Text style={[st.escalaNum, { right: 0 }]}>10</Text>
              </View>
              <Text style={st.escalaHint}>zona típica: 3 – 7</Text>
            </View>
          </View>

          {/* Calibración */}
          <View style={st.card}>
            <View style={st.cardTitleRow}>
              <Text style={st.cardTitle}>Primeros 3 partidos: calibración</Text>
            </View>
            <Text style={st.cardBody}>
              Arrancas oculto en 5.0 y el sistema te mide según tus resultados. Al cerrar el 3er
              partido te asigna tu nivel inicial, entre 3 y 7.
            </Text>
            <Text style={st.cardNota}>Ya no eliges tu nivel: se calcula jugando.</Text>
          </View>

          {/* Las 3 vías */}
          <View style={st.card}>
            <Text style={st.cardTitle}>Del partido 4 en adelante</Text>
            <Text style={st.cardBody}>Tu número se mueve por 3 vías, en orden de peso:</Text>

            <View style={st.via}>
              <View style={st.viaBadge}><Text style={st.viaBadgeTxt}>1</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.viaTitle}>Resultado — lo que más pesa</Text>
                <Text style={st.viaBody}>
                  Elo estilo ajedrez: ganarle al más fuerte paga más, y jugar incompleto (6 vs 7)
                  cuenta como hazaña — ganas más y pierdes menos.
                </Text>
                <Text style={st.viaDato}>±0.15 típico · tope ±0.4</Text>
              </View>
            </View>

            <View style={st.via}>
              <View style={st.viaBadge}><Text style={st.viaBadgeTxt}>2</Text></View>
              <View style={{ flex: 1 }}>
                <View style={st.viaTitleRow}>
                  <Text style={st.viaTitle}>Individual — solo suma</Text>
                  <View style={st.proximamente}><Text style={st.proximamenteTxt}>PRÓXIMAMENTE</Text></View>
                </View>
                <Text style={st.viaBody}>Gol +0.02, con tope +0.06 por partido (hat trick).</Text>
              </View>
            </View>

            <View style={[st.via, { marginBottom: 0 }]}>
              <View style={st.viaBadge}><Text style={st.viaBadgeTxt}>3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.viaTitle}>Estrellas de tus compañeros</Text>
                <Text style={st.viaBody}>
                  Al final del partido tus compañeros te califican de forma anónima:
                  de +0.04 (5 estrellas) a −0.07 (1 estrella).
                </Text>
              </View>
            </View>
          </View>

          {/* Regla de oro */}
          <View style={st.reglaCard}>
            <Text style={st.reglaTxt}>
              El resultado siempre manda; lo individual es ajuste fino.
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
  cardNota:     { fontSize: 12.5, color: DT.primary, fontFamily: FONTS.bodyMed, marginTop: 9 },

  escala:       { marginTop: 14 },
  escalaTrack:  { height: 8, borderRadius: 4, backgroundColor: 'rgba(243,242,251,0.08)', overflow: 'hidden' },
  escalaZona:   { position: 'absolute', left: '22.2%', width: '44.5%', top: 0, bottom: 0, backgroundColor: DT.primaryStrong, borderRadius: 4, opacity: 0.85 },
  escalaLabels: { height: 16, marginTop: 6 },
  escalaNum:    { position: 'absolute', fontSize: 10.5, color: DT.onSurfaceVar, fontFamily: FONTS.mono },
  escalaHint:   { fontSize: 10.5, color: DT.outline, fontFamily: FONTS.body, textAlign: 'center', marginTop: 8 },

  via:          { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 2 },
  viaBadge:     { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(110,101,234,0.28)', borderWidth: 1, borderColor: 'rgba(173,168,245,0.4)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  viaBadgeTxt:  { fontSize: 12.5, color: DT.primary, fontFamily: FONTS.bodyBold },
  viaTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  viaTitle:     { fontSize: 13.5, color: DT.onBg, fontFamily: FONTS.bodyBold, marginBottom: 3 },
  viaBody:      { fontSize: 12.5, color: DT.onSurfaceVar, fontFamily: FONTS.body, lineHeight: 19 },
  viaDato:      { fontSize: 11.5, color: DT.primary, fontFamily: FONTS.monoMed, marginTop: 5 },
  proximamente:    { backgroundColor: 'rgba(255,180,94,0.14)', borderWidth: 1, borderColor: 'rgba(255,180,94,0.4)', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 3 },
  proximamenteTxt: { fontSize: 8.5, color: FIRE1, fontFamily: FONTS.mono, letterSpacing: 1 },

  reglaCard:    { backgroundColor: 'rgba(110,101,234,0.12)', borderWidth: 1, borderColor: 'rgba(173,168,245,0.3)', borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  reglaTxt:     { fontSize: 13, color: DT.primary, fontFamily: FONTS.bodyMed, textAlign: 'center', lineHeight: 19 },
});
