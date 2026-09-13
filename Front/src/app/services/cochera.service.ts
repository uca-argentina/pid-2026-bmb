import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cochera, EstadoCochera, Id, NuevaCochera } from '../models';
import { CocheraDto } from './api/api.dto';
import { aCochera, aPayloadCochera } from './api/api.mapeo';
import { COCHERAS_MOCK } from './mocks/datos-mock';
import { clonar, simular } from './mocks/mock.util';

/** Cocheras de un estacionamiento: `/api/estacionamientos/:id/cocheras`. */
@Injectable({ providedIn: 'root' })
export class CocheraService {
  private readonly http = inject(HttpClient);

  /** `GET /api/estacionamientos/:id/cocheras` */
  listarPorEstacionamiento(estacionamientoId: Id): Observable<Cochera[]> {
    if (environment.usarMocks) {
      return simular(clonar(COCHERAS_MOCK.filter((c) => c.estacionamientoId === estacionamientoId)));
    }

    return this.http
      .get<{ cocheras: CocheraDto[] }>(rutaCocheras(estacionamientoId))
      .pipe(map(({ cocheras }) => cocheras.map(aCochera)));
  }

  /** `PATCH /api/estacionamientos/:id/cocheras/:idCochera` */
  cambiarEstado(cochera: Cochera, estado: EstadoCochera): Observable<Cochera> {
    if (environment.usarMocks) {
      return simular({ ...clonar(cochera), estado });
    }

    return this.http
      .patch<{ cochera: CocheraDto }>(`${rutaCocheras(cochera.estacionamientoId)}/${cochera.id}`, {
        estado_actual: estado,
      })
      .pipe(map((respuesta) => aCochera(respuesta.cochera)));
  }

  /** `POST /api/estacionamientos/:id/cocheras` */
  crear(datos: NuevaCochera): Observable<Cochera> {
    if (environment.usarMocks) {
      return simular<Cochera>({
        id: `coc-${crypto.randomUUID()}`,
        estacionamientoId: datos.estacionamientoId,
        identificador: datos.identificador,
        sector: datos.sector ?? '',
        tipoVehiculo: datos.tipoVehiculo,
        cubierta: datos.cubierta ?? false,
        estado: datos.estado ?? 'LIBRE',
      });
    }

    return this.http
      .post<{ cochera: CocheraDto }>(rutaCocheras(datos.estacionamientoId), aPayloadCochera(datos))
      .pipe(map((respuesta) => aCochera(respuesta.cochera)));
  }
}

function rutaCocheras(estacionamientoId: Id): string {
  return `/estacionamientos/${estacionamientoId}/cocheras`;
}
