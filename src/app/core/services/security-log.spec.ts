import { TestBed } from '@angular/core/testing';
import { SecurityLog } from './security-log';
import { AuthService } from './auth-service';
import { SecurityEvent } from '../models/security-log.models';
describe('SecurityLog', () => {
  let service: SecurityLog;
  let authServiceMock: any;

  const mockUser = {
    id: 'usr_regular_456',
    email: 'user@user.com',
    name: 'Operador Comum',
    role: 'USER',
    permissions: [],
  };

  beforeEach(() => {
    authServiceMock = {
      get currentUserValue() {
        return null;
      },
    };

    TestBed.configureTestingModule({
      providers: [SecurityLog, { provide: AuthService, useValue: authServiceMock }],
    });
  });

  const createService = () => {
    service = TestBed.inject(SecurityLog);
  };

  it('deve formatar um log de ameaça corretamente com usuário anônimo', () => {
    // Arrange
    vi.spyOn(authServiceMock, 'currentUserValue', 'get').mockReturnValue(null);
    createService();

    let capturedLog: SecurityEvent | null = null;
    service.securityEvents$.subscribe((log) => (capturedLog = log));

    // Act
    service.logThreat(
      'Tentativa de acesso não autenticado',
      '/users',
      'WARNING',
      'Burlar AuthGuard',
    );

    // Assert
    expect(capturedLog).toBeTruthy();
    expect(capturedLog!.userId).toBeNull();
    expect(capturedLog!.userEmail).toBeNull();
    expect(capturedLog!.action).toBe('Tentativa de acesso não autenticado');
    expect(capturedLog!.route).toBe('/users');
    expect(capturedLog!.severity).toBe('WARNING');
    expect(capturedLog!.id).toContain('evt_');
    expect(capturedLog!.timestamp).toBeInstanceOf(Date);
  });

  it('deve injetar automaticamente os dados do usuário autenticado no payload do SIEM', () => {
    // Arrange
    vi.spyOn(authServiceMock, 'currentUserValue', 'get').mockReturnValue(mockUser);
    createService();

    let capturedLog: SecurityEvent | null = null;
    service.securityEvents$.subscribe((log) => (capturedLog = log));

    // Act
    service.logThreat('Acesso negado a tela de auditoria', '/audit-logs', 'CRITICAL');

    // Assert
    expect(capturedLog).toBeTruthy();
    expect(capturedLog!.userId).toBe('usr_regular_456');
    expect(capturedLog!.userEmail).toBe('user@user.com');
    expect(capturedLog!.severity).toBe('CRITICAL');
  });
});
