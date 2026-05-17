import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ListUsersParams, PaginatedUsers, UserManagement } from '../models/user.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  /**
   * Lista os usuários salvos no banco
   * @param {ListUsersParams} params
   * @returns {Observable<PaginatedUsers>} PaginatedUsers
   */
  public listUsers(params: ListUsersParams): Observable<PaginatedUsers> {
    let newHttpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.filters) {
      const filters = params.filters;
      if (filters.search) {
        newHttpParams = newHttpParams.set('search', filters.search);
      }

      if (filters.role) {
        newHttpParams = newHttpParams.set('role', filters.role);
      }
    }

    return this.http.get<PaginatedUsers>(this.baseUrl, { params: newHttpParams });
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
