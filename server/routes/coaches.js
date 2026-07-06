// ============================================================
// WRO Philippines DBMS – Coaches Routes
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
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || `COA_${Date.now()}`;
    await pool.execute(
      `INSERT INTO coaches (id, full_name, birthday, gender, email, mobile, school_id, position,
       shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status,
       created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, d.fullName, d.birthday || null, d.gender, d.email, d.mobile, d.schoolId || null,
       d.position, d.shirtSize, d.emergencyContact, d.certifications,
       d.yearsCoaching || 0, d.previousAwards, d.status || 'active']
    );
    const [rows] = await pool.execute('SELECT * FROM coaches WHERE id = ?', [id]);
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
    await pool.execute(
      `UPDATE coaches SET full_name=?, birthday=?, gender=?, email=?, mobile=?, school_id=?,
       position=?, shirt_size=?, emergency_contact=?, certifications=?, years_coaching=?,
       previous_awards=?, status=?, updated_at=NOW() WHERE id = ?`,
      [d.fullName, d.birthday || null, d.gender, d.email, d.mobile, d.schoolId || null,
       d.position, d.shirtSize, d.emergencyContact, d.certifications,
       d.yearsCoaching || 0, d.previousAwards, d.status, req.params.id]
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
