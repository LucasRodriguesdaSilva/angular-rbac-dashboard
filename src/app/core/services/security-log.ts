import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { SecurityEvent, ThreatSeverity } from '../models/security-log.models';
import { Storage } from './storage';

@Injectable({
  providedIn: 'root',
})
export class SecurityLog {
  private authService = inject(AuthService);
  private storageService = inject(Storage);
  private readonly STORAGE_KEY = 'siem_security_logs';

  private logsSubject = new BehaviorSubject<SecurityEvent[]>(this.loadInitialLogs());
  public securityEvents$: Observable<SecurityEvent[]> = this.logsSubject.asObservable();

  private loadInitialLogs(): SecurityEvent[] {
    const saved = this.storageService.getItem<SecurityEvent[]>(this.STORAGE_KEY);
    return saved ? saved : [];
  }

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

    const currentLogs = this.logsSubject.value;
    const updatedLogs = [securityEvent, ...currentLogs];

    this.storageService.setItem(this.STORAGE_KEY, updatedLogs);
    this.logsSubject.next(updatedLogs);

    console.warn(`[SIEM MOCK - ${severity}] Violação Detectada:`, securityEvent);
  }

  getPersistedLogs(): SecurityEvent[] {
    return this.logsSubject.value;
  }
}
