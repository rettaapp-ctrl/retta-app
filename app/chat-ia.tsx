// ═══════════════════════════════════════════════════════════
// RETTA — app/chat-ia.tsx
// Chatbot "Retta IA" — chat con Llama 3.1 8B vía Cloudflare Workers AI.
//
// Decisiones de diseño:
//  • Sin auth: el Worker es público con rate limiting por IP.
//  • Persistencia local en AsyncStorage — la conversación sobrevive al cerrar la app.
//  • Historial enviado al modelo: últimos 6 mensajes (3 turnos) para mantener
//    contexto sin inflar tokens.
//  • Sin streaming todavía — respuesta completa en un solo fetch. Si más
//    adelante queremos streaming, hay que cambiar el Worker a ReadableStream.
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS, CHAT_URL } from '@/constants';
import { track } from '@/lib/analytics';

interface Mensaje {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: number;
  error?:    boolean;
}

const STORAGE_KEY = 'retta_chat_ia_v1';
const MAX_HISTORIAL = 6; // turnos enviados al modelo

function BackIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function SendIcon({ disabled }: { disabled: boolean }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13"
        stroke={disabled ? 'rgba(0,0,0,0.25)' : '#000'}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke={disabled ? 'rgba(0,0,0,0.25)' : '#000'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BotAvatar() {
  return (
    <View style={styles.botAvatar}>
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L14.39 8.26L21 9.27L16 14.14L17.18 21L12 17.77L6.82 21L8 14.14L3 9.27L9.61 8.26L12 2Z" stroke="#000" strokeWidth="1.8" strokeLinejoin="round"/>
      </Svg>
    </View>
  );
}

const MENSAJE_BIENVENIDA: Mensaje = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy Retta IA. Puedo ayudarte con dudas sobre cómo funciona la app: política de cancelación, cómo invitar amigos, rating, calificaciones, marcadores y más. ¿En qué te ayudo?',
  timestamp: Date.now(),
};

export default function ChatIAScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([MENSAJE_BIENVENIDA]);
  const [texto, setTexto]       = useState('');
  const [enviando, setEnviando] = useState(false);

  // ── Cargar historial guardado al abrir ──
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: Mensaje[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMensajes(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  // ── Persistir cada vez que cambie la conversación ──
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes)).catch(() => {});
  }, [mensajes]);

  // ── Auto-scroll al fondo cuando llega un mensaje nuevo ──
  const scrollAlFinal = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => { scrollAlFinal(); }, [mensajes, enviando, scrollAlFinal]);

  async function enviarMensaje() {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    if (limpio.length > 1000) {
      Alert.alert('Mensaje muy largo', 'Máximo 1000 caracteres por mensaje.');
      return;
    }

    const userMsg: Mensaje = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: limpio,
      timestamp: Date.now(),
    };
    setMensajes(prev => [...prev, userMsg]);
    setTexto('');
    setEnviando(true);

    track('chat_ia_mensaje_enviado', { longitud: limpio.length });

    try {
      // Historial: últimos N mensajes (excluyendo el de bienvenida y este nuevo)
      // El bienvenida es solo UI, no se manda al modelo.
      const historial = mensajes
        .filter(m => m.id !== 'welcome' && !m.error)
        .slice(-MAX_HISTORIAL)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: limpio, history: historial }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.error || 'No se pudo conectar con Retta IA. Intenta de nuevo.';
        setMensajes(prev => [...prev, {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: errMsg,
          timestamp: Date.now(),
          error: true,
        }]);
        return;
      }

      const reply = String(data.response || '').trim();
      if (!reply) {
        setMensajes(prev => [...prev, {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: 'No pude generar una respuesta. Intenta reformular tu pregunta.',
          timestamp: Date.now(),
          error: true,
        }]);
        return;
      }

      setMensajes(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      }]);
    } catch {
      setMensajes(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
        timestamp: Date.now(),
        error: true,
      }]);
    } finally {
      setEnviando(false);
    }
  }

  function limpiarChat() {
    Alert.alert(
      'Borrar conversación',
      '¿Quieres empezar de cero? Se perderán todos los mensajes anteriores.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            setMensajes([MENSAJE_BIENVENIDA]);
            AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2L14.39 8.26L21 9.27L16 14.14L17.18 21L12 17.77L6.82 21L8 14.14L3 9.27L9.61 8.26L12 2Z" stroke="#000" strokeWidth="1.8" strokeLinejoin="round"/>
            </Svg>
          </View>
          <View>
            <Text style={styles.headerTitle}>Retta IA</Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerStatus}>En línea</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={limpiarChat} style={styles.clearBtn}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <Path d="M3 6H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6" stroke="rgba(0,0,0,0.45)" strokeWidth="1.8" strokeLinecap="round"/>
          </Svg>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Conversación */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollAlFinal}
        >
          {mensajes.map(m => (
            <View
              key={m.id}
              style={[
                styles.row,
                m.role === 'user' ? styles.rowUser : styles.rowBot,
              ]}
            >
              {m.role === 'assistant' && <BotAvatar />}
              <View
                style={[
                  styles.bubble,
                  m.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
                  m.error && styles.bubbleError,
                ]}
              >
                <Text style={[
                  styles.bubbleTxt,
                  m.role === 'user' ? styles.bubbleTxtUser : styles.bubbleTxtBot,
                  m.error && styles.bubbleTxtError,
                ]}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))}

          {enviando && (
            <View style={[styles.row, styles.rowBot]}>
              <BotAvatar />
              <View style={[styles.bubble, styles.bubbleBot, styles.bubbleTyping]}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.typingTxt}>Escribiendo…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Pregúntame algo sobre Retta…"
            placeholderTextColor="rgba(0,0,0,0.35)"
            multiline
            maxLength={1000}
            editable={!enviando}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!texto.trim() || enviando) && styles.sendBtnDisabled]}
            onPress={enviarMensaje}
            disabled={!texto.trim() || enviando}
            activeOpacity={0.85}
          >
            <SendIcon disabled={!texto.trim() || enviando} />
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Retta IA puede equivocarse. Para casos importantes contacta a rettaapp@gmail.com.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#FFFFFF' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backBtn:        { padding: 6, marginRight: 8 },
  headerCenter:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar:   { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 15, fontWeight: '900', color: '#111', letterSpacing: 0.3 },
  headerStatusRow:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  statusDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' },
  headerStatus:   { fontSize: 11, color: 'rgba(0,0,0,0.45)', fontWeight: '500' },
  clearBtn:       { padding: 6 },
  scroll:         { flex: 1, backgroundColor: '#F8F8F6' },
  scrollContent:  { padding: 16, paddingBottom: 8 },
  row:            { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  rowUser:        { justifyContent: 'flex-end' },
  rowBot:         { justifyContent: 'flex-start', gap: 6 },
  botAvatar:      { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bubble:         { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleUser:     { backgroundColor: COLORS.accent, borderBottomRightRadius: 6 },
  bubbleBot:      { backgroundColor: '#fff', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  bubbleError:    { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  bubbleTyping:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  typingTxt:      { fontSize: 13, color: '#666' },
  bubbleTxt:      { fontSize: 14.5, lineHeight: 20 },
  bubbleTxtUser:  { color: '#000' },
  bubbleTxtBot:   { color: '#111' },
  bubbleTxtError: { color: '#C62828' },
  inputBar:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 6 : 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  input:          { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F2F1EF', borderRadius: 20, fontSize: 14.5, color: '#111' },
  sendBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: 'rgba(0,0,0,0.06)' },
  disclaimer:     { fontSize: 10.5, color: 'rgba(0,0,0,0.35)', textAlign: 'center', paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 4 : 10, paddingTop: 4, backgroundColor: '#FFFFFF' },
});
