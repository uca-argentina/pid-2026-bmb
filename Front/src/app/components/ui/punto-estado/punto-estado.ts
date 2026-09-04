import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TonoPunto = 'acento' | 'baja' | 'ocupada' | 'reservada';

const TONOS: Record<TonoPunto, string> = {
  acento: 'bg-acento',
  baja: 'bg-baja',
  ocupada: 'bg-ocupada',
  reservada: 'bg-reservada',
};

/** Punto de estado de 6px: disponibilidad de un lote y estado de una cochera. */
@Component({
  selector: 'ui-punto-estado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="block size-1.5 rounded-full" [class]="clase()" aria-hidden="true"></span>`,
  host: { class: 'inline-flex shrink-0' },
})
export class PuntoEstado {
  readonly tono = input<TonoPunto>('acento');

  protected readonly clase = computed(() => TONOS[this.tono()]);
}
