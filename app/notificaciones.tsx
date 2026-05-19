import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { COLORS } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

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
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path d="M3 6H5H21" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6L18.1 19.1C18.04 19.6 17.62 20 17.1 20H6.9C6.38 20 5.96 19.6 5.9 19.1L5 6H19Z" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function NotifIcon({ tipo }: { tipo: string }) {
  if (tipo === 'warning') return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.55 18.99 2.45 21 3.56 21H20.44C21.55 21 22.45 20.1 22.45 18.99L13.71 3.86C13.35 3.33 12.7 3 12 3C11.3 3 10.65 3.33 10.29 3.86Z" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
  if (tipo === 'pago') return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#2B7FFF" strokeWidth="2"/>
      <Path d="M2 10H22" stroke="#2B7FFF" strokeWidth="2"/>
    </Svg>
  );
  if (tipo === 'cancelacion') return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#D62B2B" strokeWidth="2"/>
      <Path d="M15 9L9 15M9 9L15 15" stroke="#D62B2B" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
  if (tipo === 'resultado') return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const ICON_BG: Record<string, string> = {
  warning:      'rgba(255,149,0,0.1)',
  pago:         'rgba(43,127,255,0.1)',
  cancelacion:  'rgba(214,43,43,0.1)',
  retta:        'rgba(0,0,0,0.06)',
  resultado:    `rgba(122,184,0,0.1)`,
  recordatorio: 'rgba(0,0,0,0.06)',
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

export default function NotificacionesScreen() {
  const router      = useRouter();
  const { request } = useApi();
  const [notifs, setNotifs]         = useState<Notif[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

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

  async function marcarTodasLeidas() {
    const noLeidas = notifs.filter(n => !n.leida);
    await Promise.all(noLeidas.map(n => marcarLeida(n.id)));
  }

  async function eliminarNotif(id: string) {
    Alert.alert(
      'Eliminar notificación',
      '¿Quieres eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await request(`/usuarios/me/notificaciones/${id}`, { method: 'DELETE' });
              setNotifs(prev => prev.filter(n => n.id !== id));
            } catch {}
          },
        },
      ]
    );
  }

  const nuevas     = notifs.filter(n => !n.leida);
  const anteriores = notifs.filter(n => n.leida);

  function renderNotif(n: Notif) {
    return (
      <TouchableOpacity
        key={n.id}
        style={[styles.notifItem, !n.leida && styles.notifUnread]}
        onPress={() => marcarLeida(n.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIcon, { backgroundColor: ICON_BG[n.tipo] || 'rgba(0,0,0,0.06)' }]}>
          <NotifIcon tipo={n.tipo} />
        </View>
        <View style={styles.notifBody}>
          <Text style={styles.notifMsg}>
            <Text style={{ fontWeight: '700', color: '#111' }}>{n.titulo}</Text>
            {n.cuerpo ? ` — ${n.cuerpo}` : ''}
          </Text>
          <Text style={styles.notifTime}>{formatTiempo(n.created_at)}</Text>
        </View>
        <View style={styles.notifRight}>
          {!n.leida && <View style={styles.unreadDot} />}
          <TouchableOpacity
            onPress={() => eliminarNotif(n.id)}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <TrashIcon />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        {nuevas.length > 0 && (
          <TouchableOpacity onPress={marcarTodasLeidas}>
            <Text style={styles.markAll}>Marcar leídas</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        >
          {nuevas.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Nuevas</Text>
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
              <Text style={styles.sectionLabel}>Anteriores</Text>
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
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Todo al día</Text>
              <Text style={styles.emptySub}>No tienes notificaciones pendientes.{'\n'}Te avisaremos cuando haya novedades.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#fff' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topbar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:      { marginRight: 12, padding: 6, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  title:        { flex: 1, fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: 0.5 },
  markAll:      { fontSize: 11, fontWeight: '800', color: COLORS.accent, letterSpacing: 1 },
  scroll:       { padding: 20, paddingTop: 4, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.28)', letterSpacing: 1.8, marginBottom: 8, marginLeft: 2, textTransform: 'uppercase' },
  card:         { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  notifBorder:  { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  notifItem:    { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  notifUnread:  { backgroundColor: 'rgba(122,184,0,0.03)' },
  notifIcon:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody:    { flex: 1 },
  notifMsg:     { fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 19 },
  notifTime:    { fontSize: 11, color: 'rgba(0,0,0,0.3)', marginTop: 4 },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, flexShrink: 0 },
  notifRight:   { alignItems: 'center', gap: 6, flexShrink: 0 },
  deleteBtn:    { padding: 4 },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 6 },
  emptySub:     { fontSize: 13, color: 'rgba(0,0,0,0.38)', textAlign: 'center', lineHeight: 20 },
});
