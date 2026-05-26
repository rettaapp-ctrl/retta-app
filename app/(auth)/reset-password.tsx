import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email  = (params.email || '').toString();

  const [codigo, setCodigo]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit() {
    if (codigo.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (!email) { setError('Falta el email. Vuelve a intentar desde "Olvidé mi contraseña".'); return; }
    setError(''); setLoading(true);
    try {
      await resetPassword(email, codigo, password);
      Alert.alert(
        'Listo',
        'Tu contraseña fue restablecida. Inicia sesión con tu nueva contraseña.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
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

        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa el código que te enviamos a{'\n'}
          <Text style={styles.subtitleEmail}>{email || 'tu email'}</Text>
          {'\n'}y crea tu nueva contraseña.
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
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={DT.outline}
              secureTextEntry
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnTxt}>GUARDAR CONTRASEÑA</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: DT.bg },
  scroll:        { flexGrow: 1, padding: 24, paddingTop: 60 },
  back:          { marginBottom: 24 },
  backTxt:       { color: DT.primary, fontSize: 14, fontFamily: FONTS.bodyMed },
  title:         { fontSize: 30, color: DT.onBg, marginBottom: 8, fontFamily: FONTS.display, letterSpacing: -0.8 },
  subtitle:      { fontSize: 14, color: DT.onSurfaceVar, marginBottom: 32, lineHeight: 20, fontFamily: FONTS.body },
  subtitleEmail: { color: DT.onBg, fontFamily: FONTS.bodyMed },
  card:          { backgroundColor: DT.glassBg, borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, borderColor: DT.glassBorder },
  field:         { marginBottom: 16 },
  label:         { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 8, fontFamily: FONTS.mono },
  input:         { height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 15, color: DT.onBg, borderWidth: 1, borderColor: DT.glassBorder, fontFamily: FONTS.body },
  codeInput:     { height: 62, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 28, color: DT.onBg, borderWidth: 1, borderColor: DT.glassBorder, textAlign: 'center', letterSpacing: 12, fontFamily: FONTS.heading },
  error:         { color: DT.error, fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.body },
  btn:           { height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:        { fontSize: 14, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
});
