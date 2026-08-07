// ═════════════════════════════════════════════════════════════
// RETTA — components/BalonIcon.tsx
//
// EL balón de la app (Rafael, 2026-08-07). Las versiones dibujadas a
// mano se veían de baja calidad; el glifo football-outline de Ionicons
// es el único que se usa. Cualquier pantalla que necesite un balón lo
// importa de aquí — no se dibuja otro nunca más.
//
//   size  → 26 por defecto (el del perfil, arriba de PARTIDOS JUGADOS)
//   color → lavanda de acento por defecto
// ═════════════════════════════════════════════════════════════
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { DT } from '@/constants/designTokens';

export default function BalonIcon({
  size  = 26,
  color = DT.primary,
}: {
  size?:  number;
  color?: string;
}) {
  return <Ionicons name="football-outline" size={size} color={color} />;
}
