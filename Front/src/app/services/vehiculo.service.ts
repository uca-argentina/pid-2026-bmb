import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { NuevoVehiculo, Vehiculo } from '@app/models';
import { VehiculoDto } from './api/api.dto';
import { aPayloadVehiculo, aVehiculo } from './api/api.mapeo';
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

    return this.http
      .get<{ vehiculos: VehiculoDto[] }>(this.ruta)
      .pipe(map(({ vehiculos }) => vehiculos.map(aVehiculo)));
  }

  /** `POST /api/vehiculos` */
  crear(datos: NuevoVehiculo): Observable<Vehiculo> {
    if (environment.usarMocks) {
      return simular<Vehiculo>({
        id: `veh-${crypto.randomUUID()}`,
        usuarioId: ID_CONDUCTOR,
        patente: datos.patente,
        marca: datos.marca ?? null,
        modelo: datos.modelo ?? null,
        color: datos.color ?? null,
        tipo: datos.tipo,
        predeterminado: datos.predeterminado ?? false,
        activo: true,
      });
    }

    return this.http
      .post<{ vehiculo: VehiculoDto }>(this.ruta, aPayloadVehiculo(datos))
      .pipe(map(({ vehiculo }) => aVehiculo(vehiculo)));
  }
}
