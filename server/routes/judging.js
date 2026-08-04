// ============================================================
// WRO Philippines DBMS – Judges Routes
// id is INT AUTO_INCREMENT. judge_code is the business code.
// judge_assignments.judge_id is now INT UNSIGNED FK → judges.id
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

const adminOnly = requireRole('SUPER_ADMIN', 'EVENT_ADMIN');

// ── GET /api/judging – list all judges ────────────────────────
router.get('/', async (req, res) => {
  try {
    let sql    = 'SELECT * FROM judges WHERE is_deleted = 0';
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
router.post('/', adminOnly, async (req, res) => {
  try {
    const d         = req.body;
    const judgeCode = d.judgeCode || d.judge_code || `JDG_${Date.now()}`;

    if (!d.fullName && !d.full_name) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    const fullName        = d.fullName        || d.full_name        || null;
    const email           = d.email           || null;
    const contactNumber   = d.contactNumber   || d.contact_number   || null;
    const gender          = d.gender          || null;
    const season          = d.season          || null;
    const judgingCategory = d.judgingCategory || d.judging_category || null;
    const status          = d.status          || 'active';

    const [result] = await pool.execute(
      `INSERT INTO judges
         (judge_code, full_name, email, contact_number, gender, season, judging_category, status,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [judgeCode, fullName, email, contactNumber, gender, season, judgingCategory, status]
    );

    const [rows] = await pool.execute('SELECT * FROM judges WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Judges] POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/judging/:id – update a judge ────────────────────
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const d = req.body;

    const fullName        = d.fullName        || d.full_name        || null;
    const email           = d.email           || null;
    const contactNumber   = d.contactNumber   || d.contact_number   || null;
    const gender          = d.gender          || null;
    const season          = d.season          || null;
    const judgingCategory = d.judgingCategory || d.judging_category || null;
    const status          = d.status          || 'active';

    await pool.execute(
      `UPDATE judges
       SET full_name=?, email=?, contact_number=?, gender=?, season=?,
           judging_category=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [fullName, email, contactNumber, gender, season,
       judgingCategory, status, req.params.id]
    );

    const [rows] = await pool.execute('SELECT * FROM judges WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Judge not found.' });

    // Update snapshot for active seasons
    const judgeProfile = rows[0];
    const snapshotStr = JSON.stringify({
      full_name: judgeProfile.full_name,
      email: judgeProfile.email,
      contact_number: judgeProfile.contact_number,
      gender: judgeProfile.gender
    });
    
    await pool.execute(
      `UPDATE judge_assignments ja
       JOIN seasons s ON s.name = ja.season
       SET ja.snapshot_data = ?
       WHERE ja.judge_id = ? AND s.is_active = 1`,
      [snapshotStr, req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('[Judges] PUT error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/judging/:id – soft or hard delete ────────────
router.delete('/:id', adminOnly, async (req, res) => {
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
    // req.params.id is the integer surrogate PK
    const [rows] = await pool.execute(
      'SELECT season, category FROM judge_assignments WHERE judge_id = ? ORDER BY season, category',
      [req.params.id]
    );
    const seasons    = [...new Set(rows.map(r => r.season))];
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
const VALID_CATEGORIES = [
  'RoboMission – Elementary', 'RoboMission – Junior', 'RoboMission – Senior',
  'Future Engineers', 'Future Innovators',
  'RoboSports', 'WeDo', 'Advanced Robotics',
];

router.put('/:id/assignments', adminOnly, async (req, res) => {
  const judgeId = parseInt(req.params.id, 10);
  const { seasons = [], categories = [] } = req.body;

  // --- Validate judge exists & get profile for snapshot ---
  const [jRows] = await pool.execute(
    'SELECT full_name, email, contact_number, gender FROM judges WHERE id = ? AND is_deleted = 0',
    [judgeId]
  );
  if (!jRows[0]) {
    return res.status(404).json({ success: false, error: 'Judge not found.' });
  }
  const snapshotStr = JSON.stringify({
    full_name: jRows[0].full_name,
    email: jRows[0].email,
    contact_number: jRows[0].contact_number,
    gender: jRows[0].gender
  });

  // --- Validate season values against the live seasons table ---
  if (seasons.length > 0) {
    const [seasonRows] = await pool.execute('SELECT name FROM seasons');
    const validSeasons = new Set(seasonRows.map(r => r.name));
    const badSeasons   = seasons.filter(s => !validSeasons.has(s));
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
      pairs.push([judgeId, season, category, snapshotStr]);
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      'DELETE FROM judge_assignments WHERE judge_id = ?',
      [judgeId]
    );

    if (pairs.length > 0) {
      const placeholders = pairs.map(() => '(?, ?, ?, ?)').join(', ');
      const flat         = pairs.flat();
      await conn.execute(
        `INSERT INTO judge_assignments (judge_id, season, category, snapshot_data) VALUES ${placeholders}`,
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
