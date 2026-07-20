// ============================================================
// WRO Philippines DBMS – Payments Routes
// id is INT AUTO_INCREMENT. payment_code is the business code.
// team_id, school_id are INT UNSIGNED FKs.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Helper: resolve integer FK from either integer or business-code string
async function resolveId(table, codeCol, value) {
  if (!value) return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) return parseInt(value, 10);
  const [rows] = await pool.execute(`SELECT id FROM ${table} WHERE ${codeCol} = ? LIMIT 1`, [value]);
  return rows[0]?.id || null;
}

// Helper: write a payment_logs entry (shared by POST and PUT)
async function _writeLog(conn, {
  paymentId, teamId, action,
  prevStatus, newStatus,
  prevAmount, newAmount,
  prevBalance, newBalance,
  paymentDate, orNumber, paymentMethod,
  notes, performedBy
}) {
  await conn.execute(
    `INSERT INTO payment_logs
       (payment_id, team_id, action,
        prev_status, new_status,
        prev_amount, new_amount,
        prev_balance, new_balance,
        payment_date, or_number, payment_method,
        notes, performed_by, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
    [
      paymentId, teamId || null, action,
      prevStatus  || null, newStatus  || null,
      prevAmount  ?? null, newAmount  ?? null,
      prevBalance ?? null, newBalance ?? null,
      paymentDate || null, orNumber   || null, paymentMethod || null,
      notes       || null, performedBy || 'System'
    ]
  );
}

// ── GET / ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE is_deleted = 0 ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /logs ─────────────────────────────────────────────── (must be before /:id)
router.get('/logs', async (req, res) => {
  try {
    let sql    = 'SELECT * FROM payment_logs WHERE 1=1';
    const vals = [];
    if (req.query.paymentId) { sql += ' AND payment_id = ?'; vals.push(req.query.paymentId); }
    if (req.query.teamId)    { sql += ' AND team_id = ?';    vals.push(req.query.teamId); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(sql, vals);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:id/logs ─────────────────────────────────────────────
router.get('/:id/logs', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM payment_logs WHERE payment_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST / (upsert) ──────────────────────────────────────────
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const d           = req.body;
    const performedBy = d.performedBy || 'Payments Module';

    const teamId = await resolveId('teams', 'team_code', d.teamId);

    // Auto-resolve school_id from linked team if not explicitly provided
    let schoolId = await resolveId('schools', 'school_code', d.schoolId);
    if (!schoolId && teamId) {
      const [teamRows] = await conn.execute('SELECT school_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
      schoolId = teamRows[0]?.school_id || null;
    }

    // Check for an existing non-deleted payment for this team
    let existingRow = null;
    if (teamId) {
      const [existing] = await conn.execute(
        'SELECT * FROM payments WHERE team_id = ? AND is_deleted = 0 LIMIT 1',
        [teamId]
      );
      existingRow = existing[0] || null;
    }

    let finalRow;
    if (existingRow) {
      // ── UPDATE existing record ───────────────────────────
      const prevStatus  = existingRow.status;
      const prevAmount  = parseFloat(existingRow.amount_paid) || 0; // cumulative before this payment
      const prevBalance = parseFloat(existingRow.balance)    || 0;

      // transactionAmount = the exact amount the user entered for this single payment
      // amountPaid        = new cumulative total (prevAmount + transactionAmount)
      const transactionAmount = parseFloat(d.transactionAmount ?? (d.amountPaid - prevAmount)) || 0;
      const newCumulative     = parseFloat(d.amountPaid) || 0;
      const newBalance        = parseFloat(d.balance)    || 0;
      const newStatus         = d.status || 'unpaid';

      await conn.execute(
        `UPDATE payments SET team_id=?, school_id=?, registration_fee=?,
         amount_paid=?, balance=?, payment_date=?, payment_method=?, or_number=?, sponsorship=?,
         scholarship=?, status=?, updated_at=NOW() WHERE id = ?`,
        [teamId, schoolId,
         d.registrationFee || 0, newCumulative, newBalance,
         d.paymentDate || null, d.paymentMethod || null, d.orNumber || null,
         d.sponsorship || 0, d.scholarship || 'None', newStatus,
         existingRow.id]
      );

      // Determine action label
      const onlyStatusChanged = prevStatus !== newStatus && prevAmount === newCumulative;
      const action = onlyStatusChanged ? 'status_changed' : 'updated';

      await _writeLog(conn, {
        paymentId:    existingRow.id,
        teamId:       teamId,
        action,
        prevStatus,
        newStatus,
        prevAmount,                  // cumulative before
        newAmount:    transactionAmount, // ← this single payment's amount
        prevBalance,
        newBalance,
        paymentDate:  d.paymentDate || null,
        orNumber:     d.orNumber    || null,
        paymentMethod: d.paymentMethod || null,
        notes: `Payment of ₱${transactionAmount} recorded. Cumulative total: ₱${newCumulative}`,
        performedBy,
      });

      const [rows] = await conn.execute('SELECT * FROM payments WHERE id = ?', [existingRow.id]);
      finalRow = rows[0];
    } else {
      // ── INSERT new record ────────────────────────────────
      const paymentCode       = d.paymentCode || d.payment_code || `PAY_${Date.now()}`;
      const transactionAmount = parseFloat(d.transactionAmount ?? d.amountPaid) || 0;
      const newCumulative     = parseFloat(d.amountPaid) || 0;
      const newBalance        = parseFloat(d.balance)    || 0;
      const newStatus         = d.status || 'unpaid';

      const [result] = await conn.execute(
        `INSERT INTO payments (payment_code, team_id, school_id, registration_fee, amount_paid,
         balance, payment_date, payment_method, or_number, sponsorship, scholarship, status,
         created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        [paymentCode, teamId, schoolId,
         d.registrationFee || 0, newCumulative, newBalance,
         d.paymentDate || null, d.paymentMethod || null, d.orNumber || null,
         d.sponsorship || 0, d.scholarship || 'None', newStatus]
      );

      await _writeLog(conn, {
        paymentId:    result.insertId,
        teamId:       teamId,
        action:       'created',
        prevStatus:   null,
        newStatus,
        prevAmount:   null,
        newAmount:    transactionAmount, // ← exact amount entered
        prevBalance:  null,
        newBalance,
        paymentDate:  d.paymentDate    || null,
        orNumber:     d.orNumber       || null,
        paymentMethod: d.paymentMethod || null,
        notes:        null,
        performedBy,
      });

      const [rows] = await conn.execute('SELECT * FROM payments WHERE id = ?', [result.insertId]);
      finalRow = rows[0];
    }

    // Sync payment status to Team Management
    if (teamId) {
      await conn.execute('UPDATE teams SET payment_status = ? WHERE id = ?', [d.status || 'unpaid', teamId]);
      const [teamRow] = await conn.execute('SELECT team_name, school_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
      const teamName  = teamRow[0]?.team_name || `Team #${teamId}`;
      await conn.execute(
        `INSERT INTO notification_log (event_type, title, message, team_id, school_id, triggered_by, created_at)
         VALUES (?,?,?,?,?,?,NOW())`,
        ['payment', `Payment ${d.status || 'unpaid'} – ${teamName}`,
         `Payment of ₱${d.transactionAmount ?? d.amountPaid ?? 0} recorded for ${teamName}. Status: ${d.status || 'unpaid'}.`,
         teamId, teamRow[0]?.school_id || null, 'Payments Module']
      );
    }

    conn.release();
    res.status(existingRow ? 200 : 201).json({ ...finalRow, _upserted: !!existingRow });
  } catch (err) {
    conn.release();
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /:id ─────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const d           = req.body;
    const performedBy = d.performedBy || 'Payments Module';

    // Capture BEFORE state for audit log
    const [prevRows] = await conn.execute('SELECT * FROM payments WHERE id = ? LIMIT 1', [req.params.id]);
    const prev = prevRows[0];

    const teamId = await resolveId('teams', 'team_code', d.teamId);

    let schoolId = await resolveId('schools', 'school_code', d.schoolId);
    if (!schoolId && teamId) {
      const [teamRows] = await conn.execute('SELECT school_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
      schoolId = teamRows[0]?.school_id || null;
    }

    const prevCumulative = parseFloat(prev?.amount_paid) || 0;
    const prevBalance    = parseFloat(prev?.balance)     || 0;
    const newCumulative  = parseFloat(d.amountPaid)      || 0;
    const newBalance     = parseFloat(d.balance)         || 0;

    // The transaction amount for this edit = difference in cumulative totals
    // If the user sent an explicit transactionAmount, prefer that.
    const transactionAmount = parseFloat(d.transactionAmount ?? (newCumulative - prevCumulative)) || 0;

    await conn.execute(
      `UPDATE payments SET team_id=?, school_id=?, registration_fee=?,
       amount_paid=?, balance=?, payment_date=?, payment_method=?, or_number=?, sponsorship=?,
       scholarship=?, status=?, updated_at=NOW() WHERE id = ?`,
      [teamId, schoolId,
       d.registrationFee || 0, newCumulative, newBalance,
       d.paymentDate || null, d.paymentMethod || null, d.orNumber || null,
       d.sponsorship || 0, d.scholarship || 'None', d.status, req.params.id]
    );

    // Determine action label
    const onlyStatusChanged = prev && prev.status !== d.status
      && prevCumulative === newCumulative;
    const action = onlyStatusChanged ? 'status_changed' : 'updated';

    await _writeLog(conn, {
      paymentId:    req.params.id,
      teamId:       teamId || prev?.team_id,
      action,
      prevStatus:   prev?.status   || null,
      newStatus:    d.status       || null,
      prevAmount:   prevCumulative,       // cumulative before edit
      newAmount:    transactionAmount,    // ← amount changed in this edit
      prevBalance,
      newBalance,
      paymentDate:  d.paymentDate  || null,
      orNumber:     d.orNumber     || null,
      paymentMethod: d.paymentMethod || null,
      notes: transactionAmount !== 0
        ? `Edited: ₱${transactionAmount} adjustment. New cumulative total: ₱${newCumulative}`
        : null,
      performedBy,
    });

    const [rows] = await conn.execute('SELECT * FROM payments WHERE id = ?', [req.params.id]);

    // Sync payment status to Team Management
    if (teamId && d.status) {
      await conn.execute('UPDATE teams SET payment_status = ? WHERE id = ?', [d.status, teamId]);
    }

    conn.release();
    res.json(rows[0]);
  } catch (err) {
    conn.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    // Fetch team_id before deleting so we can sync status
    const [pRows] = await pool.execute('SELECT team_id FROM payments WHERE id = ?', [req.params.id]);
    const teamId = pRows[0]?.team_id;

    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM payments WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE payments SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }

    // Revert team payment status since payment is deleted
    if (teamId) {
      await pool.execute('UPDATE teams SET payment_status = "unpaid" WHERE id = ?', [teamId]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
