// ============================================================
// TANGEDCO INDUSTRIAL BILL AUDIT CALCULATION ENGINE
// Tamil Nadu FY 2025-26 Tariffs | TNERC GEOA 2025 Compliant
// ============================================================

import type {
  TANGEDCOBillInput,
  TANGEDCOBillAuditReport,
  TANGEDCOTariffStructure,
  OpenAccessCharges,
  IndustryParameters,
  TariffCategory,
  IndustryType,
} from '../types/tangedco';

// ============================================================
// TANGEDCO FY 2025-26 TARIFF DATA
// Source: TNERC Tariff Order
// ============================================================

export const TANGEDCO_TARIFFS: Record<TariffCategory, TANGEDCOTariffStructure> = {
  'HT-I-A': {
    category: 'HT-I-A',
    energyChargePerKWH: 7.50,
    demandChargePerKVA: 608,
    peakHourSurchargePercent: 25,
    offPeakRebatePercent: 5,
    minimumCharge: 0,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'HT-I-B': {
    category: 'HT-I-B',
    energyChargePerKWH: 7.25,
    demandChargePerKVA: 608,
    peakHourSurchargePercent: 25,
    offPeakRebatePercent: 5,
    minimumCharge: 0,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'HT-II-A': {
    category: 'HT-II-A',
    energyChargePerKWH: 9.40,
    demandChargePerKVA: 608,
    peakHourSurchargePercent: 25,
    offPeakRebatePercent: 5,
    minimumCharge: 0,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'HT-II-B': {
    category: 'HT-II-B',
    energyChargePerKWH: 9.60,
    demandChargePerKVA: 608,
    peakHourSurchargePercent: 25,
    offPeakRebatePercent: 5,
    minimumCharge: 0,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'HT-III': {
    category: 'HT-III',
    energyChargePerKWH: 6.35,
    demandChargePerKVA: 400,
    peakHourSurchargePercent: 0,
    offPeakRebatePercent: 0,
    minimumCharge: 0,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'HT-IV': {
    category: 'HT-IV',
    energyChargePerKWH: 4.00,
    demandChargePerKVA: 250,
    peakHourSurchargePercent: 0,
    offPeakRebatePercent: 0,
    minimumCharge: 0,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'LT-III-A-1': {
    category: 'LT-III-A-1',
    energyChargePerKWH: 6.10,
    demandChargePerKVA: 0,
    peakHourSurchargePercent: 0,
    offPeakRebatePercent: 0,
    minimumCharge: 125,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'LT-III-A-2': {
    category: 'LT-III-A-2',
    energyChargePerKWH: 6.35,
    demandChargePerKVA: 0,
    peakHourSurchargePercent: 0,
    offPeakRebatePercent: 0,
    minimumCharge: 250,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'LT-III-B': {
    category: 'LT-III-B',
    energyChargePerKWH: 7.00,
    demandChargePerKVA: 0,
    peakHourSurchargePercent: 0,
    offPeakRebatePercent: 0,
    minimumCharge: 500,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'LT-IV-A': {
    category: 'LT-IV-A',
    energyChargePerKWH: 8.55,
    demandChargePerKVA: 0,
    peakHourSurchargePercent: 0,
    offPeakRebatePercent: 0,
    minimumCharge: 100,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
  'LT-IV-B': {
    category: 'LT-IV-B',
    energyChargePerKWH: 11.80,
    demandChargePerKVA: 0,
    peakHourSurchargePercent: 0,
    offPeakRebatePercent: 0,
    minimumCharge: 200,
    fuelCostAdjustment: 0.10,
    electricityDutyPercent: 5,
  },
};

// ============================================================
// OPEN ACCESS CHARGES (GEOA 2025)
// ============================================================

export const OPEN_ACCESS_CHARGES: OpenAccessCharges = {
  transmissionChargePerKWH: 0.42,
  wheelingChargePerKWH: 0.38,
  crossSubsidySurchargePerKWH: 1.85,
  additionalSurchargePerKWH: 0.54,
  bankingChargePercent: 8,
  sldcChargePerKWH: 0.02,
  schedulingChargePerKWH: 0.01,
};

export const OA_SOLAR_PPA_RATE = 3.50; // ₹/kWh typical PPA rate

// ============================================================
// INDUSTRY PARAMETERS
// ============================================================

export const INDUSTRY_PARAMS: Record<IndustryType, IndustryParameters> = {
  'spinning-mill': {
    industryType: 'spinning-mill',
    typicalLoadFactor: 0.85,
    peakLoadPercent: 35,
    solarSuitability: 'excellent',
    cctsObligation: true,
    cbamExposure: true,
    typicalPF: 0.88,
  },
  'dyeing': {
    industryType: 'dyeing',
    typicalLoadFactor: 0.75,
    peakLoadPercent: 40,
    solarSuitability: 'good',
    cctsObligation: true,
    cbamExposure: true,
    typicalPF: 0.85,
  },
  'auto-components': {
    industryType: 'auto-components',
    typicalLoadFactor: 0.70,
    peakLoadPercent: 45,
    solarSuitability: 'excellent',
    cctsObligation: false,
    cbamExposure: true,
    typicalPF: 0.90,
  },
  'foundry': {
    industryType: 'foundry',
    typicalLoadFactor: 0.65,
    peakLoadPercent: 50,
    solarSuitability: 'good',
    cctsObligation: true,
    cbamExposure: true,
    typicalPF: 0.82,
  },
  'pharma': {
    industryType: 'pharma',
    typicalLoadFactor: 0.60,
    peakLoadPercent: 30,
    solarSuitability: 'good',
    cctsObligation: false,
    cbamExposure: false,
    typicalPF: 0.92,
  },
  'food-processing': {
    industryType: 'food-processing',
    typicalLoadFactor: 0.55,
    peakLoadPercent: 35,
    solarSuitability: 'excellent',
    cctsObligation: false,
    cbamExposure: false,
    typicalPF: 0.88,
  },
  'cement': {
    industryType: 'cement',
    typicalLoadFactor: 0.80,
    peakLoadPercent: 40,
    solarSuitability: 'excellent',
    cctsObligation: true,
    cbamExposure: true,
    typicalPF: 0.90,
  },
  'chemical': {
    industryType: 'chemical',
    typicalLoadFactor: 0.75,
    peakLoadPercent: 35,
    solarSuitability: 'good',
    cctsObligation: true,
    cbamExposure: false,
    typicalPF: 0.88,
  },
  'engineering': {
    industryType: 'engineering',
    typicalLoadFactor: 0.65,
    peakLoadPercent: 45,
    solarSuitability: 'excellent',
    cctsObligation: false,
    cbamExposure: true,
    typicalPF: 0.88,
  },
  'other': {
    industryType: 'other',
    typicalLoadFactor: 0.60,
    peakLoadPercent: 40,
    solarSuitability: 'good',
    cctsObligation: false,
    cbamExposure: false,
    typicalPF: 0.88,
  },
};

// ============================================================
// TN SOLAR CONSTANTS
// ============================================================

const TN_PEAK_SUN_HOURS = 5.5;
const TN_CUF = 0.19;
const SOLAR_COST_PER_KW = 45000;
const PANEL_WATTAGE = 545;
const SQFT_PER_KW = 100;
const CO2_FACTOR = 0.82; // kg CO2 per kWh (India grid)
const ELECTRICITY_ESCALATION = 1.05;

// ============================================================
// TN DISTRICTS
// ============================================================

export const TN_INDUSTRIAL_DISTRICTS = [
  'Chennai',
  'Coimbatore',
  'Tiruppur',
  'Erode',
  'Salem',
  'Madurai',
  'Tiruchirappalli',
  'Vellore',
  'Kancheepuram',
  'Chengalpattu',
  'Krishnagiri',
  'Hosur',
  'Thoothukudi',
  'Virudhunagar',
  'Karur',
  'Namakkal',
  'Ariyalur',
  'Dindigul',
  'Sivakasi',
  'Cuddalore',
];

// ============================================================
// MAIN CALCULATION FUNCTION
// ============================================================

export function calculateTANGEDCOBillAudit(input: TANGEDCOBillInput): TANGEDCOBillAuditReport {
  const tariff = TANGEDCO_TARIFFS[input.tariffCategory];
  const industryParams = INDUSTRY_PARAMS[input.industryType];
  const isHT = input.tariffCategory.startsWith('HT');
  
  const currentBill = calculateCurrentBill(input, tariff, isHT);
  const todAnalysis = calculateToDAnalysis(input, tariff, industryParams);
  const demandAnalysis = calculateDemandAnalysis(input, tariff, isHT);
  const pfAnalysis = calculatePFAnalysis(input, currentBill);
  const solarRooftopAnalysis = calculateSolarRooftopAnalysis(input, currentBill);
  const openAccessAnalysis = calculateOpenAccessAnalysis(input, currentBill, isHT);
  const bankingAnalysis = calculateBankingAnalysis(input, solarRooftopAnalysis);
  
  const cctsCompliance = industryParams.cctsObligation 
    ? calculateCCTSCompliance(input)
    : undefined;
  
  const cbamExposure = (industryParams.cbamExposure && input.exportToEU)
    ? calculateCBAMExposure(input)
    : undefined;
  
  const savingsSummary = calculateSavingsSummary(
    todAnalysis, pfAnalysis, demandAnalysis, solarRooftopAnalysis, openAccessAnalysis, input
  );
  
  const recommendations = generateRecommendations(
    todAnalysis, pfAnalysis, demandAnalysis, solarRooftopAnalysis, openAccessAnalysis
  );
  
  const leadScore = calculateLeadScore(
    input, currentBill, savingsSummary, industryParams
  );
  
  return {
    inputSummary: input,
    currentBill,
    todAnalysis,
    demandAnalysis,
    pfAnalysis,
    solarRooftopAnalysis,
    openAccessAnalysis,
    bankingAnalysis,
    cctsCompliance,
    cbamExposure,
    savingsSummary,
    recommendations,
    leadScore,
  };
}

// ============================================================
// CALCULATION HELPERS
// ============================================================

function calculateCurrentBill(
  input: TANGEDCOBillInput,
  tariff: TANGEDCOTariffStructure,
  isHT: boolean
) {
  let energyCharge = input.totalUnitsKWH * tariff.energyChargePerKWH;
  
  const billedDemand = Math.max(input.recordedDemandKVA, input.contractedDemandKVA * 0.9);
  const demandCharge = isHT ? billedDemand * tariff.demandChargePerKVA : 0;
  
  let todPeakSurcharge = 0;
  let todOffPeakRebate = 0;
  
  if (isHT && tariff.peakHourSurchargePercent > 0) {
    const peakUnits = input.peakUnitsKWH ?? input.totalUnitsKWH * 0.35;
    const offPeakUnits = input.offPeakUnitsKWH ?? input.totalUnitsKWH * 0.25;
    
    todPeakSurcharge = peakUnits * tariff.energyChargePerKWH * (tariff.peakHourSurchargePercent / 100);
    todOffPeakRebate = offPeakUnits * tariff.energyChargePerKWH * (tariff.offPeakRebatePercent / 100);
  }
  
  let powerFactorPenalty = 0;
  let powerFactorIncentive = 0;
  
  if (isHT) {
    if (input.powerFactor < 0.90) {
      const pfShortfall = Math.round((0.90 - input.powerFactor) * 100);
      powerFactorPenalty = energyCharge * pfShortfall * 0.01;
    } else if (input.powerFactor > 0.95) {
      const pfExcess = Math.round((input.powerFactor - 0.95) * 100);
      powerFactorIncentive = energyCharge * pfExcess * 0.005;
    }
  }
  
  const fuelCostAdjustment = input.totalUnitsKWH * tariff.fuelCostAdjustment;
  const subtotal = energyCharge + demandCharge + todPeakSurcharge - todOffPeakRebate + 
                   powerFactorPenalty - powerFactorIncentive + fuelCostAdjustment;
  const electricityDuty = subtotal * (tariff.electricityDutyPercent / 100);
  const meterRent = isHT ? 500 : 50;
  const otherCharges = 200;
  
  const totalBill = subtotal + electricityDuty + meterRent + otherCharges;
  const effectiveRate = totalBill / input.totalUnitsKWH;
  
  return {
    energyCharge: Math.round(energyCharge),
    demandCharge: Math.round(demandCharge),
    todPeakSurcharge: Math.round(todPeakSurcharge),
    todOffPeakRebate: Math.round(todOffPeakRebate),
    powerFactorPenalty: Math.round(powerFactorPenalty),
    powerFactorIncentive: Math.round(powerFactorIncentive),
    fuelCostAdjustment: Math.round(fuelCostAdjustment),
    electricityDuty: Math.round(electricityDuty),
    meterRent,
    otherCharges,
    totalBill: Math.round(totalBill),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  };
}

function calculateToDAnalysis(
  input: TANGEDCOBillInput,
  tariff: TANGEDCOTariffStructure,
  industryParams: IndustryParameters
) {
  const peakPercent = industryParams.peakLoadPercent / 100;
  const offPeakPercent = 0.25;
  const normalPercent = 1 - peakPercent - offPeakPercent;
  
  const estimatedPeakUnits = input.peakUnitsKWH ?? Math.round(input.totalUnitsKWH * peakPercent);
  const estimatedOffPeakUnits = input.offPeakUnitsKWH ?? Math.round(input.totalUnitsKWH * offPeakPercent);
  const estimatedNormalUnits = input.totalUnitsKWH - estimatedPeakUnits - estimatedOffPeakUnits;
  
  const peakPenaltyAmount = estimatedPeakUnits * tariff.energyChargePerKWH * 
                            (tariff.peakHourSurchargePercent / 100);
  const offPeakSavingsAmount = estimatedOffPeakUnits * tariff.energyChargePerKWH * 
                               (tariff.offPeakRebatePercent / 100);
  const netTodImpact = peakPenaltyAmount - offPeakSavingsAmount;
  
  const loadShiftPotential = Math.round(peakPercent * 40);
  const shiftableUnits = estimatedPeakUnits * 0.40;
  const loadShiftSavings = shiftableUnits * tariff.energyChargePerKWH * 
                           (tariff.peakHourSurchargePercent / 100) * 12;
  
  return {
    estimatedPeakUnits: Math.round(estimatedPeakUnits),
    estimatedNormalUnits: Math.round(estimatedNormalUnits),
    estimatedOffPeakUnits: Math.round(estimatedOffPeakUnits),
    peakPenaltyAmount: Math.round(peakPenaltyAmount),
    offPeakSavingsAmount: Math.round(offPeakSavingsAmount),
    netTodImpact: Math.round(netTodImpact),
    loadShiftPotential,
    loadShiftSavings: Math.round(loadShiftSavings),
  };
}

function calculateDemandAnalysis(
  input: TANGEDCOBillInput,
  tariff: TANGEDCOTariffStructure,
  isHT: boolean
) {
  const utilizationPercent = (input.recordedDemandKVA / input.contractedDemandKVA) * 100;
  const demandChargePerMonth = isHT ? input.contractedDemandKVA * tariff.demandChargePerKVA : 0;
  
  let overloadPenalty = 0;
  if (input.recordedDemandKVA > input.contractedDemandKVA) {
    const excessDemand = input.recordedDemandKVA - input.contractedDemandKVA;
    overloadPenalty = excessDemand * tariff.demandChargePerKVA * 2;
  }
  
  const recommendedCD = Math.ceil(input.recordedDemandKVA * 1.1 / 50) * 50;
  const cdDifference = input.contractedDemandKVA - recommendedCD;
  const cdOptimizationSavings = cdDifference > 0 ? cdDifference * tariff.demandChargePerKVA * 12 : 0;
  
  return {
    contractedDemandKVA: input.contractedDemandKVA,
    recordedDemandKVA: input.recordedDemandKVA,
    utilizationPercent: Math.round(utilizationPercent),
    demandChargePerMonth: Math.round(demandChargePerMonth),
    overloadPenalty: Math.round(overloadPenalty),
    recommendedCD,
    cdOptimizationSavings: Math.round(cdOptimizationSavings),
  };
}

function calculatePFAnalysis(
  input: TANGEDCOBillInput,
  currentBill: TANGEDCOBillAuditReport['currentBill']
) {
  const currentPF = input.powerFactor;
  const targetPF = 0.98;
  
  let currentPenaltyOrIncentive = 0;
  if (currentPF < 0.90) {
    currentPenaltyOrIncentive = currentBill.powerFactorPenalty;
  } else if (currentPF > 0.95) {
    currentPenaltyOrIncentive = -currentBill.powerFactorIncentive;
  }
  
  const kW = input.recordedDemandKVA * currentPF;
  const currentKVAR = Math.sqrt(Math.pow(input.recordedDemandKVA, 2) - Math.pow(kW, 2));
  const targetKVA = kW / targetPF;
  const targetKVAR = Math.sqrt(Math.pow(targetKVA, 2) - Math.pow(kW, 2));
  const capacitorKVARRequired = Math.round(currentKVAR - targetKVAR);
  
  const capacitorCost = capacitorKVARRequired * 800;
  
  let annualSavingsFromPFCorrection = 0;
  if (currentPF < 0.90) {
    annualSavingsFromPFCorrection = currentBill.powerFactorPenalty * 12;
  }
  if (targetPF > 0.95) {
    const incentiveRate = Math.round((targetPF - 0.95) * 100);
    annualSavingsFromPFCorrection += currentBill.energyCharge * incentiveRate * 0.005 * 12;
  }
  
  const paybackMonths = capacitorCost / (annualSavingsFromPFCorrection / 12);
  
  return {
    currentPF,
    targetPF,
    currentPenaltyOrIncentive: Math.round(currentPenaltyOrIncentive),
    capacitorKVARRequired: Math.max(0, capacitorKVARRequired),
    capacitorCost: Math.round(capacitorCost),
    annualSavingsFromPFCorrection: Math.round(annualSavingsFromPFCorrection),
    paybackMonths: Math.round(paybackMonths * 10) / 10,
  };
}

function calculateSolarRooftopAnalysis(
  input: TANGEDCOBillInput,
  currentBill: TANGEDCOBillAuditReport['currentBill']
) {
  const annualConsumption = input.totalUnitsKWH * 12;
  const targetSolarPercent = 0.50;
  const targetAnnualGeneration = annualConsumption * targetSolarPercent;
  const calculatedSizeKW = targetAnnualGeneration / (TN_PEAK_SUN_HOURS * 365 * 0.85);
  const cappedByLoadSanction = !!(input.loadSanction && input.loadSanction > 0 && calculatedSizeKW > input.loadSanction);
  const recommendedSizeKW = cappedByLoadSanction ? input.loadSanction! : calculatedSizeKW;
  const roofAreaRequired = recommendedSizeKW * SQFT_PER_KW;
  
  const installationCost = recommendedSizeKW * SOLAR_COST_PER_KW;
  const acceleratedDepreciation = installationCost * 0.40 * 0.30;
  const tnElectricityTaxExemption = currentBill.electricityDuty * 12 * 5;
  const greenIndustrySubsidy = installationCost * 0.25;
  const netInvestment = installationCost - acceleratedDepreciation - greenIndustrySubsidy;
  
  const annualGeneration = recommendedSizeKW * TN_PEAK_SUN_HOURS * 365 * 0.85;
  const annualSavings = annualGeneration * currentBill.effectiveRate;
  
  let savings25Year = 0;
  for (let year = 1; year <= 25; year++) {
    savings25Year += annualSavings * Math.pow(ELECTRICITY_ESCALATION, year - 1);
  }
  
  const paybackYears = netInvestment / annualSavings;
  const roi25Year = ((savings25Year - netInvestment) / netInvestment) * 100;
  
  return {
    recommendedSizeKW: Math.round(recommendedSizeKW),
    roofAreaRequired: Math.round(roofAreaRequired),
    installationCost: Math.round(installationCost),
    acceleratedDepreciation: Math.round(acceleratedDepreciation),
    tnElectricityTaxExemption: Math.round(tnElectricityTaxExemption),
    greenIndustrySubsidy: Math.round(greenIndustrySubsidy),
    netInvestment: Math.round(netInvestment),
    annualGeneration: Math.round(annualGeneration),
    annualSavings: Math.round(annualSavings),
    paybackYears: Math.round(paybackYears * 10) / 10,
    roi25Year: Math.round(roi25Year),
    cappedByLoadSanction,
  };
}

function calculateOpenAccessAnalysis(
  input: TANGEDCOBillInput,
  currentBill: TANGEDCOBillAuditReport['currentBill'],
  isHT: boolean
) {
  const eligible = isHT && input.contractedDemandKVA >= 63;
  const minimumCDRequired = 63;
  const currentGridCost = currentBill.effectiveRate;
  
  const oaCharges = OPEN_ACCESS_CHARGES;
  const energyCost = OA_SOLAR_PPA_RATE;
  const transmissionCharge = oaCharges.transmissionChargePerKWH;
  const wheelingCharge = oaCharges.wheelingChargePerKWH;
  const crossSubsidySurcharge = oaCharges.crossSubsidySurchargePerKWH;
  const additionalSurcharge = oaCharges.additionalSurchargePerKWH;
  const bankingCharge = energyCost * (oaCharges.bankingChargePercent / 100);
  const sldcCharge = oaCharges.sldcChargePerKWH + oaCharges.schedulingChargePerKWH;
  
  const totalOACost = energyCost + transmissionCharge + wheelingCharge + 
                      crossSubsidySurcharge + additionalSurcharge + bankingCharge + sldcCharge;
  
  const savingsPerUnit = currentGridCost - totalOACost;
  const recommendedOACapacity = input.contractedDemandKVA * 0.70;
  const annualOAUnits = recommendedOACapacity * TN_PEAK_SUN_HOURS * 365 * 0.80;
  const annualSavings = annualOAUnits * savingsPerUnit;
  
  return {
    eligible,
    minimumCDRequired,
    currentGridCost: Math.round(currentGridCost * 100) / 100,
    oaLandedCost: Math.round(totalOACost * 100) / 100,
    oaChargesBreakdown: {
      energyCost: Math.round(energyCost * 100) / 100,
      transmissionCharge: Math.round(transmissionCharge * 100) / 100,
      wheelingCharge: Math.round(wheelingCharge * 100) / 100,
      crossSubsidySurcharge: Math.round(crossSubsidySurcharge * 100) / 100,
      additionalSurcharge: Math.round(additionalSurcharge * 100) / 100,
      bankingCharge: Math.round(bankingCharge * 100) / 100,
      sldcCharge: Math.round(sldcCharge * 100) / 100,
      totalOACost: Math.round(totalOACost * 100) / 100,
    },
    savingsPerUnit: Math.round(savingsPerUnit * 100) / 100,
    annualSavings: Math.round(annualSavings),
    recommendedOACapacity: Math.round(recommendedOACapacity),
  };
}

function calculateBankingAnalysis(
  input: TANGEDCOBillInput,
  solarAnalysis: TANGEDCOBillAuditReport['solarRooftopAnalysis']
) {
  const monthlyGeneration = solarAnalysis.annualGeneration / 12;
  const monthlyConsumption = input.totalUnitsKWH;
  
  const excessGeneration = Math.max(0, monthlyGeneration - monthlyConsumption * 0.60);
  const bankedUnitsKWH = excessGeneration;
  const bankingChargeKWH = bankedUnitsKWH * 0.08;
  const unutilizedUnitsKWH = bankedUnitsKWH * 0.15;
  const lossAt75Percent = unutilizedUnitsKWH * 0.25;
  const annualBankingLoss = (bankingChargeKWH + lossAt75Percent) * 
                            TANGEDCO_TARIFFS[input.tariffCategory].energyChargePerKWH * 12;
  
  let optimizationRecommendation = '';
  if (annualBankingLoss > 100000) {
    optimizationRecommendation = 'High banking losses detected. Consider real-time monitoring + demand-side management to maximize self-consumption.';
  } else if (annualBankingLoss > 50000) {
    optimizationRecommendation = 'Moderate banking losses. Load scheduling during solar hours will help.';
  } else {
    optimizationRecommendation = 'Banking losses are minimal. Good generation-consumption match.';
  }
  
  return {
    monthlyGenerationKWH: Math.round(monthlyGeneration),
    monthlyConsumptionKWH: monthlyConsumption,
    bankedUnitsKWH: Math.round(bankedUnitsKWH),
    bankingChargeKWH: Math.round(bankingChargeKWH),
    unutilizedUnitsKWH: Math.round(unutilizedUnitsKWH),
    lossAt75Percent: Math.round(lossAt75Percent),
    annualBankingLoss: Math.round(annualBankingLoss),
    optimizationRecommendation,
  };
}

function calculateCCTSCompliance(input: TANGEDCOBillInput) {
  const sectorTargets: Record<string, { current: number; target: number }> = {
    'spinning-mill': { current: 0.65, target: 0.58 },
    'dyeing': { current: 0.85, target: 0.75 },
    'cement': { current: 0.75, target: 0.68 },
    'chemical': { current: 0.55, target: 0.50 },
    'foundry': { current: 0.95, target: 0.85 },
  };
  
  const sector = sectorTargets[input.industryType];
  if (!sector) return undefined;
  
  const annualConsumption = input.totalUnitsKWH * 12;
  const currentEmissions = annualConsumption * CO2_FACTOR / 1000;
  
  const complianceGap = sector.current - sector.target;
  const emissionsToReduce = currentEmissions * (complianceGap / sector.current);
  
  const cccsRequired = emissionsToReduce;
  const estimatedCCCCost = cccsRequired * 1000;
  const solarCCCsPotential = (annualConsumption * 0.70 * CO2_FACTOR / 1000);
  
  return {
    obligatedSector: true,
    sectorName: input.industryType.replace('-', ' ').toUpperCase(),
    currentEmissionIntensity: sector.current,
    targetEmissionIntensity: sector.target,
    complianceGap: Math.round(complianceGap * 100) / 100,
    cccsRequired: Math.round(cccsRequired),
    estimatedCCCCost: Math.round(estimatedCCCCost),
    solarCCCsPotential: Math.round(solarCCCsPotential),
  };
}

function calculateCBAMExposure(input: TANGEDCOBillInput) {
  const annualConsumption = input.totalUnitsKWH * 12;
  const embeddedEmissions = annualConsumption * CO2_FACTOR / 1000;
  
  const exportPortion = (input.exportPercentage || 30) / 100;
  const exportEmissions = embeddedEmissions * exportPortion;
  
  const cbamCostPerTon = 7000;
  const annualCBAMCost = exportEmissions * cbamCostPerTon;
  const renewableReduction = annualCBAMCost * 0.80;
  
  return {
    exportExposed: true,
    productCategory: input.industryType.replace('-', ' ').toUpperCase(),
    embeddedEmissions: Math.round(embeddedEmissions),
    cbamCostPerTon,
    annualCBAMCost: Math.round(annualCBAMCost),
    renewableReduction: Math.round(renewableReduction),
  };
}

function calculateSavingsSummary(
  todAnalysis: TANGEDCOBillAuditReport['todAnalysis'],
  pfAnalysis: TANGEDCOBillAuditReport['pfAnalysis'],
  demandAnalysis: TANGEDCOBillAuditReport['demandAnalysis'],
  solarAnalysis: TANGEDCOBillAuditReport['solarRooftopAnalysis'],
  oaAnalysis: TANGEDCOBillAuditReport['openAccessAnalysis'],
  input: TANGEDCOBillInput
) {
  const immediate = {
    todLoadShift: todAnalysis.loadShiftSavings,
    pfCorrection: pfAnalysis.annualSavingsFromPFCorrection,
    cdOptimization: demandAnalysis.cdOptimizationSavings,
    tariffCorrection: 0,
    total: todAnalysis.loadShiftSavings + pfAnalysis.annualSavingsFromPFCorrection + demandAnalysis.cdOptimizationSavings,
  };
  
  const withSolarRooftop = {
    annualSavings: solarAnalysis.annualSavings,
    paybackYears: solarAnalysis.paybackYears,
    roi25Year: solarAnalysis.roi25Year,
  };
  
  const withOpenAccess = {
    annualSavings: oaAnalysis.annualSavings,
    recommendedCapacity: oaAnalysis.recommendedOACapacity,
  };
  
  const withGroupCaptive = {
    eligible: input.contractedDemandKVA < 500 && input.contractedDemandKVA >= 63,
    potentialSavings: oaAnalysis.annualSavings * 0.80,
  };
  
  const totalPotentialSavings = immediate.total + Math.max(withSolarRooftop.annualSavings, withOpenAccess.annualSavings);
  
  return {
    immediate,
    withSolarRooftop,
    withOpenAccess,
    withGroupCaptive,
    totalPotentialSavings: Math.round(totalPotentialSavings),
  };
}

function generateRecommendations(
  todAnalysis: TANGEDCOBillAuditReport['todAnalysis'],
  pfAnalysis: TANGEDCOBillAuditReport['pfAnalysis'],
  demandAnalysis: TANGEDCOBillAuditReport['demandAnalysis'],
  solarAnalysis: TANGEDCOBillAuditReport['solarRooftopAnalysis'],
  oaAnalysis: TANGEDCOBillAuditReport['openAccessAnalysis']
): TANGEDCOBillAuditReport['recommendations'] {
  const recommendations: TANGEDCOBillAuditReport['recommendations'] = [];
  
  if (todAnalysis.loadShiftSavings > 50000) {
    recommendations.push({
      priority: 'high',
      action: `Shift ${todAnalysis.loadShiftPotential}% of peak load to off-peak hours (10 PM - 5 AM)`,
      investment: 0,
      savings: todAnalysis.loadShiftSavings,
      payback: 0,
    });
  }
  
  if (pfAnalysis.annualSavingsFromPFCorrection > 20000) {
    recommendations.push({
      priority: 'high',
      action: `Install ${pfAnalysis.capacitorKVARRequired} KVAR capacitor bank to improve PF from ${pfAnalysis.currentPF} to ${pfAnalysis.targetPF}`,
      investment: pfAnalysis.capacitorCost,
      savings: pfAnalysis.annualSavingsFromPFCorrection,
      payback: pfAnalysis.paybackMonths / 12,
    });
  }
  
  if (demandAnalysis.cdOptimizationSavings > 30000) {
    recommendations.push({
      priority: 'medium',
      action: `Reduce contracted demand from ${demandAnalysis.contractedDemandKVA} kVA to ${demandAnalysis.recommendedCD} kVA`,
      investment: 5000,
      savings: demandAnalysis.cdOptimizationSavings,
      payback: 0.1,
    });
  }
  
  if (solarAnalysis.annualSavings > 100000) {
    recommendations.push({
      priority: 'high',
      action: `Install ${solarAnalysis.recommendedSizeKW} kW rooftop solar with accelerated depreciation benefit`,
      investment: solarAnalysis.netInvestment,
      savings: solarAnalysis.annualSavings,
      payback: solarAnalysis.paybackYears,
    });
  }
  
  if (oaAnalysis.eligible && oaAnalysis.savingsPerUnit > 1) {
    recommendations.push({
      priority: 'high',
      action: `Procure ${oaAnalysis.recommendedOACapacity} kW through Open Access at ₹${oaAnalysis.oaLandedCost}/kWh landed cost`,
      investment: 100000,
      savings: oaAnalysis.annualSavings,
      payback: 0.2,
    });
  }
  
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.savings - a.savings;
  });
  
  return recommendations;
}

function calculateLeadScore(
  input: TANGEDCOBillInput,
  currentBill: TANGEDCOBillAuditReport['currentBill'],
  savingsSummary: TANGEDCOBillAuditReport['savingsSummary'],
  industryParams: IndustryParameters
) {
  const billSize = Math.min(20, (currentBill.totalBill / 500000) * 20);
  const savingsPotential = Math.min(20, (savingsSummary.totalPotentialSavings / 1000000) * 20);
  const roofAvailability = industryParams.solarSuitability === 'excellent' ? 20 : 
                           industryParams.solarSuitability === 'good' ? 15 : 10;
  const exportExposure = (industryParams.cbamExposure && input.exportToEU) ? 20 : 
                         industryParams.cbamExposure ? 10 : 0;
  const cctsObligation = industryParams.cctsObligation ? 20 : 0;
  
  const score = billSize + savingsPotential + roofAvailability + exportExposure + cctsObligation;
  
  let grade: 'A' | 'B' | 'C' | 'D';
  if (score >= 80) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 40) grade = 'C';
  else grade = 'D';
  
  let recommendedApproach: 'solar-epc' | 'open-access' | 'group-captive' | 'hybrid';
  if (input.contractedDemandKVA >= 1000 && savingsSummary.withOpenAccess.annualSavings > savingsSummary.withSolarRooftop.annualSavings) {
    recommendedApproach = 'open-access';
  } else if (input.contractedDemandKVA < 500 && input.contractedDemandKVA >= 63) {
    recommendedApproach = 'group-captive';
  } else if (savingsSummary.withSolarRooftop.annualSavings > 200000) {
    recommendedApproach = 'hybrid';
  } else {
    recommendedApproach = 'solar-epc';
  }
  
  return {
    score: Math.round(score),
    grade,
    factors: {
      billSize: Math.round(billSize),
      savingsPotential: Math.round(savingsPotential),
      roofAvailability: Math.round(roofAvailability),
      exportExposure: Math.round(exportExposure),
      cctsObligation: Math.round(cctsObligation),
    },
    recommendedApproach,
  };
}
