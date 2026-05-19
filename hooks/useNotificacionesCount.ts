// ─────────────────────────────────────────────────────────────
// Hook que devuelve el número de notificaciones NO leídas del
// usuario autenticado. Se actualiza al hacer focus en la pantalla
// (cuando vuelves de la pantalla de notificaciones, se refresca).
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useApi } from '@/hooks/useApi';

interface Notificacion {
  id: string;
  leida: boolean;
}

export function useNotificacionesCount() {
  const { request } = useApi();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await request('/usuarios/me/notificaciones');
      const noLeidas = (data.notificaciones || []).filter((n: Notificacion) => !n.leida).length;
      setCount(noLeidas);
    } catch {
      setCount(0);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  // Refrescar cuando vuelve la pantalla a foreground
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { count, refresh: load };
}
