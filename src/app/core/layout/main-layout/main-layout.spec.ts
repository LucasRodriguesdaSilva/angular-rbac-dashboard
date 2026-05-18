import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayout } from './main-layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [
      MainLayout,
      NoopAnimationsModule,
      RouterTestingModule.withRoutes([])
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(MainLayout);
  component = fixture.componentInstance;
});

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve conter uma tag router-outlet para renderizar o miolo das páginas', () => {
    const routerOutlet = fixture.debugElement.query(By.directive(RouterOutlet));
    expect(routerOutlet).not.toBeNull();
  });


  it('deve ter links de navegação válidos configurados para a sidebar', () => {
    const hrefElements = fixture.debugElement.queryAll(By.directive(RouterLink));
    const links = hrefElements.map(el => el.injector.get(RouterLink).href);

    expect(links).toContain('/dashboard');
    expect(links).toContain('/users');
    expect(links).toContain('/audit-logs');
  });

  it('deve iniciar com a sidebar lateral aberta em modo fixo', () => {
    const sidenavDebug = fixture.debugElement.query(By.css('mat-sidenav'));
    const sidenavInstance = sidenavDebug.componentInstance;

    expect(sidenavInstance.opened).toBeTruthy();
    expect(sidenavInstance.mode).toBe('side');
  });
});
