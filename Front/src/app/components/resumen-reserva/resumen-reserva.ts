import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HoraHHmm } from '../../models';

/** Resumen de la reserva: duracion, cochera asignada y total. */
@Component({
  selector: 'app-resumen-reserva',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './resumen-reserva.html',
  host: { class: 'block' },
})
export class ResumenReserva {
  readonly horaDesde = input<HoraHHmm | null>(null);
  readonly horaHasta = input<HoraHHmm | null>(null);
  readonly horas = input(0);
  readonly total = input(0);
  /** Identificador de la cochera, cuando ya esta asignada. */
  readonly cochera = input<string | null>(null);

  /** "3 h · 10:00 – 13:00" */
  protected readonly duracion = computed(() => {
    const desde = this.horaDesde();
    const hasta = this.horaHasta();
    if (!desde || !hasta) return 'Elegi una franja';
    return `${this.horas()} h · ${desde} – ${hasta}`;
  });

  /** La cochera la asigna el backend al confirmar. */
  protected readonly textoCochera = computed(() => this.cochera() ?? 'Se asigna al confirmar');

  protected readonly totalFormateado = computed(() => this.total().toLocaleString('es-AR'));
}
