// ============================================================
// WRO Philippines DBMS – Awards Routes
// id is INT AUTO_INCREMENT. award_code is the business code.
// team_id, school_id, coach_id are INT UNSIGNED FKs.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Helper: resolve integer FK from either integer or business-code string
async function resolveId(table, codeCol, value) {
  if (!value) return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) return parseInt(value, 10);
  const [rows] = await pool.execute(`SELECT id FROM ${table} WHERE ${codeCol} = ? LIMIT 1`, [value]);
  return rows[0]?.id || null;
}

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
    const d         = req.body;
    const awardCode = d.awardCode || d.award_code || `AWD_${Date.now()}`;

    const teamId   = await resolveId('teams',   'team_code',   d.teamId);
    const schoolId = await resolveId('schools', 'school_code', d.schoolId);
    const coachId  = await resolveId('coaches', 'coach_code',  d.coachId);

    const [result] = await pool.execute(
      `INSERT INTO awards (award_code, team_id, school_id, coach_id, category, award, year, event,
       has_trophy, has_medal, has_certificate, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [awardCode, teamId, schoolId, coachId,
       d.category, d.award, d.year || new Date().getFullYear(), d.event || null,
       d.hasTrophy ? 1 : 0, d.hasMedal ? 1 : 0, d.hasCertificate ? 1 : 0,
       d.status || 'confirmed']
    );
    const [rows] = await pool.execute('SELECT * FROM awards WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;

    const teamId   = await resolveId('teams',   'team_code',   d.teamId);
    const schoolId = await resolveId('schools', 'school_code', d.schoolId);
    const coachId  = await resolveId('coaches', 'coach_code',  d.coachId);

    await pool.execute(
      `UPDATE awards SET award_code=?, team_id=?, school_id=?, coach_id=?, category=?, award=?,
       year=?, event=?, has_trophy=?, has_medal=?, has_certificate=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [d.awardCode || d.award_code, teamId, schoolId, coachId,
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
