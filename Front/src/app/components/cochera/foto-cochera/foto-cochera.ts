import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Miniatura, TamanoMiniatura } from '@app/components/ui';
import { Cochera } from '@app/models';
import { fotoDeCochera } from '@app/utils/foto-cochera.util';

/** Foto de la cochera segun si es cubierta y que vehiculo admite. */
@Component({
  selector: 'app-foto-cochera',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Miniatura],
  template: `<ui-miniatura [src]="foto()" icono="estacionamiento" [tamano]="tamano()" />`,
  host: { class: 'inline-flex shrink-0' },
})
export class FotoCochera {
  readonly cochera = input.required<Cochera>();
  readonly tamano = input<TamanoMiniatura>('sm');

  protected readonly foto = computed(() => fotoDeCochera(this.cochera()));
}
