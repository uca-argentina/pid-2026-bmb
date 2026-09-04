import { aFechaISO } from '../../utils/fecha.util';
import {
  Cochera,
  EstadoCochera,
  Estacionamiento,
  Reserva,
  ResumenDiario,
  Usuario,
  Vehiculo,
} from '../../models';

/* -------------------------------------------------------------------------
   Datos de ejemplo tomados del handoff de diseno ("Claude design/README.md"),
   con la forma exacta que devolvera la API de Express.
   Se borran cuando `environment.usarMocks` pase a false.
------------------------------------------------------------------------- */

/** Las reservas de ejemplo se anclan al dia en curso para que el panel
    del propietario siempre muestre el bloque "Reservas de hoy". */
const HOY = aFechaISO(new Date());

export const ID_CONDUCTOR = 'usr-conductor-1';
export const ID_PROPIETARIO = 'usr-propietario-1';

export const USUARIOS_MOCK: Usuario[] = [
  {
    id: ID_CONDUCTOR,
    nombre: 'Martina',
    apellido: 'Álvarez',
    email: 'conductor@ucaio.com',
    telefono: '+54 9 11 5555 1234',
    rol: 'CONDUCTOR',
    fechaAlta: '2026-02-11T13:20:00.000Z',
    activo: true,
  },
  {
    id: ID_PROPIETARIO,
    nombre: 'Matias',
    apellido: 'Álvarez',
    email: 'propietario@ucaio.com',
    telefono: '+54 9 11 4444 8899',
    rol: 'PROPIETARIO',
    fechaAlta: '2025-11-03T09:00:00.000Z',
    activo: true,
  },
];

export const VEHICULOS_MOCK: Vehiculo[] = [
  {
    id: 'veh-1',
    usuarioId: ID_CONDUCTOR,
    patente: 'AB 123 CD',
    marca: 'Toyota',
    modelo: 'Corolla',
    color: 'Gris',
    tipo: 'AUTO',
    predeterminado: true,
  },
  {
    id: 'veh-2',
    usuarioId: ID_CONDUCTOR,
    patente: 'AA 984 XT',
    marca: 'Honda',
    modelo: 'CB 190',
    color: 'Negro',
    tipo: 'MOTO',
    predeterminado: false,
  },
  // Vehiculos de otros conductores: aparecen en las reservas del propietario.
  {
    id: 'veh-3',
    usuarioId: 'usr-conductor-2',
    patente: 'OP 771 LM',
    marca: 'Volkswagen',
    modelo: 'Amarok',
    color: 'Blanco',
    tipo: 'CAMIONETA',
    predeterminado: true,
  },
  {
    id: 'veh-4',
    usuarioId: 'usr-conductor-3',
    patente: 'JU 402 QR',
    marca: 'Peugeot',
    modelo: '208',
    color: 'Azul',
    tipo: 'AUTO',
    predeterminado: true,
  },
];

export const ESTACIONAMIENTOS_MOCK: Estacionamiento[] = [
  {
    id: 'est-1',
    propietarioId: ID_PROPIETARIO,
    nombre: 'Cochera Belgrano',
    descripcion: 'Cochera cubierta con acceso directo por Av. Belgrano.',
    direccion: {
      calle: 'Av. Belgrano',
      numero: '1240',
      ciudad: 'CABA',
      provincia: 'Buenos Aires',
      codigoPostal: 'C1093',
      latitud: -34.6118,
      longitud: -58.3833,
    },
    telefonoContacto: '+54 11 4311 2200',
    emailContacto: 'belgrano@ucaio.com',
    horarios: [
      { dia: 'LUNES', desde: '07:00', hasta: '23:00' },
      { dia: 'MARTES', desde: '07:00', hasta: '23:00' },
      { dia: 'MIERCOLES', desde: '07:00', hasta: '23:00' },
      { dia: 'JUEVES', desde: '07:00', hasta: '23:00' },
      { dia: 'VIERNES', desde: '07:00', hasta: '23:00' },
    ],
    precioPorHora: 900,
    cocherasTotales: 12,
    cocherasDisponibles: 12,
    tiposAdmitidos: ['AUTO', 'MOTO'],
    cubierto: true,
    calificacion: 4.8,
    distanciaKm: 0.35,
    activo: true,
  },
  {
    id: 'est-2',
    propietarioId: ID_PROPIETARIO,
    nombre: 'Playa Estación Sur',
    descripcion: 'Playa abierta las 24 horas, junto a la estacion.',
    direccion: {
      calle: 'Rivadavia',
      numero: '88',
      ciudad: 'CABA',
      provincia: 'Buenos Aires',
      codigoPostal: 'C1002',
      latitud: -34.6092,
      longitud: -58.3789,
    },
    telefonoContacto: '+54 11 4890 7711',
    emailContacto: 'sur@ucaio.com',
    horarios: [{ dia: 'LUNES', desde: '00:00', hasta: '23:59' }],
    precioPorHora: 750,
    cocherasTotales: 20,
    cocherasDisponibles: 3,
    tiposAdmitidos: ['AUTO', 'CAMIONETA'],
    cubierto: false,
    calificacion: 4.2,
    distanciaKm: 0.7,
    activo: true,
  },
  {
    id: 'est-3',
    propietarioId: 'usr-propietario-2',
    nombre: 'Subsuelo Torre Norte',
    descripcion: 'Subsuelo con vigilancia permanente.',
    direccion: {
      calle: 'San Martín',
      numero: '455',
      ciudad: 'CABA',
      provincia: 'Buenos Aires',
      codigoPostal: 'C1004',
      latitud: -34.6032,
      longitud: -58.3722,
    },
    telefonoContacto: '+54 11 4832 5566',
    emailContacto: 'norte@ucaio.com',
    horarios: [{ dia: 'LUNES', desde: '08:00', hasta: '20:00' }],
    precioPorHora: 1150,
    cocherasTotales: 26,
    cocherasDisponibles: 0,
    tiposAdmitidos: ['AUTO', 'CAMIONETA'],
    cubierto: true,
    calificacion: 4.5,
    distanciaKm: 1.2,
    activo: true,
  },
  {
    id: 'est-4',
    propietarioId: 'usr-propietario-2',
    nombre: 'Garaje Los Tilos',
    descripcion: 'Garaje de barrio con lugares para moto y auto.',
    direccion: {
      calle: 'Mitre',
      numero: '2103',
      ciudad: 'CABA',
      provincia: 'Buenos Aires',
      codigoPostal: 'C1039',
      latitud: -34.6055,
      longitud: -58.4001,
    },
    telefonoContacto: '+54 11 4785 0044',
    emailContacto: 'tilos@ucaio.com',
    horarios: [{ dia: 'LUNES', desde: '06:00', hasta: '22:00' }],
    precioPorHora: 680,
    cocherasTotales: 30,
    cocherasDisponibles: 21,
    tiposAdmitidos: ['MOTO', 'AUTO'],
    cubierto: false,
    calificacion: 4.0,
    distanciaKm: 1.8,
    activo: true,
  },
];

/** A1-A6 y B1-B6 en el orden de estados que define el handoff. */
const ESTADOS_BELGRANO: EstadoCochera[] = [
  'LIBRE',
  'OCUPADA',
  'RESERVADA',
  'LIBRE',
  'LIBRE',
  'RESERVADA',
  'OCUPADA',
  'LIBRE',
  'LIBRE',
  'OCUPADA',
  'LIBRE',
  'RESERVADA',
];

export const COCHERAS_MOCK: Cochera[] = ESTADOS_BELGRANO.map((estado, i) => {
  const sector = i < 6 ? 'A' : 'B';
  const numero = (i % 6) + 1;
  return {
    id: `est-1-coc-${sector}${numero}`,
    estacionamientoId: 'est-1',
    identificador: `${sector}${numero}`,
    sector,
    tipoVehiculo: i % 4 === 3 ? 'MOTO' : 'AUTO',
    cubierta: true,
    estado,
    reservaActualId: estado === 'LIBRE' ? undefined : 'res-1',
  } satisfies Cochera;
});

export const RESUMEN_DIARIO_MOCK: Record<string, () => ResumenDiario> = {
  'est-1': () => ({
    estacionamientoId: 'est-1',
    reservasHoy: 9,
    cocherasLibres: 6,
    ingresosDelDia: 8100,
    // El backend devuelve el momento del ultimo refresco.
    actualizadoEn: new Date().toISOString(),
  }),
};

export const RESERVAS_MOCK: Reserva[] = [
  {
    id: 'res-1',
    conductorId: ID_CONDUCTOR,
    estacionamientoId: 'est-1',
    cocheraId: 'est-1-coc-A2',
    vehiculoId: 'veh-1',
    fecha: HOY,
    horaDesde: '10:00',
    horaHasta: '13:00',
    estado: 'EN_CURSO',
    precioTotal: 2700,
    creadaEn: '2026-09-03T18:41:00.000Z',
  },
  {
    id: 'res-2',
    conductorId: 'usr-conductor-2',
    estacionamientoId: 'est-1',
    cocheraId: 'est-1-coc-A6',
    vehiculoId: 'veh-3',
    fecha: HOY,
    horaDesde: '13:00',
    horaHasta: '15:30',
    estado: 'CONFIRMADA',
    precioTotal: 2250,
    creadaEn: '2026-09-03T20:02:00.000Z',
  },
  {
    id: 'res-3',
    conductorId: 'usr-conductor-3',
    estacionamientoId: 'est-1',
    cocheraId: 'est-1-coc-B3',
    vehiculoId: 'veh-4',
    fecha: HOY,
    horaDesde: '16:00',
    horaHasta: '20:00',
    estado: 'CONFIRMADA',
    precioTotal: 3600,
    creadaEn: '2026-09-03T21:15:00.000Z',
  },
  {
    id: 'res-4',
    conductorId: ID_CONDUCTOR,
    estacionamientoId: 'est-4',
    cocheraId: null,
    vehiculoId: 'veh-2',
    fecha: '2026-08-28',
    horaDesde: '17:00',
    horaHasta: '21:00',
    estado: 'FINALIZADA',
    precioTotal: 2720,
    creadaEn: '2026-08-27T15:05:00.000Z',
  },
];
