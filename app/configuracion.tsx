import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { DT, GRADIENTS, FONTS, RADIUS, SPACING } from '@/constants/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={DT.onBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function AvatarIcon() {
  return (
    <Svg width="42" height="42" viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="18" r="9" fill={DT.outline}/>
      <Path d="M6 42C6 33.2 14.1 26 24 26C33.9 26 42 33.2 42 42" fill={DT.outline}/>
    </Svg>
  );
}
function ArrowIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke={DT.outline} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function LogoutIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5C4.4 21 4 20.6 4 20V4C4 3.4 4.4 3 5 3H9" stroke={DT.error} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M16 17L21 12L16 7" stroke={DT.error} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M21 12H9" stroke={DT.error} strokeWidth="1.8" strokeLinecap="round"/>
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
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.pageBg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Configuración</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Profile block */}
          <View style={styles.profileBlock}>
            <LinearGradient colors={GRADIENTS.dayActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {user?.avatar_url
                  ? <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 34 }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                  : <AvatarIcon />
                }
              </View>
            </LinearGradient>
            <Text style={styles.profileName}>{user?.nombre} {user?.apellido || ''}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <TouchableOpacity onPress={() => router.push('/editar-perfil')} activeOpacity={0.85}>
              <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.editBtn}>
                <Text style={styles.editBtnTxt}>Editar Perfil</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>CUENTA</Text>
          <View style={styles.section}>
            <SettingsRow
              last
              iconBg="rgba(53,138,221,0.15)"
              icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Rect x="2" y="5" width="20" height="14" rx="3" stroke="#85B7EB" strokeWidth="1.8"/><Path d="M2 10H22" stroke="#85B7EB" strokeWidth="1.8"/><Path d="M6 15H10" stroke="#85B7EB" strokeWidth="1.8" strokeLinecap="round"/></Svg>}
              title="Pagos"
              sub="Administrar métodos de pago y recibos"
              onPress={() => router.push('/pagos')}
            />
          </View>

          <Text style={styles.sectionLabel}>SOPORTE</Text>
          <View style={styles.section}>
            <SettingsRow
              iconBg="rgba(190,194,255,0.12)"
              icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={DT.primary} strokeWidth="1.8"/><Path d="M12 8V12" stroke={DT.primary} strokeWidth="2" strokeLinecap="round"/><Circle cx="12" cy="16" r="1" fill={DT.primary}/></Svg>}
              title="Ayuda"
              sub="Preguntas frecuentes, soporte y contacto"
              onPress={() => router.push('/ayuda')}
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              last
              iconBg="rgba(255,180,171,0.12)"
              icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Path d="M12 9v4M12 17h.01" stroke={DT.error} strokeWidth="2" strokeLinecap="round"/><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={DT.error} strokeWidth="1.8" strokeLinejoin="round"/></Svg>}
              title="Reportar comportamiento"
              sub="Denuncia conductas inadecuadas o incidentes"
              onPress={() => router.push('/reportar-comportamiento')}
            />
          </View>

          <Text style={styles.sectionLabel}>LEGAL</Text>
          <View style={styles.section}>
            <SettingsRow
              iconBg="rgba(255,255,255,0.06)"
              icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Path d="M14 2H6C5.4 2 5 2.4 5 3V21C5 21.6 5.4 22 6 22H18C18.6 22 19 21.6 19 21V7L14 2Z" stroke={DT.onSurfaceVar} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><Path d="M14 2V7H19" stroke={DT.onSurfaceVar} strokeWidth="1.8" strokeLinecap="round"/><Path d="M9 13H15M9 17H13" stroke={DT.onSurfaceVar} strokeWidth="1.8" strokeLinecap="round"/></Svg>}
              title="Términos y Condiciones"
              onPress={() => router.push('/terminos')}
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              last
              iconBg="rgba(255,255,255,0.06)"
              icon={<Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Path d="M12 22C12 22 3 18 3 11V5L12 2L21 5V11C21 18 12 22 12 22Z" stroke={DT.onSurfaceVar} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><Path d="M9 12L11 14L15 10" stroke={DT.onSurfaceVar} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
              title="Aviso de Privacidad"
              onPress={() => router.push('/privacidad')}
            />
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
            <LogoutIcon />
            <Text style={styles.logoutTxt}>CERRAR SESIÓN</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Retta v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DT.bg },
  topbar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.gutter, paddingVertical: 14 },
  backBtn:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder },
  topbarTitle:  { flex: 1, textAlign: 'center', fontSize: 18, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: 0.2 },
  scroll:       { padding: SPACING.gutter, paddingTop: 0, paddingBottom: 40 },
  profileBlock: { alignItems: 'center', paddingVertical: 24 },
  avatarRing:   { width: 84, height: 84, borderRadius: 42, padding: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarInner:  { width: '100%', height: '100%', borderRadius: 39, backgroundColor: DT.surfaceHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileName:  { fontSize: 20, color: DT.onBg, fontFamily: FONTS.heading, letterSpacing: -0.2, marginBottom: 3 },
  profileEmail: { fontSize: 12.5, color: DT.onSurfaceVar, marginBottom: 16, fontFamily: FONTS.body },
  editBtn:      { borderRadius: RADIUS.full, paddingHorizontal: 26, paddingVertical: 11 },
  editBtnTxt:   { fontSize: 13, color: '#fff', fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  sectionLabel: { fontSize: 10, color: DT.onSurfaceVar, letterSpacing: 1.8, marginBottom: 10, marginLeft: 2, fontFamily: FONTS.mono },
  section:      { backgroundColor: DT.glassBg, borderWidth: 1, borderColor: DT.glassBorder, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 14 },
  row:          { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 14 },
  rowIcon:      { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowText:      { flex: 1 },
  rowTitle:     { fontSize: 15, color: DT.onBg, fontFamily: FONTS.bodyMed, letterSpacing: 0.2, lineHeight: 18 },
  rowSub:       { fontSize: 11.5, color: DT.onSurfaceVar, marginTop: 2, fontFamily: FONTS.body },
  rowDivider:   { height: 1, backgroundColor: DT.glassBorder, marginLeft: 68 },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(255,180,171,0.08)', borderWidth: 1, borderColor: 'rgba(255,180,171,0.25)', borderRadius: RADIUS.lg, height: 54, marginBottom: 16, marginTop: 4 },
  logoutTxt:    { fontSize: 14, color: DT.error, fontFamily: FONTS.bodyBold, letterSpacing: 1 },
  version:      { textAlign: 'center', fontSize: 11, color: DT.outline, fontFamily: FONTS.mono },
});
