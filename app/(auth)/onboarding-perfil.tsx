import React, { useState, useRef } from 'react';
import { AppAlert } from '@/lib/appAlert';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuth, OnboardingPerfilData } from '@/context/AuthContext';
import { DT, FONTS, RADIUS } from '@/constants/designTokens';
import { supabase } from '@/lib/supabase';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Posicion = 'POR' | 'DEF' | 'MED' | 'DEL';
type Nivel    = 'Principiante' | 'Intermedio' | 'Avanzado';
type Genero   = 'M' | 'F' | 'O';

// ─── Edad mínima (misma regla que el backend valida server-side) ───
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

const POSICIONES: { value: Posicion; label: string; sub: string }[] = [
  { value: 'POR', label: 'Portero',      sub: 'Bajo los 3 palos' },
  { value: 'DEF', label: 'Defensa',      sub: 'Línea de atrás' },
  { value: 'MED', label: 'Mediocampista', sub: 'Crear y recuperar' },
  { value: 'DEL', label: 'Delantero',     sub: 'Definir al arco' },
];

const NIVELES: { value: Nivel; label: string; sub: string }[] = [
  { value: 'Principiante', label: 'Principiante', sub: 'Empezando o juego ocasional' },
  { value: 'Intermedio',   label: 'Intermedio',   sub: 'Juego regular y técnica básica' },
  { value: 'Avanzado',     label: 'Avanzado',     sub: 'Buen nivel técnico y físico' },
];

const GENEROS: { value: Genero; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Prefiero no decir' },
];

// Nota: las cards de posición/nivel/género son SOLO texto por decisión
// de Rafael (2026-07-20) — los íconos SVG anteriores se veían mal.

export default function OnboardingPerfilScreen() {
  const { user, completarOnboarding, logout } = useAuth();
  const router = useRouter();

  const [step, setStep]         = useState<1 | 2 | 3 | 4 | 5>(1);
  // Paso 1 — datos personales (con OTP la cuenta nace solo con email)
  const [nombre, setNombre]     = useState(user?.nombre || '');
  const [apellido, setApellido] = useState(user?.apellido || '');
  const [fechaNac, setFechaNac]       = useState<Date>(getDefaultBirthdate());
  const [fechaTocada, setFechaTocada] = useState(false);
  const [showPicker, setShowPicker]   = useState(false);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [nivel, setNivel]       = useState<Nivel | null>(null);
  const [genero, setGenero]     = useState<Genero | null>(null);
  const [telefono, setTelefono] = useState('');
  const [avatarUrl, setAvatarUrl]   = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;

  function onChangeFecha(event: DateTimePickerEvent, selected?: Date) {
    setShowPicker(Platform.OS === 'ios');
    if (selected) {
      setFechaNac(selected);
      setFechaTocada(true);
    }
  }

  function animarA(nuevoStep: 1 | 2 | 3 | 4 | 5) {
    const delta = nuevoStep > step ? -1 : 1;
    Animated.timing(slideAnim, {
      toValue: delta * 300,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setStep(nuevoStep);
      slideAnim.setValue(-delta * 300);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }

  function datosCompletos() {
    return nombre.trim().length >= 2 && fechaTocada;
  }

  function handleSiguiente() {
    setError('');
    if (step === 1) {
      if (nombre.trim().length < 2) { setError('Escribe tu nombre'); return; }
      if (!fechaTocada) { setError('Selecciona tu fecha de nacimiento'); return; }
      if (calcularEdad(fechaNac) < EDAD_MINIMA) {
        setError(`Debes tener al menos ${EDAD_MINIMA} años para usar Retta`); return;
      }
      animarA(2);
    } else if (step === 2) {
      if (!posicion) { setError('Selecciona una posición'); return; }
      animarA(3);
    } else if (step === 3) {
      if (!nivel) { setError('Selecciona tu nivel'); return; }
      animarA(4);
    } else if (step === 4) {
      if (!genero) { setError('Selecciona una opción'); return; }
      animarA(5);
    }
  }

  function handleAtras() {
    setError('');
    if (step === 1) return;
    animarA((step - 1) as 1 | 2 | 3 | 4);
  }

  async function pickImage() {
    setError('');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      AppAlert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir tu foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      if (!asset.base64) throw new Error('No base64');

      const fileName = `${user?.id}/avatar.jpg`;
      const contentType = 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(asset.base64), { upsert: true, contentType });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl + '?t=' + Date.now());
    } catch (e: any) {
      AppAlert.alert('Error', 'No se pudo subir la foto: ' + (e.message || ''));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleListo() {
    if (!datosCompletos() || !posicion || !nivel || !genero) {
      setError('Completa todos los pasos'); return;
    }
    if (!avatarUrl) {
      setError('Sube tu foto de perfil para continuar'); return;
    }
    setError(''); setLoading(true);
    try {
      const data: OnboardingPerfilData = {
        nombre:           nombre.trim(),
        apellido:         apellido.trim() || undefined,
        fecha_nacimiento: toISODate(fechaNac),
        posicion, nivel, genero,
        avatar_url: avatarUrl,
      };
      const tel = telefono.replace(/\D/g, '');
      if (tel) data.telefono = tel;
      await completarOnboarding(data);
      router.replace('/(tabs)/partidos');
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el perfil');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top','bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleAtras} style={styles.backBtn}>
              <Text style={styles.backTxt}>← Atrás</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={async () => { await logout(); router.replace('/(auth)/login'); }} style={styles.backBtn}>
              <Text style={styles.backTxt}>Salir</Text>
            </TouchableOpacity>
          )}
          <View style={styles.steps}>
            {[1,2,3,4,5].map(n => (
              <View
                key={n}
                style={[
                  styles.stepDot,
                  n === step && styles.stepDotActive,
                  n < step  && styles.stepDotDone,
                ]}
              />
            ))}
          </View>
        </View>

        <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Paso 1 — datos personales (nombre + fecha de nacimiento ≥16) */}
            {step === 1 && (
              <>
                <Text style={styles.eyebrow}>EMPECEMOS</Text>
                <Text style={styles.title}>Cuéntanos de ti</Text>
                <Text style={styles.subtitle}>Así te reconocen tus compañeros en la cancha.</Text>

                <View style={styles.datosField}>
                  <Text style={styles.datosLabel}>NOMBRE</Text>
                  <TextInput
                    style={styles.datosInput}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Tu nombre"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="words"
                    maxLength={60}
                  />
                </View>

                <View style={styles.datosField}>
                  <Text style={styles.datosLabel}>APELLIDO (OPCIONAL)</Text>
                  <TextInput
                    style={styles.datosInput}
                    value={apellido}
                    onChangeText={setApellido}
                    placeholder="Tu apellido"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="words"
                    maxLength={60}
                  />
                </View>

                <View style={styles.datosField}>
                  <Text style={styles.datosLabel}>FECHA DE NACIMIENTO</Text>
                  <Text style={styles.datosSub}>Debes tener al menos {EDAD_MINIMA} años para usar Retta.</Text>
                  <TouchableOpacity
                    style={styles.datosInput}
                    onPress={() => setShowPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.datosInputTxt, !fechaTocada && styles.datosPlaceholder]}>
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
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.eyebrow}>HOLA, {(nombre || user?.nombre || '').trim().toUpperCase()}</Text>
                <Text style={styles.title}>¿En qué posición juegas?</Text>
                <Text style={styles.subtitle}>Esto nos ayuda a armar equipos balanceados.</Text>
                <View style={styles.cards}>
                  {POSICIONES.map(p => {
                    const active = posicion === p.value;
                    return (
                      <TouchableOpacity
                        key={p.value}
                        style={[styles.card, active && styles.cardActive]}
                        onPress={() => setPosicion(p.value)}
                        activeOpacity={0.85}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{p.label}</Text>
                          <Text style={styles.cardSub}>{p.sub}</Text>
                        </View>
                        <View style={[styles.checkRing, active && styles.checkRingActive]}>
                          {active && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.eyebrow}>PASO 3 DE 5</Text>
                <Text style={styles.title}>¿Cuál es tu nivel de juego?</Text>
                <Text style={styles.subtitle}>Sé honesto — esto cuida la experiencia de todos.</Text>
                <View style={styles.cards}>
                  {NIVELES.map(n => {
                    const active = nivel === n.value;
                    return (
                      <TouchableOpacity
                        key={n.value}
                        style={[styles.card, active && styles.cardActive]}
                        onPress={() => setNivel(n.value)}
                        activeOpacity={0.85}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{n.label}</Text>
                          <Text style={styles.cardSub}>{n.sub}</Text>
                        </View>
                        <View style={[styles.checkRing, active && styles.checkRingActive]}>
                          {active && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {step === 4 && (
              <>
                <Text style={styles.eyebrow}>PASO 4 DE 5</Text>
                <Text style={styles.title}>Tu género</Text>
                <Text style={styles.subtitle}>Para futuros partidos por categoría.</Text>
                <View style={styles.cards}>
                  {GENEROS.map(g => {
                    const active = genero === g.value;
                    return (
                      <TouchableOpacity
                        key={g.value}
                        style={[styles.card, active && styles.cardActive]}
                        onPress={() => setGenero(g.value)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.cardLabel, active && styles.cardLabelActive, { flex: 1 }]}>
                          {g.label}
                        </Text>
                        <View style={[styles.checkRing, active && styles.checkRingActive]}>
                          {active && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.telefonoBlock}>
                  <Text style={styles.telLabel}>TELÉFONO (OPCIONAL)</Text>
                  <Text style={styles.telSub}>Solo lo usamos para contactarte si hay un cambio de último minuto.</Text>
                  <TextInput
                    style={styles.telInput}
                    value={telefono}
                    onChangeText={t => setTelefono(t.replace(/[^\d\s+()-]/g, '').slice(0, 20))}
                    placeholder="33 1234 5678"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="phone-pad"
                    maxLength={20}
                  />
                </View>
              </>
            )}

            {step === 5 && (
              <>
                <Text style={styles.eyebrow}>ÚLTIMO PASO</Text>
                <Text style={styles.title}>Tu foto de perfil</Text>
                <Text style={styles.subtitle}>Para que los demás jugadores te reconozcan en la cancha.</Text>

                <View style={styles.fotoBlock}>
                  <TouchableOpacity
                    style={[styles.fotoRing, avatarUrl && styles.fotoRingActive]}
                    onPress={pickImage}
                    activeOpacity={0.85}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <View style={styles.fotoInner}>
                        <ActivityIndicator color={DT.primary} size="large"/>
                      </View>
                    ) : avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.fotoInner} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                    ) : (
                      <View style={styles.fotoInner}>
                        <Svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                          <Circle cx="24" cy="18" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none"/>
                          <Path d="M6 42C6 33.2 14.1 26 24 26C33.9 26 42 33.2 42 42" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none"/>
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fotoBtn, avatarUrl && styles.fotoBtnSecundario]}
                    onPress={pickImage}
                    disabled={uploadingPhoto}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.fotoBtnTxt, avatarUrl && styles.fotoBtnTxtSecundario]}>
                      {uploadingPhoto
                        ? 'SUBIENDO...'
                        : avatarUrl ? 'CAMBIAR FOTO' : 'SELECCIONAR FOTO'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.fotoHint}>
                    Subir tu foto es obligatorio para terminar tu perfil.
                  </Text>
                </View>
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
        </Animated.View>

        {/* Footer button */}
        <View style={styles.footer}>
          {step < 5 ? (
            <TouchableOpacity
              style={[
                styles.btn,
                ((step === 1 && !datosCompletos()) || (step === 2 && !posicion) || (step === 3 && !nivel) || (step === 4 && !genero)) && styles.btnDisabled,
              ]}
              onPress={handleSiguiente}
              disabled={(step === 1 && !datosCompletos()) || (step === 2 && !posicion) || (step === 3 && !nivel) || (step === 4 && !genero)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTxt}>SIGUIENTE</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.btn, !avatarUrl && styles.btnDisabled]}
                onPress={handleListo}
                disabled={!avatarUrl || loading || uploadingPhoto}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnTxt}>LISTO</Text>
                }
              </TouchableOpacity>
              {/* Aviso simplificado — datos de perfil deportivo se rigen por el aviso integral */}
              <Text style={styles.avisoMini}>
                Al continuar confirmas el{' '}
                <Text style={styles.avisoLinkMini} onPress={() => router.push('/privacidad')}>Aviso de Privacidad</Text>
                {' '}de RETTA.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: DT.bg },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, justifyContent: 'space-between' },
  backBtn:        { paddingVertical: 6, paddingHorizontal: 4 },
  backTxt:        { color: DT.primary, fontSize: 14, fontFamily: FONTS.bodyMed },
  steps:          { flexDirection: 'row', gap: 6 },
  stepDot:        { width: 24, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
  stepDotActive:  { backgroundColor: DT.primary, width: 32 },
  stepDotDone:    { backgroundColor: 'rgba(190,194,255,0.5)' },

  scroll:         { padding: 24, paddingBottom: 40 },
  eyebrow:        { fontSize: 11, color: DT.primary, letterSpacing: 2, marginBottom: 14, fontFamily: FONTS.mono },
  title:          { fontSize: 28, color: DT.onBg, letterSpacing: -0.5, marginBottom: 8, lineHeight: 32, fontFamily: FONTS.display },
  subtitle:       { fontSize: 14, color: DT.onSurfaceVar, marginBottom: 24, lineHeight: 20, fontFamily: FONTS.body },

  cards:          { gap: 12 },
  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, paddingVertical: 18, paddingHorizontal: 18, minHeight: 64 },
  cardActive:     { borderColor: DT.primary, backgroundColor: 'rgba(190,194,255,0.10)' },
  cardLabel:      { fontSize: 16, color: DT.onBg, letterSpacing: 0.2, fontFamily: FONTS.bodyBold },
  cardLabelActive:{ color: DT.primary },
  cardSub:        { fontSize: 12, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },

  checkRing:      { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  checkRingActive:{ borderColor: DT.primary, backgroundColor: DT.primary },
  checkMark:      { fontSize: 13, color: DT.bg, fontFamily: FONTS.bodyBold, lineHeight: 14 },

  datosField:     { marginBottom: 18 },
  datosLabel:     { fontSize: 11, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 8, fontFamily: FONTS.mono },
  datosSub:       { fontSize: 12, color: DT.outline, marginBottom: 10, lineHeight: 17, fontFamily: FONTS.body },
  datosInput:     { height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 15, color: DT.onBg, fontFamily: FONTS.body, justifyContent: 'center' },
  datosInputTxt:  { fontSize: 15, color: DT.onBg, fontFamily: FONTS.body },
  datosPlaceholder:{ color: 'rgba(255,255,255,0.3)' },
  pickerDoneBtn:  { height: 44, backgroundColor: DT.primaryContainer, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pickerDoneTxt:  { fontSize: 13, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },

  telefonoBlock:  { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: DT.glassBorder },
  telLabel:       { fontSize: 11, color: DT.onSurfaceVar, letterSpacing: 1.5, marginBottom: 4, fontFamily: FONTS.mono },
  telSub:         { fontSize: 12, color: DT.outline, marginBottom: 12, lineHeight: 17, fontFamily: FONTS.body },
  telInput:       { height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.md, paddingHorizontal: 16, fontSize: 15, color: DT.onBg, fontFamily: FONTS.body },

  fotoBlock:      { alignItems: 'center', paddingTop: 12 },
  fotoRing:       { width: 168, height: 168, borderRadius: 84, padding: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  fotoRingActive: { borderColor: DT.primary, borderStyle: 'solid' },
  fotoInner:      { width: '100%', height: '100%', borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fotoBtn:        { paddingHorizontal: 22, paddingVertical: 13, backgroundColor: DT.primaryContainer, borderRadius: RADIUS.full },
  fotoBtnSecundario:{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorder },
  fotoBtnTxt:     { fontSize: 12, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  fotoBtnTxtSecundario:{ color: DT.onBg },
  fotoHint:       { fontSize: 12, color: DT.outline, marginTop: 18, textAlign: 'center', lineHeight: 17, fontFamily: FONTS.body },

  error:          { color: DT.error, fontSize: 13, marginTop: 14, textAlign: 'center', fontFamily: FONTS.body },

  footer:         { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: DT.glassBorder },
  btn:            { height: 54, backgroundColor: DT.primaryContainer, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  avisoMini:      { fontSize: 11, color: DT.outline, lineHeight: 16, marginTop: 12, textAlign: 'center', paddingHorizontal: 12, fontFamily: FONTS.body },
  avisoLinkMini:  { color: DT.primary, fontFamily: FONTS.bodyMed, textDecorationLine: 'underline' },
  btnDisabled:    { backgroundColor: 'rgba(80,92,230,0.3)' },
  btnTxt:         { fontSize: 14, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
});
