import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { DT, GRADIENTS, FONTS, RADIUS } from '@/constants/designTokens';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useApi } from '@/hooks/useApi';

interface Pago {
  id: string;
  monto: number;
  status: string;
  created_at: string;
  partidos?: {
    fecha: string;
    hora_inicio: string;
    tipo: string;
    complejos?: { nombre: string };
  };
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatFechaCorta(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function ReceiptIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={DT.outline} strokeWidth="1.8"/>
      <Path d="M8 2V6M16 2V6M3 9H21" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M7 13H12" stroke={DT.outline} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

export default function PagosScreen() {
  const router = useRouter();
  const { request } = useApi();
  const [pagos, setPagos]     = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await request('/pagos/mis-pagos');
      setPagos((data.pagos || []).filter((p: Pago) => p.status === 'completado'));
    } catch {
      setPagos([]);
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Pagos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner Stripe próximamente */}
        <View style={styles.stripeBanner}>
          <View style={styles.stripeBannerIcon}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Rect x="2" y="5" width="20" height="14" rx="3" stroke={DT.primary} strokeWidth="1.8"/>
              <Path d="M2 10H22" stroke={DT.primary} strokeWidth="1.8"/>
              <Path d="M6 15H10" stroke={DT.primary} strokeWidth="1.8" strokeLinecap="round"/>
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stripeBannerTitle}>Pagos con tarjeta</Text>
            <Text style={styles.stripeBannerSub}>Próximamente disponible. Estamos configurando los métodos de pago para ti.</Text>
          </View>
        </View>

        {/* Sección: Recibos recientes */}
        <Text style={styles.sectionLabel}>Recibos recientes</Text>
        {loading ? (
          <ActivityIndicator color={DT.primary} style={{ marginTop: 20 }} />
        ) : pagos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin recibos todavía</Text>
            <Text style={styles.emptySub}>Cuando pagues tu primer partido, aparecerá aquí.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {pagos.map((p, i) => {
              const venue = p.partidos?.complejos?.nombre || 'Complejo';
              const fecha = formatFechaCorta(p.partidos?.fecha || p.created_at);
              const tipo  = p.partidos?.tipo || '';
              return (
                <View key={p.id} style={[styles.receiptRow, i === pagos.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.receiptIcon}>
                    <ReceiptIcon />
                  </View>
                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptTitle}>{venue}</Text>
                    <Text style={styles.receiptSub}>
                      {fecha}{tipo ? ` · ${tipo}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.receiptAmount}>${p.monto}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Powered by Stripe */}
        <View style={styles.poweredBy}>
          <Text style={styles.poweredByTxt}>Powered by Stripe</Text>
        </View>

      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: DT.bg },
  topbar:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DT.glassBorder, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  topbarTitle:       { flex: 1, textAlign: 'center', fontSize: 18, color: DT.onBg, letterSpacing: 0.3, fontFamily: FONTS.heading },
  scroll:            { padding: 20, paddingTop: 8, paddingBottom: 40 },
  stripeBanner:      { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: 'rgba(190,194,255,0.06)', borderWidth: 1, borderColor: 'rgba(190,194,255,0.22)', borderRadius: 16, padding: 16, marginBottom: 24 },
  stripeBannerIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(190,194,255,0.10)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stripeBannerTitle: { fontSize: 15, color: DT.onBg, marginBottom: 4, fontFamily: FONTS.bodyBold },
  stripeBannerSub:   { fontSize: 12, color: DT.onSurfaceVar, lineHeight: 17, fontFamily: FONTS.body },
  sectionLabel:      { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.6, marginBottom: 8, textTransform: 'uppercase', fontFamily: FONTS.mono },
  card:              { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  receiptRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: DT.glassBorder, gap: 12 },
  receiptIcon:       { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  receiptInfo:       { flex: 1 },
  receiptTitle:      { fontSize: 14, color: DT.onBg, fontFamily: FONTS.bodyBold },
  receiptSub:        { fontSize: 11, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },
  receiptAmount:     { fontSize: 15, color: DT.onBg, fontFamily: FONTS.heading },
  verTodosRow:       { padding: 14, alignItems: 'center' },
  verTodosTxt:       { fontSize: 12, color: DT.onSurfaceVar, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONTS.bodyBold },
  poweredBy:         { alignItems: 'center', marginTop: 8 },
  poweredByTxt:      { fontSize: 11, color: DT.outline, fontFamily: FONTS.bodyMed },
  emptyCard:         { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: DT.glassBorder, borderRadius: 16, padding: 22, alignItems: 'center', marginBottom: 16 },
  emptyTitle:        { fontSize: 14, color: DT.onBg, marginBottom: 4, fontFamily: FONTS.bodyBold },
  emptySub:          { fontSize: 12, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 17, fontFamily: FONTS.body },
});
