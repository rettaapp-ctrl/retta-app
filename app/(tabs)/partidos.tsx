import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { isPartidoVisible } from '@/lib/partidos';
import { useNotificacionesCount } from '@/hooks/useNotificacionesCount';
import { useCalificacionesPendientes } from '@/hooks/useCalificacionesPendientes';
import { openMaps, buildMapQuery } from '@/lib/mapas';
import * as Sentry from '@sentry/react-native';

interface Partido {
  id: string;
  complejo_nombre: string;
  complejo_ciudad: string;
  cancha_nombre: string;
  fecha: string;
  hora_inicio: string;
  tipo: string;
  precio_jugador: number;
  precio_final?: number;          // viene de v_partidos con descuento aplicado
  descuento_porcentaje?: number;
  jugadores_confirmados: number;
  max_jugadores: number;
  status: string;
  complejo_id: string;
  complejo_foto_url?: string;
  complejo_email?: string;
  complejo_direccion?: string;
}

function SearchIcon() {
  return (
    <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke="rgba(0,0,0,0.3)" strokeWidth="2"/>
      <Path d="M16.5 16.5L21 21" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round"/>
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

function toLocalISO(d: Date) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getDays() {
  const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      iso:   toLocalISO(d),     // ← FIX timezone: usar local en lugar de toISOString (UTC)
      dia:   DIAS[d.getDay()],
      num:   d.getDate(),
      mes:   MESES[d.getMonth()],
      today: i === 0,
    };
  });
}

const DAYS = getDays();

export default function PartidosScreen() {
  const { request } = useApi();
  const { user }    = useAuth();
  const router      = useRouter();

  const [activeDate, setActiveDate] = useState(DAYS[0].iso);
  const [partidos, setPartidos]     = useState<Partido[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { count: notiCount }        = useNotificacionesCount();
  const { count: calPendientesCount } = useCalificacionesPendientes();
  const [search, setSearch]         = useState('');
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [isInfraDown, setIsInfraDown] = useState(false);
  const [inscritoIds, setInscritoIds] = useState<Set<string>>(new Set());

  async function loadPartidos(fecha: string) {
    setLoading(true);
    setLoadError(null);
    setIsInfraDown(false);
    try {
      const [partidosData, inscData] = await Promise.all([
        request(`/partidos?fecha=${fecha}&limit=50&status=abierto`),
        request('/usuarios/me/partidos').catch(() => ({ partidos: [] })),
      ]);
      setPartidos(
        (partidosData.partidos || []).filter((p: Partido) => isPartidoVisible(p.fecha, p.hora_inicio))
      );
      const ids = new Set<string>(
        (inscData.partidos || [])
          .filter((i: any) => i.status === 'confirmado')
          .map((i: any) => i.v_partidos?.id)
          .filter(Boolean)
      );
      setInscritoIds(ids);
    } catch (err: any) {
      // NO vaciamos el state — si ya teníamos partidos cargados, los
      // mantenemos y mostramos banner de error. Esto evita que un
      // error transitorio (rate limit, network, refresh token) borre
      // visualmente las reservas del usuario.
      console.error('[partidos/load]', err?.message);
      // Solo reportar a Sentry si NO es outage de infra — los outages
      // de Railway son ruido (todos los usuarios los reportarían).
      if (!err?.isInfraOutage && !err?.isNetworkError) {
        Sentry.captureException(err, {
          tags: { screen: 'partidos', action: 'loadPartidos' },
          extra: { fecha, userId: user?.id },
        });
      }
      setLoadError(err?.message || 'No se pudo cargar. Revisa tu conexión.');
      setIsInfraDown(!!err?.isInfraOutage);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadPartidos(activeDate); }, [activeDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPartidos(activeDate);
  }, [activeDate]);

  function selectDay(iso: string) {
    setActiveDate(iso);
    setSearch('');
  }

  // Memoizar para evitar recalcular en cada render (especialmente al teclear en buscador)
  const filtered = useMemo(() => {
    if (!search) return partidos;
    const q = search.toLowerCase();
    return partidos.filter(p =>
      p.complejo_nombre?.toLowerCase().includes(q) ||
      p.complejo_ciudad?.toLowerCase().includes(q) ||
      p.cancha_nombre?.toLowerCase().includes(q)
    );
  }, [partidos, search]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc: Record<string, Partido[]>, p) => {
      const key = p.complejo_nombre || 'Complejo';
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});
  }, [filtered]);

  function formatHora(hora: string) {
    const [h, m] = hora.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12  = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return { h: `${h12}:${m}`, ampm };
  }

  const selectedDay = DAYS.find(d => d.iso === activeDate) || DAYS[0];

  return (
    <SafeAreaView style={styles.root}>
      {/* Header fijo */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.username}>
              {(user?.nombre || '').toUpperCase()} {(user?.apellido || '').toUpperCase()}
            </Text>
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

        {/* Buscador */}
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por complejo o cancha…"
            placeholderTextColor="rgba(0,0,0,0.25)"
          />
        </View>

        {/* Day tabs */}
        <View style={styles.daysRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d.iso}
              style={[styles.dayTab, d.iso === activeDate && styles.dayTabActive]}
              onPress={() => selectDay(d.iso)}
            >
              <Text style={[styles.dayTabName, d.iso === activeDate && styles.dayTabNameActive]}>
                {d.today ? 'HOY' : d.dia.toUpperCase()}
              </Text>
              <Text style={[styles.dayTabNum, d.iso === activeDate && styles.dayTabNumActive]}>
                {d.num}
              </Text>
              {d.today && d.iso === activeDate && (
                <View style={styles.dayTabDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {loadError && (
            <TouchableOpacity
              style={isInfraDown ? styles.outageBanner : styles.errBanner}
              onPress={() => loadPartidos(activeDate)}
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

          {calPendientesCount > 0 && (
            <TouchableOpacity
              style={styles.calBanner}
              onPress={() => router.push('/calificar')}
              activeOpacity={0.85}
            >
              <View style={styles.calBannerStar}>
                <Text style={{ fontSize: 18 }}>⭐</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calBannerTitle}>
                  Califica a tus compañeros
                </Text>
                <Text style={styles.calBannerSub}>
                  Tienes {calPendientesCount} {calPendientesCount === 1 ? 'calificación pendiente' : 'calificaciones pendientes'}
                </Text>
              </View>
              <Text style={styles.calBannerArrow}>›</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionLabel}>
            {selectedDay.today
              ? 'Partidos disponibles hoy'
              : `Partidos · ${selectedDay.dia} ${selectedDay.num} ${selectedDay.mes}`}
          </Text>

          {Object.keys(grouped).length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Text style={{ fontSize: 32 }}>⚽</Text>
              </View>
              <Text style={styles.emptyTitle}>Sin partidos este día</Text>
              <Text style={styles.emptySub}>Intenta con otro día o revisa más tarde</Text>
            </View>
          ) : (
            Object.entries(grouped).map(([nombre, ps]) => (
              <View key={nombre} style={styles.venueBlock}>
                {/* Banner del complejo — clickeable */}
                <TouchableOpacity
                  style={styles.venueBanner}
                  onPress={() => router.push(`/complejo/${ps[0]?.complejo_id}`)}
                  activeOpacity={0.92}
                >
                  <View style={styles.venueBannerBg} />
                  {ps[0]?.complejo_foto_url ? (
                    <Image
                      source={{ uri: ps[0].complejo_foto_url }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={150}
                    />
                  ) : null}
                  <View style={styles.venueOverlay}>
                    <Text style={styles.venueOverlayName}>{nombre}</Text>
                    <Text style={styles.venueOverlaySub}>
                      {ps[0]?.complejo_ciudad} · {ps.length} partido{ps.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.venueMapsBtn}
                    onPress={(e) => { e.stopPropagation(); openMaps(buildMapQuery(ps[0]?.complejo_nombre, ps[0]?.complejo_ciudad, ps[0]?.complejo_direccion)); }}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#fff" strokeWidth="2"/>
                      <Circle cx="12" cy="9" r="2.5" stroke="#fff" strokeWidth="2"/>
                    </Svg>
                    <Text style={styles.venueMapsBtnTxt}>Cómo llegar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Cards de partido */}
                {ps.map(p => {
                  const { h, ampm } = formatHora(p.hora_inicio || '00:00');
                  const libres   = p.max_jugadores - (p.jugadores_confirmados || 0);
                  const pct      = (p.jugadores_confirmados || 0) / p.max_jugadores;
                  const lleno    = libres <= 0;
                  const inscrito = inscritoIds.has(p.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.matchCard,
                        lleno && !inscrito && styles.matchCardLleno,
                      ]}
                      onPress={() => router.push(`/partido/${p.id}`)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.matchAccent, lleno && !inscrito && styles.matchAccentLleno]} />

                      {/* Hora */}
                      <View style={styles.matchTimeCol}>
                        <Text style={[styles.matchTimeBig, lleno && !inscrito && styles.textMuted]}>{h}</Text>
                        <Text style={styles.matchAmpm}>{ampm}</Text>
                      </View>

                      <View style={styles.dividerV} />

                      {/* Info */}
                      <View style={styles.matchInfo}>
                        <Text style={[styles.matchTitle, lleno && !inscrito && styles.textMuted]} numberOfLines={1}>
                          {p.cancha_nombre || 'Cancha'} · {p.tipo}
                        </Text>
                        <View style={styles.matchMeta}>
                          {/* Si YA estás inscrito, no muestra el descuento (solo aplica a nuevos).
                              Si NO estás inscrito y hay descuento vigente, muestra el badge. */}
                          {(!inscrito && p.descuento_porcentaje && p.descuento_porcentaje > 0) ? (
                            <View style={styles.tagDescuento}>
                              {p.descuento_porcentaje === 100 ? (
                                <Text style={styles.tagDescuentoGratisTxt}>¡GRATIS!</Text>
                              ) : (
                                <>
                                  <Text style={styles.tagDescuentoOldTxt}>${p.precio_jugador}</Text>
                                  <Text style={styles.tagDescuentoNewTxt}>${p.precio_final ?? p.precio_jugador} MXN</Text>
                                  <Text style={styles.tagDescuentoPctTxt}>-{p.descuento_porcentaje}%</Text>
                                </>
                              )}
                            </View>
                          ) : (
                            <View style={styles.tagPrice}>
                              <Text style={styles.tagPriceTxt}>${p.precio_jugador} MXN</Text>
                            </View>
                          )}
                          <View style={[styles.tagFormat, lleno && !inscrito && styles.tagFormatLleno]}>
                            <Text style={[styles.tagFormatTxt, lleno && !inscrito && styles.tagFormatTxtLleno]}>
                              {lleno ? 'LLENO' : p.tipo}
                            </Text>
                          </View>
                        </View>
                        {/* Barra de ocupación */}
                        <View style={styles.progressBar}>
                          <View style={[
                            styles.progressFill,
                            { width: `${Math.min(pct * 100, 100)}%` },
                            pct >= 0.9 && styles.progressFillRed,
                          ]} />
                        </View>
                      </View>

                      {/* Lugares libres / Inscrito */}
                      <View style={styles.matchSpots}>
                        {inscrito ? (
                          <View style={styles.inscritoBadge}>
                            <Text style={styles.inscritoBadgeTxt}>INSCRITO</Text>
                          </View>
                        ) : (
                          <>
                            <Text style={[styles.spotsCount, lleno && styles.textMuted]}>
                              {lleno ? '—' : libres}
                            </Text>
                            <Text style={styles.spotsLabel}>
                              {lleno ? 'lleno' : `lugar${libres !== 1 ? 'es' : ''}\nlibre${libres !== 1 ? 's' : ''}`}
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#F8F8F6' },
  header:            { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  headerTop:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  greeting:          { fontSize: 12, color: 'rgba(0,0,0,0.38)', letterSpacing: 0.4 },
  username:          { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: 0.2, marginTop: 2 },
  bellBtn:           { position: 'relative', padding: 4 },
  bellDot:           { position: 'absolute', top: 2, right: 2, width: 8, height: 8, backgroundColor: COLORS.accent, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  bellBadge:         { position: 'absolute', top: -2, right: -4, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: '#D62B2B', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  bellBadgeTxt:      { fontSize: 10, fontWeight: '900', color: '#fff', lineHeight: 12 },
  searchBox:         { backgroundColor: '#F2F1EF', borderRadius: 12, height: 42, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 14 },
  searchInput:       { flex: 1, fontSize: 14, color: '#111', letterSpacing: 0, fontFamily: undefined },
  daysRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 14, gap: 5 },
  dayTab:            { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: '#F2F1EF' },
  dayTabActive:      { backgroundColor: '#111' },
  dayTabName:        { fontSize: 8, fontWeight: '700', color: 'rgba(0,0,0,0.35)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  dayTabNameActive:  { color: COLORS.accent },
  dayTabNum:         { fontSize: 18, fontWeight: '900', color: '#111', lineHeight: 20 },
  dayTabNumActive:   { color: '#fff' },
  dayTabDot:         { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.accent, marginTop: 2 },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  scroll:            { padding: 20, paddingTop: 0, paddingBottom: 40 },
  sectionLabel:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: 'rgba(0,0,0,0.3)', marginBottom: 14, marginTop: 20, paddingLeft: 2, textTransform: 'uppercase' },
  errBanner:         { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2', borderRadius: 14, padding: 14, marginTop: 6, marginBottom: 4 },
  errBannerTitle:    { fontSize: 13, fontWeight: '900', color: '#C62828', letterSpacing: 0.3 },
  errBannerSub:      { fontSize: 11, color: '#C62828', marginTop: 2, opacity: 0.75 },
  outageBanner:      { backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#FFD180', borderRadius: 14, padding: 16, marginTop: 6, marginBottom: 8 },
  outageRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  outageIcon:        { fontSize: 18 },
  outageTitle:       { fontSize: 14, fontWeight: '900', color: '#A6541D', letterSpacing: 0.3 },
  outageSub:         { fontSize: 12, color: '#A6541D', lineHeight: 17, opacity: 0.85 },
  calBanner:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFE082', borderRadius: 14, padding: 14, marginTop: 6, marginBottom: 4, gap: 12 },
  calBannerStar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFB80022', alignItems: 'center', justifyContent: 'center' },
  calBannerTitle:    { fontSize: 14, fontWeight: '900', color: '#111', letterSpacing: 0.2 },
  calBannerSub:      { fontSize: 11, color: 'rgba(0,0,0,0.5)', marginTop: 2 },
  calBannerArrow:    { fontSize: 26, fontWeight: '300', color: 'rgba(0,0,0,0.4)', marginRight: 4 },
  emptyWrap:         { alignItems: 'center', paddingTop: 50 },
  emptyIcon:         { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F2F1EF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:        { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 6 },
  emptySub:          { fontSize: 13, color: 'rgba(0,0,0,0.38)', textAlign: 'center' },
  venueBlock:        { marginBottom: 28 },
  venueBanner:       { width: '100%', height: 100, borderRadius: 16, overflow: 'hidden', marginBottom: 10, position: 'relative' },
  venueBannerBg:     { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a2e1a' },
  venueOverlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 14 },
  venueOverlayName:  { fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  venueOverlaySub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  venueMapsBtn:      { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  venueMapsBtnTxt:   { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  matchCard:         { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  matchCardLleno:    { opacity: 0.6 },
  matchAccent:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: COLORS.accent, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  matchAccentLleno:  { backgroundColor: 'rgba(0,0,0,0.15)' },
  inscritoBadge:     { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  inscritoBadgeTxt:  { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  matchTimeCol:      { alignItems: 'center', minWidth: 46 },
  matchTimeBig:      { fontSize: 17, fontWeight: '800', color: '#111', lineHeight: 20 },
  matchAmpm:         { fontSize: 9, color: 'rgba(0,0,0,0.3)', marginTop: 1 },
  dividerV:          { width: 1, height: 38, backgroundColor: 'rgba(0,0,0,0.07)' },
  matchInfo:         { flex: 1 },
  matchTitle:        { fontSize: 14, fontWeight: '700', color: '#111', letterSpacing: 0.2, marginBottom: 5 },
  matchMeta:         { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 7 },
  tagPrice:          { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagPriceTxt:       { fontSize: 10, color: 'rgba(0,0,0,0.5)', fontWeight: '600' },
  tagDescuento:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,107,53,0.10)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagDescuentoOldTxt:{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontWeight: '600', textDecorationLine: 'line-through' },
  tagDescuentoNewTxt:{ fontSize: 10, color: '#D84315', fontWeight: '800' },
  tagDescuentoPctTxt:{ fontSize: 9, color: '#fff', backgroundColor: '#FF6B35', fontWeight: '900', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  tagDescuentoGratisTxt:{ fontSize: 11, color: '#fff', backgroundColor: '#FF6B35', fontWeight: '900', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, letterSpacing: 0.5 },
  tagFormat:         { backgroundColor: 'rgba(143,204,0,0.12)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagFormatTxt:      { fontSize: 10, color: '#2a3a00', fontWeight: '600' },
  tagFormatLleno:    { backgroundColor: 'rgba(0,0,0,0.06)' },
  tagFormatTxtLleno: { color: 'rgba(0,0,0,0.35)' },
  progressBar:       { height: 3, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 2, overflow: 'hidden' },
  progressFill:      { height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 },
  progressFillRed:   { backgroundColor: '#E53935' },
  matchSpots:        { alignItems: 'center', minWidth: 38 },
  spotsCount:        { fontSize: 22, fontWeight: '900', color: '#111', lineHeight: 24 },
  spotsLabel:        { fontSize: 8, color: 'rgba(0,0,0,0.3)', textAlign: 'center', lineHeight: 11 },
  textMuted:         { color: 'rgba(0,0,0,0.35)' },
});
