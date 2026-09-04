import { FechaHoraISO, HoraHHmm, Id } from './api.model';
import { TipoVehiculo } from './vehiculo.model';

export type DiaSemana =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

export const DIAS_SEMANA: DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

export interface FranjaAtencion {
  dia: DiaSemana;
  desde: HoraHHmm;
  hasta: HoraHHmm;
}

export interface Direccion {
  calle: string;
  numero: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  latitud: number;
  longitud: number;
}

/** Estacionamiento publicado por un usuario con rol PROPIETARIO. */
export interface Estacionamiento {
  id: Id;
  /** FK -> Usuario.id (rol PROPIETARIO). */
  propietarioId: Id;
  nombre: string;
  descripcion: string;
  direccion: Direccion;
  telefonoContacto: string;
  emailContacto: string;
  horarios: FranjaAtencion[];
  precioPorHora: number;
  /** Derivados del agregado de Cochera, los calcula el backend. */
  cocherasTotales: number;
  cocherasDisponibles: number;
  tiposAdmitidos: TipoVehiculo[];
  cubierto: boolean;
  calificacion: number;
  /** Distancia al usuario en km. Solo viene en busquedas geolocalizadas. */
  distanciaKm?: number;
  activo: boolean;
}

/** Query params de `GET /api/estacionamientos`. */
export interface FiltrosEstacionamiento {
  busqueda?: string;
  tipoVehiculo?: TipoVehiculo | null;
  precioMaximo?: number | null;
  soloCubiertos?: boolean;
  soloDisponibles?: boolean;
  orden?: OrdenEstacionamiento;
}

export type OrdenEstacionamiento = 'DISTANCIA' | 'PRECIO' | 'CALIFICACION';

export const ETIQUETA_ORDEN: Record<OrdenEstacionamiento, string> = {
  DISTANCIA: 'Cercania',
  PRECIO: 'Precio',
  CALIFICACION: 'Puntaje',
};

/** Payload de `POST /api/estacionamientos`. */
export type NuevoEstacionamiento = Omit<
  Estacionamiento,
  'id' | 'propietarioId' | 'cocherasTotales' | 'cocherasDisponibles' | 'calificacion' | 'distanciaKm'
>;

export function direccionCorta(direccion: Direccion): string {
  return `${direccion.calle} ${direccion.numero}, ${direccion.ciudad}`;
}

/** KPIs del dia que muestra el panel del propietario. */
export interface ResumenDiario {
  estacionamientoId: Id;
  reservasHoy: number;
  cocherasLibres: number;
  ingresosDelDia: number;
  /** Timestamp del ultimo refresco ("Actualizado 9:38"). */
  actualizadoEn: FechaHoraISO;
}
