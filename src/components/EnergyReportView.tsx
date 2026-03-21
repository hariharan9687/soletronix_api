import {
  Sun, TreePine, Leaf, ArrowLeft,
  TrendingUp, Gauge, PanelTop, Zap, ArrowRight,
  IndianRupee, Award, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { EnergyReport, EnergyInput } from '../types';

interface Props {
  report: EnergyReport;
  input: EnergyInput;
  onGetFullReport: () => void;
  onBack: () => void;
}

const COLORS = ['#f97316', '#f59e0b', '#06b6d4', '#8b5cf6'];

export function EnergyReportView({ report, input, onGetFullReport, onBack }: Props) {
  const energyComparison = [
    { name: 'Current Usage', kwh: report.monthlyUsageKWH, fill: '#ef4444' },
    { name: 'Solar Production', kwh: Math.round(report.solarProductionKWH / 12), fill: '#f97316' },
  ];

  const costBreakdown = [
    { name: 'Net Cost', value: report.netCost },
    { name: '25-Year Savings', value: report.estimatedSavings25Year },
  ];

  const subsidyBreakdown = [
    { name: 'Central Subsidy', value: report.centralSubsidy },
    { name: 'You Pay', value: report.netCost },
  ].filter(d => d.value > 0);

  const fmt = (n: number) => n.toLocaleString('en-IN');
  const fmtMoney = (n: number) => `₹${fmt(n)}`;

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
      </div>

      {/* Hero Savings Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-8 text-white shadow-2xl shadow-orange-200">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-orange-100">
            <Sun className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Your Solar Savings Estimate</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-orange-100">Monthly Savings</p>
              <p className="text-4xl font-bold">{fmtMoney(report.estimatedSavingsMonthly)}</p>
            </div>
            <div>
              <p className="text-sm text-orange-100">Yearly Savings</p>
              <p className="text-4xl font-bold">{fmtMoney(report.estimatedSavingsYearly)}</p>
            </div>
            <div>
              <p className="text-sm text-orange-100">25-Year Savings</p>
              <p className="text-4xl font-bold">{fmtMoney(report.estimatedSavings25Year)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PM Surya Ghar Subsidy Banner */}
      {report.centralSubsidy > 0 && (
        <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 via-white to-orange-50 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-green-100 p-2">
              <Award className="h-6 w-6 text-green-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-800">🇮🇳 PM Surya Ghar Muft Bijli Yojana</h3>
              <p className="mt-1 text-sm text-green-700">You are eligible for the Central Government subsidy!</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-green-100/60 p-3 text-center">
                  <p className="text-xl font-bold text-green-700">{fmtMoney(report.centralSubsidy)}</p>
                  <p className="text-xs text-green-600">Central Government Subsidy</p>
                </div>
                <div className="rounded-lg bg-blue-100/60 p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">{fmtMoney(report.netCost)}</p>
                  <p className="text-xs text-blue-600">Your Net Investment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: PanelTop, label: 'System Size', value: `${report.systemSizeKW} kW`, color: 'text-blue-600 bg-blue-50' },
          { icon: Gauge, label: 'Panels Needed', value: `${report.panelsNeeded}`, color: 'text-violet-600 bg-violet-50' },
          { icon: TrendingUp, label: 'ROI (25yr)', value: `${report.roi25Year}%`, color: 'text-orange-600 bg-orange-50' },
          { icon: Zap, label: 'Payback', value: `${report.paybackYears} yrs`, color: 'text-amber-600 bg-amber-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`inline-flex rounded-lg p-2 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-2 text-sm text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Load Sanction Cap Warning */}
      {report.cappedByLoadSanction && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">System Size Capped at Load Sanction</p>
              <p className="mt-1 text-sm text-amber-700">
                The recommended solar system has been limited to <strong>{input.loadSanction} kW</strong> — your DISCOM-sanctioned load.
                Installing a larger system requires prior approval from your DISCOM and revision of the sanction letter.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Energy Comparison */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">Monthly Energy (kWh)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={energyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${fmt(Number(value))} kWh`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="kwh" radius={[8, 8, 0, 0]}>
                {energyComparison.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subsidy & Cost Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={subsidyBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {subsidyBreakdown.map((_, index) => (
                  <Cell key={index} fill={['#22c55e', '#f97316', '#6366f1'][index % 3]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [fmtMoney(Number(value)), '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            {subsidyBreakdown.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ['#22c55e', '#f97316', '#6366f1'][i % 3] }} />
                <span className="text-slate-600">{entry.name}: {fmtMoney(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
          <IndianRupee className="h-5 w-5 text-orange-500" />
          Financial Summary
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Installation Cost', value: fmtMoney(report.installationCost), color: 'text-slate-900' },
            { label: 'PM Surya Ghar Subsidy (Central Govt.)', value: `- ${fmtMoney(report.centralSubsidy)}`, color: 'text-green-600' },
            { label: 'Your Net Investment', value: fmtMoney(report.netCost), color: 'text-slate-900 font-bold' },
            { label: 'Payback Period', value: `${report.paybackYears} years`, color: 'text-blue-600' },
            { label: '25-Year Net Profit', value: fmtMoney(report.estimatedSavings25Year - report.netCost), color: 'text-green-600 font-bold' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
              <span className="text-slate-600">{label}</span>
              <span className={color}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Investment vs Savings Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-900">Investment vs 25-Year Savings</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={costBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip
              formatter={(value) => [fmtMoney(Number(value)), '']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {costBreakdown.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Environmental Impact */}
      <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-800">
          <Leaf className="h-5 w-5" />
          Environmental Impact (Annual)
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white/60 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{report.co2OffsetTons}</p>
            <p className="text-sm text-green-700">Tonnes CO₂ Offset</p>
          </div>
          <div className="rounded-lg bg-white/60 p-4 text-center">
            <TreePine className="mx-auto h-6 w-6 text-green-600" />
            <p className="text-3xl font-bold text-green-600">{fmt(report.treesEquivalent)}</p>
            <p className="text-sm text-green-700">Trees Equivalent</p>
          </div>
          <div className="rounded-lg bg-white/60 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{fmt(report.roofSpaceNeeded)}</p>
            <p className="text-sm text-green-700">Sq Ft Roof Needed</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center text-white shadow-xl">
        <h3 className="text-2xl font-bold">Get Your Complete Personalised Report</h3>
        <p className="mx-auto mt-2 max-w-lg text-slate-300">
          Unlock detailed financing options, local installer quotes, DISCOM net metering details for {input.state}, 
          and a custom system design — completely free, no obligation.
        </p>
        <button
          onClick={onGetFullReport}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-xl"
        >
          <IndianRupee className="h-5 w-5" />
          Get Free Full Report
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
