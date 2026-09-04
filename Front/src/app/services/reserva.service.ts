import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
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

  /** Convierte el borrador en el payload que espera el backend. */
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
    if (consulta.tipoVehiculo) params = params.set('tipoVehiculo', consulta.tipoVehiculo);

    return this.http.get<FranjaDisponible[]>(
      `/estacionamientos/${consulta.estacionamientoId}/disponibilidad`,
      { params },
    );
  }

  /** `POST /api/reservas` */
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
        vehiculoId: datos.vehiculoId,
        fecha: datos.fecha,
        horaDesde: datos.horaDesde,
        horaHasta: datos.horaHasta,
        estado: 'CONFIRMADA',
        precioTotal: Math.round(horas * estacionamiento.precioPorHora),
        creadaEn: new Date().toISOString(),
      });
    }

    return this.http.post<Reserva>(this.ruta, datos);
  }

  /** `GET /api/reservas` (reservas del conductor autenticado) */
  listarMisReservas(): Observable<ReservaDetallada[]> {
    if (environment.usarMocks) {
      return simular(RESERVAS_MOCK.filter((r) => r.conductorId === ID_CONDUCTOR).map(expandir));
    }

    return this.http.get<ReservaDetallada[]>(this.ruta);
  }

  /**
   * `GET /api/reservas?estacionamientoId=:id[&fecha=YYYY-MM-DD]` (vista del
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

    let params = new HttpParams().set('estacionamientoId', estacionamientoId);
    if (fecha) params = params.set('fecha', fecha);

    return this.http.get<ReservaDetallada[]>(this.ruta, { params });
  }

  /** `GET /api/reservas/:id` */
  obtener(id: Id): Observable<ReservaDetallada> {
    if (environment.usarMocks) {
      const reserva = RESERVAS_MOCK.find((r) => r.id === id);
      return reserva
        ? simular(expandir(reserva))
        : simularError<ReservaDetallada>('Reserva no encontrada');
    }

    return this.http.get<ReservaDetallada>(`${this.ruta}/${id}`);
  }

  /** `PATCH /api/reservas/:id/cancelar` */
  cancelar(id: Id): Observable<Reserva> {
    if (environment.usarMocks) {
      const reserva = RESERVAS_MOCK.find((r) => r.id === id);
      return reserva
        ? simular<Reserva>({
            ...clonar(reserva),
            estado: 'CANCELADA',
            canceladaEn: new Date().toISOString(),
          })
        : simularError<Reserva>('Reserva no encontrada');
    }

    return this.http.patch<Reserva>(`${this.ruta}/${id}/cancelar`, {});
  }

  /** Precio estimado del borrador segun la tarifa del estacionamiento. */
  precioEstimado(precioPorHora: number): number {
    return Math.round(this.duracionHoras() * precioPorHora);
  }
}

/* ------------------------------ helpers mock ------------------------------ */

/** Arma la vista expandida que el backend devolvera con los joins resueltos. */
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
