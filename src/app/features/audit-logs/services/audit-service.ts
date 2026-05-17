import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { SecurityEvent } from '../../../core/models/security-log.models';
import { LogFilters } from '../models/audit.models';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  // Simulação de uma base de dados volumosa de segurança (+500 registros)
  private mockLogs: SecurityEvent[] = Array.from({ length: 550 }, (_, i) => ({
    id: `evt_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date(Date.now() - i * 60000),
    userId: i % 3 === 0 ? null : `usr_id_${100 + i}`,
    userEmail: i % 3 === 0 ? null : `attacker_${i}@malicious.com`,
    action:
      i % 5 === 0
        ? `Tentativa de SQL Injection: SELECT * FROM users; -- <script>alert(${i})</script>`
        : 'Burlar barreira do PermissionGuard',
    route: i % 5 === 0 ? '/api/v1/auth' : '/users',
    severity: i % 5 === 0 ? 'CRITICAL' : 'WARNING',
    details: `Payload suspeito interceptado pelo WAF/FrontEnd. Evento #${i}`,
  }));

  public getAuditLogs(filters: LogFilters): Observable<SecurityEvent[]> {
    let filtered = [...this.mockLogs];

    if (filters.severity) {
      filtered = filtered.filter((log) => log.severity === filters.severity);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          (log.userEmail && log.userEmail.toLowerCase().includes(searchLower)) ||
          log.action.toLowerCase().includes(searchLower),
      );
    }

    // Retorna os dados com um pequeno delay simulando rede
    return of(filtered).pipe(delay(200));
  }
}
