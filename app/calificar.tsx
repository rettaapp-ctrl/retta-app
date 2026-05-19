// ═══════════════════════════════════════════════
// RETTA — app/calificar.tsx
// Modal/pantalla full para calificar a 3 compañeros del partido.
// Se navega aquí desde Inicio cuando hay calificaciones pendientes.
// ═══════════════════════════════════════════════
import { COLORS } from '@/constants';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import ReporteModal from '@/components/ReporteModal';
import { track } from '@/lib/analytics';

interface CalUsuario {
  id: string;
  nombre: string;
  apellido?: string;
  avatar_url?: string;
  color_hex?: string;
  posicion?: string;
}

interface CalPendiente {
  id: string;
  usuario: CalUsuario;
}

interface PartidoPendiente {
  partido_id:      string;
  fecha:           string;
  hora_inicio:     string;
  complejo_nombre: string;
  cancha_nombre:   string;
  calificaciones:  CalPendiente[];
}

function StarIcon({ filled, size = 36 }: { filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#FFB800' : 'none'}>
      <Path
        d="M12 2L14.85 8.6L22 9.27L16.5 14.14L18.18 21.02L12 17.27L5.82 21.02L7.5 14.14L2 9.27L9.15 8.6L12 2Z"
        stroke={filled ? '#FFB800' : 'rgba(0,0,0,0.25)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18M6 18L18 6" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}

export default function CalificarScreen() {
  const router = useRouter();
  const { request } = useApi();
  const [loading, setLoading] = useState(true);
  const [partidos, setPartidos] = useState<PartidoPendiente[]>([]);
  const [partidoIdx, setPartidoIdx] = useState(0);
  const [calIdx, setCalIdx] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [reporteOpen, setReporteOpen] = useState(false);
  const [reporteTarget, setReporteTarget] = useState<{ id: string; nombre: string } | null>(null);

  function abrirReporte(userId: string, nombre: string) {
    setReporteTarget({ id: userId, nombre });
    setReporteOpen(true);
  }

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await request('/calificaciones/pendientes');
      const ps: PartidoPendiente[] = data.partidos || [];
      // Solo partidos con calificaciones realmente pendientes
      const conPendientes = ps.filter(p => p.calificaciones.length > 0);
      setPartidos(conPendientes);
    } catch {
      setPartidos([]);
    }
    setLoading(false);
  }

  async function enviarEstrellas(calId: string, estrellas: number) {
    if (enviando) return;
    setEnviando(true);
    try {
      await request(`/calificaciones/${calId}`, {
        method: 'POST',
        body: JSON.stringify({ estrellas }),
      });
      track('peer_rating_enviado', { estrellas });
      avanzar();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo enviar');
    } finally {
      setEnviando(false);
    }
  }

  function avanzar() {
    const partido = partidos[partidoIdx];
    if (!partido) return;
    if (calIdx + 1 < partido.calificaciones.length) {
      setCalIdx(calIdx + 1);
    } else if (partidoIdx + 1 < partidos.length) {
      setPartidoIdx(partidoIdx + 1);
      setCalIdx(0);
    } else {
      // Terminó todo
      router.back();
    }
  }

  function saltar() {
    Alert.alert(
      'Saltar calificación',
      'Si saltas, las calificaciones quedan pendientes. Las puedes hacer más tarde.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Saltar', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!partidos.length) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.emptyTxt}>Sin calificaciones pendientes</Text>
          <TouchableOpacity style={styles.btnVolver} onPress={() => router.back()}>
            <Text style={styles.btnVolverTxt}>VOLVER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const partido = partidos[partidoIdx];
  const cal = partido.calificaciones[calIdx];
  if (!partido || !cal) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  // Total de calificaciones pendientes para mostrar progreso
  const totalGlobal = partidos.reduce((sum, p) => sum + p.calificaciones.length, 0);
  let hechasGlobal = 0;
  for (let i = 0; i < partidoIdx; i++) hechasGlobal += partidos[i].calificaciones.length;
  hechasGlobal += calIdx;

  const u = cal.usuario;
  const initials = ((u.nombre?.[0] || '') + (u.apellido?.[0] || '')).toUpperCase() || '?';
  const avatarBg = u.color_hex || COLORS.accent;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.closeBtn} onPress={saltar}>
          <CloseIcon />
        </TouchableOpacity>
        <Text style={styles.progress}>{hechasGlobal + 1} de {totalGlobal}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>CALIFICA A TU COMPAÑERO</Text>
        <Text style={styles.partidoLine}>
          {partido.complejo_nombre || 'Partido'} · {partido.fecha?.slice(0, 10)}
        </Text>

        <View style={styles.avatarBlock}>
          <View style={[styles.avatarRing, { backgroundColor: avatarBg }]}>
            <View style={styles.avatarInner}>
              {u.avatar_url
                ? <Image source={{ uri: u.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 60 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                : <Text style={styles.avatarTxt}>{initials}</Text>
              }
            </View>
          </View>
          <Text style={styles.nombre}>{u.nombre}{u.apellido ? ` ${u.apellido}` : ''}</Text>
          {u.posicion && <Text style={styles.posicion}>{u.posicion}</Text>}
        </View>

        <Text style={styles.preguntaLbl}>¿Cómo jugó?</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity
              key={n}
              style={styles.starBtn}
              onPress={() => enviarEstrellas(cal.id, n)}
              disabled={enviando}
              activeOpacity={0.7}
            >
              <StarIcon filled={false} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.helperTxt}>
          Toca las estrellas para calificar.{'\n'}
          1 = no jugó · 5 = excelente
        </Text>

        <Text style={styles.anonTxt}>Las calificaciones son anónimas.</Text>

        {/* Botón sutil de reportar este jugador */}
        <TouchableOpacity
          style={styles.reportarBtn}
          onPress={() => abrirReporte(u.id, `${u.nombre || ''} ${u.apellido || ''}`.trim())}
          activeOpacity={0.7}
        >
          <Text style={styles.reportarBtnTxt}>¿Pasó algo con este jugador? Reportar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de reporte */}
      <ReporteModal
        visible={reporteOpen}
        onClose={() => setReporteOpen(false)}
        partidoId={partido.partido_id}
        reportadoId={reporteTarget?.id || null}
        reportadoNombre={reporteTarget?.nombre || ''}
        onSent={() => setReporteOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#fff' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyTxt:       { fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 16 },
  btnVolver:      { paddingHorizontal: 24, height: 44, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  btnVolverTxt:   { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 1.5 },

  topbar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  closeBtn:       { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  progress:       { fontSize: 12, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1.5 },

  scroll:         { padding: 20, paddingBottom: 40, alignItems: 'center' },
  kicker:         { fontSize: 11, fontWeight: '900', color: 'rgba(0,0,0,0.35)', letterSpacing: 2, marginBottom: 4 },
  partidoLine:    { fontSize: 13, color: 'rgba(0,0,0,0.5)', marginBottom: 24, textAlign: 'center' },

  avatarBlock:    { alignItems: 'center', marginVertical: 14 },
  avatarRing:     { width: 130, height: 130, borderRadius: 65, padding: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarInner:    { width: '100%', height: '100%', borderRadius: 60, backgroundColor: '#F2F1EF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:      { fontSize: 42, fontWeight: '900', color: '#fff' },
  nombre:         { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: 0.4, textAlign: 'center' },
  posicion:       { fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 4, fontWeight: '700' },

  preguntaLbl:    { fontSize: 14, fontWeight: '700', color: '#111', marginTop: 22, marginBottom: 16 },

  starsRow:       { flexDirection: 'row', gap: 6, marginBottom: 14 },
  starBtn:        { padding: 6 },

  helperTxt:      { fontSize: 11, color: 'rgba(0,0,0,0.35)', textAlign: 'center', lineHeight: 16, marginTop: 8 },
  anonTxt:        { fontSize: 11, color: 'rgba(0,0,0,0.3)', marginTop: 22, fontStyle: 'italic' },
  reportarBtn:    { marginTop: 30, paddingVertical: 10, paddingHorizontal: 16 },
  reportarBtnTxt: { fontSize: 12, color: 'rgba(0,0,0,0.4)', fontWeight: '600', textAlign: 'center', textDecorationLine: 'underline' },
});
