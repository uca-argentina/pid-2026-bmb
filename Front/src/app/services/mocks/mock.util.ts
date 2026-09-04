import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/** Emite un valor imitando la latencia de la API. */
export function simular<T>(valor: T): Observable<T> {
  return of(valor).pipe(delay(environment.latenciaMockMs));
}

/** Imita un error de la API con el mismo formato que el errorHandler de Express. */
export function simularError<T>(mensaje: string): Observable<T> {
  return throwError(() => new Error(mensaje)).pipe(delay(environment.latenciaMockMs));
}

/** Copia profunda para que los mocks no se muten entre pantallas. */
export function clonar<T>(valor: T): T {
  return structuredClone(valor);
}
