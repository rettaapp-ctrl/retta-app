// ─────────────────────────────────────────────────────────────
// Helpers de visibilidad de partidos.
// ─────────────────────────────────────────────────────────────

// Convierte fecha 'YYYY-MM-DD' + hora 'HH:MM' o 'HH:MM:SS' en Date local.
// Devuelve null si el parseo falla (para que el caller no filtre por error).
function parseFechaHora(fecha: string, horaInicio: string): Date | null {
  if (!fecha || !horaInicio) return null;
  const m = horaInicio.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const horaNorm = `${m[1].padStart(2, '0')}:${m[2]}`;
  const d = new Date(`${fecha}T${horaNorm}:00`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Un partido se considera "visible" hasta 1 hora después de su hora_inicio.
 * A partir de ese cutoff, ya pasó y no se muestra en home ni reservas.
 *
 * Uso: Mis Rettas — el usuario ya está inscrito, la ventana de 1h le sirve
 * para revisar detalles mientras está jugando o justo después.
 *
 * @param fecha       'YYYY-MM-DD'
 * @param horaInicio  'HH:MM:SS' o 'HH:MM'
 */
export function isPartidoVisible(fecha: string, horaInicio: string): boolean {
  const inicio = parseFechaHora(fecha, horaInicio);
  if (!inicio) return true; // si no parsea, no filtramos por seguridad
  const cutoff = new Date(inicio.getTime() + 60 * 60 * 1000); // +1h
  return new Date() < cutoff;
}

/**
 * Un partido está "disponible para unirse" hasta su hora_inicio exacta.
 * SIN ventana de gracia — el backend rechaza inscripción una vez pasada
 * la hora, así que en Explorar no tiene sentido mostrar partidos que ya
 * empezaron: el usuario intentaría unirse y le saldría el error
 * "El partido ya empezó".
 *
 * Uso: Explorar (feed de partidos abiertos para inscripción).
 */
export function isPartidoUnible(fecha: string, horaInicio: string): boolean {
  const inicio = parseFechaHora(fecha, horaInicio);
  if (!inicio) return true;
  return new Date() < inicio;
}
