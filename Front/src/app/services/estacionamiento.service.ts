import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Estacionamiento,
  FiltrosEstacionamiento,
  Id,
  NuevoEstacionamiento,
  OrdenEstacionamiento,
  ResumenDiario,
} from '../models';
import { ESTACIONAMIENTOS_MOCK, RESUMEN_DIARIO_MOCK } from './mocks/datos-mock';
import { clonar, simular, simularError } from './mocks/mock.util';

/** Acceso a `/api/estacionamientos`. */
@Injectable({ providedIn: 'root' })
export class EstacionamientoService {
  private readonly http = inject(HttpClient);
  private readonly ruta = '/estacionamientos';

  /** `GET /api/estacionamientos` */
  listar(filtros: FiltrosEstacionamiento = {}): Observable<Estacionamiento[]> {
    if (environment.usarMocks) {
      return simular(clonar(ESTACIONAMIENTOS_MOCK)).pipe(
        map((items) => aplicarFiltros(items, filtros)),
      );
    }

    return this.http
      .get<{ estacionamientos: Estacionamiento[] } | Estacionamiento[]>(this.ruta, {
        params: aParams(filtros),
      })
      .pipe(
        map((res) => (Array.isArray(res) ? res : res.estacionamientos ?? [])),
      );
  }

  /** `GET /api/estacionamientos/:id` */
  obtener(id: Id): Observable<any> {
    if (environment.usarMocks) {
      const encontrado = ESTACIONAMIENTOS_MOCK.find((e) => e.id === id);
      return encontrado
        ? simular(clonar(encontrado))
        : simularError<Estacionamiento>('Estacionamiento no encontrado');
    }

    return this.http.get<any>(`${this.ruta}/${id}`).pipe(
      map((res) => res.estacionamiento ?? res)
    );
  }

  /** `GET /api/estacionamientos?propietarioId=:id` */
  listarDelPropietario(propietarioId: Id): Observable<any[]> {
    if (environment.usarMocks) {
      return simular(clonar(ESTACIONAMIENTOS_MOCK.filter((e) => e.propietarioId === propietarioId)));
    }

    return this.http.get<any>(this.ruta, {
      params: new HttpParams().set('propietarioId', propietarioId),
    }).pipe(
      map((res) => (Array.isArray(res) ? res : res.estacionamientos ?? []))
    );
  }

  /** `POST /api/estacionamientos` */
  crear(datos: NuevoEstacionamiento): Observable<any> {
    if (environment.usarMocks) {
      return simular<Estacionamiento>({
        ...datos,
        id: `est-${crypto.randomUUID()}`,
        propietarioId: 'usr-propietario-1',
        cocherasTotales: 0,
        cocherasDisponibles: 0,
        calificacion: 0,
      });
    }

    return this.http.post<any>(this.ruta, datos).pipe(
      map((res) => res.estacionamiento ?? res)
    );
  }

  /** `GET /api/estacionamientos/:id/resumen-diario` (KPIs del panel). */
  resumenDiario(id: Id): Observable<ResumenDiario> {
    if (environment.usarMocks) {
      const resumen = RESUMEN_DIARIO_MOCK[id];
      return resumen
        ? simular(resumen())
        : simular<ResumenDiario>({
            estacionamientoId: id,
            reservasHoy: 0,
            cocherasLibres: 0,
            ingresosDelDia: 0,
            actualizadoEn: new Date().toISOString(),
          });
    }

    return this.http.get<ResumenDiario>(`${this.ruta}/${id}/resumen-diario`);
  }

  /** `PATCH /api/estacionamientos/:id` */
  actualizar(id: Id, cambios: Partial<NuevoEstacionamiento>): Observable<Estacionamiento> {
    if (environment.usarMocks) {
      const base = ESTACIONAMIENTOS_MOCK.find((e) => e.id === id);
      return base
        ? simular({ ...clonar(base), ...cambios })
        : simularError<Estacionamiento>('Estacionamiento no encontrado');
    }

    return this.http.patch<Estacionamiento>(`${this.ruta}/${id}`, cambios);
  }
}

/* --------------------------- helpers de filtrado --------------------------- */

const COMPARADORES: Record<OrdenEstacionamiento, (a: Estacionamiento, b: Estacionamiento) => number> =
  {
    DISTANCIA: (a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity),
    PRECIO: (a, b) => a.precioPorHora - b.precioPorHora,
    CALIFICACION: (a, b) => b.calificacion - a.calificacion,
  };

/** Replica en el front lo que hara el backend con los query params. */
export function aplicarFiltros(
  items: Estacionamiento[],
  filtros: FiltrosEstacionamiento,
): Estacionamiento[] {
  const texto = filtros.busqueda?.trim().toLowerCase() ?? '';

  const filtrados = items.filter((est) => {
    if (texto) {
      const objetivo =
        `${est.nombre} ${est.direccion.calle} ${est.direccion.ciudad} ${est.descripcion}`.toLowerCase();
      if (!objetivo.includes(texto)) return false;
    }
    if (filtros.tipoVehiculo && !est.tiposAdmitidos.includes(filtros.tipoVehiculo)) return false;
    if (filtros.precioMaximo != null && est.precioPorHora > filtros.precioMaximo) return false;
    if (filtros.soloCubiertos && !est.cubierto) return false;
    if (filtros.soloDisponibles && est.cocherasDisponibles === 0) return false;
    return est.activo;
  });

  return filtrados.sort(COMPARADORES[filtros.orden ?? 'DISTANCIA']);
}

function aParams(filtros: FiltrosEstacionamiento): HttpParams {
  let params = new HttpParams();
  if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
  if (filtros.tipoVehiculo) params = params.set('tipoVehiculo', filtros.tipoVehiculo);
  if (filtros.precioMaximo != null) params = params.set('precioMaximo', filtros.precioMaximo);
  if (filtros.soloCubiertos) params = params.set('cubierto', true);
  if (filtros.soloDisponibles) params = params.set('disponibles', true);
  if (filtros.orden) params = params.set('orden', filtros.orden);
  return params;
}
