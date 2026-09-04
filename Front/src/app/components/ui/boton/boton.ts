import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma';
export type TamanoBoton = 'sm' | 'md';

const VARIANTES: Record<VarianteBoton, string> = {
  // Primario: fondo acento, sin borde, texto blanco (boton "Confirmar reserva").
  primario: 'bg-acento text-white border border-acento hover:bg-tinta hover:border-tinta',
  // Secundario: el "Reservar" de la tarjeta -> fondo lienzo, borde, texto tinta.
  secundario: 'bg-lienzo text-tinta border border-borde hover:bg-borde-sutil',
  fantasma: 'bg-transparent text-plomo border border-transparent hover:text-tinta',
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'px-[18px] py-[9px] text-[13px]',
  md: 'px-4 py-[11px] text-[13px]',
};

/** Boton base: unifica radios, foco y estados de todos los controles. */
@Component({
  selector: 'ui-boton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="tipo()"
      [disabled]="deshabilitado() || cargando()"
      [class]="clases()"
      (click)="presionado.emit($event)"
    >
      @if (cargando()) {
        <span
          class="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        ></span>
      }
      <ng-content />
    </button>
  `,
  styleUrl: './boton.scss',
})
export class Boton {
  readonly variante = input<VarianteBoton>('secundario');
  readonly tamano = input<TamanoBoton>('md');
  readonly tipo = input<'button' | 'submit'>('button');
  readonly deshabilitado = input(false);
  readonly cargando = input(false);
  readonly bloque = input(false);

  readonly presionado = output<MouseEvent>();

  protected readonly clases = computed(() =>
    [
      'inline-flex items-center justify-center gap-2 rounded-boton font-semibold',
      // Transiciones minimas: 140ms, solo color de fondo y borde.
      'transition-colors duration-140 ease-out disabled:pointer-events-none disabled:opacity-45',
      VARIANTES[this.variante()],
      TAMANOS[this.tamano()],
      this.bloque() ? 'w-full' : '',
    ].join(' '),
  );
}
