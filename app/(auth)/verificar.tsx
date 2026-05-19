import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants';

export default function VerificarScreen() {
  const { verifyEmail, resendCode } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email  = (params.email || '').toString();

  const [codigo, setCodigo]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');

  // Cooldown del botón de reenviar (segundos restantes)
  const [cooldown, setCooldown] = useState(0);
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
    if (!email) { setError('Falta el email. Vuelve a intentar el registro.'); return; }
    setError(''); setInfo(''); setLoading(true);
    try {
      await verifyEmail(email, codigo);
      // Una vez verificado, el AuthContext setea el token y la app salta a (tabs) automáticamente
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
      await resendCode(email);
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
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backTxt}>← Regresar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verifica tu email</Text>
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
              placeholderTextColor={COLORS.txt3}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              onSubmitEditing={handleVerify}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info  ? <Text style={styles.info}>{info}</Text>   : null}

          <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnTxt}>VERIFICAR</Text>
            }
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#000' },
  scroll:       { flexGrow: 1, padding: 24, paddingTop: 60 },
  back:         { marginBottom: 24 },
  backTxt:      { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  title:        { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: 1 },
  subtitle:     { fontSize: 14, color: COLORS.txt2, marginBottom: 32, lineHeight: 20 },
  subtitleEmail:{ color: COLORS.txt, fontWeight: '700' },
  card:         { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border2 },
  field:        { marginBottom: 16 },
  label:        { fontSize: 10, fontWeight: '800', color: COLORS.txt3, letterSpacing: 2, marginBottom: 8 },
  codeInput:    { height: 60, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 16, fontSize: 28, color: COLORS.txt, borderWidth: 1, borderColor: COLORS.border, textAlign: 'center', letterSpacing: 12, fontWeight: '900' },
  error:        { color: '#FF6B6B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  info:         { color: COLORS.accent, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn:          { height: 52, backgroundColor: COLORS.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:       { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 2 },
  linkBtn:      { marginTop: 20, alignItems: 'center' },
  linkTxt:      { fontSize: 13, color: COLORS.txt2 },
  linkAccent:   { color: COLORS.accent, fontWeight: '700' },
});
