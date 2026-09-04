import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FilaReserva } from '../../components/fila-reserva/fila-reserva';
import { Cargando, Chip, EstadoVacio, Tarjeta } from '../../components/ui';
import { Estacionamiento, Id, ReservaDetallada } from '../../models';
import { AuthService } from '../../services/auth.service';
import { EstacionamientoService } from '../../services/estacionamiento.service';
import { ReservaService } from '../../services/reserva.service';

/** Reservas recibidas en los estacionamientos del propietario. */
@Component({
  selector: 'app-reservas-estacionamiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FilaReserva, Tarjeta, Chip, Cargando, EstadoVacio],
  templateUrl: './reservas-estacionamiento.html',
})
export class ReservasEstacionamiento {
  private readonly estacionamientos = inject(EstacionamientoService);
  private readonly reservas = inject(ReservaService);
  private readonly auth = inject(AuthService);

  protected readonly seleccionadoId = signal<Id | null>(null);

  protected readonly recursoEstacionamientos = rxResource({
    params: () => this.auth.usuario()?.id,
    stream: ({ params }) => this.estacionamientos.listarDelPropietario(params),
    defaultValue: [] as Estacionamiento[],
  });

  protected readonly activo = computed<Estacionamiento | null>(() => {
    const lista = this.recursoEstacionamientos.value();
    return lista.find((e) => e.id === this.seleccionadoId()) ?? lista[0] ?? null;
  });

  protected readonly recurso = rxResource({
    params: () => this.activo()?.id,
    stream: ({ params }) => this.reservas.listarPorEstacionamiento(params),
    defaultValue: [] as ReservaDetallada[],
  });
}
