import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants';
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
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function CalIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8"/>
      <Path d="M8 2V6M16 2V6M3 9H21" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}
function ClockIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8"/>
      <Path d="M12 7V12L15 14" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}
function PinIcon() {
  return (
    <Svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="rgba(0,0,0,0.3)"/>
      <Circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
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
        // Filtrar inscripciones huérfanas (partido cuya cancha/complejo fue desactivado)
        .filter((p: Inscripcion) => p.v_partidos != null)
        .filter((p: Inscripcion) => isPartidoVisible(p.v_partidos?.fecha, p.v_partidos?.hora_inicio))
        // Ordenar por fecha+hora del partido ASC (más próximo primero)
        .sort((a: Inscripcion, b: Inscripcion) => {
          const fa = `${a.v_partidos?.fecha || '9999'} ${a.v_partidos?.hora_inicio || '99:99'}`;
          const fb = `${b.v_partidos?.fecha || '9999'} ${b.v_partidos?.hora_inicio || '99:99'}`;
          return fa.localeCompare(fb);
        });
      setPartidos(lista);
    } catch (err: any) {
      // NO vaciamos las reservas en error — mantener las que ya teníamos
      // cargadas y avisar al user para que reintente.
      console.error('[reservas/load]', err?.message);
      // No reportar outages de infra a Sentry (ruido — todos los usuarios
      // lo reportarían). Solo errores de aplicación reales.
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
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>PRÓXIMOS{'\n'}PARTIDOS</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notificaciones')}>
            <BellIcon />
            {notiCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeTxt}>{notiCount > 9 ? '9+' : notiCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter pill */}
        <View style={styles.filterRow}>
          <View style={styles.pillActive}><Text style={styles.pillActiveTxt}>Todos</Text></View>
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
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : partidos.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Text style={{ fontSize: 32 }}>⚽</Text></View>
            <Text style={styles.emptyTitle}>Sin reservas aún</Text>
            <Text style={styles.emptySub}>Explora partidos disponibles y únete</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/partidos')}>
              <Text style={styles.exploreBtnTxt}>EXPLORAR PARTIDOS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Próximo partido — big card con imagen */}
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
                      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a2e1a' }]} />
                    )}
                    <View style={styles.nextCardImgOverlay} />
                  </View>
                  <View style={styles.nextCardContent}>
                    <View style={styles.nextCardTag}>
                      <View style={styles.nextCardTagDot} />
                      <Text style={styles.nextCardTagTxt}>Próximo partido</Text>
                    </View>
                    <Text style={styles.nextCardVenue}>{p.complejo_nombre}</Text>
                    <Text style={styles.nextCardType}>{p.cancha_nombre} · {p.tipo}</Text>
                    <View style={styles.nextCardDetails}>
                      <View style={styles.nextCardPill}>
                        <CalIcon />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={styles.pillDetailLabel}>Fecha</Text>
                          <Text style={styles.pillDetailVal}>{f.full}</Text>
                        </View>
                      </View>
                      <View style={styles.nextCardPill}>
                        <ClockIcon />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={styles.pillDetailLabel}>Hora</Text>
                          <Text style={styles.pillDetailVal}>{p.hora_inicio?.slice(0,5)}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.nextCardMaps}
                      onPress={(e) => { e.stopPropagation(); openMaps(buildMapQuery(p.complejo_nombre, p.complejo_ciudad, p.complejo_direccion)); }}
                      activeOpacity={0.7}
                    >
                      <Svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={COLORS.accent} strokeWidth="2"/>
                        <Circle cx="12" cy="9" r="2.5" stroke={COLORS.accent} strokeWidth="2"/>
                      </Svg>
                      <Text style={styles.nextCardMapsTxt}>CÓMO LLEGAR</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })()}

            {/* Siguientes partidos */}
            {partidos.length > 1 && (
              <Text style={styles.sectionLabel}>Siguientes partidos</Text>
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
                  activeOpacity={0.7}
                >
                  <View style={styles.upRow}>
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateDay}>{f.dia}</Text>
                      <Text style={styles.dateMes}>{f.mes}</Text>
                    </View>
                    <View style={styles.upInfo}>
                      <Text style={styles.upVenue}>{p.complejo_nombre}</Text>
                      <View style={styles.upMeta}>
                        <PinIcon />
                        <Text style={styles.upMetaTxt}>{p.cancha_nombre}</Text>
                        <View style={styles.upMetaDot} />
                        <Text style={styles.upMetaTxt}>{p.tipo}</Text>
                      </View>
                    </View>
                    <View style={styles.upTime}>
                      <Text style={styles.upTimeVal}>{p.hora_inicio?.slice(0,5)}</Text>
                      <Text style={styles.upTimeLabel}>Hora</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.upMapsRow}
                    onPress={(e) => { e.stopPropagation(); openMaps(buildMapQuery(p.complejo_nombre, p.complejo_ciudad, p.complejo_direccion)); }}
                    activeOpacity={0.7}
                  >
                    <Svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#111" strokeWidth="2"/>
                      <Circle cx="12" cy="9" r="2.5" stroke="#111" strokeWidth="2"/>
                    </Svg>
                    <Text style={styles.upMapsTxt}>Cómo llegar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#F8F8F6' },
  scroll:           { padding: 20, paddingBottom: 40 },
  headerTop:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 16 },
  greeting:         { fontSize: 12, color: 'rgba(0,0,0,0.38)', fontWeight: '500', letterSpacing: 0.4, marginBottom: 4 },
  title:            { fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: 0.5, lineHeight: 32 },
  bellBtn:          { padding: 4, marginTop: 6, position: 'relative' },
  bellDot:          { position: 'absolute', top: 2, right: 2, width: 7, height: 7, backgroundColor: COLORS.accent, borderRadius: 4, borderWidth: 1.5, borderColor: '#F8F8F6' },
  bellBadge:        { position: 'absolute', top: -2, right: -4, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: '#D62B2B', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F8F8F6' },
  bellBadgeTxt:     { fontSize: 10, fontWeight: '900', color: '#fff', lineHeight: 12 },
  filterRow:        { flexDirection: 'row', marginBottom: 16 },
  pillActive:       { backgroundColor: COLORS.accent, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  errBanner:        { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2', borderRadius: 14, padding: 14, marginBottom: 12 },
  errBannerTitle:   { fontSize: 13, fontWeight: '900', color: '#C62828', letterSpacing: 0.3 },
  errBannerSub:     { fontSize: 11, color: '#C62828', marginTop: 2, opacity: 0.75 },
  outageBanner:     { backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#FFD180', borderRadius: 14, padding: 16, marginBottom: 12 },
  outageRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  outageIcon:       { fontSize: 18 },
  outageTitle:      { fontSize: 14, fontWeight: '900', color: '#A6541D', letterSpacing: 0.3 },
  outageSub:        { fontSize: 12, color: '#A6541D', lineHeight: 17, opacity: 0.85 },
  pillActiveTxt:    { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyIcon:        { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F2F1EF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:       { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 6 },
  emptySub:         { fontSize: 13, color: 'rgba(0,0,0,0.38)', marginBottom: 24 },
  exploreBtn:       { backgroundColor: '#111', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  exploreBtnTxt:    { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  nextCard:         { borderRadius: 22, marginBottom: 16, overflow: 'hidden' },
  nextCardImgWrap:  { position: 'absolute', top: 0, left: 0, right: 0, height: 130, overflow: 'hidden' },
  nextCardImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  nextCardContent:  { backgroundColor: '#111', marginTop: 100, borderRadius: 22, padding: 20, paddingTop: 16 },
  nextCardTag:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.accent, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 },
  nextCardTagDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: '#000' },
  nextCardTagTxt:   { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 1 },
  nextCardVenue:    { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginBottom: 4 },
  nextCardType:     { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  nextCardDetails:  { flexDirection: 'row', gap: 10 },
  nextCardPill:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, flex: 1 },
  pillDetailLabel:  { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, marginBottom: 1 },
  pillDetailVal:    { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  sectionLabel:     { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.28)', letterSpacing: 1.5, marginBottom: 10, marginTop: 4, paddingLeft: 2 },
  upCard:           { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  upRow:            { flexDirection: 'row', alignItems: 'center', gap: 14 },
  upMapsRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  upMapsTxt:        { fontSize: 12, fontWeight: '700', color: '#111', letterSpacing: 0.3 },
  nextCardMaps:     { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderRadius: 12, backgroundColor: 'rgba(122,184,0,0.13)', borderWidth: 1, borderColor: 'rgba(122,184,0,0.3)' },
  nextCardMapsTxt:  { fontSize: 11, fontWeight: '800', color: COLORS.accent, letterSpacing: 1.2 },
  dateBlock:        { width: 46, backgroundColor: '#F2F1EF', borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  dateDay:          { fontSize: 22, fontWeight: '900', color: '#111', lineHeight: 24 },
  dateMes:          { fontSize: 9, fontWeight: '600', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 },
  upInfo:           { flex: 1 },
  upVenue:          { fontSize: 16, fontWeight: '800', color: '#111', letterSpacing: 0.3, marginBottom: 5 },
  upMeta:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upMetaTxt:        { fontSize: 11, color: 'rgba(0,0,0,0.38)' },
  upMetaDot:        { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)' },
  upTime:           { alignItems: 'flex-end' },
  upTimeVal:        { fontSize: 15, fontWeight: '800', color: '#111' },
  upTimeLabel:      { fontSize: 9, color: 'rgba(0,0,0,0.28)', letterSpacing: 0.5 },
});
