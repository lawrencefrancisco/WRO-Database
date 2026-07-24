// ============================================================
// WRO Philippines DBMS – Standard User Portal Routes
// Now uses user_team_links for data scoping (QR-based linking)
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);
router.use(requireRole('STANDARD_USER'));

// Helper: get current user id
const uid = req => req.user.userId || req.user.id;

// Helper: get all team IDs the user is linked to
async function getLinkedTeamIds(userId) {
  const [rows] = await pool.execute(
    'SELECT team_id FROM user_team_links WHERE user_id = ?', [userId]
  );
  return rows.map(r => r.team_id);
}

// ── GET /api/portal/me ────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.user_code, u.username, u.name, u.email, u.role, u.is_active, u.last_login
       FROM users u
       WHERE u.id = ? AND u.is_deleted = 0`,
      [uid(req)]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/dashboard ─────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const teamIds = await getLinkedTeamIds(uid(req));

    let teams = [], payments = [];

    if (teamIds.length > 0) {
      const ph = teamIds.map(() => '?').join(',');
      [teams] = await pool.execute(
        `SELECT id, team_name, category, age_group, qualification_status, payment_status, registration_status
         FROM teams WHERE id IN (${ph}) AND is_deleted = 0`,
        teamIds
      );
      [payments] = await pool.execute(
        `SELECT p.id, p.team_id, p.amount_paid, p.status, t.team_name
         FROM payments p
         JOIN teams t ON t.id = p.team_id
         WHERE p.team_id IN (${ph}) AND p.is_deleted = 0`,
        teamIds
      );
    }

    const [announcements] = await pool.execute(
      `SELECT a.id, a.title, a.image_url, a.category, a.created_at,
              IF(ar.user_id IS NOT NULL, 1, 0) AS is_read
       FROM announcements a
       LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = ?
       WHERE a.status = 'published' AND a.is_deleted = 0
       ORDER BY a.created_at DESC LIMIT 5`,
      [uid(req)]
    );

    const paid      = teams.filter(t => t.payment_status === 'paid').length;
    const partial   = teams.filter(t => t.payment_status === 'partial').length;
    const unpaid    = teams.filter(t => t.payment_status === 'unpaid').length;
    const qualified = teams.filter(t => t.qualification_status === 'qualified').length;

    res.json({
      totalTeams:   teams.length,
      qualified, paid, partial, unpaid,
      recentAnnouncements:  announcements,
      unreadAnnouncements:  announcements.filter(a => !a.is_read).length,
      totalPayments: payments.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/portal/link-team ────────────────────────────────
// Scan/upload a QR code → link user to team
router.post('/link-team', async (req, res) => {
  try {
    const { qr_token } = req.body;
    if (!qr_token) return res.status(400).json({ success: false, error: 'QR token is required.' });

    // Look up the team by token
    const [teams] = await pool.execute(
      `SELECT t.id, t.team_name, t.season, t.category, t.age_group,
              t.registration_status, t.payment_status, t.qualification_status,
              s.school_name, c.full_name AS coach_name
       FROM teams t
       LEFT JOIN schools s ON s.id = t.school_id
       LEFT JOIN coaches c ON c.id = t.coach_id
       WHERE t.qr_token = ? AND t.is_deleted = 0`,
      [qr_token]
    );
    if (!teams[0]) return res.status(404).json({ success: false, error: 'Invalid or expired QR code.' });

    const team = teams[0];

    // Insert link (ignore if already linked to this team)
    await pool.execute(
      'INSERT IGNORE INTO user_team_links (user_id, team_id) VALUES (?, ?)',
      [uid(req), team.id]
    );

    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/portal/link-team ──────────────────────────────
// Unlink the authenticated user from a specific team
router.delete('/link-team', async (req, res) => {
  try {
    const { team_id } = req.body;
    if (!team_id) return res.status(400).json({ success: false, error: 'team_id is required.' });

    const [result] = await pool.execute(
      'DELETE FROM user_team_links WHERE user_id = ? AND team_id = ?',
      [uid(req), team_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Link not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/teams ─────────────────────────────────────
// Returns all teams the user is linked to (with full details)
router.get('/teams', async (req, res) => {
  try {
    const teamIds = await getLinkedTeamIds(uid(req));
    if (teamIds.length === 0) return res.json([]);

    const ph = teamIds.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT t.id, t.team_name, t.team_code, t.category, t.age_group, t.season,
              t.registration_status, t.payment_status, t.qualification_status, t.status,
              c.full_name AS coach_name, c.mobile AS coach_mobile,
              comp.name AS competition_name,
              s.school_name
       FROM teams t
       LEFT JOIN coaches c    ON c.id   = t.coach_id
       LEFT JOIN competitions comp ON comp.id = t.competition_id
       LEFT JOIN schools s    ON s.id   = t.school_id
       WHERE t.id IN (${ph}) AND t.is_deleted = 0
       ORDER BY t.team_name ASC`,
      teamIds
    );

    // Attach members for each team
    if (rows.length > 0) {
      const [memberRows] = await pool.execute(
        `SELECT tm.team_id, s.id AS student_id, s.full_name, s.grade_level, s.gender,
                sc.school_name AS student_school
         FROM team_members tm
         JOIN students s ON s.id = tm.student_id AND s.is_deleted = 0
         LEFT JOIN schools sc ON sc.id = s.school_id
         WHERE tm.team_id IN (${ph})`,
        teamIds
      );
      const memberMap = {};
      memberRows.forEach(m => {
        if (!memberMap[m.team_id]) memberMap[m.team_id] = [];
        memberMap[m.team_id].push(m);
      });
      rows.forEach(t => { t.members = memberMap[t.id] || []; });
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/payments ──────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const teamIds = await getLinkedTeamIds(uid(req));
    if (teamIds.length === 0) return res.json([]);

    const ph = teamIds.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT p.id, p.amount_paid, p.balance, p.registration_fee, p.status,
              p.payment_method, p.payment_date, p.or_number, p.scholarship,
              t.team_name, t.category
       FROM payments p
       JOIN teams t ON t.id = p.team_id
       WHERE p.team_id IN (${ph}) AND p.is_deleted = 0
       ORDER BY p.payment_date DESC`,
      teamIds
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/announcements ────────────────────────────
router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.announcement_code, a.title, a.body, a.image_url,
              a.category, a.recipients, a.status, a.created_at,
              IF(ar.user_id IS NOT NULL, 1, 0) AS is_read
       FROM announcements a
       LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = ?
       WHERE a.status = 'published' AND a.is_deleted = 0
       ORDER BY a.created_at DESC`,
      [uid(req)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/announcements/:id/read ────────────────────
router.put('/announcements/:id/read', async (req, res) => {
  try {
    await pool.execute(
      'INSERT IGNORE INTO announcement_reads (user_id, announcement_id) VALUES (?, ?)',
      [uid(req), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/announcements/mark-all-read ───────────────
router.put('/announcements/mark-all-read', async (req, res) => {
  try {
    const [anns] = await pool.execute(
      "SELECT id FROM announcements WHERE status = 'published' AND is_deleted = 0"
    );
    for (const a of anns) {
      await pool.execute(
        'INSERT IGNORE INTO announcement_reads (user_id, announcement_id) VALUES (?, ?)',
        [uid(req), a.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('mark-all-read error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/profile ───────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const d      = req.body;
    const bcrypt = require('bcryptjs');
    if (d.password) {
      const hash = await bcrypt.hash(d.password, 10);
      await pool.execute(
        'UPDATE users SET name=?, email=?, password_hash=?, updated_at=NOW() WHERE id=?',
        [d.name, d.email || '', hash, uid(req)]
      );
    } else {
      await pool.execute(
        'UPDATE users SET name=?, email=?, updated_at=NOW() WHERE id=?',
        [d.name, d.email || '', uid(req)]
      );
    }
    const [rows] = await pool.execute(
      'SELECT id, user_code, username, name, email, role FROM users WHERE id = ?',
      [uid(req)]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/portal/notifications ─────────────────────────────
router.get('/notifications', async (req, res) => {
  try {
    const teamIds = await getLinkedTeamIds(uid(req));

    // Collect all school IDs from linked teams for notifications
    let rows = [];
    if (teamIds.length > 0) {
      const ph = teamIds.map(() => '?').join(',');
      const [schoolRows] = await pool.execute(
        `SELECT DISTINCT school_id FROM teams WHERE id IN (${ph}) AND school_id IS NOT NULL`,
        teamIds
      );
      const schoolIds = schoolRows.map(r => r.school_id);
      if (schoolIds.length > 0) {
        const sph = schoolIds.map(() => '?').join(',');
        [rows] = await pool.execute(
          `SELECT n.*, t.team_name
           FROM notification_log n
           LEFT JOIN teams t ON t.id = n.team_id
           WHERE n.school_id IN (${sph})
           ORDER BY n.created_at DESC`,
          schoolIds
        );
      }
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/notifications/:id/read ────────────────────
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'UPDATE notification_log SET is_read=1, read_at=NOW() WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: result.affectedRows > 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/portal/notifications/read-all ────────────────────
router.put('/notifications/read-all', async (req, res) => {
  try {
    const teamIds = await getLinkedTeamIds(uid(req));
    if (teamIds.length > 0) {
      const ph = teamIds.map(() => '?').join(',');
      const [schoolRows] = await pool.execute(
        `SELECT DISTINCT school_id FROM teams WHERE id IN (${ph}) AND school_id IS NOT NULL`,
        teamIds
      );
      const schoolIds = schoolRows.map(r => r.school_id);
      if (schoolIds.length > 0) {
        const sph = schoolIds.map(() => '?').join(',');
        await pool.execute(
          `UPDATE notification_log SET is_read=1, read_at=NOW() WHERE school_id IN (${sph}) AND is_read=0`,
          schoolIds
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
