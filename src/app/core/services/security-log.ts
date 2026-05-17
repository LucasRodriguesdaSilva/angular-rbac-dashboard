import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { Subject } from 'rxjs';
import { SecurityEvent, ThreatSeverity } from '../models/security-log.models';

@Injectable({
  providedIn: 'root',
})
export class SecurityLog {
  private authService = inject(AuthService);

  private securityLogSubject = new Subject<SecurityEvent>();
  securityEvents$ = this.securityLogSubject.asObservable();

  private logsHistory: SecurityEvent[] = [];

  logThreat(action: string, route: string, severity: ThreatSeverity, details?: string): void {
    const currentUser = this.authService.currentUserValue;

    const securityEvent: SecurityEvent = {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: currentUser ? currentUser.id : null,
      userEmail: currentUser ? currentUser.email : null,
      action,
      route,
      severity,
      details,
    };

    this.logsHistory.push(securityEvent)
    this.securityLogSubject.next(securityEvent)

    console.warn(`[SIEM MOCK - ${severity}] Violação de Segurança Detectada:`, securityEvent);
  }

  getHistoricalLogs(): SecurityEvent[] {
    return [...this.logsHistory]
  }
}
