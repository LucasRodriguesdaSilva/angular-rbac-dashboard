import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { SecurityEvent } from '../../../../core/models/security-log.models';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  startWith,
  Subject,
  map,
  takeUntil,
} from 'rxjs';
import { SecurityLog } from '../../../../core/services/security-log';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-logs-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    ScrollingModule,
  ],
  templateUrl: './logs-list.html',
  styleUrl: './logs-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsList implements OnInit, OnDestroy {
  // Mantemos apenas o serviço real de logs de segurança
  private securityLogService = inject(SecurityLog);
  private cdr = inject(ChangeDetectorRef);

  public logs: SecurityEvent[] = [];
  public displayedColumns: string[] = ['timestamp', 'userEmail', 'action', 'route', 'severity'];

  public searchControl = new FormControl('', { nonNullable: true });
  public severityControl = new FormControl<'CRITICAL' | 'WARNING' | 'INFO' | null>(null);

  private destroy$ = new Subject<void>();

  public ngOnInit(): void {
    // Inscreve-se nas mudanças de filtros da tela
    combineLatest([
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
      ),
      this.severityControl.valueChanges.pipe(startWith(null)),
    ])
      .pipe(
        map(([search, severity]) => {
          // 1. Pega TODOS os logs reais gravados durante a sessão do usuário
          let realLogs = this.securityLogService.getPersistedLogs();

          // 2. Aplica o filtro de texto (Busca)
          if (search) {
            const term = search.toLowerCase();
            realLogs = realLogs.filter(log =>
              log.action.toLowerCase().includes(term) ||
              (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
              (log.route && log.route.toLowerCase().includes(term))
            );
          }

          // 3. Aplica o filtro de Severidade (Chips)
          if (severity) {
            realLogs = realLogs.filter(log => log.severity === severity);
          }

          // 4. Ordena para que os ataques mais recentes apareçam no topo
          return realLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((filteredLogs) => {
        // Atualiza a tabela exclusivamente com os dados reais filtrados
        this.logs = filteredLogs;
        this.cdr.markForCheck();
      });
  }

  /**
   * Otimização do DOM para renderização ultra rápida
   */
  public trackByLogId(index: number, item: SecurityEvent): string {
    return item.id;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
