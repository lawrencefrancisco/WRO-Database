// ============================================================
// WRO Philippines DBMS – Judges Routes
// Master-data repository for competition judges.
// Replaces the old digital scoring / judging table.
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ── GET /api/judging – list all judges ────────────────────────
router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM judges WHERE is_deleted = 0';
    const params = [];

    if (req.query.season) {
      sql += ' AND season = ?';
      params.push(req.query.season);
    }
    if (req.query.category) {
      sql += ' AND judging_category = ?';
      params.push(req.query.category);
    }

    sql += ' ORDER BY full_name ASC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/judging/:id – get one judge ──────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM judges WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Judge not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/judging – create a judge ───────────────────────
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || `JDG_${Date.now()}`;

    if (!d.fullName && !d.full_name) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    const fullName = d.fullName || d.full_name || null;
    const contactNumber = d.contactNumber || d.contact_number || null;
    const gender = d.gender || null;
    const season = d.season || null;
    const judgingCategory = d.judgingCategory || d.judging_category || null;
    const status = d.status || 'active';

    await pool.execute(
      `INSERT INTO judges
         (id, full_name, contact_number, gender, season, judging_category, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, fullName, contactNumber, gender, season, judgingCategory, status]
    );

    const [rows] = await pool.execute('SELECT * FROM judges WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Judges] POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/judging/:id – update a judge ────────────────────
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;

    const fullName = d.fullName || d.full_name || null;
    const contactNumber = d.contactNumber || d.contact_number || null;
    const gender = d.gender || null;
    const season = d.season || null;
    const judgingCategory = d.judgingCategory || d.judging_category || null;
    const status = d.status || 'active';

    await pool.execute(
      `UPDATE judges
       SET full_name=?, contact_number=?, gender=?, season=?, judging_category=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [fullName, contactNumber, gender, season, judgingCategory, status, req.params.id]
    );

    const [rows] = await pool.execute('SELECT * FROM judges WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Judge not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Judges] PUT error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/judging/:id – soft or hard delete ────────────
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM judges WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute(
        'UPDATE judges SET is_deleted=1, deleted_at=NOW() WHERE id = ?',
        [req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/judging/:id/assignments – fetch saved assignments ─
router.get('/:id/assignments', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT season, category FROM judge_assignments WHERE judge_id = ? ORDER BY season, category',
      [req.params.id]
    );
    const seasons = [...new Set(rows.map(r => r.season))];
    const categories = [...new Set(rows.map(r => r.category))];
    res.json({ seasons, categories });
  } catch (err) {
    console.error('[Judges] GET assignments error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/judging/:id/assignments – replace all assignments ─
// Body: { seasons: string[], categories: string[] }
// Strategy: full replace — DELETE then bulk INSERT within a transaction.
// Validates every value against the canonical lists kept on the server.
// VALID_CATEGORIES stays as a constant — these are well-known WRO categories
const VALID_CATEGORIES = [
  'RoboMission – Elementary', 'RoboMission – Junior', 'RoboMission – Senior',
  'Future Engineers', 'Future Innovators',
  'RoboSports', 'WeDo', 'Advanced Robotics',
];

router.put('/:id/assignments', async (req, res) => {
  const judgeId = req.params.id;
  const { seasons = [], categories = [] } = req.body;

  // --- Validate judge exists ---
  const [jRows] = await pool.execute(
    'SELECT id FROM judges WHERE id = ? AND is_deleted = 0',
    [judgeId]
  );
  if (!jRows[0]) {
    return res.status(404).json({ success: false, error: 'Judge not found.' });
  }

  // --- Validate season values against the live seasons table ---
  // This ensures newly-created seasons are always accepted without code changes.
  if (seasons.length > 0) {
    const [seasonRows] = await pool.execute('SELECT name FROM seasons');
    const validSeasons = new Set(seasonRows.map(r => r.name));
    const badSeasons = seasons.filter(s => !validSeasons.has(s));
    if (badSeasons.length) {
      return res.status(400).json({
        success: false,
        error: `Invalid season(s): ${badSeasons.join(', ')}`,
      });
    }
  }

  // --- Validate category values ---
  const badCats = categories.filter(c => !VALID_CATEGORIES.includes(c));
  if (badCats.length) {
    return res.status(400).json({
      success: false,
      error: `Invalid category(ies): ${badCats.join(', ')}`,
    });
  }

  // --- Build cartesian pairs: every season × every category ---
  const pairs = [];
  for (const season of seasons) {
    for (const category of categories) {
      pairs.push([judgeId, season, category]);
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Remove existing assignments for this judge
    await conn.execute(
      'DELETE FROM judge_assignments WHERE judge_id = ?',
      [judgeId]
    );

    // Bulk-insert new pairs (if any)
    if (pairs.length > 0) {
      const placeholders = pairs.map(() => '(?, ?, ?)').join(', ');
      const flat = pairs.flat();
      await conn.execute(
        `INSERT INTO judge_assignments (judge_id, season, category) VALUES ${placeholders}`,
        flat
      );
    }

    await conn.commit();
    res.json({ success: true, assigned: pairs.length });
  } catch (err) {
    await conn.rollback();
    console.error('[Judges] PUT assignments error:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;

