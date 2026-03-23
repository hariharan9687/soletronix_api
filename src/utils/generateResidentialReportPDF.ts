// ============================================================
// RESIDENTIAL SOLAR REPORT — PDF GENERATOR
// html2canvas per-page → jsPDF image approach (reliable)
// ============================================================

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { EnergyInput, EnergyReport } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
const fmtMoney = (n: number) => `&#8377;${fmt(n)}`;
const fmtN = (n: number, d = 1) => n.toFixed(d);

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
    background: linear-gradient(135deg,#431407 0%,#7c2d12 100%);
    padding: 20px 32px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 4px solid #f97316;
    flex-shrink: 0;
  }
  .header-left { display:flex; align-items:center; gap:14px; }
  .logo-wrap {
    width:50px; height:50px; border-radius:12px;
    overflow:hidden; border:2px solid #f97316;
    background:#fff; flex-shrink:0;
  }
  .logo-wrap img { width:100%; height:100%; object-fit:contain; }
  .company-name { font-size:20px; font-weight:800; color:#fff; letter-spacing:.5px; }
  .company-sub  { font-size:9px; color:#fdba74; margin-top:2px; }
  .header-right { text-align:right; }
  .report-badge {
    background:#f9731622; border:1px solid #f97316;
    color:#fb923c; font-size:9px; font-weight:700;
    padding:3px 10px; border-radius:9999px;
    text-transform:uppercase; letter-spacing:.8px;
    display:inline-block; margin-bottom:3px;
  }
  .report-title { color:#fff; font-size:12px; font-weight:600; }
  .report-date  { color:#fdba74; font-size:9px; margin-top:2px; }
  .body { padding:20px 32px; flex:1; overflow:hidden; }
  .prop-bar {
    background:#fff7ed; border:1px solid #fed7aa;
    border-radius:8px; padding:12px 16px;
    display:flex; justify-content:space-between; align-items:center;
    margin-bottom:16px;
  }
  .prop-title { font-size:14px; font-weight:700; color:#c2410c; }
  .prop-sub   { font-size:10px; color:#64748b; margin-top:2px; }
  .prop-right { text-align:right; font-size:10px; color:#64748b; }
  .sec {
    display:flex; align-items:center; gap:8px;
    margin-bottom:10px; margin-top:16px;
  }
  .sec .bar { width:4px; height:18px; background:#f97316; border-radius:2px; }
  .sec h2 {
    font-size:11px; font-weight:700; color:#0f172a;
    text-transform:uppercase; letter-spacing:.8px;
  }
  .sec-line { height:1px; background:#e2e8f0; flex:1; margin-left:8px; }
  .grid4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; }
  .sbox { border-radius:8px; padding:12px; border:1px solid transparent; }
  .sbox .lbl { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; opacity:.75; }
  .sbox .val { font-size:16px; font-weight:800; margin-top:4px; }
  .sbox .sub { font-size:9px; margin-top:3px; opacity:.7; }
  .sb1 { background:#f8fafc; border-color:#e2e8f0; color:#475569; }
  .sb2 { background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
  .sb3 { background:#f0fdf4; border-color:#bbf7d0; color:#15803d; }
  .sb4 { background:linear-gradient(135deg,#ea580c,#f97316); color:#fff; border:none; }
  .hl {
    background:linear-gradient(135deg,#fff7ed,#ffedd5);
    border:2px solid #f97316; border-radius:10px;
    padding:14px 20px; margin:12px 0;
    display:flex; align-items:center; justify-content:space-between;
  }
  .hl-label { font-size:9px; color:#9a3412; font-weight:600; text-transform:uppercase; }
  .hl-value { font-size:28px; font-weight:900; color:#c2410c; line-height:1.1; }
  .hl-sub   { font-size:10px; color:#64748b; margin-top:2px; }
  .hl-tag {
    background:#f97316; color:#fff;
    padding:3px 12px; border-radius:9999px;
    font-size:10px; font-weight:700;
    display:inline-block; margin-bottom:4px;
  }
  .hl-val2 { font-size:18px; font-weight:800; color:#c2410c; }
  .hl-sub2 { font-size:10px; color:#64748b; }
  table.dt {
    width:100%; border-collapse:collapse; font-size:11px;
    border-radius:6px; overflow:hidden; border:1px solid #e2e8f0;
  }
  table.dt thead tr { background:#1c1917; color:#fff; }
  table.dt thead th { padding:8px 12px; text-align:left; font-size:10px; font-weight:600; text-transform:uppercase; }
  table.dt thead th:last-child { text-align:right; }
  table.dt tbody tr:nth-child(even) { background:#f8fafc; }
  table.dt tbody td { padding:7px 12px; border-bottom:1px solid #f1f5f9; }
  table.dt tbody td:last-child { text-align:right; font-weight:600; }
  table.dt .tr-total { background:#fff7ed !important; }
  table.dt .tr-total td { font-size:13px; font-weight:800; color:#c2410c; border-top:2px solid #f97316; }
  table.dt .tr-sub { background:#f0fdf4 !important; }
  table.dt .tr-sub td { color:#15803d; font-weight:700; }
  .two { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .th-o { background:#c2410c !important; }
  .th-g { background:#15803d !important; }
  .stat4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:10px; }
  .stb { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; }
  .stb .sl { font-size:9px; color:#94a3b8; margin-bottom:2px; }
  .stb .sv { font-size:13px; font-weight:700; color:#0f172a; }
  .scheme {
    background:linear-gradient(135deg,#1e3a5f,#1d4ed8);
    border-radius:8px; padding:12px 16px; margin:10px 0;
    display:flex; align-items:center; gap:12px;
  }
  .scheme-ico { font-size:24px; }
  .scheme-title { font-size:12px; font-weight:700; color:#fff; }
  .scheme-sub   { font-size:10px; color:#93c5fd; margin-top:2px; }
  .contact {
    background:linear-gradient(135deg,#1c1917,#292524);
    border:2px solid #f97316; border-radius:12px;
    padding:22px 28px; margin-top:16px; text-align:center;
  }
  .contact h3 { color:#fff; font-size:16px; font-weight:800; margin-bottom:4px; }
  .contact p  { color:#94a3b8; font-size:11px; margin-bottom:14px; }
  .cgrid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:12px; }
  .ci { background:#ffffff14; border-radius:6px; padding:10px; border:1px solid #ffffff22; }
  .ci .cil { font-size:9px; color:#78716c; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
  .ci .civ { color:#fb923c; font-size:12px; font-weight:600; }
  .cta-btn {
    display:inline-block; background:linear-gradient(135deg,#f97316,#ea580c);
    color:#fff; padding:8px 24px; border-radius:9999px; font-weight:700; font-size:12px;
  }
  .disc {
    background:#fafafa; border:1px solid #e2e8f0;
    border-radius:6px; padding:10px 14px; margin-top:12px;
    font-size:9.5px; color:#94a3b8; line-height:1.5;
  }
  .footer {
    background:#f8fafc; border-top:1px solid #e2e8f0;
    padding:7px 32px;
    display:flex; justify-content:space-between; align-items:center;
    flex-shrink:0;
  }
  .footer-logo { display:flex; align-items:center; gap:5px; font-size:10px; font-weight:700; color:#f97316; }
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
      <div class="report-badge">Solar Savings Report</div>
      <div class="report-title">Residential Rooftop Solar Analysis</div>
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

export async function generateResidentialReportPDF(
  input: EnergyInput,
  report: EnergyReport
): Promise<void> {
  const logoUrl =
    window.location.origin + (import.meta.env.BASE_URL as string) + 'soletronix-logo.jpg';
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const subsidyTotal = report.centralSubsidy + report.stateSubsidy;

  // Inject CSS into document head temporarily
  const styleEl = document.createElement('style');
  styleEl.id = '__sol-pdf-style';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── PAGE 1 ──────────────────────────────────────────────
  const page1 = makePageWrapper(logoUrl, 'Green Energy — Renewable Energy as a Service | Tamil Nadu', date, 'Page 1 of 2');
  const body1 = page1.querySelector('.body') as HTMLDivElement;
  body1.innerHTML = `
    <div class="prop-bar">
      <div>
        <div class="prop-title">${input.propertyType.replace(/\b\w/g,c=>c.toUpperCase())} Property — ${input.state}</div>
        <div class="prop-sub">Roof: ${input.roofType.toUpperCase()} &nbsp;|&nbsp; Area: ${fmt(input.squareFootage)} sq.ft &nbsp;|&nbsp; Shading: ${input.shading}${input.electricVehicle?' &nbsp;|&nbsp; EV':''}${input.poolOrSpa?' &nbsp;|&nbsp; Pump':''}</div>
      </div>
      <div class="prop-right">
        <div style="font-weight:700;color:#0f172a;font-size:12px">Monthly Bill: ${fmtMoney(input.monthlyBill)}</div>
        <div>Load Sanction: ${input.loadSanction > 0 ? input.loadSanction + ' kW' : 'Not specified'}</div>
        <div>Roof Age: ${input.roofAge} yrs</div>
      </div>
    </div>

    <div class="sec"><div class="bar"></div><h2>Savings Overview</h2><div class="sec-line"></div></div>
    <div class="grid4">
      <div class="sbox sb1"><div class="lbl">Monthly Bill</div><div class="val">${fmtMoney(input.monthlyBill)}</div><div class="sub">Current cost</div></div>
      <div class="sbox sb2"><div class="lbl">Monthly Savings</div><div class="val">${fmtMoney(report.estimatedSavingsMonthly)}</div><div class="sub">After install</div></div>
      <div class="sbox sb3"><div class="lbl">Yearly Savings</div><div class="val">${fmtMoney(report.estimatedSavingsYearly)}</div><div class="sub">Annual saved</div></div>
      <div class="sbox sb4"><div class="lbl">25-Year Savings</div><div class="val">${fmtMoney(report.estimatedSavings25Year)}</div><div class="sub">Lifetime</div></div>
    </div>

    <div class="hl">
      <div>
        <div class="hl-label">Recommended System Size</div>
        <div class="hl-value">${fmtN(report.systemSizeKW, 1)} kW</div>
        <div class="hl-sub">${report.panelsNeeded} panels &nbsp;|&nbsp; ${fmt(report.roofSpaceNeeded)} sq.ft roof needed</div>
      </div>
      <div style="text-align:right">
        <div class="hl-tag">Payback Period</div>
        <div class="hl-val2">${fmtN(report.paybackYears, 1)} Years</div>
        <div class="hl-sub2">25-Year ROI: ${fmtN(report.roi25Year, 0)}%</div>
      </div>
    </div>

    <div class="sec"><div class="bar"></div><h2>Financial Breakdown</h2><div class="sec-line"></div></div>
    <table class="dt">
      <thead><tr><th>Component</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Gross Installation Cost</td><td>${fmtMoney(report.installationCost)}</td></tr>
        <tr class="tr-sub"><td>Central Govt. Subsidy (PM Surya Ghar)</td><td>- ${fmtMoney(report.centralSubsidy)}</td></tr>
        <tr class="tr-sub"><td>State Subsidy</td><td>- ${fmtMoney(report.stateSubsidy)}</td></tr>
        ${subsidyTotal > 0 ? `<tr><td style="color:#64748b;font-style:italic">Total Subsidy</td><td style="color:#15803d">- ${fmtMoney(subsidyTotal)}</td></tr>` : ''}
        <tr class="tr-total"><td>Net Cost After Subsidies</td><td>${fmtMoney(report.netCost)}</td></tr>
      </tbody>
    </table>
  `;

  // ── PAGE 2 ──────────────────────────────────────────────
  const page2 = makePageWrapper(logoUrl, 'Residential Solar Report — ' + input.state, date, 'Page 2 of 2');
  const body2 = page2.querySelector('.body') as HTMLDivElement;
  body2.innerHTML = `
    <div class="sec"><div class="bar"></div><h2>System &amp; Energy Details</h2><div class="sec-line"></div></div>
    <div class="two">
      <table class="dt">
        <thead><tr class="th-o"><th colspan="2">System Specification</th></tr></thead>
        <tbody>
          <tr><td>Recommended Size</td><td>${fmtN(report.systemSizeKW,1)} kW</td></tr>
          <tr><td>Solar Panels</td><td>${report.panelsNeeded} panels</td></tr>
          <tr><td>Roof Space Required</td><td>${fmt(report.roofSpaceNeeded)} sq.ft</td></tr>
          <tr><td>Monthly Production</td><td>${fmt(Math.round(report.solarProductionKWH/12))} kWh</td></tr>
          <tr><td>Annual Production</td><td>${fmt(report.solarProductionKWH)} kWh</td></tr>
          <tr><td>Monthly Usage</td><td>${fmt(report.monthlyUsageKWH)} kWh</td></tr>
        </tbody>
      </table>
      <table class="dt">
        <thead><tr class="th-g"><th colspan="2">Environmental Impact</th></tr></thead>
        <tbody>
          <tr><td>Annual CO&#8322; Offset</td><td style="color:#15803d;font-weight:700">${fmtN(report.co2OffsetTons,1)} Tons</td></tr>
          <tr><td>Equivalent Trees</td><td style="color:#15803d;font-weight:700">${fmt(report.treesEquivalent)}</td></tr>
          <tr><td>Solar Coverage</td><td>${fmtN(Math.min(100,(report.solarProductionKWH/12/report.monthlyUsageKWH)*100),0)}%</td></tr>
          <tr><td>Grid Dependence Cut</td><td style="color:#15803d">${fmtN(Math.min(100,(report.solarProductionKWH/12/report.monthlyUsageKWH)*100),0)}%</td></tr>
          <tr><td>25-Year ROI</td><td style="color:#c2410c;font-weight:700">${fmtN(report.roi25Year,0)}%</td></tr>
          <tr><td>Payback Period</td><td style="font-weight:700">${fmtN(report.paybackYears,1)} yrs</td></tr>
        </tbody>
      </table>
    </div>

    <div class="scheme">
      <div class="scheme-ico">&#127470;&#127475;</div>
      <div>
        <div class="scheme-title">PM Surya Ghar Muft Bijli Yojana</div>
        <div class="scheme-sub">Central subsidy ${fmtMoney(report.centralSubsidy)} + State subsidy ${fmtMoney(report.stateSubsidy)} for ${input.state}. Net cost: <strong style="color:#fff">${fmtMoney(report.netCost)}</strong></div>
      </div>
    </div>

    <div class="sec"><div class="bar"></div><h2>25-Year Financial Projection</h2><div class="sec-line"></div></div>
    <div class="stat4">
      <div class="stb"><div class="sl">Year 1 Savings</div><div class="sv" style="color:#c2410c">${fmtMoney(report.estimatedSavingsYearly)}</div></div>
      <div class="stb"><div class="sl">Year 5 Savings</div><div class="sv" style="color:#c2410c">${fmtMoney(Math.round(report.estimatedSavingsYearly*5*1.05))}</div></div>
      <div class="stb"><div class="sl">Year 10 Savings</div><div class="sv" style="color:#c2410c">${fmtMoney(Math.round(report.estimatedSavingsYearly*10*1.12))}</div></div>
      <div class="stb"><div class="sl">25-Year Total</div><div class="sv" style="color:#15803d">${fmtMoney(report.estimatedSavings25Year)}</div></div>
    </div>

    <div class="contact">
      <h3>Get Your Customised Solar Installation Quote</h3>
      <p>Our experts will visit your site and provide the best financing plan — free, no obligation.</p>
      <div class="cgrid">
        <div class="ci"><div class="cil">Email</div><div class="civ">marketing.soletronix@gmail.com</div></div>
        <div class="ci"><div class="cil">Phone</div><div class="civ">+91 6374988514</div></div>
        <div class="ci"><div class="cil">Website</div><div class="civ">www.soletronix.com</div></div>
      </div>
      <div class="cta-btn">Request Free Site Survey &#8594;</div>
    </div>

    <div class="disc"><strong>Disclaimer:</strong> This report is prepared by Soletronix Green Energy based on inputs provided and standard solar irradiance data for ${input.state}. Actual savings may vary. All figures are indicative estimates for planning purposes only.</div>
  `;

  // Mount pages off-screen
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;';
  wrapper.appendChild(page1);
  wrapper.appendChild(page2);
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

  const [c1, c2] = await Promise.all([
    html2canvas(page1, canvasOptions),
    html2canvas(page2, canvasOptions),
  ]);

  document.body.removeChild(wrapper);
  document.head.removeChild(styleEl);

  // Build PDF
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.addImage(c1.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  doc.addPage();
  doc.addImage(c2.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);

  const fileName = `Soletronix_Solar_Report_${input.state.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}
