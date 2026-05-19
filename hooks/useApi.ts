import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants';
import { useCallback } from 'react';
import {
  isInfraOutage,
  isNetworkError,
  SERVICE_DOWN_MESSAGE,
  NO_INTERNET_MESSAGE,
} from '@/lib/serviceStatus';

// ─────────────────────────────────────────────────────────────
// Helper: fetch con auto-retry exponencial para network errors transitorios.
// Solo reintenta GETs (los POST/PATCH/DELETE no son seguros de reintentar
// automáticamente porque pueden crear duplicados).
//
// Retry triggers:
//   - fetch() lanza error (network down, timeout, DNS fail)
//   - Respuesta 502/503/504 (gateway errors)
//
// Backoff: 500ms → 1s → 2s (max 3 intentos).
// ─────────────────────────────────────────────────────────────
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  const isSafeToRetry = !options.method || options.method.toUpperCase() === 'GET';
  let lastErr: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      // Reintentar si server temporalmente no disponible
      if ((res.status === 502 || res.status === 503 || res.status === 504) && isSafeToRetry && attempt < maxRetries) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      // Si no es GET, no retry (puede crear duplicados)
      if (!isSafeToRetry || attempt === maxRetries) throw err;
      await sleep(500 * Math.pow(2, attempt));
    }
  }
  throw lastErr || new Error('Network error after retries');
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// Helper: crear Error tipado para distinguir infra outage de errores de app.
// Los consumidores pueden checar err.isInfraOutage / err.isNetworkError para
// decidir qué mensaje mostrar.
function makeInfraError() {
  const err: any = new Error(SERVICE_DOWN_MESSAGE);
  err.isInfraOutage = true;
  return err;
}
function makeNetworkError() {
  const err: any = new Error(NO_INTERNET_MESSAGE);
  err.isNetworkError = true;
  return err;
}

export function useApi() {
  const { token, refreshAccessToken, handleUnauthorized } = useAuth();

  // useCallback memoiza la función — la referencia solo cambia si token o
  // las callbacks del context cambian. Esto evita loops de fetch en hooks
  // que tienen `request` en sus dependencias.
  const request = useCallback(async (path: string, options: RequestInit = {}) => {
    const doFetch = (tk: string | null) => fetchWithRetry(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
        ...(options.headers || {}),
      },
    });

    let res: Response;
    try {
      res = await doFetch(token);
    } catch (err) {
      // fetch() lanzó: red caída, DNS muerto, timeout. Distinguimos:
      //  - Sin internet → mensaje "sin conexión"
      //  - Cualquier otro → asumimos infra del lado de Retta
      if (isNetworkError(err)) throw makeNetworkError();
      throw makeInfraError();
    }

    // 401 con token activo → access token expirado.
    // Intentamos refresh transparente y reintentamos UNA vez.
    if (res.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        await handleUnauthorized();
        throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
      }
      try {
        res = await doFetch(newToken);
      } catch (err) {
        if (isNetworkError(err)) throw makeNetworkError();
        throw makeInfraError();
      }
      if (res.status === 401) {
        await handleUnauthorized();
        throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
      }
    }

    // Detectar infra outage ANTES de intentar parsear JSON (los fallbacks
    // de Railway devuelven HTML, no JSON, así que res.json() tiraría).
    if (isInfraOutage(res)) throw makeInfraError();

    let data: any;
    try {
      data = await res.json();
    } catch {
      // Respuesta sin JSON parseable y no detectada como infra arriba.
      // Probablemente igual es problema de infra, así que lo tratamos así.
      if (!res.ok) throw makeInfraError();
      data = {};
    }

    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  }, [token, refreshAccessToken, handleUnauthorized]);

  return { request };
}
