import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FilaReserva } from '@app/components/reserva';
import { Boton, Cargando, Chip, EstadoVacio, Tarjeta } from '@app/components/ui';
import { esReservaActiva, ReservaDetallada } from '@app/models';
import { ReservaService } from '@app/services/reserva.service';

type Pestania = 'VIGENTES' | 'HISTORIAL';

/**
 * Pantalla `/conductor/mis-reservas` · rol CONDUCTOR
 *
 * Reservas del conductor, separadas entre vigentes e historial.
 */
@Component({
  selector: 'app-mis-reservas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FilaReserva, Tarjeta, Chip, Cargando, EstadoVacio, Boton, RouterLink],
  templateUrl: './mis-reservas.html',
})
export class MisReservas {
  private readonly reservas = inject(ReservaService);

  protected readonly pestania = signal<Pestania>('VIGENTES');

  protected readonly recurso = rxResource({
    stream: () => this.reservas.listarMisReservas(),
    defaultValue: [] as ReservaDetallada[],
  });

  protected readonly visibles = computed(() =>
    this.recurso
      .value()
      .filter((r) => (this.pestania() === 'VIGENTES' ? esReservaActiva(r) : !esReservaActiva(r))),
  );

  /** `PATCH /api/reservas/:id/cancelar` */
  protected cancelar(reserva: ReservaDetallada): void {
    this.reservas.cancelar(reserva.id).subscribe({ next: () => this.recurso.reload() });
  }
}
