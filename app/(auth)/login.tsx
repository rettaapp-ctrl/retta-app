import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import Svg, { Path } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────
// Entrada única estilo Plei (pero con email en vez de teléfono):
// email + checkbox obligatorio de T&C/Aviso → código de 6 dígitos
// por correo → la cuenta se crea (o entra) al verificar en
// /(auth)/verificar. Sin contraseñas: registro y login son el
// mismo camino, así que tampoco se revela si el email ya existe.
// ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { requestOtp, sessionExpired, clearSessionExpired } = useAuth();
  const router = useRouter();
  const [email, setEmail]             = useState('');
  const [aceptaLegal, setAceptaLegal] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  async function handleContinuar() {
    const emailTrim = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setError('Ingresa un email válido (ej. tu@email.com)'); return;
    }
    if (!aceptaLegal) {
      setError('Debes aceptar los Términos y el Aviso de Privacidad para continuar');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await requestOtp(emailTrim);
      router.push({ pathname: '/(auth)/verificar', params: { email: emailTrim } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top','bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/images/retta-logo-mark.png')}
              style={styles.logo}
              resizeMode="contain"
              tintColor="#fff"
            />
            <Text style={styles.logoSub}>FÚTBOL EN TU CIUDAD</Text>
          </View>

          {sessionExpired ? (
            <View style={styles.banner}>
              <View style={styles.bannerIcon}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 8v4M12 16h.01" stroke={DT.primary} strokeWidth="2" strokeLinecap="round"/>
                  <Path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" stroke={DT.primary} strokeWidth="1.8"/>
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Tu sesión expiró</Text>
                <Text style={styles.bannerSub}>Ingresa tu email y te mandamos un código nuevo.</Text>
              </View>
              <TouchableOpacity onPress={clearSessionExpired} hitSlop={8}>
                <Text style={styles.bannerClose}>×</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entra y juega</Text>
            <Text style={styles.cardSub}>
              Escribe tu email y te mandamos un código de 6 dígitos. Sin contraseñas.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={DT.outline}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                onSubmitEditing={handleContinuar}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Checkbox obligatorio de aceptación legal — LFPDPPP / LFPC.
                El checkbox y el texto son elementos independientes para que
                los links internos (T&C, Privacidad) respondan a su propio
                onPress sin togglear la caja. */}
            <View style={styles.legalRow}>
              <TouchableOpacity
                onPress={() => setAceptaLegal(v => !v)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[styles.checkbox, aceptaLegal && styles.checkboxOn]}>
                  {aceptaLegal && (
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12L10 17L19 8" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                  )}
                </View>
              </TouchableOpacity>
              <Text style={[styles.legalTxt, { flex: 1 }]}>
                <Text onPress={() => setAceptaLegal(v => !v)}>He leído y acepto los </Text>
                <Text style={styles.legalLink} onPress={() => router.push('/terminos')}>Términos y Condiciones</Text>
                <Text onPress={() => setAceptaLegal(v => !v)}> y el </Text>
                <Text style={styles.legalLink} onPress={() => router.push('/privacidad')}>Aviso de Privacidad</Text>
                <Text onPress={() => setAceptaLegal(v => !v)}> de Retta.</Text>
              </Text>
            </View>

            <TouchableOpacity onPress={handleContinuar} disabled={loading || !aceptaLegal} activeOpacity={0.85}>
              <LinearGradient
                colors={aceptaLegal ? GRADIENTS.button : ['#3a3d4a', '#3a3d4a', '#3a3d4a'] as any}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.btn, !aceptaLegal && { opacity: 0.6 }]}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnTxt}>ENVIAR CÓDIGO</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.aviso}>
              Si es tu primera vez, tu cuenta se crea al verificar el código. Solo pueden usar Retta mayores de 16 años.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: DT.bg },
  // backgroundColor DT.bg explícito en scroll evita bounce en blanco.
  scroll:     { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 40, backgroundColor: 'transparent' },
  logoWrap:   { alignItems: 'center', marginBottom: 40 },
  logo:       { width: 120, height: 120 },
  logoSub:    { fontSize: 11, color: DT.onSurfaceVar, letterSpacing: 3, marginTop: 14, fontFamily: FONTS.mono },
  card:       { width: '100%', maxWidth: 400, backgroundColor: DT.glassBg, borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, borderColor: DT.glassBorder },
  cardTitle:  { fontSize: 24, color: DT.onBg, marginBottom: 8, fontFamily: FONTS.display, letterSpacing: -0.5 },
  cardSub:    { fontSize: 13, color: DT.onSurfaceVar, marginBottom: 22, lineHeight: 19, fontFamily: FONTS.body },
  field:      { marginBottom: 16 },
  label:      { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 8, fontFamily: FONTS.mono },
  input:      { height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 15, color: DT.onBg, borderWidth: 1, borderColor: DT.glassBorder, fontFamily: FONTS.body },
  error:      { color: DT.error, fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.body },
  btn:        { height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:     { fontSize: 14, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  aviso:      { fontSize: 11, color: DT.outline, lineHeight: 16, marginTop: 14, textAlign: 'center', fontFamily: FONTS.body },
  legalRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14, marginTop: 2, paddingVertical: 6 },
  checkbox:   { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: DT.outline, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxOn: { backgroundColor: DT.primaryContainer, borderColor: DT.primaryContainer },
  legalTxt:   { flex: 1, fontSize: 12, color: DT.onSurfaceVar, lineHeight: 17, fontFamily: FONTS.body },
  legalLink:  { color: DT.primary, fontFamily: FONTS.bodyMed, textDecorationLine: 'underline' },
  banner:      { width: '100%', maxWidth: 400, marginBottom: 14, padding: 14, borderRadius: RADIUS.md, backgroundColor: 'rgba(190,194,255,0.10)', borderWidth: 1, borderColor: 'rgba(190,194,255,0.30)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon:  { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(190,194,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bannerTitle: { fontSize: 13, color: DT.onBg, fontFamily: FONTS.bodyBold },
  bannerSub:   { fontSize: 12, color: DT.onSurfaceVar, fontFamily: FONTS.body, marginTop: 2 },
  bannerClose: { fontSize: 20, color: DT.onSurfaceVar, paddingHorizontal: 4, fontFamily: FONTS.bodyBold },
});
