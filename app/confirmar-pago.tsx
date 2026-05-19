import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Easing, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { COLORS } from '@/constants';
import { track } from '@/lib/analytics';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function CheckIcon() {
  return (
    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <Path d="M5 12L10 17L19 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function CardIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#fff" strokeWidth="1.8"/>
      <Path d="M2 10H22" stroke="#fff" strokeWidth="1.8"/>
    </Svg>
  );
}

type Stage = 'confirm' | 'processing' | 'success';
type MetodoPago = 'visa' | 'mc' | 'applepay';

export default function ConfirmarPagoScreen() {
  const router = useRouter();
  const { request } = useApi();
  const {
    partido_id, equipo, complejo, cancha, fecha,
    hora, precio, tipo, es_invitado, nombre_invitado,
  } = useLocalSearchParams<{
    partido_id: string; equipo: string; complejo: string;
    cancha: string; fecha: string; hora: string;
    precio: string; tipo: string;
    es_invitado?: string; nombre_invitado?: string;
  }>();

  const esInvitado = es_invitado === 'true';

  const [stage, setStage]   = useState<Stage>('confirm');
  const [metodo, setMetodo] = useState<MetodoPago>('visa');
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (stage === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    }
    if (stage === 'success') {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [stage]);

  async function handlePagar() {
    setStage('processing');
    try {
      await new Promise(r => setTimeout(r, 1500));
      if (esInvitado) {
        // Inscribir invitado
        await request(`/partidos/${partido_id}/invitado`, {
          method: 'POST',
          body: JSON.stringify({ equipo, nombre_invitado }),
        });
        track('invitado_pagado', {
          partido_id,
          equipo,
          precio:  Number(precio) || 0,
          metodo,
        });
      } else {
        // Inscribir usuario normal
        await request(`/partidos/${partido_id}/unirse`, {
          method: 'POST',
          body: JSON.stringify({ equipo }),
        });
        track('partido_inscripcion_completada', {
          partido_id,
          equipo,
          precio:  Number(precio) || 0,
          tipo,
          metodo,
        });
      }
      setStage('success');
    } catch (e: any) {
      setStage('confirm');
      const msg = e?.message || 'No pudimos procesar el pago. Intenta de nuevo.';
      track('partido_inscripcion_fallo', {
        partido_id,
        es_invitado: esInvitado,
        error:       msg.slice(0, 100),
      });
      Alert.alert('No se pudo completar', msg);
    }
  }

  function handleVerReservas() {
    // Navega reemplazando el stack para forzar reload de reservas
    router.replace('/(tabs)/reservas');
  }

  function formatFecha(f: string) {
    if (!f) return '';
    const d = new Date(f + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // ── PROCESANDO ──
  if (stage === 'processing') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.processingWrap}>
          <Animated.View style={[styles.processingRing, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.processingInner}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          </Animated.View>
          <Text style={styles.processingTitle}>Procesando...</Text>
          <Text style={styles.processingSubtitle}>
            {esInvitado ? `Registrando a ${nombre_invitado}` : 'Asignando tu lugar en el partido'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── ÉXITO ──
  if (stage === 'success') {
    return (
      <SafeAreaView style={styles.root}>
        <Animated.View style={[styles.successWrap, { opacity: opacityAnim }]}>
          <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
            <CheckIcon />
          </Animated.View>
          <Text style={styles.successTitle}>¡LISTO!</Text>
          <Text style={styles.successSubtitle}>
            {esInvitado
              ? `${nombre_invitado} fue agregado al partido.\n¡Nos vemos en la cancha!`
              : `Tu lugar ha sido reservado.\nTe vemos en la cancha.`}
          </Text>

          <View style={styles.successCard}>
            <Text style={styles.successVenue}>{complejo}</Text>
            <Text style={styles.successDetail}>{cancha} · {formatFecha(fecha)} · {hora?.slice(0,5)}</Text>
            {esInvitado && (
              <View style={[styles.successEquipoBadge, { marginBottom: 6 }]}>
                <View style={styles.successEquipoDot} />
                <Text style={styles.successEquipoTxt}>INVITADO: {nombre_invitado?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.successEquipoBadge}>
              <View style={styles.successEquipoDot} />
              <Text style={styles.successEquipoTxt}>EQUIPO {equipo?.toUpperCase()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.successBtn} onPress={handleVerReservas} activeOpacity={0.85}>
            <Text style={styles.successBtnTxt}>VER MIS RESERVAS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.successBtnSec} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.successBtnSecTxt}>Volver al partido</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── CONFIRMAR ──
  return (
    <SafeAreaView style={styles.root}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>{esInvitado ? 'Pago del invitado' : 'Confirmar pago'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Card negro — resumen del partido */}
        <View style={styles.partidoCard}>
          <Text style={styles.partidoLabel}>Partido</Text>
          <Text style={styles.partidoVenue}>{complejo}</Text>
          <Text style={styles.partidoCancha}>{cancha} · {tipo}</Text>
          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>FECHA</Text>
              <Text style={styles.pillVal}>{formatFecha(fecha)}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>HORA</Text>
              <Text style={styles.pillVal}>{hora?.slice(0,5)}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>TOTAL</Text>
              <Text style={[styles.pillVal, { color: COLORS.accent }]}>${precio}</Text>
            </View>
          </View>
        </View>

        {/* Método de pago */}
        <Text style={styles.sectionLabel}>Método de pago</Text>
        <View style={styles.metodosCard}>
          {([
            { id: 'visa',     nombre: 'Visa',       num: '•••• 7890', logo: 'VISA' },
            { id: 'mc',       nombre: 'Mastercard', num: '•••• 3610', logo: 'MC' },
            { id: 'applepay', nombre: 'Apple Pay',  num: 'iPhone',    logo: 'AP' },
          ] as { id: MetodoPago; nombre: string; num: string; logo: string }[]).map((m, i, arr) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.metodoRow, i < arr.length - 1 && styles.metodoRowBorder]}
              onPress={() => setMetodo(m.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.metodoLogo, m.id === 'applepay' && styles.metodoLogoBlack]}>
                <Text style={[styles.metodoLogoTxt, m.id === 'visa' && { color: '#1A1F71' }, m.id === 'applepay' && { color: '#fff', fontSize: 9 }]}>
                  {m.logo === 'MC' ? '●●' : m.logo}
                </Text>
              </View>
              <View style={styles.metodoInfo}>
                <Text style={styles.metodoNombre}>{m.nombre}</Text>
                <Text style={styles.metodoNum}>{m.num}</Text>
              </View>
              <View style={[styles.metodoCheck, metodo === m.id && styles.metodoCheckActive]}>
                {metodo === m.id && (
                  <Svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Política */}
        <Text style={styles.politicaTxt}>
          Cancelación gratuita hasta 2 horas antes del partido.{'\n'}Sin reembolso después de ese plazo.
        </Text>

      </ScrollView>

      {/* Botón pagar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.pagarBtn, stage !== 'confirm' && { opacity: 0.6 }]}
          onPress={handlePagar}
          disabled={stage !== 'confirm'}
          activeOpacity={0.85}
        >
          <CardIcon />
          <Text style={styles.pagarBtnTxt}>PAGAR ${precio} MXN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: '#fff' },

  // Topbar
  topbar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:            { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  topbarTitle:        { fontSize: 16, fontWeight: '900', color: '#111', letterSpacing: 0.3 },

  // Scroll
  scroll:             { paddingHorizontal: 20, paddingBottom: 24 },

  // Partido card
  partidoCard:        { backgroundColor: '#111', borderRadius: 20, padding: 18, marginBottom: 20 },
  partidoLabel:       { fontSize: 10, letterSpacing: 0.12*10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: '600' },
  partidoVenue:       { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.3, lineHeight: 24, marginBottom: 2 },
  partidoCancha:      { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  pillsRow:           { flexDirection: 'row', gap: 8 },
  pill:               { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 8 },
  pillLabel:          { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, marginBottom: 3 },
  pillVal:            { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Métodos
  sectionLabel:       { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  metodosCard:        { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  metodoRow:          { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 14 },
  metodoRowBorder:    { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  metodoLogo:         { width: 44, height: 30, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metodoLogoBlack:    { backgroundColor: '#000', borderColor: '#000' },
  metodoLogoTxt:      { fontSize: 13, fontWeight: '900', color: '#333', letterSpacing: -0.3 },
  metodoInfo:         { flex: 1 },
  metodoNombre:       { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: 0.2 },
  metodoNum:          { fontSize: 11, color: 'rgba(0,0,0,0.38)', marginTop: 2, letterSpacing: 0.5 },
  metodoCheck:        { width: 24, height: 24, borderRadius: 7, borderWidth: 1.8, borderColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  metodoCheckActive:  { backgroundColor: COLORS.accent, borderColor: COLORS.accent },

  // Política
  politicaTxt:        { fontSize: 10.5, color: 'rgba(0,0,0,0.32)', lineHeight: 16, textAlign: 'center', paddingHorizontal: 8 },

  // Footer
  footer:             { padding: 20, paddingBottom: 32, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  pagarBtn:           { height: 54, backgroundColor: '#111', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pagarBtnTxt:        { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1.2 },

  // Processing
  processingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  processingRing:     { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(122,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  processingInner:    { width: 70, height: 70, borderRadius: 35, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  processingTitle:    { fontSize: 22, fontWeight: '900', color: '#111' },
  processingSubtitle: { fontSize: 13, color: 'rgba(0,0,0,0.4)' },

  // Success
  successWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  successCircle:      { width: 72, height: 72, borderRadius: 36, backgroundColor: '#00A85A', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle:       { fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: 0.3, marginBottom: 8 },
  successSubtitle:    { fontSize: 14, color: 'rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successCard:        { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 16, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  successVenue:       { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 4 },
  successDetail:      { fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 12 },
  successEquipoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(122,184,0,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  successEquipoDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.accent },
  successEquipoTxt:   { fontSize: 10, fontWeight: '800', color: COLORS.accent, letterSpacing: 1 },
  successBtn:         { width: '100%', height: 50, backgroundColor: COLORS.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  successBtnTxt:      { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1.2 },
  successBtnSec:      { width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' },
  successBtnSecTxt:   { fontSize: 13, color: 'rgba(0,0,0,0.4)', fontWeight: '600' },
});
