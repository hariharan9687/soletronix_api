import { useState } from 'react';
import {
  Zap, Factory, ArrowRight, ArrowLeft, MapPin,
  Gauge, TrendingUp, AlertTriangle, CheckCircle2,
  Sun, Battery, Leaf, IndianRupee, FileText,
  Clock, Building2, Target, Award, BarChart3,
  Calculator, Download, Loader2,
} from 'lucide-react';
import { generateTANGEDCOReportPDF } from '../utils/generateReportPDF';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { cn } from '../utils/cn';
import type { TANGEDCOBillInput, TANGEDCOBillAuditReport } from '../types/tangedco';
import {
  calculateTANGEDCOBillAudit,
  TN_INDUSTRIAL_DISTRICTS,
} from '../services/tangedcoCalculations';
import { saveTANGEDCOAudit, saveLeadFromTANGEDCOAudit } from '../services/database';
import { PreCalculationForm } from './PreCalculationForm';

const TARIFF_CATEGORIES = [
  { value: 'HT-I-A', label: 'HT-I-A: Industrial General', rate: '₹7.50/kWh' },
  { value: 'HT-I-B', label: 'HT-I-B: Power Intensive', rate: '₹7.25/kWh' },
  { value: 'HT-II-A', label: 'HT-II-A: Commercial', rate: '₹9.40/kWh' },
  { value: 'HT-II-B', label: 'HT-II-B: Commercial AC', rate: '₹9.60/kWh' },
  { value: 'LT-III-A-1', label: 'LT-III-A-1: Small Industry', rate: '₹6.10/kWh' },
  { value: 'LT-III-A-2', label: 'LT-III-A-2: Medium Industry', rate: '₹6.35/kWh' },
  { value: 'LT-III-B', label: 'LT-III-B: Large Industry', rate: '₹7.00/kWh' },
];

const INDUSTRY_TYPES = [
  { value: 'spinning-mill', label: 'Spinning Mill / Textiles', icon: '🧵' },
  { value: 'dyeing', label: 'Dyeing & Processing', icon: '🎨' },
  { value: 'auto-components', label: 'Auto Components', icon: '⚙️' },
  { value: 'foundry', label: 'Foundry / Metal Works', icon: '🔥' },
  { value: 'pharma', label: 'Pharma / Chemical', icon: '💊' },
  { value: 'food-processing', label: 'Food Processing', icon: '🏭' },
  { value: 'cement', label: 'Cement / Building Materials', icon: '🏗️' },
  { value: 'engineering', label: 'Engineering / Fabrication', icon: '🔧' },
  { value: 'other', label: 'Other Manufacturing', icon: '🏢' },
];

const SHIFT_PATTERNS = [
  { value: '1-shift', label: '1 Shift (8 hrs)', hours: 8 },
  { value: '2-shift', label: '2 Shifts (16 hrs)', hours: 16 },
  { value: '3-shift', label: '3 Shifts (24 hrs)', hours: 24 },
  { value: 'continuous', label: 'Continuous (24x7)', hours: 24 },
];

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444'];

interface Props {
  onLeadCapture?: (input: TANGEDCOBillInput, report: TANGEDCOBillAuditReport) => void;
}

interface UserContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  designation: string;
  city: string;
  whatsappConsent: boolean;
}

export function TANGEDCOBillAudit({ onLeadCapture }: Props) {
  const [step, setStep] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<TANGEDCOBillAuditReport | null>(null);
  const [step1Error, setStep1Error] = useState('');
  const [userContact, setUserContact] = useState<UserContact | null>(null);

  const [input, setInput] = useState<TANGEDCOBillInput>({
    consumerNumber: '',
    tariffCategory: 'HT-I-A',
    billingMonth: new Date().toISOString().slice(0, 7),
    contractedDemandKVA: 500,
    recordedDemandKVA: 400,
    connectedLoadHP: 0,
    loadSanction: 0,
    totalUnitsKWH: 50000,
    powerFactor: 0.90,
    industryType: 'spinning-mill',
    operatingHoursPerDay: 24,
    operatingDaysPerMonth: 26,
    shiftPattern: 'continuous',
    district: 'Coimbatore',
    sipcotSidco: 'SIPCOT',
    exportToEU: false,
    exportPercentage: 30,
  });

  const updateField = <K extends keyof TANGEDCOBillInput>(key: K, value: TANGEDCOBillInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    const result = calculateTANGEDCOBillAudit(input);
    setReport(result);
    setShowReport(true);
  };

  const fmtMoney = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const fmtNum = (n: number) => n.toLocaleString('en-IN');

  if (showReport && report) {
    return (
      <TANGEDCOReportView
        report={report}
        input={input}
        onBack={() => setShowReport(false)}
        onLeadCapture={onLeadCapture}
      />
    );
  }

  const handleUserContactSubmit = (data: UserContact) => {
    setUserContact(data);
    handleCalculate();
  };

  const handleSaveToDatabase = async (contactData: UserContact) => {
    const reportResult = calculateTANGEDCOBillAudit(input);
    const inputRecord = input as unknown as Record<string, unknown>;
    const reportRecord = reportResult as unknown as Record<string, unknown>;

    const [auditResult] = await Promise.all([
      saveTANGEDCOAudit({ contactData, inputData: inputRecord, reportData: reportRecord }),
      saveLeadFromTANGEDCOAudit(contactData, inputRecord, reportRecord),
    ]);

    if (!auditResult.success) {
      throw new Error(auditResult.error || 'Failed to save to database');
    }
  };

  const steps = [
    // Step 0: Industry Type & Location
    <div key="industry" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Industry Details</h2>
        <p className="mt-2 text-slate-500">Select your industry type and location</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {INDUSTRY_TYPES.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => updateField('industryType', value as TANGEDCOBillInput['industryType'])}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
              input.industryType === value
                ? 'border-green-500 bg-green-50 shadow-lg'
                : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'
            )}
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-center text-sm font-medium text-slate-700">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">District</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={input.district}
              onChange={(e) => updateField('district', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              {TN_INDUSTRIAL_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Industrial Estate</label>
          <select
            value={input.sipcotSidco || ''}
            onChange={(e) => updateField('sipcotSidco', e.target.value as TANGEDCOBillInput['sipcotSidco'])}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            <option value="SIPCOT">SIPCOT</option>
            <option value="SIDCO">SIDCO</option>
            <option value="Private">Private Industrial Area</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </div>,

    // Step 1: Tariff & Load Details
    <div key="tariff" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">TANGEDCO Connection Details</h2>
        <p className="mt-2 text-slate-500">Enter your tariff category and load details</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tariff Category</label>
        <div className="space-y-2">
          {TARIFF_CATEGORIES.map(({ value, label, rate }) => (
            <button
              key={value}
              onClick={() => updateField('tariffCategory', value as TANGEDCOBillInput['tariffCategory'])}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all',
                input.tariffCategory === value
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 hover:border-green-300'
              )}
            >
              <span className="font-medium text-slate-700">{label}</span>
              <span className="text-sm text-green-600">{rate}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Contracted Demand (kVA)
          </label>
          <div className="relative">
            <Gauge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              value={input.contractedDemandKVA}
              onChange={(e) => updateField('contractedDemandKVA', Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              min={0}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Recorded Max Demand (kVA)
          </label>
          <input
            type="number"
            value={input.recordedDemandKVA}
            onChange={(e) => updateField('recordedDemandKVA', Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            min={0}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          Load Sanction (kW)
          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">Required</span>
        </label>
        <div className="relative">
          <Zap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="number"
            value={input.loadSanction || ''}
            onChange={(e) => { updateField('loadSanction', Number(e.target.value)); setStep1Error(''); }}
            placeholder="e.g. 500"
            className={cn(
              'w-full rounded-xl border py-3 pl-10 pr-4 text-slate-900 shadow-sm focus:outline-none focus:ring-2',
              step1Error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 focus:border-green-500 focus:ring-green-200'
            )}
            min={1}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          As per TANGEDCO sanction letter — recommended solar system will not exceed this limit.
        </p>
        {step1Error && <p className="mt-1.5 text-sm text-red-600">{step1Error}</p>}
      </div>
    </div>,

    // Step 2: Consumption & Power Factor
    <div key="consumption" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Monthly Consumption</h2>
        <p className="mt-2 text-slate-500">Enter your energy consumption and power factor</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Total Units Consumed (kWh/month)
        </label>
        <div className="relative">
          <Zap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="number"
            value={input.totalUnitsKWH}
            onChange={(e) => updateField('totalUnitsKWH', Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            min={0}
          />
        </div>
        <input
          type="range"
          min={1000}
          max={500000}
          step={1000}
          value={input.totalUnitsKWH}
          onChange={(e) => updateField('totalUnitsKWH', Number(e.target.value))}
          className="mt-2 w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>1,000 kWh</span>
          <span>5,00,000 kWh</span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Power Factor (0.70 - 1.00)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0.70}
            max={1.00}
            step={0.01}
            value={input.powerFactor}
            onChange={(e) => updateField('powerFactor', Number(e.target.value))}
            className="flex-1 accent-green-500"
          />
          <span className={cn(
            'w-16 rounded-lg px-3 py-2 text-center text-lg font-bold',
            input.powerFactor < 0.90 ? 'bg-red-100 text-red-700' :
            input.powerFactor > 0.95 ? 'bg-green-100 text-green-700' :
            'bg-amber-100 text-amber-700'
          )}>
            {input.powerFactor.toFixed(2)}
          </span>
        </div>
        {input.powerFactor < 0.90 && (
          <p className="mt-2 text-sm text-red-600">
            ⚠️ PF below 0.90 incurs penalty charges!
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Shift Pattern</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHIFT_PATTERNS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateField('shiftPattern', value as TANGEDCOBillInput['shiftPattern'])}
              className={cn(
                'rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all',
                input.shiftPattern === value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-600 hover:border-green-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 3: Export & Compliance
    <div key="export" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Export & Compliance</h2>
        <p className="mt-2 text-slate-500">For CBAM and CCTS compliance assessment</p>
      </div>

      <button
        onClick={() => updateField('exportToEU', !input.exportToEU)}
        className={cn(
          'flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all',
          input.exportToEU
            ? 'border-green-500 bg-green-50'
            : 'border-slate-200 hover:border-green-300'
        )}
      >
        <div className={cn(
          'rounded-lg p-2',
          input.exportToEU ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
        )}>
          <Building2 className="h-6 w-6" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-slate-900">Export to EU?</p>
          <p className="text-sm text-slate-500">CBAM regulations apply to EU exports</p>
        </div>
        <div className={cn(
          'ml-auto h-6 w-11 rounded-full transition-colors',
          input.exportToEU ? 'bg-green-500' : 'bg-slate-300'
        )}>
          <div className={cn(
            'h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform',
            input.exportToEU ? 'translate-x-5.5' : 'translate-x-0.5'
          )} />
        </div>
      </button>

      {input.exportToEU && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Export Percentage (%)
          </label>
          <input
            type="number"
            value={input.exportPercentage || 30}
            onChange={(e) => updateField('exportPercentage', Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            min={0}
            max={100}
          />
        </div>
      )}

      <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4">
        <div className="flex items-start gap-3">
          <Leaf className="mt-0.5 h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Ready to see your savings?</p>
            <p className="mt-1 text-sm text-green-600">
              Click calculate to see your complete TANGEDCO bill audit with ToD analysis, 
              Open Access comparison, and compliance assessment.
            </p>
          </div>
        </div>
      </div>
    </div>,

    // Step 4: Contact Details
    <div key="contact" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Your Contact Details</h2>
        <p className="mt-2 text-slate-500">Enter your details to receive your personalized report</p>
      </div>
      <PreCalculationForm
        onSubmit={handleUserContactSubmit}
        onSaveToDatabase={handleSaveToDatabase}
      />
    </div>,
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => setStep(i)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all',
                  i === step
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                    : i < step
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={cn(
                  'mx-2 h-1 w-12 rounded-full sm:w-20',
                  i < step ? 'bg-green-300' : 'bg-slate-200'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 sm:p-8">
        {steps[step]}

        {/* Navigation - Hide on contact step */}
        {step < steps.length - 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className={cn(
                'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all',
                step === 0
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step < steps.length - 2 ? (
              <button
                onClick={() => {
                  if (step === 1 && (!input.loadSanction || input.loadSanction <= 0)) {
                    setStep1Error('Load sanction is required. Please enter the value from your TANGEDCO sanction letter.');
                    return;
                  }
                  setStep1Error('');
                  setStep((s) => Math.min(steps.length - 1, s + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-600"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setStep((s) => Math.min(steps.length - 1, s + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-600"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// REPORT VIEW COMPONENT
// ============================================================

interface ReportProps {
  report: TANGEDCOBillAuditReport;
  input: TANGEDCOBillInput;
  onBack: () => void;
  onLeadCapture?: (input: TANGEDCOBillInput, report: TANGEDCOBillAuditReport) => void;
}

function TANGEDCOReportView({ report, input, onBack, onLeadCapture }: ReportProps) {
  const [downloading, setDownloading] = useState(false);
  const fmtMoney = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const fmtNum = (n: number) => n.toLocaleString('en-IN');

  const todData = [
    { name: 'Peak (25% extra)', units: report.todAnalysis.estimatedPeakUnits, fill: '#ef4444' },
    { name: 'Normal', units: report.todAnalysis.estimatedNormalUnits, fill: '#f59e0b' },
    { name: 'Off-Peak (5% rebate)', units: report.todAnalysis.estimatedOffPeakUnits, fill: '#22c55e' },
  ];

  const oaComparisonData = [
    { name: 'Grid Cost', value: report.openAccessAnalysis.currentGridCost, fill: '#ef4444' },
    { name: 'OA Landed Cost', value: report.openAccessAnalysis.oaLandedCost, fill: '#22c55e' },
  ];

  const leadScoreData = [
    { subject: 'Bill Size', value: report.leadScore.factors.billSize },
    { subject: 'Savings', value: report.leadScore.factors.savingsPotential },
    { subject: 'Roof', value: report.leadScore.factors.roofAvailability },
    { subject: 'Export', value: report.leadScore.factors.exportExposure },
    { subject: 'CCTS', value: report.leadScore.factors.cctsObligation },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Edit Inputs
        </button>
        <div className={cn(
          'ml-auto rounded-full px-4 py-1.5 text-sm font-bold',
          report.leadScore.grade === 'A' ? 'bg-green-100 text-green-700' :
          report.leadScore.grade === 'B' ? 'bg-blue-100 text-blue-700' :
          report.leadScore.grade === 'C' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        )}>
          Lead Score: {report.leadScore.score}/100 (Grade {report.leadScore.grade})
        </div>
      </div>

      {/* Hero Savings Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-8 text-white shadow-2xl shadow-green-200">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-green-100">
            <Factory className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">
              {input.industryType.replace('-', ' ')} | {input.district}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-green-100">Current Bill</p>
              <p className="text-3xl font-bold">{fmtMoney(report.currentBill.totalBill)}</p>
              <p className="text-sm text-green-200">₹{report.currentBill.effectiveRate}/kWh effective</p>
            </div>
            <div>
              <p className="text-sm text-green-100">Potential Savings</p>
              <p className="text-3xl font-bold">{fmtMoney(report.savingsSummary.totalPotentialSavings)}</p>
              <p className="text-sm text-green-200">per year</p>
            </div>
            <div>
              <p className="text-sm text-green-100">Recommended</p>
              <p className="text-2xl font-bold capitalize">
                {report.leadScore.recommendedApproach.replace('-', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Load Sanction Cap Warning */}
      {report.solarRooftopAnalysis.cappedByLoadSanction && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">System Size Capped at Load Sanction</p>
              <p className="mt-1 text-sm text-amber-700">
                The recommended solar system has been limited to <strong>{input.loadSanction} kW</strong> — your TANGEDCO-sanctioned load.
                Installing beyond this limit requires DISCOM approval and contractual demand revision.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ToD Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Clock className="h-5 w-5 text-amber-500" />
            Time-of-Day Analysis
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${fmtNum(Number(value))} kWh`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="units" radius={[8, 8, 0, 0]}>
                {todData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-600">Peak Hour Penalty</span>
              <span className="font-bold text-red-600">{fmtMoney(report.todAnalysis.peakPenaltyAmount)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Load Shift Savings Potential</span>
              <span className="font-bold text-green-600">{fmtMoney(report.todAnalysis.loadShiftSavings)}/yr</span>
            </div>
          </div>
        </div>

        {/* OA Comparison */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Grid vs Open Access Cost
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={oaComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toFixed(2)}/kWh`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {oaComparisonData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-center">
            <p className="text-sm text-green-600">You save</p>
            <p className="text-2xl font-bold text-green-700">
              ₹{report.openAccessAnalysis.savingsPerUnit.toFixed(2)}/kWh
            </p>
            <p className="text-sm text-green-600">with Open Access</p>
          </div>
        </div>
      </div>

      {/* Open Access Eligibility */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-800">
          <Zap className="h-5 w-5" />
          Open Access Analysis (GEOA 2025)
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">
              {report.openAccessAnalysis.eligible ? '✓ Eligible' : '✗ Not Eligible'}
            </p>
            <p className="text-xs text-green-600">Min 63 kVA CD</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{fmtMoney(report.openAccessAnalysis.annualSavings)}</p>
            <p className="text-xs text-green-600">Annual OA Savings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{report.openAccessAnalysis.recommendedOACapacity} kW</p>
            <p className="text-xs text-green-600">Recommended Capacity</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">₹{report.openAccessAnalysis.oaLandedCost}/kWh</p>
            <p className="text-xs text-green-600">Landed Cost</p>
          </div>
        </div>
        
        {/* OA Charges Breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded bg-white p-2 text-center">
            <p className="font-bold">₹{report.openAccessAnalysis.oaChargesBreakdown.energyCost}</p>
            <p className="text-slate-500">PPA Rate</p>
          </div>
          <div className="rounded bg-white p-2 text-center">
            <p className="font-bold">₹{report.openAccessAnalysis.oaChargesBreakdown.crossSubsidySurcharge}</p>
            <p className="text-slate-500">CSS</p>
          </div>
          <div className="rounded bg-white p-2 text-center">
            <p className="font-bold">₹{report.openAccessAnalysis.oaChargesBreakdown.additionalSurcharge}</p>
            <p className="text-slate-500">Additional Surcharge</p>
          </div>
          <div className="rounded bg-white p-2 text-center">
            <p className="font-bold">₹{report.openAccessAnalysis.oaChargesBreakdown.bankingCharge}</p>
            <p className="text-slate-500">Banking (8%)</p>
          </div>
        </div>
      </div>

      {/* Banking Loss Analysis */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-amber-800">
          <Battery className="h-5 w-5" />
          Banking Loss Analysis (GEOA 2025)
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-700">{fmtNum(report.bankingAnalysis.bankedUnitsKWH)}</p>
            <p className="text-xs text-amber-600">Banked Units/mo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{fmtNum(report.bankingAnalysis.bankingChargeKWH)}</p>
            <p className="text-xs text-red-500">8% Banking Charge</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{fmtNum(report.bankingAnalysis.unutilizedUnitsKWH)}</p>
            <p className="text-xs text-red-500">Unutilized Units</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-700">{fmtMoney(report.bankingAnalysis.annualBankingLoss)}</p>
            <p className="text-xs text-red-600">Annual Loss</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-amber-700">{report.bankingAnalysis.optimizationRecommendation}</p>
      </div>

      {/* CCTS & CBAM */}
      {(report.cctsCompliance || report.cbamExposure) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {report.cctsCompliance && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-violet-800">
                <Target className="h-5 w-5" />
                CCTS Compliance
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-violet-700">Sector</span>
                  <span className="font-bold">{report.cctsCompliance.sectorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-700">Current Intensity</span>
                  <span className="font-medium">{report.cctsCompliance.currentEmissionIntensity} tCO2/unit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-700">Target Intensity</span>
                  <span className="font-medium">{report.cctsCompliance.targetEmissionIntensity} tCO2/unit</span>
                </div>
                <div className="flex justify-between border-t border-violet-200 pt-2">
                  <span className="text-violet-700">CCCs Required</span>
                  <span className="font-bold text-red-600">{report.cctsCompliance.cccsRequired} tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-700">Est. CCC Cost</span>
                  <span className="font-bold text-red-600">{fmtMoney(report.cctsCompliance.estimatedCCCCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Solar CCC Potential</span>
                  <span className="font-bold text-green-600">{report.cctsCompliance.solarCCCsPotential} tons</span>
                </div>
              </div>
            </div>
          )}

          {report.cbamExposure && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-rose-800">
                <Building2 className="h-5 w-5" />
                CBAM Exposure (EU)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-rose-700">Product Category</span>
                  <span className="font-bold">{report.cbamExposure.productCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700">Embedded Emissions</span>
                  <span className="font-medium">{report.cbamExposure.embeddedEmissions} tCO2/yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700">CBAM Cost (~€80/ton)</span>
                  <span className="font-medium">{fmtMoney(report.cbamExposure.cbamCostPerTon)}/ton</span>
                </div>
                <div className="flex justify-between border-t border-rose-200 pt-2">
                  <span className="text-rose-800 font-medium">Annual CBAM Cost</span>
                  <span className="font-bold text-red-600">{fmtMoney(report.cbamExposure.annualCBAMCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Renewable Reduction</span>
                  <span className="font-bold text-green-600">-{fmtMoney(report.cbamExposure.renewableReduction)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Priority Recommendations
        </h3>
        <div className="space-y-3">
          {report.recommendations.slice(0, 5).map((rec, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                rec.priority === 'high' ? 'bg-red-500' :
                rec.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
              )}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{rec.action}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Investment: {fmtMoney(rec.investment)}</span>
                  <span>Savings: {fmtMoney(rec.savings)}/yr</span>
                  <span>Payback: {rec.payback} years</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Score Radar */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-900">Lead Quality Assessment</h3>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={leadScoreData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 10 }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Download Report CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center text-white shadow-xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-400">
          <FileText className="h-4 w-4" />
          Soletronix Audit Report
        </div>
        <h3 className="text-2xl font-bold">Download Your Free Audit Report</h3>
        <p className="mx-auto mt-2 max-w-lg text-slate-300">
          Get a detailed PDF with bill breakdown, savings analysis, solar &amp; open access recommendations — branded by Soletronix.
        </p>
        <button
          onClick={async () => {
            setDownloading(true);
            try { await generateTANGEDCOReportPDF(input, report); }
            finally { setDownloading(false); }
          }}
          disabled={downloading}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-600 disabled:opacity-70"
        >
          {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          {downloading ? 'Generating PDF…' : 'Download PDF Report'}
        </button>
        <p className="mt-4 text-xs text-slate-500">
          ✉ marketing.soletronix@gmail.com &nbsp;|&nbsp; 📞 +91 6374988514 &nbsp;|&nbsp; 🌐 www.soletronix.com
        </p>
      </div>
    </div>
  );
}
