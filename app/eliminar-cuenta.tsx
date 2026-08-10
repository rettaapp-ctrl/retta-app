// ═══════════════════════════════════════════════════════════════
// RETTA — app/eliminar-cuenta.tsx
// Borrado de cuenta (Google Play + Apple 5.1.1(v), 2026-08-10).
// Dos pasos: explicación honesta de qué se borra y qué queda, y
// confirmación con código de 6 dígitos al correo (ambas tiendas
// permiten verificar identidad; lo prohibido es exigir soporte).
// El borrado es inmediato e irreversible (decisión de Rafael).
// ═══════════════════════════════════════════════════════════════
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AppAlert } from '@/lib/appAlert';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function EliminarCuentaScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { request } = useApi();
  const [paso, setPaso]       = useState<'aviso' | 'codigo'>('aviso');
  const [codigo, setCodigo]   = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]     = useState('');

  async function pedirCodigo() {
    setError(''); setCargando(true);
    try {
      await request('/usuarios/me/eliminar-cuenta/start', { method: 'POST' });
      setPaso('codigo');
    } catch (e: any) { setError(e.message || 'No se pudo enviar el código'); }
    setCargando(false);
  }

  async function confirmar() {
    if (codigo.trim().length !== 6) { setError('El código tiene 6 dígitos'); return; }
    setError(''); setCargando(true);
    try {
      await request('/usuarios/me/eliminar-cuenta/confirmar', {
        method: 'POST',
        body: JSON.stringify({ codigo: codigo.trim() }),
      });
      // Cuenta borrada: cerrar sesión local y despedirse.
      AppAlert.alert('Cuenta eliminada', 'Tu cuenta y tus datos personales fueron eliminados. Gracias por haber jugado con nosotros.', [
        { text: 'OK', onPress: logout },
      ]);
    } catch (e: any) {
      setError(e.message || 'No se pudo eliminar la cuenta');
      setCargando(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><BackIcon /></TouchableOpacity>
          <Text style={styles.title}>Eliminar cuenta</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {paso === 'aviso' ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Esto es permanente</Text>
                <Text style={styles.p}>Al eliminar tu cuenta se borra de inmediato y sin vuelta atrás:</Text>
                <Text style={styles.li}>•  Tu nombre, correo, teléfono y foto</Text>
                <Text style={styles.li}>•  Tus amigos, mensajes y notificaciones</Text>
                <Text style={styles.li}>•  Tus calificaciones, tu nivel y su historial</Text>
                <Text style={styles.li}>•  Tus lugares en partidos que aún no se juegan</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Lo que no se puede borrar</Text>
                <Text style={styles.p}>En los partidos que ya jugaste quedará "Jugador eliminado", sin ningún dato tuyo — así los resultados de los demás no cambian. Los registros de pago se conservan sin vínculo contigo porque la ley fiscal lo exige.</Text>
              </View>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity onPress={pedirCodigo} disabled={cargando} activeOpacity={0.85} style={styles.btnPeligro}>
                {cargando
                  ? <ActivityIndicator color={DT.error} />
                  : <Text style={styles.btnPeligroTxt}>ENVIARME EL CÓDIGO PARA ELIMINAR</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={styles.btnSuave}>
                <Text style={styles.btnSuaveTxt}>Mejor no, regresar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Revisa tu correo</Text>
                <Text style={styles.p}>Enviamos un código de 6 dígitos a {user?.email || 'tu correo'}. Escribirlo aquí elimina tu cuenta al instante.</Text>
                <TextInput
                  style={styles.input}
                  value={codigo}
                  onChangeText={t => { setCodigo(t.replace(/[^0-9]/g, '')); setError(''); }}
                  placeholder="000000"
                  placeholderTextColor={DT.outline}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity onPress={confirmar} disabled={cargando} activeOpacity={0.85} style={styles.btnPeligro}>
                {cargando
                  ? <ActivityIndicator color={DT.error} />
                  : <Text style={styles.btnPeligroTxt}>ELIMINAR MI CUENTA DEFINITIVAMENTE</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={styles.btnSuave}>
                <Text style={styles.btnSuaveTxt}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DT.bg },
  topbar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  title:        { fontSize: 17, color: DT.onBg, fontFamily: FONTS.heading },
  scroll:       { padding: 20, paddingBottom: 40 },
  card:         { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTitle:    { fontSize: 15, color: DT.onBg, fontFamily: FONTS.heading, marginBottom: 8 },
  p:            { fontSize: 13.5, lineHeight: 20, color: DT.onSurfaceVar, fontFamily: FONTS.body, marginBottom: 6 },
  li:           { fontSize: 13.5, lineHeight: 22, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  input:        { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorderStrong, borderRadius: 14, paddingVertical: 14, textAlign: 'center', fontSize: 24, letterSpacing: 10, color: DT.onBg, fontFamily: FONTS.bodyBold },
  error:        { color: DT.error, fontSize: 12.5, fontFamily: FONTS.bodyMed, textAlign: 'center', marginBottom: 10 },
  btnPeligro:   { height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,138,115,0.10)', borderWidth: 1, borderColor: 'rgba(255,138,115,0.45)', marginBottom: 10 },
  btnPeligroTxt:{ fontSize: 13, color: DT.error, fontFamily: FONTS.bodyBold, letterSpacing: 0.8 },
  btnSuave:     { height: 48, alignItems: 'center', justifyContent: 'center' },
  btnSuaveTxt:  { fontSize: 13.5, color: DT.onSurfaceVar, fontFamily: FONTS.bodyMed },
});
