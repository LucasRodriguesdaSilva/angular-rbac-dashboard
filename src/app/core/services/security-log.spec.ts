import { TestBed } from '@angular/core/testing';
import { SecurityLog } from './security-log';
import { AuthService } from './auth-service';
import { SecurityEvent } from '../models/security-log.models';
import { Storage } from './storage';
describe('SecurityLog', () => {
  let service: SecurityLog;
  let storageServiceMock: any;
  let authServiceMock: any;

  const mockUser = {
    id: 'usr_regular_456',
    email: 'user@user.com',
    name: 'Operador Comum',
    role: 'USER',
    permissions: [],
  };

  beforeEach(() => {
    // Mock do Serviço de Autenticação
    authServiceMock = {
      get currentUserValue() {
        return null;
      },
    };

    // Mock do Wrapper de LocalStorage (Garante isolamento total do teste de rede/disco)
    storageServiceMock = {
      getItem: vi.fn().mockReturnValue(null), // Começa sem logs anteriores persistidos
      setItem: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SecurityLog,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Storage, useValue: storageServiceMock },
      ],
    });
  });

  const createService = () => {
    service = TestBed.inject(SecurityLog);
  };

  it('🟢 GREEN: deve formatar um log de ameaça corretamente com usuário anônimo e salvar no storage', () => {
    // Arrange
    vi.spyOn(authServiceMock, 'currentUserValue', 'get').mockReturnValue(null);
    createService();

    let capturedLog: SecurityEvent[] = [];
    service.securityEvents$.subscribe((logs) => (capturedLog = logs));

    // Act
    service.logThreat(
      'Tentativa de acesso não autenticado',
      '/users',
      'WARNING',
      'Burlar AuthGuard',
    );

    // Assert
    expect(capturedLog.length).toBe(1);
    const log = capturedLog[0];

    expect(log).toBeTruthy();
    expect(log.userId).toBeNull();
    expect(log.userEmail).toBeNull();
    expect(log.action).toBe('Tentativa de acesso não autenticado');
    expect(log.route).toBe('/users');
    expect(log.severity).toBe('WARNING');
    expect(log.details).toBe('Burlar AuthGuard');
    expect(log.id).toContain('evt_');
    expect(log.timestamp).toBeInstanceOf(Date);

    // Valida se salvou fisicamente no LocalStorage corporativo
    expect(storageServiceMock.setItem).toHaveBeenCalledWith(
      'siem_security_logs',
      expect.any(Array),
    );
  });

  it('🟢 GREEN: deve injetar automaticamente os dados do usuário autenticado no payload do SIEM', () => {
    // Arrange
    vi.spyOn(authServiceMock, 'currentUserValue', 'get').mockReturnValue(mockUser);
    createService();

    let capturedLog: SecurityEvent[] = [];
    service.securityEvents$.subscribe((logs) => (capturedLog = logs));

    // Act
    service.logThreat('Acesso negado a tela de auditoria', '/audit-logs', 'CRITICAL');

    // Assert
    expect(capturedLog.length).toBe(1);
    const log = capturedLog[0];

    expect(log).toBeTruthy();
    expect(log.userId).toBe('usr_regular_456');
    expect(log.userEmail).toBe('user@user.com');
    expect(log.severity).toBe('CRITICAL');
  });

  it('🟢 GREEN: deve hidratar o estado inicial buscando o histórico pré-existente do LocalStorage', () => {
    // Arrange
    const preExistingLogs: SecurityEvent[] = [
      {
        id: 'evt_old123',
        timestamp: new Date(),
        userId: 'usr_007',
        userEmail: 'bond@mi6.com',
        action: 'Invasão evitada',
        route: '/admin',
        severity: 'CRITICAL',
      },
    ];
    // Força o storage a retornar dados salvos de uma sessão anterior
    storageServiceMock.getItem.mockReturnValue(preExistingLogs);

    // Act
    createService(); // Inicializa o serviço chamando loadInitialLogs()

    // Assert
    const currentLogs = service.getPersistedLogs();
    expect(currentLogs.length).toBe(1);
    expect(currentLogs[0].id).toBe('evt_old123');
    expect(currentLogs[0].userEmail).toBe('bond@mi6.com');
  });
});
