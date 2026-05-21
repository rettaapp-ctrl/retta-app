import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
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
import { LinearGradient } from 'expo-linear-gradient';
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

function ratingLabel(rating: number): string {
  if (rating < 2.0) return 'Principiante';
  if (rating < 3.0) return 'Intermedio bajo';
  if (rating < 4.0) return 'Intermedio';
  if (rating < 5.0) return 'Avanzado';
  if (rating < 6.0) return 'Élite';
  return 'Pro';
}

function FlameIcon({ size = 20, color = DT.primary }: { size?: number; color?: string }) {
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
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={DT.onBg} strokeWidth="1.8"/>
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={DT.onBg} strokeWidth="1.8"/>
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={DT.onBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={DT.onBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function AvatarPlaceholder() {
  return (
    <Svg width="46" height="46" viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="18" r="9" fill={DT.outline}/>
      <Path d="M6 42C6 33.2 14.1 26 24 26C33.9 26 42 33.2 42 42" fill={DT.outline}/>
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
      const [partidosRes, amigosRes, pendRes] = await Promise.all([
        request('/usuarios/me/partidos').catch(() => ({ partidos: [] })),
        request('/amistades').catch(() => ({ amigos: [] })),
        request('/amistades/pendientes').catch(() => ({ solicitudes: [] })),
        refreshUser().catch(() => {}),
      ]);
      const anteriores = (partidosRes.partidos || [])
        .filter((p: Inscripcion) => p.v_partidos != null)
        .filter((p: Inscripcion) => !isPartidoVisible(p.v_partidos.fecha, p.v_partidos.hora_inicio))
        .sort((a: Inscripcion, b: Inscripcion) => {
          const fa = `${a.v_partidos?.fecha || ''} ${a.v_partidos?.hora_inicio || ''}`;
          const fb = `${b.v_partidos?.fecha || ''} ${b.v_partidos?.hora_inicio || ''}`;
          return fb.localeCompare(fa);
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
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.primary} />}
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
            <LinearGradient
              colors={GRADIENTS.dayActive}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                {user?.avatar_url
                  ? <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 42 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                  : <AvatarPlaceholder />
                }
              </View>
            </LinearGradient>
            <Text style={styles.profileName}>
              {(user?.nombre || '')} {(user?.apellido || '')}
            </Text>
            <Text style={styles.profileSub}>
              {posSubtitle ? `${posSubtitle} · ` : ''}{ciudadLabel}
            </Text>
          </View>

          {/* Racha */}
          <View style={styles.rachaCard}>
            <View style={styles.rachaIcon}>
              <FlameIcon size={28} color={racha > 0 ? DT.primary : DT.outline} />
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

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{user?.partidos_jug ?? 0}</Text>
              <Text style={styles.statLabel}>PARTIDOS{'\n'}JUGADOS</Text>
            </View>
            <View style={[styles.statCell, styles.statCellBorder]}>
              <Text style={styles.statNum}>{user?.partidos_gan ?? 0}</Text>
              <Text style={styles.statLabel}>PARTIDOS{'\n'}GANADOS</Text>
            </View>
            <TouchableOpacity
              style={[styles.statCell, styles.statCellBorder, styles.statCellTappable]}
              onPress={() => router.push('/amigos')}
              activeOpacity={0.6}
            >
              <Text style={styles.statNum}>{amigosCount}</Text>
              <Text style={styles.statLabel}>AMIGOS</Text>
              <View style={styles.statCta}>
                <Text style={styles.statCtaTxt}>VER ›</Text>
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
              <Text style={styles.cardTitle}>PARTIDOS ANTERIORES</Text>
              {partidos.length > 3 && (
                <TouchableOpacity onPress={() => setVerTodos(!verTodos)}>
                  <Text style={styles.verTodos}>{verTodos ? 'Ver menos' : 'Ver todos →'}</Text>
                </TouchableOpacity>
              )}
            </View>
            {loading ? (
              <ActivityIndicator color={DT.primary} style={{ margin: 16 }} />
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
                      <Text style={styles.mpVenue} numberOfLines={1}>{p.complejo_nombre} — {p.cancha_nombre}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: DT.bg },
  scroll:         { padding: SPACING.gutter, paddingBottom: 40 },
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingBottom: 4 },
  iconBtn:        { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, position: 'relative' },
  bellBadge:      { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: DT.error, alignItems: 'center', justifyContent: 'center' },
  bellBadgeTxt:   { fontSize: 9, color: '#5a0006', fontFamily: FONTS.bodyBold, lineHeight: 12 },
  hero:           { alignItems: 'center', paddingVertical: 18 },
  avatarRing:     { width: 96, height: 96, borderRadius: 48, padding: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: DT.primaryContainer, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  avatarInner:    { width: '100%', height: '100%', borderRadius: 45, backgroundColor: DT.surfaceHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileName:    { fontSize: 26, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, lineHeight: 30, textAlign: 'center' },
  profileSub:     { fontSize: 13, color: DT.onSurfaceVar, marginTop: 5, fontFamily: FONTS.body },
  rachaCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  rachaIcon:      { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(190,194,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rachaInfo:      { flex: 1 },
  rachaTitle:     { fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.5, color: DT.onSurfaceVar },
  rachaNum:       { fontSize: 20, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.3, marginTop: 3 },
  rachaRecord:    { fontSize: 11.5, color: DT.outline, marginTop: 3, fontFamily: FONTS.body },
  statsRow:       { flexDirection: 'row', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 14 },
  statCell:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 8 },
  statCellBorder: { borderLeftWidth: 1, borderColor: DT.glassBorder },
  statCellTappable:{ backgroundColor: 'rgba(190,194,255,0.06)' },
  statCta:        { marginTop: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(190,194,255,0.15)' },
  statCtaTxt:     { fontSize: 10, fontFamily: FONTS.bodyBold, color: DT.primary, letterSpacing: 1 },
  statBadge:      { position: 'absolute', top: 8, right: 12, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: DT.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  statBadgeTxt:   { fontSize: 11, color: '#5a0006', fontFamily: FONTS.bodyBold },
  statNum:        { fontSize: 26, color: DT.onBg, fontFamily: FONTS.display, lineHeight: 28 },
  statLabel:      { fontSize: 9, color: DT.outline, marginTop: 5, textAlign: 'center', lineHeight: 13, fontFamily: FONTS.mono, letterSpacing: 0.5 },
  card:           { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, marginBottom: 12, overflow: 'hidden' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: DT.glassBorder },
  cardTitle:      { fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1.5, color: DT.onSurfaceVar },
  verTodos:       { fontSize: 12, color: DT.primary, fontFamily: FONTS.bodyMed },
  infoRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: DT.glassBorder },
  infoKey:        { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  infoVal:        { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyMed, letterSpacing: 0.2 },
  emptyPartidos:  { padding: 24, alignItems: 'center' },
  emptyTxt:       { color: DT.outline, fontSize: 13, fontFamily: FONTS.body },
  matchPrev:      { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: DT.glassBorder, gap: 12 },
  mpDate:         { minWidth: 42, alignItems: 'center' },
  mpDateDay:      { fontSize: 15, color: DT.primary, fontFamily: FONTS.heading, lineHeight: 17 },
  mpDateMes:      { fontSize: 10, color: DT.outline, fontFamily: FONTS.mono, lineHeight: 14 },
  mpDivider:      { width: 1, height: 36, backgroundColor: DT.glassBorder },
  mpInfo:         { flex: 1 },
  mpVenue:        { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyMed, letterSpacing: 0.2 },
  mpDetail:       { fontSize: 11.5, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },
  mpResult:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  mpResultTxt:    { fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 0.5, color: DT.onSurfaceVar },
});
