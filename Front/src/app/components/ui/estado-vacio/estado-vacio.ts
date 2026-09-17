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
      <span
        class="mb-1 grid size-11 place-items-center rounded-full bg-acento-suave text-acento"
        aria-hidden="true"
      >
        <svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="10" cy="10" r="7.25" />
          <path d="M10 6.5v4.25" stroke-linecap="round" />
          <circle cx="10" cy="13.6" r="0.85" fill="currentColor" stroke="none" />
        </svg>
      </span>

      <p class="text-[15px] font-semibold text-tinta">{{ titulo() }}</p>
      @if (descripcion()) {
        <p class="max-w-xs text-[13px] leading-relaxed text-plomo">{{ descripcion() }}</p>
      }
      <div class="mt-3 empty:hidden">
        <ng-content />
      </div>
    </div>
  `,
  host: { class: 'aparece block' },
})
export class EstadoVacio {
  readonly titulo = input.required<string>();
  readonly descripcion = input('');
}
