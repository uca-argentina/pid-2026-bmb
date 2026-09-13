import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FranjaDisponible, HoraHHmm } from '../../models';

export interface RangoHorario {
  horaDesde: HoraHHmm;
  horaHasta: HoraHHmm;
}

/**
 * Franjas horarias del estacionamiento: seleccion unica.
 * Las franjas sin lugar quedan deshabilitadas (estado que el prototipo dejaba
 * pendiente de definir).
 */
@Component({
  selector: 'app-selector-franja',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './selector-franja.html',
  styleUrl: './selector-franja.css',
  host: { class: 'block' },
})
export class SelectorFranja {
  readonly franjas = input.required<FranjaDisponible[]>();
  readonly horaDesde = input<HoraHHmm | null>(null);

  readonly rangoElegido = output<RangoHorario>();

  protected esActiva(franja: FranjaDisponible): boolean {
    return this.horaDesde() === franja.horaDesde;
  }
}
