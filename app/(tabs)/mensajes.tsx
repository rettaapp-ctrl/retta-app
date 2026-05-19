import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';

export default function MensajesScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensajes</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>Sin mensajes</Text>
        <Text style={styles.emptySub}>Aquí verás tus conversaciones con los complejos</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#fff' },
  header:    { padding: 20, paddingBottom: 12 },
  title:     { fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: 0.5 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle:{ fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 6 },
  emptySub:  { fontSize: 13, color: 'rgba(0,0,0,0.38)', textAlign: 'center', lineHeight: 20 },
});
