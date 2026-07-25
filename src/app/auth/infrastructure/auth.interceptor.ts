import { HttpInterceptorFn } from '@angular/common/http';
import { getStoredToken } from './token-storage';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getStoredToken();
  if (!token || !req.url.startsWith(environment.apiUrl)) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
