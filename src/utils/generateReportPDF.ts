// ============================================================
// TANGEDCO AUDIT REPORT — PDF GENERATOR
// html2canvas per-page → jsPDF image approach (reliable)
// ============================================================

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { TANGEDCOBillInput, TANGEDCOBillAuditReport } from '../types/tangedco';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
const fmtMoney = (n: number) => `&#8377;${fmt(n)}`;
const fmtN = (n: number, d = 1) => n.toFixed(d);

function priorityColor(p: string) {
  if (p === 'high') return '#dc2626';
  if (p === 'medium') return '#d97706';
  return '#16a34a';
}

const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  .page {
    width: 794px;
    height: 1123px;
    background: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1e293b;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .header {
    background: linear-gradient(135deg,#0f172a 0%,#1e293b 100%);
    padding: 20px 32px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 4px solid #22c55e;
    flex-shrink: 0;
  }
  .header-left { display:flex; align-items:center; gap:14px; }
  .logo-wrap {
    width:50px; height:50px; border-radius:12px;
    overflow:hidden; border:2px solid #22c55e;
    background:#fff; flex-shrink:0;
  }
  .logo-wrap img { width:100%; height:100%; object-fit:contain; }
  .company-name { font-size:20px; font-weight:800; color:#fff; letter-spacing:.5px; }
  .company-sub  { font-size:9px; color:#94a3b8; margin-top:2px; }
  .header-right { text-align:right; }
  .report-badge {
    background:#22c55e22; border:1px solid #22c55e;
    color:#4ade80; font-size:9px; font-weight:700;
    padding:3px 10px; border-radius:9999px;
    text-transform:uppercase; letter-spacing:.8px;
    display:inline-block; margin-bottom:3px;
  }
  .report-title { color:#fff; font-size:12px; font-weight:600; }
  .report-date  { color:#94a3b8; font-size:9px; margin-top:2px; }
  .body { padding:18px 32px; flex:1; overflow:hidden; }
  .facility-bar {
    background:#f0fdf4; border:1px solid #bbf7d0;
    border-radius:8px; padding:10px 14px;
    display:flex; justify-content:space-between; align-items:center;
    margin-bottom:14px;
  }
  .consumer { font-size:14px; font-weight:700; color:#15803d; }
  .details  { font-size:10px; color:#475569; margin-top:2px; }
  .billing  { font-size:10px; color:#64748b; }
  .sec {
    display:flex; align-items:center; gap:8px;
    margin-bottom:8px; margin-top:14px;
  }
  .sec .bar { width:4px; height:18px; background:#22c55e; border-radius:2px; }
  .sec h2 {
    font-size:11px; font-weight:700; color:#0f172a;
    text-transform:uppercase; letter-spacing:.8px;
  }
  .sec-line { height:1px; background:#e2e8f0; flex:1; margin-left:8px; }
  .grid4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; }
  .sbox { border-radius:8px; padding:11px; border:1px solid transparent; }
  .sbox .lbl { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; opacity:.75; }
  .sbox .val { font-size:15px; font-weight:800; margin-top:4px; }
  .sbox .sub { font-size:9px; margin-top:3px; opacity:.7; }
  .sb-bill  { background:#f8fafc; border-color:#e2e8f0; color:#475569; }
  .sb-imm   { background:#fffbeb; border-color:#fde68a; color:#92400e; }
  .sb-solar { background:#f0fdf4; border-color:#bbf7d0; color:#15803d; }
  .sb-total { background:linear-gradient(135deg,#15803d,#16a34a); color:#fff; border:none; }
  table.dt {
    width:100%; border-collapse:collapse; font-size:11px;
    border-radius:6px; overflow:hidden; border:1px solid #e2e8f0;
  }
  table.dt thead tr { background:#0f172a; color:#fff; }
  table.dt thead th { padding:7px 12px; text-align:left; font-size:10px; font-weight:600; text-transform:uppercase; }
  table.dt thead th:last-child { text-align:right; }
  table.dt thead .th-blue   { background:#1d4ed8; }
  table.dt thead .th-purple { background:#7c3aed; }
  table.dt thead .th-green  { background:#15803d; }
  table.dt thead .th-amber  { background:#b45309; }
  table.dt thead .th-teal   { background:#0f766e; }
  table.dt tbody tr:nth-child(even) { background:#f8fafc; }
  table.dt tbody td { padding:6px 12px; border-bottom:1px solid #f1f5f9; }
  table.dt tbody td:last-child { text-align:right; font-weight:600; }
  table.dt .tr-total { background:#f0fdf4 !important; }
  table.dt .tr-total td { font-size:12px; font-weight:800; color:#15803d; border-top:2px solid #22c55e; }
  .two { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:0; }
  .stat4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:8px 0; }
  .stb { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; }
  .stb .sl { font-size:9px; color:#94a3b8; margin-bottom:2px; }
  .stb .sv { font-size:13px; font-weight:700; color:#0f172a; }
  table.rec {
    width:100%; border-collapse:collapse; font-size:11px;
    border-radius:6px; overflow:hidden; border:1px solid #e2e8f0;
  }
  table.rec thead tr { background:#0f172a; color:#fff; }
  table.rec thead th { padding:7px 10px; font-size:10px; font-weight:600; }
  table.rec tbody tr:nth-child(even) { background:#f8fafc; }
  table.rec tbody td { padding:6px 10px; border-bottom:1px solid #f1f5f9; }
  .contact {
    background:linear-gradient(135deg,#0f172a,#1e293b);
    border:2px solid #22c55e; border-radius:10px;
    padding:18px 24px; margin-top:12px; text-align:center;
  }
  .contact h3 { color:#fff; font-size:15px; font-weight:800; margin-bottom:4px; }
  .contact p  { color:#94a3b8; font-size:11px; margin-bottom:12px; }
  .cgrid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:10px; }
  .ci { background:#ffffff14; border-radius:6px; padding:9px; border:1px solid #ffffff22; }
  .ci .cil { font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
  .ci .civ { color:#4ade80; font-size:12px; font-weight:600; }
  .cta-btn {
    display:inline-block; background:linear-gradient(135deg,#22c55e,#16a34a);
    color:#fff; padding:7px 22px; border-radius:9999px; font-weight:700; font-size:12px;
  }
  .disc {
    background:#fafafa; border:1px solid #e2e8f0;
    border-radius:6px; padding:9px 12px; margin-top:10px;
    font-size:9px; color:#94a3b8; line-height:1.5;
  }
  .footer {
    background:#f8fafc; border-top:1px solid #e2e8f0;
    padding:7px 32px;
    display:flex; justify-content:space-between; align-items:center;
    flex-shrink:0;
  }
  .footer-logo { display:flex; align-items:center; gap:5px; font-size:10px; font-weight:700; color:#22c55e; }
  .footer-logo img { width:16px; height:16px; border-radius:3px; }
  .footer-mid { font-size:9px; color:#94a3b8; }
  .footer-pg  { font-size:9px; color:#94a3b8; }
`;

function makePageWrapper(logoUrl: string, subtitle: string, date: string, pageLabel: string): HTMLDivElement {
  const page = document.createElement('div');
  page.className = 'page';

  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-left">
      <div class="logo-wrap"><img src="${logoUrl}" crossorigin="anonymous"/></div>
      <div>
        <div class="company-name">SOLETRONIX</div>
        <div class="company-sub">${subtitle}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="report-badge">TANGEDCO Audit Report</div>
      <div class="report-title">Industrial Bill Audit &amp; Savings Analysis</div>
      <div class="report-date">Date: ${date}</div>
    </div>
  `;

  const footer = document.createElement('div');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="footer-logo"><img src="${logoUrl}" crossorigin="anonymous"/> Soletronix</div>
    <div class="footer-mid">marketing.soletronix@gmail.com &nbsp;|&nbsp; +91 6374988514 &nbsp;|&nbsp; www.soletronix.com</div>
    <div class="footer-pg">${pageLabel}</div>
  `;

  const body = document.createElement('div');
  body.className = 'body';

  page.appendChild(header);
  page.appendChild(body);
  page.appendChild(footer);

  return page;
}

export async function generateTANGEDCOReportPDF(
  input: TANGEDCOBillInput,
  report: TANGEDCOBillAuditReport
): Promise<void> {
  const logoUrl =
    window.location.origin + (import.meta.env.BASE_URL as string) + 'soletronix-logo.jpg';
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Inject CSS
  const styleEl = document.createElement('style');
  styleEl.id = '__sol-tang-pdf-style';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  const billRows: [string, number][] = [
    ['Energy Charge', report.currentBill.energyCharge],
    ['Demand Charge', report.currentBill.demandCharge],
    ['ToD Peak Surcharge', report.currentBill.todPeakSurcharge],
    ['ToD Off-Peak Rebate', -report.currentBill.todOffPeakRebate],
    ['Power Factor Penalty / Incentive', report.currentBill.powerFactorPenalty - report.currentBill.powerFactorIncentive],
    ['Fuel Cost Adjustment', report.currentBill.fuelCostAdjustment],
    ['Electricity Duty', report.currentBill.electricityDuty],
    ['Meter Rent & Other', report.currentBill.meterRent + report.currentBill.otherCharges],
  ];

  // ── PAGE 1: Overview + Bill Breakdown ──────────────────────
  const page1 = makePageWrapper(logoUrl, 'Green Energy — Renewable Energy as a Service | Tamil Nadu', date, 'Page 1 of 3');
  const body1 = page1.querySelector('.body') as HTMLDivElement;
  body1.innerHTML = `
    <div class="facility-bar">
      <div>
        <div class="consumer">Consumer No: ${input.consumerNumber || 'N/A'}</div>
        <div class="details">
          ${input.industryType.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} &nbsp;|&nbsp;
          Tariff: ${input.tariffCategory} &nbsp;|&nbsp;
          ${input.district}, Tamil Nadu &nbsp;|&nbsp;
          ${input.shiftPattern} operation
        </div>
      </div>
      <div style="text-align:right">
        <div class="billing" style="font-weight:700;color:#0f172a;font-size:12px">Billing Month: ${input.billingMonth}</div>
        <div class="billing">CD: ${input.contractedDemandKVA} KVA &nbsp;|&nbsp; Load: ${input.connectedLoadHP} HP</div>
        <div class="billing">PF: ${input.powerFactor} &nbsp;|&nbsp; Units: ${fmt(input.totalUnitsKWH)} kWh</div>
      </div>
    </div>

    <div class="sec"><div class="bar"></div><h2>Savings Overview</h2><div class="sec-line"></div></div>
    <div class="grid4">
      <div class="sbox sb-bill">
        <div class="lbl">Monthly Bill</div>
        <div class="val">${fmtMoney(report.currentBill.totalBill)}</div>
        <div class="sub">Rate: &#8377;${fmtN(report.currentBill.effectiveRate,2)}/kWh</div>
      </div>
      <div class="sbox sb-imm">
        <div class="lbl">Immediate Savings/yr</div>
        <div class="val">${fmtMoney(report.savingsSummary.immediate.total)}</div>
        <div class="sub">ToD + PF + CD Opt.</div>
      </div>
      <div class="sbox sb-solar">
        <div class="lbl">Solar Savings/yr</div>
        <div class="val">${fmtMoney(report.savingsSummary.withSolarRooftop.annualSavings)}</div>
        <div class="sub">Payback: ${fmtN(report.solarRooftopAnalysis.paybackYears,1)} yrs</div>
      </div>
      <div class="sbox sb-total">
        <div class="lbl">Total Potential/yr</div>
        <div class="val">${fmtMoney(report.savingsSummary.totalPotentialSavings)}</div>
        <div class="sub">All strategies</div>
      </div>
    </div>

    <div class="sec" style="margin-top:16px"><div class="bar"></div><h2>Current Bill Breakdown</h2><div class="sec-line"></div></div>
    <table class="dt">
      <thead><tr><th>Charge Component</th><th>Amount</th></tr></thead>
      <tbody>
        ${billRows.map(([label, val]) => `
          <tr>
            <td>${label}</td>
            <td style="color:${val < 0 ? '#16a34a' : '#1e293b'}">
              ${val < 0 ? '- ' + fmtMoney(-val) : fmtMoney(val)}
            </td>
          </tr>
        `).join('')}
        <tr class="tr-total"><td>TOTAL BILL</td><td>${fmtMoney(report.currentBill.totalBill)}</td></tr>
      </tbody>
    </table>
  `;

  // ── PAGE 2: Demand, PF, Solar, Open Access ──────────────────
  const page2 = makePageWrapper(logoUrl, `TANGEDCO Audit — ${input.consumerNumber || ''} | ${input.district}`, date, 'Page 2 of 3');
  const body2 = page2.querySelector('.body') as HTMLDivElement;
  body2.innerHTML = `
    <div class="sec"><div class="bar"></div><h2>Demand &amp; Power Factor Analysis</h2><div class="sec-line"></div></div>
    <div class="two">
      <table class="dt">
        <thead><tr><th colspan="2" class="th-blue">Demand Analysis</th></tr></thead>
        <tbody>
          <tr><td>Contracted Demand (KVA)</td><td>${fmtN(report.demandAnalysis.contractedDemandKVA,0)}</td></tr>
          <tr><td>Recorded Demand (KVA)</td><td>${fmtN(report.demandAnalysis.recordedDemandKVA,0)}</td></tr>
          <tr><td>Utilisation</td><td>${fmtN(report.demandAnalysis.utilizationPercent,1)}%</td></tr>
          <tr><td>Overload Penalty</td><td style="color:#dc2626">${fmtMoney(report.demandAnalysis.overloadPenalty)}</td></tr>
          <tr><td>Recommended CD (KVA)</td><td style="color:#15803d;font-weight:700">${fmtN(report.demandAnalysis.recommendedCD,0)}</td></tr>
          <tr class="tr-total"><td>CD Savings/yr</td><td>${fmtMoney(report.demandAnalysis.cdOptimizationSavings*12)}</td></tr>
        </tbody>
      </table>
      <table class="dt">
        <thead><tr><th colspan="2" class="th-purple">Power Factor Analysis</th></tr></thead>
        <tbody>
          <tr><td>Current Power Factor</td>
            <td style="color:${input.powerFactor < 0.9 ? '#dc2626' : '#16a34a'};font-weight:700">
              ${fmtN(report.pfAnalysis.currentPF,3)}
            </td>
          </tr>
          <tr><td>Target Power Factor</td><td>${fmtN(report.pfAnalysis.targetPF,2)}</td></tr>
          <tr><td>PF Penalty / Incentive</td>
            <td style="color:${report.pfAnalysis.currentPenaltyOrIncentive < 0 ? '#dc2626' : '#16a34a'}">
              ${fmtMoney(Math.abs(report.pfAnalysis.currentPenaltyOrIncentive))}
              ${report.pfAnalysis.currentPenaltyOrIncentive < 0 ? ' (Penalty)' : ' (Incentive)'}
            </td>
          </tr>
          <tr><td>Capacitor Required (KVAR)</td><td>${fmtN(report.pfAnalysis.capacitorKVARRequired,0)}</td></tr>
          <tr><td>Capacitor Cost</td><td>${fmtMoney(report.pfAnalysis.capacitorCost)}</td></tr>
          <tr class="tr-total"><td>Annual Savings from PF Fix</td><td>${fmtMoney(report.pfAnalysis.annualSavingsFromPFCorrection)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="sec"><div class="bar"></div><h2>Solar Rooftop Analysis</h2><div class="sec-line"></div></div>
    <div class="stat4">
      <div class="stb"><div class="sl">Recommended Size</div><div class="sv">${fmtN(report.solarRooftopAnalysis.recommendedSizeKW,0)} kW</div></div>
      <div class="stb"><div class="sl">Annual Generation</div><div class="sv">${fmt(report.solarRooftopAnalysis.annualGeneration)} kWh</div></div>
      <div class="stb"><div class="sl">Annual Savings</div><div class="sv" style="color:#15803d">${fmtMoney(report.solarRooftopAnalysis.annualSavings)}</div></div>
      <div class="stb"><div class="sl">25-Year ROI</div><div class="sv" style="color:#15803d">${fmtN(report.solarRooftopAnalysis.roi25Year,0)}%</div></div>
    </div>
    <table class="dt" style="margin-top:6px">
      <thead><tr class="th-green"><th>Solar Parameter</th><th>Value</th><th>Solar Parameter</th><th>Value</th></tr></thead>
      <tbody>
        <tr>
          <td>Roof Area Required</td><td>${fmt(report.solarRooftopAnalysis.roofAreaRequired)} sq.ft</td>
          <td>Installation Cost</td><td>${fmtMoney(report.solarRooftopAnalysis.installationCost)}</td>
        </tr>
        <tr>
          <td>Accelerated Depreciation</td><td>${fmtMoney(report.solarRooftopAnalysis.acceleratedDepreciation)}</td>
          <td>TN Tax Exemption</td><td>${fmtMoney(report.solarRooftopAnalysis.tnElectricityTaxExemption)}</td>
        </tr>
        <tr>
          <td>Green Industry Subsidy</td><td>${fmtMoney(report.solarRooftopAnalysis.greenIndustrySubsidy)}</td>
          <td>Net Investment</td><td style="color:#15803d;font-weight:700">${fmtMoney(report.solarRooftopAnalysis.netInvestment)}</td>
        </tr>
        <tr class="tr-total">
          <td>Payback Period</td><td>${fmtN(report.solarRooftopAnalysis.paybackYears,1)} years</td>
          <td>25-Year ROI</td><td>${fmtN(report.solarRooftopAnalysis.roi25Year,0)}%</td>
        </tr>
      </tbody>
    </table>

    <div class="sec"><div class="bar"></div><h2>Open Access Analysis</h2><div class="sec-line"></div></div>
    <div class="two">
      <table class="dt">
        <thead><tr><th colspan="2" class="th-teal">Open Access Summary</th></tr></thead>
        <tbody>
          <tr><td>Eligibility</td>
            <td style="color:${report.openAccessAnalysis.eligible ? '#16a34a' : '#dc2626'};font-weight:700">
              ${report.openAccessAnalysis.eligible ? '✓ Eligible' : '✗ Not Eligible'}
            </td>
          </tr>
          <tr><td>Grid Cost/kWh</td><td>&#8377;${fmtN(report.openAccessAnalysis.currentGridCost,2)}</td></tr>
          <tr><td>OA Landed Cost/kWh</td><td>&#8377;${fmtN(report.openAccessAnalysis.oaLandedCost,2)}</td></tr>
          <tr><td>Savings per Unit</td><td style="color:#16a34a;font-weight:700">&#8377;${fmtN(report.openAccessAnalysis.savingsPerUnit,2)}</td></tr>
          <tr class="tr-total"><td>Annual OA Savings</td><td>${fmtMoney(report.openAccessAnalysis.annualSavings)}</td></tr>
        </tbody>
      </table>
      <table class="dt">
        <thead><tr><th colspan="2" class="th-amber">ToD Analysis</th></tr></thead>
        <tbody>
          <tr><td>Est. Peak Units (kWh)</td><td>${fmt(report.todAnalysis.estimatedPeakUnits)}</td></tr>
          <tr><td>Est. Off-Peak Units (kWh)</td><td>${fmt(report.todAnalysis.estimatedOffPeakUnits)}</td></tr>
          <tr><td>Peak Penalty</td><td style="color:#dc2626">${fmtMoney(report.todAnalysis.peakPenaltyAmount)}</td></tr>
          <tr><td>Off-Peak Savings</td><td style="color:#16a34a">${fmtMoney(report.todAnalysis.offPeakSavingsAmount)}</td></tr>
          <tr class="tr-total"><td>Load Shift Savings/yr</td><td>${fmtMoney(report.todAnalysis.loadShiftSavings)}</td></tr>
        </tbody>
      </table>
    </div>
  `;

  // ── PAGE 3: Recommendations + Summary + Contact ─────────────
  const recRows = report.recommendations.map((r, i) => `
    <tr>
      <td style="text-align:center;font-weight:600;color:#64748b">${i + 1}</td>
      <td>
        <span style="
          background:${priorityColor(r.priority)}22;color:${priorityColor(r.priority)};
          padding:2px 7px;border-radius:9999px;font-size:9px;font-weight:700;
          text-transform:uppercase;letter-spacing:.5px
        ">${r.priority}</span>
      </td>
      <td style="font-size:11px">${r.action}</td>
      <td style="text-align:right;font-weight:600">${fmtMoney(r.investment)}</td>
      <td style="text-align:right;color:#16a34a;font-weight:600">${fmtMoney(r.savings)}/yr</td>
      <td style="text-align:center;font-weight:600">${r.payback} yrs</td>
    </tr>
  `).join('');

  const page3 = makePageWrapper(logoUrl, `TANGEDCO Audit — ${input.consumerNumber || ''} | ${input.district}`, date, 'Page 3 of 3');
  const body3 = page3.querySelector('.body') as HTMLDivElement;
  body3.innerHTML = `
    <div class="sec"><div class="bar"></div><h2>Prioritised Recommendations</h2><div class="sec-line"></div></div>
    <table class="rec">
      <thead>
        <tr>
          <th style="text-align:center;width:28px">#</th>
          <th style="width:70px">Priority</th>
          <th>Recommended Action</th>
          <th style="text-align:right">Investment</th>
          <th style="text-align:right">Savings/yr</th>
          <th style="text-align:center">Payback</th>
        </tr>
      </thead>
      <tbody>${recRows}</tbody>
    </table>

    <div class="sec" style="margin-top:14px"><div class="bar"></div><h2>Total Savings Potential Summary</h2><div class="sec-line"></div></div>
    <table class="dt">
      <thead><tr class="th-green"><th>Savings Category</th><th>Annual Savings</th><th>Monthly Equiv.</th></tr></thead>
      <tbody>
        <tr>
          <td>Immediate (ToD + PF Correction + CD Optimisation)</td>
          <td>${fmtMoney(report.savingsSummary.immediate.total)}</td>
          <td style="color:#64748b">${fmtMoney(Math.round(report.savingsSummary.immediate.total/12))}</td>
        </tr>
        <tr>
          <td>With Solar Rooftop (${fmtN(report.solarRooftopAnalysis.recommendedSizeKW,0)} kW)</td>
          <td>${fmtMoney(report.savingsSummary.withSolarRooftop.annualSavings)}</td>
          <td style="color:#64748b">${fmtMoney(Math.round(report.savingsSummary.withSolarRooftop.annualSavings/12))}</td>
        </tr>
        <tr>
          <td>With Open Access Power (${fmt(report.openAccessAnalysis.recommendedOACapacity)} kW)</td>
          <td>${fmtMoney(report.savingsSummary.withOpenAccess.annualSavings)}</td>
          <td style="color:#64748b">${fmtMoney(Math.round(report.savingsSummary.withOpenAccess.annualSavings/12))}</td>
        </tr>
        <tr class="tr-total">
          <td style="font-size:13px">TOTAL POTENTIAL ANNUAL SAVINGS</td>
          <td style="font-size:13px">${fmtMoney(report.savingsSummary.totalPotentialSavings)}</td>
          <td style="font-size:12px;color:#15803d">${fmtMoney(Math.round(report.savingsSummary.totalPotentialSavings/12))}/mo</td>
        </tr>
      </tbody>
    </table>

    <div class="contact">
      <h3>Ready to Start Saving? Contact Soletronix Today.</h3>
      <p>Our engineers will visit your site and provide a detailed, customised proposal at no cost.</p>
      <div class="cgrid">
        <div class="ci"><div class="cil">Email</div><div class="civ">marketing.soletronix@gmail.com</div></div>
        <div class="ci"><div class="cil">Phone</div><div class="civ">+91 6374988514</div></div>
        <div class="ci"><div class="cil">Website</div><div class="civ">www.soletronix.com</div></div>
      </div>
      <div class="cta-btn">Request Free Site Survey &#8594;</div>
    </div>

    <div class="disc">
      <strong>Disclaimer:</strong> This report is prepared by Soletronix Green Energy based on the inputs provided and
      prevailing TANGEDCO tariff rates as per TNERC regulations. Actual savings may vary depending on plant conditions,
      future tariff revisions, and regulatory changes. All figures are indicative estimates for planning purposes only.
    </div>
  `;

  // Mount pages off-screen
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;';
  wrapper.appendChild(page1);
  wrapper.appendChild(page2);
  wrapper.appendChild(page3);
  document.body.appendChild(wrapper);

  // Wait for logo images to load
  const allImgs = wrapper.querySelectorAll('img');
  await Promise.all(Array.from(allImgs).map(img =>
    new Promise<void>(res => {
      if (img.complete) { res(); return; }
      img.onload = () => res();
      img.onerror = () => res();
    })
  ));

  // Capture each page with html2canvas
  const canvasOptions = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
    height: 1123,
  };

  const [c1, c2, c3] = await Promise.all([
    html2canvas(page1, canvasOptions),
    html2canvas(page2, canvasOptions),
    html2canvas(page3, canvasOptions),
  ]);

  document.body.removeChild(wrapper);
  document.head.removeChild(styleEl);

  // Build PDF
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.addImage(c1.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  doc.addPage();
  doc.addImage(c2.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  doc.addPage();
  doc.addImage(c3.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);

  const fileName = `Soletronix_TANGEDCO_Audit_${input.consumerNumber || 'Report'}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}
