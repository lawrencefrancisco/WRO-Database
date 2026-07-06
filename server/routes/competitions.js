// ============================================================
// WRO Philippines DBMS – Competitions Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM competitions WHERE is_deleted = 0 ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM competitions WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d  = req.body;
    const id = d.id || `COMP_${Date.now()}`;
    await pool.execute(
      `INSERT INTO competitions (id, name, season, theme, date, venue, organizer,
       registration_deadline, categories, number_of_teams, number_of_schools,
       number_of_coaches, number_of_students, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, d.name, d.season, d.theme || null, d.date || null, d.venue || null,
       d.organizer || null, d.registrationDeadline || null,
       JSON.stringify(d.categories || []),
       d.numberOfTeams || 0, d.numberOfSchools || 0,
       d.numberOfCoaches || 0, d.numberOfStudents || 0, d.status || 'upcoming']
    );
    const [rows] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [id]);
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
      `UPDATE competitions SET name=?, season=?, theme=?, date=?, venue=?, organizer=?,
       registration_deadline=?, categories=?, number_of_teams=?, number_of_schools=?,
       number_of_coaches=?, number_of_students=?, status=?, updated_at=NOW() WHERE id = ?`,
      [d.name, d.season, d.theme || null, d.date || null, d.venue || null,
       d.organizer || null, d.registrationDeadline || null,
       JSON.stringify(d.categories || []),
       d.numberOfTeams || 0, d.numberOfSchools || 0,
       d.numberOfCoaches || 0, d.numberOfStudents || 0, d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM competitions WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE competitions SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
