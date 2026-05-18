import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { SecurityLog } from '../services/security-log';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const securityLogService = inject(SecurityLog);

  const token = authService.getAccessToken();
  let clonedRequest = req;

  if (token) {
    clonedRequest = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        securityLogService.logThreat(
          'Violação de Acesso detectada pelo Servidor (HTTP 403)',
          req.url,
          'CRITICAL',
          `Usuário tentou forçar uma requisição restrita ao endpoint: ${req.url}`,
        );

        return throwError(() => error);
      }

      if (error.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((newTokens) => {
              isRefreshing = false;
              refreshTokenSubject.next(newTokens.accessToken);

              // Refaz a requisição que falhou com o novo token atualizado
              return next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${newTokens.accessToken}` },
                }),
              );
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.logout(); // Se o refresh falhar, a sessão foi completamente violada ou revogada
              return throwError(() => refreshErr);
            }),
          );
        } else {
          // Se já houver um processo de refresh acontecendo, segura as requisições paralelas em fila
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((jwt) => {
              return next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${jwt}` },
                }),
              );
            }),
          );
        }
      }
      return throwError(() => error);
    }),
  );
};
