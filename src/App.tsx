import { useState, useEffect } from 'react';
import {
  Sun, Calculator, Zap, Menu, X,
  Wifi, WifiOff, Factory, FileText, Building2,
} from 'lucide-react';
import { cn } from './utils/cn';
import type { EnergyInput, EnergyReport, Lead } from './types';
import type { TANGEDCOBillInput, TANGEDCOBillAuditReport } from './types/tangedco';
import { EnergyCalculator } from './components/EnergyCalculator';
import { TANGEDCOBillAudit } from './components/TANGEDCOBillAudit';
import { LeadCaptureForm } from './components/LeadCaptureForm';
import { addLog } from './services/logger';
import { checkServerHealth } from './services/database';

const soletronixLogo = import.meta.env.BASE_URL + 'soletronix-logo.jpg';

type View = 'residential' | 'industrial';

export function App() {
  const [view, setView] = useState<View>('industrial');

  const navigate = (v: View) => {
    addLog('page_visit', 'info', `Navigated to ${v}`);
    setView(v);
  };
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [captureData, setCaptureData] = useState<{
    input: EnergyInput;
    report: EnergyReport;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    // Retry up to 3 times with 3s delay — handles Railway cold starts
    const tryConnect = async (attempts: number) => {
      const ok = await checkServerHealth();
      if (ok) {
        setBackendConnected(true);
      } else if (attempts > 1) {
        setTimeout(() => tryConnect(attempts - 1), 3000);
      }
    };
    tryConnect(3);
  }, []);

  const handleRequestReport = (input: EnergyInput, report: EnergyReport) => {
    addLog('calculator_run', 'info', `Residential calculator run — ${input.propertyType} in ${input.state}`, {
      monthlyBill: input.monthlyBill,
      systemSizeKW: report.systemSizeKW,
      estimatedSavingsMonthly: report.estimatedSavingsMonthly,
    });
    setCaptureData({ input, report });
    setShowLeadForm(true);
  };

  const handleTANGEDCOLeadCapture = (input: TANGEDCOBillInput, report: TANGEDCOBillAuditReport) => {
    addLog('audit_run', 'info', `TANGEDCO industrial audit — ${input.tariffCategory} in ${input.district}`, {
      consumerNumber: input.consumerNumber,
      totalUnitsKWH: input.totalUnitsKWH,
      contractedDemandKVA: input.contractedDemandKVA,
      totalBill: report.currentBill.totalBill,
      totalPotentialSavings: report.savingsSummary.totalPotentialSavings,
    });
    const energyInput: EnergyInput = {
      monthlyBill: report.currentBill.totalBill,
      squareFootage: input.contractedDemandKVA * 100,
      roofAge: 5,
      roofType: 'metal',
      propertyType: 'industrial',
      state: 'Tamil Nadu',
      shading: 'minimal',
      electricVehicle: false,
      poolOrSpa: false,
      loadSanction: input.loadSanction || 0,
    };
    const energyReport: EnergyReport = {
      estimatedSavingsMonthly: Math.round(report.savingsSummary.totalPotentialSavings / 12),
      estimatedSavingsYearly: report.savingsSummary.totalPotentialSavings,
      estimatedSavings25Year: report.savingsSummary.totalPotentialSavings * 20,
      systemSizeKW: report.solarRooftopAnalysis.recommendedSizeKW,
      panelsNeeded: Math.ceil(report.solarRooftopAnalysis.recommendedSizeKW * 1000 / 545),
      roofSpaceNeeded: report.solarRooftopAnalysis.roofAreaRequired,
      co2OffsetTons: Math.round(report.solarRooftopAnalysis.annualGeneration * 0.82 / 1000),
      treesEquivalent: Math.round(report.solarRooftopAnalysis.annualGeneration * 0.82 / 1000 * 16.5),
      paybackYears: report.solarRooftopAnalysis.paybackYears,
      roi25Year: report.solarRooftopAnalysis.roi25Year,
      installationCost: report.solarRooftopAnalysis.installationCost,
      centralSubsidy: 0,
      stateSubsidy: 0,
      netCost: report.solarRooftopAnalysis.netInvestment,
      monthlyUsageKWH: input.totalUnitsKWH,
      solarProductionKWH: report.solarRooftopAnalysis.annualGeneration,
    };
    setCaptureData({ input: energyInput, report: energyReport });
    setShowLeadForm(true);
  };

  const handleLeadSuccess = (_lead: Lead) => {
    addLog('lead_created', 'success', `New lead captured — ${_lead.firstName} ${_lead.lastName} (${_lead.propertyType})`, {
      leadId: _lead.id,
      email: _lead.email,
      city: _lead.city,
      state: _lead.state,
      monthlyBill: _lead.monthlyBill,
      source: _lead.source,
    });
    setShowLeadForm(false);
    setCaptureData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <button onClick={() => navigate('industrial')} className="flex items-center gap-3">
            <img src={soletronixLogo} alt="Soletronix" className="h-10 w-10 rounded-xl object-contain shadow-lg" />
            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900">Soletronix</h1>
              <p className="hidden text-xs text-slate-400 sm:block">
                Renewable Energy as a Service | Tamil Nadu
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => navigate('industrial')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                view === 'industrial' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              <Factory className="h-4 w-4" />
              Industrial Audit
            </button>
            <button
              onClick={() => navigate('residential')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                view === 'residential' ? 'bg-orange-50 text-orange-700' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              <Calculator className="h-4 w-4" />
              Residential
            </button>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <div className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
              backendConnected ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            )}>
              {backendConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {backendConnected ? 'Connected' : 'Local Mode'}
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 sm:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 sm:hidden">
            <div className="space-y-2">
              {[
                { view: 'industrial' as const, icon: Factory, label: '🏭 Industrial Bill Audit' },
                { view: 'residential' as const, icon: Calculator, label: '🏠 Residential' },
              ].map(({ view: v, icon: Icon, label }) => (
                <button
                  key={v}
                  onClick={() => { navigate(v); setMobileMenuOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
                    view === v ? 'bg-green-50 text-green-700' : 'text-slate-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* INDUSTRIAL VIEW */}
        {view === 'industrial' && (
          <div>
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
                <FileText className="h-4 w-4" />
                🏭 Free TANGEDCO Industrial Bill Audit
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                See How Much You Can Save
                <br />
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  On Your TANGEDCO Bill
                </span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-slate-500">
                Complete analysis with ToD, Open Access comparison, and compliance assessment
              </p>
            </div>
            <TANGEDCOBillAudit onLeadCapture={handleTANGEDCOLeadCapture} />
          </div>
        )}

        {/* RESIDENTIAL VIEW */}
        {view === 'residential' && (
          <div>
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-orange-700">
                <Zap className="h-4 w-4" />
                🇮🇳 PM Surya Ghar Muft Bijli Yojana Calculator
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Discover How Much You Can Save
                <br />
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  With Rooftop Solar
                </span>
              </h1>
            </div>
            <EnergyCalculator onRequestReport={handleRequestReport} />
          </div>
        )}

      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <p className="text-xs text-slate-400">
            Soletronix Green Energy — Renewable Energy as a Service | Chennai, Tamil Nadu 🇮🇳
          </p>
        </div>
      </footer>

      {showLeadForm && captureData && (
        <LeadCaptureForm
          energyInput={captureData.input}
          energyReport={captureData.report}
          onClose={() => setShowLeadForm(false)}
          onSuccess={handleLeadSuccess}
        />
      )}

      {/* Floating WhatsApp Chat Button */}
      <a
        href="https://wa.me/916374988514?text=Hi%20Soletronix!%20I%27m%20interested%20in%20solar%20energy%20solutions."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-2xl shadow-green-400/40 transition-all hover:scale-105 hover:bg-[#20c05a] active:scale-95"
        aria-label="Chat on WhatsApp"
      >
        {/* WhatsApp SVG icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-6 w-6 fill-white">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.49 2.027 7.8L0 32l8.47-2.003A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.77-1.847l-.485-.288-5.027 1.188 1.23-4.892-.317-.5A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.908c-.397-.198-2.347-1.157-2.71-1.288-.364-.132-.63-.198-.895.198-.264.397-1.024 1.288-1.255 1.554-.231.265-.463.298-.86.1-.397-.199-1.676-.618-3.193-1.97-1.18-1.051-1.977-2.349-2.208-2.746-.231-.397-.025-.611.173-.809.178-.178.397-.463.595-.695.198-.231.264-.397.397-.661.132-.265.066-.497-.033-.695-.099-.198-.895-2.157-1.226-2.952-.322-.776-.65-.67-.895-.683-.23-.012-.496-.015-.762-.015-.265 0-.695.099-1.058.497-.364.397-1.389 1.357-1.389 3.31s1.423 3.84 1.621 4.104c.198.265 2.8 4.274 6.785 5.993.948.41 1.688.654 2.265.837.951.303 1.817.26 2.5.158.763-.114 2.347-.96 2.678-1.886.33-.927.33-1.72.231-1.886-.099-.165-.364-.264-.762-.463z"/>
        </svg>
        <span className="text-sm font-semibold">Chat with us</span>
      </a>
    </div>
  );
}
