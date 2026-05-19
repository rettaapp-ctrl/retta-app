// ═══════════════════════════════════════════════════════════════
// RETTA — lib/serviceStatus.ts
//
// Detecta si un error del backend es un problema de infraestructura
// (Railway caído, gateway timeout, DNS roto, etc.) y devuelve un
// mensaje friendly al usuario en vez del error técnico.
//
// La idea: el usuario no quiere ver "fetch failed" o "Error del
// servidor". Quiere saber "esto no es culpa mía, intento más tarde".
// ═══════════════════════════════════════════════════════════════

export const SERVICE_DOWN_MESSAGE =
  'Retta está temporalmente fuera de servicio. Estamos trabajando para resolverlo. Por favor intenta en unos minutos.';

export const NO_INTERNET_MESSAGE =
  'Sin conexión a internet. Revisa tu Wi-Fi o datos móviles y vuelve a intentar.';

/**
 * Detecta si una Response del backend indica que la infraestructura
 * está caída (Railway, Cloudflare, etc.) más que un error de aplicación.
 */
export function isInfraOutage(res: Response): boolean {
  // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
  if (res.status === 502 || res.status === 503 || res.status === 504) return true;

  // Railway sirve 404 con este header cuando el backend está caído
  if (res.headers.get('x-railway-fallback') === 'true') return true;

  // 404 en /api/* probablemente significa fallback de Railway
  // (nuestros endpoints siempre devuelven 200/4xx/5xx con JSON, nunca 404 HTML)
  if (res.status === 404) {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return true;
  }

  return false;
}

/**
 * Detecta si un Error capturado en catch es un problema de red
 * (no llegamos a hablar con el servidor) vs un error del propio servidor.
 */
export function isNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    err.name === 'TypeError'  // RN tira TypeError cuando fetch falla
  );
}

/**
 * Convierte cualquier error a un mensaje friendly para mostrar al usuario.
 * Si reconoce el patrón de infra/red, usa los mensajes amigables.
 * Si no, devuelve el mensaje original (que probablemente ya viene del backend).
 */
export function friendlyErrorMessage(err: any): string {
  if (!err) return SERVICE_DOWN_MESSAGE;

  // Errores marcados explícitamente como infra (los marcamos en useApi)
  if (err.isInfraOutage) return SERVICE_DOWN_MESSAGE;
  if (err.isNetworkError) return NO_INTERNET_MESSAGE;

  // Fallback: si el mensaje contiene texto típico de red, lo amigamos
  if (isNetworkError(err)) return NO_INTERNET_MESSAGE;

  return String(err.message || err);
}
