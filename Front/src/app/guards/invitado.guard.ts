import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { inicioSegunRol } from './rol.guard';

/** Con sesion activa, /ingresar redirige al inicio que corresponde al rol. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) {
    return true;
  }

  return router.parseUrl(inicioSegunRol(auth.rol()));
};
