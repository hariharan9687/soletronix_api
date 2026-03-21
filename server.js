import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  credentials: true,
}));
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
    res.json({ success: true, data: { id, ...req.body, status: 'new', createdAt: now, updatedAt: now } });
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
    res.json({ success: true, message: 'Status updated' });
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

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Soletronix API Server is running', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});