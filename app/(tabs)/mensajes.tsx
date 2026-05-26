import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { DT, GRADIENTS, FONTS } from '@/constants/designTokens';

function ChatIcon() {
  return (
    <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke={DT.primary}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function MensajesScreen() {
  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Mensajes</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <ChatIcon />
          </View>
          <Text style={styles.emptyTitle}>Sin mensajes</Text>
          <Text style={styles.emptySub}>Aquí verás tus conversaciones con los complejos</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: DT.bg },
  header:      { padding: 20, paddingBottom: 12 },
  title:       { fontSize: 28, color: DT.onBg, letterSpacing: 0.4, fontFamily: FONTS.display },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconWrap:{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(190,194,255,0.08)', borderWidth: 1, borderColor: DT.glassBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle:  { fontSize: 18, color: DT.onBg, marginBottom: 6, fontFamily: FONTS.heading },
  emptySub:    { fontSize: 13, color: DT.onSurfaceVar, textAlign: 'center', lineHeight: 20, fontFamily: FONTS.body },
});
