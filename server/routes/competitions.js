// ============================================================
// WRO Philippines DBMS – Competitions Routes
// Stats are computed live from teams/team_members; they are
// never stored manually on the competition record.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ── GET /api/competitions/stats?season=WRO+2026 ──────────────
// Computes live: teams, unique schools, unique coaches, students.
// This MUST be declared before /:id so Express does not treat
// "stats" as an id parameter.
router.get('/stats', async (req, res) => {
  const season = req.query.season;
  if (!season) {
    return res.status(400).json({ success: false, error: 'season query param required.' });
  }
  try {
    // Teams and coaches come from the teams table directly
    const [[teamRow]] = await pool.execute(
      `SELECT
         COUNT(*)                 AS teams,
         COUNT(DISTINCT coach_id) AS coaches
       FROM teams
       WHERE season = ? AND is_deleted = 0`,
      [season]
    );

    // Schools: count DISTINCT schools across ALL members of ALL teams in this season.
    // This correctly handles teams whose members come from different schools.
    const [[schoolRow]] = await pool.execute(
      `SELECT COUNT(DISTINCT s.school_id) AS schools
       FROM team_members tm
       JOIN teams        t ON t.id  = tm.team_id
       JOIN students     s ON s.id  = tm.student_id
       WHERE t.season     = ?
         AND t.is_deleted = 0
         AND s.school_id IS NOT NULL`,
      [season]
    );

    const [[studentRow]] = await pool.execute(
      `SELECT COUNT(DISTINCT tm.student_id) AS students
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       WHERE t.season = ? AND t.is_deleted = 0`,
      [season]
    );

    // Derive participating categories live from team records — never stored separately
    const [categoryRows] = await pool.execute(
      `SELECT DISTINCT category
       FROM teams
       WHERE season = ? AND is_deleted = 0
         AND category IS NOT NULL AND category <> ''
       ORDER BY category ASC`,
      [season]
    );
    const categories = categoryRows.map(r => r.category);

    res.json({
      season,
      teams:    parseInt(teamRow.teams,        10) || 0,
      schools:  parseInt(schoolRow.schools,    10) || 0,
      coaches:  parseInt(teamRow.coaches,      10) || 0,
      students: parseInt(studentRow.students,  10) || 0,
      categories,
    });
  } catch (err) {
    console.error('[Competitions] stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/competitions ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM competitions WHERE is_deleted = 0 ORDER BY date DESC'
    );
    // Parse categories JSON if stored as string
    rows.forEach(r => {
      if (typeof r.categories === 'string') {
        try { r.categories = JSON.parse(r.categories); } catch { r.categories = []; }
      }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/competitions/:id ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM competitions WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    const row = rows[0];
    if (typeof row.categories === 'string') {
      try { row.categories = JSON.parse(row.categories); } catch { row.categories = []; }
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/competitions ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const d  = req.body;
    const id = d.id || `COMP_${Date.now()}`;

    if (!d.name) {
      return res.status(400).json({ success: false, error: 'Event name is required.' });
    }

    await pool.execute(
      `INSERT INTO competitions
         (id, name, season, theme, date, venue, organizer,
          registration_deadline, categories, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [
        id,
        d.name,
        d.season        || null,
        d.theme         || null,
        d.date          || null,
        d.venue         || null,
        d.organizer     || null,
        d.registrationDeadline || null,
        JSON.stringify(d.categories || []),
        d.status        || 'upcoming',
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Competitions] POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/competitions/:id ─────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;

    await pool.execute(
      `UPDATE competitions
       SET name=?, season=?, theme=?, date=?, venue=?, organizer=?,
           registration_deadline=?, categories=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [
        d.name,
        d.season        || null,
        d.theme         || null,
        d.date          || null,
        d.venue         || null,
        d.organizer     || null,
        d.registrationDeadline || null,
        JSON.stringify(d.categories || []),
        d.status        || 'upcoming',
        req.params.id,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Competitions] PUT error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/competitions/:id ──────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM competitions WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute(
        'UPDATE competitions SET is_deleted=1, deleted_at=NOW() WHERE id = ?',
        [req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
