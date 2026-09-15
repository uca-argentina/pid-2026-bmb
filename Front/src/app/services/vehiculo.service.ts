import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { CambiosVehiculo, Id, NuevoVehiculo, Vehiculo } from '@app/models';
import { VehiculoDto } from './api/api.dto';
import { aPayloadCambiosVehiculo, aPayloadVehiculo, aVehiculo } from './api/api.mapeo';
import { ID_CONDUCTOR, VEHICULOS_MOCK } from './mocks/datos-mock';
import { clonar, simular, simularError } from './mocks/mock.util';

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

  /**
   * Un vehiculo por id. El backend no expone el detalle, asi que se resuelve
   * sobre la lista del conductor: es la que usa el editor para precargarse.
   */
  obtener(id: Id): Observable<Vehiculo | undefined> {
    return this.listarMisVehiculos().pipe(map((vehiculos) => vehiculos.find((v) => v.id === id)));
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

  /** `PATCH /api/vehiculos/:id` */
  actualizar(vehiculo: Vehiculo, cambios: CambiosVehiculo): Observable<Vehiculo> {
    if (environment.usarMocks) {
      return simular<Vehiculo>({
        ...clonar(vehiculo),
        patente: cambios.patente ?? vehiculo.patente,
        tipo: cambios.tipo ?? vehiculo.tipo,
        marca: cambios.marca ?? vehiculo.marca,
        modelo: cambios.modelo ?? vehiculo.modelo,
        color: cambios.color ?? vehiculo.color,
        predeterminado: cambios.predeterminado ?? vehiculo.predeterminado,
      });
    }

    return this.http
      .patch<{ vehiculo: VehiculoDto }>(rutaVehiculo(this.ruta, vehiculo), aPayloadCambiosVehiculo(cambios))
      .pipe(map(({ vehiculo }) => aVehiculo(vehiculo)));
  }

  /** `DELETE /api/vehiculos/:id` (baja logica: deja de aparecer en el listado) */
  eliminar(vehiculo: Vehiculo): Observable<Vehiculo> {
    if (environment.usarMocks) {
      return vehiculo.usuarioId === ID_CONDUCTOR
        ? simular<Vehiculo>({ ...clonar(vehiculo), activo: false })
        : simularError<Vehiculo>('El vehiculo no existe');
    }

    return this.http
      .delete<{ vehiculo: VehiculoDto }>(rutaVehiculo(this.ruta, vehiculo))
      .pipe(map(({ vehiculo }) => aVehiculo(vehiculo)));
  }
}

function rutaVehiculo(base: string, vehiculo: Vehiculo): string {
  return `${base}/${vehiculo.id}`;
}
