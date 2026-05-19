// ═══════════════════════════════════════════════
// RETTA — app/tutorial.tsx
// Onboarding visual de primera vez. 5 pantallas con swipe horizontal
// explicando: bienvenida, rachas, niveles, calificaciones, "a jugar".
//
// Se marca como visto con SecureStore (`retta_tutorial_seen_v1`).
// Si en el futuro quieres re-mostrar tutorial actualizado, sube el
// número de versión a v2 y todos los users lo ven una vez más.
// ═══════════════════════════════════════════════
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '@/constants';

const { width: SCREEN_W } = Dimensions.get('window');
export const TUTORIAL_SEEN_KEY = 'retta_tutorial_seen_v1';

type Slide = {
  emoji: string;
  kicker: string;
  title: string;
  description: string;
  accentColor: string;
};

const SLIDES: Slide[] = [
  {
    emoji: '⚽',
    kicker: 'BIENVENIDO',
    title: 'Encuentra partidos\ncerca de ti',
    description: 'Reta a otros, únete a partidos abiertos y forma equipos con tus amigos en complejos cerca de ti.',
    accentColor: COLORS.accent,
  },
  {
    emoji: '🔥',
    kicker: 'RACHAS',
    title: 'Mantén tu racha\nsemanal',
    description: 'Juega al menos un partido cada semana para mantener tu racha activa. Si no juegas, vuelve a cero.',
    accentColor: '#FF6B35',
  },
  {
    emoji: '⚡',
    kicker: 'TU NIVEL',
    title: 'Sube tu nivel\nen cada partido',
    description: 'Empiezas en 1.0 y subes según ganes, empates o pierdas. Ganar contra un equipo mejor te da más puntos.',
    accentColor: '#7AB800',
  },
  {
    emoji: '⭐',
    kicker: 'CALIFICACIONES',
    title: 'Califica a tus\ncompañeros',
    description: 'Después de cada partido evalúas a 3 compañeros del 1 al 5. Las calificaciones son anónimas y ajustan tu nivel.',
    accentColor: '#FFB800',
  },
  {
    emoji: '🏟️',
    kicker: '¡A JUGAR!',
    title: 'Listo para tu\nprimer partido',
    description: 'Explora los partidos disponibles, únete o invita a tus amigos. Nos vemos en la cancha.',
    accentColor: COLORS.accent,
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIdx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (newIdx !== idx) setIdx(newIdx);
  }

  function next() {
    if (idx < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (idx + 1) * SCREEN_W, animated: true });
    } else {
      finish();
    }
  }

  async function finish() {
    try {
      await SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, '1');
    } catch {}
    router.replace('/(tabs)/partidos');
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar: Saltar */}
      <View style={styles.topBar}>
        {idx < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={finish}>
            <Text style={styles.skipTxt}>Saltar</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Slides horizontales */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_W }]}>
            <View style={[styles.iconRing, { borderColor: s.accentColor }]}>
              <Text style={styles.iconTxt}>{s.emoji}</Text>
            </View>
            <Text style={[styles.kicker, { color: s.accentColor }]}>{s.kicker}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.description}>{s.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots indicador */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === idx && [styles.dotActive, { backgroundColor: SLIDES[idx].accentColor }],
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: SLIDES[idx].accentColor }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryTxt}>
            {idx < SLIDES.length - 1 ? 'SIGUIENTE' : '¡EMPEZAR!'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#fff' },
  topBar:     { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 12, minHeight: 44 },
  skipTxt:    { fontSize: 14, color: 'rgba(0,0,0,0.5)', fontWeight: '700' },

  slide:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 30 },
  iconRing:   { width: 140, height: 140, borderRadius: 70, borderWidth: 3, backgroundColor: '#F8F8F5', alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  iconTxt:    { fontSize: 64 },
  kicker:     { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  title:      { fontSize: 28, fontWeight: '900', color: '#111', textAlign: 'center', lineHeight: 34, letterSpacing: 0.2, marginBottom: 20 },
  description:{ fontSize: 15, color: 'rgba(0,0,0,0.55)', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },

  dotsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.15)' },
  dotActive:  { width: 24 },

  ctaWrap:    { paddingHorizontal: 28, paddingBottom: 30 },
  btnPrimary: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryTxt: { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1.5 },
});
