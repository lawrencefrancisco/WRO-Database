// ============================================================
// WRO Philippines DBMS – Judging Routes
// criteria is stored as JSON { robotDesign, programming, missionPoints }
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM judging WHERE is_deleted = 0 ORDER BY final_score DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM judging WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d  = req.body;
    const id = d.id || `JDG_${Date.now()}`;
    const criteria = d.criteria || {};
    await pool.execute(
      `INSERT INTO judging (id, team_id, judge_name, category, criteria, score, comments,
       violations, final_score, ranking, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, d.teamId, d.judgeName, d.category, JSON.stringify(criteria),
       d.score || 0, d.comments || null, d.violations || 'None',
       d.finalScore || 0, d.ranking || null, d.status || 'draft']
    );
    const [rows] = await pool.execute('SELECT * FROM judging WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    const criteria = d.criteria || {};
    await pool.execute(
      `UPDATE judging SET team_id=?, judge_name=?, category=?, criteria=?, score=?, comments=?,
       violations=?, final_score=?, ranking=?, status=?, updated_at=NOW() WHERE id = ?`,
      [d.teamId, d.judgeName, d.category, JSON.stringify(criteria),
       d.score || 0, d.comments || null, d.violations || 'None',
       d.finalScore || 0, d.ranking || null, d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM judging WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM judging WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE judging SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
