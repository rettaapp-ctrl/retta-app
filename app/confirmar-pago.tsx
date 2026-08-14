import React, { useState, useRef, useEffect } from 'react';
import { AppAlert } from '@/lib/appAlert';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { useStripe } from '@stripe/stripe-react-native';
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { track } from '@/lib/analytics';

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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

export default function ConfirmarPagoScreen() {
  const router = useRouter();
  const { request } = useApi();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  // partido_id es el ÚNICO parámetro de confianza. Todas las rutas son
  // deep-linkeables vía retta://, así que un link malicioso podría inyectar
  // texto arbitrario (complejo/fecha/precio) en esta pantalla de pago. Por eso
  // los datos que se muestran (complejo, cancha, fecha, hora, precio, tipo) se
  // traen del backend con el partido_id, no de los params de navegación.
  // El resto (equipo, invitado) solo alimenta el cargo, que ya es
  // backend-autoritativo.
  const {
    partido_id, equipo, es_invitado, nombre_invitado, posicion_invitado,
  } = useLocalSearchParams<{
    partido_id: string; equipo: string;
    es_invitado?: string; nombre_invitado?: string; posicion_invitado?: string;
  }>();

  const esInvitado = es_invitado === 'true';

  // Detalle del partido traído del backend (fuente de verdad para el display).
  interface PartidoDetalle {
    complejo_nombre?: string;
    cancha_nombre?: string;
    fecha?: string;
    hora_inicio?: string;
    precio_jugador?: number;
    tipo?: string;
  }
  const [detalle, setDetalle] = useState<PartidoDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const data = await request(`/partidos/${partido_id}`);
        if (activo) setDetalle(data);
      } catch {
        // Si falla, dejamos detalle en null: se muestra un placeholder en vez
        // de datos potencialmente inyectados por el deep-link.
      } finally {
        if (activo) setCargandoDetalle(false);
      }
    })();
    return () => { activo = false; };
  }, [partido_id, request]);

  // Valores de display derivados SOLO del backend (nunca de los params).
  const complejo = detalle?.complejo_nombre ?? '';
  const cancha   = detalle?.cancha_nombre ?? '';
  const fecha    = detalle?.fecha ?? '';
  const hora     = detalle?.hora_inicio ?? '';
  const tipo     = detalle?.tipo ?? '';
  const precio   = detalle?.precio_jugador != null ? String(detalle.precio_jugador) : '';

  const [stage, setStage] = useState<Stage>('confirm');
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
    // Flujo real de pago con Stripe Payment Sheet:
    //   1. Backend crea PaymentIntent y reserva cupo (inscripción pendiente)
    //   2. App inicializa Payment Sheet con el client_secret
    //   3. App presenta el Payment Sheet (UI nativo de Stripe)
    //   4. Usuario confirma su tarjeta → el banco APARTA el monto (holds)
    //   5. Webhook backend recibe amount_capturable_updated → confirma inscripción
    //      (el cobro real lo hace el capturador 30 min antes del partido)
    //   6. App muestra pantalla de éxito
    // Los invitados también pasan por Stripe con el mismo endpoint —
    // el backend crea la inscripción con es_invitado=true y el flujo
    // es idéntico al del jugador (Payment Sheet → webhook confirma).
    setStage('processing');
    try {
      // 1. Crear PaymentIntent en el backend (reserva cupo con status pendiente)
      const { paymentIntentClientSecret } = await request('/pagos/crear-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          partido_id,
          equipo: equipo || 'auto',
          es_invitado: esInvitado,
          nombre_invitado: esInvitado ? nombre_invitado : undefined,
          posicion_invitado: esInvitado ? posicion_invitado : undefined,
        }),
      });

      // 2. Inicializar Payment Sheet con el client_secret
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Retta',
        paymentIntentClientSecret,
        allowsDelayedPaymentMethods: false,
        returnURL: 'retta://stripe-redirect',
        // Stripe SÓLO acepta hex #RRGGBB o #RRGGBBAA (no rgba(...)).
        // Los DT tokens tienen algunos rgba (glassBorder, etc.), por eso
        // pasamos valores hex directos aquí. Colores oficiales del manual.
        appearance: {
          colors: {
            primary:             '#bec2ff', // lavanda primary
            background:          '#11131b', // fondo dark
            componentBackground: '#1d1f28', // surface card
            componentBorder:     '#FFFFFF14', // glass border (rgba 8% en hex)
            componentDivider:    '#FFFFFF14',
            primaryText:         '#e1e1ee', // texto principal
            secondaryText:       '#c6c5d7', // texto secundario
            componentText:       '#e1e1ee',
            placeholderText:     '#908fa0',
            icon:                '#c6c5d7',
            error:               '#ffb4ab',
          },
          shapes: { borderRadius: 12, borderWidth: 1 },
        },
      });
      if (initError) throw new Error(initError.message);

      // 3. Presentar Payment Sheet (UI nativo)
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // Usuario canceló o hubo error
        setStage('confirm');
        if (presentError.code === 'Canceled') {
          // Silencioso — el usuario abandonó. No mostrar error.
          track('partido_pago_cancelado', { partido_id });
          return;
        }
        throw new Error(presentError.message || 'No se pudo completar el pago');
      }

      // 4. Pago confirmado por Stripe. El webhook del backend actualizará la
      //    inscripción a "confirmado" en segundos. Mostramos éxito de una vez
      //    (optimistic UI) — la app luego refresca al volver a Mis Rettas.
      track('partido_inscripcion_completada', {
        partido_id, equipo, precio: Number(precio) || 0, tipo, metodo: 'stripe',
      });
      setStage('success');
    } catch (e: any) {
      setStage('confirm');
      const msg = e?.message || 'No pudimos procesar el pago. Intenta de nuevo.';
      track('partido_inscripcion_fallo', {
        partido_id, es_invitado: esInvitado, error: msg.slice(0, 100),
      });
      AppAlert.alert('No se pudo completar', msg);
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
                ? `${nombre_invitado} ya tiene su lugar.\nSe cobra al confirmarse el partido.`
                : `Tu lugar está confirmado. ¡Te vemos en la cancha!\nEl cobro se hace 30 min antes del partido.`}
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

  // ── CARGANDO DETALLE ──
  // Mientras traemos el partido del backend mostramos un loader, para no
  // pintar la pantalla con datos vacíos ni con params del deep-link.
  if (cargandoDetalle) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.processingWrap}>
          <ActivityIndicator color={DT.primary} size="large" />
          <Text style={styles.processingSubtitle}>Cargando detalles del partido…</Text>
        </SafeAreaView>
      </View>
    );
  }

  // ── CONFIRMAR ──
  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top','bottom']}>
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

          {/* Método de pago — informativo, Stripe se abre al tocar PAGAR */}
          <Text style={styles.sectionLabel}>MÉTODO DE PAGO</Text>
          <View style={styles.metodoInfo2}>
            <View style={styles.metodoInfoIcon}>
              <CardIcon />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metodoInfoTitle}>Pago seguro con Stripe</Text>
              <Text style={styles.metodoInfoSub}>
                Ingresa tu tarjeta o usa Google Pay al continuar.
              </Text>
            </View>
          </View>

          <Text style={styles.politicaTxt}>
            No se te cobra hoy: el cargo se hace 30 min antes, cuando el partido se confirma. Si no se arma, no pagas nada.{'\n'}Cancela con +12 h sin cargo · entre 3 y 12 h se cobra el 40% · con menos de 3 h se cobra completo.
          </Text>

        </ScrollView>

        {/* Botón pagar */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handlePagar} disabled={stage !== 'confirm' || !detalle} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pagarBtn, (stage !== 'confirm' || !detalle) && { opacity: 0.6 }]}>
              <CardIcon />
              <Text style={styles.pagarBtnTxt}>CONFIRMAR MI LUGAR · ${precio} MXN</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
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
  metodoInfo2:        { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 16, marginBottom: 18 },
  metodoInfoIcon:     { width: 44, height: 44, borderRadius: 12, backgroundColor: DT.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  metodoInfoTitle:    { fontSize: 15, color: DT.onBg, fontFamily: FONTS.bodyMed, letterSpacing: 0.2, marginBottom: 3 },
  metodoInfoSub:      { fontSize: 12.5, color: DT.onSurfaceVar, lineHeight: 17, fontFamily: FONTS.body },

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
