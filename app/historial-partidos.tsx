// ═══════════════════════════════════════════════════════════════
// RETTA — app/historial-partidos.tsx
// Historial de partidos anteriores, abierto desde las stats del
// perfil (propio O de un amigo vía params usuario_id + nombre).
// Modos vía param `filtro`:
//   'jugados' → todos los partidos anteriores. El marcador (badge de
//               color) SOLO aparece si el árbitro lo reportó:
//               verde = ganó, rojo = perdió, amarillo = empate.
//   'ganados' → únicamente los ganados (siempre con marcador).
// Buscador por fecha (Rafael 2026-08-15): botón de calendario arriba
// que abre chips de meses para filtrar la lista. Sustituye al viejo
// botón de "Explorar partidos".
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
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

function CalendarioIcon({ activo = false }: { activo?: boolean }) {
  const color = activo ? DT.primary : DT.onBg;
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="16" rx="3" stroke={color} strokeWidth="1.8"/>
      <Line x1="3.5" y1="10" x2="20.5" y2="10" stroke={color} strokeWidth="1.8"/>
      <Line x1="8" y1="2.8" x2="8" y2="6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Line x1="16" y1="2.8" x2="16" y2="6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
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

// Cancha con portería al centro, en grande y apagado — mismo icono
// que la celda de PARTIDOS JUGADOS (Rafael 2026-08-15).
function CanchaGrande() {
  return <MaterialCommunityIcons name="soccer-field" size={58} color={DT.outline} />;
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function HistorialPartidosScreen() {
  const router = useRouter();
  const { request } = useApi();
  const params = useLocalSearchParams<{ filtro?: string; usuario_id?: string; nombre?: string }>();
  const soloGanados = params.filtro === 'ganados';
  const usuarioId   = params.usuario_id || 'me';
  const esPropio    = usuarioId === 'me';

  const [partidos, setPartidos]           = useState<Inscripcion[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [mesFiltro, setMesFiltro]         = useState<string | null>(null); // 'YYYY-MM' | null = todos

  useFocusEffect(
    useCallback(() => {
      load();
    }, [usuarioId])
  );

  async function load() {
    try {
      const res = await request(`/usuarios/${usuarioId}/partidos`).catch(() => ({ partidos: [] }));
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

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [usuarioId]);

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

  function labelMes(ym: string) {
    const [anio, mes] = ym.split('-');
    return `${MESES_CORTOS[parseInt(mes, 10) - 1]} ${anio}`;
  }

  const base = soloGanados ? partidos.filter(esGanado) : partidos;

  // Meses disponibles (de lo que SÍ hay en la lista), más reciente primero.
  const meses = Array.from(new Set(base.map(p => p.v_partidos.fecha.slice(0, 7)))).sort().reverse();

  const lista = mesFiltro ? base.filter(p => p.v_partidos.fecha.slice(0, 7) === mesFiltro) : base;

  // Resumen para el pie de la lista (que la parte de abajo no se vea vacía)
  const totalJugados  = partidos.length;
  const totalGanados  = partidos.filter(esGanado).length;
  const conMarcador   = partidos.filter(p => {
    const v = p.v_partidos;
    return v && typeof v.goles_a === 'number' && typeof v.goles_b === 'number' && v.equipo_ganador;
  }).length;
  const efectividad   = conMarcador > 0 ? Math.round((totalGanados / conMarcador) * 100) : null;

  const nombreCorto = (params.nombre || 'jugador').split(' ')[0];
  const titulo = soloGanados
    ? (esPropio ? 'Partidos ganados' : `Ganados de ${nombreCorto}`)
    : (esPropio ? 'Partidos jugados' : `Partidos de ${nombreCorto}`);

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Barra superior estilo "Configuración" (Rafael 2026-08-15):
            título centrado y sutil entre la flecha y el calendario. */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.topTitle} numberOfLines={1}>{titulo}</Text>
          {base.length > 0 ? (
            <TouchableOpacity
              style={[styles.backBtn, mostrarFiltro && styles.calBtnActivo]}
              onPress={() => {
                if (mostrarFiltro) setMesFiltro(null);
                setMostrarFiltro(v => !v);
              }}
            >
              <CalendarioIcon activo={mostrarFiltro} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 42 }} />
          )}
        </View>

        {!loading && lista.length > 0 && (
          <Text style={styles.subtitle}>
            {lista.length} {lista.length === 1 ? 'partido' : 'partidos'}
            {mesFiltro ? ` en ${labelMes(mesFiltro)}` : ''}
          </Text>
        )}

        {/* Buscador por fecha: chips de meses con lo que hay en el historial */}
        {mostrarFiltro && base.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mesesWrap}
            contentContainerStyle={styles.mesesRow}
          >
            <TouchableOpacity
              style={[styles.mesChip, mesFiltro == null && styles.mesChipOn]}
              onPress={() => setMesFiltro(null)}
            >
              <Text style={[styles.mesChipTxt, mesFiltro == null && styles.mesChipTxtOn]}>Todos</Text>
            </TouchableOpacity>
            {meses.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.mesChip, mesFiltro === m && styles.mesChipOn]}
                onPress={() => setMesFiltro(mesFiltro === m ? null : m)}
              >
                <Text style={[styles.mesChipTxt, mesFiltro === m && styles.mesChipTxtOn]}>{labelMes(m)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color={DT.primary} style={{ marginTop: 60 }} />
          ) : base.length === 0 ? (
            <View style={styles.empty}>
              {soloGanados ? <TrofeoGrande /> : <CanchaGrande />}
              <Text style={styles.emptyTitle}>
                {soloGanados
                  ? (esPropio ? 'Aún no has ganado partidos' : 'Aún no ha ganado partidos')
                  : (esPropio ? 'Aún no has jugado partidos' : 'Aún no ha jugado partidos')}
              </Text>
              <Text style={styles.emptySub}>
                {soloGanados
                  ? (esPropio
                    ? 'Cuando ganes tu primer partido con marcador reportado, aparecerá aquí.'
                    : 'Cuando gane su primer partido con marcador reportado, aparecerá aquí.')
                  : (esPropio
                    ? 'Únete a un partido y tu historial empezará a llenarse.'
                    : 'Cuando juegue su primer partido, su historial aparecerá aquí.')}
              </Text>
            </View>
          ) : lista.length === 0 ? (
            <View style={styles.empty}>
              <CalendarioIcon activo />
              <Text style={styles.emptyTitle}>Sin partidos en {mesFiltro ? labelMes(mesFiltro) : 'ese mes'}</Text>
              <Text style={styles.emptySub}>Prueba con otro mes o vuelve a "Todos".</Text>
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
                let resultColor: string = DT.onSurfaceVar;
                let resultBg: string    = 'rgba(255,255,255,0.06)';
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
                      </Text>
                    </View>
                    {/* El marcador ES el badge: verde si ganó, rojo si
                        perdió, amarillo si empató (Rafael 2026-08-15). */}
                    {resultado && (
                      <View style={[styles.mpResult, { backgroundColor: resultBg }]}>
                        <Text style={[styles.mpResultTxt, { color: resultColor }]}>{p.goles_a}–{p.goles_b}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Pie: resumen para que el final de la lista no quede vacío */}
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
  topBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.gutter, paddingTop: 8, paddingBottom: 14 },
  backBtn:    { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  calBtnActivo: { borderColor: DT.primary, backgroundColor: 'rgba(190,194,255,0.12)' },
  topTitle:   { flex: 1, textAlign: 'center', fontSize: 19, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.3, marginHorizontal: 10 },
  subtitle:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body, textAlign: 'center', marginTop: 2 },
  scroll:     { padding: SPACING.gutter, paddingTop: 16, paddingBottom: 40 },

  mesesWrap:  { marginTop: 14, maxHeight: 40 },
  mesesRow:   { paddingHorizontal: SPACING.gutter, gap: 8 },
  mesChip:    { paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.full, backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  mesChipOn:  { backgroundColor: 'rgba(190,194,255,0.16)', borderColor: DT.primary },
  mesChipTxt: { fontSize: 12.5, color: DT.onSurfaceVar, fontFamily: FONTS.bodySemi },
  mesChipTxtOn: { color: DT.primary },

  card:       { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden' },
  matchPrev:  { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: DT.glassBorder, gap: 12 },
  mpDate:     { minWidth: 42, alignItems: 'center' },
  mpDateDay:  { fontSize: 15, color: DT.primary, fontFamily: FONTS.heading, lineHeight: 17 },
  mpDateMes:  { fontSize: 10, color: DT.outline, fontFamily: FONTS.mono, lineHeight: 14 },
  mpDivider:  { width: 1, height: 36, backgroundColor: DT.glassBorder },
  mpInfo:     { flex: 1 },
  mpVenue:    { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyMed, letterSpacing: 0.2 },
  mpDetail:   { fontSize: 11.5, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },
  mpResult:   { minWidth: 52, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  mpResultTxt:{ fontSize: 13.5, fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },

  resumen:      { flexDirection: 'row', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, marginTop: 14, overflow: 'hidden' },
  resumenCell:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  resumenBorder:{ borderLeftWidth: 1, borderColor: DT.glassBorder },
  resumenNum:   { fontSize: 20, color: DT.onBg, fontFamily: FONTS.display, lineHeight: 24 },
  resumenLabel: { fontSize: 9, color: DT.onSurfaceVar, fontFamily: FONTS.mono, letterSpacing: 0.8 },
  footerHint:   { fontSize: 10.5, color: DT.outline, fontFamily: FONTS.body, textAlign: 'center', marginTop: 10 },

  empty:      { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 19, color: DT.onBg, fontFamily: FONTS.heading, marginTop: 20, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 19, marginTop: 8 },
});
