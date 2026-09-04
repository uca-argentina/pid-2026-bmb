import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Badge de metadatos y estados: 11px, borde 1px, radio 6px. */
@Component({
  selector: 'ui-etiqueta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-etiqueta border border-borde px-[9px] py-1
             text-[11px] font-medium text-plomo"
    >
      <ng-content />
    </span>
  `,
  host: { class: 'inline-flex' },
})
export class Etiqueta {}
