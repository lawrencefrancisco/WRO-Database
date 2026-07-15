// ============================================================
// WRO Philippines DBMS – Communications Routes
// id is INT AUTO_INCREMENT. comm_code is the business code.
// team_id is INT UNSIGNED FK → teams.id
// email_history and sms_history stored as JSON arrays.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Helper: resolve integer FK from either integer or business-code string
async function resolveTeamId(value) {
  if (!value) return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) return parseInt(value, 10);
  const [rows] = await pool.execute('SELECT id FROM teams WHERE team_code = ? LIMIT 1', [value]);
  return rows[0]?.id || null;
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM communications WHERE is_deleted = 0');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM communications WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d        = req.body;
    const commCode = d.commCode || d.comm_code || `COM_${Date.now()}`;
    const teamId   = await resolveTeamId(d.teamId);

    const [result] = await pool.execute(
      `INSERT INTO communications (comm_code, team_id, registration_confirmation,
       payment_confirmation, certificate_sent, email_history, sms_history,
       announcement_received, feedback_submitted, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [commCode, teamId,
       d.registrationConfirmation ? 1 : 0, d.paymentConfirmation ? 1 : 0,
       d.certificateSent ? 1 : 0,
       JSON.stringify(d.emailHistory || []),
       JSON.stringify(d.smsHistory   || []),
       d.announcementReceived ? 1 : 0, d.feedbackSubmitted ? 1 : 0,
       d.status || 'active']
    );
    const [rows] = await pool.execute('SELECT * FROM communications WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const d      = req.body;
    const teamId = await resolveTeamId(d.teamId);

    await pool.execute(
      `UPDATE communications SET comm_code=?, team_id=?, registration_confirmation=?,
       payment_confirmation=?, certificate_sent=?, email_history=?, sms_history=?,
       announcement_received=?, feedback_submitted=?, status=?, updated_at=NOW() WHERE id = ?`,
      [d.commCode || d.comm_code, teamId,
       d.registrationConfirmation ? 1 : 0, d.paymentConfirmation ? 1 : 0,
       d.certificateSent ? 1 : 0,
       JSON.stringify(d.emailHistory || []),
       JSON.stringify(d.smsHistory   || []),
       d.announcementReceived ? 1 : 0, d.feedbackSubmitted ? 1 : 0,
       d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM communications WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM communications WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE communications SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
