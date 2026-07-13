// ============================================================
// WRO Philippines DBMS – Seasons Routes
// First-class season management (create by year, list, delete).
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ── GET /api/seasons ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM seasons ORDER BY year DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/seasons – create by year ───────────────────────
// Body: { year: 2026 }
// Season name is auto-generated as "WRO <year>".
router.post('/', async (req, res) => {
  try {
    const year = parseInt(req.body.year, 10);
    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid year. Must be between 2000 and 2100.' });
    }

    const name = `WRO ${year}`;
    const id   = `WRO_${year}`;

    // Duplicate check
    const [existing] = await pool.execute(
      'SELECT id FROM seasons WHERE year = ?', [year]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Season "${name}" already exists.`,
      });
    }

    await pool.execute(
      'INSERT INTO seasons (id, name, year, is_active) VALUES (?, ?, ?, 1)',
      [id, name, year]
    );

    const [rows] = await pool.execute('SELECT * FROM seasons WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Season already exists.' });
    }
    console.error('[Seasons] POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/seasons/:id ───────────────────────────────────
// Hard delete – season records are lightweight reference data,
// not soft-deleted. Teams referencing this season are unaffected
// (they store the season string, not a FK).
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM seasons WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Seasons] DELETE error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
