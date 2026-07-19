// ============================================================
// WRO Philippines DBMS – Teams Routes
// id is INT AUTO_INCREMENT. team_code is the business code.
// competition_id, school_id, coach_id are INT UNSIGNED FKs.
// team_members junction uses INT UNSIGNED for both columns.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Helper: fetch members array for a team (returns array of integer student ids)
async function getMembers(teamId) {
  const [rows] = await pool.execute(
    'SELECT student_id FROM team_members WHERE team_id = ?', [teamId]
  );
  return rows.map(r => r.student_id);
}

// Helper: resolve an integer FK from either a raw integer or a code string.
// table: 'schools'|'coaches'|'competitions', codeCol: e.g. 'school_code'
async function resolveId(conn, table, codeCol, value) {
  if (!value) return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) return parseInt(value, 10);
  const [rows] = await conn.execute(`SELECT id FROM ${table} WHERE ${codeCol} = ? LIMIT 1`, [value]);
  return rows[0]?.id || null;
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
      rows.forEach(t => {
        t.members = memberMap[t.id] || [];
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
    const d        = req.body;
    const teamCode = d.teamCode || d.team_code || `TEAM_${Date.now()}`;

    // members: array of integer student ids or student_codes
    const members = Array.isArray(d.members) ? d.members : [];

    // Resolve integer FKs (accept integer or business-code string)
    const competitionId = await resolveId(conn, 'competitions', 'competition_code', d.competitionId);
    let   schoolId      = await resolveId(conn, 'schools',      'school_code',      d.schoolId);
    const coachId       = await resolveId(conn, 'coaches',      'coach_code',       d.coachId);

    // Auto-detect school_id from first member's student record if still unresolved
    if (!schoolId && members.length > 0) {
      const firstMember = await resolveId(conn, 'students', 'student_code', members[0]);
      if (firstMember) {
        const [stuRows] = await conn.execute('SELECT school_id FROM students WHERE id = ? LIMIT 1', [firstMember]);
        schoolId = stuRows[0]?.school_id || null;
      }
    }

    const [result] = await conn.execute(
      `INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group,
       school_id, coach_id, robot_platform, programming_language, registration_status,
       payment_status, qualification_status, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [teamCode, d.season, competitionId, d.teamName, d.category, d.ageGroup || null,
       schoolId, coachId, d.robotPlatform || null, d.programmingLanguage || null,
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

    await conn.commit();
    const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ?', [newId]);
    rows[0].members = await getMembers(newId);
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
    const d       = req.body;
    const teamId  = parseInt(req.params.id, 10);
    const members = Array.isArray(d.members) ? d.members : [];

    const competitionId = await resolveId(conn, 'competitions', 'competition_code', d.competitionId);
    let   schoolId      = await resolveId(conn, 'schools',      'school_code',      d.schoolId);
    const coachId       = await resolveId(conn, 'coaches',      'coach_code',       d.coachId);

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

    await conn.execute(
      `UPDATE teams SET season=?, competition_id=?, team_name=?, category=?,
       age_group=?, school_id=?, coach_id=?, robot_platform=?, programming_language=?,
       registration_status=?, payment_status=?, qualification_status=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [d.season, competitionId, d.teamName, d.category,
       d.ageGroup || null, schoolId, coachId, d.robotPlatform || null,
       d.programmingLanguage || null, d.registrationStatus, currentPaymentStatus,
       d.qualificationStatus, d.status, teamId]
    );

    // Replace members
    await conn.execute('DELETE FROM team_members WHERE team_id = ?', [teamId]);
    for (const memberVal of members) {
      const sid = await resolveId(conn, 'students', 'student_code', memberVal);
      if (sid) await conn.execute('INSERT IGNORE INTO team_members (team_id, student_id) VALUES (?,?)', [teamId, sid]);
    }

    await conn.commit();
    const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ?', [teamId]);
    rows[0].members = await getMembers(teamId);

    // ── Auto-create Delegation when team is newly qualified ──────
    if (d.qualificationStatus === 'qualified') {
      const [existDel] = await pool.execute(
        'SELECT id FROM delegation WHERE team_id = ? AND is_deleted = 0 LIMIT 1', [teamId]
      );
      if (existDel.length === 0) {
        const delCode = `DEL_${Date.now()}`;
        await pool.execute(
          `INSERT INTO delegation (delegation_code, team_id, destination_country, wro_year,
           passport_status, visa_status, parent_consent, dietary_restrictions, shirt_size,
           status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
          [delCode, teamId, 'TBD', new Date().getFullYear(),
           'submitted', 'not required', 0, 'None', 'M', 'pending']
        );
      }
      // Auto-log in communications
      const [existComm] = await pool.execute(
        'SELECT id FROM communications WHERE team_id = ? AND is_deleted = 0 LIMIT 1', [teamId]
      );
      if (existComm.length === 0) {
        const commCode = `COM_${Date.now()}`;
        await pool.execute(
          `INSERT INTO communications (comm_code, team_id, registration_confirmation,
           payment_confirmation, certificate_sent, announcement_received, feedback_submitted,
           status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())`,
          [commCode, teamId, 0, 0, 0, 0, 0, 'active']
        );
      }
    }

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
