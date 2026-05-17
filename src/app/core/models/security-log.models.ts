export type ThreatSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  userId: string | null;
  userEmail: string | null;
  action: string;
  route: string;
  severity: ThreatSeverity;
  details?: string;
}
