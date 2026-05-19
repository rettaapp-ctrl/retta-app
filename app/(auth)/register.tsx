import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
                placeholderTextColor={COLORS.txt3}
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
              placeholderTextColor={COLORS.txt3}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnTxt}>CREAR CUENTA</Text>
            }
          </TouchableOpacity>

          {/* Aviso simplificado — obligatorio al momento de recolectar datos (LFPDPPP) */}
          <Text style={styles.aviso}>
            Al crear tu cuenta aceptas los{' '}
            <Text style={styles.avisoLink} onPress={() => router.push('/terminos')}>Términos y Condiciones</Text>
            {' '}y el{' '}
            <Text style={styles.avisoLink} onPress={() => router.push('/privacidad')}>Aviso de Privacidad</Text>
            {' '}de RETTA. Tus datos serán tratados para crear y administrar tu cuenta, gestionar tus partidos y mejorar el servicio, con apoyo de proveedores tecnológicos que pueden encontrarse fuera de México.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#000' },
  scroll:           { flexGrow: 1, padding: 24, paddingTop: 60 },
  back:             { marginBottom: 24 },
  backTxt:          { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  title:            { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: 1 },
  subtitle:         { fontSize: 14, color: COLORS.txt2, marginBottom: 32, lineHeight: 20 },
  card:             { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border2 },
  field:            { marginBottom: 16 },
  label:            { fontSize: 10, fontWeight: '800', color: COLORS.txt3, letterSpacing: 2, marginBottom: 8 },
  input:            { height: 50, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: COLORS.txt, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center' },
  inputText:        { fontSize: 15, color: COLORS.txt },
  inputPlaceholder: { color: COLORS.txt3 },
  error:            { color: '#FF6B6B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn:              { height: 52, backgroundColor: COLORS.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt:           { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 2 },
  pickerDoneBtn:    { height: 44, backgroundColor: COLORS.accent, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pickerDoneTxt:    { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 1.5 },
  aviso:            { fontSize: 11, color: COLORS.txt3, lineHeight: 16, marginTop: 16, textAlign: 'center' },
  avisoLink:        { color: COLORS.accent, fontWeight: '700', textDecorationLine: 'underline' },
});
