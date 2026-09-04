import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cochera, EstadoCochera, Id, NuevaCochera, ResumenOcupacion } from '../models';
import { COCHERAS_MOCK } from './mocks/datos-mock';
import { clonar, simular, simularError } from './mocks/mock.util';

/** Acceso a `/api/cocheras` y a la ocupacion por estacionamiento. */
@Injectable({ providedIn: 'root' })
export class CocheraService {
  private readonly http = inject(HttpClient);
  private readonly ruta = '/cocheras';

  /** `GET /api/estacionamientos/:id/cocheras` */
  listarPorEstacionamiento(estacionamientoId: Id): Observable<Cochera[]> {
    if (environment.usarMocks) {
      return simular(clonar(COCHERAS_MOCK.filter((c) => c.estacionamientoId === estacionamientoId)));
    }

    return this.http.get<Cochera[]>(`/estacionamientos/${estacionamientoId}/cocheras`);
  }

  /** `GET /api/estacionamientos/:id/ocupacion` */
  resumenOcupacion(estacionamientoId: Id): Observable<ResumenOcupacion> {
    if (environment.usarMocks) {
      return this.listarPorEstacionamiento(estacionamientoId).pipe(
        map((cocheras) => calcularOcupacion(estacionamientoId, cocheras)),
      );
    }

    return this.http.get<ResumenOcupacion>(`/estacionamientos/${estacionamientoId}/ocupacion`);
  }

  /** `PATCH /api/cocheras/:id` */
  cambiarEstado(id: Id, estado: EstadoCochera): Observable<Cochera> {
    if (environment.usarMocks) {
      const base = COCHERAS_MOCK.find((c) => c.id === id);
      return base
        ? simular({ ...clonar(base), estado })
        : simularError<Cochera>('Cochera no encontrada');
    }

    return this.http.patch<Cochera>(`${this.ruta}/${id}`, { estado });
  }

  /** `POST /api/cocheras` */
  crear(datos: NuevaCochera): Observable<Cochera> {
    if (environment.usarMocks) {
      return simular<Cochera>({ ...datos, id: `coc-${crypto.randomUUID()}` });
    }

    return this.http.post<Cochera>(this.ruta, datos);
  }
}

/** Mismo agregado que devolvera el endpoint de ocupacion. */
export function calcularOcupacion(
  estacionamientoId: Id,
  cocheras: Cochera[],
): ResumenOcupacion {
  const contar = (estado: EstadoCochera) => cocheras.filter((c) => c.estado === estado).length;
  const total = cocheras.length;
  const ocupadas = contar('OCUPADA');
  const reservadas = contar('RESERVADA');

  return {
    estacionamientoId,
    total,
    libres: contar('LIBRE'),
    ocupadas,
    reservadas,
    mantenimiento: contar('MANTENIMIENTO'),
    porcentajeOcupacion: total === 0 ? 0 : Math.round(((ocupadas + reservadas) / total) * 100),
  };
}
