import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';
import { of } from 'rxjs';
import { SecurityLog } from '../../../../core/services/security-log';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let securityLogServiceMock: any;

  beforeEach(() => {
    securityLogServiceMock = {
      securityEvents$: of([]),
    };

    TestBed.configureTestingModule({
      imports: [Home],
      providers: [{ provide: SecurityLog, useValue: securityLogServiceMock }],
    });

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  it('🟢 GREEN: deve instanciar o painel de dashboard com as métricas zeradas', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.totalLogs).toBe(0);
  });
});
