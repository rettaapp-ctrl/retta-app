// ═══════════════════════════════════════════════
// Hook que detecta cuántas calificaciones tiene el usuario pendientes.
// Se usa para mostrar el banner/prompt en Partidos.
// ═══════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react';
import { useApi } from './useApi';
import { useAuth } from '@/context/AuthContext';

export function useCalificacionesPendientes() {
  const { token } = useAuth();
  const { request } = useApi();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!token) { setCount(0); return; }
    setLoading(true);
    try {
      const data = await request('/calificaciones/pendientes');
      const total = (data.partidos || []).reduce(
        (sum: number, p: any) => sum + (p.calificaciones?.length || 0), 0
      );
      setCount(total);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, request]);

  useEffect(() => { refetch(); }, [refetch]);

  return { count, loading, refetch };
}
