import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type RellenoTarjeta = 'ninguno' | 'sm' | 'md' | 'lg';

const RELLENOS: Record<RellenoTarjeta, string> = {
  ninguno: '',
  sm: 'p-4',
  md: 'p-5 lg:px-6 lg:py-[22px]',
  lg: 'p-6',
};

/** Superficie base: blanca, borde 1px, radio 12px y sin sombra. */
@Component({
  selector: 'ui-tarjeta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="clases()">
      <ng-content />
    </div>
  `,
  host: { class: 'block' },
})
export class Tarjeta {
  readonly relleno = input<RellenoTarjeta>('md');
  readonly recortar = input(false);

  protected readonly clases = computed(() =>
    [
      'rounded-tarjeta border border-borde bg-papel',
      RELLENOS[this.relleno()],
      this.recortar() ? 'overflow-hidden' : '',
    ].join(' '),
  );
}
