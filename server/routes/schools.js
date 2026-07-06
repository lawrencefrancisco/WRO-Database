// ============================================================
// WRO Philippines DBMS – Schools Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/schools
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM schools WHERE is_deleted = 0 ORDER BY school_name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schools/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM schools WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schools
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || `SCH_${Date.now()}`;
    await pool.execute(
      `INSERT INTO schools (id, school_name, school_type, school_level, deped_id, region, province,
       city, address, contact_number, email, school_head, robotics_coordinator, website,
       years_joined, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, d.schoolName, d.schoolType, d.schoolLevel, d.depedId, d.region, d.province,
       d.city, d.address, d.contactNumber, d.email, d.schoolHead, d.roboticsCoordinator,
       d.website || null, d.yearsJoined || null, d.status || 'active']
    );
    const [rows] = await pool.execute('SELECT * FROM schools WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/schools/:id
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    await pool.execute(
      `UPDATE schools SET school_name=?, school_type=?, school_level=?, deped_id=?, region=?,
       province=?, city=?, address=?, contact_number=?, email=?, school_head=?,
       robotics_coordinator=?, website=?, years_joined=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [d.schoolName, d.schoolType, d.schoolLevel, d.depedId, d.region, d.province,
       d.city, d.address, d.contactNumber, d.email, d.schoolHead, d.roboticsCoordinator,
       d.website || null, d.yearsJoined || null, d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM schools WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/schools/:id  (soft delete; ?hard=true for permanent)
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM schools WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE schools SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
