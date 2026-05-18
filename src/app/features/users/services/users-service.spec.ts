import { TestBed } from '@angular/core/testing';
import { UsersService } from './users-service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ListUsersParams, PaginatedUsers, UserManagement } from '../models/user.models';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  const mockUserList: UserManagement[] = [
    {
      id: 'usr_1',
      name: 'Alice Blue',
      email: 'alice@teste.com',
      role: 'ADMIN',
      permissions: ['users.read', 'users.create'],
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_2',
      name: 'Bob Support',
      email: 'bob@teste.com',
      role: 'SUPPORT',
      permissions: ['users.read', 'logs.read'],
      active: true,
      createdAt: '2026-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService],
    });

    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Garante que nenhuma requisição HTTP ficou pendente
  });

  it('deve ser criado com tipagem estrita', () => {
    expect(service).toBeTruthy();
  });

  it('deve retornar uma lista paginada de usuários com filtros aplicados (GET)', () => {
  const queryParams: ListUsersParams = {
    page: 1,
    limit: 10,
    filters: { search: 'Alice', role: 'ADMIN' }
  };

  const mockResponse: PaginatedUsers = {
    data: [mockUserList[0]],
    total: 1,
    page: 1,
    limit: 10
  };

  service.listUsers(queryParams).subscribe((response: PaginatedUsers) => {
    expect(response.data.length).toBe(1);
    expect(response.total).toBe(1);
  });

  const req = httpMock.expectOne((request) =>
    request.url === '/api/users' &&
    request.params.get('page') === '1' &&
    request.params.get('limit') === '10' &&
    request.params.get('search') === 'Alice' &&
    request.params.get('role') === 'ADMIN'
  );

  expect(req.request.method).toBe('GET');
  req.flush(mockResponse);
});

  it('deve buscar um usuário específico por ID (GET)', () => {
    const targetUser = mockUserList[0];

    service.getUserById('usr_1').subscribe((user: UserManagement) => {
      expect(user).toEqual(targetUser);
    });

    const req = httpMock.expectOne('/api/users/usr_1');
    expect(req.request.method).toBe('GET');
    req.flush(targetUser);
  });

  it('deve enviar o payload correto para criar um novo usuário (POST)', () => {
    const newUser: Omit<UserManagement, 'id' | 'createdAt'> = {
      name: 'Charlie User',
      email: 'charlie@teste.com',
      role: 'USER',
      permissions: [],
      active: true,
    };

    const expectedResponse: UserManagement = {
      id: 'usr_3',
      createdAt: '2026-05-17T00:00:00.000Z',
      ...newUser,
    };

    service.createUser(newUser).subscribe((user: UserManagement) => {
      expect(user.id).toBe('usr_3');
      expect(user.name).toBe('Charlie User');
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(expectedResponse);
  });

  it('deve enviar a atualização parcial do usuário (PUT)', () => {
    const updatedData: Partial<UserManagement> = { active: false };
    const mockResponse: UserManagement = { ...mockUserList[0], active: false };

    service.updateUser('usr_1', updatedData).subscribe((user: UserManagement) => {
      expect(user.active).toBeFalsy();
    });

    const req = httpMock.expectOne('/api/users/usr_1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedData);
    req.flush(mockResponse);
  });

  it('deve disparar a remoção do usuário pelo ID (DELETE)', () => {
    service.deleteUser('usr_1').subscribe((response: null) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne('/api/users/usr_1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
