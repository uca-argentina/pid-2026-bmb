import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BarraLateral } from '../../components/layout/barra-lateral/barra-lateral';
import { ItemNavegacion } from '../../components/layout/navegacion.model';
import { TabsInferior } from '../../components/layout/tabs-inferior/tabs-inferior';
import { RolUsuario } from '../../models';
import { AuthService } from '../../services/auth.service';

/** Navegacion de cada rol. El guard ya garantizo que el rol corresponde. */
const NAVEGACION: Record<RolUsuario, ItemNavegacion[]> = {
  CONDUCTOR: [
    { ruta: '/conductor/explorar', etiqueta: 'Explorar' },
    { ruta: '/conductor/mis-reservas', etiqueta: 'Mis reservas' },
    { ruta: '/conductor/vehiculos', etiqueta: 'Vehículos' },
  ],
  PROPIETARIO: [
    { ruta: '/propietario/tablero', etiqueta: 'Panel' },
    { ruta: '/propietario/reservas', etiqueta: 'Reservas' },
    { ruta: '/propietario/estacionamientos', etiqueta: 'Estacionamientos' },
  ],
};

/**
 * Shell de la app: tab bar abajo en mobile, sidebar de 238px desde 1024px.
 * El canvas de desktop limita el contenido a 940px, como en el diseno.
 */
@Component({
  selector: 'app-layout-app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, TabsInferior, BarraLateral],
  templateUrl: './layout-app.html',
})
export class LayoutApp {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuario;
  protected readonly items = computed(() => {
    const rol = this.auth.rol();
    return rol ? NAVEGACION[rol] : [];
  });

  protected salir(): void {
    this.auth.logout();
    void this.router.navigate(['/ingresar']);
  }
}
