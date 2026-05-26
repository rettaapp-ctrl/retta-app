import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];
const POSICIONES = ['DEL', 'MED', 'DEF', 'POR'];
// Backend usa códigos M/F/O. UI muestra labels en español.
const GENERO_OPCIONES: { code: 'M'|'F'|'O'; label: string }[] = [
  { code: 'M', label: 'Hombre' },
  { code: 'F', label: 'Mujer' },
  { code: 'O', label: 'Prefiero no decir' },
];

export default function EditarPerfilScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [nombre,    setNombre]    = useState(user?.nombre    || '');
  const [apellido,  setApellido]  = useState(user?.apellido  || '');
  const [email,     setEmail]     = useState(user?.email     || '');
  const [telefono,  setTelefono]  = useState(user?.telefono  || '');
  const [ciudad,    setCiudad]    = useState(user?.ciudad    || '');
  // Genero: leer del user, default a 'M' si no tiene
  const [genero, setGenero] = useState<'M'|'F'|'O'>((user?.genero as 'M'|'F'|'O') || 'M');
  const [nivel,     setNivel]     = useState(user?.nivel     || 'Intermedio');
  const [posicion,  setPosicion]  = useState(user?.posicion  || 'DEL');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  function formatFechaNac(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  const fechaNacFmt = formatFechaNac(user?.fecha_nacimiento);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
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

  async function handleSave() {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }
    // Validar formato de email (mismo patrón que en register)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      Alert.alert('Email inválido', 'Ingresa un email válido (ej. tu@email.com).');
      return;
    }
    setSaving(true);
    try {
      await updateUser({ nombre, apellido, email, telefono, ciudad, nivel, posicion, genero, avatar_url: avatarUrl });
      Alert.alert('✓ Guardado', 'Tu perfil fue actualizado correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={DT.primary} />
            : <Text style={styles.saveBtnTxt}>Guardar</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarBlock} onPress={pickImage} disabled={uploadingPhoto}>
          <LinearGradient colors={GRADIENTS.dayActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 42 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                : <Svg width="42" height="42" viewBox="0 0 48 48" fill="none">
                    <Circle cx="24" cy="18" r="9" fill={DT.outline}/>
                    <Path d="M6 42C6 33.2 14.1 26 24 26C33.9 26 42 33.2 42 42" fill={DT.outline}/>
                  </Svg>
              }
            </View>
          </LinearGradient>
          <View style={styles.avatarEditBadge}>
            {uploadingPhoto
              ? <ActivityIndicator size="small" color="#fff" />
              : <Svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 20H21" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
            }
          </View>
          <Text style={styles.avatarLabel}>{uploadingPhoto ? 'Subiendo foto...' : 'Cambiar foto de perfil'}</Text>
        </TouchableOpacity>

        {/* Información Personal */}
        <Text style={styles.sectionLabel}>Información Personal</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <View style={styles.fieldIcon}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M20 21V19C20 17.9 19.1 17 18 17H6C4.9 17 4 17.9 4 19V21" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round"/>
                <Circle cx="12" cy="9" r="4" stroke={DT.outline} strokeWidth="1.8"/>
              </Svg>
            </View>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput style={styles.fieldInput} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor={DT.outline}/>
          </View>

          <View style={styles.fieldDivider}/>
          <View style={styles.field}>
            <View style={styles.fieldIcon}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M20 21V19C20 17.9 19.1 17 18 17H6C4.9 17 4 17.9 4 19V21" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round"/>
                <Circle cx="12" cy="9" r="4" stroke={DT.outline} strokeWidth="1.8"/>
              </Svg>
            </View>
            <Text style={styles.fieldLabel}>Apellido</Text>
            <TextInput style={styles.fieldInput} value={apellido} onChangeText={setApellido} placeholder="Tu apellido" placeholderTextColor={DT.outline}/>
          </View>

          <View style={styles.fieldDivider}/>
          <View style={styles.field}>
            <View style={styles.fieldIcon}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round"/>
                <Path d="M22 6L12 13L2 6" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round"/>
              </Svg>
            </View>
            <Text style={styles.fieldLabel}>Correo</Text>
            <TextInput style={styles.fieldInput} value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={DT.outline}/>
          </View>

          <View style={styles.fieldDivider}/>
          <View style={styles.field}>
            <View style={styles.fieldIcon}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.42 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55A16 16 0 0 0 16 16.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </View>
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <TextInput style={styles.fieldInput} value={telefono} onChangeText={setTelefono} placeholder="+52 55 0000 0000" keyboardType="phone-pad" placeholderTextColor={DT.outline}/>
          </View>

          <View style={styles.fieldDivider}/>
          <View style={styles.field}>
            <View style={styles.fieldIcon}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="10" r="3" stroke={DT.outline} strokeWidth="1.8"/>
                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={DT.outline} strokeWidth="1.8"/>
              </Svg>
            </View>
            <Text style={styles.fieldLabel}>Ciudad</Text>
            <TextInput style={styles.fieldInput} value={ciudad} onChangeText={setCiudad} placeholder="Tu ciudad" placeholderTextColor={DT.outline}/>
          </View>

          <View style={styles.fieldDivider}/>
          <View style={styles.field}>
            <View style={styles.fieldIcon}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Rect x="3" y="4" width="18" height="17" rx="3" stroke={DT.outline} strokeWidth="1.8"/>
                <Path d="M8 2V6M16 2V6M3 9H21" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round"/>
              </Svg>
            </View>
            <Text style={styles.fieldLabel}>Nacimiento</Text>
            <Text style={[styles.fieldInput, styles.fieldReadonly]}>
              {fechaNacFmt || '—'}
            </Text>
          </View>
        </View>

        {/* Género */}
        <Text style={styles.sectionLabel}>Género</Text>
        <View style={styles.card}>
          <View style={[styles.field, { minHeight: 62 }]}>
            <View style={styles.fieldIcon}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="8" r="4" stroke={DT.outline} strokeWidth="1.8"/>
                <Path d="M4 20C4 17 7.6 14.5 12 14.5C16.4 14.5 20 17 20 20" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round"/>
              </Svg>
            </View>
            <Text style={styles.fieldLabel}>Soy</Text>
            <View style={styles.toggleGroup}>
              {GENERO_OPCIONES.map(g => (
                <TouchableOpacity key={g.code} style={[styles.toggleBtn, genero === g.code && styles.toggleBtnActive]} onPress={() => setGenero(g.code)}>
                  <Text style={[styles.toggleBtnTxt, genero === g.code && styles.toggleBtnTxtActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Perfil Deportivo */}
        <Text style={styles.sectionLabel}>Perfil Deportivo</Text>
        <View style={styles.card}>
          <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
            <Text style={styles.sportSubLabel}>Nivel</Text>
            <View style={styles.chipGroup}>
              {NIVELES.map(n => (
                <TouchableOpacity key={n} style={[styles.chip, nivel === n && styles.chipActive]} onPress={() => setNivel(n)}>
                  <Text style={[styles.chipTxt, nivel === n && styles.chipTxtActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.fieldDivider}/>
          <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
            <Text style={styles.sportSubLabel}>Posición</Text>
            <View style={styles.chipGroup}>
              {POSICIONES.map(p => (
                <TouchableOpacity key={p} style={[styles.chip, posicion === p && styles.chipActive]} onPress={() => setPosicion(p)}>
                  <Text style={[styles.chipTxt, posicion === p && styles.chipTxtActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity style={[saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveMain}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveMainTxt}>Guardar Cambios</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: DT.bg },
  topbar:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorder, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  topbarTitle:      { flex: 1, textAlign: 'center', fontSize: 18, color: DT.onBg, letterSpacing: 0.3, fontFamily: FONTS.heading },
  saveBtn:          { paddingHorizontal: 4, minWidth: 60, alignItems: 'flex-end' },
  saveBtnTxt:       { fontSize: 14, color: DT.primary, letterSpacing: 0.3, fontFamily: FONTS.bodyBold },
  scroll:           { padding: 20, paddingTop: 8, paddingBottom: 40 },
  avatarBlock:      { alignItems: 'center', paddingVertical: 20, position: 'relative' },
  avatarRing:       { width: 90, height: 90, borderRadius: 45, padding: 3, alignItems: 'center', justifyContent: 'center' },
  avatarInner:      { width: '100%', height: '100%', borderRadius: 42, backgroundColor: DT.surfaceHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarEditBadge:  { position: 'absolute', top: 62, left: '50%', marginLeft: 18, width: 28, height: 28, borderRadius: 14, backgroundColor: DT.primaryContainer, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: DT.bg },
  avatarLabel:      { fontSize: 12, color: DT.onSurfaceVar, marginTop: 10, fontFamily: FONTS.body },
  sectionLabel:     { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.6, marginBottom: 8, marginLeft: 2, textTransform: 'uppercase', fontFamily: FONTS.mono },
  card:             { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  field:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 54 },
  fieldDivider:     { height: 1, backgroundColor: DT.glassBorder, marginLeft: 16 },
  fieldIcon:        { width: 28, alignItems: 'center', marginRight: 10 },
  fieldLabel:       { width: 90, fontSize: 13, color: DT.onSurfaceVar, paddingRight: 8, fontFamily: FONTS.bodyMed },
  fieldInput:       { flex: 1, fontSize: 14, color: DT.onBg, paddingVertical: 0, fontFamily: FONTS.bodyMed },
  fieldReadonly:    { color: DT.onSurfaceVar, paddingTop: Platform.OS === 'ios' ? 1 : 2 },
  toggleGroup:      { flexDirection: 'row', gap: 8 },
  toggleBtn:        { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorder },
  toggleBtnActive:  { backgroundColor: DT.primaryContainer, borderColor: DT.primaryContainer },
  toggleBtnTxt:     { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.bodyMed },
  toggleBtnTxtActive: { color: '#fff', fontFamily: FONTS.bodyBold },
  sportSubLabel:    { fontSize: 12, color: DT.onSurfaceVar, marginBottom: 8, fontFamily: FONTS.bodyMed },
  chipGroup:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:             { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorder },
  chipActive:       { backgroundColor: DT.primaryContainer, borderColor: DT.primaryContainer },
  chipTxt:          { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.bodyMed },
  chipTxtActive:    { color: '#fff', fontFamily: FONTS.bodyBold },
  saveMain:         { borderRadius: RADIUS.md, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveMainTxt:      { fontSize: 15, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
});
