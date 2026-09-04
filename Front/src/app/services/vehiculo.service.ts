import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Id, NuevoVehiculo, Vehiculo } from '../models';
import { ID_CONDUCTOR, VEHICULOS_MOCK } from './mocks/datos-mock';
import { clonar, simular } from './mocks/mock.util';

/** Acceso a `/api/vehiculos` (vehiculos del conductor autenticado). */
@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private readonly http = inject(HttpClient);
  private readonly ruta = '/vehiculos';

  /** `GET /api/vehiculos` */
  listarMisVehiculos(): Observable<Vehiculo[]> {
    if (environment.usarMocks) {
      // El backend filtra por el conductor autenticado (token JWT).
      return simular(clonar(VEHICULOS_MOCK.filter((v) => v.usuarioId === ID_CONDUCTOR)));
    }

    return this.http.get<Vehiculo[]>(this.ruta);
  }

  /** `GET /api/vehiculos/:id` */
  obtener(id: Id): Observable<Vehiculo> {
    if (environment.usarMocks) {
      return simular(clonar(VEHICULOS_MOCK.find((v) => v.id === id) ?? VEHICULOS_MOCK[0]));
    }

    return this.http.get<Vehiculo>(`${this.ruta}/${id}`);
  }

  /** `POST /api/vehiculos` */
  crear(datos: NuevoVehiculo): Observable<Vehiculo> {
    if (environment.usarMocks) {
      return simular<Vehiculo>({
        ...datos,
        id: `veh-${crypto.randomUUID()}`,
        usuarioId: ID_CONDUCTOR,
      });
    }

    return this.http.post<Vehiculo>(this.ruta, datos);
  }

  /** `DELETE /api/vehiculos/:id` */
  eliminar(id: Id): Observable<void> {
    if (environment.usarMocks) {
      return simular(undefined as void);
    }

    return this.http.delete<void>(`${this.ruta}/${id}`);
  }
}
