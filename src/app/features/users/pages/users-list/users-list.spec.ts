import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersList } from './users-list';
import { ListUsersParams, PaginatedUsers } from '../../models/user.models';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UsersService } from '../../services/users-service';

describe('UsersList', () => {
  let component: UsersList;
  let fixture: ComponentFixture<UsersList>;
  let usersServiceMock: { listUsers: unknown };

  const mockPaginatedResponse: PaginatedUsers = {
    data: [
      {
        id: 'usr_99',
        name: 'John Doe',
        email: 'john@teste.com',
        role: 'USER',
        permissions: [],
        active: true,
        createdAt: '2026-05-17T00:00:00.000Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
  };

  beforeEach(() => {
    // Injetamos o mock retornando o valor síncrono para previsibilidade no ciclo do Angular
    usersServiceMock = {
      listUsers: vi.fn().mockReturnValue(of(mockPaginatedResponse)),
    };

    TestBed.configureTestingModule({
      imports: [UsersList, NoopAnimationsModule],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersList);
    component = fixture.componentInstance;
  });

  it('deve inicializar e carregar a tabela de usuários reativamente no ngOnInit', () => {
    fixture.detectChanges(); // Dispara o ciclo ngOnInit do componente

    const expectedParams: ListUsersParams = {
      page: 1,
      limit: 10,
      filters: { search: '', role: null },
    };

    expect(usersServiceMock.listUsers).toHaveBeenCalledWith(expectedParams);
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].name).toBe('John Doe');
  });

  it('deve disparar a busca reativa com debounceTime ao alterar o valor do filtro de busca', async () => {
    fixture.detectChanges();

    // Simula a digitação no FormControl reativo
    component.searchControl.setValue('Alice');

    // Substituição técnica do fakeAsync/tick por uma Promise controlada compatível com o Vitest Node
    await new Promise((resolve) => setTimeout(resolve, 310));
    fixture.detectChanges();

    const expectedParams: ListUsersParams = {
      page: 1,
      limit: 10,
      filters: { search: 'Alice', role: null },
    };

    // Valida se o debounce de 300ms completou e disparou a requisição mapeada com os filtros
    expect(usersServiceMock.listUsers).toHaveBeenCalledWith(expectedParams);
  });
});
