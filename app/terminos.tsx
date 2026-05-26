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
    num: '1', titulo: 'Identidad del prestador',
    cuerpo: 'RETTA (en adelante, "RETTA", "nosotros" o "la Plataforma") es operada por RETTA, con domicilio en Zapopan, Jalisco, México. Contacto: rettaapp@gmail.com.',
  },
  {
    num: '2', titulo: 'Definiciones',
    cuerpo: '• Plataforma: aplicación móvil y portales web denominados Retta.\n• Usuario: persona física mayor de 16 años que crea una cuenta en la Plataforma.\n• Complejo: establecimiento deportivo afiliado que pone canchas a disposición.\n• Partido: evento deportivo con fecha, hora, cancha y cupo definidos.\n• Inscripción: compromiso de un Usuario de participar en un Partido mediante el pago correspondiente.\n• Invitado: persona que asiste a un Partido bajo la responsabilidad de un Usuario anfitrión.\n• Anfitrión: Usuario que paga la inscripción de un Invitado y asume su responsabilidad.',
  },
  {
    num: '3', titulo: 'Aceptación, capacidad legal y elegibilidad',
    cuerpo: 'Al registrarte declaras que (i) eres mayor de 16 años; (ii) tienes capacidad legal para celebrar este contrato; (iii) si tienes entre 16 y 17 años, cuentas con autorización de tu padre, madre o tutor; y (iv) la información que proporciones es verdadera y actualizada.\n\nRETTA puede solicitar verificación de identidad o edad en cualquier momento. La falsedad en los datos es causa inmediata de suspensión.',
  },
  {
    num: '4', titulo: 'Cuenta de usuario',
    cuerpo: 'Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad que ocurra bajo tu cuenta. Una persona física solo puede tener una cuenta activa. Las cuentas son personales e intransferibles.\n\nNotifícanos de inmediato si sospechas que tu cuenta fue comprometida escribiendo a rettaapp@gmail.com.',
  },
  {
    num: '5', titulo: 'Uso del servicio y disponibilidad',
    cuerpo: 'RETTA es un intermediario tecnológico que permite a Usuarios reservar y organizar partidos de fútbol en Complejos afiliados. RETTA no es propietaria de los Complejos ni operadora directa de los Partidos.\n\nRETTA realiza esfuerzos razonables para mantener la Plataforma disponible las 24 horas, pero no garantiza un nivel de servicio ininterrumpido y podrá realizar mantenimientos programados o de emergencia.\n\nEl Usuario se compromete a usar la Plataforma conforme a la ley, no suplantar a otras personas, no crear cuentas falsas, no utilizarla para fines comerciales no autorizados y respetar a otros Usuarios, Complejos, árbitros y personal.',
  },
  {
    num: '6', titulo: 'Reservas y partidos',
    cuerpo: 'Al inscribirte a un Partido te comprometes a asistir en la fecha y hora indicadas. Tu lugar es individual e intransferible. Un Partido se confirma cuando se alcanza el mínimo de jugadores; si no, RETTA cancela y reembolsa el monto íntegro a los inscritos.\n\nLa información del Partido puede modificarse por causas operativas del Complejo, en cuyo caso se notificará a los Usuarios inscritos.',
  },
  {
    num: '7', titulo: 'Sistema de invitados',
    cuerpo: 'Un Usuario puede agregar Invitados pagando su lugar. El Anfitrión asume la responsabilidad por la asistencia y conducta del Invitado, garantiza que sea mayor de 16 años y acepta que quede sujeto al Código de Conducta.\n\nEl Anfitrión no podrá reclamar reembolso por inasistencia del Invitado fuera de las políticas de cancelación.',
  },
  {
    num: '8', titulo: 'Pagos, precios y reembolsos',
    cuerpo: 'RETTA podrá ofrecer descuentos a su discreción; los descuentos aplican exclusivamente a inscripciones realizadas después de su activación y no son retroactivos.\n\nTodos los precios mostrados en la Plataforma están expresados en pesos mexicanos (MXN) e incluyen los impuestos correspondientes, incluido el IVA cuando aplique.\n\nLos pagos se procesan a través de proveedores externos autorizados conforme a estándares PCI-DSS — RETTA no almacena datos de tarjetas. El cargo se efectúa al confirmar la inscripción.\n\nLos reembolsos se acreditan al mismo método de pago en un plazo de 5 a 10 días hábiles, sujeto a los tiempos del procesador y del banco emisor.',
  },
  {
    num: '9', titulo: 'Facturación (CFDI)',
    cuerpo: 'El Usuario puede solicitar la emisión de un Comprobante Fiscal Digital por Internet (CFDI) por las inscripciones pagadas dentro de los plazos que marque la legislación fiscal vigente.\n\nPara ello deberá enviar sus datos fiscales (RFC, razón social, uso del CFDI, régimen y código postal) al correo rettaapp@gmail.com indicando el o los pagos a facturar.',
  },
  {
    num: '10', titulo: 'Política de cancelación',
    cuerpo: 'Las cancelaciones se calculan con base en la hora del servidor de RETTA (zona horaria América/Ciudad de México), no con la del dispositivo del Usuario.\n\n✅ Más de 12 horas antes — Reembolso del 100%.\n⚠️ Entre 3 y 12 horas antes — Reembolso del 60% (RETTA retiene 40% por costos operativos y afectación al Complejo).\n❌ Menos de 3 horas antes o no asistencia — Sin reembolso.\n\nSi RETTA o el Complejo cancelan el Partido por falta de cupo, fuerza mayor o causas operativas, el reembolso es del 100% para todos los inscritos.',
  },
  {
    num: '11', titulo: 'Improcedencia del derecho de retracto',
    cuerpo: 'La inscripción a un Partido constituye la contratación de un servicio para fecha y hora específicas.\n\nDe conformidad con el artículo 56 de la Ley Federal de Protección al Consumidor, el derecho de retracto de cinco días hábiles no es aplicable a este tipo de servicios.\n\nLa política de reembolso aplicable es exclusivamente la descrita en la sección anterior.',
  },
  {
    num: '12', titulo: 'Código de conducta deportiva',
    cuerpo: 'El Usuario se compromete a:\n• Respetar a compañeros, rivales, árbitros y personal del Complejo;\n• Abstenerse de violencia física o verbal, acoso o discriminación por cualquier motivo;\n• Cumplir con el reglamento interno del Complejo (calzado, vestimenta, hidratación, etc.);\n• Reportar de buena fe cualquier incidente.\n\nEl incumplimiento puede derivar en sanciones que van desde advertencia hasta suspensión definitiva de la cuenta y, en su caso, denuncia ante las autoridades competentes.',
  },
  {
    num: '13', titulo: 'Calificaciones, reportes y mensajería',
    cuerpo: 'RETTA opera un sistema de calificaciones anónimas entre Usuarios posterior a cada Partido y un canal de reportes confidenciales para denunciar conductas inapropiadas, lesiones o incidentes. RETTA revisa los reportes y puede tomar acciones proporcionales.\n\nLa Plataforma incluye mensajería entre Usuarios. RETTA no monitorea ni modera en tiempo real el contenido enviado entre Usuarios, pero podrá revisar mensajes específicos cuando se reciba un reporte. El Usuario es responsable del contenido que envía y se compromete a no enviar contenido ilícito, ofensivo, fraudulento o que viole derechos de terceros.\n\nEl uso abusivo de los sistemas de calificación, reportes o mensajería (reportes falsos, ataques coordinados, spam, acoso) es causa de suspensión inmediata.',
  },
  {
    num: '14', titulo: 'Asunción de riesgo y responsabilidad por lesiones',
    cuerpo: '⚠️ El fútbol es un deporte de contacto con riesgos inherentes de lesiones, incluyendo sin limitarse a: torceduras, fracturas, contusiones, daños musculares y, excepcionalmente, lesiones graves.\n\nAl utilizar RETTA, el Usuario reconoce y acepta expresamente asumir dichos riesgos y libera a RETTA, sus accionistas, directivos, empleados y representantes de cualquier responsabilidad derivada de lesiones, daños o perjuicios sufridos durante o con motivo de su participación en un Partido.\n\nEl Usuario es responsable de:\n• Contar con condición física adecuada;\n• Consultar a un médico si tiene condiciones preexistentes;\n• Contar con seguro médico si lo considera necesario;\n• Usar equipo deportivo adecuado;\n• Suspender su participación ante cualquier malestar.\n\nRETTA no provee servicios médicos, primeros auxilios ni seguros; estos, en caso de existir, son responsabilidad del Complejo.',
  },
  {
    num: '15', titulo: 'Limitación de responsabilidad',
    cuerpo: 'En la máxima medida permitida por la ley, RETTA no será responsable por:\n• Daños indirectos, incidentales, especiales o punitivos;\n• Lucro cesante o daño moral;\n• Acciones u omisiones de Complejos, otros Usuarios, Invitados o terceros;\n• Interrupciones del servicio por causas técnicas o fuerza mayor;\n• Cancelaciones por clima, infraestructura, autoridad o circunstancias ajenas;\n• Pérdida de pertenencias en los Complejos.\n\nLa responsabilidad máxima total de RETTA se limita al monto pagado por el Usuario durante los últimos tres meses anteriores al hecho reclamado.\n\nEsta limitación no aplica respecto de los derechos irrenunciables que la legislación del consumidor reconozca al Usuario.',
  },
  {
    num: '16', titulo: 'Indemnización',
    cuerpo: 'El Usuario acepta indemnizar y mantener libre de responsabilidad a RETTA frente a reclamaciones, demandas, daños y gastos (incluyendo honorarios razonables de abogados) que surjan de:\n• Su uso indebido de la Plataforma;\n• La violación de estos Términos;\n• La violación de derechos de terceros;\n• La conducta de sus Invitados.',
  },
  {
    num: '17', titulo: 'Suspensión, terminación y cuentas inactivas',
    cuerpo: 'RETTA puede suspender o cancelar tu cuenta, con o sin notificación previa, por:\n• Incumplimiento de los Términos;\n• Conducta antideportiva grave;\n• Patrón reiterado de no-shows;\n• Uso fraudulento de pagos;\n• Reportes graves verificados;\n• Sospecha razonable de actividad ilegal.\n\nEl Usuario puede solicitar la cancelación de su cuenta escribiendo a rettaapp@gmail.com. La cancelación no implica reembolso de Partidos pasados ni cancela inscripciones ya pagadas y vigentes.\n\nLas cuentas sin actividad por más de veinticuatro (24) meses podrán ser marcadas como inactivas. RETTA notificará al correo registrado y, de no recibir respuesta dentro de los treinta días siguientes, podrá cerrar la cuenta y proceder a la eliminación o anonimización de los datos asociados.',
  },
  {
    num: '18', titulo: 'Comunicaciones',
    cuerpo: 'Al crear tu cuenta autorizas a RETTA a enviarte correos y notificaciones push relacionadas con confirmaciones, cancelaciones, recordatorios, calificaciones pendientes, descuentos, mensajes de seguridad y actualizaciones.\n\nLas comunicaciones promocionales pueden gestionarse escribiendo a rettaapp@gmail.com.\n\nLas comunicaciones transaccionales (relacionadas con un Partido o con la seguridad de tu cuenta) son necesarias para la operación y no pueden desactivarse.',
  },
  {
    num: '19', titulo: 'Propiedad intelectual y marcas',
    cuerpo: 'Todos los derechos sobre la Plataforma, su código, diseño, contenidos editoriales y bases de datos son propiedad exclusiva de RETTA y/o sus licenciantes.\n\nLa denominación, logotipo y signos distintivos de "RETTA" son marcas registradas (o en trámite de registro) ante el Instituto Mexicano de la Propiedad Industrial.\n\nEl Usuario no podrá copiar, modificar, distribuir, vender ni crear obras derivadas sin autorización expresa por escrito.\n\nAl subir contenido (foto de perfil, etc.), el Usuario otorga a RETTA una licencia no exclusiva, mundial y libre de regalías para utilizar dicho contenido dentro de la Plataforma.',
  },
  {
    num: '20', titulo: 'Modificaciones a los términos',
    cuerpo: 'RETTA puede modificar estos Términos publicando la versión actualizada en la Plataforma. Para cambios sustanciales notificará al Usuario con al menos quince días naturales de anticipación a través de correo electrónico y/o notificación dentro de la Plataforma.\n\nEl uso continuado después de una modificación constituye aceptación. El Usuario que no esté de acuerdo con las modificaciones podrá cancelar su cuenta.',
  },
  {
    num: '21', titulo: 'Resolución de controversias',
    cuerpo: 'Antes de iniciar procedimientos legales, las partes intentarán resolver las controversias de buena fe mediante comunicación directa a rettaapp@gmail.com.\n\nSi no se resuelve en treinta días naturales, el Usuario podrá acudir a la Procuraduría Federal del Consumidor (PROFECO) para procedimientos de conciliación y arbitraje, o a los tribunales competentes.',
  },
  {
    num: '22', titulo: 'Disposiciones generales',
    cuerpo: '• Cesión: RETTA puede ceder estos Términos a cualquier afiliada o sucesora, incluyendo por causa de fusión, escisión o adquisición. El Usuario no podrá ceder sus derechos sin consentimiento previo y por escrito.\n• Separabilidad: si una disposición se declara inválida, las restantes seguirán vigentes.\n• Acuerdo completo: estos Términos, junto con el Aviso de Privacidad, constituyen el acuerdo completo entre las partes.\n• No renuncia: el no ejercicio de un derecho por RETTA no constituye renuncia al mismo.\n• Fuerza mayor: RETTA no será responsable por incumplimientos derivados de caso fortuito o fuerza mayor.\n• Idioma: la versión oficial es la redactada en español de México.',
  },
  {
    num: '23', titulo: 'Legislación y jurisdicción',
    cuerpo: 'Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos, incluyendo la Ley Federal de Protección al Consumidor, la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y demás aplicables.\n\nPara la interpretación y cumplimiento, las partes se someten a la jurisdicción de los tribunales competentes de Zapopan, Jalisco, sin perjuicio de los derechos irrenunciables que correspondan al Usuario como consumidor, incluida la opción de acudir ante la autoridad de su domicilio o ante PROFECO.',
  },
];

export default function TerminosScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Términos y Condiciones</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M14 2H6C5.4 2 5 2.4 5 3V21C5 21.6 5.4 22 6 22H18C18.6 22 19 21.6 19 21V7L14 2Z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M14 2V7H19" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
              <Path d="M9 13H15M9 17H13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
            </Svg>
          </View>
          <View>
            <Text style={styles.headerTitle}>RETTA</Text>
            <Text style={styles.headerSub}>Última actualización: 19 de mayo de 2026</Text>
          </View>
        </View>

        <Text style={styles.intro}>Bienvenido a <Text style={{ color: DT.primary, fontFamily: FONTS.bodyBold }}>RETTA</Text>. Al registrarte o usar nuestra plataforma aceptas los siguientes términos. Te recomendamos leerlos con atención — describen tus derechos, tus obligaciones y los riesgos que asumes al participar en partidos deportivos organizados a través de la app.</Text>

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

        <Text style={styles.footer}>Al usar RETTA aceptas estos términos.{'\n'}Para dudas escríbenos a rettaapp@gmail.com</Text>
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
  footer:         { marginTop: 24, textAlign: 'center', fontSize: 11, color: DT.outline, lineHeight: 18, fontFamily: FONTS.body },
});
