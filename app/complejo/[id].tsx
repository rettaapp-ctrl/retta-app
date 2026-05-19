import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { COLORS } from '@/constants';
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
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function PinIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={COLORS.accent}/>
      <Circle cx="12" cy="9" r="2.5" fill="#fff"/>
    </Svg>
  );
}
function PhoneIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function MailIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M22 6l-10 7L2 6" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
    <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>
  );

  if (!complejo) return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Complejo</Text>
      </View>
      <View style={styles.center}>
        <Text style={{ color: 'rgba(0,0,0,0.5)', fontSize: 16 }}>Complejo no encontrado</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.root}>
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
                <View style={[styles.canchaColor, { backgroundColor: cancha.color_hex || COLORS.accent }]} />
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
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F8F8F6' },
  center:       { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  topbar:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backBtn:      { padding: 2 },
  topbarTitle:  { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: 0.3, flex: 1 },
  scroll:       { paddingBottom: 40 },
  heroBanner:   { width: '100%', height: 220, position: 'relative', overflow: 'hidden' },
  heroBannerBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a2e1a' },
  heroOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 20 },
  heroName:     { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 0.5, lineHeight: 30 },
  heroCity:     { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  infoCard:     { marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 8 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', gap: 12 },
  infoIcon:     { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F2F1EF', alignItems: 'center', justifyContent: 'center' },
  infoText:     { flex: 1 },
  infoLabel:    { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.3)', letterSpacing: 1.2, marginBottom: 2 },
  infoVal:      { fontSize: 13, fontWeight: '600', color: '#111' },
  infoLink:     { fontSize: 11, color: COLORS.accent, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(0,0,0,0.28)', paddingHorizontal: 20, marginBottom: 10, marginTop: 16, textTransform: 'uppercase' },
  canchasCard:  { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', overflow: 'hidden' },
  canchaRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', gap: 12 },
  canchaColor:  { width: 10, height: 10, borderRadius: 5 },
  canchaInfo:   { flex: 1 },
  canchaNombre: { fontSize: 14, fontWeight: '700', color: '#111' },
  canchaTipo:   { fontSize: 11, color: 'rgba(0,0,0,0.38)', marginTop: 1 },
  canchaTag:    { backgroundColor: 'rgba(122,184,0,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  canchaTagTxt: { fontSize: 10, fontWeight: '700', color: '#4a7a00' },
  emptyWrap:    { marginHorizontal: 20, paddingVertical: 24, alignItems: 'center' },
  emptyTxt:     { fontSize: 13, color: 'rgba(0,0,0,0.35)' },
  mapBox:       { marginHorizontal: 20, height: 130, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', position: 'relative' },
  mapBg:        { ...StyleSheet.absoluteFillObject, backgroundColor: '#dde8d0' },
  mapContent:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapPin:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  mapAddr:      { fontSize: 12, color: 'rgba(0,0,0,0.55)', fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 },
  mapBtn:       { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  mapBtnTxt:    { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
