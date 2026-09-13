import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BORRADOR_VACIO,
  BorradorReserva,
  ConsultaDisponibilidad,
  FechaISO,
  FRANJAS_ESTANDAR,
  FranjaDisponible,
  Id,
  NuevaReserva,
  Reserva,
  ReservaDetallada,
} from '../models';
import { duracionEnHoras } from '../utils/fecha.util';
import { FranjaDto, ReservaDto } from './api/api.dto';
import { ID_TIPO_VEHICULO, aFranja, aPayloadReserva, aReserva } from './api/api.mapeo';
import {
  COCHERAS_MOCK,
  ESTACIONAMIENTOS_MOCK,
  ID_CONDUCTOR,
  RESERVAS_MOCK,
  VEHICULOS_MOCK,
} from './mocks/datos-mock';
import { clonar, simular, simularError } from './mocks/mock.util';

/**
 * Acceso a `/api/reservas` mas el estado del wizard de reserva.
 * El borrador vive en un signal para que los tres pasos del flujo compartan
 * la misma seleccion sin pasarse inputs entre rutas.
 */
@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly http = inject(HttpClient);
  private readonly ruta = '/reservas';

  private readonly borradorInterno = signal<BorradorReserva>({ ...BORRADOR_VACIO });

  readonly borrador = this.borradorInterno.asReadonly();

  readonly duracionHoras = computed(() => {
    const { horaDesde, horaHasta } = this.borradorInterno();
    return horaDesde && horaHasta ? duracionEnHoras(horaDesde, horaHasta) : 0;
  });

  readonly borradorCompleto = computed(() => {
    const b = this.borradorInterno();
    return Boolean(b.estacionamientoId && b.vehiculoId && b.fecha && b.horaDesde && b.horaHasta);
  });

  /* ------------------------------ borrador ------------------------------ */

  iniciarBorrador(estacionamientoId: Id): void {
    this.borradorInterno.set({ ...BORRADOR_VACIO, estacionamientoId });
  }

  actualizarBorrador(cambios: Partial<BorradorReserva>): void {
    this.borradorInterno.update((actual) => ({ ...actual, ...cambios }));
  }

  reiniciarBorrador(): void {
    this.borradorInterno.set({ ...BORRADOR_VACIO });
  }

  /** Convierte el borrador en los datos de la nueva reserva. */
  aPayload(): NuevaReserva | null {
    const b = this.borradorInterno();
    if (!b.estacionamientoId || !b.vehiculoId || !b.fecha || !b.horaDesde || !b.horaHasta) {
      return null;
    }
    return {
      estacionamientoId: b.estacionamientoId,
      vehiculoId: b.vehiculoId,
      fecha: b.fecha,
      horaDesde: b.horaDesde,
      horaHasta: b.horaHasta,
    };
  }

  /* -------------------------------- API --------------------------------- */

  /** `GET /api/estacionamientos/:id/disponibilidad?fecha=YYYY-MM-DD` */
  disponibilidad(consulta: ConsultaDisponibilidad): Observable<FranjaDisponible[]> {
    if (environment.usarMocks) {
      return simular(generarFranjas(consulta.estacionamientoId, consulta.fecha));
    }

    let params = new HttpParams().set('fecha', consulta.fecha);
    if (consulta.tipoVehiculo) {
      params = params.set('id_tipo_vehiculo', ID_TIPO_VEHICULO[consulta.tipoVehiculo]);
    }

    return this.http
      .get<{ franjas: FranjaDto[] }>(
        `/estacionamientos/${consulta.estacionamientoId}/disponibilidad`,
        { params },
      )
      .pipe(map(({ franjas }) => franjas.map(aFranja)));
  }

  /** `POST /api/reservas` (el backend asigna la cochera) */
  crear(datos: NuevaReserva): Observable<Reserva> {
    if (environment.usarMocks) {
      const estacionamiento = ESTACIONAMIENTOS_MOCK.find((e) => e.id === datos.estacionamientoId);
      if (!estacionamiento) {
        return simularError<Reserva>('El estacionamiento ya no esta disponible');
      }
      const horas = duracionEnHoras(datos.horaDesde, datos.horaHasta);
      const cochera = COCHERAS_MOCK.find(
        (c) => c.estacionamientoId === datos.estacionamientoId && c.estado === 'LIBRE',
      );

      return simular<Reserva>({
        id: `res-${crypto.randomUUID()}`,
        conductorId: ID_CONDUCTOR,
        estacionamientoId: datos.estacionamientoId,
        cocheraId: cochera?.id ?? null,
        cocheraIdentificador: cochera?.identificador ?? null,
        vehiculoId: datos.vehiculoId,
        fecha: datos.fecha,
        horaDesde: datos.horaDesde,
        horaHasta: datos.horaHasta,
        estado: 'CONFIRMADA',
        precioTotal: Math.round(horas * estacionamiento.precioPorHora),
        creadaEn: new Date().toISOString(),
      });
    }

    return this.http
      .post<{ reserva: ReservaDto }>(this.ruta, aPayloadReserva(datos))
      .pipe(map(({ reserva }) => aReserva(reserva)));
  }

  /** `GET /api/reservas` (reservas del conductor autenticado) */
  listarMisReservas(): Observable<ReservaDetallada[]> {
    if (environment.usarMocks) {
      return simular(RESERVAS_MOCK.filter((r) => r.conductorId === ID_CONDUCTOR).map(expandir));
    }

    return this.http
      .get<{ reservas: ReservaDto[] }>(this.ruta)
      .pipe(map(({ reservas }) => reservas.map(aReserva)));
  }

  /**
   * `GET /api/estacionamientos/:id/reservas[?fecha=YYYY-MM-DD]` (vista del
   * propietario). Con `fecha` resuelve el bloque "Reservas de hoy" del panel.
   */
  listarPorEstacionamiento(estacionamientoId: Id, fecha?: FechaISO): Observable<ReservaDetallada[]> {
    if (environment.usarMocks) {
      return simular(
        RESERVAS_MOCK.filter(
          (r) => r.estacionamientoId === estacionamientoId && (!fecha || r.fecha === fecha),
        ).map(expandir),
      );
    }

    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;

    return this.http
      .get<{ reservas: ReservaDto[] }>(`/estacionamientos/${estacionamientoId}/reservas`, { params })
      .pipe(map(({ reservas }) => reservas.map(aReserva)));
  }

  /** `PATCH /api/reservas/:id/cancelar` */
  cancelar(id: Id): Observable<Reserva> {
    if (environment.usarMocks) {
      const reserva = RESERVAS_MOCK.find((r) => r.id === id);
      return reserva
        ? simular<Reserva>({ ...clonar(reserva), estado: 'CANCELADA' })
        : simularError<Reserva>('Reserva no encontrada');
    }

    return this.http
      .patch<{ reserva: ReservaDto }>(`${this.ruta}/${id}/cancelar`, {})
      .pipe(map(({ reserva }) => aReserva(reserva)));
  }

  /** Precio estimado del borrador segun la tarifa del estacionamiento. */
  precioEstimado(precioPorHora: number): number {
    return Math.round(this.duracionHoras() * precioPorHora);
  }
}

/* ------------------------------ helpers mock ------------------------------ */

/** Arma la vista expandida que el backend devuelve con los joins resueltos. */
function expandir(reserva: Reserva): ReservaDetallada {
  const estacionamiento = ESTACIONAMIENTOS_MOCK.find((e) => e.id === reserva.estacionamientoId)!;
  const vehiculo = VEHICULOS_MOCK.find((v) => v.id === reserva.vehiculoId)!;
  const cochera = COCHERAS_MOCK.find((c) => c.id === reserva.cocheraId);

  return {
    ...clonar(reserva),
    estacionamiento: {
      id: estacionamiento.id,
      nombre: estacionamiento.nombre,
      direccion: estacionamiento.direccion,
      precioPorHora: estacionamiento.precioPorHora,
    },
    vehiculo: {
      id: vehiculo.id,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      tipo: vehiculo.tipo,
    },
    cochera: cochera
      ? { id: cochera.id, identificador: cochera.identificador, sector: cochera.sector }
      : null,
  };
}

/** Disponibilidad estable por dia sobre las cuatro franjas del diseno. */
function generarFranjas(estacionamientoId: Id, fecha: FechaISO): FranjaDisponible[] {
  const semilla = [...`${estacionamientoId}${fecha}`].reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return FRANJAS_ESTANDAR.map((franja, i) => {
    const libres = (semilla + i * 5) % 7;
    return { ...franja, disponible: libres > 0, cocherasLibres: libres } satisfies FranjaDisponible;
  });
}
