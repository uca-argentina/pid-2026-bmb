import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Boton, Tarjeta } from '../../components/ui';
import { DiaSemana, NuevoEstacionamiento } from '../../models';
import { EstacionamientoService } from '../../services/estacionamiento.service';

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

@Component({
  selector: 'app-alta-estacionamiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Boton, Tarjeta],
  templateUrl: './alta-estacionamiento.html',
})
export class AltaEstacionamiento {
  private readonly estacionamientos = inject(EstacionamientoService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly dias = DIAS;

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

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

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
    const datos: NuevoEstacionamiento = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || undefined,
      direccion: {
        calle: valores.calle.trim(),
        numero: valores.numero.trim(),
        ciudad: valores.ciudad.trim(),
        provincia: valores.provincia.trim(),
        codigoPostal: valores.codigoPostal.trim(),
        latitud: null,
        longitud: null,
      },
      barrioZona: valores.barrioZona.trim() || null,
      telefonoContacto: valores.telefono.trim() || null,
      emailContacto: valores.email.trim() || null,
      precioPorHora: valores.tarifa ?? 0,
      cubierto: valores.cubierto,
      // Por ahora se publica al crearlo: todavia no hay pantalla para editarlo.
      publicado: true,
      horarios: valores.horarios
        .filter((horario) => horario.abierto)
        .map(({ dia, desde, hasta }) => ({ dia, desde, hasta })),
    };

    this.enviando.set(true);
    this.error.set(null);

    this.estacionamientos.crear(datos).subscribe({
      next: (estacionamiento) => {
        this.enviando.set(false);
        void this.router.navigate(['/propietario/estacionamientos', estacionamiento.id, 'cocheras']);
      },
      error: (e: Error) => {
        this.enviando.set(false);
        this.error.set(e.message);
      },
    });
  }
}
