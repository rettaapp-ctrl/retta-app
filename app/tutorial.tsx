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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Circle, Polygon } from 'react-native-svg';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';

const { width: SCREEN_W } = Dimensions.get('window');
export const TUTORIAL_SEEN_KEY = 'retta_tutorial_seen_v1';

type IconKind = 'ball' | 'flame' | 'bolt' | 'star' | 'field';

type Slide = {
  icon: IconKind;
  kicker: string;
  title: string;
  description: string;
  accentColor: string;
};

function SlideIcon({ kind, color }: { kind: IconKind; color: string }) {
  const common = { width: 60, height: 60, viewBox: '0 0 24 24', fill: 'none' as const };
  switch (kind) {
    case 'ball':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
          <Path d="M12 7.2l2.9 2.1-1.1 3.4h-3.6L9.1 9.3 12 7.2z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <Path d="M12 7.2V4M14.9 9.3l3-1M13.8 12.7l1.8 2.6M10.2 12.7l-1.8 2.6M9.1 9.3l-3-1" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </Svg>
      );
    case 'flame':
      return (
        <Svg {...common}>
          <Path
            d="M12 2C12 2 6 9 6 14a6 6 0 0 0 12 0c0-1.5-.5-3-1.5-4-.4 1-1.5 1.5-2.5 1-1.4-.7-1-2.6 0-4 .5-.7.5-2-1-3-1 .5-1.5 2-1 4z"
            stroke={color} strokeWidth="1.4" strokeLinejoin="round"
          />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg {...common}>
          <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...common}>
          <Path
            d="M12 3l2.85 6.6L22 10.27l-5.5 4.87L18.18 22 12 18.27 5.82 22 7.5 15.14 2 10.27l7.15-.67L12 3z"
            stroke={color} strokeWidth="1.4" strokeLinejoin="round"
          />
        </Svg>
      );
    case 'field':
      return (
        <Svg {...common}>
          <Path d="M3 6h18v12H3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M12 6v12" stroke={color} strokeWidth="1.2" />
          <Circle cx="12" cy="12" r="2.4" stroke={color} strokeWidth="1.2" />
          <Path d="M3 9.5h2.5v5H3M21 9.5h-2.5v5H21" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
        </Svg>
      );
  }
}

const SLIDES: Slide[] = [
  {
    icon: 'ball',
    kicker: 'BIENVENIDO',
    title: 'Encuentra partidos\ncerca de ti',
    description: 'Reta a otros, únete a partidos abiertos y forma equipos con tus amigos en complejos cerca de ti.',
    accentColor: DT.primary,
  },
  {
    icon: 'flame',
    kicker: 'RACHAS',
    title: 'Mantén tu racha\nsemanal',
    description: 'Juega al menos un partido cada semana para mantener tu racha activa. Si no juegas, vuelve a cero.',
    accentColor: '#FF6B35',
  },
  {
    icon: 'bolt',
    kicker: 'TU NIVEL',
    title: 'Sube tu nivel\nen cada partido',
    description: 'Empiezas en 1.0 y subes según ganes, empates o pierdas. Ganar contra un equipo mejor te da más puntos.',
    accentColor: DT.success,
  },
  {
    icon: 'star',
    kicker: 'CALIFICACIONES',
    title: 'Califica a tus\ncompañeros',
    description: 'Después de cada partido evalúas a 3 compañeros del 1 al 5. Las calificaciones son anónimas y ajustan tu nivel.',
    accentColor: '#FFB800',
  },
  {
    icon: 'field',
    kicker: '¡A JUGAR!',
    title: 'Listo para tu\nprimer partido',
    description: 'Explora los partidos disponibles, únete o invita a tus amigos. Nos vemos en la cancha.',
    accentColor: DT.primary,
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

  const isLast = idx === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar: Saltar */}
        <View style={styles.topBar}>
          {!isLast ? (
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
                <SlideIcon kind={s.icon} color={s.accentColor} />
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
              {isLast ? '¡EMPEZAR!' : 'SIGUIENTE'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: DT.bg },
  topBar:     { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 12, minHeight: 44 },
  skipTxt:    { fontSize: 14, color: DT.onSurfaceVar, fontFamily: FONTS.bodyMed },

  slide:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 30 },
  iconRing:   { width: 140, height: 140, borderRadius: 70, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  kicker:     { fontSize: 12, letterSpacing: 2, marginBottom: 12, fontFamily: FONTS.mono },
  title:      { fontSize: 28, color: DT.onBg, textAlign: 'center', lineHeight: 34, letterSpacing: 0.2, marginBottom: 20, fontFamily: FONTS.display },
  description:{ fontSize: 15, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, fontFamily: FONTS.body },

  dotsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive:  { width: 24 },

  ctaWrap:    { paddingHorizontal: 28, paddingBottom: 30 },
  btnPrimary: { height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryTxt: { fontSize: 14, color: DT.bg, letterSpacing: 1.5, fontFamily: FONTS.bodyBold },
});
