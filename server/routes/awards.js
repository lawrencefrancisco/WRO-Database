// ============================================================
// WRO Philippines DBMS – Awards Routes
// id is INT AUTO_INCREMENT. award_code is the business code.
// team_id, school_id, coach_id are INT UNSIGNED FKs.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

const adminOnly = requireRole('SUPER_ADMIN', 'EVENT_ADMIN');

// Helper: resolve integer FK from either integer or business-code string
async function resolveId(table, codeCol, value) {
  if (!value) return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) return parseInt(value, 10);
  const [rows] = await pool.execute(`SELECT id FROM ${table} WHERE ${codeCol} = ? LIMIT 1`, [value]);
  return rows[0]?.id || null;
}

/**
 * freezeAwardSnapshot – saves a frozen copy of the team name, school(s), and coach(es)
 * into the awards.snapshot_team JSON column at the moment an award record is created/updated.
 * This preserves historical accuracy even if the team's profile is later edited.
 *
 * @param {number} awardId
 * @param {number|null} teamId
 */
async function freezeAwardSnapshot(awardId, teamId) {
  try {
    if (!teamId) return;

    const [[team]] = await pool.execute(
      'SELECT id, team_name AS teamName, season, category FROM teams WHERE id = ? LIMIT 1',
      [teamId]
    );
    if (!team) return;

    // Schools – derived from member students (most accurate)
    const [memberSchools] = await pool.execute(`
      SELECT DISTINCT sc.id, sc.school_name AS schoolName, sc.region
      FROM   team_members tm
      JOIN   students s  ON s.id = tm.student_id AND s.is_deleted = 0
      JOIN   schools  sc ON sc.id = s.school_id
      WHERE  tm.team_id = ?
    `, [teamId]);
    // Fallback: school linked directly to the team
    if (memberSchools.length === 0) {
      const [[t]] = await pool.execute('SELECT school_id FROM teams WHERE id = ?', [teamId]);
      if (t?.school_id) {
        const [[sc]] = await pool.execute(
          'SELECT id, school_name AS schoolName, region FROM schools WHERE id = ? LIMIT 1',
          [t.school_id]
        );
        if (sc) memberSchools.push(sc);
      }
    }

    // Coaches
    const [coaches] = await pool.execute(`
      SELECT c.id, c.full_name AS fullName, c.email, sc.school_name AS schoolName
      FROM   team_coaches tc
      JOIN   coaches c  ON c.id = tc.coach_id AND c.is_deleted = 0
      LEFT JOIN schools sc ON sc.id = c.school_id
      WHERE  tc.team_id = ?
    `, [teamId]);

    const snapshot = {
      teamName: team.teamName,
      season:   team.season,
      category: team.category,
      schools:  memberSchools,
      coaches,
    };

    await pool.execute(
      'UPDATE awards SET snapshot_team = ? WHERE id = ?',
      [JSON.stringify(snapshot), awardId]
    );
  } catch (e) {
    console.error(`[snapshot] freezeAwardSnapshot failed for award ${awardId}:`, e.message);
  }
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

router.post('/', adminOnly, async (req, res) => {
  try {
    const d         = req.body;
    const awardCode = d.awardCode || d.award_code || `AWD_${Date.now()}`;

    const teamId        = await resolveId('teams', 'team_code', d.teamId);
    const competitionId = await resolveId('competitions', 'competition_code', d.competitionId);

    const [result] = await pool.execute(
      `INSERT INTO awards (award_code, team_id, school_id, coach_id, category, award, year, competition_id, event,
       has_trophy, has_medal, has_certificate, status, created_at, updated_at)
       VALUES (?,?,NULL,NULL,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [awardCode, teamId,
       d.category, d.award, d.year || new Date().getFullYear(), competitionId, d.event || null,
       d.hasTrophy ? 1 : 0, d.hasMedal ? 1 : 0, d.hasCertificate ? 1 : 0,
       d.status || 'confirmed']
    );
    const [rows] = await pool.execute('SELECT * FROM awards WHERE id = ?', [result.insertId]);
    // Freeze the team/school/coach snapshot immediately so historical data is preserved from day 1
    await freezeAwardSnapshot(result.insertId, teamId);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  try {
    const d = req.body;

    const teamId        = await resolveId('teams', 'team_code', d.teamId);
    const competitionId = await resolveId('competitions', 'competition_code', d.competitionId);

    await pool.execute(
      `UPDATE awards SET team_id=?, school_id=NULL, coach_id=NULL, category=?, award=?,
       year=?, competition_id=?, event=?, has_trophy=?, has_medal=?, has_certificate=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [teamId,
       d.category, d.award, d.year, competitionId, d.event || null,
       d.hasTrophy ? 1 : 0, d.hasMedal ? 1 : 0, d.hasCertificate ? 1 : 0,
       d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM awards WHERE id = ?', [req.params.id]);
    // Re-freeze snapshot in case the team was changed
    await freezeAwardSnapshot(parseInt(req.params.id, 10), teamId);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
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
