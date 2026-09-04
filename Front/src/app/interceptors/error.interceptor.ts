import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { RespuestaError } from '../models';
import { AuthService } from '../services/auth.service';

/**
 * Normaliza el formato de error de Express (`{ error: { message } }`) a un
 * Error con mensaje mostrable, y cierra la sesion ante un 401.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        void router.navigate(['/ingresar']);
      }

      return throwError(() => new Error(mensajeDe(error)));
    }),
  );
};

function mensajeDe(error: HttpErrorResponse): string {
  const cuerpo = error.error as RespuestaError | string | null;

  if (cuerpo && typeof cuerpo === 'object' && 'error' in cuerpo) {
    return cuerpo.error.message;
  }
  if (error.status === 0) {
    return 'No pudimos conectarnos con el servidor';
  }
  return typeof cuerpo === 'string' && cuerpo ? cuerpo : 'Ocurrio un error inesperado';
}
