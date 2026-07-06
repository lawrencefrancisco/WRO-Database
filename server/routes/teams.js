// ============================================================
// WRO Philippines DBMS – Teams Routes
// Teams store members as a JSON array; uses team_members junction too.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Helper: fetch members array for a team
async function getMembers(teamId) {
  const [rows] = await pool.execute(
    'SELECT student_id FROM team_members WHERE team_id = ?', [teamId]
  );
  return rows.map(r => r.student_id);
}

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM teams WHERE is_deleted = 0 ORDER BY team_name');
    // Attach members array to each team
    for (const team of rows) {
      team.members = await getMembers(team.id);
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    rows[0].members = await getMembers(req.params.id);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/teams
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const d  = req.body;
    const id = d.id || `TEAM_${Date.now()}`;

    await conn.execute(
      `INSERT INTO teams (id, season, competition_id, team_name, category, age_group, school_id,
       coach_id, robot_platform, programming_language, registration_status, payment_status,
       qualification_status, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, d.season, d.competitionId || null, d.teamName, d.category, d.ageGroup || null,
       d.schoolId || null, d.coachId || null, d.robotPlatform || null, d.programmingLanguage || null,
       d.registrationStatus || 'registered', d.paymentStatus || 'unpaid',
       d.qualificationStatus || 'pending', d.status || 'active']
    );

    // Insert team members
    const members = Array.isArray(d.members) ? d.members : [];
    for (const sid of members) {
      await conn.execute('INSERT IGNORE INTO team_members (team_id, student_id) VALUES (?,?)', [id, sid]);
    }

    await conn.commit();
    const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ?', [id]);
    rows[0].members = await getMembers(id);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// PUT /api/teams/:id
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const d = req.body;

    await conn.execute(
      `UPDATE teams SET season=?, competition_id=?, team_name=?, category=?, age_group=?,
       school_id=?, coach_id=?, robot_platform=?, programming_language=?, registration_status=?,
       payment_status=?, qualification_status=?, status=?, updated_at=NOW() WHERE id = ?`,
      [d.season, d.competitionId || null, d.teamName, d.category, d.ageGroup || null,
       d.schoolId || null, d.coachId || null, d.robotPlatform || null, d.programmingLanguage || null,
       d.registrationStatus, d.paymentStatus, d.qualificationStatus, d.status, req.params.id]
    );

    // Replace members
    await conn.execute('DELETE FROM team_members WHERE team_id = ?', [req.params.id]);
    const members = Array.isArray(d.members) ? d.members : [];
    for (const sid of members) {
      await conn.execute('INSERT IGNORE INTO team_members (team_id, student_id) VALUES (?,?)', [req.params.id, sid]);
    }

    await conn.commit();
    const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ?', [req.params.id]);
    rows[0].members = await getMembers(req.params.id);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/teams/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM team_members WHERE team_id = ?', [req.params.id]);
      await pool.execute('DELETE FROM teams WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE teams SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
