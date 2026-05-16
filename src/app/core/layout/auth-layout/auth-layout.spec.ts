import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthLayout } from './auth-layout';
import { RouterOutlet } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('AuthLayout', () => {
  let component: AuthLayout;
  let fixture: ComponentFixture<AuthLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayout],
      providers: [
        // Fornece uma configuração de rotas vazia necessária para o RouterOutlet funcionar no teste
        { provide: 'ROUTES', useValue: [] }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayout);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Gatilho para renderização inicial
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve conter uma tag router-outlet para renderizar as telas de autenticação', () => {
    const routerOutletDebugElement = fixture.debugElement.query(By.directive(RouterOutlet));
    expect(routerOutletDebugElement).not.toBeNull();
  });

  it('deve renderizar a div container com a classe CSS correta', () => {
    const containerElement = fixture.debugElement.query(By.css('.auth-container'));
    expect(containerElement).not.toBeNull();
  });
});
