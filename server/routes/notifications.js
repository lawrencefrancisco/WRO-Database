// ============================================================
// WRO Philippines DBMS – Notification Log Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET all notification logs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT n.*, t.team_name, s.school_name
       FROM notification_log n
       LEFT JOIN teams t ON t.id = n.team_id
       LEFT JOIN schools s ON s.id = n.school_id
       ORDER BY n.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create notification log entry
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const [result] = await pool.execute(
      `INSERT INTO notification_log (event_type, title, message, team_id, school_id, triggered_by, created_at)
       VALUES (?,?,?,?,?,?,NOW())`,
      [d.eventType || 'system', d.title, d.message || '', d.teamId || null, d.schoolId || null, d.triggeredBy || 'system']
    );
    const [rows] = await pool.execute('SELECT * FROM notification_log WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT mark as read
router.put('/:id/read', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notification_log SET is_read=1, read_at=NOW() WHERE id = ?', [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT mark all as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await pool.execute('UPDATE notification_log SET is_read=1, read_at=NOW() WHERE is_read=0');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
