import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Skeletons de carga (estado pendiente segun el handoff). */
@Component({
  selector: 'ui-cargando',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4" role="status" aria-live="polite">
      <span class="sr-only">Cargando</span>
      @for (fila of filas(); track $index) {
        <div class="rounded-tarjeta border border-borde bg-papel p-5 shadow-tarjeta">
          <div class="esqueleto h-4 w-1/2 rounded"></div>
          <div class="esqueleto mt-3 h-3 w-3/4 rounded"></div>
          <div class="esqueleto mt-4 h-9 w-full rounded-boton"></div>
        </div>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class Cargando {
  readonly cantidad = input(3);

  protected filas(): number[] {
    return Array.from({ length: this.cantidad() });
  }
}
