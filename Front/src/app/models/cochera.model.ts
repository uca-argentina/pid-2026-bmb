import { Id } from './api.model';
import { TipoVehiculo } from './vehiculo.model';

export type EstadoCochera = 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';

export const ETIQUETA_ESTADO_COCHERA: Record<EstadoCochera, string> = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  MANTENIMIENTO: 'Mantenimiento',
};

/** Cochera individual dentro de un Estacionamiento. */
export interface Cochera {
  id: Id;
  /** FK -> Estacionamiento.id. */
  estacionamientoId: Id;
  /** Identificador visible para el usuario: `A-01`, `B-14`. */
  identificador: string;
  sector: string;
  tipoVehiculo: TipoVehiculo;
  cubierta: boolean;
  estado: EstadoCochera;
  /** FK -> Reserva.id. Presente cuando el estado es RESERVADA u OCUPADA. */
  reservaActualId?: Id;
}

/** Agregado que devuelve `GET /api/estacionamientos/:id/ocupacion`. */
export interface ResumenOcupacion {
  estacionamientoId: Id;
  total: number;
  libres: number;
  ocupadas: number;
  reservadas: number;
  mantenimiento: number;
  /** Porcentaje 0-100. */
  porcentajeOcupacion: number;
}

/** Payload de `POST /api/cocheras`. */
export type NuevaCochera = Omit<Cochera, 'id' | 'reservaActualId'>;

/** Estados en el orden en que se muestran en los filtros del tablero. */
export const ESTADOS_COCHERA_ORDEN: { valor: EstadoCochera; etiqueta: string }[] = [
  { valor: 'LIBRE', etiqueta: 'Libres' },
  { valor: 'OCUPADA', etiqueta: 'Ocupadas' },
  { valor: 'RESERVADA', etiqueta: 'Reservadas' },
  { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento' },
];
