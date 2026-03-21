import { useState, useEffect, useCallback } from 'react';
import {
  Sun, Shield, Eye, EyeOff, LogOut, Users, Activity,
  Wifi, WifiOff, Loader2, RefreshCw, AlertCircle,
  Trash2, Download, Search, Filter, ChevronDown, X,
  Mail, Phone, MapPin, DollarSign, CheckCircle2, Clock,
  BarChart3, TrendingUp, Info, AlertTriangle, XCircle,
  FileText, Factory, Building2, Zap, Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import { cn } from '../utils/cn';
import type { Lead } from '../types';
import type { LogEntry, LogType, LogSeverity } from '../services/logger';
import { exportLogsAsCSV } from '../services/logger';
import {
  checkApiHealth, adminFetchLeads, adminFetchAnalytics,
  adminUpdateLeadStatus, adminDeleteLead,
  adminFetchLogs, adminClearLogs, adminSyncLogs,
  exportLeadsAsCSV,
  type ConnectionStatus,
} from '../services/adminApi';
import {
  fetchTANGEDCOAudits, fetchResidentialCalculators,
  deleteTANGEDCOAudit, deleteResidentialCalculator,
  fetchAuditStats,
  type AuditStats,
} from '../services/database';
import type { LeadAnalytics } from '../services/api';

// ---- Constants -------------------------------------------------------

const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string) || 'admin@123';
const SESSION_KEY = 'soletronix_admin_auth';

type AdminTab = 'leads' | 'logs' | 'audits';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  new:           { label: 'New',       color: 'text-blue-700',   bg: 'bg-blue-100',   icon: AlertCircle },
  contacted:     { label: 'Contacted', color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Phone },
  qualified:     { label: 'Qualified', color: 'text-violet-700', bg: 'bg-violet-100', icon: CheckCircle2 },
  proposal:      { label: 'Proposal',  color: 'text-indigo-700', bg: 'bg-indigo-100', icon: DollarSign },
  'closed-won':  { label: 'Won',       color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle2 },
  'closed-lost': { label: 'Lost',      color: 'text-red-700',    bg: 'bg-red-100',    icon: X },
};
const STATUSES: Lead['status'][] = ['new', 'contacted', 'qualified', 'proposal', 'closed-won', 'closed-lost'];
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#6366f1', '#22c55e', '#ef4444'];

const SEVERITY_CONFIG: Record<LogSeverity, { label: string; color: string; bg: string; icon: typeof Info }> = {
  info:    { label: 'Info',    color: 'text-blue-700',  bg: 'bg-blue-50',  icon: Info },
  success: { label: 'Success', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle2 },
  warning: { label: 'Warning', color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
  error:   { label: 'Error',   color: 'text-red-700',   bg: 'bg-red-50',   icon: XCircle },
};
const SEVERITIES: LogSeverity[] = ['info', 'success', 'warning', 'error'];
const TYPE_LABELS: Record<LogType, string> = {
  lead_created: 'Lead Created', audit_run: 'Audit Run', status_changed: 'Status Changed',
  lead_deleted: 'Lead Deleted', calculator_run: 'Calculator Run', page_visit: 'Page Visit', system: 'System',
};

// ---- Login Screen ---------------------------------------------------

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onLogin();
    } else {
      setError('Incorrect password.');
      setPassword('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <Sun className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Soletronix Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to access the admin panel</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Admin password"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-10 text-sm text-slate-900 transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

// ---- Leads Tab -------------------------------------------------------

function LeadsTab({ apiStatus }: { apiStatus: ConnectionStatus }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'api' | 'local'>('local');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [leadsRes, analyticsRes] = await Promise.all([adminFetchLeads(), adminFetchAnalytics()]);
    if (leadsRes.success && leadsRes.data) {
      setLeads(leadsRes.data);
      setDataSource(leadsRes.source);
    }
    if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: Lead['status']) => {
    const result = await adminUpdateLeadStatus(id, status);
    if (result.success) {
      await load();
      if (selectedLead?.id === id && result.data) setSelectedLead(result.data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await adminDeleteLead(id);
    setSelectedLead(null);
    await load();
  };

  const filtered = leads.filter((l) => {
    const matchSearch = !searchQuery ||
      `${l.firstName} ${l.lastName} ${l.email} ${l.city} ${l.state}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leads</h2>
          <p className="text-sm text-slate-500">
            {leads.length} total ·{' '}
            <span className={dataSource === 'api' ? 'text-green-600' : 'text-amber-600'}>
              {dataSource === 'api' ? 'Live from API' : 'Local storage'}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportLeadsAsCSV(filtered)} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={load} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: Users,      label: 'Total Leads',     value: analytics.totalLeads,                        color: 'text-blue-600 bg-blue-50' },
              { icon: AlertCircle,label: 'New',             value: analytics.newLeads,                          color: 'text-amber-600 bg-amber-50' },
              { icon: TrendingUp, label: 'Conversion Rate', value: `${analytics.conversionRate}%`,              color: 'text-green-600 bg-green-50' },
              { icon: DollarSign, label: 'Revenue (Won)',   value: fmt(analytics.totalEstimatedRevenue),        color: 'text-violet-600 bg-violet-50' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`inline-flex rounded-lg p-2 ${color}`}><Icon className="h-5 w-5" /></div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                <BarChart3 className="h-5 w-5 text-slate-400" /> Leads Over Time
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={analytics.leadsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={STATUSES.map((s) => ({ name: STATUS_CONFIG[s].label, value: leads.filter((l) => l.status === s).length })).filter((d) => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value"
                  >
                    {STATUSES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {STATUSES.map((s, i) => {
                  const count = leads.filter((l) => l.status === s).length;
                  if (!count) return null;
                  return (
                    <div key={s} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-slate-600">{STATUS_CONFIG[s].label} ({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, city, state..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition',
            showFilters ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}
        >
          <Filter className="h-4 w-4" /> Filter
          <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>
      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <button onClick={() => setStatusFilter('all')} className={cn('rounded-full px-3 py-1.5 text-xs font-medium', statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100')}>All</button>
          {STATUSES.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', statusFilter === s ? `${c.bg} ${c.color}` : 'bg-white text-slate-600 hover:bg-slate-100')}>
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Lead', 'Contact', 'Location', 'Bill', 'Savings', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const sc = STATUS_CONFIG[lead.status];
                return (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-xs font-semibold text-white">
                          {lead.firstName[0]}{lead.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{lead.firstName} {lead.lastName}</p>
                          <p className="text-xs capitalize text-slate-400">{lead.propertyType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-600"><Mail className="h-3 w-3" />{lead.email}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400"><Phone className="h-3 w-3" />{lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-slate-600"><MapPin className="h-3 w-3" />{lead.city}, {lead.state}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{fmt(lead.monthlyBill)}/mo</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-green-600">{lead.energyReport ? fmt(lead.energyReport.estimatedSavingsMonthly) + '/mo' : 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', sc.bg, sc.color)}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedLead(lead)} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(lead.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No leads found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <button onClick={() => setSelectedLead(null)} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-lg font-bold text-white">
                  {selectedLead.firstName[0]}{selectedLead.lastName?.[0] || ''}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedLead.firstName} {selectedLead.lastName}</h3>
                  <p className="text-sm text-slate-500">{selectedLead.email}</p>
                </div>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Mobile', value: selectedLead.phone },
                  { label: 'Location', value: `${selectedLead.address ? selectedLead.address + ', ' : ''}${selectedLead.city}, ${selectedLead.state} ${selectedLead.pinCode}` },
                  { label: 'Property Type', value: selectedLead.propertyType },
                  { label: 'Monthly Bill', value: fmt(selectedLead.monthlyBill) },
                  { label: 'Area', value: `${selectedLead.squareFootage.toLocaleString('en-IN')} sq ft` },
                  { label: 'Provider', value: selectedLead.currentProvider || 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-medium capitalize text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
              {selectedLead.energyReport && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="mb-3 font-semibold text-green-800">Energy Report</h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Monthly Savings', value: fmt(selectedLead.energyReport.estimatedSavingsMonthly) },
                      { label: 'System Size', value: `${selectedLead.energyReport.systemSizeKW} kW` },
                      { label: 'Central Subsidy', value: fmt(selectedLead.energyReport.centralSubsidy) },
                      { label: 'Net Cost', value: fmt(selectedLead.energyReport.netCost) },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-lg font-bold text-green-600">{value}</p>
                        <p className="text-xs text-green-700">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((status) => {
                    const c = STATUS_CONFIG[status];
                    return (
                      <button key={status} onClick={() => handleStatusChange(selectedLead.id, status)}
                        className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition',
                          selectedLead.status === status ? `${c.bg} ${c.color} ring-2 ring-offset-1` : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- CSV Export helpers -----------------------------------------------

function exportAuditsCSV(data: any[], type: 'industrial' | 'residential') {
  const rows: string[][] = [];
  if (type === 'industrial') {
    rows.push([
      'Name', 'Company', 'Designation', 'Email', 'Phone', 'City', 'WhatsApp',
      'Consumer No.', 'Tariff', 'Billing Month', 'District', 'Industry Type',
      'Contracted Demand (KVA)', 'Recorded Demand (KVA)', 'Total Units (kWh)',
      'Power Factor', 'Op Hours/Day', 'Op Days/Month', 'Shift Pattern',
      'Load Sanction (kW)', 'Export to EU', 'Export %',
      'Current Bill (₹)', 'Potential Savings (₹)', 'Recommended Solar (kW)',
      'Submitted At',
    ]);
    data.forEach((item) => {
      const cd = item.contactData || {};
      const id = item.inputData || {};
      const rd = item.reportData || {};
      rows.push([
        `${cd.firstName || ''} ${cd.lastName || ''}`.trim(),
        cd.companyName || '', cd.designation || '', cd.email || '', cd.phone || '',
        cd.city || '', cd.whatsappConsent ? 'Yes' : 'No',
        id.consumerNumber || '', id.tariffCategory || '', id.billingMonth || '',
        id.district || '', id.industryType || '',
        id.contractedDemandKVA || '', id.recordedDemandKVA || '',
        id.totalUnitsKWH || '', id.powerFactor || '',
        id.operatingHoursPerDay || '', id.operatingDaysPerMonth || '',
        id.shiftPattern || '', id.loadSanction || '',
        id.exportToEU ? 'Yes' : 'No', id.exportPercentage || '',
        rd.currentBill?.totalBill || '', rd.savingsSummary?.totalPotentialSavings || '',
        rd.solarRooftopAnalysis?.recommendedSizeKW || '',
        item.createdAt || '',
      ]);
    });
  } else {
    rows.push([
      'Name', 'Company', 'Email', 'Phone', 'City', 'WhatsApp',
      'Property Type', 'State', 'Monthly Bill (₹)', 'Roof Type', 'Roof Age (yrs)',
      'Area (sq ft)', 'Shading', 'Electric Vehicle', 'Pool/Spa', 'Load Sanction (kW)',
      'System Size (kW)', 'Panels Needed', 'Monthly Savings (₹)', 'Yearly Savings (₹)',
      'Central Subsidy (₹)', 'Net Cost (₹)', 'Payback (yrs)',
      'Submitted At',
    ]);
    data.forEach((item) => {
      const cd = item.contactData || {};
      const id = item.inputData || {};
      const rd = item.reportData || {};
      rows.push([
        `${cd.firstName || ''} ${cd.lastName || ''}`.trim(),
        cd.companyName || '', cd.email || '', cd.phone || '',
        cd.city || '', cd.whatsappConsent ? 'Yes' : 'No',
        id.propertyType || '', id.state || '', id.monthlyBill || '',
        id.roofType || '', id.roofAge || '', id.squareFootage || '',
        id.shading || '', id.electricVehicle ? 'Yes' : 'No', id.poolOrSpa ? 'Yes' : 'No',
        id.loadSanction || '',
        rd.systemSizeKW || '', rd.panelsNeeded || '',
        rd.estimatedSavingsMonthly || '', rd.estimatedSavingsYearly || '',
        rd.centralSubsidy || '', rd.netCost || '', rd.paybackYears || '',
        item.createdAt || '',
      ]);
    });
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soletronix_${type}_audits_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Audits Tab -------------------------------------------------------

function AuditsTab() {
  const [tangedcoAudits, setTangedcoAudits] = useState<any[]>([]);
  const [residentialCalcs, setResidentialCalcs] = useState<any[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tangedco' | 'residential'>('tangedco');
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [tangedcoRes, residentialRes, statsRes] = await Promise.all([
      fetchTANGEDCOAudits(),
      fetchResidentialCalculators(),
      fetchAuditStats(),
    ]);
    if (tangedcoRes.success && tangedcoRes.data) setTangedcoAudits(tangedcoRes.data);
    if (residentialRes.success && residentialRes.data) setResidentialCalcs(residentialRes.data);
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, type: 'tangedco' | 'residential') => {
    if (!confirm('Delete this submission? This cannot be undone.')) return;
    const res = type === 'tangedco'
      ? await deleteTANGEDCOAudit(id)
      : await deleteResidentialCalculator(id);
    if (res.success) {
      setSelectedAudit(null);
      await load();
    }
  };

  const filterData = (data: any[]) => {
    if (!searchQuery) return data;
    const s = searchQuery.toLowerCase();
    return data.filter((item) => {
      const cd = item.contactData || {};
      const id = item.inputData || {};
      return (
        `${cd.firstName || ''} ${cd.lastName || ''}`.toLowerCase().includes(s) ||
        (cd.email || '').toLowerCase().includes(s) ||
        (cd.phone || '').includes(s) ||
        (cd.companyName || '').toLowerCase().includes(s) ||
        (cd.city || '').toLowerCase().includes(s) ||
        (id.district || '').toLowerCase().includes(s) ||
        (id.consumerNumber || '').toLowerCase().includes(s)
      );
    });
  };

  const tangedcoFiltered = filterData(tangedcoAudits);
  const residentialFiltered = filterData(residentialCalcs);
  const currentData = activeTab === 'tangedco' ? tangedcoFiltered : residentialFiltered;

  const fmtDate = (d: string) => new Date(d).toLocaleString('en-IN', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const fmtMoney = (n: number | string) => n ? `₹${Number(n).toLocaleString('en-IN')}` : 'N/A';

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Form Submissions</h2>
          <p className="text-sm text-slate-500">All data submitted via Industrial &amp; Residential forms</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportAuditsCSV(currentData, activeTab === 'tangedco' ? 'industrial' : 'residential')}
            className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={load} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Factory,   label: 'Industrial Audits',     value: stats.totalIndustrial,   color: 'text-blue-600 bg-blue-50' },
            { icon: Building2, label: 'Residential Forms',     value: stats.totalResidential,  color: 'text-orange-600 bg-orange-50' },
            { icon: Calendar,  label: "Today's Industrial",    value: stats.todayIndustrial,   color: 'text-violet-600 bg-violet-50' },
            { icon: Calendar,  label: "Today's Residential",   value: stats.todayResidential,  color: 'text-green-600 bg-green-50' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`inline-flex rounded-lg p-2 ${color}`}><Icon className="h-5 w-5" /></div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab Toggle */}
      <div className="flex gap-2 rounded-lg bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab('tangedco')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
            activeTab === 'tangedco' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Factory className="h-4 w-4" />
          Industrial / TANGEDCO ({tangedcoAudits.length})
        </button>
        <button
          onClick={() => setActiveTab('residential')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
            activeTab === 'residential' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Building2 className="h-4 w-4" />
          Residential ({residentialCalcs.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'tangedco' ? 'Search by name, email, company, district, consumer no...' : 'Search by name, email, phone, city...'}
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {activeTab === 'tangedco'
                  ? ['Name / Company', 'Contact', 'Location / Tariff', 'Bill Details', 'Potential Savings', 'Submitted', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))
                  : ['Name', 'Contact', 'Property', 'Monthly Bill', 'Solar Savings', 'Submitted', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {activeTab === 'tangedco'
                ? tangedcoFiltered.map((item) => {
                    const cd = item.contactData || {};
                    const id = item.inputData || {};
                    const rd = item.reportData || {};
                    return (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-semibold text-white">
                              {(cd.firstName || 'N')[0]}{(cd.lastName || '')[0] || ''}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{cd.firstName} {cd.lastName}</p>
                              <p className="text-xs text-slate-500">{cd.companyName || '—'}</p>
                              <p className="text-xs text-slate-400">{cd.designation || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-xs text-slate-600"><Mail className="h-3 w-3" />{cd.email || 'N/A'}</span>
                            <span className="flex items-center gap-1 text-xs text-slate-400"><Phone className="h-3 w-3" />{cd.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-xs text-slate-600"><MapPin className="h-3 w-3" />{id.district || cd.city || 'N/A'}</span>
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">{id.tariffCategory || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-medium text-slate-900">{rd.currentBill?.totalBill ? fmtMoney(rd.currentBill.totalBill) : `${(id.totalUnitsKWH || 0).toLocaleString('en-IN')} kWh`}</span>
                            <span className="text-slate-500">{id.contractedDemandKVA ? `${id.contractedDemandKVA} KVA demand` : '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-green-600">
                            {rd.savingsSummary?.totalPotentialSavings
                              ? fmtMoney(rd.savingsSummary.totalPotentialSavings) + '/yr'
                              : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelectedAudit({ ...item, _type: 'tangedco' })} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600" title="View">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id, 'tangedco')} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : residentialFiltered.map((item) => {
                    const cd = item.contactData || {};
                    const id = item.inputData || {};
                    const rd = item.reportData || {};
                    return (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-xs font-semibold text-white">
                              {(cd.firstName || 'N')[0]}{(cd.lastName || '')[0] || ''}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{cd.firstName} {cd.lastName}</p>
                              <p className="text-xs capitalize text-slate-400">{id.propertyType || 'residential'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-xs text-slate-600"><Mail className="h-3 w-3" />{cd.email || 'N/A'}</span>
                            <span className="flex items-center gap-1 text-xs text-slate-400"><Phone className="h-3 w-3" />{cd.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="flex items-center gap-1 text-slate-600"><MapPin className="h-3 w-3" />{cd.city || id.state || 'N/A'}</span>
                            <span className="text-slate-400">{id.roofType ? `${id.roofType} roof` : '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{fmtMoney(id.monthlyBill)}/mo</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-green-600">
                            {rd.estimatedSavingsMonthly ? fmtMoney(rd.estimatedSavingsMonthly) + '/mo' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelectedAudit({ ...item, _type: 'residential' })} className="rounded-lg p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600" title="View">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id, 'residential')} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {searchQuery ? 'No results match your search.' : 'No submissions yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <button onClick={() => setSelectedAudit(null)} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className={cn('border-b border-slate-100 p-6', selectedAudit._type === 'tangedco' ? 'bg-blue-50' : 'bg-orange-50')}>
              <div className="flex items-center gap-4">
                <div className={cn('flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white',
                  selectedAudit._type === 'tangedco' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-orange-400 to-amber-500'
                )}>
                  {(selectedAudit.contactData?.firstName || 'N')[0]}
                  {(selectedAudit.contactData?.lastName || '')[0] || ''}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {selectedAudit.contactData?.firstName} {selectedAudit.contactData?.lastName}
                    </h3>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      selectedAudit._type === 'tangedco' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    )}>
                      {selectedAudit._type === 'tangedco' ? '🏭 Industrial' : '🏠 Residential'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{selectedAudit.contactData?.companyName}</p>
                  <p className="text-xs text-slate-500">{selectedAudit.contactData?.designation}</p>
                </div>
                <button
                  onClick={() => handleDelete(selectedAudit.id, selectedAudit._type)}
                  className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
              {/* Contact Information */}
              <section>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Mail className="h-4 w-4" /> Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Email', value: selectedAudit.contactData?.email },
                    { label: 'Phone', value: selectedAudit.contactData?.phone },
                    { label: 'City', value: selectedAudit.contactData?.city },
                    { label: 'WhatsApp', value: selectedAudit.contactData?.whatsappConsent ? '✓ Opted In' : 'No' },
                    ...(selectedAudit._type === 'tangedco' ? [
                      { label: 'Company', value: selectedAudit.contactData?.companyName },
                      { label: 'Designation', value: selectedAudit.contactData?.designation },
                    ] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-0.5 font-medium text-slate-900">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Industrial: Bill Input Details */}
              {selectedAudit._type === 'tangedco' && selectedAudit.inputData && (() => {
                const id = selectedAudit.inputData;
                return (
                  <>
                    <section>
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <Zap className="h-4 w-4" /> Bill &amp; Consumption Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[
                          { label: 'Consumer Number', value: id.consumerNumber },
                          { label: 'Tariff Category', value: id.tariffCategory },
                          { label: 'Billing Month', value: id.billingMonth },
                          { label: 'Total Units (kWh)', value: id.totalUnitsKWH?.toLocaleString('en-IN') },
                          { label: 'Contracted Demand', value: `${id.contractedDemandKVA} KVA` },
                          { label: 'Recorded Demand', value: `${id.recordedDemandKVA} KVA` },
                          { label: 'Power Factor', value: id.powerFactor },
                          { label: 'Load Sanction', value: id.loadSanction ? `${id.loadSanction} kW` : '—' },
                          { label: 'Connected Load (HP)', value: id.connectedLoadHP || '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="mt-0.5 font-medium text-slate-900">{value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <Factory className="h-4 w-4" /> Industry &amp; Operations
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[
                          { label: 'District', value: id.district },
                          { label: 'Industry Type', value: id.industryType?.replace(/-/g, ' ') },
                          { label: 'Shift Pattern', value: id.shiftPattern },
                          { label: 'Op. Hours/Day', value: id.operatingHoursPerDay ? `${id.operatingHoursPerDay} hrs` : '—' },
                          { label: 'Op. Days/Month', value: id.operatingDaysPerMonth ? `${id.operatingDaysPerMonth} days` : '—' },
                          { label: 'SIPCOT / SIDCO', value: id.sipcotSidco || '—' },
                          { label: 'Export to EU', value: id.exportToEU ? 'Yes' : 'No' },
                          { label: 'Export %', value: id.exportToEU ? `${id.exportPercentage}%` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="mt-0.5 font-medium capitalize text-slate-900">{value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Industrial Report Summary */}
                    {selectedAudit.reportData && (() => {
                      const rd = selectedAudit.reportData;
                      return (
                        <section>
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-700">
                            <BarChart3 className="h-4 w-4" /> Audit Report Summary
                          </h4>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {[
                              { label: 'Current Monthly Bill', value: rd.currentBill?.totalBill ? fmtMoney(rd.currentBill.totalBill) : '—' },
                              { label: 'Fixed Charges', value: rd.currentBill?.demandCharges ? fmtMoney(rd.currentBill.demandCharges) : '—' },
                              { label: 'Energy Charges', value: rd.currentBill?.energyCharges ? fmtMoney(rd.currentBill.energyCharges) : '—' },
                              { label: 'Total Potential Savings/yr', value: rd.savingsSummary?.totalPotentialSavings ? fmtMoney(rd.savingsSummary.totalPotentialSavings) : '—' },
                              { label: 'Recommended Solar (kW)', value: rd.solarRooftopAnalysis?.recommendedSizeKW ? `${rd.solarRooftopAnalysis.recommendedSizeKW} kW` : '—' },
                              { label: 'Solar Payback (yrs)', value: rd.solarRooftopAnalysis?.paybackYears ? `${rd.solarRooftopAnalysis.paybackYears} yrs` : '—' },
                              { label: 'Power Factor Status', value: rd.powerFactorAnalysis?.status || '—' },
                              { label: 'Demand Utilization', value: rd.demandAnalysis?.utilizationRate ? `${(rd.demandAnalysis.utilizationRate * 100).toFixed(1)}%` : '—' },
                            ].map(({ label, value }) => (
                              <div key={label} className="rounded-lg bg-green-50 p-3">
                                <p className="text-xs text-green-600">{label}</p>
                                <p className="mt-0.5 font-semibold text-green-800">{value}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    })()}
                  </>
                );
              })()}

              {/* Residential: Form Details */}
              {selectedAudit._type === 'residential' && selectedAudit.inputData && (() => {
                const id = selectedAudit.inputData;
                const rd = selectedAudit.reportData || {};
                return (
                  <>
                    <section>
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <Building2 className="h-4 w-4" /> Property &amp; Energy Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[
                          { label: 'Property Type', value: id.propertyType },
                          { label: 'State', value: id.state },
                          { label: 'Monthly Bill', value: fmtMoney(id.monthlyBill) },
                          { label: 'Roof Type', value: id.roofType },
                          { label: 'Roof Age', value: id.roofAge ? `${id.roofAge} years` : '—' },
                          { label: 'Area', value: id.squareFootage ? `${Number(id.squareFootage).toLocaleString('en-IN')} sq ft` : '—' },
                          { label: 'Shading', value: id.shading },
                          { label: 'Electric Vehicle', value: id.electricVehicle ? 'Yes' : 'No' },
                          { label: 'Pool / Spa', value: id.poolOrSpa ? 'Yes' : 'No' },
                          { label: 'Load Sanction', value: id.loadSanction ? `${id.loadSanction} kW` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="mt-0.5 font-medium capitalize text-slate-900">{value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Residential Report Summary */}
                    {selectedAudit.reportData && (
                      <section>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-orange-700">
                          <Sun className="h-4 w-4" /> Solar Report Summary
                        </h4>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {[
                            { label: 'System Size', value: rd.systemSizeKW ? `${rd.systemSizeKW} kW` : '—' },
                            { label: 'Panels Needed', value: rd.panelsNeeded || '—' },
                            { label: 'Monthly Savings', value: rd.estimatedSavingsMonthly ? fmtMoney(rd.estimatedSavingsMonthly) : '—' },
                            { label: 'Yearly Savings', value: rd.estimatedSavingsYearly ? fmtMoney(rd.estimatedSavingsYearly) : '—' },
                            { label: '25-Year Savings', value: rd.estimatedSavings25Year ? fmtMoney(rd.estimatedSavings25Year) : '—' },
                            { label: 'Central Subsidy', value: rd.centralSubsidy ? fmtMoney(rd.centralSubsidy) : '—' },
                            { label: 'Net Cost', value: rd.netCost ? fmtMoney(rd.netCost) : '—' },
                            { label: 'Payback Period', value: rd.paybackYears ? `${rd.paybackYears} yrs` : '—' },
                            { label: 'CO₂ Offset', value: rd.co2OffsetTons ? `${rd.co2OffsetTons} tons/yr` : '—' },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-lg bg-orange-50 p-3">
                              <p className="text-xs text-orange-600">{label}</p>
                              <p className="mt-0.5 font-semibold text-orange-800">{value}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                );
              })()}

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>ID: {selectedAudit.id}</span>
                <span>Submitted: {fmtDate(selectedAudit.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Logs Tab -------------------------------------------------------

function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataSource, setDataSource] = useState<'api' | 'local'>('local');
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetchLogs();
    setLogs(res.logs);
    setDataSource(res.source);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    await adminSyncLogs();
    await load();
    setSyncing(false);
  };

  const handleClear = async () => {
    if (!confirm('Clear all logs?')) return;
    await adminClearLogs();
    await load();
  };

  const filtered = logs.filter((l) => {
    const matchSev = severityFilter === 'all' || l.severity === severityFilter;
    const matchSearch = !searchQuery ||
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSev && matchSearch;
  });

  const counts = SEVERITIES.reduce((acc, s) => ({ ...acc, [s]: logs.filter((l) => l.severity === s).length }), {} as Record<LogSeverity, number>);
  const fmtTime = (ts: string) => new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Activity Log</h2>
          <p className="text-sm text-slate-500">
            {logs.length} entries ·{' '}
            <span className={dataSource === 'api' ? 'text-green-600' : 'text-amber-600'}>
              {dataSource === 'api' ? 'Live from API' : 'Local storage'}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            Sync to API
          </button>
          <button onClick={() => exportLogsAsCSV(filtered)} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={handleClear} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SEVERITIES.map((s) => {
          const cfg = SEVERITY_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => setSeverityFilter(severityFilter === s ? 'all' : s)}
              className={cn('rounded-xl border p-4 text-left transition hover:shadow-md',
                severityFilter === s ? `${cfg.bg} border-current ${cfg.color}` : 'border-slate-200 bg-white')}>
              <div className={cn('inline-flex rounded-lg p-2', cfg.bg, cfg.color)}><Icon className="h-4 w-4" /></div>
              <p className={cn('mt-2 text-2xl font-bold', severityFilter === s ? cfg.color : 'text-slate-900')}>{counts[s]}</p>
              <p className="text-xs text-slate-500">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search log messages or types..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={cn('flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition',
            showFilters ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}>
          <Filter className="h-4 w-4" /> Filter by Type
          <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>
      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {(['all', ...Object.keys(TYPE_LABELS)] as const).map((t) => (
            <button key={t} onClick={() => setShowFilters(true)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
              {t === 'all' ? 'All Types' : TYPE_LABELS[t as LogType]}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Activity className="mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">{logs.length === 0 ? 'No log entries yet' : 'No entries match filters'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Timestamp', 'Severity', 'Type', 'Message', 'Details'].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const sev = SEVERITY_CONFIG[log.severity];
                  const SevIcon = sev.icon;
                  return (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fmtTime(log.timestamp)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', sev.bg, sev.color)}>
                          <SevIcon className="h-3 w-3" />{sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {TYPE_LABELS[log.type] ?? log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.message}</td>
                      <td className="px-4 py-3">
                        {log.details
                          ? <button onClick={() => setSelectedLog(log)} className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">View</button>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-slate-400">Showing {filtered.length} of {logs.length} entries</p>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <button onClick={() => setSelectedLog(null)} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            <div className="border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">Log Details</h3>
              <p className="mt-1 text-sm text-slate-500">{fmtTime(selectedLog.timestamp)}</p>
            </div>
            <div className="space-y-3 p-6">
              <div className="flex gap-2">
                {(() => { const sev = SEVERITY_CONFIG[selectedLog.severity]; const SevIcon = sev.icon; return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', sev.bg, sev.color)}><SevIcon className="h-3 w-3" />{sev.label}</span>; })()}
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{TYPE_LABELS[selectedLog.type] ?? selectedLog.type}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Message</p>
                <p className="mt-1 font-medium text-slate-900">{selectedLog.message}</p>
              </div>
              {selectedLog.details && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-xs text-slate-500">Details</p>
                  <pre className="max-h-48 overflow-auto text-xs text-slate-700">{JSON.stringify(selectedLog.details, null, 2)}</pre>
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

// ---- Admin Panel Shell ----------------------------------------------

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [tab, setTab] = useState<AdminTab>('leads');
  const [apiStatus, setApiStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    if (!authenticated) return;
    checkApiHealth().then((ok) => setApiStatus(ok ? 'connected' : 'local'));
  }, [authenticated]);

  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />;

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Soletronix</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {([
              { id: 'leads', icon: Users,    label: 'Leads' },
              { id: 'audits', icon: FileText, label: 'Audits' },
              { id: 'logs',  icon: Activity, label: 'Activity Log' },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                  tab === id ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-100')}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
              apiStatus === 'connected' ? 'bg-green-50 text-green-700' :
              apiStatus === 'checking'  ? 'bg-slate-100 text-slate-500' :
                                          'bg-amber-50 text-amber-700')}>
              {apiStatus === 'connected' ? <Wifi className="h-3.5 w-3.5" /> :
               apiStatus === 'checking'  ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                                           <WifiOff className="h-3.5 w-3.5" />}
              {apiStatus === 'connected' ? 'API Connected' : apiStatus === 'checking' ? 'Checking…' : 'Local Mode'}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {tab === 'leads' && <LeadsTab apiStatus={apiStatus} />}
        {tab === 'audits' && <AuditsTab />}
        {tab === 'logs'  && <LogsTab />}
      </main>
    </div>
  );
}
