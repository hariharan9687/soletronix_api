const API_BASE_URL = '/api';

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

// Health check
export async function checkServerHealth(): Promise<boolean> {
  const result = await apiRequest<{ message: string }>('/health');
  return result.success;
}
