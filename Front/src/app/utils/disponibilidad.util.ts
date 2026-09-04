import { TonoPunto } from '../components/ui/punto-estado/punto-estado';
import { EstadoCochera, FranjaAtencion, HoraHHmm } from '../models';

/**
 * Regla de disponibilidad del handoff:
 *   0 libres     -> ocupada  · "Sin lugares ahora"
 *   1-4 libres   -> baja     · "N cocheras libres"
 *   5 o mas      -> acento   · "N cocheras libres"
 */
export function tonoDisponibilidad(libres: number): TonoPunto {
  if (libres === 0) return 'ocupada';
  return libres < 5 ? 'baja' : 'acento';
}

export function textoDisponibilidad(libres: number): string {
  return libres === 0 ? 'Sin lugares ahora' : `${libres} cocheras libres`;
}

/** Color del punto en la cuadricula del propietario. */
export const TONO_ESTADO_COCHERA: Record<EstadoCochera, TonoPunto> = {
  LIBRE: 'acento',
  OCUPADA: 'ocupada',
  RESERVADA: 'reservada',
  MANTENIMIENTO: 'reservada',
};

/** `07 – 23 h`, o `24 h` cuando el estacionamiento no cierra. */
export function resumenHorario(horarios: FranjaAtencion[]): string {
  const franja = horarios[0];
  if (!franja) return 'Sin horario';
  if (esJornadaCompleta(franja.desde, franja.hasta)) return '24 h';
  return `${franja.desde.slice(0, 2)} – ${franja.hasta.slice(0, 2)} h`;
}

function esJornadaCompleta(desde: HoraHHmm, hasta: HoraHHmm): boolean {
  return desde === '00:00' && (hasta === '23:59' || hasta === '24:00');
}

/** `350 m` para distancias cortas, `1,2 km` para el resto. */
export function formatearDistancia(km: number | undefined): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString('es-AR', { maximumFractionDigits: 1 })} km`;
}
