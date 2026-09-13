import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ResumenReserva } from '../../components/resumen-reserva/resumen-reserva';
import { SelectorFecha } from '../../components/selector-fecha/selector-fecha';
import { RangoHorario, SelectorFranja } from '../../components/selector-franja/selector-franja';
import { SelectorVehiculo } from '../../components/selector-vehiculo/selector-vehiculo';
import { Boton, Cargando, EstadoVacio, Tarjeta } from '../../components/ui';
import { FranjaDisponible, Id, Reserva, Vehiculo } from '../../models';
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

  protected readonly vehiculoElegido = computed(
    () => this.recursoVehiculos.value().find((v) => v.id === this.borrador().vehiculoId) ?? null,
  );

  /** Las franjas dependen del tipo de vehiculo: se piden con fecha y vehiculo elegidos. */
  protected readonly recursoDisponibilidad = rxResource({
    params: () => {
      const fecha = this.borrador().fecha;
      const tipoVehiculo = this.vehiculoElegido()?.tipo;
      return fecha && tipoVehiculo
        ? { estacionamientoId: this.estacionamientoId(), fecha, tipoVehiculo }
        : undefined;
    },
    stream: ({ params }) => this.reservas.disponibilidad(params),
    defaultValue: [] as FranjaDisponible[],
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
    const base = `${direccion.calle} ${direccion.numero}`.trim();
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

  /** Cambiar de vehiculo cambia las franjas disponibles: se vuelve a proponer una. */
  protected elegirVehiculo(vehiculoId: Id | null): void {
    this.reservas.actualizarBorrador({ vehiculoId, horaDesde: null, horaHasta: null });
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
        // Caso tipico: la ultima cochera se ocupo mientras el usuario elegia.
        this.error.set(e.message);
        this.recursoDisponibilidad.reload();
      },
    });
  }

  protected irAMisReservas(): void {
    void this.router.navigate(['/conductor/mis-reservas']);
  }
}
