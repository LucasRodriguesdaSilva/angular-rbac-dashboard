import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth-interceptor';
import { SecurityLog } from '../services/security-log';
import { AuthService } from '../services/auth-service';

describe('AuthInterceptor & Error Handling Layer', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: any;
  let securityLogServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      getAccessToken: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn()
    };

    securityLogServiceMock = {
      logThreat: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: SecurityLog, useValue: securityLogServiceMock }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('deve injetar o cabeçalho Authorization: Bearer caso o token exista na RAM', () => {
    // Arrange
    authServiceMock.getAccessToken.mockReturnValue('token-secreto-ram');

    // Act
    httpClient.get('/api/users').subscribe();

    // Assert
    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBeTruthy();
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-secreto-ram');
    req.flush({});
  });

  it('deve interceptar erro 403 Forbidden e enviar telemetria crítica ao SIEM', () => {
    // Arrange
    authServiceMock.getAccessToken.mockReturnValue('token-valido');

    // Act
    httpClient.get('/api/admin/config').subscribe({
      error: () => {
        console.log('err');
      }
    });

    // Assert
    const req = httpMock.expectOne('/api/admin/config');
    req.flush('Acesso proibido por assinatura', { status: 403, statusText: 'Forbidden' });

    expect(securityLogServiceMock.logThreat).toHaveBeenCalledWith(
      'Violação de Acesso detectada pelo Servidor (HTTP 403)',
      '/api/admin/config',
      'CRITICAL',
      expect.any(String)
    );
  });
});
