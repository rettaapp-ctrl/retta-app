import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants';

export default function LoginScreen() {
  const { login } = useAuth();
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
      // Si fue {ok: true}, el cambio de auth state navega automáticamente al home
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/retta-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoSub}>FÚTBOL EN TU CIUDAD</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.txt3}
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
              placeholderTextColor={COLORS.txt3}
              secureTextEntry
              onSubmitEditing={handleLogin}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnTxt}>INICIAR SESIÓN</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotTxt}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkTxt}>¿No tienes cuenta? <Text style={styles.linkAccent}>Regístrate</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#000' },
  scroll:     { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoWrap:   { alignItems: 'center', marginBottom: 40 },
  logo:       { width: 160, height: 160 },
  logoSub:    { fontSize: 11, fontWeight: '700', color: COLORS.txt3, letterSpacing: 3, marginTop: 12 },
  card:       { width: '100%', maxWidth: 400, backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border2 },
  cardTitle:  { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 24, letterSpacing: 1 },
  field:      { marginBottom: 16 },
  label:      { fontSize: 10, fontWeight: '800', color: COLORS.txt3, letterSpacing: 2, marginBottom: 8 },
  input:      { height: 50, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: COLORS.txt, borderWidth: 1, borderColor: COLORS.border },
  error:      { color: '#FF6B6B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn:        { height: 52, backgroundColor: COLORS.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:     { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 2 },
  forgotBtn:  { marginTop: 14, alignItems: 'center' },
  forgotTxt:  { fontSize: 13, color: COLORS.txt2, fontWeight: '600' },
  linkBtn:    { marginTop: 20, alignItems: 'center' },
  linkTxt:    { fontSize: 13, color: COLORS.txt2 },
  linkAccent: { color: COLORS.accent, fontWeight: '700' },
});
