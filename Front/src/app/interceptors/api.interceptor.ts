import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * Antepone la URL base de la API a todo request relativo, para que los
 * servicios escriban `this.http.get('/reservas')` y no repitan el prefijo.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  return next(req.clone({ url: `${environment.apiUrl}${path}` }));
};
