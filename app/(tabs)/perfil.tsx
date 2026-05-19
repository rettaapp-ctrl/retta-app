import { COLORS } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useNotificacionesCount } from '@/hooks/useNotificacionesCount';
import { isPartidoVisible } from '@/lib/partidos';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

interface Inscripcion {
  id: string;
  status: string;
  v_partidos: {
    id: string;
    fecha: string;
    hora_inicio: string;
    tipo: string;
    complejo_nombre: string;
    cancha_nombre: string;
  };
}

const POSICION_LABEL: Record<string, string> = {
  DEL: 'DEL — Delantero',
  MED: 'MED — Mediocampista',
  DEF: 'DEF — Defensa',
  POR: 'POR — Portero',
};

// Convierte un rating numérico (1.0 → ∞) a label descriptivo.
// Mismas bandas en perfil propio y público para consistencia.
function ratingLabel(rating: number): string {
  if (rating < 2.0) return 'Principiante';
  if (rating < 3.0) return 'Intermedio bajo';
  if (rating < 4.0) return 'Intermedio';
  if (rating < 5.0) return 'Avanzado';
  if (rating < 6.0) return 'Élite';
  return 'Pro';
}

function FlameIcon({ size = 20, color = '#FF6B35' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 6 9 6 14a6 6 0 0 0 12 0c0-1.5-.5-3-1.5-4-.4 1-1.5 1.5-2.5 1-1.4-.7-1-2.6 0-4 .5-.7.5-2-1-3-1 .5-1.5 2-1 4z"
        fill={color}
      />
    </Svg>
  );
}

function SettingsIcon() {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke="#111" strokeWidth="1.8"/>
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#111" strokeWidth="1.8"/>
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function AvatarPlaceholder() {
  return (
    <Svg width="46" height="46" viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="18" r="9" fill="#999"/>
      <Path d="M6 42C6 33.2 14.1 26 24 26C33.9 26 42 33.2 42 42" fill="#999"/>
    </Svg>
  );
}

export default function PerfilScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { request } = useApi();
  const [partidos, setPartidos]     = useState<Inscripcion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [verTodos, setVerTodos]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [amigosCount, setAmigosCount] = useState(0);
  const [solicitudesCount, setSolicitudesCount] = useState(0);
  const { count: notiCount } = useNotificacionesCount();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      // refreshUser() pulls fresh stats (rating, racha, jugados, ganados)
      // del backend que recalcula on-demand antes de devolver.
      const [partidosRes, amigosRes, pendRes] = await Promise.all([
        request('/usuarios/me/partidos').catch(() => ({ partidos: [] })),
        request('/amistades').catch(() => ({ amigos: [] })),
        request('/amistades/pendientes').catch(() => ({ solicitudes: [] })),
        refreshUser().catch(() => {}),
      ]);
      // Solo "Partidos Anteriores" → ya pasaron (cutoff 1h después de hora_inicio).
      // Más reciente primero (DESC por fecha+hora).
      const anteriores = (partidosRes.partidos || [])
        .filter((p: Inscripcion) => p.v_partidos != null)
        .filter((p: Inscripcion) => !isPartidoVisible(p.v_partidos.fecha, p.v_partidos.hora_inicio))
        .sort((a: Inscripcion, b: Inscripcion) => {
          const fa = `${a.v_partidos?.fecha || ''} ${a.v_partidos?.hora_inicio || ''}`;
          const fb = `${b.v_partidos?.fecha || ''} ${b.v_partidos?.hora_inicio || ''}`;
          return fb.localeCompare(fa); // DESC: más reciente primero
        });
      setPartidos(anteriores);
      setAmigosCount((amigosRes.amigos || []).length);
      setSolicitudesCount((pendRes.solicitudes || []).length);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  function formatFecha(fecha: string) {
    const d = new Date(fecha + 'T00:00:00');
    return {
      dia: d.getDate().toString().padStart(2, '0'),
      mes: d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase(),
    };
  }

  const visibles    = verTodos ? partidos : partidos.slice(0, 3);
  const posLabel    = POSICION_LABEL[user?.posicion || ''] || (user?.posicion || '—');
  const posSubtitle = posLabel !== '—' ? posLabel.split('—')[1]?.trim() : null;
  const ciudadLabel = user?.ciudad || 'Ciudad de México';
  const rating      = user?.rating ?? 1.0;
  const ratingTxt   = `${rating.toFixed(1)} — ${ratingLabel(rating)}`;
  const racha       = user?.racha_actual ?? 0;
  const rachaMax    = user?.racha_max ?? 0;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
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

        {/* Avatar hero */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              {user?.avatar_url
                ? <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 42 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                : <AvatarPlaceholder />
              }
            </View>
          </View>
          <Text style={styles.profileName}>
            {(user?.nombre || '').toUpperCase()} {(user?.apellido || '').toUpperCase()}
          </Text>
          <Text style={styles.profileSub}>
            {posSubtitle ? `${posSubtitle} · ` : ''}{ciudadLabel}
          </Text>
        </View>

        {/* Racha */}
        <View style={styles.rachaCard}>
          <View style={styles.rachaIcon}>
            <FlameIcon size={28} color={racha > 0 ? '#FF6B35' : 'rgba(0,0,0,0.2)'} />
          </View>
          <View style={styles.rachaInfo}>
            <Text style={styles.rachaTitle}>RACHA</Text>
            <Text style={styles.rachaNum}>
              {racha > 0 ? `${racha} ${racha === 1 ? 'semana' : 'semanas'}` : 'Sin racha'}
            </Text>
            {rachaMax > 0 && (
              <Text style={styles.rachaRecord}>Récord: {rachaMax} {rachaMax === 1 ? 'semana' : 'semanas'}</Text>
            )}
            {racha === 0 && (
              <Text style={styles.rachaRecord}>Juega esta semana para empezar tu racha</Text>
            )}
          </View>
        </View>

        {/* Stats — 3 celdas: Jugados | Ganados | Amigos */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{user?.partidos_jug ?? 0}</Text>
            <Text style={styles.statLabel}>Partidos{'\n'}Jugados</Text>
          </View>
          <View style={[styles.statCell, styles.statCellBorder]}>
            <Text style={styles.statNum}>{user?.partidos_gan ?? 0}</Text>
            <Text style={styles.statLabel}>Partidos{'\n'}Ganados</Text>
          </View>
          <TouchableOpacity
            style={[styles.statCell, styles.statCellBorder, styles.statCellTappable]}
            onPress={() => router.push('/amigos')}
            activeOpacity={0.6}
          >
            <Text style={styles.statNum}>{amigosCount}</Text>
            <Text style={styles.statLabel}>Amigos</Text>
            <View style={styles.statCta}>
              <Text style={styles.statCtaTxt}>VER  ›</Text>
            </View>
            {solicitudesCount > 0 && (
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeTxt}>{solicitudesCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Posición</Text>
            <Text style={styles.infoVal}>{posLabel}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoKey}>Nivel</Text>
            <Text style={styles.infoVal}>{ratingTxt}</Text>
          </View>
        </View>

        {/* Partidos anteriores */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Partidos Anteriores</Text>
            {partidos.length > 3 && (
              <TouchableOpacity onPress={() => setVerTodos(!verTodos)}>
                <Text style={styles.verTodos}>{verTodos ? 'Ver menos' : 'Ver todos →'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ margin: 16 }} />
          ) : partidos.length === 0 ? (
            <View style={styles.emptyPartidos}>
              <Text style={styles.emptyTxt}>Sin partidos registrados</Text>
            </View>
          ) : (
            visibles.map((item, i) => {
              const p = item.v_partidos;
              if (!p) return null;
              const f = formatFecha(p.fecha);
              const isLast = i === visibles.length - 1;
              return (
                <View key={item.id} style={[styles.matchPrev, isLast && { borderBottomWidth: 0 }]}>
                  <View style={styles.mpDate}>
                    <Text style={styles.mpDateDay}>{f.dia}</Text>
                    <Text style={styles.mpDateMes}>{f.mes}</Text>
                  </View>
                  <View style={styles.mpDivider} />
                  <View style={styles.mpInfo}>
                    <Text style={styles.mpVenue}>{p.complejo_nombre} — {p.cancha_nombre}</Text>
                    <Text style={styles.mpDetail}>{p.tipo} · {p.hora_inicio?.slice(0, 5)}</Text>
                  </View>
                  <View style={styles.mpResult}>
                    <Text style={styles.mpResultTxt}>JUGÓ</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#fff' },
  scroll:         { padding: 20, paddingBottom: 40 },
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingBottom: 4 },
  iconBtn:        { padding: 4, position: 'relative' },
  bellDot:        { position: 'absolute', top: 2, right: 2, width: 7, height: 7, backgroundColor: COLORS.accent, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  bellBadge:      { position: 'absolute', top: -2, right: -4, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: '#D62B2B', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  bellBadgeTxt:   { fontSize: 10, fontWeight: '900', color: '#fff', lineHeight: 12 },
  hero:           { alignItems: 'center', paddingVertical: 18 },
  avatarRing:     { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.accent, padding: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarInner:    { width: '100%', height: '100%', borderRadius: 42, backgroundColor: '#F2F1EF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileName:    { fontSize: 26, fontWeight: '900', color: '#111', letterSpacing: 0.5, lineHeight: 28 },
  profileSub:     { fontSize: 12, color: 'rgba(0,0,0,0.38)', marginTop: 4, letterSpacing: 0.3 },
  rachaCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  rachaIcon:      { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,107,53,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rachaInfo:      { flex: 1 },
  rachaTitle:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(0,0,0,0.35)' },
  rachaNum:       { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 0.3, marginTop: 2 },
  rachaRecord:    { fontSize: 11, color: 'rgba(0,0,0,0.4)', marginTop: 3 },
  statsRow:       { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statCell:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  statCellBorder: { borderLeftWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  statCellTappable:{ backgroundColor: 'rgba(143,204,0,0.06)' },
  statCta:        { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, backgroundColor: COLORS.accent },
  statCtaTxt:     { fontSize: 10, fontWeight: '900', color: '#000', letterSpacing: 1 },
  statBadge:      { position: 'absolute', top: 8, right: 12, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#D62B2B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 1.5, borderColor: '#fff' },
  statBadgeTxt:   { fontSize: 11, fontWeight: '900', color: '#fff' },
  statNum:        { fontSize: 26, fontWeight: '900', color: '#111', lineHeight: 28 },
  statLabel:      { fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 3, textAlign: 'center', lineHeight: 14, letterSpacing: 0.2 },
  card:           { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 18, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  cardTitle:      { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase' },
  verTodos:       { fontSize: 11, color: 'rgba(0,0,0,0.3)' },
  infoRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  infoKey:        { fontSize: 13, color: 'rgba(0,0,0,0.45)', fontWeight: '500' },
  infoVal:        { fontSize: 14, fontWeight: '700', color: '#111', letterSpacing: 0.2 },
  emptyPartidos:  { padding: 20, alignItems: 'center' },
  emptyTxt:       { color: 'rgba(0,0,0,0.38)', fontSize: 13 },
  matchPrev:      { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)', gap: 12 },
  mpDate:         { minWidth: 42, alignItems: 'center' },
  mpDateDay:      { fontSize: 13, fontWeight: '700', color: 'rgba(0,0,0,0.35)', lineHeight: 15 },
  mpDateMes:      { fontSize: 13, fontWeight: '700', color: 'rgba(0,0,0,0.35)', lineHeight: 15 },
  mpDivider:      { width: 1, height: 36, backgroundColor: 'rgba(0,0,0,0.07)' },
  mpInfo:         { flex: 1 },
  mpVenue:        { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 0.3 },
  mpDetail:       { fontSize: 11, color: 'rgba(0,0,0,0.38)', marginTop: 2 },
  mpResult:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.06)' },
  mpResultTxt:    { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: 'rgba(0,0,0,0.4)' },
});
