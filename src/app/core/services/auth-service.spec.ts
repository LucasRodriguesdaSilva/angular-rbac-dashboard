import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';
import { TokenResponse, User } from '../models/auth.models';
import { Storage } from './storage';

describe('AuthService', () => {
  let service: AuthService;
  let storageServiceMock: any;

  const mockTokens: TokenResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const mockUser: User = {
    id: 'usr_123',
    email: 'admin@admin.com',
    name: 'Admin Blue Team',
    role: 'ADMIN',
    permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'logs.read'],
  };

  beforeEach(() => {
    // Criação do Mock para o StorageService isolar os testes do LocalStorage real
    storageServiceMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Storage, useValue: storageServiceMock }],
    });
  });

  // Helper para instanciar o serviço após configurar os mocks necessários por caso de uso
  const createService = () => {
    service = TestBed.inject(AuthService);
  };

  it('deve inicializar deslogado se não houver tokens no storage', () => {
    // CORREÇÃO 2: Alterado de withImplementation para mockImplementation
    storageServiceMock.getItem.mockImplementation(() => null);
    createService();

    expect(service.isAuthenticated).toBeFalsy();
    expect(service.currentUserValue).toBeNull();
  });

  it('deve restaurar a sessão automaticamente no reload se houver tokens válidos', () => {
    // CORREÇÃO 2: Alinhando chaves de busca ao mecanismo seguro de hidratação
    storageServiceMock.getItem.mockImplementation((key: string) => {
      if (key === 'auth_refresh_token') return mockTokens.refreshToken;
      if (key === 'user_session') return mockUser;
      return null;
    });

    createService();

    expect(service.isAuthenticated).toBeTruthy();
    expect(service.currentUserValue).toEqual(mockUser);
  });

  it('deve realizar login com sucesso, armazenar tokens e expor o estado reativamente', () => {
    storageServiceMock.getItem.mockImplementation(() => null);
    createService();

    let emittedUser: User | null = null;
    service.currentUser$.subscribe((user) => (emittedUser = user));

    // Act
    service.setSession(mockTokens, mockUser);

    // Assert - CORREÇÃO 3: Validando as chaves exclusivas de mitigação XSS
    expect(storageServiceMock.setItem).toHaveBeenCalledWith('auth_refresh_token', mockTokens.refreshToken);
    expect(storageServiceMock.setItem).toHaveBeenCalledWith('user_session', mockUser);
    expect(service.isAuthenticated).toBeTruthy();
    expect(emittedUser).toEqual(mockUser);
  });

  it('deve limpar os dados do storage e redefinir os estados ao efetuar logout', () => {
    storageServiceMock.getItem.mockImplementation((key: string) => {
      if (key === 'auth_refresh_token') return mockTokens.refreshToken;
      if (key === 'user_session') return mockUser;
      return null;
    });
    createService();

    service.logout();

    // CORREÇÃO 4: Assegurando a remoção das chaves corretas de persistência mínima
    expect(storageServiceMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
    expect(storageServiceMock.removeItem).toHaveBeenCalledWith('user_session');
    expect(service.isAuthenticated).toBeFalsy();
    expect(service.currentUserValue).toBeNull();
  });

  it('deve validar corretamente se o usuário possui uma permissão específica (RBAC)', () => {
    storageServiceMock.getItem.mockImplementation((key: string) => {
      if (key === 'user_session') return { ...mockUser, permissions: ['users.read'] };
      if (key === 'auth_refresh_token') return mockTokens.refreshToken;
      return null;
    });
    createService();

    expect(service.hasPermission('users.read')).toBeTruthy();
    expect(service.hasPermission('users.delete')).toBeFalsy();
  });

  // Mantendo a blindagem de segurança que criamos contra XSS
  it('NÃO deve salvar o accessToken no localStorage por motivos de segurança (Mitigação XSS)', () => {
    storageServiceMock.getItem.mockImplementation(() => null);
    createService();

    service.setSession(mockTokens, mockUser);

    expect(storageServiceMock.setItem).not.toHaveBeenCalledWith('access_token', mockTokens.accessToken);
  });

  it('deve manter o accessToken seguro apenas em memória volátil', () => {
    storageServiceMock.getItem.mockImplementation(() => null);
    createService();

    service.setSession(mockTokens, mockUser);

    expect(service.getAccessToken()).toBe('mock-access-token');
  });

   it('deve restringir permissões administrativas para um usuário com papel de SUPPORT', () => {
    const supportUser: User = {
      id: 'usr_support_02',
      email: 'support@admin.com',
      name: 'Analista de Suporte',
      role: 'SUPPORT',
      permissions: ['users.read', 'logs.read'],
    };

    // Simula que o serviço inicializou com o usuário logado como SUPPORT
    storageServiceMock.getItem.mockImplementation((key: string) => {
      if (key === 'user_session') return supportUser;
      if (key === 'auth_refresh_token') return 'mock-refresh-token';
      return null;
    });

    createService();

    // Assert do controle de acesso baseado em Claims (RBAC)
    expect(service.hasPermission('users.read')).toBeTruthy(); // Permitido para suporte
    expect(service.hasPermission('logs.read')).toBeTruthy(); // Permitido para suporte
    expect(service.hasPermission('users.delete')).toBeFalsy(); // Totalmente bloqueado
    expect(service.hasPermission('users.create')).toBeFalsy(); // Totalmente bloqueado
  });

  it('deve bloquear QUALQUER permissão do sistema para um operador regular (USER)', () => {
    const regularUser: User = {
      id: 'usr_regular_03',
      email: 'user@admin.com',
      name: 'Operador Comum',
      role: 'USER',
      permissions: [], // Nenhuma permissão atribuída
    };

    storageServiceMock.getItem.mockImplementation((key: string) => {
      if (key === 'user_session') return regularUser;
      if (key === 'auth_refresh_token') return 'mock-refresh-token';
      return null;
    });

    createService();

    // Um usuário comum não deve passar em nenhuma validação de barreira de privilégios
    expect(service.hasPermission('users.read')).toBeFalsy();
    expect(service.hasPermission('logs.read')).toBeFalsy();
    expect(service.hasPermission('users.delete')).toBeFalsy();
  });
});
