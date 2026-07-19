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

export default function LoginScreen() {
  const { login, sessionExpired, clearSessionExpired } = useAuth();
  const router    = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Ingresa email y contraseña'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if ('requiere_verificacion' in result && result.requiere_verificacion) {
        router.replace({ pathname: '/(auth)/verificar', params: { email: result.email } });
      }
      // El flag sessionExpired se limpia automáticamente en persistSession.
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
                <Text style={styles.bannerSub}>Por favor inicia sesión de nuevo para continuar.</Text>
              </View>
              <TouchableOpacity onPress={clearSessionExpired} hitSlop={8}>
                <Text style={styles.bannerClose}>×</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar sesión</Text>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={DT.outline}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={DT.outline}
                secureTextEntry
                onSubmitEditing={handleLogin}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnTxt}>INICIAR SESIÓN</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotTxt}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.linkTxt}>¿No tienes cuenta? <Text style={styles.linkAccent}>Regístrate</Text></Text>
            </TouchableOpacity>
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
  // paddingBottom 40 asegura que la última pantalla (link Regístrate) no
  // choque con el home indicator del sistema.
  scroll:     { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 40, backgroundColor: 'transparent' },
  logoWrap:   { alignItems: 'center', marginBottom: 40 },
  logo:       { width: 120, height: 120 },
  logoSub:    { fontSize: 11, color: DT.onSurfaceVar, letterSpacing: 3, marginTop: 14, fontFamily: FONTS.mono },
  card:       { width: '100%', maxWidth: 400, backgroundColor: DT.glassBg, borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, borderColor: DT.glassBorder },
  cardTitle:  { fontSize: 24, color: DT.onBg, marginBottom: 24, fontFamily: FONTS.display, letterSpacing: -0.5 },
  field:      { marginBottom: 16 },
  label:      { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 8, fontFamily: FONTS.mono },
  input:      { height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 15, color: DT.onBg, borderWidth: 1, borderColor: DT.glassBorder, fontFamily: FONTS.body },
  error:      { color: DT.error, fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.body },
  btn:        { height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:     { fontSize: 14, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  forgotBtn:  { marginTop: 16, alignItems: 'center' },
  forgotTxt:  { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  linkBtn:    { marginTop: 20, alignItems: 'center' },
  linkTxt:    { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  linkAccent: { color: DT.primary, fontFamily: FONTS.bodyBold },
  banner:        { width: '100%', maxWidth: 400, marginBottom: 14, padding: 14, borderRadius: RADIUS.md, backgroundColor: 'rgba(190,194,255,0.10)', borderWidth: 1, borderColor: 'rgba(190,194,255,0.30)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(190,194,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bannerTitle:   { fontSize: 13, color: DT.onBg, fontFamily: FONTS.bodyBold },
  bannerSub:     { fontSize: 12, color: DT.onSurfaceVar, fontFamily: FONTS.body, marginTop: 2 },
  bannerClose:   { fontSize: 20, color: DT.onSurfaceVar, paddingHorizontal: 4, fontFamily: FONTS.bodyBold },
});
