import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);
console.log('Connected to SQLite database');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    companyName TEXT,
    designation TEXT,
    city TEXT NOT NULL,
    whatsappConsent INTEGER DEFAULT 1,
    address TEXT,
    state TEXT,
    pinCode TEXT,
    propertyType TEXT,
    monthlyBill REAL,
    roofAge INTEGER,
    roofType TEXT,
    squareFootage REAL,
    interestedIn TEXT,
    currentProvider TEXT,
    notes TEXT,
    status TEXT DEFAULT 'new',
    source TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    energyReport TEXT
  );
  CREATE TABLE IF NOT EXISTS tangedco_audits (
    id TEXT PRIMARY KEY,
    contactData TEXT NOT NULL,
    inputData TEXT NOT NULL,
    reportData TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS residential_calculators (
    id TEXT PRIMARY KEY,
    contactData TEXT NOT NULL,
    inputData TEXT NOT NULL,
    reportData TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );
`);
console.log('Database tables initialized');

function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================
// NOTIFICATIONS — Email (Nodemailer/Gmail SMTP)
// ============================================================

// Log env var presence at startup so Railway logs confirm config
console.log('📧 GMAIL_USER set:', !!process.env.GMAIL_USER);
console.log('🔑 GMAIL_APP_PASSWORD set:', !!process.env.GMAIL_APP_PASSWORD);

// Create transporter — port 587 STARTTLS + IPv4 forced (Railway blocks port 465 and IPv6)
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,        // STARTTLS (not SSL)
    requireTLS: true,
    auth: { user, pass },
    family: 4,            // Force IPv4 — Railway IPv6 is unreachable
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function buildEmailHTML(lead) {
  const bill = lead.monthlyBill ? `Rs.${Number(lead.monthlyBill).toLocaleString('en-IN')}` : 'N/A';
  const name = `${lead.firstName} ${lead.lastName}`.trim();
  const interested = Array.isArray(lead.interestedIn)
    ? lead.interestedIn.join(', ')
    : (lead.interestedIn || 'N/A');

  const rows = [
    ['Name', name],
    ['Phone', lead.phone],
    ['Email', lead.email],
    ['City', `${lead.city}${lead.state ? ', ' + lead.state : ''}`],
    ['Monthly Bill', bill],
    ['Company', lead.companyName || 'N/A'],
    ['Interested In', interested],
    ['Source', lead.source || 'Energy Calculator'],
  ];

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
      <div style="background:#1c1917;padding:20px 24px;border-radius:8px;border-bottom:4px solid #f97316;margin-bottom:20px;">
        <h2 style="color:#fff;margin:0;font-size:20px;">New Lead - Soletronix</h2>
        <p style="color:#fdba74;margin:6px 0 0;font-size:13px;">A new enquiry has been submitted via the Energy Tool</p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:8px;">
        ${rows.map(([label, value], i) => `
          <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
            <td style="padding:10px 16px;font-weight:600;color:#64748b;font-size:13px;width:150px;border-bottom:1px solid #f1f5f9">${label}</td>
            <td style="padding:10px 16px;color:#0f172a;font-size:13px;border-bottom:1px solid #f1f5f9">${value}</td>
          </tr>
        `).join('')}
      </table>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://soletronix.com/audit/admin.html"
           style="display:inline-block;background:#f97316;color:#fff;padding:12px 32px;border-radius:9999px;font-weight:700;font-size:13px;text-decoration:none;">
          View in Admin Panel
        </a>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:20px;">
        Soletronix Green Energy | marketing.soletronix@gmail.com | +91 6374988514
      </p>
    </div>
  `;
}


async function sendEmailNotification(lead) {
  const user = process.env.GMAIL_USER;
  const to   = process.env.NOTIFY_EMAIL || user;
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('⚠️  Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD not set');
    return;
  }

  try {
    const name = `${lead.firstName} ${lead.lastName}`.trim();
    const info = await transporter.sendMail({
      from: `"Soletronix Leads" <${user}>`,
      to,
      subject: `New Lead: ${name} - ${lead.city}`,
      html: buildEmailHTML(lead),
    });
    console.log(`📧 Email sent — messageId: ${info.messageId}`);
  } catch (err) {
    console.error('❌ Email notification failed:', err.message);
    console.error('   Code:', err.code, '| Response:', err.response);
  }
}


async function sendNotifications(lead) {
  await sendEmailNotification(lead);
}

// ── Test endpoint: GET /api/test-notification
// Call this from browser to verify email without submitting a lead
app.get('/api/test-notification', async (req, res) => {
  const testLead = {
    firstName: 'Test', lastName: 'Lead',
    phone: '+91 9999999999',
    email: 'test@soletronix.com',
    city: 'Chennai', state: 'Tamil Nadu',
    monthlyBill: 5000,
    companyName: 'Test Company',
    interestedIn: ['Solar Rooftop'],
    source: 'Test Notification',
  };
  console.log('🧪 Test notification triggered');
  await sendNotifications(testLead);
  res.json({ success: true, message: 'Test notification sent — check Railway logs and your email' });
});

// LEADS
app.get('/api/leads', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM leads ORDER BY createdAt DESC').all();
    const leads = rows.map(row => ({
      ...row,
      interestedIn: row.interestedIn ? JSON.parse(row.interestedIn) : [],
      energyReport: row.energyReport ? JSON.parse(row.energyReport) : null,
      whatsappConsent: row.whatsappConsent === 1
    }));
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/leads/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: {
      ...row,
      interestedIn: row.interestedIn ? JSON.parse(row.interestedIn) : [],
      energyReport: row.energyReport ? JSON.parse(row.energyReport) : null,
      whatsappConsent: row.whatsappConsent === 1
    }});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/leads', (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, address, city, state, pinCode,
      propertyType, monthlyBill, roofAge, roofType, squareFootage,
      interestedIn, currentProvider, notes, source, energyReport,
      companyName, designation, whatsappConsent
    } = req.body;
    const id = generateId();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO leads (
        id, firstName, lastName, email, phone, address, city, state, pinCode,
        propertyType, monthlyBill, roofAge, roofType, squareFootage,
        interestedIn, currentProvider, notes, source, status, createdAt, updatedAt, energyReport,
        companyName, designation, whatsappConsent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, firstName, lastName, email, phone, address || '', city, state || '', pinCode || '',
      propertyType || '', monthlyBill || 0, roofAge || 0, roofType || '', squareFootage || 0,
      JSON.stringify(interestedIn || []), currentProvider || '', notes || '', source || 'Energy Calculator',
      'new', now, now, energyReport ? JSON.stringify(energyReport) : null,
      companyName || '', designation || '', whatsappConsent ? 1 : 0
    );
    const savedLead = { id, ...req.body, status: 'new', createdAt: now, updatedAt: now };
    res.json({ success: true, data: savedLead });

    // Fire-and-forget notifications (don't block the response)
    sendNotifications({
      ...savedLead,
      interestedIn: interestedIn || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/leads/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const now = new Date().toISOString();
    const result = db.prepare('UPDATE leads SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Lead not found' });
    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/leads/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TANGEDCO AUDITS
app.get('/api/tangedco-audits', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tangedco_audits ORDER BY createdAt DESC').all();
    const audits = rows.map(row => ({
      ...row,
      contactData: JSON.parse(row.contactData),
      inputData: JSON.parse(row.inputData),
      reportData: row.reportData ? JSON.parse(row.reportData) : null
    }));
    res.json({ success: true, data: audits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tangedco-audits', (req, res) => {
  try {
    const { contactData, inputData, reportData } = req.body;
    const id = generateId();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO tangedco_audits (id, contactData, inputData, reportData, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, JSON.stringify(contactData), JSON.stringify(inputData), reportData ? JSON.stringify(reportData) : null, now, now);
    res.json({ success: true, data: { id, contactData, inputData, reportData, createdAt: now } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/tangedco-audits/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM tangedco_audits WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Audit not found' });
    res.json({ success: true, message: 'Audit deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// RESIDENTIAL CALCULATORS
app.get('/api/residential-calculators', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM residential_calculators ORDER BY createdAt DESC').all();
    const calcs = rows.map(row => ({
      ...row,
      contactData: JSON.parse(row.contactData),
      inputData: JSON.parse(row.inputData),
      reportData: row.reportData ? JSON.parse(row.reportData) : null
    }));
    res.json({ success: true, data: calcs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/residential-calculators', (req, res) => {
  try {
    const { contactData, inputData, reportData } = req.body;
    const id = generateId();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO residential_calculators (id, contactData, inputData, reportData, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, JSON.stringify(contactData), JSON.stringify(inputData), reportData ? JSON.stringify(reportData) : null, now, now);
    res.json({ success: true, data: { id, contactData, inputData, reportData, createdAt: now } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/residential-calculators/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM residential_calculators WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ANALYTICS
app.get('/api/analytics', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT 
        COUNT(*) as totalLeads,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newLeads,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contactedLeads,
        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualifiedLeads,
        SUM(CASE WHEN status = 'proposal' THEN 1 ELSE 0 END) as proposalLeads,
        SUM(CASE WHEN status = 'closed-won' THEN 1 ELSE 0 END) as closedWonLeads,
        SUM(CASE WHEN status = 'closed-lost' THEN 1 ELSE 0 END) as closedLostLeads
      FROM leads
    `).get();
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/audit-stats', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const totalIndustrial = db.prepare('SELECT COUNT(*) as count FROM tangedco_audits').get().count;
    const totalResidential = db.prepare('SELECT COUNT(*) as count FROM residential_calculators').get().count;
    const todayIndustrial = db.prepare('SELECT COUNT(*) as count FROM tangedco_audits WHERE createdAt LIKE ?').get(`${today}%`).count;
    const todayResidential = db.prepare('SELECT COUNT(*) as count FROM residential_calculators WHERE createdAt LIKE ?').get(`${today}%`).count;
    res.json({ success: true, data: { totalIndustrial, totalResidential, todayIndustrial, todayResidential } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// LOGS
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT
  );
`);

app.get('/api/logs', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500').all();
    const logs = rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : undefined,
    }));
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/logs/sync', (req, res) => {
  try {
    const { logs } = req.body;
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.json({ success: true, data: { synced: 0 } });
    }
    const insert = db.prepare(`
      INSERT OR IGNORE INTO activity_logs (id, timestamp, type, severity, message, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((entries) => {
      for (const log of entries) {
        insert.run(log.id, log.timestamp, log.type, log.severity, log.message,
          log.details ? JSON.stringify(log.details) : null);
      }
    });
    insertMany(logs);
    res.json({ success: true, data: { synced: logs.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/logs', (req, res) => {
  try {
    db.prepare('DELETE FROM activity_logs').run();
    res.json({ success: true, message: 'Logs cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Soletronix API Server is running', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});