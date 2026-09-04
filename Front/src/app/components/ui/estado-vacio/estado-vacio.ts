import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Estado vacio / de error. El prototipo no lo definia (queda anotado como
 * pendiente en el handoff): se resuelve con los mismos tokens del sistema.
 */
@Component({
  selector: 'ui-estado-vacio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center gap-2 rounded-tarjeta border border-dashed border-borde
             bg-papel px-6 py-12 text-center"
    >
      <p class="text-[15px] font-semibold text-tinta">{{ titulo() }}</p>
      @if (descripcion()) {
        <p class="max-w-xs text-[13px] text-plomo">{{ descripcion() }}</p>
      }
      <div class="mt-3 empty:hidden">
        <ng-content />
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class EstadoVacio {
  readonly titulo = input.required<string>();
  readonly descripcion = input('');
}
