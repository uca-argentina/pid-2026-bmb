import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Boton,
  Cargando,
  Chip,
  EstadoVacio,
  Etiqueta,
  Tarjeta,
  TonoEtiqueta,
} from '../../components/ui';
import {
  Cochera,
  ETIQUETA_ESTADO_COCHERA,
  ETIQUETA_TIPO_VEHICULO,
  EstadoCochera,
  Id,
  TipoVehiculo,
} from '../../models';
import { CocheraService } from '../../services/cochera.service';
import { EstacionamientoService } from '../../services/estacionamiento.service';

const TIPOS: TipoVehiculo[] = ['AUTO', 'MOTO', 'CAMIONETA'];

const TONO_ESTADO: Record<EstadoCochera, TonoEtiqueta> = {
  LIBRE: 'exito',
  OCUPADA: 'peligro',
  RESERVADA: 'aviso',
  INACTIVA: 'neutro',
};

@Component({
  selector: 'app-gestion-cocheras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Boton, Cargando, Chip, EstadoVacio, Etiqueta, Tarjeta],
  templateUrl: './gestion-cocheras.html',
})
export class GestionCocheras {
  private readonly estacionamientos = inject(EstacionamientoService);
  private readonly cocheras = inject(CocheraService);
  private readonly fb = inject(FormBuilder);

  readonly estacionamientoId = input.required<Id>();

  protected readonly tipos = TIPOS;
  protected readonly etiquetaTipo = ETIQUETA_TIPO_VEHICULO;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_COCHERA;
  protected readonly tonoEstado = TONO_ESTADO;

  protected readonly recursoEstacionamiento = rxResource({
    params: () => this.estacionamientoId(),
    stream: ({ params }) => this.estacionamientos.obtener(params),
  });

  protected readonly recursoCocheras = rxResource({
    params: () => this.estacionamientoId(),
    stream: ({ params }) => this.cocheras.listarPorEstacionamiento(params),
    defaultValue: [] as Cochera[],
  });

  protected readonly activas = computed(
    () => this.recursoCocheras.value().filter((c) => c.estado !== 'INACTIVA').length,
  );

  // Si hay una cochera elegida el formulario la edita; si no, da de alta una nueva.
  protected readonly editando = signal<Cochera | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    identificador: ['', [Validators.required, Validators.maxLength(20)]],
    sector: ['', [Validators.maxLength(20)]],
    tipo: this.fb.nonNullable.control<TipoVehiculo>('AUTO'),
    cubierta: false,
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected detalle(cochera: Cochera): string {
    const partes = [
      cochera.sector ? `Sector ${cochera.sector}` : '',
      cochera.cubierta ? 'Cubierta' : 'Descubierta',
      this.etiquetaTipo[cochera.tipoVehiculo],
    ];
    return partes.filter(Boolean).join(' · ');
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return Boolean(control?.invalid && control.touched);
  }

  protected elegirTipo(tipo: TipoVehiculo): void {
    this.formulario.controls.tipo.setValue(tipo);
  }

  protected editar(cochera: Cochera): void {
    this.editando.set(cochera);
    this.error.set(null);
    this.aviso.set(null);
    this.formulario.setValue({
      identificador: cochera.identificador,
      sector: cochera.sector,
      tipo: cochera.tipoVehiculo,
      cubierta: cochera.cubierta,
    });
  }

  protected cancelarEdicion(): void {
    this.editando.set(null);
    this.formulario.reset();
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos = {
      identificador: valores.identificador.trim(),
      sector: valores.sector.trim(),
      tipoVehiculo: valores.tipo,
      cubierta: valores.cubierta,
    };

    const cochera = this.editando();
    const pedido = cochera
      ? this.cocheras.actualizar(cochera, datos)
      : this.cocheras.crear({ ...datos, estacionamientoId: this.estacionamientoId() });

    this.enviando.set(true);
    this.error.set(null);
    this.aviso.set(null);

    pedido.subscribe({
      next: (guardada) => {
        this.enviando.set(false);
        this.aviso.set(
          cochera
            ? `Guardamos los cambios de la cochera ${guardada.identificador}.`
            : `Agregamos la cochera ${guardada.identificador}.`,
        );
        this.cancelarEdicion();
        this.recursoCocheras.reload();
      },
      error: (e: Error) => {
        this.enviando.set(false);
        this.error.set(e.message);
      },
    });
  }

  protected darDeBaja(cochera: Cochera): void {
    const seguro = confirm(
      `¿Dar de baja la cochera ${cochera.identificador}? No se va a poder reservar y no se puede deshacer.`,
    );
    if (!seguro) return;

    this.error.set(null);
    this.aviso.set(null);

    this.cocheras.darDeBaja(cochera).subscribe({
      next: () => {
        if (this.editando()?.id === cochera.id) this.cancelarEdicion();
        this.aviso.set(`La cochera ${cochera.identificador} quedó dada de baja.`);
        this.recursoCocheras.reload();
      },
      error: (e: Error) => this.error.set(e.message),
    });
  }
}
