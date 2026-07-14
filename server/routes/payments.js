// ============================================================
// WRO Philippines DBMS – Payments Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE is_deleted = 0 ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d  = req.body;
    const id = d.id || `PAY_${Date.now()}`;

    // Auto-resolve school_id from linked team if not explicitly provided
    let resolvedSchoolId = d.schoolId || null;
    if (!resolvedSchoolId && d.teamId) {
      const [teamRows] = await pool.execute(
        'SELECT school_id FROM teams WHERE id = ? LIMIT 1', [d.teamId]
      );
      resolvedSchoolId = teamRows[0]?.school_id || null;
    }

    await pool.execute(
      `INSERT INTO payments (id, team_id, school_id, registration_fee, amount_paid, balance,
       payment_date, payment_method, or_number, sponsorship, scholarship, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, d.teamId || null, resolvedSchoolId,
       d.registrationFee || 0, d.amountPaid || 0, d.balance || 0,
       d.paymentDate || null, d.paymentMethod || null, d.orNumber || null,
       d.sponsorship || 0, d.scholarship || 'None', d.status || 'unpaid']
    );
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;

    // Auto-resolve school_id from linked team if not explicitly provided
    let resolvedSchoolId = d.schoolId || null;
    if (!resolvedSchoolId && d.teamId) {
      const [teamRows] = await pool.execute(
        'SELECT school_id FROM teams WHERE id = ? LIMIT 1', [d.teamId]
      );
      resolvedSchoolId = teamRows[0]?.school_id || null;
    }

    await pool.execute(
      `UPDATE payments SET team_id=?, school_id=?, registration_fee=?, amount_paid=?, balance=?,
       payment_date=?, payment_method=?, or_number=?, sponsorship=?, scholarship=?, status=?,
       updated_at=NOW() WHERE id = ?`,
      [d.teamId || null, resolvedSchoolId,
       d.registrationFee || 0, d.amountPaid || 0, d.balance || 0,
       d.paymentDate || null, d.paymentMethod || null, d.orNumber || null,
       d.sponsorship || 0, d.scholarship || 'None', d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM payments WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE payments SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
