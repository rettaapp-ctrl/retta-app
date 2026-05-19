import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function AvatarIcon() {
  return (
    <Svg width="42" height="42" viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="18" r="9" fill="#999"/>
      <Path d="M6 42C6 33.2 14.1 26 24 26C33.9 26 42 33.2 42 42" fill="#999"/>
    </Svg>
  );
}
function ArrowIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke="rgba(0,0,0,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function LogoutIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5C4.4 21 4 20.6 4 20V4C4 3.4 4.4 3 5 3H9" stroke="#D62B2B" strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M16 17L21 12L16 7" stroke="#D62B2B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M21 12H9" stroke="#D62B2B" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

interface RowProps {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  sub?: string;
  onPress?: () => void;
  last?: boolean;
}

function SettingsRow({ iconBg, icon, title, sub, onPress, last }: RowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <ArrowIcon />
    </TouchableOpacity>
  );
}

export default function ConfiguracionScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function confirmLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile block */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              {user?.avatar_url
                ? <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 34 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                : <AvatarIcon />
              }
            </View>
          </View>
          <Text style={styles.profileName}>{user?.nombre} {user?.apellido || ''}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/editar-perfil')} activeOpacity={0.8}>
            <Text style={styles.editBtnTxt}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Cuenta */}
        <Text style={styles.sectionLabel}>Cuenta</Text>
        <View style={styles.section}>
          <SettingsRow
            last
            iconBg="rgba(43,127,255,0.1)"
            icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Rect x="2" y="5" width="20" height="14" rx="3" stroke="#2B7FFF" strokeWidth="1.8"/><Path d="M2 10H22" stroke="#2B7FFF" strokeWidth="1.8"/><Path d="M6 15H10" stroke="#2B7FFF" strokeWidth="1.8" strokeLinecap="round"/></Svg>}
            title="Pagos"
            sub="Administrar métodos de pago y recibos"
            onPress={() => router.push('/pagos')}
          />
        </View>

        {/* Soporte */}
        <Text style={styles.sectionLabel}>Soporte</Text>
        <View style={styles.section}>
          <SettingsRow
            iconBg="rgba(214,43,43,0.09)"
            icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke="#D62B2B" strokeWidth="1.8"/><Path d="M12 8V12" stroke="#D62B2B" strokeWidth="2" strokeLinecap="round"/><Circle cx="12" cy="16" r="1" fill="#D62B2B"/></Svg>}
            title="Ayuda"
            sub="Preguntas frecuentes, soporte y contacto"
            onPress={() => router.push('/ayuda')}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            last
            iconBg="rgba(214,43,43,0.09)"
            icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Path d="M12 9v4M12 17h.01" stroke="#D62B2B" strokeWidth="2" strokeLinecap="round"/><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#D62B2B" strokeWidth="1.8" strokeLinejoin="round"/></Svg>}
            title="Reportar comportamiento"
            sub="Denuncia conductas inadecuadas o incidentes"
            onPress={() => router.push('/reportar-comportamiento')}
          />
        </View>

        {/* Legal */}
        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.section}>
          <SettingsRow
            iconBg="rgba(0,0,0,0.06)"
            icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Path d="M14 2H6C5.4 2 5 2.4 5 3V21C5 21.6 5.4 22 6 22H18C18.6 22 19 21.6 19 21V7L14 2Z" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><Path d="M14 2V7H19" stroke="#555" strokeWidth="1.8" strokeLinecap="round"/><Path d="M9 13H15M9 17H13" stroke="#555" strokeWidth="1.8" strokeLinecap="round"/></Svg>}
            title="Términos y Condiciones"
            onPress={() => router.push('/terminos')}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            last
            iconBg="rgba(0,0,0,0.06)"
            icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Path d="M12 22C12 22 3 18 3 11V5L12 2L21 5V11C21 18 12 22 12 22Z" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><Path d="M9 12L11 14L15 10" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
            title="Aviso de Privacidad"
            onPress={() => router.push('/privacidad')}
          />
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <LogoutIcon />
          <Text style={styles.logoutTxt}>CERRAR SESIÓN</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Retta v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#fff' },
  topbar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:      { marginRight: 12, padding: 2 },
  topbarTitle:  { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: 0.5 },
  scroll:       { padding: 20, paddingTop: 0, paddingBottom: 40 },
  profileBlock: { alignItems: 'center', paddingVertical: 24 },
  avatarRing:   { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accent, padding: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarInner:  { width: '100%', height: '100%', borderRadius: 36, backgroundColor: '#F2F1EF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileName:  { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: 0.3, marginBottom: 2 },
  profileEmail: { fontSize: 12, color: 'rgba(0,0,0,0.38)', marginBottom: 14 },
  editBtn:      { backgroundColor: '#111', borderRadius: 22, paddingHorizontal: 24, paddingVertical: 9 },
  editBtnTxt:   { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1.2 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.28)', letterSpacing: 1.8, marginBottom: 8, marginLeft: 2, textTransform: 'uppercase' },
  section:      { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  row:          { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  rowIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowText:      { flex: 1 },
  rowTitle:     { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: 0.2, lineHeight: 18 },
  rowSub:       { fontSize: 11, color: 'rgba(0,0,0,0.38)', marginTop: 2 },
  rowDivider:   { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 66 },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(214,43,43,0.07)', borderWidth: 1.5, borderColor: 'rgba(214,43,43,0.18)', borderRadius: 16, height: 52, marginBottom: 16 },
  logoutTxt:    { fontSize: 14, fontWeight: '800', color: '#D62B2B', letterSpacing: 1.5 },
  version:      { textAlign: 'center', fontSize: 11, color: 'rgba(0,0,0,0.2)' },
});
