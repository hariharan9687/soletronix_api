// ============================================================
// TANGEDCO INDUSTRIAL BILL AUDIT TYPES
// Tamil Nadu Specific - TNERC GEOA 2025 Compliant
// ============================================================

export type TariffCategory = 
  | 'HT-I-A'      // HT Industrial - General
  | 'HT-I-B'      // HT Industrial - Power Intensive
  | 'HT-II-A'     // HT Commercial
  | 'HT-II-B'     // HT Commercial - AC/Refrigeration
  | 'HT-III'      // HT Railway Traction
  | 'HT-IV'       // HT Agricultural
  | 'LT-III-A-1'  // LT Industrial - Small (up to 50 HP)
  | 'LT-III-A-2'  // LT Industrial - Medium (50-112 HP)
  | 'LT-III-B'    // LT Industrial - Large (above 112 HP)
  | 'LT-IV-A'     // LT Commercial - Small
  | 'LT-IV-B';    // LT Commercial - Large

export type IndustryType = 
  | 'spinning-mill' 
  | 'dyeing' 
  | 'auto-components' 
  | 'foundry' 
  | 'pharma' 
  | 'food-processing' 
  | 'cement' 
  | 'chemical' 
  | 'engineering' 
  | 'other';

export interface TANGEDCOBillInput {
  // Basic Info
  consumerNumber: string;
  tariffCategory: TariffCategory;
  billingMonth: string;
  
  // Load Details
  contractedDemandKVA: number;
  recordedDemandKVA: number;
  connectedLoadHP: number;
  loadSanction?: number; // in kW, as per DISCOM sanction letter
  
  // Consumption
  totalUnitsKWH: number;
  peakUnitsKWH?: number;
  offPeakUnitsKWH?: number;
  
  // Power Factor
  powerFactor: number;
  reactiveEnergyKVARH?: number;
  
  // Existing Solar
  existingSolarKW?: number;
  solarGenerationKWH?: number;
  netMeteringEnabled?: boolean;
  
  // Industry Details
  industryType: IndustryType;
  operatingHoursPerDay: number;
  operatingDaysPerMonth: number;
  shiftPattern: '1-shift' | '2-shift' | '3-shift' | 'continuous';
  
  // Location
  district: string;
  sipcotSidco?: 'SIPCOT' | 'SIDCO' | 'Private' | 'Other';
  
  // Export (for CBAM/CCTS)
  exportToEU: boolean;
  exportPercentage?: number;
}

export interface TANGEDCOBillAuditReport {
  inputSummary: TANGEDCOBillInput;
  
  currentBill: {
    energyCharge: number;
    demandCharge: number;
    todPeakSurcharge: number;
    todOffPeakRebate: number;
    powerFactorPenalty: number;
    powerFactorIncentive: number;
    fuelCostAdjustment: number;
    electricityDuty: number;
    meterRent: number;
    otherCharges: number;
    totalBill: number;
    effectiveRate: number;
  };
  
  todAnalysis: {
    estimatedPeakUnits: number;
    estimatedNormalUnits: number;
    estimatedOffPeakUnits: number;
    peakPenaltyAmount: number;
    offPeakSavingsAmount: number;
    netTodImpact: number;
    loadShiftPotential: number;
    loadShiftSavings: number;
  };
  
  demandAnalysis: {
    contractedDemandKVA: number;
    recordedDemandKVA: number;
    utilizationPercent: number;
    demandChargePerMonth: number;
    overloadPenalty: number;
    recommendedCD: number;
    cdOptimizationSavings: number;
  };
  
  pfAnalysis: {
    currentPF: number;
    targetPF: number;
    currentPenaltyOrIncentive: number;
    capacitorKVARRequired: number;
    capacitorCost: number;
    annualSavingsFromPFCorrection: number;
    paybackMonths: number;
  };
  
  solarRooftopAnalysis: {
    recommendedSizeKW: number;
    roofAreaRequired: number;
    installationCost: number;
    acceleratedDepreciation: number;
    tnElectricityTaxExemption: number;
    greenIndustrySubsidy: number;
    netInvestment: number;
    annualGeneration: number;
    annualSavings: number;
    paybackYears: number;
    roi25Year: number;
    cappedByLoadSanction?: boolean;
  };
  
  openAccessAnalysis: {
    eligible: boolean;
    minimumCDRequired: number;
    currentGridCost: number;
    oaLandedCost: number;
    oaChargesBreakdown: {
      energyCost: number;
      transmissionCharge: number;
      wheelingCharge: number;
      crossSubsidySurcharge: number;
      additionalSurcharge: number;
      bankingCharge: number;
      sldcCharge: number;
      totalOACost: number;
    };
    savingsPerUnit: number;
    annualSavings: number;
    recommendedOACapacity: number;
  };
  
  bankingAnalysis: {
    monthlyGenerationKWH: number;
    monthlyConsumptionKWH: number;
    bankedUnitsKWH: number;
    bankingChargeKWH: number;
    unutilizedUnitsKWH: number;
    lossAt75Percent: number;
    annualBankingLoss: number;
    optimizationRecommendation: string;
  };
  
  cctsCompliance?: {
    obligatedSector: boolean;
    sectorName: string;
    currentEmissionIntensity: number;
    targetEmissionIntensity: number;
    complianceGap: number;
    cccsRequired: number;
    estimatedCCCCost: number;
    solarCCCsPotential: number;
  };
  
  cbamExposure?: {
    exportExposed: boolean;
    productCategory: string;
    embeddedEmissions: number;
    cbamCostPerTon: number;
    annualCBAMCost: number;
    renewableReduction: number;
  };
  
  savingsSummary: {
    immediate: {
      todLoadShift: number;
      pfCorrection: number;
      cdOptimization: number;
      tariffCorrection: number;
      total: number;
    };
    withSolarRooftop: {
      annualSavings: number;
      paybackYears: number;
      roi25Year: number;
    };
    withOpenAccess: {
      annualSavings: number;
      recommendedCapacity: number;
    };
    withGroupCaptive: {
      eligible: boolean;
      potentialSavings: number;
    };
    totalPotentialSavings: number;
  };
  
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    investment: number;
    savings: number;
    payback: number;
  }[];
  
  leadScore: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D';
    factors: {
      billSize: number;
      savingsPotential: number;
      roofAvailability: number;
      exportExposure: number;
      cctsObligation: number;
    };
    recommendedApproach: 'solar-epc' | 'open-access' | 'group-captive' | 'hybrid';
  };
}

export interface TANGEDCOTariffStructure {
  category: TariffCategory;
  energyChargePerKWH: number;
  demandChargePerKVA: number;
  peakHourSurchargePercent: number;
  offPeakRebatePercent: number;
  minimumCharge: number;
  fuelCostAdjustment: number;
  electricityDutyPercent: number;
}

export interface OpenAccessCharges {
  transmissionChargePerKWH: number;
  wheelingChargePerKWH: number;
  crossSubsidySurchargePerKWH: number;
  additionalSurchargePerKWH: number;
  bankingChargePercent: number;
  sldcChargePerKWH: number;
  schedulingChargePerKWH: number;
}

export interface IndustryParameters {
  industryType: IndustryType;
  typicalLoadFactor: number;
  peakLoadPercent: number;
  solarSuitability: 'excellent' | 'good' | 'moderate' | 'poor';
  cctsObligation: boolean;
  cbamExposure: boolean;
  typicalPF: number;
}
