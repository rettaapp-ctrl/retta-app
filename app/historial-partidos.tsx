// ═══════════════════════════════════════════════════════════════
// RETTA — app/historial-partidos.tsx
// Historial de partidos anteriores, abierto desde las stats del
// perfil. Dos modos vía param `filtro`:
//   'jugados' → todos los partidos anteriores. El badge de resultado
//               y el marcador SOLO aparecen si el árbitro lo reportó;
//               si no hay marcador, la fila va limpia.
//   'ganados' → únicamente los ganados (siempre con badge + marcador).
//               Vacío → "Aún no has ganado partidos".
// ═══════════════════════════════════════════════════════════════
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { useApi } from '@/hooks/useApi';
import { isPartidoVisible } from '@/lib/partidos';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import BalonIcon from '@/components/BalonIcon';

interface Inscripcion {
  id: string;
  status: string;
  equipo?: 'A' | 'B' | null;
  v_partidos: {
    id: string;
    fecha: string;
    hora_inicio: string;
    tipo: string;
    complejo_nombre: string;
    cancha_nombre: string;
    goles_a?: number | null;
    goles_b?: number | null;
    equipo_ganador?: 'A' | 'B' | 'EMPATE' | null;
  };
}

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function TrofeoGrande() {
  return (
    <Svg width="54" height="54" viewBox="0 0 24 24" fill="none">
      <Path d="M7 4h10v4a5 5 0 0 1-10 0V4z" stroke={DT.outline} strokeWidth="1.4" strokeLinejoin="round"/>
      <Path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" stroke={DT.outline} strokeWidth="1.3"/>
      <Path d="M12 13v3M8.5 20h7M10 20v-2.2a2 2 0 0 1 4 0V20" stroke={DT.outline} strokeWidth="1.4" strokeLinecap="round"/>
    </Svg>
  );
}

// Mismo balón que el resto de la app, en grande y apagado.
function BalonGrande() {
  return <BalonIcon size={54} color={DT.outline} />;
}

export default function HistorialPartidosScreen() {
  const router = useRouter();
  const { request } = useApi();
  const params = useLocalSearchParams<{ filtro?: string }>();
  const soloGanados = params.filtro === 'ganados';

  const [partidos, setPartidos]     = useState<Inscripcion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    try {
      const res = await request('/usuarios/me/partidos').catch(() => ({ partidos: [] }));
      const anteriores = (res.partidos || [])
        .filter((p: Inscripcion) => p.v_partidos != null)
        .filter((p: Inscripcion) => !isPartidoVisible(p.v_partidos.fecha, p.v_partidos.hora_inicio))
        .sort((a: Inscripcion, b: Inscripcion) => {
          const fa = `${a.v_partidos?.fecha || ''} ${a.v_partidos?.hora_inicio || ''}`;
          const fb = `${b.v_partidos?.fecha || ''} ${b.v_partidos?.hora_inicio || ''}`;
          return fb.localeCompare(fa);
        });
      setPartidos(anteriores);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  function esGanado(item: Inscripcion): boolean {
    const p = item.v_partidos;
    return !!(p && item.equipo && p.equipo_ganador && p.equipo_ganador !== 'EMPATE' && p.equipo_ganador === item.equipo);
  }

  function formatFecha(fecha: string) {
    const d = new Date(fecha + 'T00:00:00');
    return {
      dia: d.getDate().toString().padStart(2, '0'),
      mes: d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase(),
    };
  }

  const lista = soloGanados ? partidos.filter(esGanado) : partidos;

  // Resumen para el pie de la lista (que la parte de abajo no se vea vacía)
  const totalJugados  = partidos.length;
  const totalGanados  = partidos.filter(esGanado).length;
  const conMarcador   = partidos.filter(p => {
    const v = p.v_partidos;
    return v && typeof v.goles_a === 'number' && typeof v.goles_b === 'number' && v.equipo_ganador;
  }).length;
  const efectividad   = conMarcador > 0 ? Math.round((totalGanados / conMarcador) * 100) : null;

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <BackIcon />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{soloGanados ? 'Partidos ganados' : 'Partidos jugados'}</Text>
        {!loading && lista.length > 0 && (
          <Text style={styles.subtitle}>
            {lista.length} {lista.length === 1 ? 'partido' : 'partidos'}
          </Text>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color={DT.primary} style={{ marginTop: 60 }} />
          ) : lista.length === 0 ? (
            <View style={styles.empty}>
              {soloGanados ? <TrofeoGrande /> : <BalonGrande />}
              <Text style={styles.emptyTitle}>
                {soloGanados ? 'Aún no has ganado partidos' : 'Aún no has jugado partidos'}
              </Text>
              <Text style={styles.emptySub}>
                {soloGanados
                  ? 'Cuando ganes tu primer partido con marcador reportado, aparecerá aquí.'
                  : 'Únete a un partido y tu historial empezará a llenarse.'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/partidos')} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnTxt}>EXPLORAR PARTIDOS</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              {lista.map((item, i) => {
                const p = item.v_partidos;
                if (!p) return null;
                const f = formatFecha(p.fecha);
                const isLast = i === lista.length - 1;

                // Badge y marcador SOLO si el árbitro reportó el resultado.
                const tieneMarcador =
                  typeof p.goles_a === 'number' && typeof p.goles_b === 'number' && p.equipo_ganador;
                let resultado: 'GANÓ' | 'EMPATE' | 'PERDIÓ' | null = null;
                let resultColor = DT.onSurfaceVar;
                let resultBg    = 'rgba(255,255,255,0.06)';
                if (tieneMarcador && item.equipo) {
                  if (p.equipo_ganador === 'EMPATE') {
                    resultado = 'EMPATE';
                    resultColor = DT.warning;
                    resultBg    = 'rgba(250,199,117,0.12)';
                  } else if (p.equipo_ganador === item.equipo) {
                    resultado = 'GANÓ';
                    resultColor = DT.success;
                    resultBg    = 'rgba(159,225,203,0.12)';
                  } else {
                    resultado = 'PERDIÓ';
                    resultColor = DT.error;
                    resultBg    = 'rgba(255,180,171,0.10)';
                  }
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/partido/${p.id}?desde=historial`)}
                    style={[styles.matchPrev, isLast && { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.mpDate}>
                      <Text style={styles.mpDateDay}>{f.dia}</Text>
                      <Text style={styles.mpDateMes}>{f.mes}</Text>
                    </View>
                    <View style={styles.mpDivider} />
                    <View style={styles.mpInfo}>
                      <Text style={styles.mpVenue} numberOfLines={1}>{p.complejo_nombre} — {p.cancha_nombre}</Text>
                      <Text style={styles.mpDetail}>
                        {p.tipo} · {p.hora_inicio?.slice(0, 5)}
                        {tieneMarcador && (
                          <Text style={styles.mpScore}> · {p.goles_a}–{p.goles_b}</Text>
                        )}
                      </Text>
                    </View>
                    {resultado && (
                      <View style={[styles.mpResult, { backgroundColor: resultBg }]}>
                        <Text style={[styles.mpResultTxt, { color: resultColor }]}>{resultado}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Pie: resumen + CTA para que el final de la lista no quede vacío */}
          {!loading && lista.length > 0 && (
            <>
              <View style={styles.resumen}>
                <View style={styles.resumenCell}>
                  <Text style={styles.resumenNum}>{totalJugados}</Text>
                  <Text style={styles.resumenLabel}>JUGADOS</Text>
                </View>
                <View style={[styles.resumenCell, styles.resumenBorder]}>
                  <Text style={styles.resumenNum}>{totalGanados}</Text>
                  <Text style={styles.resumenLabel}>GANADOS</Text>
                </View>
                <View style={[styles.resumenCell, styles.resumenBorder]}>
                  <Text style={styles.resumenNum}>{efectividad != null ? `${efectividad}%` : '—'}</Text>
                  <Text style={styles.resumenLabel}>EFECTIVIDAD</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => router.push('/(tabs)/partidos')} activeOpacity={0.85} style={{ marginTop: 14 }}>
                <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.footerBtn}>
                  <Text style={styles.footerBtnTxt}>EXPLORAR PARTIDOS</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.footerHint}>
                La efectividad cuenta solo partidos con marcador reportado.
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: DT.bg },
  topBar:     { paddingHorizontal: SPACING.gutter, paddingTop: 8, paddingBottom: 14 },
  backBtn:    { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  title:      { fontSize: 28, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.6, paddingHorizontal: SPACING.gutter },
  subtitle:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body, paddingHorizontal: SPACING.gutter, marginTop: 4 },
  scroll:     { padding: SPACING.gutter, paddingTop: 16, paddingBottom: 40 },

  card:       { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden' },
  matchPrev:  { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: DT.glassBorder, gap: 12 },
  mpDate:     { minWidth: 42, alignItems: 'center' },
  mpDateDay:  { fontSize: 15, color: DT.primary, fontFamily: FONTS.heading, lineHeight: 17 },
  mpDateMes:  { fontSize: 10, color: DT.outline, fontFamily: FONTS.mono, lineHeight: 14 },
  mpDivider:  { width: 1, height: 36, backgroundColor: DT.glassBorder },
  mpInfo:     { flex: 1 },
  mpVenue:    { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyMed, letterSpacing: 0.2 },
  mpDetail:   { fontSize: 11.5, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },
  mpScore:    { color: DT.onBg, fontFamily: FONTS.bodyBold },
  mpResult:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  mpResultTxt:{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 0.5 },

  resumen:      { flexDirection: 'row', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, marginTop: 14, overflow: 'hidden' },
  resumenCell:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  resumenBorder:{ borderLeftWidth: 1, borderColor: DT.glassBorder },
  resumenNum:   { fontSize: 20, color: DT.onBg, fontFamily: FONTS.display, lineHeight: 24 },
  resumenLabel: { fontSize: 9, color: DT.onSurfaceVar, fontFamily: FONTS.mono, letterSpacing: 0.8 },
  footerBtn:    { height: 50, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  footerBtnTxt: { fontSize: 13, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.8 },
  footerHint:   { fontSize: 10.5, color: DT.outline, fontFamily: FONTS.body, textAlign: 'center', marginTop: 10 },

  empty:      { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 19, color: DT.onBg, fontFamily: FONTS.heading, marginTop: 20, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 26 },
  emptyBtn:   { height: 50, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyBtnTxt:{ fontSize: 13, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.8 },
});
