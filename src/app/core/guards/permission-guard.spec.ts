import { TestBed } from '@angular/core/testing';
import { permissionGuard } from './permission-guard';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/auth-service';
import { SecurityLog } from '../services/security-log';
describe('permissionGuard', () => {
  let authServiceMock: any;
  let securityLogServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      hasPermission: vi.fn(),
    };

    securityLogServiceMock = {
      logThreat: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: SecurityLog, useValue: securityLogServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  const runGuard = (routeMock: Partial<ActivatedRouteSnapshot>) => {
    return TestBed.runInInjectionContext(() =>
      permissionGuard(routeMock as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  };

  it('deve PERMITIR o acesso se o usuário possuir a claim exigida na rota', () => {
    const routeSnapshot = { data: { permission: 'users.read' } };
    authServiceMock.hasPermission.mockReturnValue(true);

    const result = runGuard(routeSnapshot);

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(securityLogServiceMock.logThreat).not.toHaveBeenCalled();
  });

  it('deve BLOQUEAR o acesso, redirecionar e gerar LOG CRÍTICO se o usuário NÃO possuir a claim', () => {
    // A CORREÇÃO ESTÁ AQUI: Instanciamos um UrlSegment real para mapear o path de forma estrita
    const mockUrlSegment = new UrlSegment('users', {});

    const routeSnapshot = {
      data: { permission: 'users.delete' },
      url: [mockUrlSegment], // Agora o TypeScript aceita perfeitamente!
    };

    authServiceMock.hasPermission.mockReturnValue(false);

    // Act
    const result = runGuard(routeSnapshot);

    // Assert
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);

    expect(securityLogServiceMock.logThreat).toHaveBeenCalledWith(
      'Tentativa de violação de privilégio (RBAC)',
      'users', // O segmento mapeado extraído dinamicamente
      'CRITICAL',
      'Usuário tentou acessar rota que exige a permissão: users.delete',
    );
  });
});
