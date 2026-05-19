import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants';

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
              placeholderTextColor={COLORS.txt3}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnTxt}>ENVIAR CÓDIGO</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#000' },
  scroll:   { flexGrow: 1, padding: 24, paddingTop: 60 },
  back:     { marginBottom: 24 },
  backTxt:  { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  title:    { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: COLORS.txt2, marginBottom: 32, lineHeight: 20 },
  card:     { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border2 },
  field:    { marginBottom: 16 },
  label:    { fontSize: 10, fontWeight: '800', color: COLORS.txt3, letterSpacing: 2, marginBottom: 8 },
  input:    { height: 50, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: COLORS.txt, borderWidth: 1, borderColor: COLORS.border },
  error:    { color: '#FF6B6B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn:      { height: 52, backgroundColor: COLORS.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:   { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 2 },
});
