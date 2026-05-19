import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants';

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
              placeholderTextColor={COLORS.txt3}
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
              placeholderTextColor={COLORS.txt3}
              secureTextEntry
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnTxt}>GUARDAR CONTRASEÑA</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#000' },
  scroll:        { flexGrow: 1, padding: 24, paddingTop: 60 },
  back:          { marginBottom: 24 },
  backTxt:       { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  title:         { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: 1 },
  subtitle:      { fontSize: 14, color: COLORS.txt2, marginBottom: 32, lineHeight: 20 },
  subtitleEmail: { color: COLORS.txt, fontWeight: '700' },
  card:          { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border2 },
  field:         { marginBottom: 16 },
  label:         { fontSize: 10, fontWeight: '800', color: COLORS.txt3, letterSpacing: 2, marginBottom: 8 },
  input:         { height: 50, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: COLORS.txt, borderWidth: 1, borderColor: COLORS.border },
  codeInput:     { height: 60, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 16, fontSize: 28, color: COLORS.txt, borderWidth: 1, borderColor: COLORS.border, textAlign: 'center', letterSpacing: 12, fontWeight: '900' },
  error:         { color: '#FF6B6B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn:           { height: 52, backgroundColor: COLORS.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:        { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 2 },
});
