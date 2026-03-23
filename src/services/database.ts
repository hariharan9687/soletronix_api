const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  designation: string;
  city: string;
  whatsappConsent: boolean;
}

export interface ResidentialCalcData {
  contactData: ContactData;
  inputData: Record<string, unknown>;
  reportData?: Record<string, unknown>;
}

export interface TANGEDCOAuditData {
  contactData: ContactData;
  inputData: Record<string, unknown>;
  reportData?: Record<string, unknown>;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
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

    // Server already returns { success, data } — return it directly
    const result = await response.json();
    return result as ApiResponse<T>;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error - is the server running?',
    };
  }
}

// Residential Calculator APIs
export async function saveResidentialCalculator(data: ResidentialCalcData): Promise<ApiResponse<ResidentialCalcData>> {
  return apiRequest<ResidentialCalcData>('/residential-calculators', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchResidentialCalculators(): Promise<ApiResponse<ResidentialCalcData[]>> {
  return apiRequest<ResidentialCalcData[]>('/residential-calculators');
}

// TANGEDCO Audit APIs
export async function saveTANGEDCOAudit(data: TANGEDCOAuditData): Promise<ApiResponse<TANGEDCOAuditData>> {
  return apiRequest<TANGEDCOAuditData>('/tangedco-audits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchTANGEDCOAudits(): Promise<ApiResponse<TANGEDCOAuditData[]>> {
  return apiRequest<TANGEDCOAuditData[]>('/tangedco-audits');
}

// Delete TANGEDCO audit
export async function deleteTANGEDCOAudit(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/tangedco-audits/${id}`, { method: 'DELETE' });
}

// Delete Residential calculator
export async function deleteResidentialCalculator(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/residential-calculators/${id}`, { method: 'DELETE' });
}

// Audit stats
export interface AuditStats {
  totalIndustrial: number;
  totalResidential: number;
  todayIndustrial: number;
  todayResidential: number;
}

export async function fetchAuditStats(): Promise<ApiResponse<AuditStats>> {
  return apiRequest<AuditStats>('/audit-stats');
}

// Save lead from TANGEDCO audit (contact details + audit input as notes)
export async function saveLeadFromTANGEDCOAudit(
  contactData: ContactData,
  inputData: Record<string, unknown>,
  reportData: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const currentBill = (reportData.currentBill as Record<string, number> | undefined)?.totalBill || 0;
  const savings = (reportData.savingsSummary as Record<string, number> | undefined)?.totalPotentialSavings || 0;
  const solar = reportData.solarRooftopAnalysis as Record<string, number> | undefined;

  const energyReport = {
    estimatedSavingsMonthly: Math.round(savings / 12),
    estimatedSavingsYearly: Math.round(savings),
    estimatedSavings25Year: Math.round(savings * 20),
    systemSizeKW: solar?.recommendedSizeKW || 0,
    panelsNeeded: Math.ceil(((solar?.recommendedSizeKW || 0) * 1000) / 545),
    roofSpaceNeeded: solar?.roofAreaRequired || 0,
    co2OffsetTons: Math.round(((solar?.annualGeneration || 0) * 0.82) / 1000),
    treesEquivalent: Math.round(((solar?.annualGeneration || 0) * 0.82 / 1000) * 16.5),
    paybackYears: solar?.paybackYears || 0,
    roi25Year: solar?.roi25Year || 0,
    installationCost: solar?.installationCost || 0,
    centralSubsidy: 0,
    stateSubsidy: 0,
    netCost: solar?.netInvestment || 0,
    monthlyUsageKWH: (inputData.totalUnitsKWH as number) || 0,
    solarProductionKWH: solar?.annualGeneration || 0,
  };

  const auditNotes = `TANGEDCO_AUDIT:${JSON.stringify({
    consumerNumber: inputData.consumerNumber,
    tariffCategory: inputData.tariffCategory,
    billingMonth: inputData.billingMonth,
    totalUnitsKWH: inputData.totalUnitsKWH,
    contractedDemandKVA: inputData.contractedDemandKVA,
    recordedDemandKVA: inputData.recordedDemandKVA,
    powerFactor: inputData.powerFactor,
    district: inputData.district,
    industryType: inputData.industryType,
    shiftPattern: inputData.shiftPattern,
    operatingHoursPerDay: inputData.operatingHoursPerDay,
    operatingDaysPerMonth: inputData.operatingDaysPerMonth,
    sipcotSidco: inputData.sipcotSidco,
    exportToEU: inputData.exportToEU,
    exportPercentage: inputData.exportPercentage,
    loadSanction: inputData.loadSanction,
  })}`;

  return apiRequest('/leads', {
    method: 'POST',
    body: JSON.stringify({
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      companyName: contactData.companyName,
      designation: contactData.designation,
      city: contactData.city,
      state: 'Tamil Nadu',
      address: '',
      pinCode: '',
      propertyType: 'industrial',
      monthlyBill: currentBill,
      roofAge: 5,
      roofType: 'metal',
      squareFootage: ((inputData.contractedDemandKVA as number) || 0) * 100,
      interestedIn: ['solar'],
      currentProvider: 'TANGEDCO',
      notes: auditNotes,
      source: 'TANGEDCO Audit',
      whatsappConsent: contactData.whatsappConsent,
      energyReport,
    }),
  });
}

// Health check
export async function checkServerHealth(): Promise<boolean> {
  const result = await apiRequest<{ message: string }>('/health');
  return result.success;
}
