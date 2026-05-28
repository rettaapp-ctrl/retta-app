// ═══════════════════════════════════════════════════════════════
// RETTA — lib/legalContent.ts
// Fuente única del texto legal (Términos y Aviso de Privacidad).
// Las pantallas app/terminos.tsx, app/privacidad.tsx y
// app/aceptar-legal.tsx leen de aquí, así nunca se desincronizan.
//
// CUANDO ACTUALICES EL TEXTO: sube también LEGAL_VERSION en
// constants/index.ts para forzar re-aceptación de todos los usuarios.
// ═══════════════════════════════════════════════════════════════

export type LegalSeccion = {
  num: string;
  titulo: string;
  cuerpo: string;
};

export const TERMINOS_SECCIONES: LegalSeccion[] = [
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

export const PRIVACIDAD_SECCIONES: LegalSeccion[] = [
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
