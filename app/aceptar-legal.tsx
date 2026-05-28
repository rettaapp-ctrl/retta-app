// ═══════════════════════════════════════════════════════════════
// RETTA — app/aceptar-legal.tsx
// Pantalla BLOQUEANTE. La fuerza el routing en _layout.tsx cuando
// el usuario tiene legal_aceptado_version distinto a LEGAL_VERSION.
//
// Muestra Términos + Aviso de Privacidad en un mismo scroll.
// El botón "Acepto y continúo" se habilita siempre (no requiere
// scrollear al final — los textos viven completos en la app y son
// públicos en /terminos y /privacidad). Al aceptar se llama al
// backend y se persiste con timestamp probatorio.
//
// "Cerrar sesión" como salida segura — el usuario que no quiera
// aceptar no queda atrapado; cierra sesión y listo.
// ═══════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { LEGAL_VERSION } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { TERMINOS_SECCIONES, PRIVACIDAD_SECCIONES, LegalSeccion } from '@/lib/legalContent';

function ShieldIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5v6c0 5.5 3.8 10.6 8 12 4.2-1.4 8-6.5 8-12V5l-8-3z"
        stroke={DT.primary} strokeWidth="1.6" strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function Seccion({ s, isLast }: { s: LegalSeccion; isLast: boolean }) {
  return (
    <View style={[styles.seccion, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.seccionNum}>
        <Text style={styles.seccionNumTxt}>{s.num}</Text>
      </View>
      <View style={styles.seccionContent}>
        <Text style={styles.seccionTitulo}>{s.titulo}</Text>
        <Text style={styles.seccionCuerpo}>{s.cuerpo}</Text>
      </View>
    </View>
  );
}

export default function AceptarLegalScreen() {
  const { aceptarLegal, logout } = useAuth();
  const [sending, setSending] = useState(false);

  async function onAceptar() {
    if (sending) return;
    setSending(true);
    try {
      await aceptarLegal();
      // No navegamos manualmente — el routing en _layout.tsx ve el cambio
      // de user.legal_aceptado_version y manda a /(tabs)/partidos solo.
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar tu aceptación. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  }

  function onCerrarSesion() {
    Alert.alert(
      'Cerrar sesión',
      'Si no aceptas los Términos y el Aviso de Privacidad, cerraremos tu sesión. Puedes volver a iniciar sesión cuando estés listo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => { logout(); },
        },
      ]
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <ShieldIcon />
          </View>
          <Text style={styles.heroTitle}>
            Acepta para usar <Text style={{ color: DT.primary }}>Retta</Text>
          </Text>
          <Text style={styles.heroSub}>
            Actualizamos nuestros Términos y Aviso de Privacidad.{'\n'}
            Para seguir usando la app, léelos y acéptalos.
          </Text>
          <Text style={styles.heroVersion}>VERSIÓN {LEGAL_VERSION}</Text>
        </View>

        {/* Scroll de los dos documentos */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* TÉRMINOS */}
          <View style={styles.bloque}>
            <View style={styles.bloqueHeader}>
              <Text style={styles.bloqueKicker}>DOCUMENTO 1 DE 2</Text>
              <Text style={styles.bloqueTitulo}>Términos y Condiciones</Text>
            </View>
            <View style={styles.card}>
              {TERMINOS_SECCIONES.map((s, i) => (
                <Seccion key={s.num} s={s} isLast={i === TERMINOS_SECCIONES.length - 1} />
              ))}
            </View>
          </View>

          {/* PRIVACIDAD */}
          <View style={[styles.bloque, { marginTop: 20 }]}>
            <View style={styles.bloqueHeader}>
              <Text style={styles.bloqueKicker}>DOCUMENTO 2 DE 2</Text>
              <Text style={styles.bloqueTitulo}>Aviso de Privacidad</Text>
            </View>
            <View style={styles.card}>
              {PRIVACIDAD_SECCIONES.map((s, i) => (
                <Seccion key={s.num} s={s} isLast={i === PRIVACIDAD_SECCIONES.length - 1} />
              ))}
            </View>
          </View>

          <Text style={styles.cierre}>
            Al tocar "Acepto y continúo" confirmas que has leído y aceptas ambos documentos en su versión {LEGAL_VERSION}.{'\n'}
            Si tienes dudas escríbenos a rettaapp@gmail.com.
          </Text>
        </ScrollView>

        {/* Barra de acción inferior */}
        <View style={styles.footerBar}>
          <TouchableOpacity onPress={onAceptar} disabled={sending} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnAceptar}>
              {sending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnAceptarTxt}>ACEPTO Y CONTINÚO</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCerrarSesion} disabled={sending} style={styles.btnSec}>
            <Text style={styles.btnSecTxt}>No acepto — cerrar sesión</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: DT.bg },

  hero:          { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 18, alignItems: 'center' },
  heroIcon:      { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(190,194,255,0.12)', borderWidth: 1, borderColor: 'rgba(190,194,255,0.32)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle:     { fontSize: 22, color: DT.onBg, textAlign: 'center', fontFamily: FONTS.display, letterSpacing: 0.1, marginBottom: 8 },
  heroSub:       { fontSize: 13, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 19, fontFamily: FONTS.body },
  heroVersion:   { fontSize: 10, color: DT.outline, marginTop: 12, letterSpacing: 2, fontFamily: FONTS.mono },

  scroll:        { paddingHorizontal: 20, paddingBottom: 24 },

  bloque:        {},
  bloqueHeader:  { marginBottom: 10 },
  bloqueKicker:  { fontSize: 10, color: DT.primary, letterSpacing: 1.8, fontFamily: FONTS.mono, marginBottom: 4 },
  bloqueTitulo:  { fontSize: 17, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },

  card:          { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 4, overflow: 'hidden' },
  seccion:       { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: DT.glassBorder },
  seccionNum:    { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(190,194,255,0.14)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  seccionNumTxt: { fontSize: 11, color: DT.primary, fontFamily: FONTS.bodyBold },
  seccionContent:{ flex: 1 },
  seccionTitulo: { fontSize: 13, color: DT.onBg, fontFamily: FONTS.bodyBold, marginBottom: 5 },
  seccionCuerpo: { fontSize: 12, color: DT.onSurfaceVar, lineHeight: 18, fontFamily: FONTS.body },

  cierre:        { fontSize: 11, color: DT.outline, textAlign: 'center', lineHeight: 16, marginTop: 22, marginBottom: 8, fontFamily: FONTS.body },

  footerBar:     { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, borderTopWidth: 1, borderTopColor: DT.glassBorder, backgroundColor: 'rgba(13,16,28,0.72)' },
  btnAceptar:    { height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  btnAceptarTxt: { fontSize: 13, color: '#fff', letterSpacing: 1.4, fontFamily: FONTS.bodyBold },
  btnSec:        { height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnSecTxt:     { fontSize: 12, color: DT.onSurfaceVar, fontFamily: FONTS.bodyMed },
});
