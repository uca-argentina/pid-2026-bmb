import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Boton, Chip } from '@app/components/ui';
import { ETIQUETA_TIPO_VEHICULO, NuevoVehiculo, TipoVehiculo, Vehiculo } from '@app/models';

/** Orden de los chips, igual que en los filtros de explorar. */
const TIPOS: TipoVehiculo[] = ['AUTO', 'MOTO', 'CAMIONETA'];

/**
 * Formulario de datos de un vehiculo, compartido por el alta y la edicion.
 * Si recibe un `vehiculo` precarga sus datos y actua como editor; si no,
 * arranca vacio para dar de alta uno nuevo. Emite los datos ya validados por
 * `guardar`; quien lo usa decide si llama a crear o a actualizar.
 */
@Component({
  selector: 'app-formulario-vehiculo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Boton, Chip],
  templateUrl: './formulario-vehiculo.html',
})
export class FormularioVehiculo {
  private readonly fb = inject(FormBuilder);

  /** Vehiculo a editar. `null` (el default) es el modo alta. */
  readonly vehiculo = input<Vehiculo | null>(null);
  readonly enviando = input(false);
  readonly error = input<string | null>(null);
  /** Aviso de que el primer vehiculo queda predeterminado (solo en el alta). */
  readonly mostrarHintPrimero = input(false);
  readonly textoEnviar = input('Guardar');

  readonly guardar = output<NuevoVehiculo>();

  protected readonly tipos = TIPOS;
  protected readonly etiquetaTipo = ETIQUETA_TIPO_VEHICULO;

  /** Mismos limites que valida el backend (vehiculo.validator.js). */
  protected readonly formulario = this.fb.nonNullable.group({
    patente: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(12)]],
    tipo: this.fb.nonNullable.control<TipoVehiculo>('AUTO'),
    marca: ['', [Validators.maxLength(60)]],
    modelo: ['', [Validators.maxLength(60)]],
    color: ['', [Validators.maxLength(30)]],
    predeterminado: false,
  });

  constructor() {
    // Al abrir el editor, el formulario se precarga con los datos del vehiculo.
    effect(() => {
      const vehiculo = this.vehiculo();
      if (!vehiculo) return;
      this.formulario.setValue({
        patente: vehiculo.patente,
        tipo: vehiculo.tipo,
        marca: vehiculo.marca ?? '',
        modelo: vehiculo.modelo ?? '',
        color: vehiculo.color ?? '',
        predeterminado: vehiculo.predeterminado,
      });
    });
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return Boolean(control?.invalid && control.touched);
  }

  protected elegirTipo(tipo: TipoVehiculo): void {
    this.formulario.controls.tipo.setValue(tipo);
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    this.guardar.emit({
      patente: valores.patente.trim(),
      tipo: valores.tipo,
      marca: valores.marca.trim() || null,
      modelo: valores.modelo.trim() || null,
      color: valores.color.trim() || null,
      // Sin marcar decide el backend: el primer vehiculo queda como predeterminado.
      predeterminado: valores.predeterminado || undefined,
    });
  }
}
