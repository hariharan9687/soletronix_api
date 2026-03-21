import { useState } from 'react';
import {
  Zap, Sun, Battery, TreePine, ArrowRight,
  ArrowLeft, Home, Building2, Factory, CloudSun, Leaf,
  IndianRupee, AlertCircle,
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { EnergyInput, EnergyReport } from '../types';
import { calculateEnergyReport, INDIAN_STATES } from '../services/api';
import { saveResidentialCalculator } from '../services/database';
import { EnergyReportView } from './EnergyReportView';
import { PreCalculationForm } from './PreCalculationForm';

interface Props {
  onRequestReport: (input: EnergyInput, report: EnergyReport) => void;
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

export function EnergyCalculator({ onRequestReport }: Props) {
  const [step, setStep] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<EnergyReport | null>(null);
  const [userContact, setUserContact] = useState<UserContact | null>(null);

  const [input, setInput] = useState<EnergyInput>({
    monthlyBill: 3000,
    squareFootage: 1200,
    roofAge: 5,
    roofType: 'rcc',
    propertyType: 'residential',
    state: 'Maharashtra',
    shading: 'minimal',
    electricVehicle: false,
    poolOrSpa: false,
    loadSanction: 0,
  });
  const [step1Error, setStep1Error] = useState('');

  const updateField = <K extends keyof EnergyInput>(key: K, value: EnergyInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    const result = calculateEnergyReport(input);
    setReport(result);
    setShowReport(true);
  };

  const handleGetFullReport = () => {
    if (report) {
      onRequestReport(input, report);
    }
  };

  const handleSaveToDatabase = async (contactData: UserContact) => {
    const reportResult = calculateEnergyReport(input);
    const result = await saveResidentialCalculator({
      contactData,
      inputData: input as unknown as Record<string, unknown>,
      reportData: reportResult as unknown as Record<string, unknown>,
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to save to database');
    }
  };

  const handleUserContactSubmit = (data: UserContact) => {
    setUserContact(data);
    handleCalculate();
  };

  if (showReport && report) {
    return (
      <EnergyReportView
        report={report}
        input={input}
        onGetFullReport={handleGetFullReport}
        onBack={() => setShowReport(false)}
      />
    );
  }

  const steps = [
    // Step 0: Property Type
    <div key="property" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">What type of property?</h2>
        <p className="mt-2 text-slate-500">Select your property type to get accurate estimates</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {([
          { type: 'residential' as const, icon: Home, label: 'Residential', desc: 'House / Flat / Villa' },
          { type: 'commercial' as const, icon: Building2, label: 'Commercial', desc: 'Office / Shop / Mall' },
          { type: 'industrial' as const, icon: Factory, label: 'Industrial', desc: 'Factory / Warehouse' },
        ]).map(({ type, icon: Icon, label, desc }) => (
          <button
            key={type}
            onClick={() => updateField('propertyType', type)}
            className={cn(
              'group flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200',
              input.propertyType === type
                ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100'
                : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
            )}
          >
            <div className={cn(
              'rounded-xl p-3 transition-colors',
              input.propertyType === type ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600'
            )}>
              <Icon className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">{label}</p>
              <p className="text-sm text-slate-500">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>,

    // Step 1: Location & Energy
    <div key="location" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Location & Energy Usage</h2>
        <p className="mt-2 text-slate-500">Help us calculate your solar potential</p>
      </div>
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">State / UT</label>
          <select
            value={input.state}
            onChange={(e) => updateField('state', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Monthly Electricity Bill
          </label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              value={input.monthlyBill}
              onChange={(e) => updateField('monthlyBill', Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="3000"
              min={0}
            />
          </div>
          <div className="mt-2">
            <input
              type="range"
              min={500}
              max={100000}
              step={500}
              value={input.monthlyBill}
              onChange={(e) => updateField('monthlyBill', Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>₹500</span>
              <span>₹1,00,000</span>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Property Area (sq ft)
          </label>
          <input
            type="number"
            value={input.squareFootage}
            onChange={(e) => updateField('squareFootage', Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            placeholder="1200"
            min={0}
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            Load Sanction (kW)
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">Required</span>
          </label>
          <input
            type="number"
            value={input.loadSanction || ''}
            onChange={(e) => { updateField('loadSanction', Number(e.target.value)); setStep1Error(''); }}
            className={cn(
              'w-full rounded-xl border bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:outline-none focus:ring-2',
              step1Error
                ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                : 'border-slate-300 focus:border-orange-500 focus:ring-orange-200'
            )}
            placeholder="e.g. 5"
            min={0}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            As per your DISCOM load sanction / service connection letter
          </p>
          {step1Error && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" /> {step1Error}
            </p>
          )}
        </div>
      </div>
    </div>,

    // Step 2: Roof & Shading
    <div key="roof" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Roof Details</h2>
        <p className="mt-2 text-slate-500">Your roof conditions affect solar performance</p>
      </div>
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Roof Age (years)</label>
          <input
            type="number"
            value={input.roofAge}
            onChange={(e) => updateField('roofAge', Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            min={0}
            max={50}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Roof Type</label>
          <select
            value={input.roofType}
            onChange={(e) => updateField('roofType', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <option value="rcc">RCC (Concrete)</option>
            <option value="metal">Metal Sheet</option>
            <option value="tile">Mangalore Tiles</option>
            <option value="asbestos">Asbestos / AC Sheet</option>
            <option value="flat">Flat Terrace</option>
            <option value="sloped">Sloped Roof</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Roof Shading</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'none' as const, label: 'No Shade', icon: Sun },
              { value: 'minimal' as const, label: 'Minimal', icon: CloudSun },
              { value: 'moderate' as const, label: 'Moderate', icon: TreePine },
              { value: 'heavy' as const, label: 'Heavy', icon: TreePine },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateField('shading', value)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all',
                  input.shading === value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 text-slate-600 hover:border-orange-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,

    // Step 3: Additional Info
    <div key="additional" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Additional Details</h2>
        <p className="mt-2 text-slate-500">Help us fine-tune your energy estimate</p>
      </div>
      <div className="mx-auto max-w-md space-y-5">
        <button
          onClick={() => updateField('electricVehicle', !input.electricVehicle)}
          className={cn(
            'flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all',
            input.electricVehicle
              ? 'border-orange-500 bg-orange-50'
              : 'border-slate-200 hover:border-orange-300'
          )}
        >
          <div className={cn(
            'rounded-lg p-2',
            input.electricVehicle ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
          )}>
            <Zap className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900">Electric Vehicle</p>
            <p className="text-sm text-slate-500">Do you own or plan to own an EV?</p>
          </div>
          <div className={cn(
            'ml-auto h-6 w-11 rounded-full transition-colors',
            input.electricVehicle ? 'bg-orange-500' : 'bg-slate-300'
          )}>
            <div className={cn(
              'h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform',
              input.electricVehicle ? 'translate-x-5.5' : 'translate-x-0.5'
            )} />
          </div>
        </button>

        <button
          onClick={() => updateField('poolOrSpa', !input.poolOrSpa)}
          className={cn(
            'flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all',
            input.poolOrSpa
              ? 'border-orange-500 bg-orange-50'
              : 'border-slate-200 hover:border-orange-300'
          )}
        >
          <div className={cn(
            'rounded-lg p-2',
            input.poolOrSpa ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
          )}>
            <Battery className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900">Water Pump / Bore Well</p>
            <p className="text-sm text-slate-500">Do you have a water pump or bore well motor?</p>
          </div>
          <div className={cn(
            'ml-auto h-6 w-11 rounded-full transition-colors',
            input.poolOrSpa ? 'bg-orange-500' : 'bg-slate-300'
          )}>
            <div className={cn(
              'h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform',
              input.poolOrSpa ? 'translate-x-5.5' : 'translate-x-0.5'
            )} />
          </div>
        </button>

        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <Leaf className="mt-0.5 h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">Ready to see your savings?</p>
              <p className="mt-1 text-sm text-orange-600">
                Click calculate to see your personalized report with estimated savings under 
                <strong> PM Surya Ghar Muft Bijli Yojana</strong>, system size, and environmental impact.
              </p>
            </div>
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
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                    : i < step
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={cn(
                  'mx-2 h-1 w-12 rounded-full sm:w-20',
                  i < step ? 'bg-orange-300' : 'bg-slate-200'
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
                    setStep1Error('Load sanction is required. Please enter the value from your DISCOM letter.');
                    return;
                  }
                  setStep1Error('');
                  setStep((s) => Math.min(steps.length - 1, s + 1));
                }}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600"
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
