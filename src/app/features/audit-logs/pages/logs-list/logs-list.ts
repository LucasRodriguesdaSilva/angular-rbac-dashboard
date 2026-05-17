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
  switchMap,
  takeUntil,
} from 'rxjs';
import { AuditService } from '../../services/audit-service';
import { LogFilters } from '../../models/audit.models';
import { SecurityLog } from '../../../../core/services/security-log';

@Component({
  selector: 'app-logs-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    ScrollingModule,
  ],
  templateUrl: './logs-list.html',
  styleUrl: './logs-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsList implements OnInit, OnDestroy {
  private auditService = inject(AuditService);
  private cdr = inject(ChangeDetectorRef);
  private securityLogService = inject(SecurityLog); // Injetar nova dependência
  public logs: SecurityEvent[] = [];
  public displayedColumns: string[] = ['timestamp', 'userEmail', 'action', 'route', 'severity'];

  public searchControl = new FormControl('', { nonNullable: true });
  public severityControl = new FormControl<'CRITICAL' | 'WARNING' | 'INFO' | null>(null);

  private destroy$ = new Subject<void>();

  public ngOnInit(): void {
    combineLatest([
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
      ),
      this.severityControl.valueChanges.pipe(startWith(null)),
    ])
      .pipe(
        switchMap(([search, severity]) => {
          const filters: LogFilters = { search, severity };
          return this.auditService.getAuditLogs(filters);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((apiData) => {
        const localLogs = this.securityLogService.getPersistedLogs();
        this.logs = [...localLogs, ...apiData];
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
