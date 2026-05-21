import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
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
  precio_final?: number;
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
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={DT.onSurfaceVar} strokeWidth="2"/>
      <Path d="M16.5 16.5L21 21" stroke={DT.onSurfaceVar} strokeWidth="2" strokeLinecap="round"/>
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

function ClockIcon() {
  return (
    <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={DT.onSurfaceVar} strokeWidth="1.8"/>
      <Path d="M12 7V12L15 14" stroke={DT.onSurfaceVar} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function PinIcon({ color = '#fff' }: { color?: string }) {
  return (
    <Svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="2"/>
      <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="2"/>
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
      iso:   toLocalISO(d),
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
      console.error('[partidos/load]', err?.message);
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

  const filtered = useMemo(() => {
    if (!search) return partidos;
    const q = search.toLowerCase();
    return partidos.filter(p =>
      p.complejo_nombre?.toLowerCase().includes(q) ||
      p.complejo_ciudad?.toLowerCase().includes(q) ||
      p.cancha_nombre?.toLowerCase().includes(q)
    );
  }, [partidos, search]);

  function formatHora(hora: string) {
    return (hora || '00:00').slice(0, 5);
  }

  const selectedDay = DAYS.find(d => d.iso === activeDate) || DAYS[0];

  return (
    <View style={styles.root}>
      {/* Fondo con glow índigo arriba que se desvanece a oscuro */}
      <LinearGradient
        colors={GRADIENTS.pageBg}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.bigTitle}>
              <Text style={styles.bigTitleAccent}>Rettas</Text>
              <Text style={styles.bigTitlePlain}> cerca de ti</Text>
            </Text>
            <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notificaciones')}>
              <BellIcon />
              {notiCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeTxt}>{notiCount > 9 ? '9+' : notiCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Buscador glass */}
          <View style={styles.searchBox}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por complejo o cancha…"
              placeholderTextColor={DT.outline}
            />
          </View>

          {/* Day tabs — scroll horizontal, pills limpios */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          >
            {DAYS.map(d => {
              const active = d.iso === activeDate;
              const label  = d.today ? 'HOY' : `${d.dia.toUpperCase()} ${d.num}`;
              if (active) {
                return (
                  <TouchableOpacity key={d.iso} onPress={() => selectDay(d.iso)} activeOpacity={0.85}>
                    <LinearGradient
                      colors={GRADIENTS.dayActive}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.dayPillActive}
                    >
                      <Text style={styles.dayPillActiveTxt}>{label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={d.iso}
                  style={styles.dayPill}
                  onPress={() => selectDay(d.iso)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dayPillTxt}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={DT.primary} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.primary} />}
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
                  <Text style={styles.calBannerTitle}>Califica a tus compañeros</Text>
                  <Text style={styles.calBannerSub}>
                    Tienes {calPendientesCount} {calPendientesCount === 1 ? 'calificación pendiente' : 'calificaciones pendientes'}
                  </Text>
                </View>
                <Text style={styles.calBannerArrow}>›</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionLabel}>
              {selectedDay.today
                ? 'PARTIDOS DISPONIBLES HOY'
                : `PARTIDOS · ${selectedDay.dia.toUpperCase()} ${selectedDay.num} ${selectedDay.mes.toUpperCase()}`}
            </Text>

            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Image
                  source={require('../../assets/images/retta-logo-mark.png')}
                  style={styles.emptyLogo}
                  contentFit="contain"
                  tintColor={DT.primary}
                />
                <Text style={styles.emptyTitle}>Sin <Text style={styles.emptyTitleAccent}>Rettas</Text> este día</Text>
                <Text style={styles.emptySub}>Intenta con otro día o revisa más tarde</Text>
              </View>
            ) : (
              filtered.map(p => {
                const hora     = formatHora(p.hora_inicio);
                const libres   = p.max_jugadores - (p.jugadores_confirmados || 0);
                const pct      = (p.jugadores_confirmados || 0) / p.max_jugadores;
                const lleno    = libres <= 0;
                const inscrito = inscritoIds.has(p.id);
                const tieneDescuento = !inscrito && (p.descuento_porcentaje || 0) > 0;

                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.card, lleno && !inscrito && styles.cardLleno]}
                    onPress={() => router.push(`/partido/${p.id}`)}
                    activeOpacity={0.88}
                  >
                    {/* Imagen header */}
                    <View style={styles.cardImgWrap}>
                      {p.complejo_foto_url ? (
                        <Image
                          source={{ uri: p.complejo_foto_url }}
                          style={[StyleSheet.absoluteFillObject, lleno && !inscrito && { opacity: 0.5 }]}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={150}
                        />
                      ) : (
                        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: DT.surfaceHigh }]} />
                      )}
                      <LinearGradient
                        colors={['transparent', DT.bg]}
                        style={StyleSheet.absoluteFill}
                      />
                      {/* Chip precio arriba derecha */}
                      <View style={styles.priceChip}>
                        {tieneDescuento ? (
                          p.descuento_porcentaje === 100 ? (
                            <Text style={styles.priceChipFree}>¡GRATIS!</Text>
                          ) : (
                            <View style={styles.priceChipDescRow}>
                              <Text style={styles.priceChipOld}>${p.precio_jugador}</Text>
                              <Text style={styles.priceChipNew}>${p.precio_final ?? p.precio_jugador}</Text>
                            </View>
                          )
                        ) : (
                          <Text style={styles.priceChipTxt}>${p.precio_jugador}</Text>
                        )}
                      </View>
                      {/* Chip ubicación abajo izquierda */}
                      <View style={styles.locChip}>
                        <PinIcon />
                        <Text style={styles.locChipTxt}>{(p.complejo_ciudad || 'GDL').toUpperCase()}</Text>
                      </View>
                    </View>

                    {/* Cuerpo */}
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {p.complejo_nombre || 'Complejo'}
                      </Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        {p.cancha_nombre || 'Cancha'}
                      </Text>

                      {/* Jugadores + formato */}
                      <View style={styles.statRow}>
                        <Text style={styles.statTxt}>
                          {p.jugadores_confirmados || 0}/{p.max_jugadores} Jugadores
                        </Text>
                        <Text style={styles.statFormat}>{p.tipo}</Text>
                      </View>

                      {/* Barra de progreso con gradiente */}
                      <View style={styles.progressBar}>
                        <LinearGradient
                          colors={pct >= 0.9 ? ['#E24B4A', '#ffb4ab'] : GRADIENTS.progress}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressFill, { width: `${Math.min(pct * 100, 100)}%` }]}
                        />
                      </View>

                      {/* Hora + botón */}
                      <View style={styles.cardFooter}>
                        <View style={styles.timeRow}>
                          <ClockIcon />
                          <Text style={styles.timeTxt}>{hora}</Text>
                        </View>

                        {inscrito ? (
                          <View style={styles.inscritoBtn}>
                            <Text style={styles.inscritoBtnTxt}>INSCRITO</Text>
                          </View>
                        ) : lleno ? (
                          <View style={styles.fullBtn}>
                            <Text style={styles.fullBtnTxt}>Lleno</Text>
                          </View>
                        ) : (
                          <LinearGradient
                            colors={GRADIENTS.button}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.joinBtn}
                          >
                            <Text style={styles.joinBtnTxt}>Unirse a Retta</Text>
                          </LinearGradient>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: DT.bg },
  header:            { paddingHorizontal: SPACING.gutter, paddingTop: 8, paddingBottom: 4 },
  headerTop:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 },
  bellBtn:           { position: 'relative', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  bellBadge:         { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: DT.error, alignItems: 'center', justifyContent: 'center' },
  bellBadgeTxt:      { fontSize: 9, color: '#5a0006', fontFamily: FONTS.bodyBold, lineHeight: 12 },
  bigTitle:          { flex: 1 },
  bigTitleAccent:    { fontSize: 32, color: DT.primary, fontFamily: FONTS.display, letterSpacing: -1, lineHeight: 36 },
  bigTitlePlain:     { fontSize: 32, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -1, lineHeight: 36 },
  searchBox:         { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.md, height: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 16 },
  searchInput:       { flex: 1, fontSize: 14.5, color: DT.onBg, fontFamily: FONTS.body },
  daysRow:           { gap: 10, paddingBottom: 6, paddingRight: 8 },
  dayPill:           { paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, justifyContent: 'center' },
  dayPillTxt:        { fontSize: 12.5, color: DT.onSurfaceVar, fontFamily: FONTS.bodyBold, letterSpacing: 0.3 },
  dayPillActive:     { paddingHorizontal: 22, paddingVertical: 10, borderRadius: RADIUS.full, justifyContent: 'center' },
  dayPillActiveTxt:  { fontSize: 12.5, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  scroll:            { paddingHorizontal: SPACING.gutter, paddingTop: 4, paddingBottom: 40 },
  sectionLabel:      { fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1.5, color: DT.onSurfaceVar, marginBottom: 16, marginTop: 16, paddingLeft: 2 },
  errBanner:         { backgroundColor: 'rgba(255,180,171,0.12)', borderWidth: 1, borderColor: 'rgba(255,180,171,0.3)', borderRadius: RADIUS.md, padding: 14, marginTop: 6, marginBottom: 4 },
  errBannerTitle:    { fontSize: 13, fontFamily: FONTS.bodyBold, color: DT.error, letterSpacing: 0.3 },
  errBannerSub:      { fontSize: 11, color: DT.error, marginTop: 2, opacity: 0.8, fontFamily: FONTS.body },
  outageBanner:      { backgroundColor: 'rgba(250,199,117,0.12)', borderWidth: 1, borderColor: 'rgba(250,199,117,0.3)', borderRadius: RADIUS.md, padding: 16, marginTop: 6, marginBottom: 8 },
  outageRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  outageIcon:        { fontSize: 18 },
  outageTitle:       { fontSize: 14, fontFamily: FONTS.bodyBold, color: DT.warning, letterSpacing: 0.3 },
  outageSub:         { fontSize: 12, color: DT.warning, lineHeight: 17, opacity: 0.9, fontFamily: FONTS.body },
  calBanner:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(190,194,255,0.10)', borderWidth: 1, borderColor: 'rgba(190,194,255,0.25)', borderRadius: RADIUS.md, padding: 14, marginTop: 6, marginBottom: 4, gap: 12 },
  calBannerStar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(190,194,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  calBannerTitle:    { fontSize: 14, fontFamily: FONTS.bodyBold, color: DT.onBg, letterSpacing: 0.2 },
  calBannerSub:      { fontSize: 11.5, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },
  calBannerArrow:    { fontSize: 26, color: DT.onSurfaceVar, marginRight: 4 },
  emptyWrap:         { alignItems: 'center', paddingTop: 70 },
  emptyLogo:         { width: 64, height: 64, marginBottom: 22, opacity: 0.9 },
  emptyTitle:        { fontSize: 18, fontFamily: FONTS.heading, color: DT.onBg, marginBottom: 6 },
  emptyTitleAccent:  { color: DT.primary, fontFamily: FONTS.heading },
  emptySub:          { fontSize: 13, color: DT.onSurfaceVar, textAlign: 'center', fontFamily: FONTS.body },

  // ── Card de partido ──
  card:              { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 16 },
  cardLleno:         { opacity: 0.7 },
  cardImgWrap:       { height: 130, position: 'relative', overflow: 'hidden' },
  priceChip:         { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(10,12,20,0.82)', borderWidth: 1, borderColor: 'rgba(190,194,255,0.35)', borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6, zIndex: 10 },
  priceChipTxt:      { fontSize: 14, color: '#fff', fontFamily: FONTS.monoMed, letterSpacing: 0.5 },
  priceChipFree:     { fontSize: 13, color: DT.primary, fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  priceChipDescRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceChipOld:      { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: FONTS.mono, textDecorationLine: 'line-through' },
  priceChipNew:      { fontSize: 14, color: DT.primary, fontFamily: FONTS.monoMed },
  locChip:           { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: DT.chipBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, zIndex: 10 },
  locChipTxt:        { fontSize: 10, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.8 },
  cardBody:          { padding: SPACING.md, paddingTop: 14 },
  cardTitle:         { fontSize: 22, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.5 },
  cardSub:           { fontSize: 13, color: DT.onSurfaceVar, marginTop: 2, marginBottom: 14, fontFamily: FONTS.body },
  statRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statTxt:           { fontSize: 12, color: DT.primary, fontFamily: FONTS.mono, letterSpacing: 0.3 },
  statFormat:        { fontSize: 12, color: DT.onSurfaceVar, fontFamily: FONTS.mono },
  progressBar:       { height: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 3, overflow: 'hidden' },
  progressFill:      { height: '100%', borderRadius: 3 },
  cardFooter:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  timeRow:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeTxt:           { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.mono },
  joinBtn:           { paddingHorizontal: 22, paddingVertical: 11, borderRadius: RADIUS.full },
  joinBtnTxt:        { fontSize: 14, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.2 },
  inscritoBtn:       { paddingHorizontal: 18, paddingVertical: 11, borderRadius: RADIUS.full, backgroundColor: 'rgba(159,225,203,0.15)', borderWidth: 1, borderColor: 'rgba(159,225,203,0.4)' },
  inscritoBtnTxt:    { fontSize: 12, color: DT.success, fontFamily: FONTS.bodyBold, letterSpacing: 1 },
  fullBtn:           { paddingHorizontal: 22, paddingVertical: 11, borderRadius: RADIUS.full, backgroundColor: DT.surfaceHigh },
  fullBtnTxt:        { fontSize: 13, color: DT.outline, fontFamily: FONTS.bodyBold },
});
