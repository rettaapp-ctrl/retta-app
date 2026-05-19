// ─────────────────────────────────────────────────────────────
// Helper para cancelación de inscripción a un partido.
// La política viene de los Términos de la app:
//   > 12h antes  → reembolso 100%
//   3-12h antes  → reembolso 60% (se retiene 40%)
//   < 3h antes   → sin reembolso
// ─────────────────────────────────────────────────────────────
import { Alert } from 'react-native';

export interface PartidoMin {
  id: string;
  fecha: string;        // YYYY-MM-DD
  hora_inicio: string;  // HH:MM:SS
  precio_jugador: number;
}

export interface ReembolsoInfo {
  porcentaje: 0 | 60 | 100;
  monto: number;
  mensaje: string;
  puedeCancelar: boolean;
  tooltip: string;  // copy corto para mostrar dentro del modal
}

export function calcularReembolso(
  fecha: string,
  horaInicio: string,
  precio: number
): ReembolsoInfo {
  const inicio = new Date(`${fecha}T${horaInicio}`);
  const ahora  = new Date();
  const horasFaltantes = (inicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  if (horasFaltantes <= 0) {
    return {
      porcentaje: 0,
      monto: 0,
      mensaje: 'El partido ya empezó. Ya no se puede cancelar tu lugar.',
      tooltip: '',
      puedeCancelar: false,
    };
  }

  if (horasFaltantes > 12) {
    return {
      porcentaje: 100,
      monto: precio,
      mensaje: `Recibirás reembolso completo de $${precio} MXN.`,
      tooltip: 'Reembolso completo',
      puedeCancelar: true,
    };
  }

  if (horasFaltantes >= 3) {
    const monto = Math.round(precio * 0.6);
    return {
      porcentaje: 60,
      monto,
      mensaje: `Recibirás $${monto} MXN (60% de $${precio}). Se retiene 40% por cancelar dentro de las 12 horas.`,
      tooltip: '60% de reembolso',
      puedeCancelar: true,
    };
  }

  return {
    porcentaje: 0,
    monto: 0,
    mensaje: 'Cancelar a menos de 3 horas del inicio NO aplica reembolso. El cargo es definitivo.',
    tooltip: 'Sin reembolso',
    puedeCancelar: true,
  };
}

// ─────────────────────────────────────────────────────────────
// Muestra Alert nativo de confirmación según política. Si el usuario
// confirma, ejecuta `onConfirm` (que típicamente llama al backend
// y refresca la lista).
// ─────────────────────────────────────────────────────────────
export function confirmarCancelacion(
  partido: PartidoMin,
  onConfirm: () => Promise<void> | void
) {
  const info = calcularReembolso(partido.fecha, partido.hora_inicio, partido.precio_jugador);

  if (!info.puedeCancelar) {
    Alert.alert('No se puede cancelar', info.mensaje);
    return;
  }

  Alert.alert(
    '¿Cancelar tu lugar?',
    info.mensaje,
    [
      { text: 'No, conservar', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => { onConfirm(); } },
    ]
  );
}
