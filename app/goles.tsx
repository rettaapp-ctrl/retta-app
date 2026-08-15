// ═══════════════════════════════════════════════════════════════
// RETTA — app/goles.tsx
// Resumen de goles por partido, abierto desde la celda GOLES de la
// tarjeta de stats (perfil propio o de un amigo vía params).
//   • Solo lista partidos donde SÍ metió gol — los de 0 goles ya
//     viven en el historial de jugados (sin redundancia).
//   • Params: usuario_id ('me' u UUID), nombre (para el título si
//     es el perfil de alguien más).
// Mismo lenguaje visual que historial-partidos: filas fecha + lugar,
// badge de goles a la derecha, vacío con icono grande apagado.
// ═══════════════════════════════════════════════════════════════
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { useApi } from '@/hooks/useApi';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import BalonIcon from '@/components/BalonIcon';

interface FilaGol {
  id: string;
  equipo?: 'A' | 'B' | null;
  goles: number;
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
  } | null;
}

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// El balón de la app, en grande y apagado (la celda GOLES ahora usa
// el mismo balón — Rafael 2026-08-15).
function GolGrande() {
  return <BalonIcon size={54} color={DT.outline} />;
}

export default function GolesScreen() {
  const router = useRouter();
  const { request } = useApi();
  const params = useLocalSearchParams<{ usuario_id?: string; nombre?: string }>();
  const usuarioId = params.usuario_id || 'me';
  const esPropio  = usuarioId === 'me';

  const [filas, setFilas]           = useState<FilaGol[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, [usuarioId]));

  async function load() {
    try {
      const res = await request(`/usuarios/${usuarioId}/goles`).catch(() => ({ goles: [] }));
      setFilas((res.goles || []).filter((f: FilaGol) => f.v_partidos));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [usuarioId]);

  function formatFecha(fecha: string) {
    const d = new Date(fecha + 'T00:00:00');
    return {
      dia: d.getDate().toString().padStart(2, '0'),
      mes: d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase(),
    };
  }

  const totalGoles    = filas.reduce((a, f) => a + (f.goles || 0), 0);
  const totalPartidos = filas.length;

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <BackIcon />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{esPropio ? 'Tus goles' : `Goles de ${params.nombre || 'jugador'}`}</Text>
        {!loading && totalGoles > 0 && (
          <Text style={styles.subtitle}>
            {totalGoles} {totalGoles === 1 ? 'gol' : 'goles'} en {totalPartidos} {totalPartidos === 1 ? 'partido' : 'partidos'}
          </Text>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color={DT.primary} style={{ marginTop: 60 }} />
          ) : filas.length === 0 ? (
            <View style={styles.empty}>
              <GolGrande />
              <Text style={styles.emptyTitle}>
                {esPropio ? 'Aún no has metido goles' : 'Aún no tiene goles registrados'}
              </Text>
              <Text style={styles.emptySub}>
                {esPropio
                  ? 'Cuando el árbitro registre tus goles al final de un partido, aparecerán aquí.'
                  : 'Cuando el árbitro le registre goles al final de un partido, aparecerán aquí.'}
              </Text>
              {esPropio && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/partidos')} activeOpacity={0.85}>
                  <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyBtn}>
                    <Text style={styles.emptyBtnTxt}>EXPLORAR PARTIDOS</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              {filas.map((item, i) => {
                const p = item.v_partidos!;
                const f = formatFecha(p.fecha);
                const isLast = i === filas.length - 1;
                const tieneMarcador = typeof p.goles_a === 'number' && typeof p.goles_b === 'number';
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/partido/${p.id}?desde=goles`)}
                    style={[styles.fila, isLast && { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.fDate}>
                      <Text style={styles.fDateDay}>{f.dia}</Text>
                      <Text style={styles.fDateMes}>{f.mes}</Text>
                    </View>
                    <View style={styles.fDivider} />
                    <View style={styles.fInfo}>
                      <Text style={styles.fVenue} numberOfLines={1}>{p.complejo_nombre} — {p.cancha_nombre}</Text>
                      <Text style={styles.fDetail}>
                        {p.tipo} · {p.hora_inicio?.slice(0, 5)}
                        {tieneMarcador && <Text style={styles.fScore}> · {p.goles_a}–{p.goles_b}</Text>}
                      </Text>
                    </View>
                    <View style={styles.fGoles}>
                      <Text style={styles.fGolesNum}>{item.goles}</Text>
                      <Text style={styles.fGolesLbl}>{item.goles === 1 ? 'GOL' : 'GOLES'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: DT.bg },
  topBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  backBtn:    { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  title:      { fontSize: 28, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.6, paddingHorizontal: 22 },
  subtitle:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body, paddingHorizontal: 22, marginTop: 6 },
  scroll:     { padding: 20, paddingTop: 16, paddingBottom: 40 },

  card:       { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden' },
  fila:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: DT.glassBorder },
  fDate:      { width: 40, alignItems: 'center' },
  fDateDay:   { fontSize: 18, color: DT.onBg, fontFamily: FONTS.display, lineHeight: 22 },
  fDateMes:   { fontSize: 9.5, color: DT.onSurfaceVar, fontFamily: FONTS.mono, letterSpacing: 0.8 },
  fDivider:   { width: 1, height: 34, backgroundColor: DT.glassBorder, marginHorizontal: 12 },
  fInfo:      { flex: 1, paddingRight: 8 },
  fVenue:     { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodySemi },
  fDetail:    { fontSize: 12, color: DT.onSurfaceVar, fontFamily: FONTS.body, marginTop: 2 },
  fScore:     { color: DT.onSurfaceVar, fontFamily: FONTS.bodySemi },
  fGoles:     { minWidth: 52, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10, borderRadius: RADIUS.md, backgroundColor: 'rgba(190,194,255,0.12)' },
  fGolesNum:  { fontSize: 17, color: DT.onBg, fontFamily: FONTS.display, lineHeight: 20 },
  fGolesLbl:  { fontSize: 8.5, color: DT.primary, fontFamily: FONTS.mono, letterSpacing: 0.8, marginTop: 1 },

  empty:      { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 17, color: DT.onBg, fontFamily: FONTS.heading, marginTop: 18, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body, lineHeight: 19, marginTop: 8, textAlign: 'center' },
  emptyBtn:   { marginTop: 22, paddingHorizontal: 26, paddingVertical: 13, borderRadius: RADIUS.full },
  emptyBtnTxt:{ fontSize: 12.5, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.6 },
});
