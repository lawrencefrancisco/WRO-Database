// ============================================================
// WRO Philippines DBMS – Teams Routes
// id is INT AUTO_INCREMENT. team_code is the business code.
// competition_id, school_id, coach_id are INT UNSIGNED FKs.
// team_members junction uses INT UNSIGNED for both columns.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

const adminOnly = requireRole('SUPER_ADMIN', 'EVENT_ADMIN');

// Helper: fetch members array for a team (returns array of integer student ids)
async function getMembers(teamId) {
  const [rows] = await pool.execute(
    'SELECT student_id FROM team_members WHERE team_id = ?', [teamId]
  );
  return rows.map(r => r.student_id);
}

// Helper: fetch coaches array for a team (returns array of integer coach ids)
async function getCoaches(teamId) {
  const [rows] = await pool.execute(
    'SELECT coach_id FROM team_coaches WHERE team_id = ?', [teamId]
  );
  return rows.map(r => r.coach_id);
}

// Helper: resolve an integer FK from either a raw integer or a code string.
// table: 'schools'|'coaches'|'competitions', codeCol: e.g. 'school_code'
async function resolveId(conn, table, codeCol, value) {
  if (!value) return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) return parseInt(value, 10);
  const [rows] = await conn.execute(`SELECT id FROM ${table} WHERE ${codeCol} = ? LIMIT 1`, [value]);
  return rows[0]?.id || null;
}

/**
 * freezeTeamSnapshot – captures a point-in-time snapshot of all member, coach,
 * and school profiles linked to a team and writes it into the three JSON columns.
 * Call this whenever a team's registration_status transitions to 'confirmed'.
 * Safe to call multiple times – will always reflect the state at the moment of call.
 *
 * @param {object} conn  - active mysql2 connection (can be a pool or transaction conn)
 * @param {number} teamId
 */
async function freezeTeamSnapshot(conn, teamId) {
  try {
    // 1. Students – include their current school name for full historical context
    const [students] = await conn.execute(`
      SELECT s.id, s.full_name AS fullName, s.grade_level AS gradeLevel,
             s.gender, s.shirt_size AS shirtSize,
             sc.school_name AS schoolName, sc.region
      FROM   team_members tm
      JOIN   students s  ON s.id = tm.student_id AND s.is_deleted = 0
      LEFT JOIN schools sc ON sc.id = s.school_id
      WHERE  tm.team_id = ?
    `, [teamId]);

    // 2. Coaches – include their current school affiliation
    const [coaches] = await conn.execute(`
      SELECT c.id, c.full_name AS fullName, c.email, c.mobile,
             c.position, sc.school_name AS schoolName
      FROM   team_coaches tc
      JOIN   coaches c  ON c.id = tc.coach_id AND c.is_deleted = 0
      LEFT JOIN schools sc ON sc.id = c.school_id
      WHERE  tc.team_id = ?
    `, [teamId]);

    // 3. School linked directly to the team record
    const [[team]] = await conn.execute(
      'SELECT school_id FROM teams WHERE id = ? LIMIT 1', [teamId]
    );
    let school = null;
    if (team?.school_id) {
      const [[sc]] = await conn.execute(
        `SELECT id, school_name AS schoolName, region, city, school_type AS schoolType
         FROM   schools WHERE id = ? LIMIT 1`,
        [team.school_id]
      );
      school = sc || null;
    }

    await conn.execute(
      `UPDATE teams
         SET snapshot_students = ?,
             snapshot_coaches  = ?,
             snapshot_school   = ?
       WHERE id = ?`,
      [JSON.stringify(students), JSON.stringify(coaches), JSON.stringify(school), teamId]
    );
  } catch (e) {
    // Non-fatal: log and continue so the main save never fails because of a snapshot error
    console.error(`[snapshot] freezeTeamSnapshot failed for team ${teamId}:`, e.message);
  }
}

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM teams WHERE is_deleted = 0 ORDER BY team_name');
    
    if (rows.length > 0) {
      const teamIds = rows.map(r => r.id);
      const placeholders = teamIds.map(() => '?').join(',');
      const [memberRows] = await pool.execute(
        `SELECT team_id, student_id FROM team_members WHERE team_id IN (${placeholders})`,
        teamIds
      );
      const memberMap = {};
      memberRows.forEach(r => {
        if (!memberMap[r.team_id]) memberMap[r.team_id] = [];
        memberMap[r.team_id].push(r.student_id);
      });

      const [coachRows] = await pool.execute(
        `SELECT team_id, coach_id FROM team_coaches WHERE team_id IN (${placeholders})`,
        teamIds
      );
      const coachMap = {};
      coachRows.forEach(r => {
        if (!coachMap[r.team_id]) coachMap[r.team_id] = [];
        coachMap[r.team_id].push(r.coach_id);
      });

      rows.forEach(t => {
        t.members = memberMap[t.id] || [];
        t.coaches = coachMap[t.id] || [];
      });
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
    rows[0].coaches = await getCoaches(req.params.id);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/teams
router.post('/', adminOnly, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const d        = req.body;
    const teamCode = d.teamCode || d.team_code || `TEAM_${Date.now()}`;

    // members: array of integer student ids or student_codes
    const members = Array.isArray(d.members) ? d.members : [];
    // coaches: array of integer coach ids or coach_codes
    const coaches = Array.isArray(d.coaches) ? d.coaches : [];

    // Resolve integer FKs (accept integer or business-code string)
    const competitionId = await resolveId(conn, 'competitions', 'competition_code', d.competitionId);
    let   schoolId      = await resolveId(conn, 'schools',      'school_code',      d.schoolId);

    // Auto-detect school_id from first member's student record if still unresolved
    if (!schoolId && members.length > 0) {
      const firstMember = await resolveId(conn, 'students', 'student_code', members[0]);
      if (firstMember) {
        const [stuRows] = await conn.execute('SELECT school_id FROM students WHERE id = ? LIMIT 1', [firstMember]);
        schoolId = stuRows[0]?.school_id || null;
      }
    }

    // ── Duplicate check: team name must be unique WITHIN THE SAME COMPETITION ─
    if (!d.teamName) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'Team Name is required.' });
    }
    const [dupTeam] = await conn.execute(
      'SELECT id FROM teams WHERE team_name = ? AND competition_id = ? AND is_deleted = 0 LIMIT 1',
      [d.teamName.trim(), competitionId]
    );
    if (dupTeam.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, error: `A team named "${d.teamName}" already exists in this competition.` });
    }

    const [result] = await conn.execute(
      `INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group,
       school_id, registration_status,
       payment_status, qualification_status, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [teamCode, d.season, competitionId, d.teamName, d.category, d.ageGroup || null,
       schoolId,
       d.registrationStatus || 'registered',
       // payment_status is managed exclusively by Payment Management — always default to 'unpaid' on insert
       'unpaid',
       d.qualificationStatus || 'pending', d.status || 'active']
    );
    const newId = result.insertId;

    // Insert team members (resolve student ids)
    for (const memberVal of members) {
      const sid = await resolveId(conn, 'students', 'student_code', memberVal);
      if (sid) await conn.execute('INSERT IGNORE INTO team_members (team_id, student_id) VALUES (?,?)', [newId, sid]);
    }

    // Insert team coaches
    for (const coachVal of coaches) {
      const cid = await resolveId(conn, 'coaches', 'coach_code', coachVal);
      if (cid) await conn.execute('INSERT IGNORE INTO team_coaches (team_id, coach_id) VALUES (?,?)', [newId, cid]);
    }

    await conn.commit();

    // Freeze historical snapshot if the team is already confirmed
    const regStatus = d.registrationStatus || 'registered';
    if (regStatus === 'confirmed') {
      await freezeTeamSnapshot(pool, newId); // use pool (outside transaction) so it reads committed data
    }

    const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ?', [newId]);
    rows[0].members = await getMembers(newId);
    rows[0].coaches = await getCoaches(newId);
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
router.put('/:id', adminOnly, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const d       = req.body;
    const teamId  = parseInt(req.params.id, 10);
    const members = Array.isArray(d.members) ? d.members : [];
    const coaches = Array.isArray(d.coaches) ? d.coaches : [];

    const competitionId = await resolveId(conn, 'competitions', 'competition_code', d.competitionId);
    let   schoolId      = await resolveId(conn, 'schools',      'school_code',      d.schoolId);

    if (!schoolId && members.length > 0) {
      const firstMember = await resolveId(conn, 'students', 'student_code', members[0]);
      if (firstMember) {
        const [stuRows] = await conn.execute('SELECT school_id FROM students WHERE id = ? LIMIT 1', [firstMember]);
        schoolId = stuRows[0]?.school_id || null;
      }
    }

    // Preserve the existing payment_status — it is managed exclusively by Payment Management
    const [existingTeam] = await conn.execute('SELECT payment_status FROM teams WHERE id = ? LIMIT 1', [teamId]);
    const currentPaymentStatus = existingTeam[0]?.payment_status || 'unpaid';

    // ── Duplicate check: new team name must not clash with another active team in the same competition ──
    if (d.teamName) {
      const [dupTeam] = await conn.execute(
        'SELECT id FROM teams WHERE team_name = ? AND competition_id = ? AND is_deleted = 0 AND id != ? LIMIT 1',
        [d.teamName.trim(), competitionId, teamId]
      );
      if (dupTeam.length > 0) {
        await conn.rollback();
        return res.status(409).json({ success: false, error: `Another team named "${d.teamName}" already exists in this competition.` });
      }
    }

    await conn.execute(
      `UPDATE teams SET season=?, competition_id=?, team_name=?, category=?,
       age_group=?, school_id=?,
       registration_status=?, payment_status=?, qualification_status=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [d.season, competitionId, d.teamName, d.category,
       d.ageGroup || null, schoolId,
       d.registrationStatus, currentPaymentStatus,
       d.qualificationStatus, d.status, teamId]
    );

    // Replace members
    await conn.execute('DELETE FROM team_members WHERE team_id = ?', [teamId]);
    for (const memberVal of members) {
      const sid = await resolveId(conn, 'students', 'student_code', memberVal);
      if (sid) await conn.execute('INSERT IGNORE INTO team_members (team_id, student_id) VALUES (?,?)', [teamId, sid]);
    }

    // Replace coaches
    await conn.execute('DELETE FROM team_coaches WHERE team_id = ?', [teamId]);
    for (const coachVal of coaches) {
      const cid = await resolveId(conn, 'coaches', 'coach_code', coachVal);
      if (cid) await conn.execute('INSERT IGNORE INTO team_coaches (team_id, coach_id) VALUES (?,?)', [teamId, cid]);
    }

    await conn.commit();

    // Freeze historical snapshot whenever the team reaches 'confirmed' status.
    // This is also re-triggered if admin manually re-confirms to keep the snapshot
    // in sync with any roster changes made before the final confirmation.
    if (d.registrationStatus === 'confirmed') {
      await freezeTeamSnapshot(pool, teamId); // use pool (outside transaction) so it reads committed data
    }

    const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ?', [teamId]);
    rows[0].members = await getMembers(teamId);
    rows[0].coaches = await getCoaches(teamId);

    if (schoolId) {
      await pool.execute(
        `INSERT INTO notification_log (event_type, title, message, team_id, school_id, triggered_by, created_at)
         VALUES (?,?,?,?,?,?,NOW())`,
        ['team_update', 'Team Updated', `The team "${d.teamName}" has been updated by an administrator.`, teamId, schoolId, req.user.username || 'Admin']
      );
    }

    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/teams/:id
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM team_members WHERE team_id = ?', [req.params.id]);
      await pool.execute('DELETE FROM team_coaches WHERE team_id = ?', [req.params.id]);
      await pool.execute('DELETE FROM teams WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE teams SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/teams/:id/generate-qr  — generate (or regenerate) a secure QR token
router.post('/:id/generate-qr', adminOnly, async (req, res) => {
  try {
    const crypto = require('crypto');
    const token  = crypto.randomBytes(32).toString('hex');
    const [result] = await pool.execute(
      'UPDATE teams SET qr_token = ? WHERE id = ? AND is_deleted = 0',
      [token, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Team not found.' });
    res.json({ success: true, qr_token: token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
