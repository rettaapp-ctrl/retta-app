// ─────────────────────────────────────────────────────────────
// Hook que devuelve el número de notificaciones NO leídas del
// usuario autenticado. Se actualiza al hacer focus en la pantalla
// (cuando vuelves de la pantalla de notificaciones, se refresca).
//
// CACHÉ COMPARTIDO (30s): varias pantallas montan este hook y cada
// cambio de tab disparaba un fetch por pantalla — eso ayudó a tirar
// el rate limiter global en pruebas (issue Sentry 2026-07-21). Ahora
// el conteo vive en un caché a nivel módulo: si el último fetch fue
// hace <30s, se reutiliza sin pegarle al backend. `refresh()` fuerza
// (p. ej. después de leer/borrar notifs en la pantalla de notifs).
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useApi } from '@/hooks/useApi';

interface Notificacion {
  id: string;
  leida: boolean;
}

const TTL_MS = 30_000;
let cacheCount = 0;
let cacheTs = 0;

// Suscriptores: cada pantalla montada con el hook escucha aquí. Así un
// ajuste hecho desde CUALQUIER pantalla actualiza todas las campanitas
// al instante (perfil, explorar, etc.) sin fetch de por medio.
const listeners = new Set<(n: number) => void>();

function setCache(n: number) {
  cacheCount = Math.max(0, n);
  cacheTs = Date.now();
  listeners.forEach(l => l(cacheCount));
}

// Ajuste optimista del contador desde otras pantallas — p. ej. la de
// notificaciones llama con -1 al borrar/leer una NO leída y con +1 si
// el usuario deshace. El badge baja al momento (pedido del Foco
// 2026-08-02: "se tiene que quitar el contador automáticamente"), y el
// próximo fetch real (post-TTL) re-sincroniza con el servidor.
export function ajustarNotificacionesCount(delta: number) {
  setCache(cacheCount + delta);
}

export function useNotificacionesCount() {
  const { request } = useApi();
  const [count, setCount] = useState(cacheCount);

  // Escuchar ajustes hechos desde cualquier pantalla
  useEffect(() => {
    const l = (n: number) => setCount(n);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const load = useCallback(async (force = false) => {
    if (!force && Date.now() - cacheTs < TTL_MS) {
      setCount(cacheCount);
      return;
    }
    try {
      const data = await request('/usuarios/me/notificaciones');
      const noLeidas = (data.notificaciones || []).filter((n: Notificacion) => !n.leida).length;
      setCache(noLeidas);
      setCount(noLeidas);
    } catch {
      setCount(cacheCount);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  // Refrescar cuando vuelve la pantalla a foreground
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { count, refresh: () => load(true) };
}
