import { COLORS } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { track } from '@/lib/analytics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

interface AmistadInfo {
  id: string;
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'bloqueada';
  yo_envie: boolean;
  created_at: string;
}

interface Perfil {
  id: string;
  nombre: string;
  apellido?: string;
  avatar_url?: string;
  posicion?: string;
  nivel?: string;        // auto-declarado en onboarding
  rating?: number;       // calculado tipo Playtomic
  ciudad?: string;
  partidos_jug?: number;
  partidos_gan?: number;
  racha_actual?: number;
  racha_max?: number;
  color_hex?: string;
  es_yo: boolean;
  amistad: AmistadInfo | null;
}

// Convierte rating numérico (1.0 → ∞) a label descriptivo.
function ratingLabel(rating: number): string {
  if (rating < 2.0) return 'Principiante';
  if (rating < 3.0) return 'Intermedio bajo';
  if (rating < 4.0) return 'Intermedio';
  if (rating < 5.0) return 'Avanzado';
  if (rating < 6.0) return 'Élite';
  return 'Pro';
}

function FlameIcon({ size = 22, color = '#FF6B35' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 6 9 6 14a6 6 0 0 0 12 0c0-1.5-.5-3-1.5-4-.4 1-1.5 1.5-2.5 1-1.4-.7-1-2.6 0-4 .5-.7.5-2-1-3-1 .5-1.5 2-1 4z"
        fill={color}
      />
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const POSICION_LABEL: Record<string, string> = {
  POR: 'Portero', DEF: 'Defensa', MED: 'Mediocampista', DEL: 'Delantero',
};

export default function PerfilPublicoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { request } = useApi();
  const { user } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil]   = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [actuando, setActuando] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const data = await request(`/usuarios/${id}/perfil`);
      setPerfil(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo cargar el perfil.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function enviarSolicitud() {
    if (!perfil) return;
    setActuando(true);
    try {
      await request('/amistades', {
        method: 'POST',
        body: JSON.stringify({ usuario_id: perfil.id }),
      });
      track('amigo_solicitud_enviada', { target_id: perfil.id });
      Alert.alert('Solicitud enviada', `Le enviamos tu solicitud a ${perfil.nombre}.`);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setActuando(false);
    }
  }

  async function responderSolicitud(action: 'aceptar' | 'rechazar') {
    if (!perfil?.amistad?.id) return;
    setActuando(true);
    try {
      await request(`/amistades/${perfil.amistad.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      track('amigo_solicitud_respondida', { action });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo procesar.');
    } finally {
      setActuando(false);
    }
  }

  function eliminarAmistad() {
    if (!perfil?.amistad?.id) return;
    Alert.alert(
      perfil.amistad.status === 'aceptada' ? 'Eliminar amigo' : 'Cancelar solicitud',
      perfil.amistad.status === 'aceptada'
        ? `¿Seguro que quieres eliminar a ${perfil.nombre} de tus amigos?`
        : '¿Cancelar la solicitud?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: async () => {
            setActuando(true);
            try {
              await request(`/amistades/${perfil.amistad!.id}`, { method: 'DELETE' });
              await load();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'No se pudo eliminar.');
            } finally {
              setActuando(false);
            }
          },
        },
      ]
    );
  }

  if (loading || !perfil) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  const initials = ((perfil.nombre?.[0] || '') + (perfil.apellido?.[0] || '')).toUpperCase() || '?';
  const avatarBg = perfil.color_hex || COLORS.accent;

  // Decidir botón según estado de amistad
  function renderActionBtn() {
    if (perfil!.es_yo) {
      return (
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push('/editar-perfil')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryTxt}>EDITAR MI PERFIL</Text>
        </TouchableOpacity>
      );
    }
    const a = perfil!.amistad;
    if (!a) {
      return (
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={enviarSolicitud}
          disabled={actuando}
          activeOpacity={0.85}
        >
          {actuando
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnPrimaryTxt}>+  AGREGAR AMIGO</Text>
          }
        </TouchableOpacity>
      );
    }
    if (a.status === 'aceptada') {
      return (
        <View style={{ gap: 10 }}>
          <View style={styles.btnAmigo}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Path d="M5 12L10 17L19 8" stroke={COLORS.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={styles.btnAmigoTxt}>YA SON AMIGOS</Text>
          </View>
          <TouchableOpacity style={styles.btnSec} onPress={eliminarAmistad} disabled={actuando}>
            <Text style={styles.btnSecTxt}>Eliminar amigo</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (a.status === 'pendiente' && a.yo_envie) {
      return (
        <View style={{ gap: 10 }}>
          <View style={styles.btnPendiente}>
            <Text style={styles.btnPendienteTxt}>SOLICITUD ENVIADA</Text>
          </View>
          <TouchableOpacity style={styles.btnSec} onPress={eliminarAmistad} disabled={actuando}>
            <Text style={styles.btnSecTxt}>Cancelar solicitud</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (a.status === 'pendiente' && !a.yo_envie) {
      return (
        <View style={{ gap: 10 }}>
          <Text style={styles.solicitudHint}>{perfil!.nombre} te envió una solicitud.</Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => responderSolicitud('aceptar')}
            disabled={actuando}
            activeOpacity={0.85}
          >
            {actuando ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryTxt}>ACEPTAR SOLICITUD</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSec} onPress={() => responderSolicitud('rechazar')} disabled={actuando}>
            <Text style={styles.btnSecTxt}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (a.status === 'rechazada') {
      return (
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={enviarSolicitud}
          disabled={actuando}
          activeOpacity={0.85}
        >
          {actuando ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryTxt}>+  AGREGAR AMIGO</Text>}
        </TouchableOpacity>
      );
    }
    return null; // bloqueada → no mostrar nada
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Perfil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + nombre */}
        <View style={styles.heroBlock}>
          <View style={styles.avatarRing}>
            <View style={[styles.avatarInner, { backgroundColor: avatarBg }]}>
              {perfil.avatar_url
                ? <Image source={{ uri: perfil.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 50 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                : <Text style={styles.avatarTxt}>{initials}</Text>
              }
            </View>
          </View>
          <Text style={styles.nombre}>{perfil.nombre}{perfil.apellido ? ` ${perfil.apellido}` : ''}</Text>
          {perfil.ciudad && (
            <Text style={styles.ciudad}>{perfil.ciudad}</Text>
          )}
        </View>

        {/* Action button */}
        <View style={styles.actionWrap}>
          {renderActionBtn()}
        </View>

        {/* Racha */}
        <View style={styles.rachaCard}>
          <View style={styles.rachaIcon}>
            <FlameIcon size={28} color={(perfil.racha_actual ?? 0) > 0 ? '#FF6B35' : 'rgba(0,0,0,0.2)'} />
          </View>
          <View style={styles.rachaInfo}>
            <Text style={styles.rachaTitle}>RACHA</Text>
            <Text style={styles.rachaNum}>
              {(perfil.racha_actual ?? 0) > 0
                ? `${perfil.racha_actual} ${perfil.racha_actual === 1 ? 'semana' : 'semanas'}`
                : 'Sin racha'}
            </Text>
            {(perfil.racha_max ?? 0) > 0 && (
              <Text style={styles.rachaRecord}>
                Récord: {perfil.racha_max} {perfil.racha_max === 1 ? 'semana' : 'semanas'}
              </Text>
            )}
          </View>
        </View>

        {/* Stats — 3 celdas */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{perfil.partidos_jug || 0}</Text>
            <Text style={styles.statLbl}>Partidos jugados</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{perfil.partidos_gan || 0}</Text>
            <Text style={styles.statLbl}>Partidos ganados</Text>
          </View>
        </View>

        {/* Perfil deportivo */}
        <Text style={styles.sectionLabel}>Perfil deportivo</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8"/>
                <Path d="M3 12H21M12 3 V21" stroke="rgba(0,0,0,0.4)" strokeWidth="1.4"/>
              </Svg>
            </View>
            <Text style={styles.rowLabel}>Posición</Text>
            <Text style={styles.rowVal}>{POSICION_LABEL[perfil.posicion || ''] || '—'}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Path d="M5 13L9 17L19 7" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </View>
            <Text style={styles.rowLabel}>Nivel</Text>
            <Text style={styles.rowVal}>
              {`${(perfil.rating ?? 1.0).toFixed(1)} — ${ratingLabel(perfil.rating ?? 1.0)}`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#fff' },
  center:         { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  topbar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  topbarTitle:    { fontSize: 16, fontWeight: '900', color: '#111', letterSpacing: 0.3 },

  scroll:         { paddingHorizontal: 20, paddingBottom: 30 },

  heroBlock:      { alignItems: 'center', paddingTop: 12, paddingBottom: 18 },
  avatarRing:     { width: 110, height: 110, borderRadius: 55, padding: 4, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarInner:    { width: '100%', height: '100%', borderRadius: 50, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:      { fontSize: 36, fontWeight: '900', color: '#fff' },
  nombre:         { fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: 0.4, textAlign: 'center', marginBottom: 2 },
  ciudad:         { fontSize: 13, color: 'rgba(0,0,0,0.45)', marginTop: 2 },

  actionWrap:     { marginBottom: 22 },

  btnPrimary:     { height: 52, backgroundColor: COLORS.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryTxt:  { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 1.5 },

  btnAmigo:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, backgroundColor: 'rgba(143,204,0,0.12)', borderWidth: 1, borderColor: 'rgba(143,204,0,0.45)' },
  btnAmigoTxt:    { fontSize: 12, fontWeight: '900', color: COLORS.accent, letterSpacing: 1.5 },

  btnPendiente:   { height: 52, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  btnPendienteTxt:{ fontSize: 12, fontWeight: '800', color: 'rgba(0,0,0,0.45)', letterSpacing: 1.5 },

  btnSec:         { height: 42, alignItems: 'center', justifyContent: 'center' },
  btnSecTxt:      { fontSize: 13, fontWeight: '700', color: '#D62B2B', letterSpacing: 0.3 },

  solicitudHint:  { fontSize: 13, color: 'rgba(0,0,0,0.55)', textAlign: 'center', marginBottom: 4 },

  rachaCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 16, padding: 16, marginBottom: 14 },
  rachaIcon:      { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,107,53,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rachaInfo:      { flex: 1 },
  rachaTitle:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(0,0,0,0.35)' },
  rachaNum:       { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 0.3, marginTop: 2 },
  rachaRecord:    { fontSize: 11, color: 'rgba(0,0,0,0.4)', marginTop: 3 },

  statsRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F3EF', borderRadius: 18, paddingVertical: 16, marginBottom: 22 },
  statBox:        { flex: 1, alignItems: 'center' },
  statDiv:        { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.08)' },
  statNum:        { fontSize: 22, fontWeight: '900', color: '#111' },
  statLbl:        { fontSize: 11, color: 'rgba(0,0,0,0.5)', marginTop: 2 },

  sectionLabel:   { fontSize: 11, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  card:           { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon:        { width: 28, alignItems: 'center', marginRight: 10 },
  rowLabel:       { flex: 1, fontSize: 13, color: 'rgba(0,0,0,0.45)', fontWeight: '600' },
  rowVal:         { fontSize: 14, fontWeight: '800', color: '#111' },
  rowDivider:     { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 16 },
});
