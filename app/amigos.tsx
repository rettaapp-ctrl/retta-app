import { COLORS } from '@/constants';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'expo-router';
import { track } from '@/lib/analytics';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator, Alert, FlatList,
  RefreshControl, StyleSheet, Text, TextInput,
  TouchableOpacity, View, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

interface Amigo {
  id: string;          // amistad id
  amigo_id: string;
  status: string;
  yo_envie: boolean;
  amigo: {
    id: string;
    nombre: string;
    apellido?: string;
    avatar_url?: string;
    posicion?: string;
    nivel?: string;
    ciudad?: string;
    partidos_jug?: number;
  } | null;
}

interface UsuarioBusqueda {
  id: string;
  nombre: string;
  apellido?: string;
  avatar_url?: string;
  posicion?: string;
}

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8"/>
      <Path d="M21 21L17 17" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

const POSICION_LABEL: Record<string, string> = {
  POR: 'Portero', DEF: 'Defensa', MED: 'Mediocampista', DEL: 'Delantero',
};

export default function AmigosScreen() {
  const { request } = useApi();
  const router = useRouter();

  const [tab, setTab] = useState<'amigos' | 'solicitudes'>('amigos');
  const [amigos, setAmigos]           = useState<Amigo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Amigo[]>([]);
  const [enviadas, setEnviadas]       = useState<Amigo[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  // Búsqueda
  const [search, setSearch] = useState('');
  const [resultados, setResultados] = useState<UsuarioBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [a, p, e] = await Promise.all([
        request('/amistades').catch(() => ({ amigos: [] })),
        request('/amistades/pendientes').catch(() => ({ solicitudes: [] })),
        request('/amistades/enviadas').catch(() => ({ enviadas: [] })),
      ]);
      setAmigos(a.amigos || []);
      setSolicitudes(p.solicitudes || []);
      setEnviadas(e.enviadas || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  // Buscar usuarios cuando cambia el query
  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await request(`/usuarios/buscar?q=${encodeURIComponent(search.trim())}`);
        setResultados(r.usuarios || []);
      } catch {
        setResultados([]);
      }
      setBuscando(false);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  async function responder(amistadId: string, action: 'aceptar' | 'rechazar') {
    try {
      await request(`/amistades/${amistadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      track('amigo_solicitud_respondida', { action });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo procesar.');
    }
  }

  function avatarBox(item: Amigo['amigo']) {
    if (!item) return null;
    const initials = ((item.nombre?.[0] || '') + (item.apellido?.[0] || '')).toUpperCase() || '?';
    return (
      <View style={styles.avatar}>
        {item.avatar_url
          ? <Image source={{ uri: item.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 24 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
          : <Text style={styles.avatarTxt}>{initials}</Text>
        }
      </View>
    );
  }

  function renderAmigo({ item }: { item: Amigo }) {
    if (!item.amigo) return null;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/usuario/${item.amigo!.id}`)}
        activeOpacity={0.7}
      >
        {avatarBox(item.amigo)}
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.amigo.nombre}{item.amigo.apellido ? ` ${item.amigo.apellido}` : ''}</Text>
          <Text style={styles.rowSub}>
            {[POSICION_LABEL[item.amigo.posicion || ''], item.amigo.nivel].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Text style={styles.rowChev}>›</Text>
      </TouchableOpacity>
    );
  }

  function renderSolicitud({ item }: { item: Amigo }) {
    if (!item.amigo) return null;
    return (
      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push(`/usuario/${item.amigo!.id}`)}>
          {avatarBox(item.amigo)}
        </TouchableOpacity>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.amigo.nombre}{item.amigo.apellido ? ` ${item.amigo.apellido}` : ''}</Text>
          <Text style={styles.rowSub}>{POSICION_LABEL[item.amigo.posicion || ''] || ''}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.btnAccept} onPress={() => responder(item.id, 'aceptar')}>
            <Text style={styles.btnAcceptTxt}>ACEPTAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnRej} onPress={() => responder(item.id, 'rechazar')}>
            <Text style={styles.btnRejTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderEnviada({ item }: { item: Amigo }) {
    if (!item.amigo) return null;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/usuario/${item.amigo!.id}`)}
        activeOpacity={0.7}
      >
        {avatarBox(item.amigo)}
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.amigo.nombre}{item.amigo.apellido ? ` ${item.amigo.apellido}` : ''}</Text>
          <Text style={styles.rowSub}>Esperando respuesta…</Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderResultadoBusqueda({ item }: { item: UsuarioBusqueda }) {
    const initials = ((item.nombre?.[0] || '') + (item.apellido?.[0] || '')).toUpperCase() || '?';
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/usuario/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          {item.avatar_url
            ? <Image source={{ uri: item.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 24 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
            : <Text style={styles.avatarTxt}>{initials}</Text>
          }
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.nombre}{item.apellido ? ` ${item.apellido}` : ''}</Text>
          <Text style={styles.rowSub}>{POSICION_LABEL[item.posicion || ''] || ''}</Text>
        </View>
        <Text style={styles.rowChev}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Amigos</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Buscador */}
        <View style={styles.searchWrap}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Busca un jugador por nombre"
            placeholderTextColor="rgba(0,0,0,0.35)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Si hay búsqueda activa, mostrar resultados */}
        {search.trim().length >= 2 ? (
          <FlatList
            data={resultados}
            keyExtractor={i => i.id}
            renderItem={renderResultadoBusqueda}
            ListHeaderComponent={
              <Text style={styles.sectionLabel}>
                {buscando ? 'Buscando…' : `${resultados.length} resultado${resultados.length === 1 ? '' : 's'}`}
              </Text>
            }
            ListEmptyComponent={
              !buscando ? <Text style={styles.empty}>Sin resultados.</Text> : null
            }
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        ) : (
          <>
            {/* Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tab, tab === 'amigos' && styles.tabActive]}
                onPress={() => setTab('amigos')}
              >
                <Text style={[styles.tabTxt, tab === 'amigos' && styles.tabTxtActive]}>
                  Amigos {amigos.length > 0 ? `(${amigos.length})` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'solicitudes' && styles.tabActive]}
                onPress={() => setTab('solicitudes')}
              >
                <Text style={[styles.tabTxt, tab === 'solicitudes' && styles.tabTxtActive]}>
                  Solicitudes
                </Text>
                {solicitudes.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{solicitudes.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 30 }} />
            ) : tab === 'amigos' ? (
              <FlatList
                data={amigos}
                keyExtractor={i => i.id}
                renderItem={renderAmigo}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
                ListEmptyComponent={
                  <View style={styles.emptyBlock}>
                    <Text style={styles.emptyTitle}>Aún no tienes amigos</Text>
                    <Text style={styles.emptySub}>Busca jugadores arriba o agrégalos desde el detalle de un partido.</Text>
                  </View>
                }
                contentContainerStyle={{ paddingBottom: 30 }}
              />
            ) : (
              <FlatList
                data={solicitudes}
                keyExtractor={i => i.id}
                renderItem={renderSolicitud}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
                ListHeaderComponent={
                  enviadas.length > 0 ? (
                    <>
                      <Text style={styles.sectionLabel}>Solicitudes que enviaste</Text>
                      {enviadas.map((e) => (
                        <View key={e.id}>{renderEnviada({ item: e })}</View>
                      ))}
                      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Te enviaron</Text>
                    </>
                  ) : null
                }
                ListEmptyComponent={
                  enviadas.length === 0 ? (
                    <View style={styles.emptyBlock}>
                      <Text style={styles.emptyTitle}>Sin solicitudes pendientes</Text>
                    </View>
                  ) : null
                }
                contentContainerStyle={{ paddingBottom: 30 }}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#fff' },
  topbar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  topbarTitle:    { fontSize: 16, fontWeight: '900', color: '#111', letterSpacing: 0.3 },

  searchWrap:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, paddingHorizontal: 14, height: 46, backgroundColor: '#F4F3EF', borderRadius: 14, marginBottom: 14 },
  searchInput:    { flex: 1, fontSize: 14, fontWeight: '600', color: '#111' },
  clearTxt:       { fontSize: 16, color: 'rgba(0,0,0,0.4)', paddingHorizontal: 6 },

  tabsRow:        { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, gap: 8 },
  tab:            { flex: 1, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  tabActive:      { backgroundColor: '#111' },
  tabTxt:         { fontSize: 12, fontWeight: '800', color: 'rgba(0,0,0,0.5)', letterSpacing: 0.5 },
  tabTxtActive:   { color: '#fff' },
  badge:          { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt:       { fontSize: 10, fontWeight: '900', color: '#000' },

  sectionLabel:   { fontSize: 11, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 },

  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  avatar:         { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:      { fontSize: 18, fontWeight: '900', color: '#fff' },
  rowInfo:        { flex: 1 },
  rowName:        { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: 0.2 },
  rowSub:         { fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 },
  rowChev:        { fontSize: 20, color: 'rgba(0,0,0,0.25)', fontWeight: '700' },

  btnAccept:      { paddingHorizontal: 14, height: 34, backgroundColor: COLORS.accent, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnAcceptTxt:   { fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 1 },
  btnRej:         { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  btnRejTxt:      { fontSize: 16, color: 'rgba(0,0,0,0.45)', fontWeight: '700' },

  emptyBlock:     { paddingTop: 40, paddingHorizontal: 20, alignItems: 'center' },
  emptyTitle:     { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  emptySub:       { fontSize: 13, color: 'rgba(0,0,0,0.45)', textAlign: 'center', lineHeight: 18 },
  empty:          { fontSize: 13, color: 'rgba(0,0,0,0.4)', textAlign: 'center', paddingTop: 24 },
});
