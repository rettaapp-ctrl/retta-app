// ═══════════════════════════════════════════════════════════
// RETTA — app/reportar-comportamiento.tsx
// Formulario in-app de soporte / reporte general.
//
// 4 categorías: Bug, Conducta de jugador, Sugerencia, Otro.
// Texto libre 10-1500 chars. Envío directo al backend (sin pasar
// por cliente de correo del teléfono — antes era mailto: y Rafael
// notó que muchos usuarios no tienen Gmail/Mail configurado y
// abandonaban).
//
// Backend: POST /api/reportes/soporte → guarda en tabla `reportes`
// con origen='sistema' para que el admin los filtre como soporte.
// ═══════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { AppAlert } from '@/lib/appAlert';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { LinearGradient } from 'expo-linear-gradient';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

type Categoria = 'bug' | 'conducta' | 'sugerencia' | 'otro';

const CATEGORIAS: Array<{
  id: Categoria;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = [
  {
    id: 'conducta',
    label: 'Conducta',
    desc: 'Reportar jugador, agresión, acoso',
    color: '#ffb4ab',
    bg: 'rgba(255,180,171,0.12)',
    icon: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <Path d="M12 9v4M12 17h.01" stroke="#ffb4ab" strokeWidth="2" strokeLinecap="round"/>
        <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#ffb4ab" strokeWidth="1.8" strokeLinejoin="round"/>
      </Svg>
    ),
  },
  {
    id: 'bug',
    label: 'Bug',
    desc: 'Algo no funciona bien en la app',
    color: '#bec2ff',
    bg: 'rgba(190,194,255,0.12)',
    icon: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <Path d="M8 2L9.88 5.76M16 2L14.12 5.76" stroke="#bec2ff" strokeWidth="2" strokeLinecap="round"/>
        <Path d="M12 22a6 6 0 0 0 6-6V9H6v7a6 6 0 0 0 6 6z" stroke="#bec2ff" strokeWidth="1.8" strokeLinejoin="round"/>
        <Path d="M2 12h4M18 12h4M3 6l3 2M21 6l-3 2M3 18l3-2M21 18l-3-2" stroke="#bec2ff" strokeWidth="1.8" strokeLinecap="round"/>
      </Svg>
    ),
  },
  {
    id: 'sugerencia',
    label: 'Sugerencia',
    desc: 'Idea para mejorar Retta',
    color: '#7dd3a0',
    bg: 'rgba(125,211,160,0.12)',
    icon: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L13.09 8.26L19 7L14.74 12L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12L5 7L10.91 8.26L12 2Z" stroke="#7dd3a0" strokeWidth="1.6" strokeLinejoin="round"/>
      </Svg>
    ),
  },
  {
    id: 'otro',
    label: 'Otro',
    desc: 'Cualquier otra cosa que quieras contarnos',
    color: '#e4e6f0',
    bg: 'rgba(255,255,255,0.06)',
    icon: (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#e4e6f0" strokeWidth="1.8" strokeLinejoin="round"/>
      </Svg>
    ),
  },
];

function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const MIN_CHARS = 10;
const MAX_CHARS = 1500;

export default function ReportarComportamientoScreen() {
  const router = useRouter();
  const { request } = useApi();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [mensaje, setMensaje]     = useState('');
  const [enviando, setEnviando]   = useState(false);

  const len   = mensaje.trim().length;
  const valid = categoria !== null && len >= MIN_CHARS && len <= MAX_CHARS;

  async function enviar() {
    if (!valid || enviando) return;
    setEnviando(true);
    try {
      await request('/reportes/soporte', {
        method: 'POST',
        body: JSON.stringify({ categoria, mensaje: mensaje.trim() }),
      });
      AppAlert.alert(
        '¡Recibido!',
        'Gracias por escribirnos. Revisamos cada mensaje y te respondemos lo antes posible.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: any) {
      AppAlert.alert('No se pudo enviar', e?.message || 'Intenta de nuevo en un momento.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top','bottom']}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Contactar a Retta</Text>
          <View style={{ width: 42 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Intro corto */}
            <Text style={styles.intro}>
              ¿Algo no funcionó? ¿Tienes una idea? ¿Pasó algo con otro jugador?
              Escríbenos directo y lo revisamos.
            </Text>

            {/* Categorías */}
            <Text style={styles.sectionLabel}>¿De qué se trata?</Text>
            <View style={styles.catGrid}>
              {CATEGORIAS.map(c => {
                const selected = categoria === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCategoria(c.id)}
                    activeOpacity={0.85}
                    style={[
                      styles.catCard,
                      { backgroundColor: selected ? c.bg : 'rgba(255,255,255,0.04)' },
                      selected && { borderColor: c.color },
                    ]}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: c.bg }]}>
                      {c.icon}
                    </View>
                    <Text style={[styles.catLabel, selected && { color: c.color }]}>
                      {c.label}
                    </Text>
                    <Text style={styles.catDesc} numberOfLines={2}>
                      {c.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Mensaje */}
            <View style={styles.msjHeader}>
              <Text style={styles.sectionLabel}>Cuéntanos qué pasó</Text>
              <Text style={[
                styles.counter,
                len > MAX_CHARS && { color: DT.error },
              ]}>
                {len}/{MAX_CHARS}
              </Text>
            </View>
            <TextInput
              value={mensaje}
              onChangeText={setMensaje}
              placeholder="Mientras más detalles nos des, mejor podemos ayudarte. Si es sobre otra persona, escribe su nombre o usuario."
              placeholderTextColor={DT.outline}
              multiline
              textAlignVertical="top"
              maxLength={MAX_CHARS + 50}
              style={styles.textarea}
            />

            {/* Botón */}
            <TouchableOpacity onPress={enviar} disabled={!valid || enviando} activeOpacity={0.85}>
              <LinearGradient
                colors={valid ? GRADIENTS.button : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.06)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.btn, (!valid || enviando) && { opacity: 0.7 }]}
              >
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
                <Text style={styles.btnTxt}>{enviando ? 'ENVIANDO...' : 'ENVIAR REPORTE'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke={DT.outline} strokeWidth="1.8"/>
                <Path d="M12 8V12" stroke={DT.outline} strokeWidth="2" strokeLinecap="round"/>
                <Circle cx="12" cy="16" r="1" fill={DT.outline}/>
              </Svg>
              <Text style={styles.disclaimerTxt}>
                Tu reporte es confidencial. Si es sobre un jugador de un partido específico,
                también puedes reportarlo desde el perfil del jugador o desde la pantalla
                de calificaciones después del partido.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: DT.bg },
  topbar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  topbarTitle:   { flex: 1, textAlign: 'center', fontSize: 17, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  scroll:        { padding: 20, paddingTop: 4, paddingBottom: 60 },

  intro:         { fontSize: 14, color: DT.onSurfaceVar, lineHeight: 20, marginBottom: 22, fontFamily: FONTS.body },

  sectionLabel:  { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.8, marginBottom: 10, marginLeft: 2, fontFamily: FONTS.mono },

  catGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  catCard:       {
    width: '48%',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: DT.glassBorder,
    minHeight: 110,
  },
  catIconWrap:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  catLabel:      { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyBold, letterSpacing: 0.1, marginBottom: 4 },
  catDesc:       { fontSize: 11.5, color: DT.onSurfaceVar, lineHeight: 16, fontFamily: FONTS.body },

  msjHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  counter:       { fontSize: 10, color: DT.outline, fontFamily: FONTS.mono, letterSpacing: 1 },
  textarea:      {
    minHeight: 160,
    backgroundColor: DT.glassBg,
    borderWidth: 1,
    borderColor: DT.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 14,
    fontSize: 14,
    color: DT.onBg,
    fontFamily: FONTS.body,
    lineHeight: 21,
    marginBottom: 22,
  },

  btn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: RADIUS.full, marginBottom: 16 },
  btnTxt:        { fontSize: 13, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },

  disclaimer:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: 12 },
  disclaimerTxt: { flex: 1, fontSize: 12, color: DT.onSurfaceVar, lineHeight: 17, fontFamily: FONTS.body },
});
