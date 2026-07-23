// ============================================================
// WRO Philippines DBMS – Competitions Routes
// id is INT AUTO_INCREMENT. competition_code is the business code.
// Stats are computed live from teams/team_members; never stored.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ── GET /api/competitions/stats?season=WRO+2026 ──────────────
// Must be declared before /:id so Express does not treat "stats" as an id.
router.get('/stats', async (req, res) => {
  const season = req.query.season;
  if (!season) {
    return res.status(400).json({ success: false, error: 'season query param required.' });
  }
  try {
    const [[teamRow]] = await pool.execute(
      `SELECT COUNT(*) AS teams, COUNT(DISTINCT co.id) AS coaches
       FROM teams t
       LEFT JOIN coaches co ON co.id = t.coach_id AND co.is_deleted = 0
       WHERE t.season = ? AND t.is_deleted = 0`,
      [season]
    );

    const [[schoolRow]] = await pool.execute(
      `SELECT COUNT(DISTINCT s.school_id) AS schools
       FROM team_members tm
       JOIN teams    t ON t.id = tm.team_id
       JOIN students s ON s.id = tm.student_id
       WHERE t.season = ? AND t.is_deleted = 0 AND s.school_id IS NOT NULL`,
      [season]
    );

    const [[studentRow]] = await pool.execute(
      `SELECT COUNT(DISTINCT tm.student_id) AS students
       FROM team_members tm
       JOIN teams   t ON t.id  = tm.team_id
       JOIN students s ON s.id = tm.student_id
       WHERE t.season = ? AND t.is_deleted = 0 AND s.is_deleted = 0`,
      [season]
    );

    const [categoryRows] = await pool.execute(
      `SELECT DISTINCT category FROM teams
       WHERE season = ? AND is_deleted = 0 AND category IS NOT NULL AND category <> ''
       ORDER BY category ASC`,
      [season]
    );
    const categories = categoryRows.map(r => r.category);

    res.json({
      season,
      teams:    parseInt(teamRow.teams,       10) || 0,
      schools:  parseInt(schoolRow.schools,   10) || 0,
      coaches:  parseInt(teamRow.coaches,     10) || 0,
      students: parseInt(studentRow.students, 10) || 0,
      categories,
    });
  } catch (err) {
    console.error('[Competitions] stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/competitions/season-details?season=WRO+2026 ─────
// Must be declared before /:id. Returns all teams (with per-team members),
// unique schools, coaches, judges, and students for a given season name.
router.get('/season-details', async (req, res) => {
  const season = req.query.season;
  if (!season) {
    return res.status(400).json({ success: false, error: 'season query param required.' });
  }
  try {
    // Teams in this season with coach + school info
    const [teamRows] = await pool.execute(
      `SELECT t.id, t.team_name, t.category, t.age_group,
              t.registration_status, t.qualification_status, t.payment_status, t.status,
              sc.school_name,
              co.full_name AS coach_name, co.email AS coach_email, co.mobile AS coach_mobile
       FROM   teams t
       LEFT JOIN schools sc ON sc.id = t.school_id
       LEFT JOIN coaches co ON co.id = t.coach_id
       WHERE  t.season = ? AND t.is_deleted = 0
       ORDER  BY t.team_name ASC`,
      [season]
    );

    // Per-team member names
    const teamIds = teamRows.map(r => r.id);
    const memberMap = {};
    if (teamIds.length > 0) {
      const ph = teamIds.map(() => '?').join(',');
      const [memberRows] = await pool.execute(
        `SELECT tm.team_id, s.id AS student_id, s.full_name, s.grade_level, s.age,
                s.gender,
                COALESCE(sc_s.school_name, sc_t.school_name) AS student_school
         FROM   team_members tm
         JOIN   students s   ON s.id  = tm.student_id AND s.is_deleted = 0
         JOIN   teams t      ON t.id  = tm.team_id
         LEFT JOIN schools sc_s ON sc_s.id = s.school_id
         LEFT JOIN schools sc_t ON sc_t.id = t.school_id
         WHERE  tm.team_id IN (${ph})`,
        teamIds
      );
      memberRows.forEach(r => {
        if (!memberMap[r.team_id]) memberMap[r.team_id] = [];
        memberMap[r.team_id].push(r);
      });
    }
    teamRows.forEach(t => { t.members = memberMap[t.id] || []; });

    // Unique schools via student membership
    const [schoolRows] = await pool.execute(
      `SELECT DISTINCT sc.id, sc.school_name, sc.city, sc.region, sc.address,
                       sc.contact_number, sc.email, sc.school_type,
                       sc.school_head, sc.robotics_coordinator
       FROM   team_members tm
       JOIN   teams   t  ON t.id  = tm.team_id  AND t.season = ? AND t.is_deleted = 0
       JOIN   students s  ON s.id  = tm.student_id AND s.is_deleted = 0
       JOIN   schools sc  ON sc.id = s.school_id
       ORDER  BY sc.school_name ASC`,
      [season]
    );

    // Coaches assigned to teams in this season
    const [coachRows] = await pool.execute(
      `SELECT DISTINCT co.id, co.full_name, co.email, co.mobile,
                       co.position,
                       sc.school_name AS school_name
       FROM   coaches co
       JOIN   teams   t  ON t.coach_id = co.id AND t.season = ? AND t.is_deleted = 0
       LEFT JOIN schools sc ON sc.id = co.school_id
       WHERE  co.is_deleted = 0
       ORDER  BY co.full_name ASC`,
      [season]
    );

    // Judges for this season
    const [judgeRows] = await pool.execute(
      `SELECT j.id, j.full_name, j.contact_number, j.gender, j.status,
              COALESCE(
                (SELECT GROUP_CONCAT(ja.category ORDER BY ja.category SEPARATOR ', ')
                 FROM judge_assignments ja
                 WHERE ja.judge_id = j.id AND ja.season = ?),
                j.judging_category
              ) AS judging_category
       FROM   judges j
       WHERE  (j.season = ? OR EXISTS (
                SELECT 1 FROM judge_assignments ja 
                WHERE ja.judge_id = j.id AND ja.season = ?
              )) 
          AND j.is_deleted = 0
       ORDER  BY j.full_name ASC`,
      [season, season, season]
    );

    // Distinct students
    const [studentRows] = await pool.execute(
      `SELECT DISTINCT s.id, s.full_name, s.age, s.grade_level, s.gender,
                       s.consent_signed, s.shirt_size,
                       sc.school_name AS school_name, t.team_name
       FROM   team_members tm
       JOIN   teams   t  ON t.id  = tm.team_id  AND t.season = ? AND t.is_deleted = 0
       JOIN   students s  ON s.id  = tm.student_id AND s.is_deleted = 0
       LEFT JOIN schools sc ON sc.id = s.school_id
       ORDER  BY s.full_name ASC`,
      [season]
    );

    // Competition events in this season
    const [eventRows] = await pool.execute(
      `SELECT id, name, date, venue, status, categories
       FROM   competitions
       WHERE  season = ? AND is_deleted = 0
       ORDER  BY date ASC`,
      [season]
    );
    eventRows.forEach(r => {
      if (typeof r.categories === 'string') {
        try { r.categories = JSON.parse(r.categories); } catch { r.categories = []; }
      }
    });

    res.json({ season, teams: teamRows, schools: schoolRows,
               coaches: coachRows, judges: judgeRows,
               students: studentRows, events: eventRows });
  } catch (err) {
    console.error('[Competitions] season-details error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// ── GET /api/competitions/details/:id ────────────────────────
// Returns all related participants for a competition — teams (with member
// names), unique schools, coaches, judges, and students — keyed by the
// competition's own season field so data stays consistent.
router.get('/details/:id', async (req, res) => {
  try {
    // 1. Fetch the competition itself
    const [compRows] = await pool.execute(
      'SELECT * FROM competitions WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!compRows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    const comp   = compRows[0];
    const season = comp.season;

    // 2. Teams in this season (with member info joined)
    const [teamRows] = await pool.execute(
      `SELECT t.id, t.team_name, t.category, t.age_group,
              t.registration_status, t.qualification_status,
              t.payment_status, t.status,
              sc.school_name,
              co.full_name AS coach_name, co.email AS coach_email, co.mobile AS coach_mobile
       FROM   teams t
       LEFT JOIN schools sc ON sc.id = t.school_id
       LEFT JOIN coaches co ON co.id = t.coach_id
       WHERE  t.season = ? AND t.is_deleted = 0
       ORDER  BY t.team_name ASC`,
      [season]
    );

    // 3. Member names per team
    const teamIds = teamRows.map(r => r.id);
    const memberMap = {};
    if (teamIds.length > 0) {
      const ph = teamIds.map(() => '?').join(',');
      const [memberRows] = await pool.execute(
        `SELECT tm.team_id, s.id AS student_id, s.full_name, s.grade_level, s.age,
                s.gender,
                COALESCE(sc_s.school_name, sc_t.school_name) AS student_school
         FROM   team_members tm
         JOIN   students s   ON s.id  = tm.student_id  AND s.is_deleted = 0
         JOIN   teams t      ON t.id  = tm.team_id
         LEFT JOIN schools sc_s ON sc_s.id = s.school_id
         LEFT JOIN schools sc_t ON sc_t.id = t.school_id
         WHERE  tm.team_id IN (${ph})`,
        teamIds
      );
      memberRows.forEach(r => {
        if (!memberMap[r.team_id]) memberMap[r.team_id] = [];
        memberMap[r.team_id].push(r);
      });
    }
    teamRows.forEach(t => { t.members = memberMap[t.id] || []; });

    // 4. Unique schools (from team members)
    const [schoolRows] = await pool.execute(
      `SELECT DISTINCT sc.id, sc.school_name, sc.city, sc.region, sc.address,
                       sc.contact_number, sc.email, sc.school_type, sc.school_head,
                       sc.robotics_coordinator
       FROM   team_members tm
       JOIN   teams   t  ON t.id  = tm.team_id  AND t.season = ? AND t.is_deleted = 0
       JOIN   students s  ON s.id  = tm.student_id AND s.is_deleted = 0
       JOIN   schools sc  ON sc.id = s.school_id
       ORDER  BY sc.school_name ASC`,
      [season]
    );

    // 5. Coaches assigned to teams in this season
    const [coachRows] = await pool.execute(
      `SELECT DISTINCT co.id, co.full_name, co.email, co.mobile,
                       co.position,
                       sc.school_name AS school_name
       FROM   coaches co
       JOIN   teams   t  ON t.coach_id = co.id AND t.season = ? AND t.is_deleted = 0
       LEFT JOIN schools sc ON sc.id = co.school_id
       WHERE  co.is_deleted = 0
       ORDER  BY co.full_name ASC`,
      [season]
    );

    // 6. Judges assigned to this season
    const [judgeRows] = await pool.execute(
      `SELECT j.id, j.full_name, j.contact_number, j.gender, j.status,
              COALESCE(
                (SELECT GROUP_CONCAT(ja.category ORDER BY ja.category SEPARATOR ', ')
                 FROM judge_assignments ja
                 WHERE ja.judge_id = j.id AND ja.season = ?),
                j.judging_category
              ) AS judging_category
       FROM   judges j
       WHERE  (j.season = ? OR EXISTS (
                SELECT 1 FROM judge_assignments ja 
                WHERE ja.judge_id = j.id AND ja.season = ?
              )) 
          AND j.is_deleted = 0
       ORDER  BY j.full_name ASC`,
      [season, season, season]
    );

    // 7. Distinct students participating
    const [studentRows] = await pool.execute(
      `SELECT DISTINCT s.id, s.full_name, s.age, s.grade_level, s.gender,
                       s.consent_signed, s.shirt_size,
                       sc.school_name AS school_name,
                       t.team_name
       FROM   team_members tm
       JOIN   teams   t  ON t.id  = tm.team_id  AND t.season = ? AND t.is_deleted = 0
       JOIN   students s  ON s.id  = tm.student_id AND s.is_deleted = 0
       LEFT JOIN schools sc ON sc.id = s.school_id
       ORDER  BY s.full_name ASC`,
      [season]
    );

    res.json({
      competition: comp,
      teams:    teamRows,
      schools:  schoolRows,
      coaches:  coachRows,
      judges:   judgeRows,
      students: studentRows,
    });
  } catch (err) {
    console.error('[Competitions] details error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ── GET /api/competitions ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM competitions WHERE is_deleted = 0 ORDER BY date DESC'
    );
    rows.forEach(r => {
      if (typeof r.categories === 'string') {
        try { r.categories = JSON.parse(r.categories); } catch { r.categories = []; }
      }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/competitions/:id ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM competitions WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    const row = rows[0];
    if (typeof row.categories === 'string') {
      try { row.categories = JSON.parse(row.categories); } catch { row.categories = []; }
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/competitions ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const competitionCode = d.competitionCode || d.competition_code || `COMP_${Date.now()}`;

    if (!d.name) {
      return res.status(400).json({ success: false, error: 'Event name is required.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO competitions
         (competition_code, name, season, theme, date, venue, organizer,
          registration_deadline, categories, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [
        competitionCode,
        d.name,
        d.season              || null,
        d.theme               || null,
        d.date                || null,
        d.venue               || null,
        d.organizer           || null,
        d.registrationDeadline || null,
        JSON.stringify(d.categories || []),
        d.status              || 'upcoming',
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Competitions] POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/competitions/:id ─────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    await pool.execute(
      `UPDATE competitions
       SET name=?, season=?, theme=?, date=?, venue=?, organizer=?,
           registration_deadline=?, categories=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [
        d.name,
        d.season              || null,
        d.theme               || null,
        d.date                || null,
        d.venue               || null,
        d.organizer           || null,
        d.registrationDeadline || null,
        JSON.stringify(d.categories || []),
        d.status              || 'upcoming',
        req.params.id,
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Competitions] PUT error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/competitions/:id ──────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM competitions WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute(
        'UPDATE competitions SET is_deleted=1, deleted_at=NOW() WHERE id = ?',
        [req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
