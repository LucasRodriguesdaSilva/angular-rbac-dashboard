import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ListUsersParams, PaginatedUsers, UserManagement } from '../models/user.models';
import { delay, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  private MOCK_USERS: UserManagement[] = [
    {
      id: 'usr_admin_01',
      name: 'Admin',
      email: 'admin@admin.com',
      role: 'ADMIN',
      active: true,
      createdAt: '2023-01-10T08:00:00Z',
      permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'logs.read'],
    },
    {
      id: 'usr_support_02',
      name: 'Analista de Suporte',
      email: 'support@suporte.com',
      role: 'SUPPORT', // Lembre-se de adicionar 'SUPPORT' ao seu HTML na checagem de cores, se quiser!
      active: true,
      createdAt: '2023-05-20T14:30:00Z',
      permissions: ['users.read', 'logs.read'],
    },
    {
      id: 'usr_regular_03',
      name: 'Operador Comum',
      email: 'user@user.com',
      role: 'USER',
      active: true,
      createdAt: '2024-02-15T09:15:00Z',
      permissions: [], // Apenas visualiza o dashboard comum, sem acesso a dados sensíveis
    },
  ];

  /**
   * Lista os usuários salvos no banco
   * @param {ListUsersParams} params
   * @returns {Observable<PaginatedUsers>} PaginatedUsers
   */
  public listUsers(params: ListUsersParams): Observable<PaginatedUsers> {
    let filteredUsers = [...this.MOCK_USERS];

    // Filtro de busca reativo (Nome ou E-mail)
    if (params.filters?.search) {
      const searchTerm = params.filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm),
      );
    }

    // Paginação
    const total = filteredUsers.length;
    const startIndex = (params.page - 1) * params.limit;
    const endIndex = startIndex + params.limit;
    const paginatedData = filteredUsers.slice(startIndex, endIndex);

    // Retorno com delay para visualização do Loading/Blur
    return of({
      data: paginatedData,
      total: total,
      page: params.page,
      limit: params.limit,
    }).pipe(delay(800));
  }

  /**
   * Lista um usuário por seu ID
   * @param id - ID do usuário
   * @returns {Observable<UserManagement>} User
   */
  public getUserById(id: string): Observable<UserManagement> {
    return this.http.get<UserManagement>(`${this.baseUrl}/${id}`);
  }

  /**
   * Cria um novo usuário
   * @param {Omit<UserManagement, 'id' | 'createdAt'>} user
   * @returns {Observable<UserManagement>} User
   */
  public createUser(user: Omit<UserManagement, 'id' | 'createdAt'>): Observable<UserManagement> {
    return this.http.post<UserManagement>(this.baseUrl, user);
  }

  /**
   * Atualiza um usuário
   * @param {string} id - ID do usuário
   * @param {Partial<UserManagement>} user - Dados para atualização do usuário
   * @returns {UserManagement} user
   */
  public updateUser(id: string, user: Partial<UserManagement>): Observable<UserManagement> {
    return this.http.put<UserManagement>(`${this.baseUrl}/${id}`, user);
  }

  /**
   * Deleta um usuário
   * @param {string} id - ID do usuário
   */
  public deleteUser(id: string): Observable<null> {
    return this.http.delete<null>(`${this.baseUrl}/${id}`);
  }
}
