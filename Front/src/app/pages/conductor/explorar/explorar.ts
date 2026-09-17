import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  FiltrosEstacionamiento as FiltrosComponent,
  TarjetaEstacionamiento,
} from '@app/components/estacionamiento';
import { Boton, Cargando, EstadoVacio } from '@app/components/ui';
import { Estacionamiento, FiltrosEstacionamiento } from '@app/models';
import { EstacionamientoService } from '@app/services/estacionamiento.service';

/** El filtro por tipo de vehiculo es obligatorio y arranca en AUTO. */
const FILTROS_INICIALES: FiltrosEstacionamiento = {
  busqueda: '',
  tipoVehiculo: 'AUTO',
  orden: 'DISTANCIA',
};

/**
 * Pantalla `/conductor/explorar` · rol CONDUCTOR
 *
 * Listado y filtrado de estacionamientos. Es el inicio del conductor.
 */
@Component({
  selector: 'app-explorar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FiltrosComponent, TarjetaEstacionamiento, Cargando, EstadoVacio, Boton],
  templateUrl: './explorar.html',
})
export class Explorar {
  private readonly estacionamientos = inject(EstacionamientoService);
  private readonly router = inject(Router);

  protected readonly filtros = signal<FiltrosEstacionamiento>({ ...FILTROS_INICIALES });

  /** Se vuelve a pedir al backend cada vez que cambia algun filtro. */
  protected readonly recurso = rxResource({
    params: () => this.filtros(),
    stream: ({ params }) => this.estacionamientos.listar(params),
    defaultValue: [] as Estacionamiento[],
  });

  protected readonly resultados = computed(() => this.recurso.value().length);

  protected limpiarFiltros(): void {
    this.filtros.set({ ...FILTROS_INICIALES });
  }

  protected irAReservar(estacionamiento: Estacionamiento): void {
    void this.router.navigate(['/conductor/reservar', estacionamiento.id]);
  }
}
