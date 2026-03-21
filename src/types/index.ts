export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  propertyType: 'residential' | 'commercial' | 'industrial';
  monthlyBill: number;
  roofAge: number;
  roofType: string;
  squareFootage: number;
  interestedIn: string[];
  currentProvider: string;
  notes: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed-won' | 'closed-lost';
  source: string;
  createdAt: string;
  updatedAt: string;
  energyReport?: EnergyReport;
}

export interface EnergyReport {
  estimatedSavingsMonthly: number;
  estimatedSavingsYearly: number;
  estimatedSavings25Year: number;
  systemSizeKW: number;
  panelsNeeded: number;
  roofSpaceNeeded: number;
  co2OffsetTons: number;
  treesEquivalent: number;
  paybackYears: number;
  roi25Year: number;
  installationCost: number;
  centralSubsidy: number;
  stateSubsidy: number;
  netCost: number;
  monthlyUsageKWH: number;
  solarProductionKWH: number;
  cappedByLoadSanction?: boolean;
}

export interface EnergyInput {
  monthlyBill: number;
  squareFootage: number;
  roofAge: number;
  roofType: string;
  propertyType: 'residential' | 'commercial' | 'industrial';
  state: string;
  shading: 'none' | 'minimal' | 'moderate' | 'heavy';
  electricVehicle: boolean;
  poolOrSpa: boolean;
  loadSanction: number; // in kW, as per DISCOM sanction letter
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type LeadStatus = Lead['status'];
export type PropertyType = Lead['propertyType'];
