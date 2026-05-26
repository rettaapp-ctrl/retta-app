import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuth, OnboardingPerfilData } from '@/context/AuthContext';
import { DT, FONTS, RADIUS } from '@/constants/designTokens';
import { supabase } from '@/lib/supabase';

type Posicion = 'POR' | 'DEF' | 'MED' | 'DEL';
type Nivel    = 'Principiante' | 'Intermedio' | 'Avanzado';
type Genero   = 'M' | 'F' | 'O';

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

function PosIcon({ tipo, active }: { tipo: Posicion; active: boolean }) {
  const stroke = active ? DT.primary : 'rgba(255,255,255,0.4)';
  const fill   = active ? DT.primary : 'transparent';
  if (tipo === 'POR') {
    return (
      <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <Path d="M6 10 H34 V30 H6 Z" stroke={stroke} strokeWidth="2.2" fill="none" />
        <Path d="M6 14 H34 M6 26 H34 M14 10 V30 M26 10 V30" stroke={stroke} strokeWidth="1.2" />
        <Circle cx="20" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
      </Svg>
    );
  }
  if (tipo === 'DEF') {
    return (
      <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <Rect x="7" y="8" width="6" height="24" rx="1" stroke={stroke} strokeWidth="2.2" fill={active ? 'rgba(190,194,255,0.18)' : 'transparent'}/>
        <Rect x="17" y="8" width="6" height="24" rx="1" stroke={stroke} strokeWidth="2.2" fill={active ? 'rgba(190,194,255,0.18)' : 'transparent'}/>
        <Rect x="27" y="8" width="6" height="24" rx="1" stroke={stroke} strokeWidth="2.2" fill={active ? 'rgba(190,194,255,0.18)' : 'transparent'}/>
      </Svg>
    );
  }
  if (tipo === 'MED') {
    return (
      <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <Circle cx="20" cy="20" r="14" stroke={stroke} strokeWidth="2.2" fill="none"/>
        <Path d="M6 20 H34" stroke={stroke} strokeWidth="2"/>
        <Circle cx="20" cy="20" r="3" fill={fill}/>
      </Svg>
    );
  }
  // DEL
  return (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Path d="M20 6 L20 30 M20 30 L12 22 M20 30 L28 22" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="20" cy="34" r="2" fill={fill} stroke={stroke} strokeWidth="1.5"/>
    </Svg>
  );
}

function GenIcon({ tipo, active }: { tipo: Genero; active: boolean }) {
  const stroke = active ? DT.primary : 'rgba(255,255,255,0.4)';
  if (tipo === 'M') {
    return (
      <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <Circle cx="14" cy="22" r="7" stroke={stroke} strokeWidth="2.2" fill="none"/>
        <Path d="M19 17 L29 7 M22 7 H29 V14" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
  }
  if (tipo === 'F') {
    return (
      <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <Circle cx="18" cy="14" r="7" stroke={stroke} strokeWidth="2.2" fill="none"/>
        <Path d="M18 21 V31 M14 27 H22" stroke={stroke} strokeWidth="2.2" strokeLinecap="round"/>
      </Svg>
    );
  }
  return (
    <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="18" r="3" fill={stroke}/>
      <Circle cx="8"  cy="18" r="3" fill={stroke}/>
      <Circle cx="28" cy="18" r="3" fill={stroke}/>
    </Svg>
  );
}

export default function OnboardingPerfilScreen() {
  const { user, completarOnboarding, logout } = useAuth();
  const router = useRouter();

  const [step, setStep]         = useState<1 | 2 | 3 | 4>(1);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [nivel, setNivel]       = useState<Nivel | null>(null);
  const [genero, setGenero]     = useState<Genero | null>(null);
  const [telefono, setTelefono] = useState('');
  const [avatarUrl, setAvatarUrl]   = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;

  function animarA(nuevoStep: 1 | 2 | 3 | 4) {
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

  function handleSiguiente() {
    setError('');
    if (step === 1) {
      if (!posicion) { setError('Selecciona una posición'); return; }
      animarA(2);
    } else if (step === 2) {
      if (!nivel) { setError('Selecciona tu nivel'); return; }
      animarA(3);
    } else if (step === 3) {
      if (!genero) { setError('Selecciona una opción'); return; }
      animarA(4);
    }
  }

  function handleAtras() {
    setError('');
    if (step === 1) return;
    animarA((step - 1) as 1 | 2 | 3);
  }

  async function pickImage() {
    setError('');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir tu foto.');
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
      Alert.alert('Error', 'No se pudo subir la foto: ' + (e.message || ''));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleListo() {
    if (!posicion || !nivel || !genero) {
      setError('Completa todos los pasos'); return;
    }
    if (!avatarUrl) {
      setError('Sube tu foto de perfil para continuar'); return;
    }
    setError(''); setLoading(true);
    try {
      const data: OnboardingPerfilData = { posicion, nivel, genero, avatar_url: avatarUrl };
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
            {[1,2,3,4].map(n => (
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
            {/* HOLA usuario */}
            {step === 1 && (
              <>
                <Text style={styles.eyebrow}>HOLA, {(user?.nombre || '').toUpperCase()}</Text>
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
                        <PosIcon tipo={p.value} active={active}/>
                        <View style={{ flex: 1, marginLeft: 16 }}>
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

            {step === 2 && (
              <>
                <Text style={styles.eyebrow}>PASO 2 DE 4</Text>
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
                        <View style={[styles.nivelBadge, active && styles.nivelBadgeActive]}>
                          <Text style={[styles.nivelBadgeTxt, active && { color: '#000' }]}>
                            {n.value === 'Principiante' ? '1' : n.value === 'Intermedio' ? '2' : '3'}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
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

            {step === 3 && (
              <>
                <Text style={styles.eyebrow}>PASO 3 DE 4</Text>
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
                        <GenIcon tipo={g.value} active={active}/>
                        <Text style={[styles.cardLabel, active && styles.cardLabelActive, { marginLeft: 16, flex: 1 }]}>
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

            {step === 4 && (
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
          {step < 4 ? (
            <TouchableOpacity
              style={[
                styles.btn,
                ((step === 1 && !posicion) || (step === 2 && !nivel) || (step === 3 && !genero)) && styles.btnDisabled,
              ]}
              onPress={handleSiguiente}
              disabled={(step === 1 && !posicion) || (step === 2 && !nivel) || (step === 3 && !genero)}
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
  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, padding: 16, minHeight: 76 },
  cardActive:     { borderColor: DT.primary, backgroundColor: 'rgba(190,194,255,0.10)' },
  cardLabel:      { fontSize: 16, color: DT.onBg, letterSpacing: 0.2, fontFamily: FONTS.bodyBold },
  cardLabelActive:{ color: DT.primary },
  cardSub:        { fontSize: 12, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },

  checkRing:      { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  checkRingActive:{ borderColor: DT.primary, backgroundColor: DT.primary },
  checkMark:      { fontSize: 13, color: DT.bg, fontFamily: FONTS.bodyBold, lineHeight: 14 },

  nivelBadge:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  nivelBadgeActive:{ borderColor: DT.primary, backgroundColor: DT.primary },
  nivelBadgeTxt:  { fontSize: 16, color: DT.onSurfaceVar, fontFamily: FONTS.bodyBold },

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
