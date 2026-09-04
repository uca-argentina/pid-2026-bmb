import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ResumenReserva } from '../../components/resumen-reserva/resumen-reserva';
import { SelectorFecha } from '../../components/selector-fecha/selector-fecha';
import { RangoHorario, SelectorFranja } from '../../components/selector-franja/selector-franja';
import { SelectorVehiculo } from '../../components/selector-vehiculo/selector-vehiculo';
import { Boton, Cargando, EstadoVacio, Tarjeta } from '../../components/ui';
import { Cochera, FranjaDisponible, Id, Reserva, Vehiculo } from '../../models';
import { CocheraService } from '../../services/cochera.service';
import { EstacionamientoService } from '../../services/estacionamiento.service';
import { ReservaService } from '../../services/reserva.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { formatearDistancia } from '../../utils/disponibilidad.util';
import { aFechaISO, desdeFechaISO } from '../../utils/fecha.util';

/**
 * Flujo de reserva: vehiculo, fecha y franja en una sola vista, con el resumen
 * y la confirmacion al pie (columna derecha sticky en desktop).
 */
@Component({
  selector: 'app-flujo-reserva',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    SelectorVehiculo,
    SelectorFecha,
    SelectorFranja,
    ResumenReserva,
    Tarjeta,
    Boton,
    Cargando,
    EstadoVacio,
  ],
  templateUrl: './flujo-reserva.html',
})
export class FlujoReserva {
  private readonly estacionamientos = inject(EstacionamientoService);
  private readonly vehiculos = inject(VehiculoService);
  private readonly cocheras = inject(CocheraService);
  private readonly reservas = inject(ReservaService);
  private readonly router = inject(Router);

  /** Llega del parametro de ruta `:estacionamientoId`. */
  readonly estacionamientoId = input.required<Id>();

  protected readonly desdeFechaISO = desdeFechaISO;
  protected readonly borrador = this.reservas.borrador;
  protected readonly horas = this.reservas.duracionHoras;
  protected readonly completo = this.reservas.borradorCompleto;

  protected readonly confirmando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reservaConfirmada = signal<Reserva | null>(null);

  protected readonly recursoEstacionamiento = rxResource({
    params: () => this.estacionamientoId(),
    stream: ({ params }) => this.estacionamientos.obtener(params),
  });

  protected readonly recursoVehiculos = rxResource({
    stream: () => this.vehiculos.listarMisVehiculos(),
    defaultValue: [] as Vehiculo[],
  });

  protected readonly recursoDisponibilidad = rxResource({
    params: () => {
      const fecha = this.borrador().fecha;
      return fecha ? { estacionamientoId: this.estacionamientoId(), fecha } : undefined;
    },
    stream: ({ params }) => this.reservas.disponibilidad(params),
    defaultValue: [] as FranjaDisponible[],
  });

  protected readonly recursoCocheras = rxResource({
    params: () => this.estacionamientoId(),
    stream: ({ params }) => this.cocheras.listarPorEstacionamiento(params),
    defaultValue: [] as Cochera[],
  });

  protected readonly vehiculoElegido = computed(
    () => this.recursoVehiculos.value().find((v) => v.id === this.borrador().vehiculoId) ?? null,
  );

  /** Primera cochera libre compatible: la definitiva la asigna el backend. */
  protected readonly cocheraSugerida = computed<Cochera | null>(() => {
    const tipo = this.vehiculoElegido()?.tipo;
    const libres = this.recursoCocheras.value().filter((c) => c.estado === 'LIBRE');
    return libres.find((c) => c.tipoVehiculo === tipo) ?? libres[0] ?? null;
  });

  protected readonly total = computed(() => {
    const estacionamiento = this.recursoEstacionamiento.value();
    return estacionamiento ? this.reservas.precioEstimado(estacionamiento.precioPorHora) : 0;
  });

  /** "Av. Belgrano 1240 · $ 900 por hora" */
  protected readonly contexto = computed(() => {
    const estacionamiento = this.recursoEstacionamiento.value();
    if (!estacionamiento) return '';
    const { direccion, precioPorHora, distanciaKm } = estacionamiento;
    const distancia = formatearDistancia(distanciaKm);
    const base = `${direccion.calle} ${direccion.numero}`;
    return `${base}${distancia ? ` · ${distancia}` : ''} · $ ${precioPorHora.toLocaleString('es-AR')} por hora`;
  });

  constructor() {
    // Cada estacionamiento arranca su propio borrador, con hoy preseleccionado.
    effect(() => {
      const id = this.estacionamientoId();
      this.reservas.iniciarBorrador(id);
      this.reservas.actualizarBorrador({ fecha: aFechaISO(new Date()) });
      this.reservaConfirmada.set(null);
      this.error.set(null);
    });

    // La primera franja libre del dia queda propuesta, como en el diseno.
    effect(() => {
      const franjas = this.recursoDisponibilidad.value();
      if (franjas.length === 0 || this.borrador().horaDesde) return;
      const disponible = franjas.find((f) => f.disponible);
      if (disponible) {
        this.reservas.actualizarBorrador({
          horaDesde: disponible.horaDesde,
          horaHasta: disponible.horaHasta,
        });
      }
    });

    // El vehiculo predeterminado del conductor queda elegido de entrada.
    effect(() => {
      const vehiculos = this.recursoVehiculos.value();
      if (vehiculos.length === 0 || this.borrador().vehiculoId) return;
      const predeterminado = vehiculos.find((v) => v.predeterminado) ?? vehiculos[0];
      this.reservas.actualizarBorrador({ vehiculoId: predeterminado.id });
    });
  }

  protected elegirVehiculo(vehiculoId: Id | null): void {
    this.reservas.actualizarBorrador({ vehiculoId });
  }

  protected elegirFecha(fecha: string | null): void {
    this.reservas.actualizarBorrador({ fecha, horaDesde: null, horaHasta: null });
  }

  protected elegirRango(rango: RangoHorario): void {
    this.reservas.actualizarBorrador(rango);
  }

  /** `POST /api/reservas` */
  protected confirmar(): void {
    const payload = this.reservas.aPayload();
    if (!payload) return;

    this.confirmando.set(true);
    this.error.set(null);

    this.reservas.crear(payload).subscribe({
      next: (reserva) => {
        this.confirmando.set(false);
        this.reservaConfirmada.set(reserva);
        this.reservas.reiniciarBorrador();
      },
      error: (e: Error) => {
        this.confirmando.set(false);
        // Caso tipico: la cochera se ocupo mientras el usuario elegia.
        this.error.set(e.message);
        this.recursoDisponibilidad.reload();
      },
    });
  }

  protected irAMisReservas(): void {
    void this.router.navigate(['/conductor/mis-reservas']);
  }
}
