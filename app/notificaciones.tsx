import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Swipeable } from 'react-native-gesture-handler';

// Swipe-to-delete directo (pedido del Foco 2026-07-27): deslizar la fila
// hacia CUALQUIER lado la elimina al soltar — sin botón intermedio ni
// modal de confirmación. Son solo notificaciones; menos fricción.

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  created_at: string;
}

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function NotifIcon({ tipo }: { tipo: string }) {
  if (tipo === 'warning') return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.55 18.99 2.45 21 3.56 21H20.44C21.55 21 22.45 20.1 22.45 18.99L13.71 3.86C13.35 3.33 12.7 3 12 3C11.3 3 10.65 3.33 10.29 3.86Z" stroke={DT.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
  if (tipo === 'pago') return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#85B7EB" strokeWidth="2"/>
      <Path d="M2 10H22" stroke="#85B7EB" strokeWidth="2"/>
    </Svg>
  );
  if (tipo === 'cancelacion') return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={DT.error} strokeWidth="2"/>
      <Path d="M15 9L9 15M9 9L15 15" stroke={DT.error} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
  if (tipo === 'resultado') return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={DT.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const ICON_BG: Record<string, string> = {
  warning:      'rgba(250,199,117,0.12)',
  pago:         'rgba(53,138,221,0.15)',
  cancelacion:  'rgba(255,180,171,0.12)',
  retta:        'rgba(190,194,255,0.12)',
  resultado:    'rgba(190,194,255,0.12)',
  recordatorio: 'rgba(190,194,255,0.12)',
};

function formatTiempo(created_at: string) {
  const now  = new Date();
  const date = new Date(created_at);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60)    return 'Ahora';
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days === 1)   return 'Ayer';
  return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Formateo del cuerpo de notificaciones ──────────────────────────────
// El backend manda algunas notifs con fechas ISO crudas como
// "2026-06-09 a las 17:00:00 en COMPLEJO X". Las parseamos para mostrar
// "9 de junio a las 5:00 PM en COMPLEJO X" — más humano, menos data-leak.
// Cuando arreglemos el backend para mandarlo ya formateado, este helper
// seguirá siendo no-op (matchea el patrón ISO, no daña texto ya bonito).
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function formatFechaISO(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const [, , mm, dd] = m;
  const mi = parseInt(mm, 10) - 1;
  if (mi < 0 || mi > 11) return iso;
  return `${parseInt(dd, 10)} de ${MESES[mi]}`;
}

function formatHoraISO(hhmmss: string): string {
  const m = hhmmss.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return hhmmss;
  const h = parseInt(m[1], 10);
  const min = m[2];
  const isPM = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${isPM ? 'PM' : 'AM'}`;
}

function prettifyCuerpo(cuerpo: string): string {
  if (!cuerpo) return cuerpo;
  let out = cuerpo;
  // Fecha ISO YYYY-MM-DD seguida opcionalmente de "a las HH:MM:SS"
  out = out.replace(/(\d{4}-\d{2}-\d{2})(\s+a las\s+)(\d{1,2}:\d{2}:\d{2})/gi,
    (_full, fecha, conector, hora) => `${formatFechaISO(fecha)}${conector}${formatHoraISO(hora)}`);
  // Fechas ISO sueltas
  out = out.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (_full, fecha) => formatFechaISO(fecha));
  // Horas con segundos sueltas
  out = out.replace(/\b(\d{1,2}:\d{2}:\d{2})\b/g, (_full, hora) => formatHoraISO(hora));
  return out;
}

export default function NotificacionesScreen() {
  const router      = useRouter();
  const { request } = useApi();
  const [notifs, setNotifs]         = useState<Notif[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // useFocusEffect: re-carga notificaciones cada vez que el usuario entra
  // a esta pantalla. Sin esto las notifs quedaban viejas hasta refresh.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    try {
      const data = await request('/usuarios/me/notificaciones');
      setNotifs(data.notificaciones || []);
    } catch {
      setNotifs([]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  async function marcarLeida(id: string) {
    try {
      await request(`/usuarios/me/notificaciones/${id}/leer`, { method: 'PATCH' });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch {}
  }

  // Eliminación directa al completar el swipe: la fila sale de la lista al
  // instante (optimista) y el DELETE viaja en background. Si el server
  // falla, recargamos para que la notif reaparezca.
  function eliminarNotif(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id));
    request(`/usuarios/me/notificaciones/${id}`, { method: 'DELETE' }).catch(() => load());
  }

  const nuevas     = notifs.filter(n => !n.leida);
  const anteriores = notifs.filter(n => n.leida);

  // Fondo rojo con basurero que se revela mientras arrastras. Es solo
  // visual: no hay que tocarlo — al soltar el swipe la notif se elimina.
  function renderAccionEliminar(lado: 'izq' | 'der') {
    return (
      <View style={[styles.swipeFill, { alignItems: lado === 'izq' ? 'flex-start' : 'flex-end' }]}>
        <View style={styles.swipeContent}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path d="M3 6H21M8 6V4A2 2 0 0 1 10 2H14A2 2 0 0 1 16 4V6M10 11V17M14 11V17M5 6L6 20A2 2 0 0 0 8 22H16A2 2 0 0 0 18 20L19 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={styles.swipeDeleteTxt}>Eliminar</Text>
        </View>
      </View>
    );
  }

  function renderNotif(n: Notif) {
    return (
      <Swipeable
        key={n.id}
        renderLeftActions={() => renderAccionEliminar('izq')}
        renderRightActions={() => renderAccionEliminar('der')}
        leftThreshold={70}
        rightThreshold={70}
        onSwipeableOpen={() => eliminarNotif(n.id)}
      >
        <TouchableOpacity
          style={[styles.notifItem, !n.leida && styles.notifUnread]}
          onPress={() => marcarLeida(n.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.notifIcon, { backgroundColor: ICON_BG[n.tipo] || 'rgba(190,194,255,0.12)' }]}>
            <NotifIcon tipo={n.tipo} />
          </View>
          <View style={styles.notifBody}>
            <Text style={styles.notifMsg}>
              <Text style={{ color: DT.onBg, fontFamily: FONTS.bodyMed }}>{n.titulo}</Text>
              {n.cuerpo ? ` — ${prettifyCuerpo(n.cuerpo)}` : ''}
            </Text>
            <Text style={styles.notifTime}>{formatTiempo(n.created_at)}</Text>
          </View>
          {!n.leida && (
            <View style={styles.notifRight}>
              <View style={styles.unreadDot} />
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top','bottom']}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Notificaciones</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={DT.primary} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.primary} />}
          >
            {nuevas.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>NUEVAS</Text>
                <View style={styles.card}>
                  {nuevas.map((n, i) => (
                    <View key={n.id} style={i < nuevas.length - 1 ? styles.notifBorder : {}}>
                      {renderNotif(n)}
                    </View>
                  ))}
                </View>
              </>
            )}

            {anteriores.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>ANTERIORES</Text>
                <View style={styles.card}>
                  {anteriores.map((n, i) => (
                    <View key={n.id} style={i < anteriores.length - 1 ? styles.notifBorder : {}}>
                      {renderNotif(n)}
                    </View>
                  ))}
                </View>
              </>
            )}

            {notifs.length === 0 && (
              <View style={styles.empty}>
                <Image
                  source={require('../assets/images/retta-logo-mark.png')}
                  style={styles.emptyLogo}
                  contentFit="contain"
                  tintColor={DT.primary}
                />
                <Text style={styles.emptyTitle}>Todo al día</Text>
                <Text style={styles.emptySub}>No tienes notificaciones pendientes.{'\n'}Te avisaremos cuando haya novedades.</Text>
              </View>
            )}
          </ScrollView>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DT.bg },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topbar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.gutter, paddingVertical: 14, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  title:        { flex: 1, fontSize: 22, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5 },
  scroll:       { padding: SPACING.gutter, paddingTop: 4, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.8, marginBottom: 10, marginLeft: 2, fontFamily: FONTS.mono },
  card:         { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 14 },
  notifBorder:  { borderBottomWidth: 1, borderBottomColor: DT.glassBorder },
  notifItem:    { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  notifUnread:  { backgroundColor: 'rgba(190,194,255,0.05)' },
  notifIcon:    { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody:    { flex: 1 },
  notifMsg:     { fontSize: 13, color: DT.onSurfaceVar, lineHeight: 19, fontFamily: FONTS.body },
  notifTime:    { fontSize: 11, color: DT.outline, marginTop: 4, fontFamily: FONTS.mono },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: DT.primary, flexShrink: 0 },
  notifRight:   { alignItems: 'center', gap: 6, flexShrink: 0 },
  // Fondo rojo del swipe-to-delete (ambos lados). flex:1 para que cubra
  // también el overshoot al arrastrar de más — sin huecos.
  swipeFill:    { flex: 1, backgroundColor: DT.error, justifyContent: 'center', paddingHorizontal: 26 },
  swipeContent: { alignItems: 'center', gap: 4 },
  swipeDeleteTxt: { color: '#fff', fontSize: 12, fontFamily: FONTS.bodyBold, letterSpacing: 0.3 },
  empty:        { alignItems: 'center', paddingTop: 70 },
  emptyLogo:    { width: 56, height: 56, marginBottom: 22, opacity: 0.9 },
  emptyTitle:   { fontSize: 20, color: DT.onBg, fontFamily: FONTS.heading, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 20, fontFamily: FONTS.body },
});
