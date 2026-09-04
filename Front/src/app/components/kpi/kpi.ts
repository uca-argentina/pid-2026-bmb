import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tarjeta } from '../ui';

/** Tarjeta de metrica del panel: valor 28px/600 + label. */
@Component({
  selector: 'app-kpi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tarjeta],
  template: `
    <ui-tarjeta relleno="ninguno">
      <div class="flex flex-col gap-2 px-4 py-5 lg:px-6 lg:py-[22px]">
        <p class="num-tabular text-[28px] leading-none font-semibold tracking-[-0.02em] text-tinta">
          {{ valor() }}
        </p>
        <p class="text-[12px] text-plomo">{{ etiqueta() }}</p>
      </div>
    </ui-tarjeta>
  `,
  host: { class: 'block' },
})
export class Kpi {
  readonly valor = input.required<string | number>();
  readonly etiqueta = input.required<string>();
}
