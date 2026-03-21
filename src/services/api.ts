import type { Lead, EnergyInput, EnergyReport, ApiResponse } from '../types';

// ============================================================
// BACKEND API CONFIGURATION
// ============================================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === 'true';

// ============================================================
// LOCAL STORAGE MOCK (fallback when no backend is available)
// ============================================================
const STORAGE_KEY = 'free_energy_leads_india';

function getLocalLeads(): Lead[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : generateSeedLeads();
  } catch {
    return generateSeedLeads();
  }
}

function saveLocalLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function generateId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================
// INDIAN SOLAR ENERGY CALCULATION ENGINE
// ============================================================

// Average Peak Sun Hours per day by Indian state/UT
const STATE_SUN_HOURS: Record<string, number> = {
  'Andhra Pradesh': 5.5,
  'Arunachal Pradesh': 4.0,
  'Assam': 4.0,
  'Bihar': 4.8,
  'Chhattisgarh': 5.0,
  'Goa': 5.2,
  'Gujarat': 5.8,
  'Haryana': 5.2,
  'Himachal Pradesh': 5.0,
  'Jharkhand': 4.8,
  'Karnataka': 5.5,
  'Kerala': 5.0,
  'Madhya Pradesh': 5.5,
  'Maharashtra': 5.4,
  'Manipur': 4.2,
  'Meghalaya': 4.0,
  'Mizoram': 4.2,
  'Nagaland': 4.0,
  'Odisha': 5.0,
  'Punjab': 5.2,
  'Rajasthan': 6.2,
  'Sikkim': 4.0,
  'Tamil Nadu': 5.5,
  'Telangana': 5.5,
  'Tripura': 4.2,
  'Uttar Pradesh': 5.0,
  'Uttarakhand': 5.0,
  'West Bengal': 4.5,
  'Delhi': 5.2,
  'Jammu & Kashmir': 5.0,
  'Ladakh': 6.5,
  'Chandigarh': 5.2,
  'Puducherry': 5.5,
  'Andaman & Nicobar': 4.8,
};

export const INDIAN_STATES = Object.keys(STATE_SUN_HOURS);

// Indian-specific constants
const AVG_ELECTRICITY_RATE = 8; // ₹/kWh national average
const COST_PER_WATT = 45; // ₹/Wp installed (with BOS)
const CO2_PER_KWH = 0.00082; // metric tons per kWh (India grid emission factor)
const TREES_PER_TON_CO2 = 16.5;
const PANEL_WATTAGE = 545; // watts per panel (modern bifacial)
const SQFT_PER_PANEL = 22;
const ELECTRICITY_ESCALATION = 1.05; // 5% annual increase in India

// PM Surya Ghar Muft Bijli Yojana subsidy calculation
// PM Surya Ghar Muft Bijli Yojana — flat central subsidy of ₹78,000
const CENTRAL_SUBSIDY = 78000;

export function calculateEnergyReport(input: EnergyInput): EnergyReport {
  const sunHours = STATE_SUN_HOURS[input.state] || 5.0;
  
  const shadingFactor = { none: 1.0, minimal: 0.9, moderate: 0.75, heavy: 0.55 }[input.shading];
  
  // Calculate monthly usage from bill
  const monthlyUsageKWH = input.monthlyBill / AVG_ELECTRICITY_RATE;
  
  // Extra load adjustments
  let loadMultiplier = 1.0;
  if (input.electricVehicle) loadMultiplier += 0.20;
  if (input.poolOrSpa) loadMultiplier += 0.10; // Water pump / heating
  
  const adjustedMonthlyKWH = monthlyUsageKWH * loadMultiplier;
  const yearlyKWH = adjustedMonthlyKWH * 12;
  
  // System size calculation
  const calculatedSizeKW = yearlyKWH / (sunHours * 365 * shadingFactor);
  const cappedByLoadSanction = !!(input.loadSanction && input.loadSanction > 0 && calculatedSizeKW > input.loadSanction);
  const systemSizeKW = cappedByLoadSanction ? input.loadSanction! : calculatedSizeKW;
  const panelsNeeded = Math.ceil((systemSizeKW * 1000) / PANEL_WATTAGE);
  const roofSpaceNeeded = panelsNeeded * SQFT_PER_PANEL;

  // Production
  const solarProductionKWH = systemSizeKW * sunHours * 365 * shadingFactor;
  
  // Costs
  const installationCost = systemSizeKW * 1000 * COST_PER_WATT;
  const centralSubsidy = input.propertyType === 'residential' ? CENTRAL_SUBSIDY : 0;
  const stateSubsidy = 0;
  const netCost = Math.max(0, installationCost - centralSubsidy);
  
  // Savings with electricity escalation (5% annual increase)
  const estimatedSavingsYearly = solarProductionKWH * AVG_ELECTRICITY_RATE;
  const estimatedSavingsMonthly = estimatedSavingsYearly / 12;
  
  // 25-year savings with escalating rates
  let savings25Year = 0;
  for (let year = 1; year <= 25; year++) {
    savings25Year += estimatedSavingsYearly * Math.pow(ELECTRICITY_ESCALATION, year - 1);
  }
  
  // Payback & ROI
  const paybackYears = netCost / estimatedSavingsYearly;
  const roi25Year = ((savings25Year - netCost) / netCost) * 100;
  
  // Environmental
  const co2OffsetTons = solarProductionKWH * CO2_PER_KWH;
  const treesEquivalent = co2OffsetTons * TREES_PER_TON_CO2;
  
  return {
    estimatedSavingsMonthly: Math.round(estimatedSavingsMonthly),
    estimatedSavingsYearly: Math.round(estimatedSavingsYearly),
    estimatedSavings25Year: Math.round(savings25Year),
    systemSizeKW: Math.round(systemSizeKW * 10) / 10,
    panelsNeeded,
    roofSpaceNeeded,
    co2OffsetTons: Math.round(co2OffsetTons * 10) / 10,
    treesEquivalent: Math.round(treesEquivalent),
    paybackYears: Math.round(paybackYears * 10) / 10,
    roi25Year: Math.round(roi25Year),
    installationCost: Math.round(installationCost),
    centralSubsidy: Math.round(centralSubsidy),
    stateSubsidy: Math.round(stateSubsidy),
    netCost: Math.round(netCost),
    monthlyUsageKWH: Math.round(adjustedMonthlyKWH),
    solarProductionKWH: Math.round(solarProductionKWH),
    cappedByLoadSanction,
  };
}

// ============================================================
// SEED DATA FOR INDIA
// ============================================================
function generateSeedLeads(): Lead[] {
  const leads: Lead[] = [
    {
      id: 'lead_seed_001',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@gmail.com',
      phone: '+91 98765 43210',
      address: '14, Sector 21',
      city: 'Gurugram',
      state: 'Haryana',
      pinCode: '122001',
      propertyType: 'residential',
      monthlyBill: 5000,
      roofAge: 5,
      roofType: 'rcc',
      squareFootage: 1800,
      interestedIn: ['solar', 'battery'],
      currentProvider: 'DHBVN',
      notes: 'Very interested, wants on-site survey',
      status: 'qualified',
      source: 'Energy Calculator',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      energyReport: calculateEnergyReport({
        monthlyBill: 5000, squareFootage: 1800, roofAge: 5,
        roofType: 'rcc', propertyType: 'residential',
        state: 'Haryana', shading: 'minimal', electricVehicle: true, poolOrSpa: false, loadSanction: 5,
      }),
    },
    {
      id: 'lead_seed_002',
      firstName: 'Rajesh',
      lastName: 'Patel',
      email: 'rajesh.patel@techcorp.in',
      phone: '+91 87654 32109',
      address: 'Plot 45, GIDC',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pinCode: '380015',
      propertyType: 'commercial',
      monthlyBill: 45000,
      roofAge: 8,
      roofType: 'metal',
      squareFootage: 12000,
      interestedIn: ['solar', 'ev-charging'],
      currentProvider: 'Torrent Power',
      notes: 'Commercial office, 12,000 sq ft rooftop',
      status: 'proposal',
      source: 'Energy Calculator',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      energyReport: calculateEnergyReport({
        monthlyBill: 45000, squareFootage: 12000, roofAge: 8,
        roofType: 'metal', propertyType: 'commercial',
        state: 'Gujarat', shading: 'none', electricVehicle: false, poolOrSpa: false, loadSanction: 5,
      }),
    },
    {
      id: 'lead_seed_003',
      firstName: 'Anita',
      lastName: 'Reddy',
      email: 'anita.r@yahoo.com',
      phone: '+91 76543 21098',
      address: '22, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560038',
      propertyType: 'residential',
      monthlyBill: 8000,
      roofAge: 3,
      roofType: 'rcc',
      squareFootage: 2400,
      interestedIn: ['solar', 'battery', 'smart-home'],
      currentProvider: 'BESCOM',
      notes: 'Has inverter, wants to go fully solar',
      status: 'new',
      source: 'Energy Calculator',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      energyReport: calculateEnergyReport({
        monthlyBill: 8000, squareFootage: 2400, roofAge: 3,
        roofType: 'rcc', propertyType: 'residential',
        state: 'Karnataka', shading: 'none', electricVehicle: false, poolOrSpa: false, loadSanction: 5,
      }),
    },
    {
      id: 'lead_seed_004',
      firstName: 'Vikram',
      lastName: 'Singh',
      email: 'vikram.singh@outlook.com',
      phone: '+91 65432 10987',
      address: 'B-12, Vasant Kunj',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110070',
      propertyType: 'residential',
      monthlyBill: 6500,
      roofAge: 12,
      roofType: 'rcc',
      squareFootage: 1500,
      interestedIn: ['solar'],
      currentProvider: 'BSES Rajdhani',
      notes: '',
      status: 'contacted',
      source: 'Energy Calculator',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      energyReport: calculateEnergyReport({
        monthlyBill: 6500, squareFootage: 1500, roofAge: 12,
        roofType: 'rcc', propertyType: 'residential',
        state: 'Delhi', shading: 'minimal', electricVehicle: false, poolOrSpa: false, loadSanction: 5,
      }),
    },
    {
      id: 'lead_seed_005',
      firstName: 'Meera',
      lastName: 'Iyer',
      email: 'meera.iyer@factory.in',
      phone: '+91 54321 09876',
      address: 'Survey No. 45, MIDC',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411019',
      propertyType: 'industrial',
      monthlyBill: 250000,
      roofAge: 6,
      roofType: 'metal',
      squareFootage: 45000,
      interestedIn: ['solar', 'battery', 'ev-charging'],
      currentProvider: 'MSEDCL',
      notes: 'Large industrial unit, very high energy needs, open to PPA model',
      status: 'closed-won',
      source: 'Energy Calculator',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      energyReport: calculateEnergyReport({
        monthlyBill: 250000, squareFootage: 45000, roofAge: 6,
        roofType: 'metal', propertyType: 'industrial',
        state: 'Maharashtra', shading: 'none', electricVehicle: false, poolOrSpa: false, loadSanction: 5,
      }),
    },
  ];
  
  saveLocalLeads(leads);
  return leads;
}

// ============================================================
// API METHODS
// ============================================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!USE_REAL_BACKEND) {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));
    throw new Error('MOCK_MODE');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ---- LEADS API ----

export async function fetchLeads(): Promise<ApiResponse<Lead[]>> {
  try {
    return await apiRequest<Lead[]>('/leads');
  } catch {
    const leads = getLocalLeads();
    return { success: true, data: leads };
  }
}

export async function fetchLeadById(id: string): Promise<ApiResponse<Lead>> {
  try {
    return await apiRequest<Lead>(`/leads/${id}`);
  } catch {
    const leads = getLocalLeads();
    const lead = leads.find((l) => l.id === id);
    if (lead) {
      return { success: true, data: lead };
    }
    return { success: false, error: 'Lead not found' };
  }
}

export async function createLead(
  leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<ApiResponse<Lead>> {
  const newLead: Lead = {
    ...leadData,
    id: generateId(),
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    return await apiRequest<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(newLead),
    });
  } catch {
    const leads = getLocalLeads();
    leads.unshift(newLead);
    saveLocalLeads(leads);
    return { success: true, data: newLead, message: 'Lead created successfully' };
  }
}

export async function updateLeadStatus(
  id: string,
  status: Lead['status']
): Promise<ApiResponse<Lead>> {
  try {
    return await apiRequest<Lead>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch {
    const leads = getLocalLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return { success: false, error: 'Lead not found' };
    leads[index].status = status;
    leads[index].updatedAt = new Date().toISOString();
    saveLocalLeads(leads);
    return { success: true, data: leads[index] };
  }
}

export async function deleteLead(id: string): Promise<ApiResponse<void>> {
  try {
    return await apiRequest<void>(`/leads/${id}`, { method: 'DELETE' });
  } catch {
    const leads = getLocalLeads();
    const filtered = leads.filter((l) => l.id !== id);
    saveLocalLeads(filtered);
    return { success: true, message: 'Lead deleted' };
  }
}

// ---- ANALYTICS API ----

export interface LeadAnalytics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  proposalLeads: number;
  closedWonLeads: number;
  closedLostLeads: number;
  totalEstimatedRevenue: number;
  avgMonthlyBill: number;
  conversionRate: number;
  leadsByState: Record<string, number>;
  leadsByProperty: Record<string, number>;
  leadsByMonth: { month: string; count: number }[];
  savingsDistribution: { range: string; count: number }[];
}

export async function fetchAnalytics(): Promise<ApiResponse<LeadAnalytics>> {
  try {
    return await apiRequest<LeadAnalytics>('/analytics');
  } catch {
    const leads = getLocalLeads();

    const statusCounts = leads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const leadsByState = leads.reduce(
      (acc, lead) => {
        acc[lead.state] = (acc[lead.state] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const leadsByProperty = leads.reduce(
      (acc, lead) => {
        acc[lead.propertyType] = (acc[lead.propertyType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalRevenue = leads
      .filter((l) => l.status === 'closed-won')
      .reduce((sum, l) => sum + (l.energyReport?.netCost || 0), 0);

    const avgBill = leads.length
      ? leads.reduce((sum, l) => sum + l.monthlyBill, 0) / leads.length
      : 0;

    const closedWon = statusCounts['closed-won'] || 0;
    const closedTotal = closedWon + (statusCounts['closed-lost'] || 0);
    const conversionRate = closedTotal > 0 ? (closedWon / closedTotal) * 100 : 0;

    const analytics: LeadAnalytics = {
      totalLeads: leads.length,
      newLeads: statusCounts['new'] || 0,
      contactedLeads: statusCounts['contacted'] || 0,
      qualifiedLeads: statusCounts['qualified'] || 0,
      proposalLeads: statusCounts['proposal'] || 0,
      closedWonLeads: closedWon,
      closedLostLeads: statusCounts['closed-lost'] || 0,
      totalEstimatedRevenue: totalRevenue,
      avgMonthlyBill: Math.round(avgBill),
      conversionRate: Math.round(conversionRate),
      leadsByState,
      leadsByProperty,
      leadsByMonth: [
        { month: 'Jan', count: 3 },
        { month: 'Feb', count: 5 },
        { month: 'Mar', count: 8 },
        { month: 'Apr', count: 6 },
        { month: 'May', count: 12 },
        { month: 'Jun', count: leads.length },
      ],
      savingsDistribution: [
        { range: '₹0-₹1K', count: leads.filter((l) => (l.energyReport?.estimatedSavingsMonthly || 0) <= 1000).length },
        { range: '₹1K-₹3K', count: leads.filter((l) => { const s = l.energyReport?.estimatedSavingsMonthly || 0; return s > 1000 && s <= 3000; }).length },
        { range: '₹3K-₹10K', count: leads.filter((l) => { const s = l.energyReport?.estimatedSavingsMonthly || 0; return s > 3000 && s <= 10000; }).length },
        { range: '₹10K+', count: leads.filter((l) => (l.energyReport?.estimatedSavingsMonthly || 0) > 10000).length },
      ],
    };

    return { success: true, data: analytics };
  }
}
