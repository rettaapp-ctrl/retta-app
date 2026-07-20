import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';

// ─────────────────────────────────────────────────────────────
// Paso 2 del flujo OTP: valida el código de 6 dígitos que llegó
// por correo. Si el email no tenía cuenta, aquí se crea (el backend
// estampa la aceptación legal del checkbox de la pantalla anterior).
// Al persistir la sesión, el router del _layout manda solo al
// onboarding (cuenta nueva) o a los tabs (cuenta existente).
// ─────────────────────────────────────────────────────────────
export default function VerificarScreen() {
  const { verifyOtp, requestOtp } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email  = (params.email || '').toString();

  const [codigo, setCodigo]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState('');
  const [info, setInfo]           = useState('');

  // Cooldown del botón de reenviar (arranca en 30s porque el código
  // recién se mandó desde la pantalla anterior; el backend además
  // tiene su propio cooldown server-side de 30s).
  const [cooldown, setCooldown] = useState(30);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    tickRef.current = setInterval(() => {
      setCooldown(c => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [cooldown]);

  async function handleVerify() {
    if (codigo.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    if (!email) { setError('Falta el email. Regresa e inténtalo de nuevo.'); return; }
    setError(''); setInfo(''); setLoading(true);
    try {
      await verifyOtp(email, codigo);
      // Sesión persistida → el router del _layout redirige solo:
      // cuenta nueva → onboarding; existente → tabs.
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setError(''); setInfo(''); setResending(true);
    try {
      await requestOtp(email);
      setInfo('Te enviamos un nuevo código a tu email.');
      setCodigo('');
      setCooldown(30);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top','bottom']}>
    <KeyboardAvoidingView style={styles.rootInner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backTxt}>← Regresar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Revisa tu correo</Text>
        <Text style={styles.subtitle}>
          Te enviamos un código de 6 dígitos a{'\n'}
          <Text style={styles.subtitleEmail}>{email || 'tu email'}</Text>
        </Text>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>CÓDIGO</Text>
            <TextInput
              style={styles.codeInput}
              value={codigo}
              onChangeText={v => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={DT.outline}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              onSubmitEditing={handleVerify}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info  ? <Text style={styles.info}>{info}</Text>   : null}

          <TouchableOpacity onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnTxt}>ENTRAR</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={handleResend}
            disabled={resending || cooldown > 0}
          >
            <Text style={styles.linkTxt}>
              {cooldown > 0
                ? `Reenviar código en ${cooldown}s`
                : resending
                  ? 'Enviando…'
                  : <>¿No recibiste el código? <Text style={styles.linkAccent}>Reenviar</Text></>
              }
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Si no lo ves, revisa tu carpeta de spam o promociones.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DT.bg },
  rootInner:    { flex: 1 },
  scroll:       { flexGrow: 1, padding: 24, paddingTop: 40, paddingBottom: 40, backgroundColor: 'transparent' },
  back:         { marginBottom: 24 },
  backTxt:      { color: DT.primary, fontSize: 14, fontFamily: FONTS.bodyMed },
  title:        { fontSize: 30, color: DT.onBg, marginBottom: 8, fontFamily: FONTS.display, letterSpacing: -0.8 },
  subtitle:     { fontSize: 14, color: DT.onSurfaceVar, marginBottom: 32, lineHeight: 20, fontFamily: FONTS.body },
  subtitleEmail:{ color: DT.onBg, fontFamily: FONTS.bodyMed },
  card:         { backgroundColor: DT.glassBg, borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, borderColor: DT.glassBorder },
  field:        { marginBottom: 16 },
  label:        { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 8, fontFamily: FONTS.mono },
  codeInput:    { height: 62, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 28, color: DT.onBg, borderWidth: 1, borderColor: DT.glassBorder, textAlign: 'center', letterSpacing: 12, fontFamily: FONTS.heading },
  error:        { color: DT.error, fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.body },
  info:         { color: DT.primary, fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.body },
  btn:          { height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:       { fontSize: 14, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  linkBtn:      { marginTop: 20, alignItems: 'center' },
  linkTxt:      { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  linkAccent:   { color: DT.primary, fontFamily: FONTS.bodyBold },
  hint:         { fontSize: 11, color: DT.outline, marginTop: 14, textAlign: 'center', lineHeight: 16, fontFamily: FONTS.body },
});
