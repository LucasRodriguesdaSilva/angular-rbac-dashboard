import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TokenResponse, User, UserPermission } from '../models/auth.models';
import { Storage } from './storage';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * @constant STORAGE_USER_SESSION_KEY - Chave do storage para a sessão do usuário
   */
  public STORAGE_USER_SESSION_KEY = 'user_session';

  /**
   * @constant STORAGE_AUTH_REFRESH_TOKEN_KEY - Chave do storage para os tokens do usuário
   */
  public STORAGE_AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';

  /**
   * @private {BehaviorSubject} currentUserSubject$
   *
   * Gerencimaneto de estado em memória altamente encapsulado
   */
  private currentUserSubject$ = new BehaviorSubject<User | null>(null);

  /**
   * @public {Observable} currentUser$
   *
   * Exposição pública de streams reativas
   */
  public currentUser$: Observable<User | null> = this.currentUserSubject$.asObservable();

  /**
   * O Access Token reside estritamente na memória RAM da aplicação.
   */
  private accessTokenInMemory: string | null = null;

  private storageService = inject(Storage);

  constructor() {
    this.hydrateSession();
  }

  /**
   * Recupera automaticamente o estado da sessão a partir do Storage no bootstrap da aplicação
   */
  private hydrateSession(): void {
    const savedUser = this.storageService.getItem<User>(this.STORAGE_USER_SESSION_KEY);
    const savedTokens = this.storageService.getItem<TokenResponse>(
      this.STORAGE_AUTH_REFRESH_TOKEN_KEY,
    );

    if (savedTokens && savedUser) {
      this.currentUserSubject$.next(savedUser);
      this.accessTokenInMemory = 'mock-initial-access-token';
    }
  }

  /**
   * Define a sessão ativa após autenticação bem-sucedida
   *
   * @param tokens - Tokens do usuário
   * @param user - Dados do usuário
   */
  setSession(tokens: TokenResponse, user: User): void {
    this.storageService.setItem(this.STORAGE_AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken);
    this.storageService.setItem(this.STORAGE_USER_SESSION_KEY, user);

    this.accessTokenInMemory = tokens.accessToken;
    this.currentUserSubject$.next(user);
  }

  /**
   * Finaliza a sessão atual limpando vestígios de credenciais do cliente
   */
  logout(): void {
    this.storageService.removeItem(this.STORAGE_AUTH_REFRESH_TOKEN_KEY);
    this.storageService.removeItem(this.STORAGE_USER_SESSION_KEY);
    this.currentUserSubject$.next(null);
    this.accessTokenInMemory = null;
  }

  /**
   * Retorna dados do usuário logado
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject$.value;
  }

  /**
   * Valida se há uma sessão de usuário ativa
   */
  public get isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  /**
   *Egine do RBAC: Avalia de forma síncrona se o usuário ativo detém o privilégio exigido
   * @param permission
   * @returns
   */
  hasPermission(permission: UserPermission): boolean {
    const user = this.currentUserValue;

    if (!user) return false;

    return user.permissions.includes(permission);
  }

  /**
   * Retorna o Access Token ativo para injeção via Interceptor
   */
  getAccessToken(): string | null {
    return this.accessTokenInMemory;
  }
}
