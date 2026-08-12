// ═══════════════════════════════════════════════════════════════
// RETTA — lib/legalContent.ts
// Fuente única del texto legal (Términos y Aviso de Privacidad).
// Las pantallas app/terminos.tsx, app/privacidad.tsx y
// app/aceptar-legal.tsx leen de aquí, así nunca se desincronizan.
//
// CUANDO ACTUALICES EL TEXTO: sube también LEGAL_VERSION en
// constants/index.ts para forzar re-aceptación de todos los usuarios.
//
// Última revisión: 2026-08-12
//   • Razón social: ORGANIZACIÓN DEPORTIVA DINÁMICA EN LÍNEA, S.A. de C.V.
//   • Domicilio completo (Av. Acueducto 2100, Guadalajara)
//   • Stripe ya en vivo (antes decía "próximamente")
//   • Nueva sección de asistente Retta IA (Términos §14, Privacidad §7)
//   • Eliminación de cuenta desde la app y página web (Términos §18)
//   • Jurisdicción: Guadalajara (antes Zapopan)
//   • Contacto: soporte@rettaapp.com (antes gmail)
//   • Riesgo deportivo incluye fallecimiento (Términos §15)
//   • Sin emojis en el texto legal
//   • Ley de datos 2025: autoridad = Secretaría Anticorrupción y
//     Buen Gobierno (el INAI ya no existe); sin citas a artículos
//     de la ley abrogada; supletoriedad del Código Civil de Jalisco
// ═══════════════════════════════════════════════════════════════

export type LegalSeccion = {
  num: string;
  titulo: string;
  cuerpo: string;
};

export const TERMINOS_SECCIONES: LegalSeccion[] = [
  {
    num: '1', titulo: 'Identidad del prestador',
    cuerpo: 'RETTA (en adelante, "RETTA", "nosotros" o "la Plataforma") es una plataforma operada por ORGANIZACIÓN DEPORTIVA DINÁMICA EN LÍNEA, S.A. de C.V. (en adelante, "la Empresa"), con domicilio en Avenida Acueducto 2100, 2DB interior 7, Colonia Colinas de San Javier, C.P. 44660, Guadalajara, Jalisco, México. Contacto: soporte@rettaapp.com.',
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
    cuerpo: 'Eres responsable de mantener la confidencialidad de tu cuenta y de toda actividad que ocurra bajo ella. Una persona física solo puede tener una cuenta activa. Las cuentas son personales e intransferibles.\n\nNotifícanos de inmediato si sospechas que tu cuenta fue comprometida escribiendo a soporte@rettaapp.com.',
  },
  {
    num: '5', titulo: 'Uso del servicio y disponibilidad',
    cuerpo: 'RETTA es un intermediario tecnológico que permite a Usuarios reservar y organizar partidos de fútbol en Complejos afiliados. RETTA no es propietaria de los Complejos ni operadora directa de los Partidos.\n\nRETTA realiza esfuerzos razonables para mantener la Plataforma disponible las 24 horas, pero no garantiza un nivel de servicio ininterrumpido y podrá realizar mantenimientos programados o de emergencia.\n\nEl Usuario se compromete a usar la Plataforma conforme a la ley, no suplantar a otras personas, no crear cuentas falsas, no utilizarla para fines comerciales no autorizados y respetar a otros Usuarios, Complejos, árbitros y personal.',
  },
  {
    num: '6', titulo: 'Reservas y partidos',
    cuerpo: 'Al inscribirte a un Partido te comprometes a asistir en la fecha y hora indicadas. Tu lugar es individual e intransferible. Un Partido se confirma cuando se alcanza el mínimo de jugadores; si no, RETTA cancela y reembolsa el monto íntegro a los inscritos.\n\nPara mantener partidos justos, la Plataforma equilibra automáticamente los equipos al momento de la inscripción; el lugar que ocupas puede depender del balance entre equipos.\n\nLa información del Partido puede modificarse por causas operativas del Complejo, en cuyo caso se notificará a los Usuarios inscritos.',
  },
  {
    num: '7', titulo: 'Sistema de invitados',
    cuerpo: 'Un Usuario puede agregar Invitados pagando su lugar. El Anfitrión asume la responsabilidad por la asistencia y conducta del Invitado, garantiza que sea mayor de 16 años y acepta que quede sujeto al Código de Conducta.\n\nEl Anfitrión no podrá reclamar reembolso por inasistencia del Invitado fuera de las políticas de cancelación.',
  },
  {
    num: '8', titulo: 'Pagos, precios y reembolsos',
    cuerpo: 'RETTA podrá ofrecer descuentos a su discreción; los descuentos aplican exclusivamente a inscripciones realizadas después de su activación y no son retroactivos.\n\nTodos los precios mostrados en la Plataforma están expresados en pesos mexicanos (MXN) e incluyen los impuestos correspondientes, incluido el IVA cuando aplique.\n\nLos pagos se procesan a través de Stripe, proveedor externo autorizado que opera conforme a estándares PCI-DSS — RETTA no almacena datos de tarjetas. El cargo se efectúa al confirmar la inscripción.\n\nLos reembolsos se acreditan al mismo método de pago en un plazo de 5 a 10 días hábiles, sujeto a los tiempos del procesador y del banco emisor.',
  },
  {
    num: '9', titulo: 'Facturación (CFDI)',
    cuerpo: 'El Usuario puede solicitar la emisión de un Comprobante Fiscal Digital por Internet (CFDI) por las inscripciones pagadas dentro de los plazos que marque la legislación fiscal vigente.\n\nPara ello deberá enviar sus datos fiscales (RFC, razón social, uso del CFDI, régimen y código postal) al correo soporte@rettaapp.com indicando el o los pagos a facturar.',
  },
  {
    num: '10', titulo: 'Política de cancelación',
    cuerpo: 'Las cancelaciones se calculan con base en la hora del servidor de RETTA (zona horaria América/Ciudad de México), no con la del dispositivo del Usuario.\n\n• Más de 12 horas antes — Reembolso del 100%.\n• Entre 3 y 12 horas antes — Reembolso del 60% (RETTA retiene 40% por costos operativos y afectación al Complejo).\n• Menos de 3 horas antes o no asistencia — Sin reembolso.\n\nSi RETTA o el Complejo cancelan el Partido por falta de cupo, fuerza mayor o causas operativas, el reembolso es del 100% para todos los inscritos.',
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
    num: '14', titulo: 'Asistente virtual (Retta IA)',
    cuerpo: 'La Plataforma incluye un asistente de ayuda basado en inteligencia artificial ("Retta IA") para resolver dudas sobre el funcionamiento del servicio.\n\nLas respuestas del asistente son generadas automáticamente, tienen carácter meramente informativo y pueden contener imprecisiones. No constituyen asesoría médica, legal ni financiera, ni sustituyen la información oficial de cada Partido mostrada en la Plataforma, que siempre prevalece.\n\nEl Usuario se compromete a no utilizar el asistente para fines ilícitos, para intentar vulnerar la Plataforma ni para generar contenido ofensivo. RETTA puede limitar el número de consultas por Usuario.',
  },
  {
    num: '15', titulo: 'Asunción de riesgo y responsabilidad por lesiones',
    cuerpo: 'El fútbol es un deporte de contacto con riesgos inherentes, incluyendo sin limitarse a: torceduras, fracturas, contusiones, daños musculares, golpes de calor, paros cardiacos y otras afectaciones a la salud que, en casos extremos, pueden derivar en lesiones graves, incapacidad permanente o incluso la muerte.\n\nAl utilizar RETTA, el Usuario reconoce y acepta expresamente asumir dichos riesgos inherentes a la práctica deportiva y, en la máxima medida permitida por la legislación aplicable, libera a la Empresa, sus accionistas, directivos, empleados y representantes de cualquier responsabilidad derivada de lesiones, incapacidad, fallecimiento, daños o perjuicios sufridos durante o con motivo de su participación en un Partido, salvo que deriven de dolo o culpa grave directamente atribuible a la Empresa.\n\nEl Usuario es responsable de:\n• Contar con condición física adecuada;\n• Consultar a un médico si tiene condiciones preexistentes;\n• Contar con seguro médico si lo considera necesario;\n• Usar equipo deportivo adecuado;\n• Suspender su participación ante cualquier malestar.\n\nRETTA no provee servicios médicos, primeros auxilios ni seguros; estos, en caso de existir, son responsabilidad del Complejo.',
  },
  {
    num: '16', titulo: 'Limitación de responsabilidad',
    cuerpo: 'En la máxima medida permitida por la ley, la Empresa no será responsable por:\n• Daños indirectos, incidentales, especiales o punitivos;\n• Lucro cesante o daño moral;\n• Acciones u omisiones de Complejos, otros Usuarios, Invitados o terceros;\n• Interrupciones del servicio por causas técnicas o fuerza mayor;\n• Cancelaciones por clima, infraestructura, autoridad o circunstancias ajenas;\n• Pérdida de pertenencias en los Complejos.\n\nLa responsabilidad máxima total de la Empresa se limita al monto pagado por el Usuario durante los últimos tres meses anteriores al hecho reclamado.\n\nEsta limitación no aplica respecto de los derechos irrenunciables que la legislación del consumidor reconozca al Usuario.',
  },
  {
    num: '17', titulo: 'Indemnización',
    cuerpo: 'El Usuario acepta indemnizar y mantener libre de responsabilidad a la Empresa frente a reclamaciones, demandas, daños y gastos (incluyendo honorarios razonables de abogados) que surjan de:\n• Su uso indebido de la Plataforma;\n• La violación de estos Términos;\n• La violación de derechos de terceros;\n• La conducta de sus Invitados.',
  },
  {
    num: '18', titulo: 'Suspensión, terminación y eliminación de cuenta',
    cuerpo: 'RETTA puede suspender o cancelar tu cuenta, con o sin notificación previa, por:\n• Incumplimiento de los Términos;\n• Conducta antideportiva grave;\n• Patrón reiterado de no-shows;\n• Uso fraudulento de pagos;\n• Reportes graves verificados;\n• Sospecha razonable de actividad ilegal.\n\nEl Usuario puede eliminar su cuenta en cualquier momento desde la aplicación en Configuración → Cuenta → Eliminar cuenta, o desde la página web oficial de eliminación de cuenta de RETTA. La eliminación se confirma con un código enviado a tu correo, es inmediata e irreversible: tu perfil se elimina, tu historial deportivo se anonimiza y los registros de pago se conservan únicamente por obligaciones legales y fiscales.\n\nLa eliminación de la cuenta no genera reembolso de Partidos pasados ni de inscripciones vigentes ya pagadas.\n\nLas cuentas sin actividad por más de veinticuatro (24) meses podrán ser marcadas como inactivas. RETTA notificará al correo registrado y, de no recibir respuesta dentro de los treinta días siguientes, podrá cerrar la cuenta y proceder a la eliminación o anonimización de los datos asociados.',
  },
  {
    num: '19', titulo: 'Comunicaciones',
    cuerpo: 'Al crear tu cuenta autorizas a RETTA a enviarte correos y notificaciones push relacionadas con confirmaciones, cancelaciones, recordatorios, calificaciones pendientes, descuentos, mensajes de seguridad y actualizaciones.\n\nLas comunicaciones promocionales pueden gestionarse escribiendo a soporte@rettaapp.com.\n\nLas comunicaciones transaccionales (relacionadas con un Partido o con la seguridad de tu cuenta) son necesarias para la operación y no pueden desactivarse.',
  },
  {
    num: '20', titulo: 'Propiedad intelectual y marcas',
    cuerpo: 'Todos los derechos sobre la Plataforma, su código, diseño, contenidos editoriales y bases de datos son propiedad exclusiva de la Empresa y/o sus licenciantes.\n\nLa denominación, logotipo y signos distintivos de "RETTA" son marcas registradas (o en trámite de registro) ante el Instituto Mexicano de la Propiedad Industrial.\n\nEl Usuario no podrá copiar, modificar, distribuir, vender ni crear obras derivadas sin autorización expresa por escrito.\n\nAl subir contenido (foto de perfil, etc.), el Usuario otorga a RETTA una licencia no exclusiva, mundial y libre de regalías para utilizar dicho contenido dentro de la Plataforma.',
  },
  {
    num: '21', titulo: 'Modificaciones a los términos',
    cuerpo: 'RETTA puede modificar estos Términos publicando la versión actualizada en la Plataforma. Para cambios sustanciales notificará al Usuario con al menos quince días naturales de anticipación a través de correo electrónico y/o notificación dentro de la Plataforma.\n\nEl uso continuado después de una modificación constituye aceptación. El Usuario que no esté de acuerdo con las modificaciones podrá eliminar su cuenta.',
  },
  {
    num: '22', titulo: 'Resolución de controversias',
    cuerpo: 'Antes de iniciar procedimientos legales, las partes intentarán resolver las controversias de buena fe mediante comunicación directa a soporte@rettaapp.com.\n\nSi no se resuelve en treinta días naturales, el Usuario podrá acudir a la Procuraduría Federal del Consumidor (PROFECO) para procedimientos de conciliación y arbitraje, o a los tribunales competentes.',
  },
  {
    num: '23', titulo: 'Disposiciones generales',
    cuerpo: '• Cesión: la Empresa puede ceder estos Términos a cualquier afiliada o sucesora, incluyendo por causa de fusión, escisión o adquisición. El Usuario no podrá ceder sus derechos sin consentimiento previo y por escrito.\n• Separabilidad: si una disposición se declara inválida, las restantes seguirán vigentes.\n• Acuerdo completo: estos Términos, junto con el Aviso de Privacidad, constituyen el acuerdo completo entre las partes.\n• No renuncia: el no ejercicio de un derecho por la Empresa no constituye renuncia al mismo.\n• Fuerza mayor: la Empresa no será responsable por incumplimientos derivados de caso fortuito o fuerza mayor.\n• Idioma: la versión oficial es la redactada en español de México.',
  },
  {
    num: '24', titulo: 'Legislación y jurisdicción',
    cuerpo: 'Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos, incluyendo la Ley Federal de Protección al Consumidor, la Ley Federal de Protección de Datos Personales en Posesión de los Particulares vigente, el Código de Comercio y el Código Civil Federal, así como, en lo que resulte aplicable de manera supletoria, el Código Civil del Estado de Jalisco y demás disposiciones estatales vigentes.\n\nPara la interpretación y cumplimiento, las partes se someten a la jurisdicción de los tribunales competentes de Guadalajara, Jalisco, sin perjuicio de los derechos irrenunciables que correspondan al Usuario como consumidor, incluida la opción de acudir ante la autoridad de su domicilio o ante PROFECO.',
  },
];

export const PRIVACIDAD_SECCIONES: LegalSeccion[] = [
  {
    num: '1', titulo: 'Identidad y domicilio del responsable',
    cuerpo: 'ORGANIZACIÓN DEPORTIVA DINÁMICA EN LÍNEA, S.A. de C.V. (en adelante, "RETTA"), operadora de la plataforma Retta, es el responsable del tratamiento de tus datos personales, con domicilio en Avenida Acueducto 2100, 2DB interior 7, Colonia Colinas de San Javier, C.P. 44660, Guadalajara, Jalisco, México. Contacto: soporte@rettaapp.com.',
  },
  {
    num: '2', titulo: 'Datos personales que recabamos',
    cuerpo: 'Identificación y contacto:\n• Nombre completo\n• Correo electrónico\n• Número telefónico (opcional)\n• Fecha de nacimiento\n• Género\n• Ciudad de residencia\n• Fotografía de perfil (opcional)\n\nPerfil deportivo:\n• Posición preferida\n• Nivel autodeclarado\n• Historial de Partidos\n• Calificaciones recibidas y otorgadas\n• Rating de habilidad\n• Rachas de actividad\n• Marcadores reportados\n\nUso y dispositivo:\n• Eventos de navegación\n• Sistema operativo, modelo del dispositivo, versión de la app\n• Token de notificaciones push\n• Dirección IP\n• Identificadores de sesión\n• Consultas que envías al asistente Retta IA\n\nTransaccionales:\n• Historial de inscripciones, cancelaciones, montos pagados, descuentos aplicados\n\nNo almacenamos datos de tarjetas — son tratados directamente por Stripe, el proveedor de pagos.',
  },
  {
    num: '3', titulo: 'Datos sensibles, biométricos, financieros y de geolocalización',
    cuerpo: 'RETTA no recaba datos personales sensibles (origen étnico o racial, estado de salud, datos genéticos, creencias religiosas, opiniones políticas, preferencias sexuales) como parte regular del servicio.\n\nRETTA no recaba datos biométricos (huella, rostro, voz, iris).\n\nRETTA no recaba datos de geolocalización en tiempo real; la información de ciudad se obtiene únicamente de lo que el Usuario declara en su perfil.\n\nÚnicamente en el módulo de Reportes un Usuario puede mencionar voluntariamente lesiones o incidentes médicos, los cuales se tratan con estricta confidencialidad y solo para fines administrativos.\n\nLos datos financieros (tarjeta de crédito o débito) son recabados y procesados directamente por Stripe bajo estándares PCI-DSS; RETTA no tiene acceso ni almacena dicha información.',
  },
  {
    num: '4', titulo: 'Finalidades del tratamiento',
    cuerpo: 'Primarias (necesarias para el servicio):\n• Crear y administrar tu cuenta\n• Gestionar inscripciones y participación en Partidos\n• Procesar pagos y reembolsos\n• Calcular tu rating y estadísticas deportivas\n• Operar los sistemas de calificación y reportes\n• Operar el asistente de ayuda Retta IA\n• Enviar notificaciones transaccionales\n• Facilitar comunicación entre Usuarios\n• Cumplir obligaciones legales\n• Atender soporte\n• Garantizar la seguridad de la Plataforma y prevenir fraude\n\nSecundarias (requieren consentimiento adicional):\n• Envío de comunicaciones promocionales\n• Análisis estadísticos avanzados de comportamiento\n• Publicidad personalizada\n\nPuedes oponerte a las finalidades secundarias en cualquier momento sin que esto afecte la prestación del servicio principal, escribiendo a soporte@rettaapp.com.',
  },
  {
    num: '5', titulo: 'Decisiones automatizadas',
    cuerpo: 'RETTA utiliza procesos automatizados para calcular tu rating de habilidad (con base en los resultados de tus Partidos y la fuerza de tus rivales), tu nivel deportivo, tus rachas, para equilibrar los equipos al momento de la inscripción y para sugerirte Partidos compatibles con tu perfil (matchmaking).\n\nEstos procesos no producen efectos jurídicos sobre el Usuario ni afectan significativamente sus derechos: son indicadores de carácter recreativo y referencial.\n\nEl Usuario puede solicitar a RETTA información adicional sobre el funcionamiento de estos procesos escribiendo a soporte@rettaapp.com.',
  },
  {
    num: '6', titulo: 'Encargados del tratamiento y transferencias',
    cuerpo: 'RETTA contrata a los siguientes proveedores tecnológicos que tratan datos por nuestra cuenta bajo contratos de confidencialidad:\n\n• Supabase — Base de datos, autenticación, almacenamiento (EE.UU.)\n• Railway — Servidor de aplicación backend (EE.UU.)\n• Stripe — Procesamiento de pagos (Global)\n• Cloudflare — Distribución web de portales y ejecución del asistente Retta IA (Global)\n• Resend — Correos electrónicos transaccionales (EE.UU. / UE)\n• Expo — Notificaciones push (EE.UU.)\n• Sentry — Monitoreo de errores técnicos (EE.UU.)\n• PostHog — Analítica de uso seudonimizada (EE.UU.)\n• Meta Platforms — Herramientas de medición de marketing seudonimizadas, únicamente para finalidades secundarias sujetas a tu consentimiento (Global)\n\nEstas transferencias internacionales se realizan conforme a lo previsto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. RETTA puede compartir datos sin consentimiento del Usuario únicamente en los supuestos que dicha ley permite, incluyendo requerimientos de autoridad competente.\n\nNo vendemos ni rentamos tus datos a terceros con fines comerciales.',
  },
  {
    num: '7', titulo: 'Asistente de inteligencia artificial (Retta IA)',
    cuerpo: 'Las preguntas que escribes al asistente Retta IA se procesan mediante el servicio de inteligencia artificial de Cloudflare, utilizando un modelo de lenguaje, con el único fin de generarte una respuesta.\n\nTe recomendamos no incluir en tus consultas datos personales sensibles, financieros o de terceros: el asistente no los necesita para ayudarte.\n\nLas respuestas del asistente son informativas; la información oficial de cada Partido es siempre la mostrada en las pantallas de la Plataforma.',
  },
  {
    num: '8', titulo: 'Tiempo de conservación y eliminación de cuenta',
    cuerpo: 'Conservaremos tus datos mientras tu cuenta esté activa y por el tiempo adicional necesario para cumplir con obligaciones legales (fiscales, contables, prevención de fraude), normalmente hasta cinco años posteriores a la eliminación de la cuenta.\n\nPuedes eliminar tu cuenta directamente desde la aplicación (Configuración → Cuenta → Eliminar cuenta) o desde la página web oficial de eliminación de cuenta de RETTA, confirmando con un código enviado a tu correo. La eliminación es inmediata e irreversible: tus datos de identificación se eliminan, tu historial deportivo se anonimiza (deja de estar vinculado a tu persona) y los registros de pago se conservan únicamente por obligaciones fiscales durante el plazo legal.\n\nVencidos los plazos legales, los datos se eliminan o anonimizan irreversiblemente.',
  },
  {
    num: '9', titulo: 'Medidas de seguridad',
    cuerpo: 'RETTA implementa medidas administrativas, técnicas y físicas razonables:\n• Cifrado en tránsito (HTTPS/TLS) y en reposo\n• Políticas de control de acceso a nivel de filas en la base de datos\n• Autenticación con tokens cifrados y rotación periódica\n• Almacenamiento seguro de contraseñas con algoritmos de hash modernos\n• Monitoreo continuo de eventos de seguridad\n• Auditorías periódicas\n\nNinguna medida es infalible; si detectamos una vulneración de seguridad que afecte de forma significativa tus derechos, te lo notificaremos en los términos que establece la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.',
  },
  {
    num: '10', titulo: 'Derechos ARCO',
    cuerpo: 'Tienes derecho a:\n• Acceder a tus datos y conocer su tratamiento\n• Rectificar los que sean inexactos o incompletos\n• Cancelar los que consideres tratados indebidamente\n• Oponerte al tratamiento para fines específicos\n\nPuedes rectificar la mayoría de tus datos directamente en la app (Perfil y Configuración) y cancelar el tratamiento eliminando tu cuenta. Para cualquier otra solicitud, envíala a soporte@rettaapp.com indicando:\n(i) Nombre completo y datos de contacto\n(ii) Documento que acredite tu identidad (INE u otro oficial vigente)\n(iii) Descripción clara del derecho que ejerces y los datos personales sobre los que recae\n\nResponderemos en máximo veinte días hábiles. Si la solicitud procede, la haremos efectiva dentro de los quince días hábiles siguientes a la comunicación de la respuesta.',
  },
  {
    num: '11', titulo: 'Revocación del consentimiento',
    cuerpo: 'Puedes revocar tu consentimiento en cualquier momento mediante el procedimiento de la sección anterior.\n\nLa revocación no tendrá efectos retroactivos y, en algunos casos, puede implicar la imposibilidad de seguir prestándote el servicio.',
  },
  {
    num: '12', titulo: 'Limitación de uso y divulgación',
    cuerpo: 'Puedes limitar el uso o divulgación de tus datos para fines secundarios (marketing, análisis avanzado, publicidad personalizada) escribiendo a soporte@rettaapp.com.',
  },
  {
    num: '13', titulo: 'Menores de edad',
    cuerpo: 'RETTA está dirigida exclusivamente a personas mayores de 16 años. Si tienes entre 16 y 17 años, declaras contar con autorización de tu padre, madre o tutor para usar la Plataforma y consentir el tratamiento de tus datos.\n\nSi detectas que un menor de 16 años se ha registrado, escríbenos a soporte@rettaapp.com y procederemos a eliminar la cuenta y los datos asociados.',
  },
  {
    num: '14', titulo: 'Cookies y tecnologías similares',
    cuerpo: 'La aplicación móvil utiliza identificadores locales (almacenamiento seguro del dispositivo) para mantener tu sesión iniciada, recordar preferencias y registrar eventos analíticos.\n\nLos portales web pueden utilizar cookies técnicas necesarias para su funcionamiento.\n\nNo utilizamos cookies publicitarias de terceros sin consentimiento explícito.',
  },
  {
    num: '15', titulo: 'Departamento de privacidad',
    cuerpo: 'Para cualquier solicitud, duda o reclamo relacionado con el tratamiento de tus datos personales, incluyendo el ejercicio de derechos ARCO y la revocación del consentimiento, contáctanos en:\n\nCorreo: soporte@rettaapp.com\nAsunto sugerido: "Solicitud de protección de datos personales"\n\nEl Departamento de Privacidad de RETTA atenderá tu solicitud dentro de los plazos legales aplicables.',
  },
  {
    num: '16', titulo: 'Aviso de privacidad simplificado',
    cuerpo: 'Al momento de recolectar datos personales (por ejemplo, en las pantallas de registro), RETTA muestra un aviso simplificado que informa al Usuario sobre la existencia y características principales del tratamiento, así como el medio para consultar el presente Aviso de Privacidad Integral.\n\nEste Aviso Integral se encuentra siempre disponible dentro de la aplicación en Configuración → Aviso de privacidad y en el sitio web oficial de RETTA.',
  },
  {
    num: '17', titulo: 'Cambios al aviso de privacidad',
    cuerpo: 'Este Aviso podrá ser actualizado. Cualquier modificación sustancial será notificada mediante aviso visible dentro de la Plataforma, correo electrónico al Usuario y/o actualización de la fecha al inicio del documento.',
  },
  {
    num: '18', titulo: 'Autoridad de protección de datos',
    cuerpo: 'Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes acudir a la Secretaría Anticorrupción y Buen Gobierno, autoridad competente en materia de protección de datos personales en posesión de los particulares conforme a la ley vigente, a través de los medios oficiales que dicha dependencia ponga a disposición (https://www.gob.mx).',
  },
  {
    num: '19', titulo: 'Aceptación',
    cuerpo: 'Al usar la Plataforma RETTA, manifiestas haber leído, entendido y aceptado el presente Aviso de Privacidad y consientes el tratamiento de tus datos personales en los términos aquí descritos, incluyendo las transferencias internacionales descritas en la sección 6.',
  },
];
