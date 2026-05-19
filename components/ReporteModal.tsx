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
import { COLORS } from '@/constants';
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
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#111' }}>×</Text>
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
              placeholderTextColor="rgba(0,0,0,0.3)"
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
              ? <ActivityIndicator color="#000" />
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
  modal:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30 },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title:        { fontSize: 14, fontWeight: '900', color: '#111', letterSpacing: 1 },
  subtitle:     { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 2 },
  closeBtn:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.45)', letterSpacing: 1.2, marginHorizontal: 20, marginBottom: 10 },
  razonRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  razonRowSel:  { backgroundColor: 'rgba(122,184,0,0.06)' },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  radioSel:     { borderColor: COLORS.accent },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  razonTxt:     { fontSize: 14, color: 'rgba(0,0,0,0.7)', fontWeight: '600' },
  razonTxtSel:  { color: '#111', fontWeight: '700' },
  input:        { marginHorizontal: 20, padding: 12, fontSize: 13, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 12, backgroundColor: '#FAFAFA', minHeight: 90, maxHeight: 140 },
  counter:      { fontSize: 11, color: 'rgba(0,0,0,0.4)', textAlign: 'right', marginRight: 20, marginTop: 4 },
  btn:          { height: 50, marginHorizontal: 20, marginTop: 18, backgroundColor: COLORS.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnTxt:       { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 1.2 },
  disclaimer:   { fontSize: 10, color: 'rgba(0,0,0,0.35)', textAlign: 'center', marginTop: 10, paddingHorizontal: 30, lineHeight: 14 },
});
