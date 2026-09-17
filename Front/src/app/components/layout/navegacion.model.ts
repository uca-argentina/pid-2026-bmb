import { NombreIcono } from '@app/components/ui';

/** Item de navegacion compartido por la tab bar mobile y el sidebar desktop. */
export interface ItemNavegacion {
  ruta: string;
  etiqueta: string;
  icono: NombreIcono;
}
