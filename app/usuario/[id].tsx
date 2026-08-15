// ═══════════════════════════════════════════════════════════════
// RETTA — app/usuario/[id].tsx — Perfil público de otro jugador
// (rediseño 2026-07-21): réplica exacta del layout del perfil propio
// usando los bloques compartidos de components/PerfilBloques.tsx —
// stats con íconos (no clicables aquí), Posición|Nivel, RATING con
// gráfica y Racha con track. En lugar de "Editar perfil" va el botón
// de amistad (agregar / eliminar / aceptar / cancelar según estado).
// ═══════════════════════════════════════════════════════════════
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { track } from '@/lib/analytics';
import React, { useEffect, useState } from 'react';
import { AppAlert } from '@/lib/appAlert';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import ReporteModal from '@/components/ReporteModal';
import { StatsRow, AmigosChip, PosNivelRow, RatingCard, RachaCard, RatingPunto } from '@/components/PerfilBloques';

interface AmistadInfo {
  id: string;
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'bloqueada';
  yo_envie: boolean;
  created_at: string;
}

interface Perfil {
  id: string;
  nombre: string;
  apellido?: string;
  avatar_url?: string;
  posicion?: string;
  nivel?: string;             // legacy (ya no se muestra: el nivel se deriva del rating)
  rating?: number;            // sistema v2: escala 1-10
  rating_calibrando?: boolean;
  partidos_calibracion?: number;
  ciudad?: string;
  partidos_jug?: number;
  partidos_gan?: number;
  racha_actual?: number;
  racha_max?: number;
  color_hex?: string;
  amigos_count?: number;
  rating_historial?: RatingPunto[];
  es_yo: boolean;
  amistad: AmistadInfo | null;
}

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

export default function PerfilPublicoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { request } = useApi();
  const { user } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil]   = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [actuando, setActuando] = useState(false);
  const [reporteOpen, setReporteOpen] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const data = await request(`/usuarios/${id}/perfil`);
      setPerfil(data);
    } catch (e: any) {
      AppAlert.alert('Error', e?.message || 'No se pudo cargar el perfil.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function enviarSolicitud() {
    if (!perfil) return;
    setActuando(true);
    try {
      await request('/amistades', {
        method: 'POST',
        body: JSON.stringify({ usuario_id: perfil.id }),
      });
      track('amigo_solicitud_enviada', { target_id: perfil.id });
      AppAlert.alert('Solicitud enviada', `Le enviamos tu solicitud a ${perfil.nombre}.`);
      await load();
    } catch (e: any) {
      AppAlert.alert('Error', e?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setActuando(false);
    }
  }

  async function responderSolicitud(action: 'aceptar' | 'rechazar') {
    if (!perfil?.amistad?.id) return;
    setActuando(true);
    try {
      await request(`/amistades/${perfil.amistad.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      track('amigo_solicitud_respondida', { action });
      await load();
    } catch (e: any) {
      AppAlert.alert('Error', e?.message || 'No se pudo procesar.');
    } finally {
      setActuando(false);
    }
  }

  function eliminarAmistad() {
    if (!perfil?.amistad?.id) return;
    AppAlert.alert(
      perfil.amistad.status === 'aceptada' ? 'Eliminar amigo' : 'Cancelar solicitud',
      perfil.amistad.status === 'aceptada'
        ? `¿Seguro que quieres eliminar a ${perfil.nombre} de tus amigos?`
        : '¿Cancelar la solicitud?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: async () => {
            setActuando(true);
            try {
              await request(`/amistades/${perfil.amistad!.id}`, { method: 'DELETE' });
              await load();
            } catch (e: any) {
              AppAlert.alert('Error', e?.message || 'No se pudo eliminar.');
            } finally {
              setActuando(false);
            }
          },
        },
      ]
    );
  }

  if (loading || !perfil) {
    return (
      <View style={styles.center}>
        <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator color={DT.primary} size="large" />
      </View>
    );
  }

  const initials = ((perfil.nombre?.[0] || '') + (perfil.apellido?.[0] || '')).toUpperCase() || '?';
  const avatarBg = perfil.color_hex || DT.surfaceHigh;

  // Botón de acción bajo el nombre — mismo lugar donde el perfil propio
  // tiene "Editar perfil", cambia según el estado de amistad.
  function renderActionBtn() {
    if (perfil!.es_yo) {
      return (
        <TouchableOpacity style={styles.pillGlass} onPress={() => router.push('/editar-perfil')} activeOpacity={0.75}>
          <Text style={styles.pillGlassTxt}>Editar perfil</Text>
          <EditIcon />
        </TouchableOpacity>
      );
    }
    const a = perfil!.amistad;
    if (!a || a.status === 'rechazada') {
      return (
        <TouchableOpacity onPress={enviarSolicitud} disabled={actuando} activeOpacity={0.85}>
          <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pillPrimary}>
            {actuando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.pillPrimaryTxt}>+  AGREGAR AMIGO</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    // Un solo botón por estado (pedido de Rafael 2026-07-22): si ya son
    // amigos, SOLO "Eliminar amigo" — sin pill de "AMIGOS" encima.
    if (a.status === 'aceptada') {
      return (
        <TouchableOpacity style={styles.pillGlass} onPress={eliminarAmistad} disabled={actuando} activeOpacity={0.75}>
          {actuando
            ? <ActivityIndicator color={DT.error} size="small" />
            : <Text style={styles.pillDangerTxt}>Eliminar amigo</Text>
          }
        </TouchableOpacity>
      );
    }
    if (a.status === 'pendiente' && a.yo_envie) {
      return (
        <TouchableOpacity style={styles.pillGlass} onPress={eliminarAmistad} disabled={actuando} activeOpacity={0.75}>
          {actuando
            ? <ActivityIndicator color={DT.error} size="small" />
            : <Text style={styles.pillDangerTxt}>Cancelar solicitud</Text>
          }
        </TouchableOpacity>
      );
    }
    if (a.status === 'pendiente' && !a.yo_envie) {
      return (
        <View style={{ alignItems: 'center', gap: 8, alignSelf: 'stretch' }}>
          <Text style={styles.solicitudHint}>{perfil!.nombre} te envió una solicitud</Text>
          <TouchableOpacity onPress={() => responderSolicitud('aceptar')} disabled={actuando} activeOpacity={0.85} style={{ alignSelf: 'stretch' }}>
            <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pillPrimary}>
              {actuando ? <ActivityIndicator color="#fff" /> : <Text style={styles.pillPrimaryTxt}>ACEPTAR SOLICITUD</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => responderSolicitud('rechazar')} disabled={actuando} hitSlop={8}>
            <Text style={styles.linkDanger}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null; // bloqueada → sin acciones
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top','bottom']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Perfil</Text>
        {perfil.es_yo ? (
          <View style={{ width: 42 }} />
        ) : (
          /* Botón directo de reportar (bandera) — antes era un menú de 3
             puntitos que no se entendía. Pedido del Foco 2026-07-27. */
          <TouchableOpacity
            onPress={() => {
              AppAlert.alert(
                `Reportar a ${perfil.nombre}`,
                'Si esta persona tuvo conducta inadecuada, dañó el espíritu del juego o cometió algún acto grave, repórtala. El equipo de Retta revisará el caso.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Reportar', style: 'destructive', onPress: () => setReporteOpen(true) },
                ]
              );
            }}
            style={[styles.backBtn, styles.reportBtn]}
            hitSlop={8}
          >
            <Svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <Path d="M4 21V4.5C4 4.5 5.5 3 8.5 3C11.5 3 12.5 4.8 15.5 4.8C18.5 4.8 20 3.6 20 3.6V14.4C20 14.4 18.5 15.6 15.5 15.6C12.5 15.6 11.5 13.8 8.5 13.8C5.5 13.8 4 15.3 4 15.3" stroke={DT.onBg} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero: avatar grande + nombre (sin subtítulo, igual que el propio) */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={[styles.avatarInner, { backgroundColor: avatarBg }]}>
              {perfil.avatar_url
                ? <Image source={{ uri: perfil.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 70 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                : <Text style={styles.avatarTxt}>{initials}</Text>
              }
            </View>
          </View>
          <Text style={styles.nombre}>{perfil.nombre}{perfil.apellido ? ` ${perfil.apellido}` : ''}</Text>
          <View style={styles.actionWrap}>
            {renderActionBtn()}
            <AmigosChip count={perfil.amigos_count ?? 0} />
          </View>
        </View>

        <StatsRow
          jugados={perfil.partidos_jug ?? 0}
          ganados={perfil.partidos_gan ?? 0}
          goles={(perfil as any).goles_total ?? 0}
          onJugados={() => router.push({ pathname: '/historial-partidos', params: { filtro: 'jugados', usuario_id: perfil.id, nombre: perfil.nombre } })}
          onGanados={() => router.push({ pathname: '/historial-partidos', params: { filtro: 'ganados', usuario_id: perfil.id, nombre: perfil.nombre } })}
          onGoles={() => router.push({ pathname: '/goles', params: { usuario_id: perfil.id, nombre: perfil.nombre } })}
        />

        <PosNivelRow
          posicion={perfil.posicion}
          rating={perfil.rating ?? 5.0}
          calibrando={perfil.rating_calibrando ?? false}
        />

        <RatingCard
          rating={perfil.rating ?? 5.0}
          historial={perfil.rating_historial || []}
          calibrando={perfil.rating_calibrando ?? false}
          partidosCalibracion={perfil.partidos_calibracion ?? 0}
          onPress={() => router.push({ pathname: '/rating', params: { usuario_id: perfil.id, nombre: `${perfil.nombre}${perfil.apellido ? ' ' + perfil.apellido : ''}` } })}
        />

        <RachaCard racha={perfil.racha_actual ?? 0} rachaMax={perfil.racha_max ?? 0} />
      </ScrollView>
      </SafeAreaView>

      {/* Modal de reporte (sin partidoId — modo perfil global) */}
      <ReporteModal
        visible={reporteOpen}
        onClose={() => setReporteOpen(false)}
        reportadoId={perfil.id}
        reportadoNombre={`${perfil.nombre || ''}${perfil.apellido ? ' ' + perfil.apellido : ''}`.trim()}
        onSent={() => setReporteOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DT.bg },
  center:       { flex: 1, backgroundColor: DT.bg, alignItems: 'center', justifyContent: 'center' },

  topbar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.gutter, paddingVertical: 14 },
  backBtn:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  // Bandera BLANCA sobre glass neutro (decisión Rafael/Foco 2026-08-02)
  reportBtn:    {},
  topbarTitle:  { fontSize: 16, color: DT.onBg, letterSpacing: 0.3, fontFamily: FONTS.heading },

  scroll:       { paddingHorizontal: SPACING.gutter, paddingBottom: 40 },

  hero:         { alignItems: 'center', paddingVertical: 6 },
  avatarRing:   { width: 148, height: 148, borderRadius: 74, padding: 5, borderWidth: 3, borderColor: DT.primaryStrong, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: DT.primaryContainer, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  avatarInner:  { width: '100%', height: '100%', borderRadius: 70, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:    { fontSize: 42, color: '#fff', fontFamily: FONTS.heading },
  nombre:       { fontSize: 27, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, lineHeight: 32, textAlign: 'center' },

  actionWrap:   { marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },

  pillPrimary:    { height: 46, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, minWidth: 220 },
  pillPrimaryTxt: { fontSize: 13, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },

  pillGlass:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 11, borderRadius: RADIUS.full, backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorderStrong },
  pillGlassTxt: { fontSize: 13, color: DT.onBg, fontFamily: FONTS.monoMed, letterSpacing: 0.3 },

  pillDangerTxt:{ fontSize: 13, color: DT.error, fontFamily: FONTS.monoMed, letterSpacing: 0.3 },

  linkDanger:   { fontSize: 13, color: DT.error, fontFamily: FONTS.bodyMed },
  solicitudHint:{ fontSize: 13, color: DT.onSurfaceVar, textAlign: 'center', fontFamily: FONTS.body },
});
