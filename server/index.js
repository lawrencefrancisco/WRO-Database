// ============================================================
// WRO Philippines DBMS – Express Server Entry Point
// ============================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const pool    = require('./db/pool');
const chatRoute = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost',
  credentials: true,
}));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/chat', chatRoute);
app.use('/api/schools',        require('./routes/schools'));
app.use('/api/coaches',        require('./routes/coaches'));
app.use('/api/students',       require('./routes/students'));
app.use('/api/teams',          require('./routes/teams'));
app.use('/api/competitions',   require('./routes/competitions'));
app.use('/api/judging',        require('./routes/judging'));
app.use('/api/awards',         require('./routes/awards'));
app.use('/api/payments',       require('./routes/payments'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/delegation',     require('./routes/delegation'));
app.use('/api/users',          require('./routes/users'));

// ── Audit log alias (standalone endpoint) ─────────────────────
app.get('/api/audit-logs', require('./middleware/auth').authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Seed status endpoint ──────────────────────────────────────
app.get('/api/seed/status', require('./middleware/auth').authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM users WHERE is_deleted = 0');
    res.json({ seeded: rows[0].cnt > 0 });
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

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, async () => {
  try {
    // Test DB connection
    await pool.execute('SELECT 1');
    console.log(`✅ WRO Philippines API Server running on http://localhost:${PORT}`);
    console.log(`📦 Connected to MySQL database: ${process.env.DB_NAME || 'wro_philippines'}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Make sure MySQL is running and the database exists.');
    console.error('   Run: mysql -u root -e "CREATE DATABASE IF NOT EXISTS wro_philippines;"');
    console.error('   Then import: mysql -u root wro_philippines < server/database.sql');
  }
});
