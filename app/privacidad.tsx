import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const SECCIONES = [
  {
    num: '1', titulo: 'Identidad y domicilio del responsable',
    cuerpo: 'RETTA es el responsable del tratamiento de tus datos personales, con domicilio en Zapopan, Jalisco, México. Contacto: rettaapp@gmail.com.',
  },
  {
    num: '2', titulo: 'Datos personales que recabamos',
    cuerpo: 'Identificación y contacto:\n• Nombre completo\n• Correo electrónico\n• Número telefónico (opcional)\n• Fecha de nacimiento\n• Género\n• Ciudad de residencia\n• Fotografía de perfil (opcional)\n\nPerfil deportivo:\n• Posición preferida\n• Nivel autodeclarado\n• Historial de Partidos\n• Calificaciones recibidas y otorgadas\n• Rating de habilidad\n• Rachas de actividad\n• Marcadores reportados\n\nUso y dispositivo:\n• Eventos de navegación\n• Sistema operativo, modelo del dispositivo, versión de la app\n• Token de notificaciones push\n• Dirección IP\n• Identificadores de sesión\n\nTransaccionales:\n• Historial de inscripciones, cancelaciones, montos pagados, descuentos aplicados\n\nNo almacenamos datos de tarjetas — son tratados directamente por el proveedor de pagos.',
  },
  {
    num: '3', titulo: 'Datos sensibles, biométricos, financieros y de geolocalización',
    cuerpo: 'RETTA no recaba datos personales sensibles (origen étnico o racial, estado de salud, datos genéticos, creencias religiosas, opiniones políticas, preferencias sexuales) como parte regular del servicio.\n\nRETTA no recaba datos biométricos (huella, rostro, voz, iris).\n\nRETTA no recaba datos de geolocalización en tiempo real; la información de ciudad se obtiene únicamente de lo que el Usuario declara en su perfil.\n\nÚnicamente en el módulo de Reportes un Usuario puede mencionar voluntariamente lesiones o incidentes médicos, los cuales se tratan con estricta confidencialidad y solo para fines administrativos.\n\nLos datos financieros (tarjeta de crédito o débito) son recabados y procesados directamente por el proveedor externo de pagos bajo estándares PCI-DSS; RETTA no tiene acceso ni almacena dicha información.',
  },
  {
    num: '4', titulo: 'Finalidades del tratamiento',
    cuerpo: 'Primarias (necesarias para el servicio):\n• Crear y administrar tu cuenta\n• Gestionar inscripciones y participación en Partidos\n• Procesar pagos y reembolsos\n• Calcular tu rating y estadísticas deportivas\n• Operar los sistemas de calificación y reportes\n• Enviar notificaciones transaccionales\n• Facilitar comunicación entre Usuarios\n• Cumplir obligaciones legales\n• Atender soporte\n• Garantizar la seguridad de la Plataforma y prevenir fraude\n\nSecundarias (requieren consentimiento adicional):\n• Envío de comunicaciones promocionales\n• Análisis estadísticos avanzados de comportamiento\n• Publicidad personalizada\n\nPuedes oponerte a las finalidades secundarias en cualquier momento sin que esto afecte la prestación del servicio principal, escribiendo a rettaapp@gmail.com.',
  },
  {
    num: '5', titulo: 'Decisiones automatizadas',
    cuerpo: 'RETTA utiliza procesos automatizados para calcular tu rating de habilidad (con base en los resultados de tus Partidos y la fuerza de tus rivales), tu nivel deportivo, tus rachas y para sugerirte Partidos compatibles con tu perfil (matchmaking).\n\nEstos procesos no producen efectos jurídicos sobre el Usuario ni afectan significativamente sus derechos: son indicadores de carácter recreativo y referencial.\n\nEl Usuario puede solicitar a RETTA información adicional sobre el funcionamiento de estos procesos escribiendo a rettaapp@gmail.com.',
  },
  {
    num: '6', titulo: 'Encargados del tratamiento y transferencias',
    cuerpo: 'RETTA contrata a los siguientes proveedores tecnológicos que tratan datos por nuestra cuenta bajo contratos de confidencialidad:\n\n• Supabase — Base de datos, autenticación, almacenamiento (EE.UU.)\n• Railway — Servidor de aplicación backend (EE.UU.)\n• Cloudflare — Distribución web de portales (Global)\n• Resend — Correos electrónicos transaccionales (EE.UU. / UE)\n• Expo — Notificaciones push (EE.UU.)\n• Sentry — Monitoreo de errores técnicos (EE.UU.)\n• PostHog — Analítica de uso seudonimizada (EE.UU.)\n• Stripe (próximamente) — Procesamiento de pagos (Global)\n• Meta Platforms — Pixel de marketing seudonimizado (Global)\n\nEstas transferencias internacionales se realizan al amparo de los artículos 36 y 37 de la LFPDPPP. RETTA puede compartir datos sin consentimiento del Usuario en los supuestos del artículo 37, incluyendo requerimientos de autoridad competente.\n\nNo vendemos ni rentamos tus datos a terceros con fines comerciales.',
  },
  {
    num: '7', titulo: 'Tiempo de conservación',
    cuerpo: 'Conservaremos tus datos mientras tu cuenta esté activa y por el tiempo adicional necesario para cumplir con obligaciones legales (fiscales, contables, prevención de fraude), normalmente hasta cinco años posteriores a la eliminación de la cuenta.\n\nVencido este plazo, los datos se eliminan o anonimizan irreversiblemente.',
  },
  {
    num: '8', titulo: 'Medidas de seguridad',
    cuerpo: 'RETTA implementa medidas administrativas, técnicas y físicas razonables:\n• Cifrado en tránsito (HTTPS/TLS) y en reposo\n• Políticas de control de acceso a nivel de filas en la base de datos\n• Autenticación con tokens cifrados y rotación periódica\n• Almacenamiento seguro de contraseñas con algoritmos de hash modernos\n• Monitoreo continuo de eventos de seguridad\n• Auditorías periódicas\n\nNinguna medida es infalible; si detectamos una vulneración significativa, te notificaremos en los términos del artículo 20 de la LFPDPPP.',
  },
  {
    num: '9', titulo: 'Derechos ARCO',
    cuerpo: 'Tienes derecho a:\n• Acceder a tus datos y conocer su tratamiento\n• Rectificar los que sean inexactos o incompletos\n• Cancelar los que consideres tratados indebidamente\n• Oponerte al tratamiento para fines específicos\n\nEnvía tu solicitud a rettaapp@gmail.com indicando:\n(i) Nombre completo y datos de contacto\n(ii) Documento que acredite tu identidad (INE u otro oficial vigente)\n(iii) Descripción clara del derecho que ejerces y los datos personales sobre los que recae\n\nResponderemos en máximo veinte días hábiles. Si la solicitud procede, la haremos efectiva dentro de los quince días hábiles siguientes a la comunicación de la respuesta.',
  },
  {
    num: '10', titulo: 'Revocación del consentimiento',
    cuerpo: 'Puedes revocar tu consentimiento en cualquier momento mediante el procedimiento de la sección anterior.\n\nLa revocación no tendrá efectos retroactivos y, en algunos casos, puede implicar la imposibilidad de seguir prestándote el servicio.',
  },
  {
    num: '11', titulo: 'Limitación de uso y divulgación',
    cuerpo: 'Puedes limitar el uso o divulgación de tus datos para fines secundarios (marketing, análisis avanzado, publicidad personalizada) escribiendo a rettaapp@gmail.com.',
  },
  {
    num: '12', titulo: 'Menores de edad',
    cuerpo: 'RETTA está dirigida exclusivamente a personas mayores de 16 años. Si tienes entre 16 y 17 años, declaras contar con autorización de tu padre, madre o tutor para usar la Plataforma y consentir el tratamiento de tus datos.\n\nSi detectas que un menor de 16 años se ha registrado, escríbenos a rettaapp@gmail.com y procederemos a eliminar la cuenta y los datos asociados.',
  },
  {
    num: '13', titulo: 'Cookies y tecnologías similares',
    cuerpo: 'La aplicación móvil utiliza identificadores locales (almacenamiento seguro del dispositivo) para mantener tu sesión iniciada, recordar preferencias y registrar eventos analíticos.\n\nLos portales web pueden utilizar cookies técnicas necesarias para su funcionamiento.\n\nNo utilizamos cookies publicitarias de terceros sin consentimiento explícito.',
  },
  {
    num: '14', titulo: 'Departamento de privacidad',
    cuerpo: 'Para cualquier solicitud, duda o reclamo relacionado con el tratamiento de tus datos personales, incluyendo el ejercicio de derechos ARCO y la revocación del consentimiento, contáctanos en:\n\nCorreo: rettaapp@gmail.com\nAsunto sugerido: "Solicitud de protección de datos personales"\n\nEl Departamento de Privacidad de RETTA atenderá tu solicitud dentro de los plazos legales aplicables.',
  },
  {
    num: '15', titulo: 'Aviso de privacidad simplificado',
    cuerpo: 'Al momento de recolectar datos personales (por ejemplo, en las pantallas de registro), RETTA muestra un aviso simplificado que informa al Usuario sobre la existencia y características principales del tratamiento, así como el medio para consultar el presente Aviso de Privacidad Integral.\n\nEste Aviso Integral se encuentra siempre disponible dentro de la aplicación en Configuración → Aviso de privacidad y en el sitio web oficial de RETTA.',
  },
  {
    num: '16', titulo: 'Cambios al aviso de privacidad',
    cuerpo: 'Este Aviso podrá ser actualizado. Cualquier modificación sustancial será notificada mediante aviso visible dentro de la Plataforma, correo electrónico al Usuario y/o actualización de la fecha al inicio del documento.',
  },
  {
    num: '17', titulo: 'Autoridad de protección de datos',
    cuerpo: 'Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes acudir al Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI):\n\nSitio web: https://www.inai.org.mx\nTeléfono: 800 835 4324',
  },
  {
    num: '18', titulo: 'Aceptación',
    cuerpo: 'Al usar la Plataforma RETTA, manifiestas haber leído, entendido y aceptado el presente Aviso de Privacidad y consientes el tratamiento de tus datos personales en los términos aquí descritos, incluyendo las transferencias internacionales descritas en la sección 6.',
  },
];

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

        {SECCIONES.map((s, i) => (
          <View key={s.num} style={[styles.seccion, i === SECCIONES.length - 1 && { borderBottomWidth: 0 }]}>
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
