// ============================================================
// WRO Philippines DBMS – Users + Audit Log Routes
// id is INT AUTO_INCREMENT. user_code is the business code.
// JWT payload now carries the integer id as userId.
// ============================================================

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// ── Users ─────────────────────────────────────────────────────

// GET /api/users  (SUPER_ADMIN only)
router.get('/', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, user_code, username, name, role, email, school_id, is_active, last_login, created_at, updated_at FROM users WHERE is_deleted = 0'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, user_code, username, name, role, email, school_id, is_active, last_login, created_at, updated_at FROM users WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users
router.post('/', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const d        = req.body;
    const userCode = d.userCode || d.user_code || `USER_${Date.now()}`;
    // Validate role
    const validRoles = ['SUPER_ADMIN', 'EVENT_ADMIN', 'STANDARD_USER'];
    const role = validRoles.includes(d.role) ? d.role : 'STANDARD_USER';
    const schoolId = d.schoolId || null;

    // ── Duplicate checks: username and email must each be unique ──────
    if (!d.username) return res.status(400).json({ success: false, error: 'Username is required.' });
    if (!d.email)    return res.status(400).json({ success: false, error: 'Email is required.' });
    if (!d.password) return res.status(400).json({ success: false, error: 'Password is required.' });

    const [dupUser] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND is_deleted = 0 LIMIT 1',
      [d.username.trim().toLowerCase()]
    );
    if (dupUser.length > 0) {
      return res.status(409).json({ success: false, error: `The username "${d.username}" is already taken.` });
    }

    const [dupEmail] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND is_deleted = 0 LIMIT 1',
      [d.email.trim().toLowerCase()]
    );
    if (dupEmail.length > 0) {
      return res.status(409).json({ success: false, error: `The email "${d.email}" is already registered.` });
    }

    const hash = await bcrypt.hash(d.password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (user_code, username, password_hash, name, role, email, school_id, is_active,
       created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [userCode, d.username, hash, d.name, role, d.email, schoolId, 1]
    );
    const [rows] = await pool.execute(
      'SELECT id, user_code, username, name, role, email, school_id, is_active FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const d = req.body;
    const validRoles = ['SUPER_ADMIN', 'EVENT_ADMIN', 'STANDARD_USER'];
    const role = validRoles.includes(d.role) ? d.role : 'STANDARD_USER';
    const schoolId = d.schoolId || null;

    // ── Duplicate checks: username and email must not be taken by another user ──
    if (d.username) {
      const [dupUser] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND is_deleted = 0 AND id != ? LIMIT 1',
        [d.username.trim().toLowerCase(), req.params.id]
      );
      if (dupUser.length > 0) {
        return res.status(409).json({ success: false, error: `The username "${d.username}" is already taken by another account.` });
      }
    }
    if (d.email) {
      const [dupEmail] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND is_deleted = 0 AND id != ? LIMIT 1',
        [d.email.trim().toLowerCase(), req.params.id]
      );
      if (dupEmail.length > 0) {
        return res.status(409).json({ success: false, error: `The email "${d.email}" is already registered to another account.` });
      }
    }

    if (d.password) {
      const hash = await bcrypt.hash(d.password, 10);
      await pool.execute(
        `UPDATE users SET username=?, password_hash=?, name=?, role=?, email=?,
         school_id=?, is_active=?, updated_at=NOW() WHERE id = ?`,
        [d.username, hash, d.name, role, d.email,
         schoolId, d.isActive ? 1 : 0, req.params.id]
      );
    } else {
      await pool.execute(
        `UPDATE users SET username=?, name=?, role=?, email=?,
         school_id=?, is_active=?, updated_at=NOW() WHERE id = ?`,
        [d.username, d.name, role, d.email,
         schoolId, d.isActive ? 1 : 0, req.params.id]
      );
    }
    const [rows] = await pool.execute(
      'SELECT id, user_code, username, name, role, email, school_id, is_active FROM users WHERE id = ?',
      [req.params.id]
    );

    if (role === 'STANDARD_USER' && schoolId) {
      await pool.execute(
        `INSERT INTO notification_log (event_type, title, message, school_id, triggered_by, created_at)
         VALUES (?,?,?,?,?,NOW())`,
        ['user_update', 'Account Updated', `Your account details were updated by an administrator.`, schoolId, req.user.username || 'Admin']
      );
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Audit Logs ────────────────────────────────────────────────

// GET /api/users/audit-logs  (SUPER_ADMIN + EVENT_ADMIN)
router.get('/audit-logs', requireRole('SUPER_ADMIN', 'EVENT_ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users/audit-logs  (internal – called after mutations)
// record_id is now expected to be an integer (surrogate PK of the affected row).
router.post('/audit-logs', async (req, res) => {
  try {
    const d       = req.body;
    const logCode = `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    // Resolve user_id: accept integer or look up by user_code
    let userId = d.userId || null;
    if (userId && (typeof userId !== 'number' && !/^\d+$/.test(String(userId)))) {
      const [ur] = await pool.execute('SELECT id FROM users WHERE user_code = ? LIMIT 1', [userId]);
      userId = ur[0]?.id || null;
    }

    await pool.execute(
      `INSERT INTO audit_logs (log_code, action, table_name, record_id, user_id, user_name, timestamp)
       VALUES (?,?,?,?,?,?,NOW())`,
      [logCode, d.action, d.table, d.recordId || null, userId, d.userName || 'System']
    );
    res.status(201).json({ success: true, logCode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Seed Status ───────────────────────────────────────────────

// GET /api/users/seed-status
router.get('/seed-status', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM users WHERE is_deleted = 0');
    res.json({ seeded: rows[0].cnt > 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
