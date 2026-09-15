import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FilaReserva } from '@app/components/reserva';
import { Boton, Cargando, Chip, EstadoVacio, Tarjeta } from '@app/components/ui';
import { esReservaActiva, Id, ReservaDetallada } from '@app/models';
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

  /** Reserva que se esta cancelando: pinta el spinner en su fila. */
  protected readonly cancelandoId = signal<Id | null>(null);
  /** Confirmacion visible: la reserva cancelada se va a Historial. */
  protected readonly aviso = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly recurso = rxResource({
    stream: () => this.reservas.listarMisReservas(),
    defaultValue: [] as ReservaDetallada[],
  });

  protected readonly visibles = computed(() =>
    this.recurso
      .value()
      .filter((r) => (this.pestania() === 'VIGENTES' ? esReservaActiva(r) : !esReservaActiva(r))),
  );

  protected cambiarPestania(pestania: Pestania): void {
    this.pestania.set(pestania);
    // Los avisos son de la pestaña anterior: al cambiar dejan de tener sentido.
    this.aviso.set(null);
    this.error.set(null);
  }

  /** `PATCH /api/reservas/:id/cancelar`, con confirmacion y feedback. */
  protected cancelar(reserva: ReservaDetallada): void {
    const seguro = confirm(
      `¿Cancelar tu reserva en ${reserva.estacionamiento.nombre}? No se puede deshacer.`,
    );
    if (!seguro) return;

    this.cancelandoId.set(reserva.id);
    this.aviso.set(null);
    this.error.set(null);

    this.reservas.cancelar(reserva.id).subscribe({
      next: () => {
        this.cancelandoId.set(null);
        // La reserva pasa a CANCELADA: sale de Vigentes y aparece en Historial.
        this.aviso.set(`Cancelamos tu reserva en ${reserva.estacionamiento.nombre}.`);
        this.recurso.reload();
      },
      error: (e: Error) => {
        this.cancelandoId.set(null);
        this.error.set(e.message);
      },
    });
  }
}
