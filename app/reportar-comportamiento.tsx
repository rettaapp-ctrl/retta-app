// ═══════════════════════════════════════════════════════════
// RETTA — app/reportar-comportamiento.tsx
// Pantalla para reportar comportamientos inadecuados fuera del
// flujo normal de "reportar jugador" (que está en calificar y en
// detalle de partido). Esta es para casos generales:
// usuarios que no te tocaron en un partido, problemas con un
// complejo, conducta sospechosa en mensajes, etc.
// Se canaliza por email para que el equipo de Retta pueda
// responder y dar seguimiento manual.
// ═══════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

const REPORTES_EMAIL = 'rettaapp@gmail.com';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function ReportarComportamientoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [enviando, setEnviando] = useState(false);

  // Plantilla pre-generada. El usuario solo llena el "Descripción"
  // dentro de su app de correo antes de enviar.
  function construirPlantilla() {
    const fecha = new Date().toLocaleString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const subject = 'Reporte de comportamiento inadecuado';
    const body =
`Hola equipo de Retta,

Quiero reportar un comportamiento inadecuado.

— DESCRIPCIÓN DEL INCIDENTE —
(Describe aquí qué pasó, cuándo, dónde y con quién. Mientras más detalles, mejor podremos ayudarte.)


— TIPO DE REPORTE —
(Elige uno: conducta antideportiva · agresión física o verbal · acoso · discriminación · suplantación · spam o mensajes inapropiados · otro)


— PERSONA(S) O COMPLEJO INVOLUCRADO —
(Nombre, usuario o complejo si lo recuerdas.)


— EVIDENCIA (opcional) —
(Puedes adjuntar capturas de pantalla a este correo si las tienes.)


— DATOS DE QUIEN REPORTA (automáticos) —
Nombre: ${user?.nombre || ''} ${user?.apellido || ''}
Email: ${user?.email || ''}
ID de usuario: ${user?.id || ''}
Fecha del reporte: ${fecha}

Gracias por tomarse el tiempo de revisar este caso.`;
    return { subject, body };
  }

  async function enviarReporte() {
    setEnviando(true);
    try {
      const { subject, body } = construirPlantilla();
      const url = `mailto:${REPORTES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          'No se pudo abrir el correo',
          `Escríbenos directamente a ${REPORTES_EMAIL} con los detalles del incidente.`,
        );
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', `No pudimos abrir tu app de correo. Escríbenos a ${REPORTES_EMAIL}.`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Reportar comportamiento</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <Path d="M12 9v4M12 17h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
            </Svg>
          </View>
          <Text style={styles.heroTitle}>Reportar comportamiento inadecuado</Text>
          <Text style={styles.heroSub}>Tu reporte es confidencial. Lo revisaremos y tomaremos las acciones necesarias.</Text>
        </View>

        {/* Qué se puede reportar */}
        <Text style={styles.sectionLabel}>Qué puedes reportar</Text>
        <View style={styles.listCard}>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Conducta antideportiva durante un partido</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Agresión física o verbal, acoso o discriminación</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Suplantación de identidad o cuentas falsas</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Mensajes inapropiados o spam entre usuarios</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>Problemas con un complejo o sus instalaciones</Text>
          </View>
        </View>

        {/* Cómo funciona */}
        <Text style={styles.sectionLabel}>Cómo funciona</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumTxt}>1</Text></View>
            <Text style={styles.infoText}>Tocas el botón y se abre tu app de correo con un mensaje pre-llenado.</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumTxt}>2</Text></View>
            <Text style={styles.infoText}>Completas los detalles del incidente (qué pasó, cuándo, con quién).</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumTxt}>3</Text></View>
            <Text style={styles.infoText}>Lo envías. El equipo de Retta te responderá en máximo 48 horas hábiles.</Text>
          </View>
        </View>

        {/* Botón principal */}
        <TouchableOpacity onPress={enviarReporte} disabled={enviando} activeOpacity={0.85}>
          <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, enviando && { opacity: 0.6 }]}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={styles.btnTxt}>ABRIR CORREO Y REPORTAR</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Aclaración */}
        <View style={styles.disclaimer}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" stroke={DT.outline} strokeWidth="1.8"/>
            <Path d="M12 8V12" stroke={DT.outline} strokeWidth="2" strokeLinecap="round"/>
            <Circle cx="12" cy="16" r="1" fill={DT.outline}/>
          </Svg>
          <Text style={styles.disclaimerTxt}>
            Si el comportamiento ocurrió en un partido específico, también puedes reportar al jugador directamente desde la pantalla de calificaciones después del partido. Esta opción es para casos generales o fuera de un partido.
          </Text>
        </View>

      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: DT.bg },
  topbar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  backBtn:       { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  topbarTitle:   { flex: 1, textAlign: 'center', fontSize: 17, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  scroll:        { padding: 20, paddingTop: 0, paddingBottom: 40 },
  hero:          { backgroundColor: 'rgba(255,180,171,0.12)', borderWidth: 1, borderColor: 'rgba(255,180,171,0.3)', borderRadius: RADIUS.xl, padding: 22, alignItems: 'center', marginBottom: 24 },
  heroIcon:      { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,180,171,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle:     { fontSize: 18, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.2, textAlign: 'center', marginBottom: 6 },
  heroSub:       { fontSize: 12.5, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 18, fontFamily: FONTS.body },
  sectionLabel:  { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.8, marginBottom: 10, marginLeft: 2, fontFamily: FONTS.mono },
  listCard:      { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 14, marginBottom: 18 },
  listItem:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  bullet:        { width: 5, height: 5, borderRadius: 3, backgroundColor: DT.error, marginTop: 7 },
  listText:      { flex: 1, fontSize: 13, color: DT.onBg, lineHeight: 19, fontFamily: FONTS.body },
  infoCard:      { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 16, marginBottom: 20 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  stepNum:       { width: 26, height: 26, borderRadius: 13, backgroundColor: DT.primaryContainer, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumTxt:    { fontSize: 12, color: '#fff', fontFamily: FONTS.bodyBold },
  infoText:      { flex: 1, fontSize: 13, color: DT.onSurfaceVar, lineHeight: 19, paddingTop: 3, fontFamily: FONTS.body },
  btn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: RADIUS.full, marginBottom: 16 },
  btnTxt:        { fontSize: 13, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  disclaimer:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: 12 },
  disclaimerTxt: { flex: 1, fontSize: 12, color: DT.onSurfaceVar, lineHeight: 17, fontFamily: FONTS.body },
});
