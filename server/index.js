// ============================================================
// WRO Philippines DBMS – Express Server Entry Point
// ============================================================

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const pool      = require('./db/pool');
const autoInitDatabase = require('./db/auto_init');
const chatRoute = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 3000;



// ── Security Middleware ───────────────────────────────────────
// Helmet sets secure HTTP headers. CSP is disabled because
// the frontend loads CDN scripts (QRCode, html5-qrcode, Google Fonts)
// that a strict CSP would block.
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limit on auth routes only (login, register, verify, forgot-password)
// Blocks brute-force OTP/password attacks. 50 attempts per 15 min is
// far more than any legitimate user needs.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
});

// ── General Middleware ────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
// 10mb limit: email attachments can be up to 5MB files,
// which become ~6.7MB when base64-encoded inside JSON.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const path = require('path');

// Clean URL Redirect Middleware
app.use((req, res, next) => {
  if (req.path.endsWith('.html') && req.path !== '/index.html') {
    const cleanPath = req.path.slice(0, -5);
    return res.redirect(301, cleanPath === '' ? '/' : cleanPath);
  }
  if (req.path === '/index.html') {
    return res.redirect(301, '/');
  }
  next();
});

// Tell Express to serve your static frontend files directly from the root directory
app.use(express.static(path.join(__dirname, '../'), { extensions: ['html'] }));

// Serve your login page on the root URL path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html')); 
});

// Serve the portal on direct announcement links
app.get('/announcements/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../portal.html'));
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/chat', chatRoute);
app.use('/api/settings',       require('./routes/settings'));
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
app.use('/api/announcements',  require('./routes/announcements'));
app.use('/api/notifications',  require('./routes/notifications'));
app.use('/api/portal',         require('./routes/portal'));
app.use('/api/dashboard',      require('./routes/dashboard'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/emails',         require('./routes/emails'));
app.use('/api/import',         require('./routes/import'));


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
