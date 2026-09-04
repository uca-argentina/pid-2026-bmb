import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ETIQUETA_ESTADO_RESERVA, ReservaDetallada, esReservaActiva } from '../../models';
import { desdeFechaISO } from '../../utils/fecha.util';
import { Boton, Etiqueta } from '../ui';

/**
 * Fila de reserva dentro de una tarjeta con `overflow: hidden`.
 * `vista` decide que datos van al frente: la cochera y la patente para el
 * propietario, el estacionamiento y la fecha para el conductor.
 */
@Component({
  selector: 'app-fila-reserva',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Etiqueta, Boton],
  templateUrl: './fila-reserva.html',
  host: { class: 'block' },
})
export class FilaReserva {
  readonly reserva = input.required<ReservaDetallada>();
  readonly vista = input<'CONDUCTOR' | 'PROPIETARIO'>('PROPIETARIO');
  readonly permiteCancelar = input(false);

  readonly cancelar = output<ReservaDetallada>();

  protected readonly etiquetaEstado = ETIQUETA_ESTADO_RESERVA;
  protected readonly activa = computed(() => esReservaActiva(this.reserva()));

  protected readonly titulo = computed(() => {
    const reserva = this.reserva();
    if (this.vista() === 'CONDUCTOR') return reserva.estacionamiento.nombre;
    const cochera = reserva.cochera?.identificador ?? 'Sin asignar';
    return `${cochera} · ${reserva.vehiculo.patente}`;
  });

  protected readonly fecha = computed(() => desdeFechaISO(this.reserva().fecha));
}
