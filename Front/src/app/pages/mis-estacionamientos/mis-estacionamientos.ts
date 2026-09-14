import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Boton, Cargando, EstadoVacio, Etiqueta, Tarjeta } from '../../components/ui';
import { Estacionamiento, direccionCorta } from '../../models';
import { AuthService } from '../../services/auth.service';
import { EstacionamientoService } from '../../services/estacionamiento.service';

@Component({
  selector: 'app-mis-estacionamientos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Boton, Cargando, EstadoVacio, Etiqueta, Tarjeta],
  templateUrl: './mis-estacionamientos.html',
})
export class MisEstacionamientos {
  private readonly estacionamientos = inject(EstacionamientoService);
  private readonly auth = inject(AuthService);

  protected readonly direccionCorta = direccionCorta;

  protected readonly recurso = rxResource({
    params: () => this.auth.usuario()?.id,
    stream: ({ params }) => this.estacionamientos.listarDelPropietario(params),
    defaultValue: [] as Estacionamiento[],
  });
}
