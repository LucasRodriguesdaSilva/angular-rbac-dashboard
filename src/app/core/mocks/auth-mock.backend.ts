import { of, Observable, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TokenResponse, User } from '../models/auth.models';

export class AuthMockBackend {

  // "Banco de dados" em memória para simular perfis distintos de acessibilidade
  private static mockUsersDatabase: Record<string, { user: User; pass: string }> = {
    'admin@admin.com': {
      pass: 'Senha@Forte2026',
      user: {
        id: 'usr_admin_01',
        email: 'admin@admin.com',
        name: 'Admin',
        role: 'ADMIN',
        permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'logs.read']
      }
    },
    'support@suporte.com': {
      pass: 'Suporte@suporte123',
      user: {
        id: 'usr_support_02',
        email: 'support@suporte.com',
        name: 'Analista de Suporte',
        role: 'SUPPORT',
        permissions: ['users.read', 'logs.read'] // Não cria, atualiza ou deleta usuários
      }
    },
    'user@user.com': {
      pass: 'User@user123',
      user: {
        id: 'usr_regular_03',
        email: 'user@user.com',
        name: 'Operador Comum',
        role: 'USER',
        permissions: [] // Apenas visualiza o dashboard comum, sem acesso a dados sensíveis
      }
    }
  };

  static login(email: string, password: string): Observable<{ tokens: TokenResponse; user: User }> {
    const account = this.mockUsersDatabase[email];

    // Validação estrita de credenciais
    if (account && account.pass === password) {
      const mockTokens: TokenResponse = {
        accessToken: `mock-jwt-access-token-for-${account.user.role.toLowerCase()}`,
        refreshToken: `mock-jwt-refresh-token-for-${account.user.role.toLowerCase()}`
      };

      return of({ tokens: mockTokens, user: account.user }).pipe(delay(800));
    }

    return throwError(() => new Error('Credenciais inválidas ou usuário inexistente.')).pipe(delay(800));
  }
}
