// ═══════════════════════════════════════════════════════════
// RETTA — lib/appAlert.tsx
// Reemplazo del Alert.alert nativo de React Native con un modal
// que respeta el dark theme y el lenguaje visual de la app.
//
// Antes salía el Alert nativo de Android (gris con CTAs verde claro),
// que se veía como Android 4. Ahora todos los confirmaciones,
// success messages, errors, etc. usan el mismo modal moderno.
//
// API casi idéntica a Alert.alert para que migrar sea mecánico:
//
//   AppAlert.alert('Título', 'Mensaje', [
//     { text: 'Cancelar', style: 'cancel' },
//     { text: 'Eliminar', style: 'destructive', onPress: () => fn() }
//   ]);
//
// Shortcuts para casos comunes:
//   AppAlert.success('Guardado', 'Tu perfil fue actualizado.');
//   AppAlert.error('Ups', 'No pudimos enviar tu mensaje.');
//   AppAlert.info('Hola', 'Bienvenido.');
//   AppAlert.warning('Cuidado', 'Esta acción modifica X.');
//
// Para que funcione, montar <AppAlertHost /> UNA SOLA VEZ en el root
// (app/_layout.tsx).
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { DT, FONTS, RADIUS } from '@/constants/designTokens';

// ─── Tipos públicos ─────────────────────────────────────────
export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';
export type AlertVariant     = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface AlertButton {
  text:     string;
  style?:   AlertButtonStyle;
  onPress?: () => void | Promise<void>;
}

export interface AlertConfig {
  title:    string;
  message?: string;
  variant?: AlertVariant;
  buttons?: AlertButton[];
}

// ─── Singleton para invocar desde cualquier lado sin contexto ───
let _showImpl: (cfg: AlertConfig) => void = () => {
  // Si todavía no se montó el host, lo loggeamos como warning
  console.warn('[AppAlert] Host no montado todavía — agregar <AppAlertHost /> al _layout root');
};

export const AppAlert = {
  /**
   * Reemplazo drop-in de Alert.alert. Misma firma:
   *   AppAlert.alert(title, message?, buttons?)
   * Si no pasas buttons, se muestra un solo botón "OK".
   */
  alert(title: string, message?: string, buttons?: AlertButton[], variant: AlertVariant = 'default') {
    _showImpl({
      title,
      message,
      variant,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }],
    });
  },
  /** Shortcut: success (checkmark verde). Un solo botón OK. */
  success(title: string, message?: string, onClose?: () => void) {
    _showImpl({
      title, message, variant: 'success',
      buttons: [{ text: 'OK', style: 'default', onPress: onClose }],
    });
  },
  /** Shortcut: error (X roja). Un solo botón OK. */
  error(title: string, message?: string, onClose?: () => void) {
    _showImpl({
      title, message, variant: 'error',
      buttons: [{ text: 'OK', style: 'default', onPress: onClose }],
    });
  },
  /** Shortcut: warning (triángulo amarillo). Un solo botón OK. */
  warning(title: string, message?: string, onClose?: () => void) {
    _showImpl({
      title, message, variant: 'warning',
      buttons: [{ text: 'OK', style: 'default', onPress: onClose }],
    });
  },
  /** Shortcut: info (lavanda). Un solo botón OK. */
  info(title: string, message?: string, onClose?: () => void) {
    _showImpl({
      title, message, variant: 'info',
      buttons: [{ text: 'OK', style: 'default', onPress: onClose }],
    });
  },
};

// ─── Componente Host: monta UNA vez en root ─────────────────
export function AppAlertHost() {
  const [cfg, setCfg] = useState<AlertConfig | null>(null);
  const [running, setRunning] = useState<number | null>(null);

  useEffect(() => {
    _showImpl = (c) => setCfg(c);
    return () => { _showImpl = () => {}; };
  }, []);

  async function handlePress(btn: AlertButton, idx: number) {
    if (running !== null) return;
    if (btn.onPress) {
      try {
        setRunning(idx);
        await btn.onPress();
      } catch {} finally {
        setRunning(null);
      }
    }
    setCfg(null);
  }

  const variant = cfg?.variant || 'default';
  const { icon, iconBg } = ICONS[variant];

  return (
    <Modal
      visible={cfg !== null}
      transparent
      animationType="fade"
      onRequestClose={() => running === null && setCfg(null)}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => running === null && setCfg(null)}
      >
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {variant !== 'default' && (
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              {icon}
            </View>
          )}
          <Text style={styles.title}>{cfg?.title}</Text>
          {cfg?.message ? (
            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.message}>{cfg.message}</Text>
            </ScrollView>
          ) : null}
          <View style={[
            styles.actions,
            (cfg?.buttons?.length ?? 1) > 2 && { flexDirection: 'column', gap: 8 },
          ]}>
            {(cfg?.buttons || []).map((btn, idx) => {
              const isPrimary     = btn.style !== 'cancel' && btn.style !== 'destructive';
              const isDestructive = btn.style === 'destructive';
              const isCancel      = btn.style === 'cancel';
              const isRunning     = running === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handlePress(btn, idx)}
                  disabled={running !== null}
                  activeOpacity={0.85}
                  style={[
                    styles.btn,
                    isCancel      && styles.btnCancel,
                    isPrimary     && styles.btnPrimary,
                    isDestructive && styles.btnDestructive,
                  ]}
                >
                  {isRunning ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={[
                      styles.btnTxt,
                      isCancel      && styles.btnCancelTxt,
                      isPrimary     && styles.btnPrimaryTxt,
                      isDestructive && styles.btnDestructiveTxt,
                    ]}>{btn.text.toUpperCase()}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Iconos por variante ────────────────────────────────────
const ICONS: Record<AlertVariant, { icon: React.ReactNode; iconBg: string }> = {
  default: { icon: null, iconBg: 'transparent' },
  success: {
    iconBg: 'rgba(125,211,160,0.16)',
    icon: (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Path d="M5 12L10 17L20 7" stroke="#7dd3a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
  },
  error: {
    iconBg: 'rgba(255,180,171,0.12)',
    icon: (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Path d="M6 6L18 18M6 18L18 6" stroke={DT.error} strokeWidth="2.5" strokeLinecap="round"/>
      </Svg>
    ),
  },
  warning: {
    iconBg: 'rgba(250,199,117,0.14)',
    icon: (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.55 18.99 2.45 21 3.56 21H20.44C21.55 21 22.45 20.1 22.45 18.99L13.71 3.86C13.35 3.33 12.7 3 12 3C11.3 3 10.65 3.33 10.29 3.86Z" stroke={DT.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
  },
  info: {
    iconBg: 'rgba(190,194,255,0.14)',
    icon: (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={DT.primary} strokeWidth="2"/>
        <Path d="M12 16V11" stroke={DT.primary} strokeWidth="2" strokeLinecap="round"/>
        <Circle cx="12" cy="8" r="1" fill={DT.primary}/>
      </Svg>
    ),
  },
};

const styles = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  card:      { width: '100%', maxWidth: 360, backgroundColor: '#1a1d28', borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, borderColor: DT.glassBorder, alignItems: 'center' },
  iconWrap:  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title:     { fontSize: 17, color: DT.onBg, fontFamily: FONTS.heading, marginBottom: 6, textAlign: 'center' },
  message:   { fontSize: 13, color: DT.onSurfaceVar, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 19, marginBottom: 6 },
  actions:   { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 16 },

  btn:               { flex: 1, height: 46, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  btnCancel:         { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: DT.glassBorder },
  btnPrimary:        { backgroundColor: DT.primaryContainer },
  btnDestructive:    { backgroundColor: DT.error },

  btnTxt:            { fontSize: 12, fontFamily: FONTS.bodyBold, letterSpacing: 1 },
  btnCancelTxt:      { color: DT.onSurfaceVar },
  btnPrimaryTxt:     { color: '#fff' },
  btnDestructiveTxt: { color: '#fff' },
});
