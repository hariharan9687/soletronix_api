import { useState, useEffect, useCallback } from 'react';
import {
  Activity, RefreshCw, Trash2, Download, Search,
  ChevronDown, Filter, Info, CheckCircle2, AlertTriangle,
  XCircle, Clock, X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import {
  getLogs, clearLogs, exportLogsAsCSV,
  type LogEntry, type LogType, type LogSeverity,
} from '../services/logger';

// ---- Config ----------------------------------------------------------------

const SEVERITY_CONFIG: Record<LogSeverity, { label: string; color: string; bg: string; icon: typeof Info }> = {
  info:    { label: 'Info',    color: 'text-blue-700',   bg: 'bg-blue-50',   icon: Info },
  success: { label: 'Success', color: 'text-green-700',  bg: 'bg-green-50',  icon: CheckCircle2 },
  warning: { label: 'Warning', color: 'text-amber-700',  bg: 'bg-amber-50',  icon: AlertTriangle },
  error:   { label: 'Error',   color: 'text-red-700',    bg: 'bg-red-50',    icon: XCircle },
};

const TYPE_LABELS: Record<LogType, string> = {
  lead_created:   'Lead Created',
  audit_run:      'Audit Run',
  status_changed: 'Status Changed',
  lead_deleted:   'Lead Deleted',
  calculator_run: 'Calculator Run',
  page_visit:     'Page Visit',
  system:         'System',
};

const SEVERITIES: LogSeverity[] = ['info', 'success', 'warning', 'error'];
const TYPES: LogType[] = ['lead_created', 'audit_run', 'status_changed', 'lead_deleted', 'calculator_run', 'page_visit', 'system'];

// ---- Component -------------------------------------------------------------

export function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<LogType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const load = useCallback(() => setLogs(getLogs()), []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClear = () => {
    if (confirm('Clear all activity logs? This cannot be undone.')) {
      clearLogs();
      load();
    }
  };

  const filtered = logs.filter((l) => {
    const matchesSeverity = severityFilter === 'all' || l.severity === severityFilter;
    const matchesType = typeFilter === 'all' || l.type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesType && matchesSearch;
  });

  const fmtTime = (ts: string) =>
    new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  // Summary counts
  const counts = SEVERITIES.reduce(
    (acc, s) => ({ ...acc, [s]: logs.filter((l) => l.severity === s).length }),
    {} as Record<LogSeverity, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Activity Log</h2>
          <p className="text-sm text-slate-500">
            Full audit trail of all tool actions — {logs.length} total entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => exportLogsAsCSV(filtered)}
            className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SEVERITIES.map((s) => {
          const cfg = SEVERITY_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setSeverityFilter(severityFilter === s ? 'all' : s)}
              className={cn(
                'rounded-xl border p-4 text-left transition hover:shadow-md',
                severityFilter === s ? `${cfg.bg} border-current ${cfg.color}` : 'border-slate-200 bg-white'
              )}
            >
              <div className={cn('inline-flex rounded-lg p-2', cfg.bg, cfg.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <p className={cn('mt-2 text-2xl font-bold', severityFilter === s ? cfg.color : 'text-slate-900')}>
                {counts[s]}
              </p>
              <p className="text-xs text-slate-500">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search log messages or types..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition',
            showFilters
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
          )}
        >
          <Filter className="h-4 w-4" />
          Filter by Type
          <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <button
            onClick={() => setTypeFilter('all')}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            All Types
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                typeFilter === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              )}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      {/* Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Activity className="mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">No log entries found</p>
            <p className="mt-1 text-sm">
              {logs.length === 0
                ? 'Start using the tool — actions will appear here'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-medium text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Timestamp
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600">Severity</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Type</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Message</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const sev = SEVERITY_CONFIG[log.severity];
                  const SevIcon = sev.icon;
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {fmtTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', sev.bg, sev.color)}>
                          <SevIcon className="h-3 w-3" />
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {TYPE_LABELS[log.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.message}</td>
                      <td className="px-4 py-3">
                        {log.details ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        Showing {filtered.length} of {logs.length} entries · Capped at 500 most recent
      </p>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">Log Details</h3>
              <p className="mt-1 text-sm text-slate-500">{fmtTime(selectedLog.timestamp)}</p>
            </div>
            <div className="space-y-3 p-6">
              <div className="flex gap-2">
                {(() => {
                  const sev = SEVERITY_CONFIG[selectedLog.severity];
                  const SevIcon = sev.icon;
                  return (
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', sev.bg, sev.color)}>
                      <SevIcon className="h-3 w-3" />
                      {sev.label}
                    </span>
                  );
                })()}
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {TYPE_LABELS[selectedLog.type]}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Message</p>
                <p className="mt-1 font-medium text-slate-900">{selectedLog.message}</p>
              </div>
              {selectedLog.details && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-xs text-slate-500">Details</p>
                  <pre className="max-h-48 overflow-auto text-xs text-slate-700">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              <p className="text-xs text-slate-400">ID: {selectedLog.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
