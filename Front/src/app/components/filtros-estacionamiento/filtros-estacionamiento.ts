import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import {
  ETIQUETA_TIPO_VEHICULO,
  FiltrosEstacionamiento as Filtros,
  TipoVehiculo,
} from '../../models';
import { CampoBusqueda, Chip } from '../ui';

/** Orden de los chips segun el diseno. */
const TIPOS: TipoVehiculo[] = ['AUTO', 'MOTO', 'CAMIONETA'];

/**
 * Buscador + filtro por tipo de vehiculo.
 * El tipo es de seleccion unica obligatoria (siempre hay uno activo).
 */
@Component({
  selector: 'app-filtros-estacionamiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CampoBusqueda, Chip],
  templateUrl: './filtros-estacionamiento.html',
  host: { class: 'block' },
})
export class FiltrosEstacionamiento {
  readonly filtros = model.required<Filtros>();

  protected readonly tipos = TIPOS;
  protected readonly etiquetaTipo = ETIQUETA_TIPO_VEHICULO;

  protected actualizar(cambios: Partial<Filtros>): void {
    this.filtros.update((actual) => ({ ...actual, ...cambios }));
  }
}
