import { Id } from './api.model';

export type TipoVehiculo = 'AUTO' | 'CAMIONETA' | 'MOTO';

export const ETIQUETA_TIPO_VEHICULO: Record<TipoVehiculo, string> = {
  AUTO: 'Auto',
  CAMIONETA: 'Camioneta',
  MOTO: 'Moto',
};

/** Vehiculo registrado por un usuario con rol CONDUCTOR. */
export interface Vehiculo {
  id: Id;
  /** FK -> Usuario.id (rol CONDUCTOR). */
  usuarioId: Id;
  patente: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  tipo: TipoVehiculo;
  /** Se preselecciona al reservar. Como mucho uno por conductor. */
  predeterminado: boolean;
  activo: boolean;
}

/** Payload de `POST /api/vehiculos`. */
export interface NuevoVehiculo {
  patente: string;
  tipo: TipoVehiculo;
  marca?: string | null;
  modelo?: string | null;
  color?: string | null;
  predeterminado?: boolean;
}
