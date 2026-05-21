import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { isPartidoVisible } from '@/lib/partidos';
import { openMaps, buildMapQuery } from '@/lib/mapas';
import { useNotificacionesCount } from '@/hooks/useNotificacionesCount';
import * as Sentry from '@sentry/react-native';

interface Inscripcion {
  id: string;
  status: string;
  equipo?: string;
  v_partidos: {
    id: string;
    fecha: string;
    hora_inicio: string;
    hora_fin?: string;
    tipo: string;
    complejo_nombre: string;
    complejo_ciudad: string;
    complejo_direccion?: string;
    complejo_foto_url?: string;
    cancha_nombre: string;
    status: string;
    precio_jugador: number;
  };
}

function BellIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={DT.onBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={DT.onBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function CalIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={DT.onSurfaceVar} strokeWidth="1.8"/>
      <Path d="M8 2V6M16 2V6M3 9H21" stroke={DT.onSurfaceVar} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}
function ClockIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={DT.onSurfaceVar} strokeWidth="1.8"/>
      <Path d="M12 7V12L15 14" stroke={DT.onSurfaceVar} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}
function PinIcon() {
  return (
    <Svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={DT.primary} strokeWidth="2"/>
      <Circle cx="12" cy="9" r="2.5" stroke={DT.primary} strokeWidth="2"/>
    </Svg>
  );
}
function BallIcon() {
  return (
    <Svg width="56" height="56" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={DT.primary} strokeWidth="1.5"/>
      <Path d="M12 7L14.5 9L13.5 12H10.5L9.5 9L12 7Z" stroke={DT.primary} strokeWidth="1.3" strokeLinejoin="round"/>
      <Path d="M14.5 9L17.5 9.5M13.5 12L15.5 14.5M10.5 12L8.5 14.5M9.5 9L6.5 9.5M12 7V4.5" stroke={DT.primary} strokeWidth="1.3" strokeLinecap="round"/>
    </Svg>
  );
}

export default function ReservasScreen() {
  const { user }    = useAuth();
  const { request } = useApi();
  const router      = useRouter();

  const [partidos, setPartidos]         = useState<Inscripcion[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [isInfraDown, setIsInfraDown]   = useState(false);
  const { count: notiCount }            = useNotificacionesCount();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoadError(null);
    setIsInfraDown(false);
    try {
      const data = await request('/usuarios/me/partidos');
      const lista = (data.partidos || [])
        .filter((p: Inscripcion) => p.status !== 'cancelado')
        .filter((p: Inscripcion) => p.v_partidos != null)
        .filter((p: Inscripcion) => isPartidoVisible(p.v_partidos?.fecha, p.v_partidos?.hora_inicio))
        .sort((a: Inscripcion, b: Inscripcion) => {
          const fa = `${a.v_partidos?.fecha || '9999'} ${a.v_partidos?.hora_inicio || '99:99'}`;
          const fb = `${b.v_partidos?.fecha || '9999'} ${b.v_partidos?.hora_inicio || '99:99'}`;
          return fa.localeCompare(fb);
        });
      setPartidos(lista);
    } catch (err: any) {
      console.error('[reservas/load]', err?.message);
      if (!err?.isInfraOutage && !err?.isNetworkError) {
        Sentry.captureException(err, {
          tags: { screen: 'reservas', action: 'load' },
        });
      }
      setLoadError(err?.message || 'No se pudo cargar tus reservas. Revisa tu conexión.');
      setIsInfraDown(!!err?.isInfraOutage);
    }
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  function formatFecha(fecha: string) {
    const d = new Date(fecha + 'T00:00:00');
    return {
      dia:  d.getDate().toString().padStart(2, '0'),
      mes:  d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase(),
      full: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerTop}>
            <Text style={styles.title}>Mis <Text style={styles.titleAccent}>Rettas</Text></Text>
            <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notificaciones')}>
              <BellIcon />
              {notiCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeTxt}>{notiCount > 9 ? '9+' : notiCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {loadError && (
            <TouchableOpacity
              style={isInfraDown ? styles.outageBanner : styles.errBanner}
              onPress={() => load()}
              activeOpacity={0.85}
            >
              {isInfraDown ? (
                <>
                  <View style={styles.outageRow}>
                    <Text style={styles.outageIcon}>⚠️</Text>
                    <Text style={styles.outageTitle}>Retta no está disponible</Text>
                  </View>
                  <Text style={styles.outageSub}>
                    Estamos trabajando para resolverlo. Intenta en unos minutos. Toca para reintentar.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.errBannerTitle}>No se pudo actualizar</Text>
                  <Text style={styles.errBannerSub}>Toca para reintentar</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {loading ? (
            <ActivityIndicator color={DT.primary} style={{ marginTop: 60 }} />
          ) : partidos.length === 0 ? (
            /* Empty state glassmorphic — estilo Stitch */
            <View style={styles.empty}>
              <Image
                source={require('../../assets/images/retta-logo-mark.png')}
                style={styles.emptyLogo}
                contentFit="contain"
                tintColor={DT.primary}
              />
              <Text style={styles.emptyTitle}>Aún no tienes <Text style={styles.titleAccent}>Rettas</Text></Text>
              <Text style={styles.emptySub}>Busca partidos cerca de ti y empieza a jugar.</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/partidos')} activeOpacity={0.9} style={{ width: '100%' }}>
                <LinearGradient
                  colors={GRADIENTS.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.exploreBtn}
                >
                  <Text style={styles.exploreBtnTxt}>Explorar Rettas</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Próximo partido — card grande con imagen */}
              {(() => {
                const item = partidos[0];
                const p = item?.v_partidos;
                if (!p) return null;
                const f = formatFecha(p.fecha);
                return (
                  <TouchableOpacity
                    style={styles.nextCard}
                    onPress={() => router.push(`/partido/${p.id}?desde=reservas`)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.nextCardImgWrap}>
                      {p.complejo_foto_url ? (
                        <Image source={{ uri: p.complejo_foto_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                      ) : (
                        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: DT.surfaceHigh }]} />
                      )}
                      <LinearGradient colors={['transparent', 'rgba(12,14,22,0.95)']} style={StyleSheet.absoluteFill} />
                    </View>
                    <View style={styles.nextCardContent}>
                      <View style={styles.nextCardTag}>
                        <View style={styles.nextCardTagDot} />
                        <Text style={styles.nextCardTagTxt}>PRÓXIMO PARTIDO</Text>
                      </View>
                      <Text style={styles.nextCardVenue}>{p.complejo_nombre}</Text>
                      <Text style={styles.nextCardType}>{p.cancha_nombre} · {p.tipo}</Text>
                      <View style={styles.nextCardDetails}>
                        <View style={styles.nextCardPill}>
                          <CalIcon />
                          <View style={{ marginLeft: 8 }}>
                            <Text style={styles.pillDetailLabel}>FECHA</Text>
                            <Text style={styles.pillDetailVal}>{f.full}</Text>
                          </View>
                        </View>
                        <View style={styles.nextCardPill}>
                          <ClockIcon />
                          <View style={{ marginLeft: 8 }}>
                            <Text style={styles.pillDetailLabel}>HORA</Text>
                            <Text style={styles.pillDetailVal}>{p.hora_inicio?.slice(0,5)}</Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.nextCardMaps}
                        onPress={(e) => { e.stopPropagation(); openMaps(buildMapQuery(p.complejo_nombre, p.complejo_ciudad, p.complejo_direccion)); }}
                        activeOpacity={0.7}
                      >
                        <PinIcon />
                        <Text style={styles.nextCardMapsTxt}>CÓMO LLEGAR</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })()}

              {/* Siguientes partidos */}
              {partidos.length > 1 && (
                <Text style={styles.sectionLabel}>SIGUIENTES PARTIDOS</Text>
              )}
              {partidos.slice(1).map(item => {
                const p = item.v_partidos;
                if (!p) return null;
                const f = formatFecha(p.fecha);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.upCard}
                    onPress={() => router.push(`/partido/${p.id}?desde=reservas`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.upRow}>
                      <View style={styles.dateBlock}>
                        <Text style={styles.dateDay}>{f.dia}</Text>
                        <Text style={styles.dateMes}>{f.mes}</Text>
                      </View>
                      <View style={styles.upInfo}>
                        <Text style={styles.upVenue} numberOfLines={1}>{p.complejo_nombre}</Text>
                        <View style={styles.upMeta}>
                          <Text style={styles.upMetaTxt}>{p.cancha_nombre}</Text>
                          <View style={styles.upMetaDot} />
                          <Text style={styles.upMetaTxt}>{p.tipo}</Text>
                        </View>
                      </View>
                      <View style={styles.upTime}>
                        <Text style={styles.upTimeVal}>{p.hora_inicio?.slice(0,5)}</Text>
                        <Text style={styles.upTimeLabel}>HORA</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.upMapsRow}
                      onPress={(e) => { e.stopPropagation(); openMaps(buildMapQuery(p.complejo_nombre, p.complejo_ciudad, p.complejo_direccion)); }}
                      activeOpacity={0.7}
                    >
                      <PinIcon />
                      <Text style={styles.upMapsTxt}>Cómo llegar</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: DT.bg },
  scroll:           { padding: SPACING.gutter, paddingBottom: 40 },
  headerTop:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, paddingTop: 4 },
  title:            { fontSize: 30, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -1 },
  titleAccent:      { color: DT.primary, fontFamily: FONTS.display },
  bellBtn:          { position: 'relative', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  bellBadge:        { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: DT.error, alignItems: 'center', justifyContent: 'center' },
  bellBadgeTxt:     { fontSize: 9, color: '#5a0006', fontFamily: FONTS.bodyBold, lineHeight: 12 },

  errBanner:        { backgroundColor: 'rgba(255,180,171,0.12)', borderWidth: 1, borderColor: 'rgba(255,180,171,0.3)', borderRadius: RADIUS.md, padding: 14, marginBottom: 14 },
  errBannerTitle:   { fontSize: 13, fontFamily: FONTS.bodyBold, color: DT.error, letterSpacing: 0.3 },
  errBannerSub:     { fontSize: 11, color: DT.error, marginTop: 2, opacity: 0.8, fontFamily: FONTS.body },
  outageBanner:     { backgroundColor: 'rgba(250,199,117,0.12)', borderWidth: 1, borderColor: 'rgba(250,199,117,0.3)', borderRadius: RADIUS.md, padding: 16, marginBottom: 14 },
  outageRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  outageIcon:       { fontSize: 18 },
  outageTitle:      { fontSize: 14, fontFamily: FONTS.bodyBold, color: DT.warning, letterSpacing: 0.3 },
  outageSub:        { fontSize: 12, color: DT.warning, lineHeight: 17, opacity: 0.9, fontFamily: FONTS.body },

  // Empty state
  empty:            { alignItems: 'center', paddingTop: 80, paddingHorizontal: 10 },
  emptyLogo:        { width: 96, height: 96, marginBottom: 28, opacity: 0.9 },
  emptyTitle:       { fontSize: 28, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.8, textAlign: 'center', marginBottom: 8 },
  emptySub:         { fontSize: 15, color: DT.onSurfaceVar, fontFamily: FONTS.body, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  exploreBtn:       { height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', shadowColor: DT.primaryContainer, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  exploreBtnTxt:    { fontSize: 16, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.3 },

  // Próximo partido card
  nextCard:         { borderRadius: RADIUS.xl, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: DT.glassBorder },
  nextCardImgWrap:  { position: 'absolute', top: 0, left: 0, right: 0, height: 140, overflow: 'hidden' },
  nextCardContent:  { backgroundColor: DT.surfaceLow, marginTop: 110, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl, padding: SPACING.md, paddingTop: 18 },
  nextCardTag:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(190,194,255,0.15)', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  nextCardTagDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: DT.primary },
  nextCardTagTxt:   { fontSize: 10, fontFamily: FONTS.mono, color: DT.primary, letterSpacing: 1 },
  nextCardVenue:    { fontSize: 26, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, marginBottom: 4 },
  nextCardType:     { fontSize: 13, color: DT.onSurfaceVar, marginBottom: 16, fontFamily: FONTS.body },
  nextCardDetails:  { flexDirection: 'row', gap: 10 },
  nextCardPill:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.md, padding: 12, flex: 1 },
  pillDetailLabel:  { fontSize: 9, color: DT.outline, fontFamily: FONTS.mono, letterSpacing: 0.5, marginBottom: 2 },
  pillDetailVal:    { fontSize: 13, color: DT.onBg, fontFamily: FONTS.bodyMed },
  nextCardMaps:     { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: 'rgba(190,194,255,0.10)', borderWidth: 1, borderColor: 'rgba(190,194,255,0.25)' },
  nextCardMapsTxt:  { fontSize: 11, fontFamily: FONTS.mono, color: DT.primary, letterSpacing: 1 },

  sectionLabel:     { fontSize: 11, fontFamily: FONTS.mono, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 12, marginTop: 8, paddingLeft: 2 },

  // Siguientes partidos card
  upCard:           { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  upRow:            { flexDirection: 'row', alignItems: 'center', gap: 14 },
  upMapsRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: DT.glassBorder },
  upMapsTxt:        { fontSize: 12, fontFamily: FONTS.bodyMed, color: DT.primary, letterSpacing: 0.2 },
  dateBlock:        { width: 50, backgroundColor: 'rgba(190,194,255,0.10)', borderWidth: 1, borderColor: 'rgba(190,194,255,0.2)', borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  dateDay:          { fontSize: 22, color: DT.primary, fontFamily: FONTS.display, lineHeight: 24 },
  dateMes:          { fontSize: 9, color: DT.primary, fontFamily: FONTS.mono, letterSpacing: 0.5, marginTop: 1 },
  upInfo:           { flex: 1 },
  upVenue:          { fontSize: 16, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.2, marginBottom: 5 },
  upMeta:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  upMetaTxt:        { fontSize: 11.5, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  upMetaDot:        { width: 3, height: 3, borderRadius: 2, backgroundColor: DT.outline },
  upTime:           { alignItems: 'flex-end' },
  upTimeVal:        { fontSize: 16, color: DT.onBg, fontFamily: FONTS.monoMed },
  upTimeLabel:      { fontSize: 9, color: DT.outline, fontFamily: FONTS.mono, letterSpacing: 0.5, marginTop: 1 },
});
