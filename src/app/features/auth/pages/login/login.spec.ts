// src/app/features/auth/pages/login/login.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../../../core/services/auth-service';
import { AuthMockBackend } from '../../../../core/mocks/auth-mock.backend';
import { Observable,  throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authServiceMock: any;
  let routerMock: any;

  const waitAsync = () => new Promise((resolve) => setTimeout(resolve, 10));

  beforeEach(async () => {
    authServiceMock = {
      setSession: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('deve ser criado com sucesso', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar o formulário com campos vazios e de estado inválido', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.valid).toBeFalsy();
    expect(component.loginForm.get('email')?.value).toBe('');
  });

  it('deve acusar erro de validação caso o padrão de e-mail seja incorreto', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('payload-malicioso-sem-arroba');

    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it.skip('deve chamar o fluxo de login do backend e redirecionar para o dashboard em caso de sucesso', async () => {
  component.loginForm.get('email')?.setValue('admin@admin.com');
  component.loginForm.get('password')?.setValue('Senha@Forte2026');

  const mockUserResponse = {
    tokens: { accessToken: 'access', refreshToken: 'refresh' },
    user: { id: '1', email: 'admin@admin.com', name: 'Admin', role: 'ADMIN' as const, permissions: [] }
  };

  vi.spyOn(AuthMockBackend, 'login').mockImplementation(() => {
    return new Observable((subscriber) => {
      setTimeout(() => {
        subscriber.next(mockUserResponse);
        subscriber.complete();
      }, 0);
    });
  });

  component.onSubmit();

  await waitAsync();
  fixture.detectChanges();

  expect(authServiceMock.setSession).toHaveBeenCalledWith(
    mockUserResponse.tokens,
    mockUserResponse.user
  );
  expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  expect(component.isLoading).toBeFalsy();
});

  it('deve tratar erros de autenticação mantendo o usuário na tela de login', async () => {
    // Arrange
    component.loginForm.get('email')?.setValue('errado@admin.com');
    component.loginForm.get('password')?.setValue('123456');

    vi.spyOn(AuthMockBackend, 'login').mockReturnValue(
      throwError(() => new Error('Credenciais inválidas ou usuário inexistente.')).pipe(delay(0)),
    );

    // Act
    component.onSubmit();

    await waitAsync();
    await fixture.whenStable();
    fixture.detectChanges();

    // Assert
    expect(authServiceMock.setSession).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Credenciais inválidas ou usuário inexistente.');
    expect(component.isLoading).toBeFalsy();
  });
});
