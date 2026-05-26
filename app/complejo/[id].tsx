import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

interface Cancha {
  id: string;
  nombre: string;
  tipo: string;
  color_hex: string;
}

interface Complejo {
  id: string;
  nombre: string;
  slug: string;
  ciudad: string;
  direccion?: string;
  logo_url?: string;
  color_hex?: string;
  rating_promedio?: number;
  canchas: Cancha[];
}

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function PinIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={DT.primary}/>
      <Circle cx="12" cy="9" r="2.5" fill={DT.bg}/>
    </Svg>
  );
}
function PhoneIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function MailIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M22 6l-10 7L2 6" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function ComplejoDetailScreen() {
  const { id }      = useLocalSearchParams<{ id: string }>();
  const { request } = useApi();
  const router      = useRouter();
  const [complejo, setComplejo] = useState<Complejo | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const data = await request(`/complejos/${id}`);
      if (data && data.id) {
        setComplejo(data);
      }
    } catch {
      // El render del estado vacío maneja el caso de error
    }
    setLoading(false);
  }

  if (loading) return (
    <View style={styles.center}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator color={DT.primary} size="large" />
    </View>
  );

  if (!complejo) return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Complejo</Text>
        </View>
        <View style={styles.center}>
          <Text style={{ color: DT.onSurfaceVar, fontSize: 16, fontFamily: FONTS.body }}>Complejo no encontrado</Text>
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>{complejo.nombre}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.heroBanner}>
          {complejo.logo_url ? (
            <Image source={{ uri: complejo.logo_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" cachePolicy="memory-disk" transition={150} />
          ) : (
            <View style={styles.heroBannerBg} />
          )}
          <View style={styles.heroOverlay}>
            <Text style={styles.heroName}>{complejo.nombre}</Text>
            <Text style={styles.heroCity}>{complejo.ciudad}</Text>
          </View>
        </View>



        <Text style={styles.sectionLabel}>Canchas disponibles</Text>
        {complejo.canchas && complejo.canchas.length > 0 ? (
          <View style={styles.canchasCard}>
            {complejo.canchas.map((cancha, i) => (
              <View key={cancha.id} style={[styles.canchaRow, i === complejo.canchas.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.canchaColor, { backgroundColor: cancha.color_hex || DT.primary }]} />
                <View style={styles.canchaInfo}>
                  <Text style={styles.canchaNombre}>{cancha.nombre}</Text>
                  <Text style={styles.canchaTipo}>{cancha.tipo || 'Sin tipo'}</Text>
                </View>
                <View style={styles.canchaTag}>
                  <Text style={styles.canchaTagTxt}>Activa</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTxt}>Sin canchas registradas</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Ubicación</Text>
        <TouchableOpacity
          style={styles.mapBox}
          onPress={() => complejo.direccion && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(complejo.direccion)}`)}
          activeOpacity={0.8}
        >
          <View style={styles.mapBg} />
          <View style={styles.mapContent}>
            <View style={styles.mapPin}><PinIcon /></View>
            <Text style={styles.mapAddr}>{complejo.direccion || complejo.ciudad}</Text>
            {complejo.direccion && (
              <View style={styles.mapBtn}>
                <Text style={styles.mapBtnTxt}>Abrir en Maps</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DT.bg },
  center:       { flex: 1, backgroundColor: DT.bg, alignItems: 'center', justifyContent: 'center' },
  topbar:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: DT.glassBorder },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorder, alignItems: 'center', justifyContent: 'center' },
  topbarTitle:  { fontSize: 18, color: DT.onBg, letterSpacing: 0.3, flex: 1, fontFamily: FONTS.heading },
  scroll:       { paddingBottom: 40 },
  heroBanner:   { width: '100%', height: 220, position: 'relative', overflow: 'hidden' },
  heroBannerBg: { ...StyleSheet.absoluteFillObject, backgroundColor: DT.surfaceHigh },
  heroOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,10,18,0.55)', justifyContent: 'flex-end', padding: 20 },
  heroName:     { fontSize: 28, color: '#fff', letterSpacing: 0.5, lineHeight: 30, fontFamily: FONTS.display },
  heroCity:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontFamily: FONTS.body },
  infoCard:     { marginHorizontal: 20, marginTop: 16, backgroundColor: DT.glassBg, borderRadius: 16, borderWidth: 1, borderColor: DT.glassBorder, overflow: 'hidden', marginBottom: 8 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: DT.glassBorder, gap: 12 },
  infoIcon:     { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  infoText:     { flex: 1 },
  infoLabel:    { fontSize: 9, color: DT.onSurfaceVar, letterSpacing: 1.2, marginBottom: 2, fontFamily: FONTS.mono },
  infoVal:      { fontSize: 13, color: DT.onBg, fontFamily: FONTS.bodyMed },
  infoLink:     { fontSize: 11, color: DT.primary, fontFamily: FONTS.bodyBold },
  sectionLabel: { fontSize: 11, letterSpacing: 1.4, color: DT.onSurfaceVar, paddingHorizontal: 20, marginBottom: 10, marginTop: 16, textTransform: 'uppercase', fontFamily: FONTS.mono },
  canchasCard:  { marginHorizontal: 20, backgroundColor: DT.glassBg, borderRadius: 16, borderWidth: 1, borderColor: DT.glassBorder, overflow: 'hidden' },
  canchaRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: DT.glassBorder, gap: 12 },
  canchaColor:  { width: 10, height: 10, borderRadius: 5 },
  canchaInfo:   { flex: 1 },
  canchaNombre: { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyMed },
  canchaTipo:   { fontSize: 11, color: DT.onSurfaceVar, marginTop: 1, fontFamily: FONTS.body },
  canchaTag:    { backgroundColor: 'rgba(159,225,203,0.10)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  canchaTagTxt: { fontSize: 10, color: DT.success, fontFamily: FONTS.bodyBold },
  emptyWrap:    { marginHorizontal: 20, paddingVertical: 24, alignItems: 'center' },
  emptyTxt:     { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  mapBox:       { marginHorizontal: 20, height: 130, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: DT.glassBorder, position: 'relative' },
  mapBg:        { ...StyleSheet.absoluteFillObject, backgroundColor: DT.surfaceHigh },
  mapContent:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapPin:       { width: 32, height: 32, borderRadius: 16, backgroundColor: DT.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DT.glassBorder },
  mapAddr:      { fontSize: 12, color: DT.onSurfaceVar, textAlign: 'center', paddingHorizontal: 20, fontFamily: FONTS.bodyMed },
  mapBtn:       { backgroundColor: DT.primaryContainer, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  mapBtnTxt:    { fontSize: 11, color: '#fff', letterSpacing: 0.5, fontFamily: FONTS.bodyBold },
});
