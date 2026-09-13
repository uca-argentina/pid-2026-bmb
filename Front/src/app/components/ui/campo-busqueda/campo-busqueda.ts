import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Buscador: fila blanca, borde 1px, radio 10px, icono de lupa a la izquierda. */
@Component({
  selector: 'ui-campo-busqueda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="group flex items-center gap-2.5 rounded-control border border-borde bg-papel px-3.5 py-3
             shadow-tarjeta transition-[border-color,box-shadow] duration-160 ease-out
             hover:border-acento-borde focus-within:border-acento
             focus-within:ring-[3px] focus-within:ring-acento-suave lg:py-[11px]"
    >
      <span class="sr-only">{{ etiqueta() }}</span>

      <svg
        class="size-4 shrink-0 text-humo transition-colors duration-160 ease-out
               group-focus-within:text-acento"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="5" />
        <path d="m10.8 10.8 3 3" stroke-linecap="round" />
      </svg>

      <input
        type="search"
        class="w-full border-0 bg-transparent text-sm text-tinta placeholder:text-humo
               focus:outline-none lg:text-[13.5px]"
        [placeholder]="marcador()"
        [value]="valor()"
        (input)="valor.set($any($event.target).value)"
      />
    </label>
  `,
  host: { class: 'block' },
})
export class CampoBusqueda {
  readonly valor = model<string>('');
  readonly marcador = input('Buscar por zona o dirección');
  readonly etiqueta = input('Buscar');
}
