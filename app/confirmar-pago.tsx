import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Easing, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { track } from '@/lib/analytics';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        await request(`/partidos/${partido_id}/invitado`, {
          method: 'POST',
          body: JSON.stringify({ equipo, nombre_invitado }),
        });
        track('invitado_pagado', {
          partido_id, equipo, precio: Number(precio) || 0, metodo,
        });
      } else {
        await request(`/partidos/${partido_id}/unirse`, {
          method: 'POST',
          body: JSON.stringify({ equipo }),
        });
        track('partido_inscripcion_completada', {
          partido_id, equipo, precio: Number(precio) || 0, tipo, metodo,
        });
      }
      setStage('success');
    } catch (e: any) {
      setStage('confirm');
      const msg = e?.message || 'No pudimos procesar el pago. Intenta de nuevo.';
      track('partido_inscripcion_fallo', {
        partido_id, es_invitado: esInvitado, error: msg.slice(0, 100),
      });
      Alert.alert('No se pudo completar', msg);
    }
  }

  function handleVerReservas() {
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
      <View style={styles.root}>
        <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.processingWrap}>
          <Animated.View style={[styles.processingRing, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.processingInner}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          </Animated.View>
          <Text style={styles.processingTitle}>Procesando…</Text>
          <Text style={styles.processingSubtitle}>
            {esInvitado ? `Registrando a ${nombre_invitado}` : 'Asignando tu lugar en el partido'}
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  // ── ÉXITO ──
  if (stage === 'success') {
    return (
      <View style={styles.root}>
        <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }}>
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

            <TouchableOpacity onPress={handleVerReservas} activeOpacity={0.85} style={{ width: '100%' }}>
              <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.successBtn}>
                <Text style={styles.successBtnTxt}>VER MIS RESERVAS</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.successBtnSec} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.successBtnSecTxt}>Volver al partido</Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // ── CONFIRMAR ──
  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>{esInvitado ? 'Pago del invitado' : 'Confirmar pago'}</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Card — resumen del partido */}
          <View style={styles.partidoCard}>
            <Text style={styles.partidoLabel}>PARTIDO</Text>
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
                <Text style={[styles.pillVal, { color: DT.primary }]}>${precio}</Text>
              </View>
            </View>
          </View>

          {/* Método de pago */}
          <Text style={styles.sectionLabel}>MÉTODO DE PAGO</Text>
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
                <View style={styles.metodoLogo}>
                  <Text style={styles.metodoLogoTxt}>{m.logo === 'MC' ? '●●' : m.logo}</Text>
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

          <Text style={styles.politicaTxt}>
            Cancelación gratuita hasta 2 horas antes del partido.{'\n'}Sin reembolso después de ese plazo.
          </Text>

        </ScrollView>

        {/* Botón pagar */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handlePagar} disabled={stage !== 'confirm'} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pagarBtn, stage !== 'confirm' && { opacity: 0.6 }]}>
              <CardIcon />
              <Text style={styles.pagarBtnTxt}>PAGAR ${precio} MXN</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: DT.bg },
  topbar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.gutter, paddingVertical: 14 },
  backBtn:            { width: 42, height: 42, borderRadius: 21, backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, alignItems: 'center', justifyContent: 'center' },
  topbarTitle:        { fontSize: 16, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  scroll:             { paddingHorizontal: SPACING.gutter, paddingBottom: 24 },

  partidoCard:        { backgroundColor: DT.surfaceLow, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.xl, padding: 20, marginBottom: 22, marginTop: 4 },
  partidoLabel:       { fontSize: 10, letterSpacing: 1.5, color: DT.primary, marginBottom: 6, fontFamily: FONTS.mono },
  partidoVenue:       { fontSize: 24, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, lineHeight: 26, marginBottom: 3 },
  partidoCancha:      { fontSize: 13, color: DT.onSurfaceVar, marginBottom: 16, fontFamily: FONTS.body },
  pillsRow:           { flexDirection: 'row', gap: 10 },
  pill:               { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.md, padding: 10 },
  pillLabel:          { fontSize: 9, color: DT.outline, letterSpacing: 0.5, marginBottom: 3, fontFamily: FONTS.mono },
  pillVal:            { fontSize: 13, color: DT.onBg, fontFamily: FONTS.bodyMed },

  sectionLabel:       { fontSize: 11, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 12, fontFamily: FONTS.mono },
  metodosCard:        { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 18 },
  metodoRow:          { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 14 },
  metodoRowBorder:    { borderBottomWidth: 1, borderBottomColor: DT.glassBorder },
  metodoLogo:         { width: 44, height: 30, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metodoLogoTxt:      { fontSize: 12, color: DT.onBg, fontFamily: FONTS.bodyBold, letterSpacing: -0.3 },
  metodoInfo:         { flex: 1 },
  metodoNombre:       { fontSize: 15, color: DT.onBg, fontFamily: FONTS.bodyMed, letterSpacing: 0.2 },
  metodoNum:          { fontSize: 11, color: DT.onSurfaceVar, marginTop: 2, letterSpacing: 0.5, fontFamily: FONTS.mono },
  metodoCheck:        { width: 24, height: 24, borderRadius: 7, borderWidth: 1.8, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  metodoCheckActive:  { backgroundColor: DT.primaryContainer, borderColor: DT.primaryContainer },

  politicaTxt:        { fontSize: 11, color: DT.outline, lineHeight: 16, textAlign: 'center', paddingHorizontal: 8, fontFamily: FONTS.body },

  footer:             { padding: SPACING.gutter, paddingBottom: 32, backgroundColor: DT.surfaceLowest, borderTopWidth: 1, borderTopColor: DT.glassBorder },
  pagarBtn:           { height: 56, borderRadius: RADIUS.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pagarBtnTxt:        { fontSize: 14, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },

  processingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  processingRing:     { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(190,194,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  processingInner:    { width: 70, height: 70, borderRadius: 35, backgroundColor: DT.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  processingTitle:    { fontSize: 22, color: DT.onBg, fontFamily: FONTS.display },
  processingSubtitle: { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },

  successWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  successCircle:      { width: 76, height: 76, borderRadius: 38, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#1D9E75', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 8 },
  successTitle:       { fontSize: 30, color: DT.onBg, fontFamily: FONTS.display, letterSpacing: -0.5, marginBottom: 8 },
  successSubtitle:    { fontSize: 14, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 22, marginBottom: 24, fontFamily: FONTS.body },
  successCard:        { width: '100%', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 18, marginBottom: 24 },
  successVenue:       { fontSize: 18, color: DT.onBg, fontFamily: FONTS.heading, marginBottom: 4 },
  successDetail:      { fontSize: 12, color: DT.onSurfaceVar, marginBottom: 12, fontFamily: FONTS.body },
  successEquipoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(190,194,255,0.12)', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  successEquipoDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: DT.primary },
  successEquipoTxt:   { fontSize: 10, color: DT.primary, fontFamily: FONTS.mono, letterSpacing: 1 },
  successBtn:         { width: '100%', height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  successBtnTxt:      { fontSize: 14, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  successBtnSec:      { width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' },
  successBtnSecTxt:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },
});
