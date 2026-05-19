import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants';
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
      <Path d="M15 18L9 12L15 6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function ReceiptIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8"/>
      <Path d="M8 2V6M16 2V6M3 9H21" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M7 13H12" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8" strokeLinecap="round"/>
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
    <SafeAreaView style={styles.root}>
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
              <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#8FCC00" strokeWidth="1.8"/>
              <Path d="M2 10H22" stroke="#8FCC00" strokeWidth="1.8"/>
              <Path d="M6 15H10" stroke="#8FCC00" strokeWidth="1.8" strokeLinecap="round"/>
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
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
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
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#fff' },
  topbar:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:           { marginRight: 12, padding: 2 },
  topbarTitle:       { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: 0.5 },
  scroll:            { padding: 20, paddingTop: 8, paddingBottom: 40 },
  stripeBanner:      { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: 'rgba(143,204,0,0.08)', borderWidth: 1, borderColor: 'rgba(143,204,0,0.25)', borderRadius: 16, padding: 16, marginBottom: 24 },
  stripeBannerIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(143,204,0,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stripeBannerTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  stripeBannerSub:   { fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 17 },
  sectionLabel:      { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.28)', letterSpacing: 1.8, marginBottom: 8, textTransform: 'uppercase' },
  card:              { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  receiptRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', gap: 12 },
  receiptIcon:       { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
  receiptInfo:       { flex: 1 },
  receiptTitle:      { fontSize: 14, fontWeight: '800', color: '#111' },
  receiptSub:        { fontSize: 11, color: 'rgba(0,0,0,0.38)', marginTop: 2 },
  receiptAmount:     { fontSize: 15, fontWeight: '900', color: '#111' },
  verTodosRow:       { padding: 14, alignItems: 'center' },
  verTodosTxt:       { fontSize: 12, fontWeight: '800', color: 'rgba(0,0,0,0.3)', letterSpacing: 0.8, textTransform: 'uppercase' },
  poweredBy:         { alignItems: 'center', marginTop: 8 },
  poweredByTxt:      { fontSize: 11, color: 'rgba(0,0,0,0.25)', fontWeight: '600' },
  emptyCard:         { backgroundColor: '#F4F3EF', borderRadius: 16, padding: 22, alignItems: 'center', marginBottom: 16 },
  emptyTitle:        { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 4 },
  emptySub:          { fontSize: 12, color: 'rgba(0,0,0,0.45)', textAlign: 'center', lineHeight: 17 },
});
