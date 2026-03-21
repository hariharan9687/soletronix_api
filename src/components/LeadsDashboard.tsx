import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, DollarSign, CheckCircle2,
  Clock, Phone, AlertCircle, Trash2, Eye,
  BarChart3, Loader2, RefreshCw, ChevronDown,
  Mail, MapPin, Search, Filter, X,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { cn } from '../utils/cn';
import type { Lead } from '../types';
import {
  fetchLeads, fetchAnalytics, updateLeadStatus, deleteLead,
  type LeadAnalytics,
} from '../services/api';
import { addLog } from '../services/logger';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  new: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-100', icon: AlertCircle },
  contacted: { label: 'Contacted', color: 'text-amber-700', bg: 'bg-amber-100', icon: Phone },
  qualified: { label: 'Qualified', color: 'text-violet-700', bg: 'bg-violet-100', icon: CheckCircle2 },
  proposal: { label: 'Proposal', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: DollarSign },
  'closed-won': { label: 'Won', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  'closed-lost': { label: 'Lost', color: 'text-red-700', bg: 'bg-red-100', icon: X },
};

const STATUSES: Lead['status'][] = ['new', 'contacted', 'qualified', 'proposal', 'closed-won', 'closed-lost'];
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#6366f1', '#22c55e', '#ef4444'];

export function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [leadsRes, analyticsRes] = await Promise.all([fetchLeads(), fetchAnalytics()]);
    if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data);
    if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: Lead['status']) => {
    const prevLead = leads.find((l) => l.id === id);
    const result = await updateLeadStatus(id, status);
    if (result.success) {
      addLog('status_changed', 'info',
        `Lead status updated — ${prevLead ? `${prevLead.firstName} ${prevLead.lastName}` : id}: ${prevLead?.status ?? '?'} → ${status}`,
        { leadId: id, from: prevLead?.status, to: status }
      );
      await loadData();
      if (selectedLead?.id === id && result.data) {
        setSelectedLead(result.data);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      const lead = leads.find((l) => l.id === id);
      const result = await deleteLead(id);
      if (result.success) {
        addLog('lead_deleted', 'warning',
          `Lead deleted — ${lead ? `${lead.firstName} ${lead.lastName}` : id}`,
          { leadId: id, email: lead?.email }
        );
        setSelectedLead(null);
        await loadData();
      }
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchQuery ||
      `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.city} ${lead.state}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fmtMoney = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
          <p className="mt-2 text-slate-500">Loading leads from backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leads Dashboard</h2>
          <p className="text-sm text-slate-500">
            Manage leads acquired from the Solar Energy Tool — India
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh from Backend
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Users, label: 'Total Leads', value: analytics.totalLeads, color: 'text-blue-600 bg-blue-50', change: '+12%' },
            { icon: AlertCircle, label: 'New Leads', value: analytics.newLeads, color: 'text-amber-600 bg-amber-50', change: '+5' },
            { icon: TrendingUp, label: 'Conversion Rate', value: `${analytics.conversionRate}%`, color: 'text-green-600 bg-green-50', change: '+3%' },
            { icon: DollarSign, label: 'Revenue (Won)', value: fmtMoney(analytics.totalEstimatedRevenue), color: 'text-violet-600 bg-violet-50', change: '+18%' },
          ].map(({ icon: Icon, label, value, color, change }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`inline-flex rounded-lg p-2 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-green-600">{change}</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <BarChart3 className="h-5 w-5 text-slate-400" />
              Leads Over Time
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.leadsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Lead Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={STATUSES.map((s) => ({
                    name: STATUS_CONFIG[s].label,
                    value: leads.filter((l) => l.status === s).length,
                  })).filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {STATUSES.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {STATUSES.map((s, i) => {
                const count = leads.filter((l) => l.status === s).length;
                if (count === 0) return null;
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
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, city, state..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition',
            showFilters ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
          )}
        >
          <Filter className="h-4 w-4" />
          Filter
          <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            All
          </button>
          {STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition',
                  statusFilter === status ? `${config.bg} ${config.color}` : 'bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-medium text-slate-600">Lead</th>
                <th className="px-4 py-3 font-medium text-slate-600">Contact</th>
                <th className="px-4 py-3 font-medium text-slate-600">Location</th>
                <th className="px-4 py-3 font-medium text-slate-600">Bill</th>
                <th className="px-4 py-3 font-medium text-slate-600">Savings</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const statusConfig = STATUS_CONFIG[lead.status];
                return (
                  <tr key={lead.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-xs font-semibold text-white">
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
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="h-3 w-3" />
                        {lead.city}, {lead.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {fmtMoney(lead.monthlyBill)}/mo
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-green-600">
                        {lead.energyReport ? fmtMoney(lead.energyReport.estimatedSavingsMonthly) + '/mo' : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', statusConfig.bg, statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {fmtDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No leads found. Use the Energy Calculator to generate leads!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-lg font-bold text-white">
                  {selectedLead.firstName[0]}{selectedLead.lastName?.[0] || ''}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedLead.firstName} {selectedLead.lastName}
                  </h3>
                  <p className="text-sm text-slate-500">{selectedLead.email}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Mobile</p>
                  <p className="font-medium text-slate-900">{selectedLead.phone}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="font-medium text-slate-900">
                    {selectedLead.address ? `${selectedLead.address}, ` : ''}{selectedLead.city}, {selectedLead.state} {selectedLead.pinCode}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Property Type</p>
                  <p className="font-medium capitalize text-slate-900">{selectedLead.propertyType}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Monthly Bill</p>
                  <p className="font-medium text-slate-900">{fmtMoney(selectedLead.monthlyBill)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Area</p>
                  <p className="font-medium text-slate-900">{selectedLead.squareFootage.toLocaleString('en-IN')} sq ft</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Provider (DISCOM)</p>
                  <p className="font-medium text-slate-900">{selectedLead.currentProvider || 'N/A'}</p>
                </div>
              </div>

              {selectedLead.interestedIn.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500">Interested In</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedLead.interestedIn.map((i) => (
                      <span key={i} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium capitalize text-orange-700">
                        {i.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLead.energyReport && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="mb-3 font-semibold text-green-800">Energy Report Summary</h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {fmtMoney(selectedLead.energyReport.estimatedSavingsMonthly)}
                      </p>
                      <p className="text-xs text-green-700">Monthly Savings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {selectedLead.energyReport.systemSizeKW} kW
                      </p>
                      <p className="text-xs text-green-700">System Size</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {fmtMoney(selectedLead.energyReport.centralSubsidy)}
                      </p>
                      <p className="text-xs text-green-700">Central Subsidy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {fmtMoney(selectedLead.energyReport.netCost)}
                      </p>
                      <p className="text-xs text-green-700">Net Cost</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLead.notes && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedLead.notes}</p>
                </div>
              )}

              {/* Status Update */}
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium text-slate-500">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((status) => {
                    const config = STATUS_CONFIG[status];
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedLead.id, status)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-medium transition',
                          selectedLead.status === status
                            ? `${config.bg} ${config.color} ring-2 ring-offset-1`
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        )}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span>Created: {fmtDate(selectedLead.createdAt)}</span>
                <span>Updated: {fmtDate(selectedLead.updatedAt)}</span>
                <span>Source: {selectedLead.source}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
