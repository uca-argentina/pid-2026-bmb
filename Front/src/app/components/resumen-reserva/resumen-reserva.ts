import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Cochera, HoraHHmm } from '../../models';

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
  readonly cochera = input<Cochera | null>(null);

  /** "3 h · 10:00 – 13:00" */
  protected readonly duracion = computed(() => {
    const desde = this.horaDesde();
    const hasta = this.horaHasta();
    if (!desde || !hasta) return 'Elegi una franja';
    return `${this.horas()} h · ${desde} – ${hasta}`;
  });

  /** "A2 · Cubierta". La cochera definitiva la asigna el backend al confirmar. */
  protected readonly textoCochera = computed(() => {
    const cochera = this.cochera();
    if (!cochera) return 'Se asigna al confirmar';
    return `${cochera.identificador} · ${cochera.cubierta ? 'Cubierta' : 'Descubierta'}`;
  });

  protected readonly totalFormateado = computed(() => this.total().toLocaleString('es-AR'));
}
