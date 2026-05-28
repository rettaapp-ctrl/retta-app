import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { PRIVACIDAD_SECCIONES } from '@/lib/legalContent';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}


export default function PrivacidadScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Aviso de Privacidad</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M12 22C12 22 3 18 3 11V5L12 2L21 5V11C21 18 12 22 12 22Z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M9 12L11 14L15 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
          <View>
            <Text style={styles.headerTitle}>RETTA</Text>
            <Text style={styles.headerSub}>Última actualización: 19 de mayo de 2026</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y los Lineamientos del Aviso de Privacidad, RETTA pone a tu disposición el presente Aviso de Privacidad Integral.
        </Text>

        {PRIVACIDAD_SECCIONES.map((s, i) => (
          <View key={s.num} style={[styles.seccion, i === PRIVACIDAD_SECCIONES.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.seccionNum}>
              <Text style={styles.seccionNumTxt}>{s.num}</Text>
            </View>
            <View style={styles.seccionContent}>
              <Text style={styles.seccionTitulo}>{s.titulo}</Text>
              <Text style={styles.seccionCuerpo}>{s.cuerpo}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: DT.bg },
  topbar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, marginRight: 12 },
  topbarTitle:    { flex: 1, textAlign: 'center', fontSize: 17, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2, marginRight: 52 },
  scroll:         { padding: 20, paddingTop: 8, paddingBottom: 40 },
  headerCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: DT.surfaceLow, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  headerIcon:     { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(190,194,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle:    { fontSize: 16, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.3 },
  headerSub:      { fontSize: 11, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.mono },
  intro:          { fontSize: 13, color: DT.onSurfaceVar, lineHeight: 20, marginBottom: 18, fontFamily: FONTS.body },
  seccion:        { flexDirection: 'row', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: DT.glassBorder },
  seccionNum:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(190,194,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  seccionNumTxt:  { fontSize: 12, color: DT.primary, fontFamily: FONTS.bodyBold },
  seccionContent: { flex: 1 },
  seccionTitulo:  { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyBold, marginBottom: 6 },
  seccionCuerpo:  { fontSize: 13, color: DT.onSurfaceVar, lineHeight: 20, fontFamily: FONTS.body },
});
