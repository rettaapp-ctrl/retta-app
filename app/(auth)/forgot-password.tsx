import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit() {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned) { setError('Ingresa tu email'); return; }
    setError(''); setLoading(true);
    try {
      await forgotPassword(cleaned);
      // El backend siempre responde 200 (anti-enumeration), navegar a reset
      router.replace({ pathname: '/(auth)/reset-password', params: { email: cleaned } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backTxt}>← Regresar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Restablece tu contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa tu email y te enviaremos un código para crear una nueva contraseña.
        </Text>

        <View style={styles.card}>
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
              autoFocus
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnTxt}>ENVIAR CÓDIGO</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: DT.bg },
  scroll:   { flexGrow: 1, padding: 24, paddingTop: 60 },
  back:     { marginBottom: 24 },
  backTxt:  { color: DT.primary, fontSize: 14, fontFamily: FONTS.bodyMed },
  title:    { fontSize: 30, color: DT.onBg, marginBottom: 8, fontFamily: FONTS.display, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: DT.onSurfaceVar, marginBottom: 32, lineHeight: 20, fontFamily: FONTS.body },
  card:     { backgroundColor: DT.glassBg, borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, borderColor: DT.glassBorder },
  field:    { marginBottom: 16 },
  label:    { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 8, fontFamily: FONTS.mono },
  input:    { height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 15, color: DT.onBg, borderWidth: 1, borderColor: DT.glassBorder, fontFamily: FONTS.body },
  error:    { color: DT.error, fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.body },
  btn:      { height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:   { fontSize: 14, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
});
