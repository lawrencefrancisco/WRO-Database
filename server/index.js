// ============================================================
// WRO Philippines DBMS – Express Server Entry Point
// ============================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const pool    = require('./db/pool');
const autoInitDatabase = require('./db/auto_init');
const chatRoute = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 3000;



// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const path = require('path');

// Tell Express to serve your static frontend files directly from the root directory
app.use(express.static(path.join(__dirname, '../')));

// Serve your login page on the root URL path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html')); 
});

// Serve the portal on direct announcement links
app.get('/announcements/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../portal.html'));
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/chat', chatRoute);
app.use('/api/schools',        require('./routes/schools'));
app.use('/api/coaches',        require('./routes/coaches'));
app.use('/api/students',       require('./routes/students'));
app.use('/api/teams',          require('./routes/teams'));
app.use('/api/competitions',   require('./routes/competitions'));
app.use('/api/seasons',        require('./routes/seasons'));
app.use('/api/judging',        require('./routes/judging'));
app.use('/api/awards',         require('./routes/awards'));
app.use('/api/payments',       require('./routes/payments'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/delegation',     require('./routes/delegation'));
app.use('/api/announcements',  require('./routes/announcements'));
app.use('/api/notifications',  require('./routes/notifications'));
app.use('/api/portal',         require('./routes/portal'));
app.use('/api/dashboard',      require('./routes/dashboard'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/emails',         require('./routes/emails'));

// ── Audit log alias (standalone endpoint) ─────────────────────
app.get('/api/audit-logs', require('./middleware/auth').authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ── Start server (init DB first, THEN accept requests) ────────
async function start() {
  try {
    // 1. Verify DB is reachable
    await pool.execute('SELECT 1');
    console.log(`📦 Connected to MySQL database: ${process.env.DB_NAME || 'defaultdb'}`);

    // 2. Create tables + seed users BEFORE the server accepts any connections
    await autoInitDatabase(pool);

    // 3. Only now start listening
    app.listen(PORT, () => {
      console.log(`✅ WRO Philippines API Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1); // Force Render to restart the service if DB is unavailable
  }
}

start();
