// ═══════════════════════════════════════════════════════════════
// RETTA — Perfil propio (rediseño 2026-07-21, aprobado por Rafael y Foco)
// Los bloques visuales (stats, posición|nivel, rating con gráfica y
// racha) viven en components/PerfilBloques.tsx y se comparten con el
// perfil público (app/usuario/[id].tsx) para que se vean idénticos.
// ═══════════════════════════════════════════════════════════════
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useNotificacionesCount } from '@/hooks/useNotificacionesCount';
import { StatsRow, PosNivelRow, RatingCard, RachaCard, RatingPunto } from '@/components/PerfilBloques';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

// Throttle del refetch del perfil: cada focus del tab disparaba 4 requests
// (amigos, solicitudes, historial de rating y /auth/me con recálculo de
// stats). Cambiando de tab seguido eso ayudó a tirar el rate limiter global
// (issue Sentry 2026-07-21). Con 30s de TTL el focus repetido reutiliza lo
// que ya se tiene; el pull-to-refresh siempre fuerza.
const PERFIL_TTL_MS = 30_000;
let ultimoLoadPerfil = 0;

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

function EditIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={DT.onBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function AvatarPlaceholder() {
  return (
    <Svg width="60" height="60" viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="18" r="9" fill={DT.outline}/>
      <Path d="M6 42C6 33.2 14.1 26 24 26C33.9 26 42 33.2 42 42" fill={DT.outline}/>
    </Svg>
  );
}

export default function PerfilScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { request } = useApi();
  const [historial, setHistorial]   = useState<RatingPunto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [amigosCount, setAmigosCount] = useState(0);
  const [solicitudesCount, setSolicitudesCount] = useState(0);
  const { count: notiCount } = useNotificacionesCount();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load(force = false) {
    if (!force && Date.now() - ultimoLoadPerfil < PERFIL_TTL_MS) {
      setRefreshing(false);
      return;
    }
    try {
      const [amigosRes, pendRes, ratingRes] = await Promise.all([
        request('/amistades').catch(() => ({ amigos: [] })),
        request('/amistades/pendientes').catch(() => ({ solicitudes: [] })),
        request('/usuarios/me/rating-historial').catch(() => ({ historial: [] })),
        refreshUser().catch(() => {}),
      ]);
      ultimoLoadPerfil = Date.now();
      setHistorial(ratingRes.historial || []);
      setAmigosCount((amigosRes.amigos || []).length);
      setSolicitudesCount((pendRes.solicitudes || []).length);
    } catch {}
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, []);

  const rating     = user?.rating ?? 5.0;
  const calibrando = user?.rating_calibrando ?? false;
  const racha      = user?.racha_actual ?? 0;
  const rachaMax   = user?.racha_max ?? 0;

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

          {/* Hero: avatar grande, nombre solo, botón editar */}
          <View style={styles.hero}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {user?.avatar_url
                  ? <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 70 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                  : <AvatarPlaceholder />
                }
              </View>
            </View>
            <Text style={styles.profileName}>
              {(user?.nombre || '')} {(user?.apellido || '')}
            </Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/editar-perfil')} activeOpacity={0.75}>
              <Text style={styles.editBtnTxt}>Editar perfil</Text>
              <EditIcon />
            </TouchableOpacity>
          </View>

          <StatsRow
            jugados={user?.partidos_jug ?? 0}
            ganados={user?.partidos_gan ?? 0}
            amigos={amigosCount}
            badge={solicitudesCount}
            onJugados={() => router.push({ pathname: '/historial-partidos', params: { filtro: 'jugados' } })}
            onGanados={() => router.push({ pathname: '/historial-partidos', params: { filtro: 'ganados' } })}
            onAmigos={() => router.push('/amigos')}
          />

          <PosNivelRow posicion={user?.posicion} rating={rating} calibrando={calibrando} />

          <RatingCard
            rating={rating}
            historial={historial}
            calibrando={calibrando}
            partidosCalibracion={user?.partidos_calibracion ?? 0}
            onPress={() => router.push('/rating')}
          />

          <RachaCard
            racha={racha}
            rachaMax={rachaMax}
            onBuscarPartido={() => router.push('/(tabs)/partidos')}
          />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: DT.bg },
  scroll:         { padding: SPACING.gutter, paddingBottom: 40 },
  // Idéntico paddingTop/Bottom que partidos.tsx y reservas.tsx para que la
  // campana quede alineada al pixel exacto al cambiar de tab.
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingBottom: 14 },
  iconBtn:        { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, position: 'relative' },
  bellBadge:      { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: DT.error, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: DT.bg },
  bellBadgeTxt:   { fontSize: 9, color: '#5a0006', fontFamily: FONTS.bodyBold, lineHeight: 12 },

  hero:           { alignItems: 'center', paddingVertical: 14 },
  avatarRing:     { width: 148, height: 148, borderRadius: 74, padding: 5, borderWidth: 3, borderColor: DT.primaryStrong, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: DT.primaryContainer, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  avatarInner:    { width: '100%', height: '100%', borderRadius: 70, backgroundColor: DT.surfaceHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileName:    { fontSize: 27, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, lineHeight: 32, textAlign: 'center' },
  editBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, paddingHorizontal: 22, paddingVertical: 11, borderRadius: RADIUS.full, backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorderStrong },
  editBtnTxt:     { fontSize: 13, color: DT.onBg, fontFamily: FONTS.monoMed, letterSpacing: 0.3 },
});
