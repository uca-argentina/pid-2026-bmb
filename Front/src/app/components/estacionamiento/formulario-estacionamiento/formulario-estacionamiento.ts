import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Boton, Tarjeta } from '@app/components/ui';
import { DiaSemana, Estacionamiento, NuevoEstacionamiento } from '@app/models';

const DIAS: { dia: DiaSemana; etiqueta: string }[] = [
  { dia: 'LUNES', etiqueta: 'Lunes' },
  { dia: 'MARTES', etiqueta: 'Martes' },
  { dia: 'MIERCOLES', etiqueta: 'Miércoles' },
  { dia: 'JUEVES', etiqueta: 'Jueves' },
  { dia: 'VIERNES', etiqueta: 'Viernes' },
  { dia: 'SABADO', etiqueta: 'Sábado' },
  { dia: 'DOMINGO', etiqueta: 'Domingo' },
];

const DIAS_HABILES: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];

// Un dia abierto necesita que el cierre sea despues de la apertura.
function horarioValido(grupo: AbstractControl): ValidationErrors | null {
  const { abierto, desde, hasta } = grupo.value;
  return abierto && (!desde || !hasta || hasta <= desde) ? { horarioInvalido: true } : null;
}

/**
 * Formulario de un estacionamiento, compartido por el alta y la edicion.
 * Si recibe un `estacionamiento` precarga sus datos; si no, arranca vacio.
 * Emite los datos ya validados por `guardar`: quien lo usa decide si llama a
 * crear o a actualizar.
 */
@Component({
  selector: 'app-formulario-estacionamiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Boton, Tarjeta],
  templateUrl: './formulario-estacionamiento.html',
})
export class FormularioEstacionamiento {
  private readonly fb = inject(FormBuilder);

  /** Estacionamiento a editar. `null` (el default) es el modo alta. */
  readonly estacionamiento = input<Estacionamiento | null>(null);
  readonly enviando = input(false);
  readonly error = input<string | null>(null);
  readonly textoEnviar = input('Guardar');

  readonly guardar = output<NuevoEstacionamiento>();

  protected readonly dias = DIAS;

  /** Mismos limites que valida el backend (estacionamiento.validator.js). */
  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    descripcion: ['', [Validators.maxLength(500)]],
    calle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    numero: ['', [Validators.required, Validators.maxLength(10)]],
    ciudad: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    provincia: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    codigoPostal: ['', [Validators.maxLength(10)]],
    barrioZona: ['', [Validators.maxLength(120)]],
    telefono: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    tarifa: [null as number | null, [Validators.required, Validators.min(0)]],
    cubierto: false,
    horarios: this.fb.nonNullable.array(
      DIAS.map(({ dia }) =>
        this.fb.nonNullable.group(
          {
            dia: this.fb.nonNullable.control<DiaSemana>(dia),
            abierto: DIAS_HABILES.includes(dia),
            desde: '08:00',
            hasta: '20:00',
          },
          { validators: horarioValido },
        ),
      ),
    ),
  });

  protected readonly horarios = this.formulario.controls.horarios;

  constructor() {
    // Al abrir el editor, el formulario se precarga con lo que hay cargado.
    effect(() => {
      const estacionamiento = this.estacionamiento();
      if (!estacionamiento) return;

      const { direccion } = estacionamiento;
      this.formulario.patchValue({
        nombre: estacionamiento.nombre,
        descripcion: estacionamiento.descripcion,
        calle: direccion.calle,
        numero: direccion.numero,
        ciudad: direccion.ciudad,
        provincia: direccion.provincia,
        codigoPostal: direccion.codigoPostal,
        barrioZona: estacionamiento.barrioZona ?? '',
        telefono: estacionamiento.telefonoContacto ?? '',
        email: estacionamiento.emailContacto ?? '',
        tarifa: estacionamiento.precioPorHora,
        cubierto: estacionamiento.cubierto,
      });

      // Los dias que no vienen en `horarios` estan cerrados.
      this.horarios.controls.forEach((grupo) => {
        const franja = estacionamiento.horarios.find(
          (horario) => horario.dia === grupo.controls.dia.value,
        );
        grupo.patchValue({
          abierto: Boolean(franja),
          desde: franja?.desde ?? '08:00',
          hasta: franja?.hasta ?? '20:00',
        });
      });
    });
  }

  protected invalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return Boolean(control?.invalid && control.touched);
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    this.guardar.emit({
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      direccion: {
        calle: valores.calle.trim(),
        numero: valores.numero.trim(),
        ciudad: valores.ciudad.trim(),
        provincia: valores.provincia.trim(),
        codigoPostal: valores.codigoPostal.trim(),
        // El formulario no pide coordenadas: las que ya estaban se conservan.
        latitud: this.estacionamiento()?.direccion.latitud ?? null,
        longitud: this.estacionamiento()?.direccion.longitud ?? null,
      },
      barrioZona: valores.barrioZona.trim() || null,
      telefonoContacto: valores.telefono.trim() || null,
      emailContacto: valores.email.trim() || null,
      precioPorHora: valores.tarifa ?? 0,
      cubierto: valores.cubierto,
      // La publicacion se maneja aparte, desde la pantalla de edicion.
      publicado: this.estacionamiento()?.publicado ?? true,
      horarios: valores.horarios
        .filter((horario) => horario.abierto)
        .map(({ dia, desde, hasta }) => ({ dia, desde, hasta })),
    });
  }
}
