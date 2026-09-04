import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Chip de filtro: 12.5px/500, radio 8px, activo con fondo acento. */
@Component({
  selector: 'ui-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" [class]="clases()" [attr.aria-pressed]="activo()" (click)="alternar.emit()">
      <ng-content />
    </button>
  `,
  styleUrl: './chip.scss',
})
export class Chip {
  readonly activo = input(false);

  readonly alternar = output<void>();

  protected readonly clases = computed(() =>
    [
      'shrink-0 rounded-boton border px-3.5 py-[9px] text-[12.5px] font-medium whitespace-nowrap',
      'transition-colors duration-140 ease-out',
      this.activo()
        ? 'border-acento bg-acento text-white'
        : 'border-borde bg-papel text-plomo hover:bg-borde-sutil',
    ].join(' '),
  );
}
