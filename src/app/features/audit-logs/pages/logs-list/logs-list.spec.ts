import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LogsList } from './logs-list';
import { of } from 'rxjs';
import { SecurityEvent } from '../../../../core/models/security-log.models';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuditService } from '../../services/audit-service';
import { SecurityLog } from '../../../../core/services/security-log';

describe('LogsList - Verificação Blue Team & SIEM', () => {
  let component: LogsList;
  let fixture: ComponentFixture<LogsList>;
  let auditServiceMock: any;
  let securityLogServiceMock: any;

  const mockApiLogs: SecurityEvent[] = [
    {
      id: 'evt_api_1',
      timestamp: new Date(),
      userId: 'usr_101',
      userEmail: 'attacker_api@malicious.com',
      action: 'Tentativa de SQL Injection interceptada',
      route: '/api/v1/auth',
      severity: 'CRITICAL',
      details: 'WAF Block'
    }
  ];

  beforeEach(() => {
    // 1. Ativa os cronômetros falsos do Vitest para controlar o tempo do RxJS manualmente
    vi.useFakeTimers();

    auditServiceMock = {
      getAuditLogs: vi.fn().mockReturnValue(of(mockApiLogs))
    };

    securityLogServiceMock = {
      securityEvents$: of([]),
      getPersistedLogs: vi.fn().mockReturnValue([])
    };

    TestBed.configureTestingModule({
      imports: [LogsList, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: AuditService, useValue: auditServiceMock },
        { provide: SecurityLog, useValue: securityLogServiceMock }
      ]
    });

    fixture = TestBed.createComponent(LogsList);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Limpeza obrigatória para não afetar os testes de outros arquivos
    vi.useRealTimers();
  });

  it('CN1: 🟢 GREEN: deve carregar os dados consolidados de auditoria na inicialização', () => {
    // Inicializa o componente (ngOnInit roda e engatilha o combineLatest)
    fixture.detectChanges();

    // Avança o cronômetro do Vitest para vencer o debounceTime(300) inicial do startWith
    vi.advanceTimersByTime(350);

    // Processa as atualizações do OnPush e injeta os dados na tabela
    fixture.detectChanges();

    // Asserções limpas e síncronas
    expect(auditServiceMock.getAuditLogs).toHaveBeenCalled();
    expect(component.logs.length).toBe(1);
    expect(component.logs[0].id).toBe('evt_api_1');
    expect(component.logs[0].userEmail).toBe('attacker_api@malicious.com');
  });

  it('CN2: 🟢 GREEN: deve acionar a busca reativa ao digitar um termo no filtro', () => {
    fixture.detectChanges();
    vi.advanceTimersByTime(350); // Limpa o ciclo de inicialização

    // Simula a digitação na barra de busca de incidentes
    component.searchControl.setValue('SQL Injection');

    // Avança o tempo de forma controlada exatamente após o debounce
    vi.advanceTimersByTime(310);

    expect(auditServiceMock.getAuditLogs).toHaveBeenCalledWith({
      search: 'SQL Injection',
      severity: null
    });
  });
});
