import { Cochera } from '@app/models';

/**
 * Fotos de cocheras que vienen con el proyecto (`public/cocheras/`).
 *
 * Es decoracion, no un dato de la cochera: la API no guarda imagenes. La foto
 * sale de los mismos atributos que la fila ya muestra al lado --el detalle
 * (`Cubierta · Camioneta`) y la etiqueta de estado--, asi la imagen nunca
 * contradice al texto.
 */
const DESCUBIERTA = 'cocheras/descubierta.jpg';
const CUBIERTA_CAMIONETA = 'cocheras/cubierta-camioneta.jpg';
const CUBIERTA_LIBRE = 'cocheras/cubierta-libre.jpg';
const CUBIERTA_OCUPADA = 'cocheras/cubierta-ocupada.jpg';

/** La foto que corresponde a la cochera. */
export function fotoDeCochera(cochera: Cochera): string {
  // Al aire libre manda el playon: no se distinguen boxes ni estado.
  if (!cochera.cubierta) return DESCUBIERTA;

  // El box de camioneta es notoriamente mas ancho, gana sobre el estado.
  if (cochera.tipoVehiculo === 'CAMIONETA') return CUBIERTA_CAMIONETA;

  // Libre muestra el box vacio; con la cochera tomada, el garaje con autos.
  return cochera.estado === 'LIBRE' ? CUBIERTA_LIBRE : CUBIERTA_OCUPADA;
}
