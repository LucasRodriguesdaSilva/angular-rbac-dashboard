import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserForm } from './user-form';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UsersService } from '../../services/users-service';
import { Toast } from '../../../../core/services/toast';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

describe('UserForm', () => {
  let component: UserForm;
  let fixture: ComponentFixture<UserForm>;
  // Mocks estritos com o Vitest eliminando 'any'
  let usersServiceMock: { createUser: any; getUserById: any; updateUser: any };
  let toastServiceMock: { success: any; error: any };
  let routerMock: { navigate: any };

  // Dublê de testes dinâmico para a API do ActivatedRoute
  const activatedRouteStub = {
    snapshot: {
      paramMap: convertToParamMap({}), // Inicializa em modo de criação (sem ID na URL)
    },
  };

  beforeEach(() => {
    usersServiceMock = {
      createUser: vi.fn().mockReturnValue(of({ id: 'usr_mocked' })),
      getUserById: vi.fn().mockReturnValue(
        of({
          id: 'usr_1',
          name: 'John Support',
          email: 'john@teste.com',
          role: 'SUPPORT',
          permissions: ['users.read'],
          active: true,
          createdAt: '2026-05-17T00:00:00.000Z',
        }),
      ),
      updateUser: vi.fn().mockReturnValue(of({})),
    };

    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      imports: [UserForm, NoopAnimationsModule],
      providers: [
        { provide: UsersService, useValue: usersServiceMock },
        { provide: Toast, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteStub }, // Injetor do Provider ausente corrigido
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserForm);
    component = fixture.componentInstance;
  });

  it('deve inicializar o formulário reativo com campos vazios no modo de criação', () => {
    fixture.detectChanges(); // Aciona o ngOnInit de forma síncrona

    expect(component.userForm).toBeTruthy();
    expect(component.userForm.get('name')?.value).toBe('');
    expect(component.userForm.get('email')?.value).toBe('');
    expect(component.userForm.get('password')?.value).toBe('');
    expect(component.userForm.get('role')?.value).toBe('');
    expect(component.userForm.valid).toBeFalsy();
  });

  it('deve invalidar o formulário se o e-mail for malformado', () => {
    fixture.detectChanges();

    component.userForm.get('email')?.setValue('ataque-xss-malicioso');
    expect(component.userForm.get('email')?.hasError('email')).toBeTruthy();
  });

  it('deve validar os critérios de segurança estritos para senha forte', () => {
    fixture.detectChanges();
    const passwordControl = component.userForm.get('password');

    // Caso 1: Senha fraca (apenas letras)
    passwordControl?.setValue('somenteletras');
    expect(passwordControl?.hasError('weakPassword')).toBeTruthy();

    // Caso 2: Senha fraca (sem caractere especial)
    passwordControl?.setValue('SenhaComNumero123');
    expect(passwordControl?.hasError('weakPassword')).toBeTruthy();

    // Caso 3: Senha forte corporativa homologada pelo time de CyberSec
    passwordControl?.setValue('testeCyberSec#2026');
    expect(passwordControl?.hasError('weakPassword')).toBeFalsy();
  });

  it('deve gerenciar o array de permissões reativamente ao alternar os checkboxes', () => {
    fixture.detectChanges();

    component.onPermissionChange('users.create', true);
    expect(component.selectedPermissions).toContain('users.create');

    component.onPermissionChange('users.create', false);
    expect(component.selectedPermissions).not.toContain('users.create');
  });

  it('deve disparar o método HTTP POST do service e navegar em caso de sucesso', () => {
    fixture.detectChanges();

    component.userForm.patchValue({
      name: 'Novo Analista',
      email: 'analista@teste.com',
      password: 'StrongPassword@123',
      role: 'SUPPORT',
    });
    component.onPermissionChange('users.read', true);

    component.onSubmit();

    expect(usersServiceMock.createUser).toHaveBeenCalled();
    expect(toastServiceMock.success).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/users']);
  });
});
