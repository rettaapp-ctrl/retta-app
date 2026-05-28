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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';

const EDAD_MINIMA = 16;

// Default a 16 años atrás (la edad mínima exacta)
function getDefaultBirthdate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - EDAD_MINIMA);
  return d;
}

function calcularEdad(fecha: Date) {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const m = hoy.getMonth() - fecha.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;
  return edad;
}

function formatFecha(d: Date) {
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}

function toISODate(d: Date) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', ciudad: '' });
  const [fechaNac, setFechaNac]       = useState<Date>(getDefaultBirthdate());
  const [fechaTocada, setFechaTocada] = useState(false);
  const [showPicker, setShowPicker]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [aceptaLegal, setAceptaLegal] = useState(false);

  function update(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  function onChangeFecha(event: DateTimePickerEvent, selected?: Date) {
    setShowPicker(Platform.OS === 'ios');
    if (selected) {
      setFechaNac(selected);
      setFechaTocada(true);
    }
  }

  async function handleRegister() {
    if (!form.nombre || !form.email || !form.password) {
      setError('Nombre, email y contraseña son requeridos'); return;
    }
    // Validación de formato de email (mismo patrón que usa el HTML5 input type=email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError('Ingresa un email válido (ej. tu@email.com)'); return;
    }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (!fechaTocada) { setError('Selecciona tu fecha de nacimiento'); return; }
    const edad = calcularEdad(fechaNac);
    if (edad < EDAD_MINIMA) {
      setError(`Debes tener al menos ${EDAD_MINIMA} años para usar Retta`); return;
    }
    if (!aceptaLegal) {
      setError('Debes aceptar los Términos y el Aviso de Privacidad para continuar');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await register({
        ...form,
        email: form.email.trim().toLowerCase(),
        fecha_nacimiento: toISODate(fechaNac),
      });
      if ('requiere_verificacion' in result && result.requiere_verificacion) {
        router.replace({ pathname: '/(auth)/verificar', params: { email: result.email } });
      }
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

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Únete a Retta y encuentra partidos cerca de ti</Text>

        <View style={styles.card}>
          {[
            { key: 'nombre',   label: 'NOMBRE',     placeholder: 'Tu nombre',         kb: 'default' },
            { key: 'apellido', label: 'APELLIDO',    placeholder: 'Tu apellido',       kb: 'default' },
            { key: 'email',    label: 'EMAIL',       placeholder: 'tu@email.com',      kb: 'email-address' },
            { key: 'ciudad',   label: 'CIUDAD',      placeholder: 'Ciudad de México',  kb: 'default' },
          ].map(f => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={(form as any)[f.key]}
                onChangeText={v => update(f.key, v)}
                placeholder={f.placeholder}
                placeholderTextColor={DT.outline}
                autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                keyboardType={f.kb as any}
              />
            </View>
          ))}

          <View style={styles.field}>
            <Text style={styles.label}>FECHA DE NACIMIENTO</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.inputText, !fechaTocada && styles.inputPlaceholder]}>
                {fechaTocada ? formatFecha(fechaNac) : 'Selecciona tu fecha'}
              </Text>
            </TouchableOpacity>
            {showPicker && (
              <View>
                <DateTimePicker
                  value={fechaNac}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  minimumDate={new Date(1940, 0, 1)}
                  onChange={onChangeFecha}
                  themeVariant="dark"
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.pickerDoneBtn}
                    onPress={() => { setShowPicker(false); setFechaTocada(true); }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.pickerDoneTxt}>LISTO</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={v => update('password', v)}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={DT.outline}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Checkbox obligatorio de aceptación legal — LFPDPPP / LFPC.
              El usuario debe marcarlo activamente; el botón valida y bloquea
              si no está marcado. La versión se manda al backend al registrar. */}
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => setAceptaLegal(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, aceptaLegal && styles.checkboxOn]}>
              {aceptaLegal && (
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12L10 17L19 8" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              )}
            </View>
            <Text style={styles.legalTxt}>
              He leído y acepto los{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/terminos')}>Términos y Condiciones</Text>
              {' '}y el{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/privacidad')}>Aviso de Privacidad</Text>
              {' '}de Retta.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRegister} disabled={loading || !aceptaLegal} activeOpacity={0.85}>
            <LinearGradient
              colors={aceptaLegal ? GRADIENTS.button : ['#3a3d4a', '#3a3d4a', '#3a3d4a'] as any}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.btn, !aceptaLegal && { opacity: 0.6 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnTxt}>CREAR CUENTA</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.aviso}>
            Tus datos serán tratados para crear y administrar tu cuenta, gestionar tus partidos y mejorar el servicio, con apoyo de proveedores tecnológicos que pueden encontrarse fuera de México.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: DT.bg },
  scroll:           { flexGrow: 1, padding: 24, paddingTop: 60 },
  back:             { marginBottom: 24 },
  backTxt:          { color: DT.primary, fontSize: 14, fontFamily: FONTS.bodyMed },
  title:            { fontSize: 30, color: DT.onBg, marginBottom: 8, fontFamily: FONTS.display, letterSpacing: -0.8 },
  subtitle:         { fontSize: 14, color: DT.onSurfaceVar, marginBottom: 32, lineHeight: 20, fontFamily: FONTS.body },
  card:             { backgroundColor: DT.glassBg, borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, borderColor: DT.glassBorder },
  field:            { marginBottom: 16 },
  label:            { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 8, fontFamily: FONTS.mono },
  input:            { height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 15, color: DT.onBg, borderWidth: 1, borderColor: DT.glassBorder, justifyContent: 'center', fontFamily: FONTS.body },
  inputText:        { fontSize: 15, color: DT.onBg, fontFamily: FONTS.body },
  inputPlaceholder: { color: DT.outline },
  error:            { color: DT.error, fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.body },
  btn:              { height: 54, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:           { fontSize: 14, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  pickerDoneBtn:    { height: 44, backgroundColor: DT.primaryContainer, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pickerDoneTxt:    { fontSize: 13, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  aviso:            { fontSize: 11, color: DT.outline, lineHeight: 16, marginTop: 14, textAlign: 'center', fontFamily: FONTS.body },
  avisoLink:        { color: DT.primary, fontFamily: FONTS.bodyMed, textDecorationLine: 'underline' },
  legalRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16, marginTop: 4, paddingVertical: 6 },
  checkbox:         { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: DT.outline, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxOn:       { backgroundColor: DT.primaryContainer, borderColor: DT.primaryContainer },
  legalTxt:         { flex: 1, fontSize: 12, color: DT.onSurfaceVar, lineHeight: 17, fontFamily: FONTS.body },
  legalLink:        { color: DT.primary, fontFamily: FONTS.bodyMed, textDecorationLine: 'underline' },
});
