// ─────────────────────────────────────────────────────────────
// Apertura de la app de mapas con un query (dirección o nombre).
//
// Android: usa el URI `geo:` que dispara el "App Chooser" del sistema
//   → el usuario elige entre Google Maps, Waze, etc.
// iOS: muestra un ActionSheet nativo con Apple Maps, Google Maps y Waze
//   (iOS no tiene chooser de mapas como Android).
// ─────────────────────────────────────────────────────────────
import { ActionSheetIOS, Linking, Platform } from 'react-native';

const fallbackWebUrl = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

async function tryOpen(primaryUrl: string, fallback: string) {
  try {
    const can = await Linking.canOpenURL(primaryUrl);
    await Linking.openURL(can ? primaryUrl : fallback);
  } catch {
    try { await Linking.openURL(fallback); } catch {}
  }
}

function urlsFor(query: string) {
  const q = encodeURIComponent(query.trim());
  return {
    appleMaps:    `maps://?q=${q}`,
    googleMapsApp:`comgooglemaps://?q=${q}&zoom=16`,
    googleMapsWeb:`https://www.google.com/maps/search/?api=1&query=${q}`,
    waze:         `waze://?q=${q}&navigate=yes`,
    wazeWeb:      `https://www.waze.com/ul?q=${q}&navigate=yes`,
    geoAndroid:   `geo:0,0?q=${q}`,
  };
}

export async function openMaps(query: string) {
  if (!query?.trim()) return;
  const fallback = fallbackWebUrl(query);
  const u = urlsFor(query);

  if (Platform.OS === 'android') {
    // El URI geo: dispara automáticamente el selector de apps del sistema
    // si el usuario tiene más de una app de mapas instalada.
    return tryOpen(u.geoAndroid, fallback);
  }

  if (Platform.OS === 'ios') {
    // ActionSheet nativo con las 3 apps más comunes.
    const options = ['Apple Maps', 'Google Maps', 'Waze', 'Cancelar'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title:        '¿Cómo quieres llegar?',
        options,
        cancelButtonIndex: 3,
      },
      async (idx) => {
        if (idx === 0) await tryOpen(u.appleMaps,     fallback);
        if (idx === 1) await tryOpen(u.googleMapsApp, u.googleMapsWeb);
        if (idx === 2) await tryOpen(u.waze,          u.wazeWeb);
      }
    );
    return;
  }

  // Web/desktop fallback
  await Linking.openURL(fallback);
}

/**
 * Construye query de búsqueda para mapas:
 * - Si hay dirección guardada → usar SOLO la dirección (más preciso, GPS llega exacto).
 * - Si NO hay dirección → fallback a nombre + ciudad (búsqueda por nombre).
 *
 * Mezclar dirección + nombre del complejo confunde al GPS porque el nombre
 * del complejo no es entidad reconocible y baja la precisión del match.
 */
export function buildMapQuery(complejoNombre?: string, ciudad?: string, direccion?: string) {
  if (direccion?.trim()) return direccion.trim();
  return [complejoNombre, ciudad].filter(Boolean).join(', ');
}
