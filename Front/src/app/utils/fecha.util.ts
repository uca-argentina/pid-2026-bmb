import { DiaSemana, FechaISO, HoraHHmm } from '../models';

const DIAS: DiaSemana[] = [
  'DOMINGO',
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
];

/** `2026-09-04` a partir de un Date, sin corrimientos por zona horaria. */
export function aFechaISO(fecha: Date): FechaISO {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Interpreta `2026-09-04` como fecha local (no UTC). */
export function desdeFechaISO(fecha: FechaISO): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function diaSemanaDe(fecha: FechaISO): DiaSemana {
  return DIAS[desdeFechaISO(fecha).getDay()];
}

/** Los proximos `cantidad` dias a partir de hoy. */
export function proximosDias(cantidad: number, desde: Date = new Date()): Date[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(desde);
    fecha.setDate(desde.getDate() + i);
    return fecha;
  });
}

export function aMinutos(hora: HoraHHmm): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function aHora(minutos: number): HoraHHmm {
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Duracion en horas entre dos horarios de la misma jornada. */
export function duracionEnHoras(desde: HoraHHmm, hasta: HoraHHmm): number {
  return Math.max(0, (aMinutos(hasta) - aMinutos(desde)) / 60);
}

export function esHoy(fecha: FechaISO): boolean {
  return fecha === aFechaISO(new Date());
}
