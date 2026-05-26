import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const SOPORTE_EMAIL = 'rettaapp@gmail.com';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const FAQS = [
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="4" width="18" height="17" rx="3" stroke={DT.primary} strokeWidth="1.8"/>
        <Path d="M8 2V6M16 2V6M3 9H21" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
      </Svg>
    ),
    q: '¿Cuál es la política de cancelación?',
    a: 'La política depende de qué tan cercana sea la cancelación:\n\n✅ Más de 12 horas antes — Cancelación sin costo, reembolso completo.\n\n⚠️ Entre 3 y 12 horas antes — Se retiene el 40%, se reembolsa el 60%.\n\n❌ Menos de 3 horas antes — Sin reembolso, cargo definitivo.\n\nLa hora se valida desde nuestros servidores, no desde la hora de tu celular.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke={DT.primary} strokeWidth="1.8"/>
        <Path d="M12 8v4l3 3" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
      </Svg>
    ),
    q: '¿Qué pasa si reservo y no voy?',
    a: 'Si no asistes sin cancelar previamente, perderás el monto pagado y podrías recibir una penalización en tu perfil. Los no-shows afectan a todos los jugadores que estaban contando contigo. Por favor cancela con tiempo si no puedes asistir.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="5" width="20" height="14" rx="3" stroke={DT.primary} strokeWidth="1.8"/>
        <Path d="M2 10H22" stroke={DT.primary} strokeWidth="1.8"/>
        <Path d="M6 15H10" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
      </Svg>
    ),
    q: '¿Qué métodos de pago se aceptan?',
    a: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, AMEX), Apple Pay y Google Pay. El cobro se procesa al confirmar tu lugar en el partido y, si se cancela bajo política, el reembolso vuelve a tu mismo método de pago.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={DT.primary} strokeWidth="1.8"/>
        <Path d="M12 3C12 3 9 7 9 12C9 17 12 21 12 21M12 3C12 3 15 7 15 12C15 17 12 21 12 21M3 12H21" stroke={DT.primary} strokeWidth="1.5" opacity="0.7"/>
      </Svg>
    ),
    q: '¿Cuántos jugadores se necesitan?',
    a: 'Cada formato tiene su cupo completo, pero el partido se puede jugar con menos:\n\n⚽ Fútbol 5 → 10 lugares (mínimo 8 para jugar)\n⚽ Fútbol 7 → 14 lugares (mínimo 12 para jugar)\n⚽ Fútbol 11 → 22 lugares (mínimo 18 para jugar)\n\nSi no se alcanza el mínimo a tiempo, el partido se cancela y se reembolsa el pago automáticamente.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L14.39 8.26L21 9.27L16 14.14L17.18 21L12 17.77L6.82 21L8 14.14L3 9.27L9.61 8.26L12 2Z" stroke={DT.primary} strokeWidth="1.8" strokeLinejoin="round"/>
      </Svg>
    ),
    q: '¿Cómo funciona mi nivel y rating?',
    a: 'Tu nivel se calcula con un sistema tipo ELO que sube o baja según los resultados de tus partidos:\n\n• Cuando tu equipo gana, tu rating sube. Cuando pierde, baja.\n• Ganarle a un equipo más fuerte da más puntos que ganarle a uno más débil.\n• Tu rating individual se promedia con el de tu equipo para calcular si fue un upset o un resultado esperado.\n\nMientras más juegas, más exacto se vuelve tu nivel y mejor te empareja Retta con partidos de tu nivel.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={DT.primary} strokeWidth="1.8" strokeLinejoin="round"/>
      </Svg>
    ),
    q: '¿Qué son las rachas?',
    a: 'Tu racha es la cantidad de días seguidos que has jugado en Retta. Cada vez que asistes a un partido, se renueva. Si dejas pasar muchos días sin jugar, se reinicia.\n\nLas rachas son una forma divertida de mantenerte activo y se muestran en tu perfil para que otros jugadores las vean.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={DT.primary} strokeWidth="1.8"/>
        <Path d="M8 12L11 15L16 9" stroke={DT.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    q: '¿Cómo se reportan los marcadores?',
    a: 'Cuando termina el partido, recibes un link seguro por notificación para reportar el marcador final. El primer jugador en reportarlo lo deja registrado y los demás pueden confirmar o disputar el resultado.\n\nUna vez confirmado, los ratings de todos los jugadores se actualizan automáticamente.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" stroke={DT.primary} strokeWidth="1.8"/>
        <Path d="M20 21v-2a4 4 0 0 0-3-3.87" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
        <Path d="M4 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
      </Svg>
    ),
    q: '¿Cómo califico a otros jugadores?',
    a: 'Después de cada partido, puedes calificar a los compañeros y rivales con quienes jugaste (de 1 a 5 estrellas). Estas calificaciones son anónimas y ayudan a construir la reputación deportiva de cada jugador en Retta.\n\nLos invitados (jugadores que no son usuarios de la app) no aparecen en la calificación.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="M12 9v4M12 17h.01" stroke={DT.primary} strokeWidth="2" strokeLinecap="round"/>
        <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={DT.primary} strokeWidth="1.8" strokeLinejoin="round"/>
      </Svg>
    ),
    q: '¿Cómo reporto a un jugador o un incidente?',
    a: 'Tienes dos formas de reportar:\n\n1. En la pantalla de calificación al finalizar el partido, toca "Reportar" junto al nombre del jugador.\n2. Directamente en el detalle del partido, toca "Reportar incidente".\n\nPuedes reportar conducta antideportiva, agresión, no-asistencia, lesión u otro. Tu reporte es privado y será revisado por el equipo de Retta.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Circle cx="9" cy="8" r="3" stroke={DT.primary} strokeWidth="1.8"/>
        <Circle cx="16" cy="8" r="3" stroke={DT.primary} strokeWidth="1.8" opacity="0.5"/>
        <Path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
        <Path d="M16 14c1.8.5 3 2 3 3.5" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
      </Svg>
    ),
    q: '¿Cómo invito amigos a un partido?',
    a: 'Tienes 3 formas de sumar gente a tu partido:\n\n1. Invitar amigos de la app — Desde el detalle del partido, toca "Invitar amigos" y elige a quién mandarle la notificación. Ellos deciden si se inscriben.\n\n2. Agregar invitado — Si tu amigo no tiene la app, puedes pagar su lugar como "invitado" y dejarlo registrado con su nombre. Tú asumes el costo.\n\n3. Compartir link — Toca "Compartir" para mandar el partido por WhatsApp y que cualquiera se pueda inscribir.',
  },
  {
    icon: (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="2" stroke={DT.primary} strokeWidth="1.8"/>
        <Path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93a10 10 0 0 0 14.14 14.14" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
      </Svg>
    ),
    q: '¿Qué puedo configurar en mi perfil?',
    a: 'Desde Configuración puedes editar tu nombre, foto, posición (portero, defensa, medio, delantero) y tu nivel inicial. También puedes:\n\n• Hacer tu perfil público o privado\n• Cambiar tu correo o teléfono\n• Administrar preferencias de notificaciones\n• Ver tu historial de partidos\n\nTu perfil deportivo ayuda a que Retta te empareje con partidos de tu nivel.',
  },
];

function FaqItem({ icon, q, a }: { icon: React.ReactNode; q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setOpen(!open)} activeOpacity={0.8}>
      <View style={styles.faqHeader}>
        <View style={styles.faqIconWrap}>{icon}</View>
        <Text style={styles.faqQ}>{q}</Text>
        <Text style={[styles.faqArrow, open && { transform: [{ rotate: '90deg' }] }]}>›</Text>
      </View>
      {open && <Text style={styles.faqBody}>{a}</Text>}
    </TouchableOpacity>
  );
}

export default function AyudaScreen() {
  const router  = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  async function copiarCorreo() {
    await Clipboard.setStringAsync(SOPORTE_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function enviarEmail() {
    const subject = encodeURIComponent('Soporte Retta');
    const body = encodeURIComponent(
      `\n\n---\nUsuario: ${user?.nombre || ''} ${user?.apellido || ''}\nID: ${user?.id || ''}\nEmail: ${user?.email || ''}`
    );
    const url = `mailto:${SOPORTE_EMAIL}?subject=${subject}&body=${body}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          'No se pudo abrir el correo',
          `Escríbenos directamente a ${SOPORTE_EMAIL}.`
        );
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', `No se pudo abrir la app de correo. Escríbenos a ${SOPORTE_EMAIL}.`);
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
        <Text style={styles.topbarTitle}>Ayuda</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.8"/>
              <Path d="M9.5 9C9.5 7.6 10.6 6.5 12 6.5C13.4 6.5 14.5 7.6 14.5 9C14.5 10.1 13.8 11 12.8 11.4C12.3 11.6 12 12.1 12 12.6V13.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
              <Circle cx="12" cy="16.5" r="1" fill="#fff"/>
            </Svg>
          </View>
          <Text style={styles.heroTitle}>¿En qué te podemos ayudar?</Text>
          <Text style={styles.heroSub}>Estamos aquí para resolver tus dudas</Text>
        </View>

        {/* Retta IA — destacado arriba de todo */}
        <TouchableOpacity
          style={styles.iaCard}
          onPress={() => router.push('/chat-ia')}
          activeOpacity={0.85}
        >
          <View style={styles.iaIcon}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2L14.39 8.26L21 9.27L16 14.14L17.18 21L12 17.77L6.82 21L8 14.14L3 9.27L9.61 8.26L12 2Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
            </Svg>
          </View>
          <View style={styles.iaBody}>
            <View style={styles.iaTitleRow}>
              <Text style={styles.iaTitle}>Pregúntale a Retta IA</Text>
              <View style={styles.iaBadge}><Text style={styles.iaBadgeTxt}>NUEVO</Text></View>
            </View>
            <Text style={styles.iaSub}>Resuelve dudas al instante sobre cómo funciona la app</Text>
          </View>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <Path d="M9 18L15 12L9 6" stroke={DT.outline} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </TouchableOpacity>

        {/* Contacto Directo */}
        <Text style={styles.sectionLabel}>Contacto Directo</Text>

        {/* Correo */}
        <View style={styles.emailCard}>
          <View style={styles.emailIcon}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
              <Path d="M22 6L12 13L2 6" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
            </Svg>
          </View>
          <View style={styles.emailBody}>
            <Text style={styles.emailTitle}>Correo Electrónico</Text>
            <Text style={styles.emailAddr}>{SOPORTE_EMAIL}</Text>
            <Text style={styles.emailSub}>Sugerencias · Reportes de incidencia</Text>
          </View>
        </View>

        {/* Botón principal: enviar email */}
        <TouchableOpacity style={styles.sendBtn} onPress={enviarEmail} activeOpacity={0.85}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <Path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={styles.sendBtnTxt}>ENVIAR CORREO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyInline} onPress={copiarCorreo}>
          <Text style={styles.copyInlineTxt}>{copied ? '✓ Copiado al portapapeles' : 'O copiar dirección'}</Text>
        </TouchableOpacity>

        {/* Aviso */}
        <View style={styles.reportHint}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" stroke={DT.outline} strokeWidth="1.8"/>
            <Path d="M12 8V12" stroke={DT.outline} strokeWidth="2" strokeLinecap="round"/>
            <Circle cx="12" cy="16" r="1" fill={DT.outline}/>
          </Svg>
          <Text style={styles.reportHintTxt}>Escríbenos al correo indicando tu usuario y una descripción detallada del incidente.</Text>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Preguntas Frecuentes</Text>
        <View style={styles.faqList}>
          {FAQS.map((f, i) => (
            <React.Fragment key={i}>
              <FaqItem icon={f.icon} q={f.q} a={f.a}/>
              {i < FAQS.length - 1 && <View style={styles.faqDivider}/>}
            </React.Fragment>
          ))}
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
  topbarTitle:   { flex: 1, textAlign: 'center', fontSize: 18, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  scroll:        { padding: 20, paddingTop: 0, paddingBottom: 40 },
  hero:          { backgroundColor: DT.surfaceLow, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.xl, padding: 24, alignItems: 'center', marginBottom: 24 },
  heroIcon:      { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(190,194,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle:     { fontSize: 19, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.2, textAlign: 'center' },
  heroSub:       { fontSize: 12.5, color: DT.onSurfaceVar, marginTop: 6, textAlign: 'center', fontFamily: FONTS.body },
  sectionLabel:  { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.8, marginBottom: 10, fontFamily: FONTS.mono },
  emailCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 16, gap: 14, marginBottom: 10 },
  emailIcon:     { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: 'rgba(190,194,255,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emailBody:     { flex: 1 },
  emailTitle:    { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyBold },
  emailAddr:     { fontSize: 13, color: DT.primary, marginTop: 2, fontFamily: FONTS.bodyMed },
  emailSub:      { fontSize: 11, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },
  copyBtn:       { backgroundColor: DT.surfaceHigh, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 8 },
  copyBtnTxt:    { fontSize: 12, color: DT.onBg, fontFamily: FONTS.bodyBold },
  sendBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, backgroundColor: DT.primaryContainer, borderRadius: RADIUS.full, marginBottom: 8 },
  sendBtnTxt:    { fontSize: 13, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  copyInline:    { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  copyInlineTxt: { fontSize: 12, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  reportHint:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: 12, marginBottom: 8 },
  reportHintTxt: { flex: 1, fontSize: 12, color: DT.onSurfaceVar, lineHeight: 17, fontFamily: FONTS.body },
  faqList:       { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden' },
  faqItem:       { padding: 16 },
  faqHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqIconWrap:   { width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: 'rgba(190,194,255,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  faqQ:          { flex: 1, fontSize: 14, color: DT.onBg, lineHeight: 19, fontFamily: FONTS.bodyMed },
  faqArrow:      { fontSize: 22, color: DT.outline },
  faqBody:       { fontSize: 13, color: DT.onSurfaceVar, lineHeight: 20, marginTop: 12, paddingLeft: 44, fontFamily: FONTS.body },
  faqDivider:    { height: 1, backgroundColor: DT.glassBorder, marginHorizontal: 16 },
  iaCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: DT.glassBg, borderWidth: 1.5, borderColor: DT.primary, borderRadius: RADIUS.lg, padding: 16, marginBottom: 20, shadowColor: DT.primaryContainer, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 3 },
  iaIcon:        { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: DT.primaryContainer, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iaBody:        { flex: 1 },
  iaTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  iaTitle:       { fontSize: 14.5, color: DT.onBg, fontFamily: FONTS.bodyBold, letterSpacing: 0.2 },
  iaBadge:       { backgroundColor: DT.primaryContainer, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  iaBadgeTxt:    { fontSize: 9, color: '#fff', letterSpacing: 0.8, fontFamily: FONTS.bodyBold },
  iaSub:         { fontSize: 11.5, color: DT.onSurfaceVar, lineHeight: 16, fontFamily: FONTS.body },
});
