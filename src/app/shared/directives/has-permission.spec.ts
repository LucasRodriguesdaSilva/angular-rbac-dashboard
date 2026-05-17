import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HasPermission } from './has-permission';
import { AuthService } from '../../core/services/auth-service';

@Component({
  standalone: true,
  imports: [HasPermission],
  template: `<button *appHasPermission="'users.delete'">Excluir Usuário</button>`,
})
class TestHostComponent {}

describe('HasPermissionDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let authServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      hasPermission: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    });
  });

  it('deve MANTER o botão no DOM se o usuário tiver a permissão', () => {
    authServiceMock.hasPermission.mockReturnValue(true);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const buttonEl = fixture.nativeElement.querySelector('button');
    expect(buttonEl).toBeTruthy();
    expect(buttonEl.textContent).toBe('Excluir Usuário');
  });

  it('deve DESTRUIR/REMOVER o botão do DOM se o usuário NÃO tiver a permissão', () => {
    authServiceMock.hasPermission.mockReturnValue(false);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const buttonEl = fixture.nativeElement.querySelector('button');
    expect(buttonEl).toBeNull();
  });
});
