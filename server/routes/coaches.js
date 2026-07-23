// ============================================================
// WRO Philippines DBMS – Coaches Routes
// id column is now INT AUTO_INCREMENT (surrogate key).
// coach_code holds the human-readable code (COA_xxx).
// school_id is INT UNSIGNED FK → schools.id
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/coaches
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM coaches WHERE is_deleted = 0 ORDER BY full_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/coaches/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM coaches WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/coaches
// Body may pass schoolId (integer) or schoolCode (e.g. 'SCH_001'); integer wins.
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const coachCode = d.coachCode || d.coach_code || `COA_${Date.now()}`;

    let schoolId = d.schoolId || null;
    if (!schoolId && d.schoolCode) {
      const [sr] = await pool.execute('SELECT id FROM schools WHERE school_code = ? LIMIT 1', [d.schoolCode]);
      schoolId = sr[0]?.id || null;
    }

    const [result] = await pool.execute(
      `INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id,
       position, shirt_size, emergency_contact, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [coachCode, d.fullName, d.birthday || null, d.gender, d.email, d.mobile,
       schoolId, d.position, d.shirtSize, d.emergencyContact, d.status || 'active']
    );
    const [rows] = await pool.execute('SELECT * FROM coaches WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/coaches/:id
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;

    let schoolId = d.schoolId || null;
    if (!schoolId && d.schoolCode) {
      const [sr] = await pool.execute('SELECT id FROM schools WHERE school_code = ? LIMIT 1', [d.schoolCode]);
      schoolId = sr[0]?.id || null;
    }

    await pool.execute(
      `UPDATE coaches SET full_name=?, birthday=?, gender=?, email=?, mobile=?,
       school_id=?, position=?, shirt_size=?, emergency_contact=?, status=?, updated_at=NOW() WHERE id = ?`,
      [d.fullName, d.birthday || null, d.gender, d.email,
       d.mobile, schoolId, d.position, d.shirtSize, d.emergencyContact, d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM coaches WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/coaches/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM coaches WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE coaches SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
