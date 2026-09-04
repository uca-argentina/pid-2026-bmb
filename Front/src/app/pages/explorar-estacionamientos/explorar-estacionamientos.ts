import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FiltrosEstacionamiento as FiltrosComponent } from '../../components/filtros-estacionamiento/filtros-estacionamiento';
import { TarjetaEstacionamiento } from '../../components/tarjeta-estacionamiento/tarjeta-estacionamiento';
import { Boton, Cargando, EstadoVacio } from '../../components/ui';
import { Estacionamiento, FiltrosEstacionamiento } from '../../models';
import { EstacionamientoService } from '../../services/estacionamiento.service';

/** El filtro por tipo de vehiculo es obligatorio y arranca en AUTO. */
const FILTROS_INICIALES: FiltrosEstacionamiento = {
  busqueda: '',
  tipoVehiculo: 'AUTO',
  orden: 'DISTANCIA',
};

/** Listado y filtrado de estacionamientos (rol CONDUCTOR). */
@Component({
  selector: 'app-explorar-estacionamientos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FiltrosComponent, TarjetaEstacionamiento, Cargando, EstadoVacio, Boton],
  templateUrl: './explorar-estacionamientos.html',
})
export class ExplorarEstacionamientos {
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
