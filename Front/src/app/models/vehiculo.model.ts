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
  marca: string;
  modelo: string;
  color: string;
  tipo: TipoVehiculo;
  predeterminado: boolean;
}

/** Payload de `POST /api/vehiculos`. */
export type NuevoVehiculo = Omit<Vehiculo, 'id' | 'usuarioId'>;
