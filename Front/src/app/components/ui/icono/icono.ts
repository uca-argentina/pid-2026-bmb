import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Iconos disponibles. Se dibujan inline, sin libreria externa. */
export type NombreIcono =
  | 'explorar'
  | 'reservas'
  | 'auto'
  | 'tablero'
  | 'estacionamiento'
  | 'mas'
  | 'editar'
  | 'reloj';

/**
 * Icono de linea sobre un lienzo de 24x24. Todos comparten estilo (trazo de
 * 1.75, extremos redondeados) y heredan el color con `currentColor`, asi que se
 * tinta desde el contenedor igual que el texto. El tamaño sale de `[tamano]`.
 */
@Component({
  selector: 'ui-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="tamano()"
      [attr.height]="tamano()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (nombre()) {
        @case ('explorar') {
          <path d="M12 21s6.5-5.4 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.6 12 21 12 21Z" />
          <circle cx="12" cy="10.5" r="2.4" />
        }
        @case ('reservas') {
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
          <path d="M3.5 9.5h17" />
          <path d="M8 3.5v3.2M16 3.5v3.2" />
          <path d="M8.8 14.7l2.1 2.1 4.3-4.3" />
        }
        @case ('auto') {
          <path d="M5 11.2l1.4-4A2 2 0 0 1 8.3 5.8h7.4a2 2 0 0 1 1.9 1.4l1.4 4" />
          <path
            d="M4 11.2h16a1.5 1.5 0 0 1 1.5 1.5V16a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1v-3.3a1.5 1.5 0 0 1 1.5-1.5Z"
          />
          <circle cx="7.3" cy="16.2" r="1.6" />
          <circle cx="16.7" cy="16.2" r="1.6" />
        }
        @case ('tablero') {
          <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.4" />
          <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.4" />
          <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.4" />
          <rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.4" />
        }
        @case ('estacionamiento') {
          <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3.4" />
          <path d="M9.5 16.5V7.8h3.1a2.85 2.85 0 0 1 0 5.7H9.5" />
        }
        @case ('mas') {
          <path d="M12 5.2v13.6M5.2 12h13.6" />
        }
        @case ('editar') {
          <path
            d="M14.5 5.7l3.8 3.8M4 20l4.2-.9L19 8.3a2 2 0 0 0 0-2.8l-.5-.5a2 2 0 0 0-2.8 0L4.9 15.8 4 20Z"
          />
        }
        @case ('reloj') {
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 7.4V12l3 1.8" />
        }
      }
    </svg>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  readonly tamano = input(20);
}
