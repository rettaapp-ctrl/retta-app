// ─────────────────────────────────────────────────────────────
// Helpers de visibilidad de partidos.
// ─────────────────────────────────────────────────────────────

/**
 * Un partido se considera "visible" hasta 1 hora después de su hora_inicio.
 * A partir de ese cutoff, ya pasó y no se muestra en home ni reservas.
 *
 * @param fecha       'YYYY-MM-DD'
 * @param horaInicio  'HH:MM:SS' o 'HH:MM'
 */
export function isPartidoVisible(fecha: string, horaInicio: string): boolean {
  if (!fecha || !horaInicio) return true;
  const hora = horaInicio.length >= 5 ? horaInicio : `${horaInicio}:00`;
  const inicio = new Date(`${fecha}T${hora.length === 5 ? hora + ':00' : hora}`);
  if (isNaN(inicio.getTime())) return true;  // si no parsea, no filtramos por seguridad
  const cutoff = new Date(inicio.getTime() + 60 * 60 * 1000); // +1h
  return new Date() < cutoff;
}
