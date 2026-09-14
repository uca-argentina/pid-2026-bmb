import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ETIQUETA_ROL, iniciales, nombreCorto, RolUsuario, Usuario } from '@app/models';
import { ItemNavegacion } from '@app/components/layout';

/** Nav lateral de 238px que reemplaza a la tab bar en >= 1024px. */
@Component({
  selector: 'app-barra-lateral',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barra-lateral.html',
  host: { class: 'block h-full' },
})
export class BarraLateral {
  readonly items = input.required<ItemNavegacion[]>();
  readonly usuario = input<Usuario | null>(null);
  /** Otro perfil del usuario; `null` si tiene uno solo. */
  readonly rolAlternativo = input<RolUsuario | null>(null);
  readonly cambiandoRol = input(false);

  readonly salir = output<void>();
  readonly cambiarRol = output<void>();

  protected readonly nombre = computed(() => {
    const usuario = this.usuario();
    return usuario ? nombreCorto(usuario) : '';
  });

  protected readonly inicial = computed(() => {
    const usuario = this.usuario();
    return usuario ? iniciales(usuario) : '';
  });

  protected readonly rol = computed(() => {
    const usuario = this.usuario();
    return usuario ? ETIQUETA_ROL[usuario.rol] : '';
  });

  protected readonly etiquetaRolAlternativo = computed(() => {
    const rol = this.rolAlternativo();
    return rol ? ETIQUETA_ROL[rol] : '';
  });
}
