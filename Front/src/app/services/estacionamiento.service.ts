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
} from '../models';
import { EstacionamientoDto } from './api/api.dto';
import { ID_TIPO_VEHICULO, aEstacionamiento, aPayloadEstacionamiento } from './api/api.mapeo';
import { ESTACIONAMIENTOS_MOCK, ID_PROPIETARIO } from './mocks/datos-mock';
import { clonar, simular, simularError } from './mocks/mock.util';

/** La API acepta hasta 100 resultados por pagina. */
const LIMITE_BUSQUEDA = 100;

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
      .get<{ estacionamientos: EstacionamientoDto[] }>(this.ruta, { params: aParams(filtros) })
      .pipe(
        map(({ estacionamientos }) => estacionamientos.map(aEstacionamiento)),
        map((items) => aplicarFiltrosLocales(items, filtros)),
      );
  }

  /** `GET /api/estacionamientos/:id` */
  obtener(id: Id): Observable<Estacionamiento> {
    if (environment.usarMocks) {
      const encontrado = ESTACIONAMIENTOS_MOCK.find((e) => e.id === id);
      return encontrado
        ? simular(clonar(encontrado))
        : simularError<Estacionamiento>('Estacionamiento no encontrado');
    }

    return this.http
      .get<{ estacionamiento: EstacionamientoDto }>(`${this.ruta}/${id}`)
      .pipe(map(({ estacionamiento }) => aEstacionamiento(estacionamiento)));
  }

  /**
   * `GET /api/estacionamientos/mios`. La API toma el propietario del token;
   * el id solo filtra los mocks.
   */
  listarDelPropietario(propietarioId: Id): Observable<Estacionamiento[]> {
    if (environment.usarMocks) {
      return simular(clonar(ESTACIONAMIENTOS_MOCK.filter((e) => e.propietarioId === propietarioId)));
    }

    return this.http
      .get<{ estacionamientos: EstacionamientoDto[] }>(`${this.ruta}/mios`)
      .pipe(map(({ estacionamientos }) => estacionamientos.map(aEstacionamiento)));
  }

  /** `POST /api/estacionamientos` */
  crear(datos: NuevoEstacionamiento): Observable<Estacionamiento> {
    if (environment.usarMocks) {
      return simular<Estacionamiento>({
        id: `est-${crypto.randomUUID()}`,
        propietarioId: ID_PROPIETARIO,
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? '',
        direccion: datos.direccion,
        barrioZona: datos.barrioZona ?? null,
        telefonoContacto: datos.telefonoContacto ?? null,
        emailContacto: datos.emailContacto ?? null,
        horarios: datos.horarios,
        precioPorHora: datos.precioPorHora,
        cocherasTotales: 0,
        cocherasDisponibles: 0,
        tiposAdmitidos: [],
        cubierto: datos.cubierto ?? false,
        publicado: datos.publicado,
        activo: true,
      });
    }

    return this.http
      .post<{ estacionamiento: EstacionamientoDto }>(this.ruta, aPayloadEstacionamiento(datos))
      .pipe(map(({ estacionamiento }) => aEstacionamiento(estacionamiento)));
  }
}

/* --------------------------- helpers de filtrado --------------------------- */

const distancia = (estacionamiento: Estacionamiento) =>
  estacionamiento.distanciaKm ?? Number.MAX_VALUE;

const COMPARADORES: Record<OrdenEstacionamiento, (a: Estacionamiento, b: Estacionamiento) => number> =
  {
    DISTANCIA: (a, b) => distancia(a) - distancia(b),
    PRECIO: (a, b) => a.precioPorHora - b.precioPorHora,
  };

/** Con mocks, el front replica todos los filtros que hace la API. */
export function aplicarFiltros(
  items: Estacionamiento[],
  filtros: FiltrosEstacionamiento,
): Estacionamiento[] {
  const texto = filtros.busqueda?.trim().toLowerCase() ?? '';

  const filtrados = items.filter((est) => {
    if (texto) {
      const { calle, ciudad } = est.direccion;
      const objetivo =
        `${est.nombre} ${calle} ${ciudad} ${est.barrioZona ?? ''} ${est.descripcion}`.toLowerCase();
      if (!objetivo.includes(texto)) return false;
    }
    if (filtros.tipoVehiculo && !est.tiposAdmitidos.includes(filtros.tipoVehiculo)) return false;
    if (filtros.precioMaximo != null && est.precioPorHora > filtros.precioMaximo) return false;
    if (filtros.soloCubiertos && !est.cubierto) return false;
    return est.activo && est.publicado;
  });

  return aplicarFiltrosLocales(filtrados, filtros);
}

/** Lo que la API no resuelve: solo con lugar libre, y el orden elegido. */
function aplicarFiltrosLocales(
  items: Estacionamiento[],
  filtros: FiltrosEstacionamiento,
): Estacionamiento[] {
  const visibles = filtros.soloDisponibles
    ? items.filter((est) => est.cocherasDisponibles > 0)
    : items;
  return [...visibles].sort(COMPARADORES[filtros.orden ?? 'DISTANCIA']);
}

function aParams(filtros: FiltrosEstacionamiento): HttpParams {
  let params = new HttpParams().set('limit', LIMITE_BUSQUEDA);
  const busqueda = filtros.busqueda?.trim();
  if (busqueda) params = params.set('q', busqueda);
  if (filtros.tipoVehiculo) {
    params = params.set('id_tipo_vehiculo', ID_TIPO_VEHICULO[filtros.tipoVehiculo]);
  }
  if (filtros.precioMaximo != null) params = params.set('tarifa_max', filtros.precioMaximo);
  if (filtros.soloCubiertos) params = params.set('cubierto', true);
  return params;
}
