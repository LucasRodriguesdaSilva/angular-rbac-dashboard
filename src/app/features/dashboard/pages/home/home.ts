import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { SecurityEvent } from '../../../../core/models/security-log.models';
import { SecurityLog } from '../../../../core/services/security-log';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit{
  private securityLogService = inject(SecurityLog);
  private cdr = inject(ChangeDetectorRef);

  public totalLogs = 0;
  public criticalThreats = 0;
  public warningAlerts = 0;
  public recentIncidents: SecurityEvent[] = [];

  public ngOnInit(): void {
    this.securityLogService.securityEvents$.subscribe((logs) => {
      this.totalLogs = logs.length;
      this.criticalThreats = logs.filter(l => l.severity === 'CRITICAL').length;
      this.warningAlerts = logs.filter(l => l.severity === 'WARNING').length;
      this.recentIncidents = logs.slice(0, 5); // Top 5 incidentes recentes
      this.cdr.markForCheck();
    });
  }
}
