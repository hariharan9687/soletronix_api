// ============================================================
// ACTIVITY LOGGER — Soletronix Energy Tool
// Persists logs to localStorage
// ============================================================

export type LogType =
  | 'lead_created'
  | 'audit_run'
  | 'status_changed'
  | 'lead_deleted'
  | 'calculator_run'
  | 'page_visit'
  | 'system';

export type LogSeverity = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  severity: LogSeverity;
  message: string;
  details?: Record<string, unknown>;
}

const LOGS_KEY = 'soletronix_activity_logs';
const MAX_LOGS = 500;

function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function getLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLog(
  type: LogType,
  severity: LogSeverity,
  message: string,
  details?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    type,
    severity,
    message,
    details,
  };

  const logs = getLogs();
  logs.unshift(entry); // newest first
  if (logs.length > MAX_LOGS) logs.splice(MAX_LOGS); // keep cap
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return entry;
}

export function clearLogs(): void {
  localStorage.removeItem(LOGS_KEY);
}

export function exportLogsAsCSV(logs: LogEntry[]): void {
  const header = 'Timestamp,Severity,Type,Message,Details';
  const rows = logs.map((l) => {
    const details = l.details ? JSON.stringify(l.details).replace(/"/g, '""') : '';
    return `"${l.timestamp}","${l.severity}","${l.type}","${l.message.replace(/"/g, '""')}","${details}"`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soletronix-logs-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
