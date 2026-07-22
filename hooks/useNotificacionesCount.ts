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

export function useNotificacionesCount() {
  const { request } = useApi();
  const [count, setCount] = useState(cacheCount);

  const load = useCallback(async (force = false) => {
    if (!force && Date.now() - cacheTs < TTL_MS) {
      setCount(cacheCount);
      return;
    }
    try {
      const data = await request('/usuarios/me/notificaciones');
      const noLeidas = (data.notificaciones || []).filter((n: Notificacion) => !n.leida).length;
      cacheCount = noLeidas;
      cacheTs = Date.now();
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
