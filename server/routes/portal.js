// ============================================================
// WRO Philippines DBMS – Standard User Portal Routes
// All endpoints are scoped to the logged-in user's school
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);
router.use(requireRole('STANDARD_USER'));

// ── GET /api/portal/me ────────────────────────────────────────
// Returns full profile of the current portal user, including linked school
router.get('/me', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.user_code, u.username, u.name, u.email, u.role, u.is_active, u.last_login,
              u.school_id, s.school_name, s.region, s.province, s.city, s.contact_number, s.email AS school_email
       FROM users u
       LEFT JOIN schools s ON s.id = u.school_id
       WHERE u.id = ? AND u.is_deleted = 0`,
      [(req.user.userId || req.user.id)]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/dashboard ─────────────────────────────────
// Returns KPI data scoped to the user's school
router.get('/dashboard', async (req, res) => {
  try {
    const [userRows] = await pool.execute(
      'SELECT school_id FROM users WHERE id = ? AND is_deleted = 0', [(req.user.userId || req.user.id)]
    );
    const schoolId = userRows[0]?.school_id || null;

    let teams = [], payments = [], announcements = [];

    if (schoolId) {
      [teams]  = await pool.execute(
        'SELECT id, team_name, category, age_group, qualification_status, payment_status, registration_status FROM teams WHERE school_id = ? AND is_deleted = 0',
        [schoolId]
      );
      [payments] = await pool.execute(
        `SELECT p.id, p.team_id, p.amount_paid, p.status, t.team_name
         FROM payments p
         JOIN teams t ON t.id = p.team_id
         WHERE t.school_id = ? AND p.is_deleted = 0`,
        [schoolId]
      );
    }

    [announcements] = await pool.execute(
      `SELECT a.id, a.title, a.image_url, a.category, a.created_at,
              IF(ar.user_id IS NOT NULL, 1, 0) AS is_read
       FROM announcements a
       LEFT JOIN announcement_reads ar
         ON ar.announcement_id = a.id AND ar.user_id = ?
       WHERE a.status = 'published' AND a.is_deleted = 0
       ORDER BY a.created_at DESC LIMIT 5`,
      [(req.user.userId || req.user.id)]
    );

    const paid    = teams.filter(t => t.payment_status === 'paid').length;
    const partial = teams.filter(t => t.payment_status === 'partial').length;
    const unpaid  = teams.filter(t => t.payment_status === 'unpaid').length;
    const qualified = teams.filter(t => t.qualification_status === 'qualified').length;

    res.json({
      schoolId,
      totalTeams:   teams.length,
      qualified,
      paid, partial, unpaid,
      recentAnnouncements: announcements,
      unreadAnnouncements: announcements.filter(a => !a.is_read).length,
      totalPayments: payments.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/teams ─────────────────────────────────────
// Returns teams linked to the user's school
router.get('/teams', async (req, res) => {
  try {
    const [userRows] = await pool.execute(
      'SELECT school_id FROM users WHERE id = ? AND is_deleted = 0', [(req.user.userId || req.user.id)]
    );
    const schoolId = userRows[0]?.school_id || null;
    if (!schoolId) return res.json([]);

    const [rows] = await pool.execute(
      `SELECT t.id, t.team_name, t.category, t.age_group, t.season,
              t.registration_status, t.payment_status, t.qualification_status, t.status,
              c.full_name AS coach_name,
              comp.name AS competition_name
       FROM teams t
       LEFT JOIN coaches c ON c.id = t.coach_id
       LEFT JOIN competitions comp ON comp.id = t.competition_id
       WHERE t.school_id = ? AND t.is_deleted = 0
       ORDER BY t.team_name ASC`,
      [schoolId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/payments ──────────────────────────────────
// Returns payment records for the user's school's teams
router.get('/payments', async (req, res) => {
  try {
    const [userRows] = await pool.execute(
      'SELECT school_id FROM users WHERE id = ? AND is_deleted = 0', [(req.user.userId || req.user.id)]
    );
    const schoolId = userRows[0]?.school_id || null;
    if (!schoolId) return res.json([]);

    const [rows] = await pool.execute(
      `SELECT p.id, p.amount_paid, p.balance, p.registration_fee, p.status,
              p.payment_method, p.payment_date, p.or_number, p.scholarship,
              t.team_name, t.category
       FROM payments p
       JOIN teams t ON t.id = p.team_id
       WHERE t.school_id = ? AND p.is_deleted = 0
       ORDER BY p.payment_date DESC`,
      [schoolId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/announcements ────────────────────────────
// Returns published announcements with per-user read status
router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.announcement_code, a.title, a.body, a.image_url,
              a.category, a.recipients, a.status, a.created_at,
              IF(ar.user_id IS NOT NULL, 1, 0) AS is_read
       FROM announcements a
       LEFT JOIN announcement_reads ar
         ON ar.announcement_id = a.id AND ar.user_id = ?
       WHERE a.status = 'published' AND a.is_deleted = 0
       ORDER BY a.created_at DESC`,
      [(req.user.userId || req.user.id)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/announcements/:id/read ────────────────────
// Marks a single announcement as read for the current user
router.put('/announcements/:id/read', async (req, res) => {
  try {
    await pool.execute(
      'INSERT IGNORE INTO announcement_reads (user_id, announcement_id) VALUES (?, ?)',
      [(req.user.userId || req.user.id) || req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/announcements/mark-all-read ───────────────
// Marks all currently published announcements as read for the current user
router.put('/announcements/mark-all-read', async (req, res) => {
  try {
    const [anns] = await pool.execute(
      "SELECT id FROM announcements WHERE status = 'published' AND is_deleted = 0"
    );
    if (anns.length > 0) {
      const values = anns.map(a => [(req.user.userId || req.user.id) || req.user.id, a.id]);
      for (const val of values) {
        await pool.execute(
          'INSERT IGNORE INTO announcement_reads (user_id, announcement_id) VALUES (?, ?)',
          val
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('mark-all-read error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/profile ───────────────────────────────────
// Standard user can update their own name, email, and password
router.put('/profile', async (req, res) => {
  try {
    const d    = req.body;
    const bcrypt = require('bcryptjs');

    if (d.password) {
      const hash = await bcrypt.hash(d.password, 10);
      await pool.execute(
        'UPDATE users SET name=?, email=?, password_hash=?, updated_at=NOW() WHERE id=?',
        [d.name, d.email || '', hash, (req.user.userId || req.user.id)]
      );
    } else {
      await pool.execute(
        'UPDATE users SET name=?, email=?, updated_at=NOW() WHERE id=?',
        [d.name, d.email || '', (req.user.userId || req.user.id)]
      );
    }

    const [rows] = await pool.execute(
      'SELECT id, user_code, username, name, email, role, school_id FROM users WHERE id = ?',
      [(req.user.userId || req.user.id)]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/notifications ─────────────────────────────
// Returns notification history for the user's school
router.get('/notifications', async (req, res) => {
  try {
    const [userRows] = await pool.execute(
      'SELECT school_id FROM users WHERE id = ? AND is_deleted = 0', [(req.user.userId || req.user.id)]
    );
    const schoolId = userRows[0]?.school_id || null;
    if (!schoolId) return res.json([]);

    const [rows] = await pool.execute(
      `SELECT n.*, t.team_name
       FROM notification_log n
       LEFT JOIN teams t ON t.id = n.team_id
       WHERE n.school_id = ?
       ORDER BY n.created_at DESC`,
      [schoolId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/notifications/:id/read ────────────────────
// Marks a specific notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const [userRows] = await pool.execute(
      'SELECT school_id FROM users WHERE id = ? AND is_deleted = 0', [(req.user.userId || req.user.id)]
    );
    const schoolId = userRows[0]?.school_id || null;

    const [result] = await pool.execute(
      'UPDATE notification_log SET is_read=1, read_at=NOW() WHERE id = ? AND school_id = ?', 
      [req.params.id, schoolId]
    );
    res.json({ success: result.affectedRows > 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/notifications/read-all ────────────────────
// Marks all notifications as read for the user's school
router.put('/notifications/read-all', async (req, res) => {
  try {
    const [userRows] = await pool.execute(
      'SELECT school_id FROM users WHERE id = ? AND is_deleted = 0', [(req.user.userId || req.user.id)]
    );
    const schoolId = userRows[0]?.school_id || null;

    await pool.execute(
      'UPDATE notification_log SET is_read=1, read_at=NOW() WHERE school_id = ? AND is_read=0',
      [schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
