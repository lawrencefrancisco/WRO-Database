// ============================================================
// WRO Philippines DBMS – Judges Routes
// Master-data repository for competition judges.
// Replaces the old digital scoring / judging table.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

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
router.post('/', async (req, res) => {
  try {
    const d  = req.body;
    const id = d.id || `JDG_${Date.now()}`;

    if (!d.fullName && !d.full_name) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    const fullName        = d.fullName        || d.full_name        || null;
    const contactNumber   = d.contactNumber   || d.contact_number   || null;
    const gender          = d.gender          || null;
    const season          = d.season          || null;
    const judgingCategory = d.judgingCategory || d.judging_category || null;
    const status          = d.status          || 'active';

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

    const fullName        = d.fullName        || d.full_name        || null;
    const contactNumber   = d.contactNumber   || d.contact_number   || null;
    const gender          = d.gender          || null;
    const season          = d.season          || null;
    const judgingCategory = d.judgingCategory || d.judging_category || null;
    const status          = d.status          || 'active';

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

module.exports = router;
