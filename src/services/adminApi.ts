// ============================================================
// ADMIN API SERVICE — Soletronix Energy Tool
// API-first: tries real backend, falls back to localStorage
// ============================================================

import type { Lead, ApiResponse } from '../types';
import type { LeadAnalytics } from './api';
import type { LogEntry } from './logger';
import { getLogs, clearLogs } from './logger';
import { seedAndSaveLeads, seedAndSaveLogs } from './seedData';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
const STORAGE_KEY = 'free_energy_leads_india';
const LOGS_KEY = 'soletronix_activity_logs';

// ---- Connection Status -----------------------------------------------

export type ConnectionStatus = 'checking' | 'connected' | 'local';

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { message?: string }).message ?? `HTTP ${res.status}` };
    }
    const result = await res.json();
    // Server always returns { success, data?, message? } — extract inner data
    const data = (result as any).data !== undefined ? (result as any).data : result;
    return { ok: true, data: data as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function checkApiHealth(): Promise<boolean> {
  const result = await request<{ status: string }>('GET', '/health');
  return result.ok;
}

// ---- Local helpers --------------------------------------------------

function localLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    return seedAndSaveLeads(); // seed on first load
  } catch {
    return seedAndSaveLeads();
  }
}

function saveLocalLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

// ---- LEADS ----------------------------------------------------------

export async function adminFetchLeads(): Promise<ApiResponse<Lead[]> & { source: 'api' | 'local' }> {
  const res = await request<Lead[]>('GET', '/leads');
  if (res.ok) return { success: true, data: res.data, source: 'api' };
  return { success: true, data: localLeads(), source: 'local' };
}

export async function adminUpdateLeadStatus(
  id: string,
  status: Lead['status']
): Promise<ApiResponse<Lead> & { source: 'api' | 'local' }> {
  const res = await request<Lead>('PATCH', `/leads/${id}/status`, { status });
  if (res.ok) return { success: true, data: res.data, source: 'api' };

  // fallback to local
  const leads = localLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return { success: false, error: 'Lead not found', source: 'local' };
  leads[idx].status = status;
  leads[idx].updatedAt = new Date().toISOString();
  saveLocalLeads(leads);
  return { success: true, data: leads[idx], source: 'local' };
}

export async function adminDeleteLead(
  id: string
): Promise<ApiResponse<void> & { source: 'api' | 'local' }> {
  const res = await request<void>('DELETE', `/leads/${id}`);
  if (res.ok) return { success: true, source: 'api' };

  const leads = localLeads().filter((l) => l.id !== id);
  saveLocalLeads(leads);
  return { success: true, source: 'local' };
}

export async function adminFetchAnalytics(): Promise<ApiResponse<LeadAnalytics> & { source: 'api' | 'local' }> {
  const res = await request<any>('GET', '/analytics');
  if (res.ok && res.data) {
    const d = res.data;
    const closedWon = d.closedWonLeads || 0;
    const closedLost = d.closedLostLeads || 0;
    const closedTotal = closedWon + closedLost;
    const analytics: LeadAnalytics = {
      totalLeads: d.totalLeads || 0,
      newLeads: d.newLeads || 0,
      contactedLeads: d.contactedLeads || 0,
      qualifiedLeads: d.qualifiedLeads || 0,
      proposalLeads: d.proposalLeads || 0,
      closedWonLeads: closedWon,
      closedLostLeads: closedLost,
      totalEstimatedRevenue: d.totalEstimatedRevenue || 0,
      avgMonthlyBill: d.avgMonthlyBill || 0,
      conversionRate: closedTotal > 0 ? Math.round((closedWon / closedTotal) * 100) : 0,
      leadsByState: d.leadsByState || {},
      leadsByProperty: d.leadsByProperty || {},
      leadsByMonth: d.leadsByMonth || [],
      savingsDistribution: d.savingsDistribution || [],
    };
    return { success: true, data: analytics, source: 'api' };
  }

  // compute locally
  const leads = localLeads();
  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const closedWon = statusCounts['closed-won'] || 0;
  const closedTotal = closedWon + (statusCounts['closed-lost'] || 0);

  const analytics: LeadAnalytics = {
    totalLeads: leads.length,
    newLeads: statusCounts['new'] || 0,
    contactedLeads: statusCounts['contacted'] || 0,
    qualifiedLeads: statusCounts['qualified'] || 0,
    proposalLeads: statusCounts['proposal'] || 0,
    closedWonLeads: closedWon,
    closedLostLeads: statusCounts['closed-lost'] || 0,
    totalEstimatedRevenue: leads
      .filter((l) => l.status === 'closed-won')
      .reduce((s, l) => s + (l.energyReport?.netCost || 0), 0),
    avgMonthlyBill: leads.length
      ? Math.round(leads.reduce((s, l) => s + l.monthlyBill, 0) / leads.length)
      : 0,
    conversionRate: closedTotal > 0 ? Math.round((closedWon / closedTotal) * 100) : 0,
    leadsByState: leads.reduce((acc, l) => { acc[l.state] = (acc[l.state] || 0) + 1; return acc; }, {} as Record<string, number>),
    leadsByProperty: leads.reduce((acc, l) => { acc[l.propertyType] = (acc[l.propertyType] || 0) + 1; return acc; }, {} as Record<string, number>),
    leadsByMonth: [
      { month: 'Jan', count: 3 }, { month: 'Feb', count: 5 }, { month: 'Mar', count: 8 },
      { month: 'Apr', count: 6 }, { month: 'May', count: 12 }, { month: 'Jun', count: leads.length },
    ],
    savingsDistribution: [
      { range: '₹0-₹1K', count: leads.filter((l) => (l.energyReport?.estimatedSavingsMonthly || 0) <= 1000).length },
      { range: '₹1K-₹3K', count: leads.filter((l) => { const s = l.energyReport?.estimatedSavingsMonthly || 0; return s > 1000 && s <= 3000; }).length },
      { range: '₹3K-₹10K', count: leads.filter((l) => { const s = l.energyReport?.estimatedSavingsMonthly || 0; return s > 3000 && s <= 10000; }).length },
      { range: '₹10K+', count: leads.filter((l) => (l.energyReport?.estimatedSavingsMonthly || 0) > 10000).length },
    ],
  };

  return { success: true, data: analytics, source: 'local' };
}

// ---- LOGS -----------------------------------------------------------

export async function adminFetchLogs(): Promise<{ logs: LogEntry[]; source: 'api' | 'local' }> {
  const res = await request<LogEntry[]>('GET', '/logs');
  if (res.ok) return { logs: res.data, source: 'api' };
  const local = getLogs();
  return { logs: local.length > 0 ? local : seedAndSaveLogs(), source: 'local' };
}

export async function adminClearLogs(): Promise<{ source: 'api' | 'local' }> {
  const res = await request<void>('DELETE', '/logs');
  if (res.ok) {
    clearLogs(); // also clear local
    return { source: 'api' };
  }
  clearLogs();
  return { source: 'local' };
}

export async function adminSyncLogs(): Promise<{ synced: number; source: 'api' | 'local' }> {
  const localLogData = getLogs();
  if (localLogData.length === 0) return { synced: 0, source: 'local' };

  const res = await request<{ synced: number }>('POST', '/logs/sync', { logs: localLogData });
  if (res.ok) return { synced: res.data.synced, source: 'api' };
  return { synced: 0, source: 'local' };
}

// Expose for use by components that want to store logs remotely too
export { LOGS_KEY };

// ---- CSV Export -------------------------------------------------------

export function exportLeadsAsCSV(leads: Lead[]): void {
  const headers = [
    'ID', 'First Name', 'Last Name', 'Email', 'Phone',
    'Address', 'City', 'State', 'Pin Code',
    'Property Type', 'Monthly Bill (₹)', 'Status', 'Source',
    'Roof Age (yrs)', 'Roof Type', 'Area (sq ft)',
    'Interested In', 'Current Provider', 'Notes',
    'Monthly Savings (₹)', 'Yearly Savings (₹)', '25-Year Savings (₹)',
    'System Size (kW)', 'Panels Needed', 'Roof Space (sq ft)',
    'Installation Cost (₹)', 'Central Subsidy (₹)', 'State Subsidy (₹)', 'Net Cost (₹)',
    'Payback (yrs)', 'ROI 25yr (%)',
    'CO2 Offset (tons)', 'Trees Equivalent',
    'Created At', 'Updated At',
  ];

  const escape = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = leads.map((l) => [
    escape(l.id),
    escape(l.firstName),
    escape(l.lastName),
    escape(l.email),
    escape(l.phone),
    escape(l.address),
    escape(l.city),
    escape(l.state),
    escape(l.pinCode),
    escape(l.propertyType),
    escape(l.monthlyBill),
    escape(l.status),
    escape(l.source),
    escape(l.roofAge),
    escape(l.roofType),
    escape(l.squareFootage),
    escape(l.interestedIn.join(', ')),
    escape(l.currentProvider),
    escape(l.notes),
    escape(l.energyReport?.estimatedSavingsMonthly ?? ''),
    escape(l.energyReport?.estimatedSavingsYearly ?? ''),
    escape(l.energyReport?.estimatedSavings25Year ?? ''),
    escape(l.energyReport?.systemSizeKW ?? ''),
    escape(l.energyReport?.panelsNeeded ?? ''),
    escape(l.energyReport?.roofSpaceNeeded ?? ''),
    escape(l.energyReport?.installationCost ?? ''),
    escape(l.energyReport?.centralSubsidy ?? ''),
    escape(l.energyReport?.stateSubsidy ?? ''),
    escape(l.energyReport?.netCost ?? ''),
    escape(l.energyReport?.paybackYears ?? ''),
    escape(l.energyReport?.roi25Year ?? ''),
    escape(l.energyReport?.co2OffsetTons ?? ''),
    escape(l.energyReport?.treesEquivalent ?? ''),
    escape(new Date(l.createdAt).toLocaleString('en-IN')),
    escape(new Date(l.updatedAt).toLocaleString('en-IN')),
  ].join(','));

  const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soletronix-leads-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
