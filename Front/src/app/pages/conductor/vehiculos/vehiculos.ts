import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Boton, Cargando, Chip, EstadoVacio, Etiqueta, Tarjeta } from '@app/components/ui';
import { ETIQUETA_TIPO_VEHICULO, NuevoVehiculo, TipoVehiculo, Vehiculo } from '@app/models';
import { VehiculoService } from '@app/services/vehiculo.service';

/** Orden de los chips, igual que en los filtros de explorar. */
const TIPOS: TipoVehiculo[] = ['AUTO', 'MOTO', 'CAMIONETA'];

/**
 * Pantalla `/conductor/vehiculos` · rol CONDUCTOR
 *
 * Listado y alta de vehiculos. Sin vehiculo cargado no se puede reservar, asi
 * que es la primera parada de un conductor recien registrado.
 */
@Component({
  selector: 'app-vehiculos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Boton, Cargando, Chip, EstadoVacio, Etiqueta, Tarjeta],
  templateUrl: './vehiculos.html',
})
export class Vehiculos {
  private readonly vehiculos = inject(VehiculoService);
  private readonly fb = inject(FormBuilder);

  /** Query param `volver`: la reserva desde la que llego el conductor. */
  readonly volver = input<string>();

  protected readonly tipos = TIPOS;
  protected readonly etiquetaTipo = ETIQUETA_TIPO_VEHICULO;

  protected readonly recurso = rxResource({
    stream: () => this.vehiculos.listarMisVehiculos(),
    defaultValue: [] as Vehiculo[],
  });

  /** Mismos limites que valida el backend (vehiculo.validator.js). */
  protected readonly formulario = this.fb.nonNullable.group({
    patente: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(12)]],
    tipo: this.fb.nonNullable.control<TipoVehiculo>('AUTO'),
    marca: ['', [Validators.maxLength(60)]],
    modelo: ['', [Validators.maxLength(60)]],
    color: ['', [Validators.maxLength(30)]],
    predeterminado: false,
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly agregado = signal<string | null>(null);

  /** Solo se vuelve a pantallas del conductor, para no abrir una redireccion arbitraria. */
  protected readonly rutaVolver = computed(() => {
    const ruta = this.volver();
    return ruta?.startsWith('/conductor/') ? ruta : null;
  });

  protected readonly esPrimero = computed(
    () => !this.recurso.isLoading() && this.recurso.value().length === 0,
  );

  /** "Toyota Corolla · Gris · Auto" */
  protected descripcion(vehiculo: Vehiculo): string {
    const nombre = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ');
    return [nombre, vehiculo.color, this.etiquetaTipo[vehiculo.tipo]].filter(Boolean).join(' · ');
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return Boolean(control?.invalid && control.touched);
  }

  protected elegirTipo(tipo: TipoVehiculo): void {
    this.formulario.controls.tipo.setValue(tipo);
  }

  /** `POST /api/vehiculos` y refresco del listado. */
  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos: NuevoVehiculo = {
      patente: valores.patente.trim(),
      tipo: valores.tipo,
      marca: valores.marca.trim() || null,
      modelo: valores.modelo.trim() || null,
      color: valores.color.trim() || null,
      // Sin marcar decide el backend: el primer vehiculo queda como predeterminado.
      predeterminado: valores.predeterminado || undefined,
    };

    this.enviando.set(true);
    this.error.set(null);
    this.agregado.set(null);

    this.vehiculos.crear(datos).subscribe({
      next: (vehiculo) => {
        this.enviando.set(false);
        this.agregado.set(vehiculo.patente);
        this.formulario.reset();
        this.recurso.reload();
      },
      error: (e: Error) => {
        this.enviando.set(false);
        this.error.set(e.message);
      },
    });
  }
}
