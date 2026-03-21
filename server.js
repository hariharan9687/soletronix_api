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

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  credentials: true,
}));
app.use(bodyParser.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);
console.log('Connected to SQLite database');
initializeTables();

// Create tables
function initializeTables() {
  // Leads table
  db.run(`
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
    )
  `);

  // TANGEDCO Audits table
  db.run(`
    CREATE TABLE IF NOT EXISTS tangedco_audits (
      id TEXT PRIMARY KEY,
      contactData TEXT NOT NULL,
      inputData TEXT NOT NULL,
      reportData TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  // Residential Calculators table
  db.run(`
    CREATE TABLE IF NOT EXISTS residential_calculators (
      id TEXT PRIMARY KEY,
      contactData TEXT NOT NULL,
      inputData TEXT NOT NULL,
      reportData TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  console.log('Database tables initialized');
}

// Generate ID
function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// LEADS API
// ============================================

// Get all leads
app.get('/api/leads', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      const leads = rows.map(row => ({
        ...row,
        interestedIn: row.interestedIn ? JSON.parse(row.interestedIn) : [],
        energyReport: row.energyReport ? JSON.parse(row.energyReport) : null,
        whatsappConsent: row.whatsappConsent === 1
      }));
      res.json({ success: true, data: leads });
    }
  });
});

// Get single lead
app.get('/api/leads/:id', (req, res) => {
  db.get('SELECT * FROM leads WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (!row) {
      res.status(404).json({ success: false, error: 'Lead not found' });
    } else {
      res.json({
        success: true,
        data: {
          ...row,
          interestedIn: row.interestedIn ? JSON.parse(row.interestedIn) : [],
          energyReport: row.energyReport ? JSON.parse(row.energyReport) : null,
          whatsappConsent: row.whatsappConsent === 1
        }
      });
    }
  });
});

// Create lead
app.post('/api/leads', (req, res) => {
  const {
    firstName, lastName, email, phone, address, city, state, pinCode,
    propertyType, monthlyBill, roofAge, roofType, squareFootage,
    interestedIn, currentProvider, notes, source, energyReport,
    companyName, designation, whatsappConsent
  } = req.body;

  const id = generateId();
  const now = new Date().toISOString();

  const stmt = `
    INSERT INTO leads (
      id, firstName, lastName, email, phone, address, city, state, pinCode,
      propertyType, monthlyBill, roofAge, roofType, squareFootage,
      interestedIn, currentProvider, notes, source, status, createdAt, updatedAt, energyReport,
      companyName, designation, whatsappConsent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(stmt, [
    id, firstName, lastName, email, phone, address || '', city, state || '', pinCode || '',
    propertyType || '', monthlyBill || 0, roofAge || 0, roofType || '', squareFootage || 0,
    JSON.stringify(interestedIn || []), currentProvider || '', notes || '', source || 'Energy Calculator',
    'new', now, now, energyReport ? JSON.stringify(energyReport) : null,
    companyName || '', designation || '', whatsappConsent ? 1 : 0
  ], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: { id, ...req.body, status: 'new', createdAt: now, updatedAt: now } });
    }
  });
});

// Update lead status
app.patch('/api/leads/:id/status', (req, res) => {
  const { status } = req.body;
  const now = new Date().toISOString();

  db.run('UPDATE leads SET status = ?, updatedAt = ? WHERE id = ?', [status, now, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ success: false, error: 'Lead not found' });
    } else {
      res.json({ success: true, message: 'Status updated' });
    }
  });
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
  db.run('DELETE FROM leads WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ success: false, error: 'Lead not found' });
    } else {
      res.json({ success: true, message: 'Lead deleted' });
    }
  });
});

// ============================================
// TANGEDCO AUDITS API
// ============================================

// Get all TANGEDCO audits
app.get('/api/tangedco-audits', (req, res) => {
  db.all('SELECT * FROM tangedco_audits ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      const audits = rows.map(row => ({
        ...row,
        contactData: JSON.parse(row.contactData),
        inputData: JSON.parse(row.inputData),
        reportData: row.reportData ? JSON.parse(row.reportData) : null
      }));
      res.json({ success: true, data: audits });
    }
  });
});

// Create TANGEDCO audit
app.post('/api/tangedco-audits', (req, res) => {
  const { contactData, inputData, reportData } = req.body;
  const id = generateId();
  const now = new Date().toISOString();

  const stmt = `
    INSERT INTO tangedco_audits (id, contactData, inputData, reportData, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(stmt, [
    id,
    JSON.stringify(contactData),
    JSON.stringify(inputData),
    reportData ? JSON.stringify(reportData) : null,
    now,
    now
  ], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: { id, contactData, inputData, reportData, createdAt: now } });
    }
  });
});

// ============================================
// RESIDENTIAL CALCULATORS API
// ============================================

// Get all Residential calculators
app.get('/api/residential-calculators', (req, res) => {
  db.all('SELECT * FROM residential_calculators ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      const calcs = rows.map(row => ({
        ...row,
        contactData: JSON.parse(row.contactData),
        inputData: JSON.parse(row.inputData),
        reportData: row.reportData ? JSON.parse(row.reportData) : null
      }));
      res.json({ success: true, data: calcs });
    }
  });
});

// Create Residential calculator
app.post('/api/residential-calculators', (req, res) => {
  const { contactData, inputData, reportData } = req.body;
  const id = generateId();
  const now = new Date().toISOString();

  const stmt = `
    INSERT INTO residential_calculators (id, contactData, inputData, reportData, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(stmt, [
    id,
    JSON.stringify(contactData),
    JSON.stringify(inputData),
    reportData ? JSON.stringify(reportData) : null,
    now,
    now
  ], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: { id, contactData, inputData, reportData, createdAt: now } });
    }
  });
});

// Delete TANGEDCO audit
app.delete('/api/tangedco-audits/:id', (req, res) => {
  db.run('DELETE FROM tangedco_audits WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ success: false, error: 'Audit not found' });
    } else {
      res.json({ success: true, message: 'Audit deleted' });
    }
  });
});

// Delete Residential calculator
app.delete('/api/residential-calculators/:id', (req, res) => {
  db.run('DELETE FROM residential_calculators WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ success: false, error: 'Record not found' });
    } else {
      res.json({ success: true, message: 'Record deleted' });
    }
  });
});

// ============================================
// ANALYTICS API
// ============================================

app.get('/api/analytics', (req, res) => {
  db.get(`
    SELECT 
      COUNT(*) as totalLeads,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newLeads,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contactedLeads,
      SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualifiedLeads,
      SUM(CASE WHEN status = 'proposal' THEN 1 ELSE 0 END) as proposalLeads,
      SUM(CASE WHEN status = 'closed-won' THEN 1 ELSE 0 END) as closedWonLeads,
      SUM(CASE WHEN status = 'closed-lost' THEN 1 ELSE 0 END) as closedLostLeads
    FROM leads
  `, [], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: row });
    }
  });
});

// Audit Stats
app.get('/api/audit-stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  db.get(`SELECT COUNT(*) as totalIndustrial FROM tangedco_audits`, [], (err, tRow) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    db.get(`SELECT COUNT(*) as totalResidential FROM residential_calculators`, [], (err2, rRow) => {
      if (err2) return res.status(500).json({ success: false, error: err2.message });
      db.get(`SELECT COUNT(*) as todayIndustrial FROM tangedco_audits WHERE createdAt LIKE ?`, [`${today}%`], (err3, tToday) => {
        if (err3) return res.status(500).json({ success: false, error: err3.message });
        db.get(`SELECT COUNT(*) as todayResidential FROM residential_calculators WHERE createdAt LIKE ?`, [`${today}%`], (err4, rToday) => {
          if (err4) return res.status(500).json({ success: false, error: err4.message });
          res.json({
            success: true,
            data: {
              totalIndustrial: tRow.totalIndustrial,
              totalResidential: rRow.totalResidential,
              todayIndustrial: tToday.todayIndustrial,
              todayResidential: rToday.todayResidential,
            },
          });
        });
      });
    });
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Soletronix API Server is running. Frontend is at http://localhost:5173', timestamp: new Date().toISOString() });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
