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

// ============================================================
// STATE-SPECIFIC RESIDENTIAL TARIFF SLABS
// biMonthly:true  → slabs apply to 2-month consumption (TN, Kerala)
// biMonthly:false → slabs apply to monthly consumption
// slabs: [{upto: units, rate: ₹/unit}] — last slab has upto:Infinity
// fixedCharge: ₹/month
// ============================================================
interface TariffSlab { upto: number; rate: number; }
interface StateTariff { biMonthly: boolean; fixedCharge: number; slabs: TariffSlab[]; }

const STATE_TARIFF: Record<string, StateTariff> = {
  // Tamil Nadu — bi-monthly slabs (TANGEDCO LT-IA domestic)
  'Tamil Nadu': {
    biMonthly: true, fixedCharge: 15,
    slabs: [
      { upto: 100,  rate: 0.00 },
      { upto: 200,  rate: 1.50 },
      { upto: 500,  rate: 3.00 },
      { upto: 1000, rate: 5.00 },
      { upto: Infinity, rate: 6.50 },
    ],
  },
  // Kerala — bi-monthly (KSEB LT-IA)
  'Kerala': {
    biMonthly: true, fixedCharge: 30,
    slabs: [
      { upto: 80,   rate: 2.25 },
      { upto: 160,  rate: 2.90 },
      { upto: 240,  rate: 3.75 },
      { upto: 400,  rate: 5.25 },
      { upto: Infinity, rate: 7.08 },
    ],
  },
  // Maharashtra (MSEDCL)
  'Maharashtra': {
    biMonthly: false, fixedCharge: 75,
    slabs: [
      { upto: 100,  rate: 1.91 },
      { upto: 300,  rate: 3.55 },
      { upto: 500,  rate: 5.10 },
      { upto: Infinity, rate: 6.05 },
    ],
  },
  // Gujarat (DGVCL)
  'Gujarat': {
    biMonthly: false, fixedCharge: 50,
    slabs: [
      { upto: 50,   rate: 2.35 },
      { upto: 200,  rate: 3.15 },
      { upto: 400,  rate: 4.40 },
      { upto: Infinity, rate: 5.50 },
    ],
  },
  // Karnataka (BESCOM)
  'Karnataka': {
    biMonthly: false, fixedCharge: 40,
    slabs: [
      { upto: 30,   rate: 0.00 },
      { upto: 100,  rate: 3.15 },
      { upto: 200,  rate: 6.00 },
      { upto: 400,  rate: 7.10 },
      { upto: Infinity, rate: 8.00 },
    ],
  },
  // Andhra Pradesh (APEPDCL/APSPDCL)
  'Andhra Pradesh': {
    biMonthly: false, fixedCharge: 25,
    slabs: [
      { upto: 50,   rate: 1.45 },
      { upto: 100,  rate: 2.60 },
      { upto: 200,  rate: 3.75 },
      { upto: 300,  rate: 5.25 },
      { upto: Infinity, rate: 6.50 },
    ],
  },
  // Telangana (TSSPDCL/TSNPDCL)
  'Telangana': {
    biMonthly: false, fixedCharge: 25,
    slabs: [
      { upto: 50,   rate: 1.45 },
      { upto: 100,  rate: 2.60 },
      { upto: 200,  rate: 3.75 },
      { upto: 300,  rate: 5.25 },
      { upto: Infinity, rate: 6.50 },
    ],
  },
  // Delhi (BSES/BYPL/TPDDL)
  'Delhi': {
    biMonthly: false, fixedCharge: 125,
    slabs: [
      { upto: 200,  rate: 3.00 },
      { upto: 400,  rate: 4.50 },
      { upto: 800,  rate: 6.50 },
      { upto: Infinity, rate: 7.00 },
    ],
  },
  // Rajasthan (JVVNL/AVVNL)
  'Rajasthan': {
    biMonthly: false, fixedCharge: 80,
    slabs: [
      { upto: 50,   rate: 3.35 },
      { upto: 150,  rate: 5.25 },
      { upto: 300,  rate: 6.30 },
      { upto: Infinity, rate: 6.95 },
    ],
  },
  // Uttar Pradesh (UPPCL)
  'Uttar Pradesh': {
    biMonthly: false, fixedCharge: 80,
    slabs: [
      { upto: 100,  rate: 3.35 },
      { upto: 300,  rate: 4.65 },
      { upto: Infinity, rate: 5.90 },
    ],
  },
  // West Bengal (WBSEDCL/CESC)
  'West Bengal': {
    biMonthly: false, fixedCharge: 40,
    slabs: [
      { upto: 25,   rate: 4.78 },
      { upto: 100,  rate: 5.63 },
      { upto: 300,  rate: 6.14 },
      { upto: Infinity, rate: 6.66 },
    ],
  },
  // Madhya Pradesh (MPPKVVCL)
  'Madhya Pradesh': {
    biMonthly: false, fixedCharge: 70,
    slabs: [
      { upto: 50,   rate: 3.79 },
      { upto: 150,  rate: 4.98 },
      { upto: 300,  rate: 5.95 },
      { upto: Infinity, rate: 6.42 },
    ],
  },
  // Bihar (NBPDCL/SBPDCL)
  'Bihar': {
    biMonthly: false, fixedCharge: 65,
    slabs: [
      { upto: 100,  rate: 5.25 },
      { upto: 200,  rate: 5.75 },
      { upto: Infinity, rate: 6.50 },
    ],
  },
  // Haryana (DHBVNL/UHBVNL)
  'Haryana': {
    biMonthly: false, fixedCharge: 60,
    slabs: [
      { upto: 50,   rate: 2.00 },
      { upto: 100,  rate: 2.50 },
      { upto: 200,  rate: 5.25 },
      { upto: 400,  rate: 6.30 },
      { upto: Infinity, rate: 6.90 },
    ],
  },
  // Punjab (PSPCL)
  'Punjab': {
    biMonthly: false, fixedCharge: 50,
    slabs: [
      { upto: 100,  rate: 3.49 },
      { upto: 300,  rate: 5.98 },
      { upto: Infinity, rate: 7.73 },
    ],
  },
  // Himachal Pradesh (HPSEBL)
  'Himachal Pradesh': {
    biMonthly: false, fixedCharge: 25,
    slabs: [
      { upto: 60,   rate: 0.00 },
      { upto: 125,  rate: 1.65 },
      { upto: 300,  rate: 2.50 },
      { upto: Infinity, rate: 3.75 },
    ],
  },
  // Odisha (TPCODL/NESCO)
  'Odisha': {
    biMonthly: false, fixedCharge: 40,
    slabs: [
      { upto: 50,   rate: 1.75 },
      { upto: 200,  rate: 3.35 },
      { upto: 400,  rate: 4.85 },
      { upto: Infinity, rate: 5.70 },
    ],
  },
  // Assam (APDCL)
  'Assam': {
    biMonthly: false, fixedCharge: 50,
    slabs: [
      { upto: 30,   rate: 2.25 },
      { upto: 100,  rate: 4.50 },
      { upto: 300,  rate: 6.00 },
      { upto: Infinity, rate: 7.00 },
    ],
  },
  // Jharkhand (JBVNL)
  'Jharkhand': {
    biMonthly: false, fixedCharge: 60,
    slabs: [
      { upto: 100,  rate: 4.00 },
      { upto: 200,  rate: 5.50 },
      { upto: Infinity, rate: 6.50 },
    ],
  },
  // Chhattisgarh (CSPDCL)
  'Chhattisgarh': {
    biMonthly: false, fixedCharge: 45,
    slabs: [
      { upto: 30,   rate: 0.00 },
      { upto: 100,  rate: 3.30 },
      { upto: 200,  rate: 4.50 },
      { upto: Infinity, rate: 5.60 },
    ],
  },
  // Goa (GESC)
  'Goa': {
    biMonthly: false, fixedCharge: 30,
    slabs: [
      { upto: 30,   rate: 1.10 },
      { upto: 100,  rate: 2.10 },
      { upto: 200,  rate: 3.30 },
      { upto: 400,  rate: 4.50 },
      { upto: Infinity, rate: 5.50 },
    ],
  },
};

// Default tariff for states not listed (flat rate approximation)
const DEFAULT_TARIFF: StateTariff = {
  biMonthly: false, fixedCharge: 50,
  slabs: [{ upto: Infinity, rate: 6.00 }],
};

/**
 * Calculate monthly electricity bill from bi-monthly consumed units
 * using state-specific residential slab tariff rates.
 * Always returns the MONTHLY equivalent bill (₹/month).
 */
export function calculateBillFromUnits(biMonthlyUnits: number, state: string): number {
  if (!biMonthlyUnits || biMonthlyUnits <= 0) return 0;

  const tariff = STATE_TARIFF[state] || DEFAULT_TARIFF;
  const { biMonthly, fixedCharge, slabs } = tariff;

  // Units to apply slabs against
  const units = biMonthly ? biMonthlyUnits : biMonthlyUnits / 2;

  let charge = 0;
  let prevLimit = 0;
  let remaining = units;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabCapacity = slab.upto - prevLimit;
    const slabUnits = Math.min(remaining, slabCapacity);
    charge += slabUnits * slab.rate;
    remaining -= slabUnits;
    prevLimit = slab.upto;
  }

  // Add fixed/meter charge
  charge += fixedCharge;

  // If bi-monthly slabs, divide by 2 to get monthly
  const monthlyBill = biMonthly ? charge / 2 : charge;

  return Math.round(monthlyBill);
}

// Indian-specific constants
const AVG_ELECTRICITY_RATE = 8; // ₹/kWh national average (used for savings calc)
const COST_PER_WATT = 60;       // ₹/Wp installed (with BOS) — ₹60,000/kW
const CO2_PER_KWH = 0.00082; // metric tons per kWh (India grid emission factor)
const TREES_PER_TON_CO2 = 16.5;
const PANEL_WATTAGE = 545; // watts per panel (modern bifacial)
const SQFT_PER_PANEL = 22;
const ELECTRICITY_ESCALATION = 1.05; // 5% annual increase in India

// PM Surya Ghar Muft Bijli Yojana subsidy calculation
// PM Surya Ghar Muft Bijli Yojana — flat central subsidy of ₹78,000
const CENTRAL_SUBSIDY = 78000;

export function calculateEnergyReport(input: EnergyInput): EnergyReport {
  // Fixed generation rate: 5.5 kWh per kW per day (India standard rooftop solar)
  const SOLAR_GEN_RATE = 5.5; // kWh/kW/day
  const sunHours = STATE_SUN_HOURS[input.state] || SOLAR_GEN_RATE;

  const shadingFactor = { none: 1.0, minimal: 0.9, moderate: 0.75, heavy: 0.55 }[input.shading];

  // Resolve monthly bill — prefer direct bill entry; fall back to units-based calculation
  const resolvedMonthlyBill = input.monthlyBill > 0
    ? input.monthlyBill
    : (input.consumedUnits > 0 ? calculateBillFromUnits(input.consumedUnits, input.state) : 0);

  // Resolve monthly usage in kWh
  // If consumed units are provided use them directly (bi-monthly ÷ 2 = monthly kWh)
  const monthlyUsageKWH = input.consumedUnits > 0
    ? input.consumedUnits / 2          // bi-monthly units → monthly kWh
    : resolvedMonthlyBill / AVG_ELECTRICITY_RATE;

  // Extra load adjustments
  let loadMultiplier = 1.0;
  if (input.electricVehicle) loadMultiplier += 0.20;
  if (input.poolOrSpa) loadMultiplier += 0.10;

  const adjustedMonthlyKWH = monthlyUsageKWH * loadMultiplier;
  const yearlyKWH = adjustedMonthlyKWH * 12;

  // System size: yearlyKWH / (5.5 kWh/kW/day × 365 days × shading)
  const hasLoadSanction = !!(input.loadSanction && input.loadSanction > 0);
  const calculatedSizeKW = resolvedMonthlyBill > 0 || input.consumedUnits > 0
    ? yearlyKWH / (sunHours * 365 * shadingFactor)
    : (hasLoadSanction ? input.loadSanction! : 0);
  const cappedByLoadSanction = !!(hasLoadSanction && calculatedSizeKW > input.loadSanction!);
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
