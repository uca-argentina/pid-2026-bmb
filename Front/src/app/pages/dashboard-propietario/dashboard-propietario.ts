import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CeldaCochera } from '../../components/celda-cochera/celda-cochera';
import { FilaReserva } from '../../components/fila-reserva/fila-reserva';
import { Kpi } from '../../components/kpi/kpi';
import { LeyendaCocheras } from '../../components/leyenda-cocheras/leyenda-cocheras';
import { Boton, Cargando, Chip, EstadoVacio, Tarjeta } from '../../components/ui';
import {
  Cochera,
  ESTADOS_COCHERA_ORDEN,
  Estacionamiento,
  EstadoCochera,
  Id,
  ReservaDetallada,
} from '../../models';
import { AuthService } from '../../services/auth.service';
import { CocheraService } from '../../services/cochera.service';
import { EstacionamientoService } from '../../services/estacionamiento.service';
import { ReservaService } from '../../services/reserva.service';
import { aFechaISO } from '../../utils/fecha.util';

/** Panel de ocupacion y KPIs del dia (rol PROPIETARIO). */
@Component({
  selector: 'app-dashboard-propietario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    CeldaCochera,
    LeyendaCocheras,
    FilaReserva,
    Kpi,
    Tarjeta,
    Chip,
    Boton,
    Cargando,
    EstadoVacio,
  ],
  templateUrl: './dashboard-propietario.html',
})
export class DashboardPropietario {
  private readonly estacionamientos = inject(EstacionamientoService);
  private readonly cocheras = inject(CocheraService);
  private readonly reservas = inject(ReservaService);
  private readonly auth = inject(AuthService);

  protected readonly estados = ESTADOS_COCHERA_ORDEN;
  protected readonly seleccionadoId = signal<Id | null>(null);
  protected readonly cocheraAbierta = signal<Cochera | null>(null);

  protected readonly recursoEstacionamientos = rxResource({
    params: () => this.auth.usuario()?.id,
    stream: ({ params }) => this.estacionamientos.listarDelPropietario(params),
    defaultValue: [] as Estacionamiento[],
  });

  /** Estacionamiento activo: el elegido, o el primero que devuelve la API. */
  protected readonly activo = computed<Estacionamiento | null>(() => {
    const lista = this.recursoEstacionamientos.value();
    return lista.find((e) => e.id === this.seleccionadoId()) ?? lista[0] ?? null;
  });

  protected readonly recursoResumen = rxResource({
    params: () => this.activo()?.id,
    stream: ({ params }) => this.estacionamientos.resumenDiario(params),
  });

  protected readonly recursoCocheras = rxResource({
    params: () => this.activo()?.id,
    stream: ({ params }) => this.cocheras.listarPorEstacionamiento(params),
    defaultValue: [] as Cochera[],
  });

  protected readonly recursoReservasHoy = rxResource({
    params: () => this.activo()?.id,
    stream: ({ params }) => this.reservas.listarPorEstacionamiento(params, aFechaISO(new Date())),
    defaultValue: [] as ReservaDetallada[],
  });

  protected readonly ingresos = computed(() => {
    const resumen = this.recursoResumen.value();
    return resumen ? `$ ${resumen.ingresosDelDia.toLocaleString('es-AR')}` : '—';
  });

  protected seleccionar(id: Id): void {
    this.seleccionadoId.set(id);
    this.cocheraAbierta.set(null);
  }

  protected abrir(cochera: Cochera): void {
    this.cocheraAbierta.update((actual) => (actual?.id === cochera.id ? null : cochera));
  }

  /** `PATCH /api/cocheras/:id` y refresco de la cuadricula y los KPIs. */
  protected cambiarEstado(cochera: Cochera, estado: EstadoCochera): void {
    this.cocheras.cambiarEstado(cochera.id, estado).subscribe({
      next: () => {
        this.cocheraAbierta.set(null);
        this.recursoCocheras.reload();
        this.recursoResumen.reload();
      },
    });
  }
}
