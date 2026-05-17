import { TestBed } from '@angular/core/testing';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth-service';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    // Criando os dublês de teste com o Vitest
    authServiceMock = {
      get isAuthenticated() {
        return false;
      },
    };

    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  // Helper essencial para executar o Functional Guard no contexto de injeção correto
  const runGuard = () => {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  };

  it('deve PERMITIR a navegação se o usuário estiver devidamente autenticado', () => {
    // Arrange: força o getter do serviço a retornar verdadeiro (token em memória ativo)
    vi.spyOn(authServiceMock, 'isAuthenticated', 'get').mockReturnValue(true);

    // Act
    const result = runGuard();

    // Assert
    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('deve BLOQUEAR a navegação e desviar o fluxo para a tela de login se o usuário for anônimo', () => {
    // Arrange: força o getter a retornar falso (sem sessão ativa)
    vi.spyOn(authServiceMock, 'isAuthenticated', 'get').mockReturnValue(false);

    // Act
    const result = runGuard();

    // Assert
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
