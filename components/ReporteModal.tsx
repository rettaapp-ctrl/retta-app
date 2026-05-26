// ═══════════════════════════════════════════════
// RETTA — components/ReporteModal.tsx
// Modal reutilizable para reportar a un jugador o un incidente.
// ═══════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useApi } from '@/hooks/useApi';
import { DT, FONTS, RADIUS } from '@/constants/designTokens';
import { track } from '@/lib/analytics';

type Razon = 'conducta_antideportiva' | 'agresion' | 'no_asistio' | 'lesion' | 'otro';

const RAZONES: { value: Razon; label: string }[] = [
  { value: 'conducta_antideportiva', label: 'Conducta antideportiva' },
  { value: 'agresion',               label: 'Agresión física o verbal' },
  { value: 'no_asistio',             label: 'No se presentó' },
  { value: 'lesion',                 label: 'Lesión durante el partido' },
  { value: 'otro',                   label: 'Otro' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  partidoId: string;
  reportadoId: string | null;        // null = reporte general (incidente sin jugador)
  reportadoNombre?: string;
  onSent?: () => void;
}

export default function ReporteModal({
  visible, onClose, partidoId, reportadoId, reportadoNombre, onSent,
}: Props) {
  const { request } = useApi();
  const [razon, setRazon]           = useState<Razon | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando]     = useState(false);

  function reset() {
    setRazon(null);
    setComentario('');
  }

  async function enviar() {
    if (!razon) {
      Alert.alert('Falta razón', 'Selecciona el motivo del reporte.');
      return;
    }
    setEnviando(true);
    try {
      await request('/reportes', {
        method: 'POST',
        body: JSON.stringify({
          partido_id:   partidoId,
          reportado_id: reportadoId,
          razon,
          comentario:   comentario.trim() || undefined,
        }),
      });
      track('reporte_enviado', {
        partido_id:        partidoId,
        razon,
        contra_jugador:    !!reportadoId,
        con_comentario:    comentario.trim().length > 0,
      });
      reset();
      Alert.alert(
        'Reporte enviado',
        'Gracias. El equipo de Retta lo revisará pronto.',
        [{ text: 'OK', onPress: () => { onSent?.(); onClose(); } }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
      >
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1 }} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>REPORTAR</Text>
              <Text style={styles.subtitle}>
                {reportadoNombre ? `Sobre: ${reportadoNombre}` : 'Incidente del partido'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: DT.onBg }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 460 }}>
            <Text style={styles.sectionLabel}>MOTIVO</Text>
            {RAZONES.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[styles.razonRow, razon === r.value && styles.razonRowSel]}
                onPress={() => setRazon(r.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, razon === r.value && styles.radioSel]}>
                  {razon === r.value && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.razonTxt, razon === r.value && styles.razonTxtSel]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>DESCRIPCIÓN (OPCIONAL)</Text>
            <TextInput
              style={styles.input}
              value={comentario}
              onChangeText={setComentario}
              placeholder="Cuéntanos qué pasó. Sé breve y claro."
              placeholderTextColor={DT.outline}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{comentario.length}/1000</Text>
          </ScrollView>

          <TouchableOpacity
            style={[styles.btn, (!razon || enviando) && { opacity: 0.4 }]}
            onPress={enviar}
            disabled={!razon || enviando}
            activeOpacity={0.85}
          >
            {enviando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnTxt}>ENVIAR REPORTE</Text>
            }
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Los reportes se revisan en privado por el equipo de Retta.{'\n'}
            No se notifica al reportado.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal:        { backgroundColor: DT.surfaceLow, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30, borderWidth: 1, borderColor: DT.glassBorder },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title:        { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyBold, letterSpacing: 1 },
  subtitle:     { fontSize: 12, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },
  closeBtn:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.2, marginHorizontal: 20, marginBottom: 10, fontFamily: FONTS.mono },
  razonRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  razonRowSel:  { backgroundColor: 'rgba(190,194,255,0.08)' },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  radioSel:     { borderColor: DT.primary },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: DT.primary },
  razonTxt:     { fontSize: 14, color: DT.onSurfaceVar, fontFamily: FONTS.body },
  razonTxtSel:  { color: DT.onBg, fontFamily: FONTS.bodyMed },
  input:        { marginHorizontal: 20, padding: 12, fontSize: 13, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.06)', minHeight: 90, maxHeight: 140, color: DT.onBg, fontFamily: FONTS.body },
  counter:      { fontSize: 11, color: DT.outline, textAlign: 'right', marginRight: 20, marginTop: 4, fontFamily: FONTS.mono },
  btn:          { height: 52, marginHorizontal: 20, marginTop: 18, backgroundColor: DT.primaryContainer, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  btnTxt:       { fontSize: 13, color: '#fff', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  disclaimer:   { fontSize: 10, color: DT.outline, textAlign: 'center', marginTop: 10, paddingHorizontal: 30, lineHeight: 14, fontFamily: FONTS.body },
});
