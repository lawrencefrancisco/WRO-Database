// ============================================================
// WRO Philippines DBMS – Awards Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM awards WHERE is_deleted = 0 ORDER BY year DESC, award');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM awards WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d  = req.body;
    const id = d.id || `AWD_${Date.now()}`;
    await pool.execute(
      `INSERT INTO awards (id, team_id, school_id, coach_id, category, award, year, event,
       has_trophy, has_medal, has_certificate, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, d.teamId || null, d.schoolId || null, d.coachId || null,
       d.category, d.award, d.year || new Date().getFullYear(), d.event || null,
       d.hasTrophy ? 1 : 0, d.hasMedal ? 1 : 0, d.hasCertificate ? 1 : 0,
       d.status || 'confirmed']
    );
    const [rows] = await pool.execute('SELECT * FROM awards WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    await pool.execute(
      `UPDATE awards SET team_id=?, school_id=?, coach_id=?, category=?, award=?, year=?, event=?,
       has_trophy=?, has_medal=?, has_certificate=?, status=?, updated_at=NOW() WHERE id = ?`,
      [d.teamId || null, d.schoolId || null, d.coachId || null,
       d.category, d.award, d.year, d.event || null,
       d.hasTrophy ? 1 : 0, d.hasMedal ? 1 : 0, d.hasCertificate ? 1 : 0,
       d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM awards WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM awards WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE awards SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
