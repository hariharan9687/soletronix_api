// ============================================================
// SEED DATA — Soletronix Energy Tool
// Used as fallback when localStorage is empty
// ============================================================

import type { Lead } from '../types';
import type { LogEntry } from './logger';

const now = Date.now();

export const SEED_LEADS: Lead[] = [
  {
    id: 'lead_seed_001',
    firstName: 'Arjun', lastName: 'Murugan',
    email: 'arjun.m@spintech.in', phone: '+91 98401 12345',
    address: '12, SIDCO Industrial Estate', city: 'Coimbatore',
    state: 'Tamil Nadu', pinCode: '641021',
    propertyType: 'industrial', monthlyBill: 320000,
    roofAge: 4, roofType: 'metal', squareFootage: 52000,
    interestedIn: ['solar', 'open-access'],
    currentProvider: 'TANGEDCO',
    notes: 'Spinning mill, 3-shift operation. Very keen on Open Access.',
    status: 'qualified', source: 'TANGEDCO Audit',
    createdAt: new Date(now - 3 * 86400000).toISOString(),
    updatedAt: new Date(now - 1 * 86400000).toISOString(),
    energyReport: {
      estimatedSavingsMonthly: 58000, estimatedSavingsYearly: 696000,
      estimatedSavings25Year: 24360000, systemSizeKW: 450, panelsNeeded: 826,
      roofSpaceNeeded: 18172, co2OffsetTons: 204, treesEquivalent: 3366,
      paybackYears: 4.2, roi25Year: 320, installationCost: 20250000,
      centralSubsidy: 0, stateSubsidy: 2000000, netCost: 18250000,
      monthlyUsageKWH: 280000, solarProductionKWH: 876000,
    },
  },
  {
    id: 'lead_seed_002',
    firstName: 'Kavitha', lastName: 'Rajan',
    email: 'kavitha@dye-masters.com', phone: '+91 94432 67890',
    address: '78, Tiruppur Road', city: 'Tiruppur',
    state: 'Tamil Nadu', pinCode: '641604',
    propertyType: 'industrial', monthlyBill: 185000,
    roofAge: 6, roofType: 'metal', squareFootage: 28000,
    interestedIn: ['solar', 'battery'],
    currentProvider: 'TANGEDCO',
    notes: 'Dyeing unit with high ToD peak penalties.',
    status: 'proposal', source: 'TANGEDCO Audit',
    createdAt: new Date(now - 7 * 86400000).toISOString(),
    updatedAt: new Date(now - 2 * 86400000).toISOString(),
    energyReport: {
      estimatedSavingsMonthly: 32000, estimatedSavingsYearly: 384000,
      estimatedSavings25Year: 13440000, systemSizeKW: 260, panelsNeeded: 477,
      roofSpaceNeeded: 10494, co2OffsetTons: 118, treesEquivalent: 1947,
      paybackYears: 5.1, roi25Year: 270, installationCost: 11700000,
      centralSubsidy: 0, stateSubsidy: 1200000, netCost: 10500000,
      monthlyUsageKWH: 162000, solarProductionKWH: 506000,
    },
  },
  {
    id: 'lead_seed_003',
    firstName: 'Senthil', lastName: 'Kumar',
    email: 'senthil@autoparts-tn.in', phone: '+91 99401 54321',
    address: 'Plot 34, SIPCOT', city: 'Hosur',
    state: 'Tamil Nadu', pinCode: '635126',
    propertyType: 'industrial', monthlyBill: 420000,
    roofAge: 3, roofType: 'rcc', squareFootage: 65000,
    interestedIn: ['solar', 'open-access', 'ev-charging'],
    currentProvider: 'TANGEDCO',
    notes: 'Auto components plant. Exports to EU — CBAM concern.',
    status: 'closed-won', source: 'TANGEDCO Audit',
    createdAt: new Date(now - 14 * 86400000).toISOString(),
    updatedAt: new Date(now - 5 * 86400000).toISOString(),
    energyReport: {
      estimatedSavingsMonthly: 76000, estimatedSavingsYearly: 912000,
      estimatedSavings25Year: 31920000, systemSizeKW: 600, panelsNeeded: 1101,
      roofSpaceNeeded: 24222, co2OffsetTons: 272, treesEquivalent: 4488,
      paybackYears: 3.8, roi25Year: 390, installationCost: 27000000,
      centralSubsidy: 0, stateSubsidy: 2500000, netCost: 24500000,
      monthlyUsageKWH: 370000, solarProductionKWH: 1168000,
    },
  },
  {
    id: 'lead_seed_004',
    firstName: 'Priya', lastName: 'Nair',
    email: 'priya.nair@gmail.com', phone: '+91 87654 11223',
    address: '5A, Anna Nagar West', city: 'Chennai',
    state: 'Tamil Nadu', pinCode: '600040',
    propertyType: 'residential', monthlyBill: 7500,
    roofAge: 2, roofType: 'rcc', squareFootage: 2200,
    interestedIn: ['solar', 'battery'],
    currentProvider: 'TANGEDCO',
    notes: 'Wants PM Surya Ghar subsidy.',
    status: 'contacted', source: 'Energy Calculator',
    createdAt: new Date(now - 2 * 86400000).toISOString(),
    updatedAt: new Date(now - 1 * 86400000).toISOString(),
    energyReport: {
      estimatedSavingsMonthly: 4800, estimatedSavingsYearly: 57600,
      estimatedSavings25Year: 2016000, systemSizeKW: 5.5, panelsNeeded: 11,
      roofSpaceNeeded: 242, co2OffsetTons: 2.5, treesEquivalent: 41,
      paybackYears: 5.8, roi25Year: 210, installationCost: 247500,
      centralSubsidy: 78000, stateSubsidy: 44000, netCost: 125500,
      monthlyUsageKWH: 938, solarProductionKWH: 10700,
    },
  },
  {
    id: 'lead_seed_005',
    firstName: 'Ramesh', lastName: 'Selvam',
    email: 'ramesh.s@foundry.in', phone: '+91 76543 99887',
    address: '22, Industrial Area', city: 'Salem',
    state: 'Tamil Nadu', pinCode: '636005',
    propertyType: 'industrial', monthlyBill: 275000,
    roofAge: 8, roofType: 'metal', squareFootage: 40000,
    interestedIn: ['solar'],
    currentProvider: 'TANGEDCO',
    notes: 'Foundry with poor PF — needs capacitor bank first.',
    status: 'new', source: 'TANGEDCO Audit',
    createdAt: new Date(now - 1 * 86400000).toISOString(),
    updatedAt: new Date(now - 1 * 86400000).toISOString(),
    energyReport: {
      estimatedSavingsMonthly: 49000, estimatedSavingsYearly: 588000,
      estimatedSavings25Year: 20580000, systemSizeKW: 380, panelsNeeded: 698,
      roofSpaceNeeded: 15356, co2OffsetTons: 172, treesEquivalent: 2838,
      paybackYears: 4.6, roi25Year: 295, installationCost: 17100000,
      centralSubsidy: 0, stateSubsidy: 1800000, netCost: 15300000,
      monthlyUsageKWH: 241000, solarProductionKWH: 740000,
    },
  },
  {
    id: 'lead_seed_006',
    firstName: 'Deepa', lastName: 'Krishnamurthy',
    email: 'deepa.k@pharma.in', phone: '+91 98765 44332',
    address: 'Block B, SIDCO Estate', city: 'Madurai',
    state: 'Tamil Nadu', pinCode: '625003',
    propertyType: 'industrial', monthlyBill: 195000,
    roofAge: 5, roofType: 'metal', squareFootage: 32000,
    interestedIn: ['solar', 'open-access'],
    currentProvider: 'TANGEDCO',
    notes: 'Pharma plant, 24x7 ops, CCTS-obligated sector.',
    status: 'closed-lost', source: 'TANGEDCO Audit',
    createdAt: new Date(now - 20 * 86400000).toISOString(),
    updatedAt: new Date(now - 8 * 86400000).toISOString(),
    energyReport: {
      estimatedSavingsMonthly: 35000, estimatedSavingsYearly: 420000,
      estimatedSavings25Year: 14700000, systemSizeKW: 290, panelsNeeded: 533,
      roofSpaceNeeded: 11726, co2OffsetTons: 131, treesEquivalent: 2161,
      paybackYears: 5.5, roi25Year: 252, installationCost: 13050000,
      centralSubsidy: 0, stateSubsidy: 1300000, netCost: 11750000,
      monthlyUsageKWH: 172000, solarProductionKWH: 565000,
    },
  },
];

export const SEED_LOGS: LogEntry[] = [
  { id: 'log_s01', timestamp: new Date(now - 30 * 60000).toISOString(), type: 'page_visit',     severity: 'info',    message: 'Navigated to industrial' },
  { id: 'log_s02', timestamp: new Date(now - 28 * 60000).toISOString(), type: 'audit_run',      severity: 'info',    message: 'TANGEDCO industrial audit — HT-I-A in Coimbatore', details: { consumerNumber: 'HT-CB-00123', totalUnitsKWH: 280000, totalBill: 320000, totalPotentialSavings: 8352000 } },
  { id: 'log_s03', timestamp: new Date(now - 27 * 60000).toISOString(), type: 'lead_created',   severity: 'success', message: 'New lead captured — Arjun Murugan (industrial)', details: { leadId: 'lead_seed_001', email: 'arjun.m@spintech.in', city: 'Coimbatore', monthlyBill: 320000 } },
  { id: 'log_s04', timestamp: new Date(now - 23 * 60000).toISOString(), type: 'audit_run',      severity: 'info',    message: 'TANGEDCO industrial audit — HT-I-A in Tiruppur', details: { consumerNumber: 'HT-TP-00456', totalUnitsKWH: 162000, totalBill: 185000, totalPotentialSavings: 4608000 } },
  { id: 'log_s05', timestamp: new Date(now - 22 * 60000).toISOString(), type: 'lead_created',   severity: 'success', message: 'New lead captured — Kavitha Rajan (industrial)', details: { leadId: 'lead_seed_002', email: 'kavitha@dye-masters.com', city: 'Tiruppur', monthlyBill: 185000 } },
  { id: 'log_s06', timestamp: new Date(now - 18 * 60000).toISOString(), type: 'status_changed', severity: 'info',    message: 'Lead status updated — Kavitha Rajan: new to proposal', details: { leadId: 'lead_seed_002', from: 'new', to: 'proposal' } },
  { id: 'log_s07', timestamp: new Date(now - 12 * 60000).toISOString(), type: 'calculator_run', severity: 'info',    message: 'Residential calculator run — residential in Tamil Nadu', details: { monthlyBill: 7500, systemSizeKW: 5.5, estimatedSavingsMonthly: 4800 } },
  { id: 'log_s08', timestamp: new Date(now - 11 * 60000).toISOString(), type: 'lead_created',   severity: 'success', message: 'New lead captured — Priya Nair (residential)', details: { leadId: 'lead_seed_004', email: 'priya.nair@gmail.com', city: 'Chennai', monthlyBill: 7500 } },
  { id: 'log_s09', timestamp: new Date(now -  8 * 60000).toISOString(), type: 'audit_run',      severity: 'info',    message: 'TANGEDCO industrial audit — HT-I-A in Hosur', details: { consumerNumber: 'HT-HO-00789', totalUnitsKWH: 370000, totalBill: 420000, totalPotentialSavings: 10944000 } },
  { id: 'log_s10', timestamp: new Date(now -  7 * 60000).toISOString(), type: 'lead_created',   severity: 'success', message: 'New lead captured — Senthil Kumar (industrial)', details: { leadId: 'lead_seed_003', email: 'senthil@autoparts-tn.in', city: 'Hosur', monthlyBill: 420000 } },
  { id: 'log_s11', timestamp: new Date(now -  6 * 60000).toISOString(), type: 'status_changed', severity: 'info',    message: 'Lead status updated — Senthil Kumar: new to closed-won', details: { leadId: 'lead_seed_003', from: 'new', to: 'closed-won' } },
  { id: 'log_s12', timestamp: new Date(now -  4 * 60000).toISOString(), type: 'lead_deleted',   severity: 'warning', message: 'Lead deleted — old duplicate entry', details: { leadId: 'lead_old_00', email: 'test@test.com' } },
  { id: 'log_s13', timestamp: new Date(now -  2 * 60000).toISOString(), type: 'system',         severity: 'info',    message: 'Admin panel accessed', details: { source: 'admin.html' } },
];

export function seedAndSaveLeads(): Lead[] {
  localStorage.setItem('free_energy_leads_india', JSON.stringify(SEED_LEADS));
  return SEED_LEADS;
}

export function seedAndSaveLogs(): LogEntry[] {
  localStorage.setItem('soletronix_activity_logs', JSON.stringify(SEED_LOGS));
  return SEED_LOGS;
}
