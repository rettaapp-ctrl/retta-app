import { COLORS } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { confirmarCancelacion } from '@/lib/cancelacion';
import { openMaps, buildMapQuery } from '@/lib/mapas';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator, Alert, Image,
  ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
  Modal, TextInput, KeyboardAvoidingView, Platform, Animated,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import ReporteModal from '@/components/ReporteModal';
import { track } from '@/lib/analytics';

interface Jugador {
  inscripcion_id?: string;
  usuario_id?: string;
  id?: string;
  nombre: string;
  apellido?: string;
  posicion?: string;
  equipo?: string;
  es_invitado?: boolean;
  invitado_de?: string;
  nombre_invitado?: string;
}

interface Partido {
  id: string;
  complejo_nombre: string;
  complejo_ciudad: string;
  complejo_direccion?: string;
  cancha_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin?: string;
  tipo: string;
  precio_jugador: number;
  precio_final?: number;
  descuento_porcentaje?: number;
  jugadores_confirmados: number;
  max_jugadores: number;
  status: string;
  notas?: string;
  jugadores?: Jugador[];
}

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function ShareIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M4 12V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V12" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M16 6L12 2L8 6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 2V15" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function ClockIcon() {
  return (
    <Svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8"/>
      <Path d="M12 7V12L15 14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}
function CalIcon() {
  return (
    <Svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8"/>
      <Path d="M8 2V6M16 2V6M3 9H21" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}
function PinIcon() {
  return (
    <Svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <Path d="M9 0C5.1 0 2 3.1 2 7C2 12.25 9 20 9 20C9 20 16 12.25 16 7C16 3.1 12.9 0 9 0ZM9 9.5C7.6 9.5 6.5 8.4 6.5 7C6.5 5.6 7.6 4.5 9 4.5C10.4 4.5 11.5 5.6 11.5 7C11.5 8.4 10.4 9.5 9 9.5Z" fill={COLORS.accent}/>
    </Svg>
  );
}

const AVATAR_COLORS = ['#E63946','#457B9D','#2A9D8F','#E9C46A','#F4A261','#8338EC','#3A86FF','#E76F51','#264653','#A8DADC'];

export default function PartidoDetailScreen() {
  const { id, desde } = useLocalSearchParams<{ id: string; desde?: string }>();
  const { request } = useApi();
  const { user }    = useAuth();
  const router      = useRouter();
  const insets      = useSafeAreaInsets();

  const [partido, setPartido]         = useState<Partido | null>(null);
  const [loading, setLoading]         = useState(true);
  const [joining, setJoining]         = useState(false);
  const [cancelando, setCancelando]   = useState(false);
  const [equipoSeleccionado, setEquipo] = useState<'A' | 'B' | null>(null);
  const [slotSeleccionado, setSlot]     = useState<{equipo:'A'|'B', index:number} | null>(null);
  const [yaInscrito, setYaInscrito]         = useState(false);
  const [modoInvitado, setModoInvitado]     = useState(false);
  const [modalInvitado, setModalInvitado]   = useState(false);
  const [equipoInvitado, setEquipoInvitado] = useState<'A'|'B'>('A');
  const [invNombre, setInvNombre]           = useState('');
  const [invError, setInvError]             = useState('');
  const [enviandoInv, setEnviandoInv]       = useState(false);
  // Modal de invitar amigos de la app
  const [modalAmigos, setModalAmigos]       = useState(false);
  const [amigosLista, setAmigosLista]       = useState<any[]>([]);
  const [amigosSel, setAmigosSel]           = useState<Set<string>>(new Set());
  const [cargandoAmigos, setCargandoAmigos] = useState(false);
  const [enviandoAmigos, setEnviandoAmigos] = useState(false);
  const [busquedaAmigos, setBusquedaAmigos] = useState('');
  const [reporteOpen, setReporteOpen] = useState(false);
  const slideAnim  = useRef(new Animated.Value(300)).current;
  const scrollRef  = useRef<any>(null);

  async function openInvitarAmigos() {
    setAmigosSel(new Set());
    setBusquedaAmigos('');
    setModalAmigos(true);
    setCargandoAmigos(true);
    try {
      const data = await request('/amistades');
      setAmigosLista(data.amigos || []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar tus amigos.');
    } finally {
      setCargandoAmigos(false);
    }
  }

  function toggleAmigo(id: string) {
    setAmigosSel(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function enviarInvitacionAmigos() {
    if (amigosSel.size === 0) return;
    setEnviandoAmigos(true);
    try {
      const res = await request(`/partidos/${id}/invitar-amigos`, {
        method: 'POST',
        body: JSON.stringify({ amigo_ids: Array.from(amigosSel) }),
      });
      track('partido_amigos_invitados', {
        partido_id: id,
        cantidad:   res.invitados,
      });
      setModalAmigos(false);
      Alert.alert(
        '¡Invitaciones enviadas!',
        `Invitaste a ${res.invitados} ${res.invitados === 1 ? 'amigo' : 'amigos'} a este partido. Recibirán una notificación.`
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron enviar las invitaciones.');
    } finally {
      setEnviandoAmigos(false);
    }
  }

  function confirmarInvitado() {
    if (!invNombre.trim()) { setInvError('Escribe el nombre del invitado.'); return; }
    setModalInvitado(false);
    // Navegar a pantalla de pago con datos del invitado
    router.push({
      pathname: '/confirmar-pago',
      params: {
        partido_id:      id,
        equipo:          equipoInvitado,
        complejo:        partido?.complejo_nombre,
        cancha:          partido?.cancha_nombre,
        fecha:           partido?.fecha,
        hora:            partido?.hora_inicio,
        precio:          partido?.precio_jugador?.toString(),
        tipo:            partido?.tipo,
        es_invitado:     'true',
        nombre_invitado: invNombre.trim(),
      },
    });
  }

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const data = await request(`/partidos/${id}`);
      setPartido(data);
      // Verificar si el usuario ya está inscrito
      const jugadores = data.jugadores || [];
      // Estoy inscrito si alguno de los jugadores reales (no invitados) tiene mi user.id
      const inscrito = jugadores.some(
        (j: Jugador) => !j.es_invitado && j.usuario_id === user?.id
      );
      setYaInscrito(inscrito);
      // Analytics: solo trackear la primera vez que se abre el detalle
      // (no en cada refresh). Y solo si el partido cargó OK.
      track('partido_visto', {
        partido_id:      data.id,
        tipo:            data.tipo,
        ciudad:          data.complejo_ciudad,
        jugadores_actuales: data.jugadores_confirmados,
        max_jugadores:   data.max_jugadores,
        tiene_descuento: (data.descuento_porcentaje || 0) > 0,
        ya_inscrito:     inscrito,
        desde:           desde || 'directo',
      });
    } catch {}
    setLoading(false);
  }

  function getEquipoSize() {
    if (!partido) return 7;
    const total = partido.max_jugadores;
    return total / 2;
  }

  function getJugadoresByEquipo(equipo: 'A' | 'B'): (Jugador | null)[] {
    if (!partido) return [];
    const size = getEquipoSize();
    const jugadores = (partido.jugadores || []).filter(j => j.equipo === equipo);
    const slots: (Jugador | null)[] = [];
    for (let i = 0; i < size; i++) {
      slots.push(jugadores[i] || null);
    }
    return slots;
  }

  function handleSlotPress(equipo: 'A' | 'B', index: number, jugador: Jugador | null) {
    // Si el slot tiene MI invitado → permitir cancelarlo
    if (jugador?.es_invitado && jugador.invitado_de === user?.id) {
      handleCancelarInvitado(jugador);
      return;
    }
    // Si es otro jugador real (no yo, no invitado de otro) → ver perfil
    if (jugador && !jugador.es_invitado && jugador.usuario_id && jugador.usuario_id !== user?.id) {
      router.push(`/usuario/${jugador.usuario_id}`);
      return;
    }
    if (jugador) return;
    // Si viene de reservas o ya está inscrito → tap en slot vacío abre modal de invitado
    if (desde === 'reservas' || yaInscrito) {
      setEquipoInvitado(equipo);
      setInvNombre('');
      setInvError('');
      setModalInvitado(true);
      return;
    }
    // Flujo normal de unirse
    if (slotSeleccionado?.equipo === equipo && slotSeleccionado?.index === index) {
      setSlot(null);
      setEquipo(null);
      return;
    }
    setSlot({ equipo, index });
    setEquipo(equipo);
  }

  async function compartirPartido() {
    if (!partido) return;
    // URL matchea la ruta de Expo Router (`app/partido/[id]`), así Expo
    // Router resuelve el deep link automáticamente al abrir en la app.
    const url = `https://rettaapp.com/partido/${partido.id}`;
    const fechaTxt = formatFecha(partido.fecha);
    const horaTxt  = formatHora(partido.hora_inicio);
    const mensaje = `⚽ Te invito a jugar en Retta\n\n${partido.complejo_nombre} · ${partido.cancha_nombre}\n${fechaTxt} a las ${horaTxt}\n\n${url}`;
    try {
      await Share.share({
        message: mensaje,
        // En iOS también podemos pasar URL aparte para mejor preview en algunas apps
        url: Platform.OS === 'ios' ? url : undefined,
        title: 'Partido en Retta',
      });
      track('partido_compartido', { partido_id: partido.id });
    } catch {}
  }

  function handleCancelarInvitado(invitado: Jugador) {
    if (!partido) return;
    confirmarCancelacion(
      {
        id:               partido.id,
        fecha:            partido.fecha,
        hora_inicio:      partido.hora_inicio,
        precio_jugador:   partido.precio_jugador,
      },
      async () => {
        try {
          // Mandamos el id de la inscripción específica del invitado a cancelar.
          // Sin esto, el backend cancela el más reciente — pero como ahora se
          // pueden tener varios invitados, queremos cancelar el que tocó el user.
          const inscId = invitado.inscripcion_id || invitado.id;
          const path = inscId
            ? `/partidos/${partido.id}/invitado/${inscId}`
            : `/partidos/${partido.id}/invitado`;
          await request(path, { method: 'DELETE' });
          await load();
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'No se pudo cancelar al invitado.');
        }
      }
    );
  }

  function handleCancelSelection() {
    setSlot(null);
    setEquipo(null);
  }

  async function handleUnirse() {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!equipoSeleccionado) {
      Alert.alert('Elige un lugar', 'Toca un lugar libre en el equipo que quieras unirte.');
      return;
    }
    track('partido_inscripcion_iniciada', {
      partido_id:      id,
      equipo:          equipoSeleccionado,
      precio:          partido?.precio_final ?? partido?.precio_jugador,
      tiene_descuento: (partido?.descuento_porcentaje || 0) > 0,
    });
    router.push({
      pathname: '/confirmar-pago',
      params: {
        partido_id:  id,
        equipo:      equipoSeleccionado,
        complejo:    partido?.complejo_nombre,
        cancha:      partido?.cancha_nombre,
        fecha:       partido?.fecha,
        hora:        partido?.hora_inicio,
        precio:      partido?.precio_jugador?.toString(),
        tipo:        partido?.tipo,
      },
    });
  }

  async function doUnirse() {
    // La inscripción ahora se maneja en confirmar-pago.tsx
  }

  function handleCancelarInscripcion() {
    if (!partido) return;
    confirmarCancelacion(
      {
        id:               partido.id,
        fecha:            partido.fecha,
        hora_inicio:      partido.hora_inicio,
        precio_jugador:   partido.precio_jugador,
      },
      async () => {
        try {
          setCancelando(true);
          await request(`/partidos/${partido.id}/salir`, { method: 'DELETE' });
          track('partido_cancelacion', {
            partido_id: partido.id,
            desde:      'detalle',
          });
          Alert.alert('Lugar cancelado', 'Tu lugar fue liberado correctamente.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'No se pudo cancelar tu lugar.');
        } finally {
          setCancelando(false);
        }
      }
    );
  }

  function formatFecha(fecha: string) {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function formatHora(hora: string) {
    const [h, m] = hora.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h12}:${m} ${ampm}`;
  }


  // Render de cada slot
  function renderSlot(jugador: Jugador | null, i: number, equipo: 'A' | 'B') {
    const isEmpty      = !jugador;
    const colorOffset  = equipo === 'B' ? 3 : 0;
    const color        = AVATAR_COLORS[(i + colorOffset) % AVATAR_COLORS.length];
    const isThisSlot   = isEmpty && !modoInvitado && slotSeleccionado?.equipo === equipo && slotSeleccionado?.index === i;
    const userInitials = user ? ((user.nombre?.[0] || '') + (user.apellido?.[0] || '')).toUpperCase() || '?' : '?';

    const esMiInvitado    = !isEmpty && jugador?.es_invitado && jugador.invitado_de === user?.id;
    const esOtroInvitado  = !isEmpty && jugador?.es_invitado && jugador.invitado_de !== user?.id;
    const esYo            = !isEmpty && !jugador?.es_invitado && jugador?.usuario_id === user?.id;

    // Es jugador real (no yo, no invitado) → tappable para ver perfil
    const esJugadorReal = !isEmpty && !jugador?.es_invitado && jugador?.usuario_id && jugador.usuario_id !== user?.id;
    const tappable = isEmpty || esMiInvitado || esJugadorReal;

    return (
      <TouchableOpacity
        key={i}
        style={styles.slotItem}
        onPress={(e) => {
          e.stopPropagation();
          handleSlotPress(equipo, i, jugador);
        }}
        disabled={!tappable}
        activeOpacity={tappable ? 0.7 : 1}
      >
        <View style={[
          styles.slotAvatar,
          isEmpty && !isThisSlot && styles.slotAvatarEmpty,
          isEmpty && isThisSlot && styles.slotAvatarSelected,
          !isEmpty && { backgroundColor: color },
          esMiInvitado && styles.slotAvatarMiInvitado,
          esOtroInvitado && styles.slotAvatarOtroInvitado,
          esYo && styles.slotAvatarYo,
        ]}>
          {isThisSlot ? (
            // Preview del usuario actual (solo cuando NO es modo invitado)
            <>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 25, opacity: 0.75 }]}
                />
              ) : (
                <Text style={[styles.slotInitials, { opacity: 0.75 }]}>{userInitials}</Text>
              )}
              <View style={styles.slotPreviewRing} />
            </>
          ) : isEmpty ? (
            <Text style={styles.slotPlus}>+</Text>
          ) : esYo && user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
            />
          ) : (
            <Text style={styles.slotInitials}>
              {jugador!.nombre?.[0]?.toUpperCase() || '?'}
            </Text>
          )}
          {esMiInvitado && (
            <View style={styles.slotInvitadoBadge}>
              <Text style={styles.slotInvitadoBadgeTxt}>×</Text>
            </View>
          )}
        </View>
        <Text style={[styles.slotName, isEmpty && !isThisSlot && styles.slotNameEmpty, esYo && styles.slotNameYo]}>
          {isThisSlot ? user?.nombre || 'Tú' : isEmpty ? 'Libre' : esYo ? (user?.nombre || jugador!.nombre) : jugador!.nombre}
        </Text>
        {isThisSlot && <Text style={styles.slotPreviewTag}>vista previa</Text>}
        {esMiInvitado && <Text style={styles.slotInvitadoTag}>tu invitado</Text>}
        {esOtroInvitado && <Text style={styles.slotOtroInvitadoTag}>invitado</Text>}
        {esYo && <Text style={styles.slotYoTag}>tú</Text>}
        {!isEmpty && !isThisSlot && !esMiInvitado && !esOtroInvitado && !esYo && jugador?.posicion && (
          <Text style={styles.slotPos}>{jugador.posicion}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>
  );
  if (!partido) return (
    <View style={styles.center}><Text style={{ color: 'rgba(0,0,0,0.38)' }}>Partido no encontrado</Text></View>
  );

  const libres = partido.max_jugadores - (partido.jugadores_confirmados || 0);
  const canUnirse = partido.status === 'abierto' && libres > 0 && !yaInscrito;
  const slotsA = getJugadoresByEquipo('A');
  const slotsB = getJugadoresByEquipo('B');

  return (
    <SafeAreaView style={styles.root}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.mdTitle}>{partido.complejo_nombre}</Text>
          <Text style={styles.mdSubtitle}>{partido.cancha_nombre} · {formatFecha(partido.fecha)}</Text>
        </View>
        <TouchableOpacity onPress={() => compartirPartido()} style={styles.shareBtn}>
          <ShareIcon />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroVenue}>{partido.complejo_nombre}</Text>
          <Text style={styles.heroCancha}>{partido.cancha_nombre} · {partido.tipo}</Text>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <ClockIcon />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.pillLabel}>HORA</Text>
                <Text style={styles.pillVal}>{formatHora(partido.hora_inicio)}</Text>
              </View>
            </View>
            <View style={styles.heroPill}>
              <CalIcon />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.pillLabel}>FECHA</Text>
                <Text style={styles.pillVal}>{formatFecha(partido.fecha)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mapa placeholder — tappable para abrir maps */}
        <TouchableOpacity
          style={styles.mapBox}
          onPress={() => openMaps(buildMapQuery(partido.complejo_nombre, partido.complejo_ciudad, partido.complejo_direccion))}
          activeOpacity={0.85}
        >
          <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 353 110" opacity={0.18}>
            <Line x1="0" y1="55" x2="353" y2="55" stroke="#888" strokeWidth="8"/>
            <Line x1="0" y1="30" x2="353" y2="30" stroke="#888" strokeWidth="3"/>
            <Line x1="0" y1="82" x2="353" y2="82" stroke="#888" strokeWidth="3"/>
            <Line x1="80" y1="0" x2="80" y2="110" stroke="#888" strokeWidth="3"/>
            <Line x1="200" y1="0" x2="200" y2="110" stroke="#888" strokeWidth="6"/>
            <Line x1="310" y1="0" x2="310" y2="110" stroke="#888" strokeWidth="3"/>
          </Svg>
          <View style={styles.mapPin}>
            <View style={styles.mapLabel}>
              <Text style={styles.mapLabelTxt}>{partido.complejo_nombre}</Text>
            </View>
            <PinIcon />
          </View>
          <Text style={styles.mapAddr}>{partido.complejo_ciudad}</Text>
          <View style={styles.mapHint}>
            <Text style={styles.mapHintTxt}>TOCA PARA CÓMO LLEGAR</Text>
          </View>
        </TouchableOpacity>

        {/* Banner superior */}
        {modoInvitado && (
          <View style={styles.elegirBanner}>
            <Text style={styles.elegirTxt}>SELECCIONA UN LUGAR LIBRE</Text>
          </View>
        )}
        {equipoSeleccionado && !yaInscrito && !modoInvitado && (
          <View style={[styles.elegirBanner, { backgroundColor: '#111', flexDirection: 'row', alignItems: 'center' }]}>
            <Text style={[styles.elegirTxt, { color: COLORS.accent, flex: 1 }]}>
              EQUIPO {equipoSeleccionado} SELECCIONADO
            </Text>
            <TouchableOpacity onPress={handleCancelSelection} style={styles.cancelBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.cancelBtnTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Jugadores inscritos */}
        <Text style={styles.sectionLabel}>Jugadores inscritos</Text>

        {/* Equipo A */}
        <View style={styles.equipoBlock}>
          <View style={styles.equipoHeader}>
            <View style={[styles.equipoDot, { backgroundColor: '#3A86FF' }]} />
            <Text style={styles.equipoTitle}>EQUIPO A</Text>
          </View>
          <View style={styles.slotsGrid}>
            {slotsA.map((jugador, i) => renderSlot(jugador, i, 'A'))}
          </View>
        </View>

        {/* VS divider */}
        <View style={styles.vsDivider}>
          <View style={styles.vsLine} />
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.vsLine} />
        </View>

        {/* Equipo B */}
        <View style={styles.equipoBlock}>
          <View style={styles.equipoHeader}>
            <View style={[styles.equipoDot, { backgroundColor: '#2A9D8F' }]} />
            <Text style={styles.equipoTitle}>EQUIPO B</Text>
          </View>
          <View style={styles.slotsGrid}>
            {slotsB.map((jugador, i) => renderSlot(jugador, i, 'B'))}
          </View>
        </View>

        {/* Reglas */}
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Reglas del partido</Text>
        <View style={styles.rulesCard}>
          {[
            'Llegar al menos 10 minutos antes del inicio del partido.',
            'Portar ropa deportiva adecuada. Prohibido jugar con tenis de calle.',
            'Juego limpio obligatorio. Tarjeta roja implica expulsión inmediata sin reembolso.',
            'Esta es una reta entre amigos: venimos a disfrutar, hacer deporte y pasarla bien. Mantén siempre las buenas vibras.',
            'El partido podrá cancelarse hasta 2 horas antes del inicio si no se completa el mínimo de jugadores. En ese caso se reembolsa a los inscritos.',
          ].map((r, i, arr) => (
            <View key={i} style={[styles.ruleRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>{r}</Text>
            </View>
          ))}
        </View>

        {/* Política cancelación */}
        <Text style={[styles.sectionLabel, { marginTop: 6 }]}>Política de Cancelación</Text>
        <View style={[styles.rulesCard, { marginBottom: 12 }]}>
          {[
            { color: '#00A85A', label: 'Más de 12 horas antes', detail: 'Cancelación sin costo · Reembolso completo', labelColor: '#007A3D' },
            { color: '#FF9500', label: 'Entre 3 y 12 horas antes', detail: 'Se retiene el 40% · Se reembolsa el 60%', labelColor: '#cc7700' },
            { color: COLORS.accent, label: 'Menos de 3 horas antes', detail: 'Sin reembolso · Cargo definitivo', labelColor: COLORS.accent },
          ].map((item, i) => (
            <View key={i} style={[styles.ruleRow, { alignItems: 'center' }, i === 2 && { borderBottomWidth: 0 }]}>
              <View style={[styles.ruleDot, { backgroundColor: item.color, marginTop: 0 }]} />
              <View>
                <Text style={[styles.ruleText, { color: item.labelColor, fontWeight: '700' }]}>{item.label}</Text>
                <Text style={[styles.ruleText, { marginTop: 2 }]}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Reportar incidente — solo si yaInscrito (jugaste/juegas el partido) */}
        {yaInscrito && (
          <View style={{ marginBottom: (desde === 'reservas' || yaInscrito) ? 200 : 120, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setReporteOpen(true)} activeOpacity={0.7}>
              <Text style={styles.reportarLink}>¿Pasó algo en este partido? Reportar incidente</Text>
            </TouchableOpacity>
          </View>
        )}
        {!yaInscrito && <View style={{ marginBottom: 120 }} />}
      </ScrollView>


      {/* Botón inferior — depende de si el usuario ya está inscrito o no */}
      {(desde === 'reservas' || yaInscrito) ? (
        // Ya inscrito → 2 acciones positivas apiladas + cancelar
        <View style={[styles.joinBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.invBar, { marginBottom: 8 }]}
            onPress={openInvitarAmigos}
            activeOpacity={0.85}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Circle cx="9" cy="7" r="4" stroke="#000" strokeWidth="1.8"/>
              <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/>
              <Circle cx="17" cy="10" r="3" stroke="#000" strokeWidth="1.8"/>
              <Path d="M22 17a4 4 0 0 0-4-3.5" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/>
            </Svg>
            <Text style={styles.invBarTxt}>INVITAR AMIGOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.invBar, { marginBottom: 8 }]}
            onPress={() => {
              setEquipoInvitado('A');
              setInvNombre('');
              setInvError('');
              setModalInvitado(true);
            }}
            activeOpacity={0.85}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="8" r="4" stroke="#000" strokeWidth="1.8"/>
              <Path d="M4 21v-1a6 6 0 0 1 12 0v1" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/>
              <Path d="M19 8v6M22 11h-6" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/>
            </Svg>
            <Text style={styles.invBarTxt}>AGREGAR INVITADO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelInscBtn}
            onPress={handleCancelarInscripcion}
            disabled={cancelando}
            activeOpacity={0.85}
          >
            {cancelando
              ? <ActivityIndicator color="#D62B2B" />
              : <Text style={styles.cancelInscTxt}>CANCELAR MI LUGAR</Text>
            }
          </TouchableOpacity>
        </View>
      ) : (
        // No inscrito → puede unirse (flujo normal de pago)
        (canUnirse || equipoSeleccionado) && (
          <View style={[styles.joinBar, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={handleUnirse}
              disabled={joining}
              activeOpacity={0.85}
            >
              {joining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinBtnTxt}>
                  {/* Si hay descuento, mostrar precio_final (lo que pagará el nuevo) */}
                  {(partido.descuento_porcentaje || 0) > 0
                    ? `UNIRME AL PARTIDO · $${partido.precio_final ?? partido.precio_jugador}${partido.descuento_porcentaje === 100 ? ' (¡GRATIS!)' : ` (-${partido.descuento_porcentaje}%)`}`
                    : `UNIRME AL PARTIDO · $${partido.precio_jugador}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )
      )}

      {/* Modal invitar amigos de la app */}
      <Modal visible={modalAmigos} transparent animationType="slide" onRequestClose={() => setModalAmigos(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setModalAmigos(false)}
            style={{ flex: 1 }}
          />
          <View style={styles.amigosModal}>
            <View style={styles.amigosHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.amigosTitle}>INVITAR AMIGOS</Text>
                <Text style={styles.amigosSubtitle}>Se les enviará una notificación con el partido</Text>
              </View>
              <TouchableOpacity onPress={() => setModalAmigos(false)} style={styles.amigosClose}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6L18 18" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <View style={styles.amigosSearch}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Circle cx="11" cy="11" r="7" stroke="rgba(0,0,0,0.3)" strokeWidth="2"/>
                <Path d="M16.5 16.5L21 21" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round"/>
              </Svg>
              <TextInput
                style={styles.amigosSearchInput}
                value={busquedaAmigos}
                onChangeText={setBusquedaAmigos}
                placeholder="Buscar amigo..."
                placeholderTextColor="rgba(0,0,0,0.3)"
              />
            </View>

            {/* Lista de amigos */}
            <ScrollView style={{ maxHeight: 320 }}>
              {cargandoAmigos ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 30 }} />
              ) : amigosLista.length === 0 ? (
                <Text style={styles.amigosEmpty}>Aún no tienes amigos. Agrega gente desde la sección Amigos.</Text>
              ) : (
                amigosLista
                  .filter((a: any) => {
                    // Excluir amigos que YA están inscritos en este partido como jugadores reales.
                    // No tiene sentido invitar a alguien que ya está adentro.
                    const userId = a.amigo_id || a.id;
                    const yaInscrito = (partido?.jugadores || []).some(
                      (j: any) => !j.es_invitado && j.usuario_id === userId
                    );
                    if (yaInscrito) return false;

                    // Filtro por búsqueda
                    if (!busquedaAmigos.trim()) return true;
                    const q = busquedaAmigos.toLowerCase();
                    const u = a.amigo || a;
                    return (u.nombre || '').toLowerCase().includes(q) ||
                           (u.apellido || '').toLowerCase().includes(q);
                  })
                  .map((a: any) => {
                    const u = a.amigo || a;
                    const userId = a.amigo_id || a.id;
                    const isSel = amigosSel.has(userId);
                    const initials = ((u.nombre?.[0] || '') + (u.apellido?.[0] || '')).toUpperCase();
                    return (
                      <TouchableOpacity
                        key={userId}
                        style={[styles.amigoRow, isSel && styles.amigoRowSel]}
                        onPress={() => toggleAmigo(userId)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.amigoAvatar, { backgroundColor: u.color_hex || COLORS.accent }]}>
                          {u.avatar_url
                            ? <Image source={{ uri: u.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                            : <Text style={styles.amigoInitials}>{initials || '?'}</Text>
                          }
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.amigoNombre}>{u.nombre} {u.apellido || ''}</Text>
                          {u.posicion && <Text style={styles.amigoMeta}>{u.posicion}{u.nivel ? ` · ${u.nivel}` : ''}</Text>}
                        </View>
                        <View style={[styles.amigoCheck, isSel && styles.amigoCheckSel]}>
                          {isSel && (
                            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <Path d="M5 12L10 17L19 8" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </Svg>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
              )}
            </ScrollView>

            {/* CTA */}
            <View style={styles.amigosFooter}>
              <TouchableOpacity
                style={[styles.amigosBtn, (amigosSel.size === 0 || enviandoAmigos) && { opacity: 0.4 }]}
                onPress={enviarInvitacionAmigos}
                disabled={amigosSel.size === 0 || enviandoAmigos}
                activeOpacity={0.85}
              >
                {enviandoAmigos
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.amigosBtnTxt}>
                      {amigosSel.size === 0
                        ? 'SELECCIONA AMIGOS'
                        : `ENVIAR A ${amigosSel.size} ${amigosSel.size === 1 ? 'AMIGO' : 'AMIGOS'}`}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal agregar invitado */}
      <Modal visible={modalInvitado} transparent animationType="none" onRequestClose={() => setModalInvitado(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={{ ...StyleSheet.flatten({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }), backgroundColor: 'rgba(0,0,0,0.45)' }} activeOpacity={1} onPress={() => setModalInvitado(false)} />
          <View style={styles.invModal}>
            <View style={styles.invHandle} />
            <View style={styles.invHeader}>
              <View>
                <Text style={styles.invTitle}>AGREGAR INVITADO</Text>
                <Text style={styles.invSubtitle}>Llena un lugar libre en tu equipo</Text>
              </View>
              <TouchableOpacity style={styles.invCloseBtn} onPress={() => setModalInvitado(false)}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6L18 18" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </TouchableOpacity>
            </View>
            {/* Selector visual de equipo */}
            <View style={styles.invEquipoLabel}>
              <Text style={styles.invInputLabel}>EQUIPO</Text>
            </View>
            <View style={styles.invEquipoRow}>
              <TouchableOpacity
                style={[styles.invEquipoBtn, equipoInvitado === 'A' && styles.invEquipoBtnSel]}
                onPress={() => setEquipoInvitado('A')}
                activeOpacity={0.7}
              >
                <View style={[styles.invEquipoDot, { backgroundColor: '#2196F3' }]} />
                <Text style={[styles.invEquipoTxt, equipoInvitado === 'A' && styles.invEquipoTxtSel]}>EQUIPO A</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.invEquipoBtn, equipoInvitado === 'B' && styles.invEquipoBtnSel]}
                onPress={() => setEquipoInvitado('B')}
                activeOpacity={0.7}
              >
                <View style={[styles.invEquipoDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.invEquipoTxt, equipoInvitado === 'B' && styles.invEquipoTxtSel]}>EQUIPO B</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.invBanner}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke={COLORS.accent} strokeWidth="1.8"/>
                <Path d="M12 8V12" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round"/>
                <Circle cx="12" cy="16" r="1" fill={COLORS.accent}/>
              </Svg>
              <Text style={styles.invBannerTxt}>Estás confirmado en este partido. Puedes agregar un invitado para ocupar un lugar libre en tu equipo.</Text>
            </View>
            {/* Chip con precio del invitado — usa precio_final (con descuento si hay) */}
            <View style={styles.invPrecioRow}>
              <Text style={styles.invPrecioLabel}>COSTO DEL INVITADO</Text>
              <Text style={styles.invPrecioVal}>
                ${Number(partido?.precio_final ?? partido?.precio_jugador ?? 0)} MXN
                {(partido?.descuento_porcentaje || 0) > 0 && (
                  <Text style={{ color: '#FF6B35', fontSize: 12 }}>  (-{partido.descuento_porcentaje}%)</Text>
                )}
              </Text>
            </View>
            <View style={styles.invInputWrap}>
              <Text style={styles.invInputLabel}>NOMBRE DEL INVITADO</Text>
              <View style={styles.invInputRow}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="8" r="4" stroke="rgba(0,0,0,0.3)" strokeWidth="1.8"/>
                  <Path d="M4 20C4 17 7.6 14.5 12 14.5C16.4 14.5 20 17 20 20" stroke="rgba(0,0,0,0.3)" strokeWidth="1.8" strokeLinecap="round"/>
                </Svg>
                <TextInput
                  style={styles.invInput}
                  placeholder="Ej. Carlos Ramírez"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  value={invNombre}
                  onChangeText={t => { setInvNombre(t); setInvError(''); }}
                  maxLength={40}
                  autoFocus
                />
              </View>
              {!!invError && <Text style={styles.invError}>{invError}</Text>}
            </View>
            <View style={styles.invBtns}>
              <TouchableOpacity
                style={styles.invConfirmBtn}
                onPress={confirmarInvitado}
                disabled={enviandoInv}
                activeOpacity={0.85}
              >
                {enviandoInv
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.invConfirmTxt}>CONFIRMAR INVITADO</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.invCancelBtn} onPress={() => setModalInvitado(false)} activeOpacity={0.7}>
                <Text style={styles.invCancelTxt}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de reportar incidente del partido (sin jugador específico) */}
      <ReporteModal
        visible={reporteOpen}
        onClose={() => setReporteOpen(false)}
        partidoId={partido?.id || ''}
        reportadoId={null}
        onSent={() => setReporteOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: '#fff' },
  center:             { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  topbar:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff' },
  backBtn:            { padding: 2 },
  shareBtn:           { padding: 8, marginRight: -4, borderRadius: 10 },
  mdTitle:            { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 0.5, lineHeight: 22 },
  mdSubtitle:         { fontSize: 11, color: 'rgba(0,0,0,0.38)', marginTop: 1 },
  scroll:             { paddingBottom: 20 },
  // Hero
  hero:               { backgroundColor: '#111', marginHorizontal: 20, borderRadius: 20, padding: 18, marginBottom: 12, overflow: 'hidden' },
  heroVenue:          { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5, lineHeight: 28, marginBottom: 3 },
  heroCancha:         { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16 },
  heroPills:          { flexDirection: 'row', gap: 8 },
  heroPill:           { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 10, padding: 8, flex: 1 },
  pillLabel:          { fontSize: 9, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.5, marginBottom: 1 },
  pillVal:            { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  // Mapa
  mapBox:             { marginHorizontal: 20, height: 110, borderRadius: 16, overflow: 'hidden', backgroundColor: '#dde8d0', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' },
  mapPin:             { alignItems: 'center' },
  mapLabel:           { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 },
  mapLabelTxt:        { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  mapAddr:            { position: 'absolute', bottom: 10, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.5)' },
  mapHint:            { position: 'absolute', bottom: 10, right: 12, backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  mapHintTxt:         { fontSize: 9, fontWeight: '900', color: COLORS.accent, letterSpacing: 1 },
  // Banner elegir
  elegirBanner:       { marginHorizontal: 20, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  elegirEmoji:        { fontSize: 18 },
  elegirTxt:          { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 1, textAlign: 'center' },
  // Section label
  sectionLabel:       { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(0,0,0,0.28)', paddingHorizontal: 20, marginBottom: 10, marginTop: 4, textTransform: 'uppercase' },
  // Equipos
  equipoBlock:        { marginHorizontal: 20, marginBottom: 8 },
  equipoHeader:       { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  equipoDot:          { width: 8, height: 8, borderRadius: 4 },
  equipoTitle:        { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1.5 },
  slotsGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  slotItem:           { alignItems: 'center', width: 56 },
  slotAvatar:         { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  slotAvatarEmpty:    { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.15)', elevation: 0, shadowOpacity: 0 },
  slotAvatarSelected: { backgroundColor: 'rgba(122,184,0,0.15)', borderWidth: 2.5, borderColor: COLORS.accent, borderStyle: 'solid', overflow: 'hidden' },
  slotInitials:       { fontSize: 16, fontWeight: '900', color: '#fff' },
  slotPlus:           { fontSize: 20, color: 'rgba(0,0,0,0.25)', lineHeight: 24 },
  slotName:           { fontSize: 10, fontWeight: '700', color: '#111', letterSpacing: 0.2, textAlign: 'center' },
  slotNameEmpty:      { color: 'rgba(0,0,0,0.3)' },
  slotPos:            { fontSize: 9, color: 'rgba(0,0,0,0.3)', marginTop: 1 },
  // VS
  vsDivider:          { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 14, gap: 10 },
  vsLine:             { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  vsText:             { fontSize: 12, fontWeight: '900', color: 'rgba(0,0,0,0.25)', letterSpacing: 2 },
  // Reglas
  rulesCard:          { marginHorizontal: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  ruleRow:            { flexDirection: 'row', padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', gap: 10 },
  ruleDot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.25)', marginTop: 5, flexShrink: 0 },
  ruleText:           { flex: 1, fontSize: 12.5, color: 'rgba(0,0,0,0.55)', lineHeight: 18 },
  // Join bar (paddingBottom dinámico por safe-area inset)
  joinBar:            { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)' },
  joinBtn:            { height: 54, backgroundColor: '#111', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  joinBtnDisabled:    { backgroundColor: '#111' },
  joinBtnTxt:         { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1.2 },
  invBar:             { height: 44, backgroundColor: COLORS.accent, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  invBarTxt:          { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 1 },
  cancelInscBtn:      { height: 40, marginTop: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(214,43,43,0.3)', backgroundColor: 'rgba(214,43,43,0.05)' },
  cancelInscTxt:      { fontSize: 11, fontWeight: '900', color: '#D62B2B', letterSpacing: 1 },
  cancelInscBtnSolo:  { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D62B2B' },
  cancelInscBtnSoloTxt:{ fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1.2 },
  // Preview slot
  slotPreviewRing:    { position: 'absolute', inset: 0, borderRadius: 25, borderWidth: 2.5, borderColor: COLORS.accent },
  slotPreviewTag:     { fontSize: 8, color: COLORS.accent, fontWeight: '700', letterSpacing: 0.5, marginTop: 1 },
  slotAvatarMiInvitado:{ borderWidth: 2, borderColor: COLORS.accent },
  slotAvatarOtroInvitado:{ borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)', borderStyle: 'dashed' },
  slotInvitadoBadge:  { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D62B2B', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  slotInvitadoBadgeTxt:{ fontSize: 12, fontWeight: '900', color: '#fff', lineHeight: 14 },
  slotInvitadoTag:    { fontSize: 8, color: COLORS.accent, fontWeight: '700', letterSpacing: 0.5, marginTop: 1 },
  slotOtroInvitadoTag:{ fontSize: 8, color: 'rgba(0,0,0,0.4)', fontWeight: '600', letterSpacing: 0.5, marginTop: 1, fontStyle: 'italic' },
  slotAvatarYo:       { borderWidth: 2.5, borderColor: COLORS.accent, overflow: 'hidden' },
  slotNameYo:         { color: COLORS.accent, fontWeight: '900' },
  slotYoTag:          { fontSize: 8, color: COLORS.accent, fontWeight: '900', letterSpacing: 1, marginTop: 1, textTransform: 'uppercase' },
  cancelBtn:          { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  cancelBtnTxt:       { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', lineHeight: 14 },
  // Modal invitado
  invModal:           { backgroundColor: '#fff', borderRadius: 28, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 32 },
  invHandle:          { width: 36, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  invHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  invTitle:           { fontSize: 18, fontWeight: '900', letterSpacing: 0.4, color: '#111', lineHeight: 20 },
  invSubtitle:        { fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 4 },
  invCloseBtn:        { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  invBanner:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 20, marginBottom: 12, backgroundColor: 'rgba(122,184,0,0.08)', borderWidth: 1, borderColor: 'rgba(122,184,0,0.25)', borderRadius: 14, padding: 12 },
  invPrecioRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 18, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 12 },
  invEquipoLabel:     { paddingHorizontal: 20, marginBottom: 8 },
  invEquipoRow:       { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 18 },
  invEquipoBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#fff' },
  invEquipoBtnSel:    { borderColor: '#111', backgroundColor: 'rgba(0,0,0,0.04)' },
  invEquipoDot:       { width: 10, height: 10, borderRadius: 5 },
  invEquipoTxt:       { fontSize: 12, fontWeight: '800', color: 'rgba(0,0,0,0.5)', letterSpacing: 1 },
  invEquipoTxtSel:    { color: '#111' },
  // Modal invitar amigos
  amigosModal:        { marginTop: 'auto', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30, maxHeight: '85%' },
  amigosHeader:       { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12 },
  amigosTitle:        { fontSize: 14, fontWeight: '900', color: '#111', letterSpacing: 1 },
  amigosSubtitle:     { fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 },
  amigosClose:        { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  amigosSearch:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12 },
  amigosSearchInput:  { flex: 1, fontSize: 13, color: '#111' },
  amigosEmpty:        { textAlign: 'center', color: 'rgba(0,0,0,0.4)', fontSize: 13, padding: 30, paddingHorizontal: 40 },
  amigoRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  amigoRowSel:        { backgroundColor: 'rgba(122,184,0,0.08)' },
  amigoAvatar:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  amigoInitials:      { fontSize: 14, fontWeight: '900', color: '#fff' },
  amigoNombre:        { fontSize: 14, fontWeight: '700', color: '#111' },
  amigoMeta:          { fontSize: 11, color: 'rgba(0,0,0,0.4)', marginTop: 1 },
  amigoCheck:         { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  amigoCheckSel:      { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  amigosFooter:       { padding: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  amigosBtn:          { height: 50, backgroundColor: COLORS.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  amigosBtnTxt:       { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 1.2 },
  reportarLink:       { fontSize: 12, color: 'rgba(0,0,0,0.4)', fontWeight: '600', textAlign: 'center', textDecorationLine: 'underline', paddingVertical: 10, paddingHorizontal: 16 },
  invPrecioLabel:     { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.45)', letterSpacing: 1 },
  invPrecioVal:       { fontSize: 16, fontWeight: '900', color: '#111', letterSpacing: 0.3 },
  invBannerTxt:       { flex: 1, fontSize: 12, color: 'rgba(0,0,0,0.55)', lineHeight: 18 },
  invInputWrap:       { paddingHorizontal: 20, marginBottom: 6 },
  invInputLabel:      { fontSize: 11, fontWeight: '600', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5, marginBottom: 8 },
  invInputRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F4F3EF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.09)', borderRadius: 14, paddingHorizontal: 14, height: 52 },
  invInput:           { flex: 1, fontSize: 15, fontWeight: '700', color: '#111' },
  invError:           { fontSize: 11, color: '#D62B2B', marginTop: 6, paddingLeft: 2 },
  invBtns:            { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  invConfirmBtn:      { height: 52, backgroundColor: COLORS.accent, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  invConfirmTxt:      { fontSize: 15, fontWeight: '900', letterSpacing: 1.5, color: '#000' },
  invCancelBtn:       { height: 46, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  invCancelTxt:       { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: 'rgba(0,0,0,0.4)' },
});