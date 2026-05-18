import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { inject } from '@angular/core';
import { SecurityLog } from '../services/security-log';
import { UserPermission } from '../models/auth.models';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const securityLogService = inject(SecurityLog);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'] as UserPermission;

  if (!requiredPermission) {
    return true;
  }

  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  const pathAttempted =
    route.url?.map((segment) => segment.path).join('/') || state.url || 'Rota Protegida';

  securityLogService.logThreat(
    'Tentativa de violação de privilégio (RBAC)',
    pathAttempted,
    'CRITICAL',
    `Usuário tentou acessar rota que exige a permissão: ${requiredPermission}`,
  );

  router.navigate(['/dashboard']);
  return false;
};
