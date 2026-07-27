// ============================================================
// WRO Philippines DBMS – Competitions Routes
// id is INT AUTO_INCREMENT. competition_code is the business code.
// Stats are computed live from teams/team_members; never stored.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

const adminOnly = requireRole('SUPER_ADMIN', 'EVENT_ADMIN');

// ── GET /api/competitions/stats?season=WRO+2026 ──────────────
// Must be declared before /:id so Express does not treat "stats" as an id.
router.get('/stats', async (req, res) => {
  const season = req.query.season;
  if (!season) {
    return res.status(400).json({ success: false, error: 'season query param required.' });
  }
  try {
    const [[teamRow]] = await pool.execute(
      `SELECT COUNT(*) AS teams, COUNT(DISTINCT tc.coach_id) AS coaches
       FROM teams t
       LEFT JOIN team_coaches tc ON tc.team_id = t.id
       LEFT JOIN coaches co ON co.id = tc.coach_id AND co.is_deleted = 0
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
// For CONFIRMED teams: member/coach/school data comes from frozen snapshots.
// For non-confirmed teams: falls back to live joins.
router.get('/season-details', async (req, res) => {
  const season = req.query.season;
  if (!season) {
    return res.status(400).json({ success: false, error: 'season query param required.' });
  }
  try {
    // 1. Teams in this season — fetch snapshot columns too
    const [teamRows] = await pool.execute(
      `SELECT t.id, t.team_name, t.category, t.age_group,
              t.registration_status, t.qualification_status, t.payment_status, t.status,
              t.school_id,
              t.snapshot_students, t.snapshot_coaches, t.snapshot_school,
              sc.school_name
       FROM   teams t
       LEFT JOIN schools sc ON sc.id = t.school_id
       WHERE  t.season = ? AND t.is_deleted = 0
       ORDER  BY t.team_name ASC`,
      [season]
    );

    // 2. Per-team member names — prefer snapshots for confirmed teams
    const memberMap = {};
    const coachMap  = {};

    const liveTeamIds = teamRows
      .filter(t => t.registration_status !== 'confirmed' || !t.snapshot_students)
      .map(t => t.id);

    if (liveTeamIds.length > 0) {
      const ph = liveTeamIds.map(() => '?').join(',');
      const [memberRows] = await pool.execute(
        `SELECT tm.team_id, s.id AS student_id, s.full_name, s.grade_level, s.age,
                s.gender, s.consent_signed, s.shirt_size,
                s.parent_name, s.personal_email, s.parent_contact, s.parent_email,
                s.birthday, s.medical_conditions, s.allergies, s.previous_participation,
                COALESCE(sc_s.school_name, sc_t.school_name) AS student_school
         FROM   team_members tm
         JOIN   students s   ON s.id  = tm.student_id AND s.is_deleted = 0
         JOIN   teams t      ON t.id  = tm.team_id
         LEFT JOIN schools sc_s ON sc_s.id = s.school_id
         LEFT JOIN schools sc_t ON sc_t.id = t.school_id
         WHERE  tm.team_id IN (${ph})`,
        liveTeamIds
      );
      memberRows.forEach(r => {
        if (!memberMap[r.team_id]) memberMap[r.team_id] = [];
        memberMap[r.team_id].push(r);
      });

      const [liveCoachRows] = await pool.execute(
        `SELECT tc.team_id,
                GROUP_CONCAT(co.full_name SEPARATOR ', ') AS coach_name,
                GROUP_CONCAT(co.email     SEPARATOR ', ') AS coach_email,
                GROUP_CONCAT(co.mobile    SEPARATOR ', ') AS coach_mobile
         FROM   team_coaches tc
         JOIN   coaches co ON co.id = tc.coach_id AND co.is_deleted = 0
         WHERE  tc.team_id IN (${ph})
         GROUP  BY tc.team_id`,
        liveTeamIds
      );
      liveCoachRows.forEach(r => { coachMap[r.team_id] = r; });
    }

    // 3. Inflate snapshot data for confirmed teams
    teamRows.forEach(t => {
      if (t.registration_status === 'confirmed' && t.snapshot_students) {
        const snapStudents = typeof t.snapshot_students === 'string'
          ? JSON.parse(t.snapshot_students) : (t.snapshot_students || []);
        const snapCoaches  = typeof t.snapshot_coaches === 'string'
          ? JSON.parse(t.snapshot_coaches)  : (t.snapshot_coaches  || []);
        const snapSchool   = typeof t.snapshot_school === 'string'
          ? JSON.parse(t.snapshot_school)   : (t.snapshot_school   || null);

        t.members = snapStudents.map(s => ({
          student_id:    s.id,
          full_name:     s.fullName,
          grade_level:   s.gradeLevel,
          age:           s.age || null,
          gender:        s.gender,
          consent_signed: s.consentSigned || 0,
          shirt_size:    s.shirtSize || null,
          parent_name:   s.parentName || null,
          personal_email: s.personalEmail || null,
          parent_contact: s.parentContact || null,
          parent_email:  s.parentEmail || null,
          birthday:      s.birthday || null,
          medical_conditions: s.medicalConditions || null,
          allergies:     s.allergies || null,
          previous_participation: s.previousParticipation || 0,
          student_school: s.schoolName || snapSchool?.schoolName || null,
        }));
        t.coach_name   = snapCoaches.map(c => c.fullName).join(', ')  || null;
        t.coach_email  = snapCoaches.map(c => c.email).join(', ')     || null;
        t.coach_mobile = snapCoaches.map(c => c.mobile).join(', ')    || null;
        if (snapSchool?.schoolName) t.school_name = snapSchool.schoolName;
      } else {
        t.members      = memberMap[t.id] || [];
        const lc       = coachMap[t.id];
        t.coach_name   = lc?.coach_name   || null;
        t.coach_email  = lc?.coach_email  || null;
        t.coach_mobile = lc?.coach_mobile || null;
      }
    });

    // 4. Unique schools
    const schoolSet = new Map();

    // First pass: extract schools from confirmed team snapshots
    teamRows.forEach(t => {
      if (t.registration_status === 'confirmed') {
        const snapSchool = typeof t.snapshot_school === 'string' ? JSON.parse(t.snapshot_school) : (t.snapshot_school || null);
        if (snapSchool?.schoolName && !schoolSet.has(snapSchool.schoolName)) {
          schoolSet.set(snapSchool.schoolName, {
            school_name: snapSchool.schoolName,
            city: snapSchool.city,
            region: snapSchool.region,
            school_type: snapSchool.schoolType,
            contact_number: snapSchool.contactNumber,
            email: snapSchool.email,
            school_head: snapSchool.schoolHead,
            robotics_coordinator: snapSchool.roboticsCoordinator,
            address: snapSchool.address
          });
        }
      }
    });

    // Second pass: for unconfirmed teams, we still need live school data
    const [allSchools] = await pool.execute(
      'SELECT id, school_name, city, region, contact_number, email, school_type, school_head, robotics_coordinator, address FROM schools WHERE is_deleted = 0'
    );
    const schoolByName = {};
    allSchools.forEach(s => { schoolByName[s.school_name] = s; });

    teamRows.forEach(t => {
      if (t.registration_status !== 'confirmed') {
        t.members.forEach(m => {
          if (m.student_school && !schoolSet.has(m.student_school)) {
            schoolSet.set(m.student_school, schoolByName[m.student_school] || { school_name: m.student_school });
          }
        });
        if (t.school_name && !schoolSet.has(t.school_name)) {
          schoolSet.set(t.school_name, schoolByName[t.school_name] || { school_name: t.school_name });
        }
      }
    });

    const schoolRows = [...schoolSet.values()];
    schoolRows.sort((a, b) => (a.school_name || '').localeCompare(b.school_name || ''));

    // 5. Coaches — derived from snapshot-aware team data
    const coachSet = new Map();
    teamRows.forEach(t => {
      if (t.registration_status === 'confirmed' && t.snapshot_coaches) {
        const snapCoaches = typeof t.snapshot_coaches === 'string'
          ? JSON.parse(t.snapshot_coaches) : (t.snapshot_coaches || []);
        snapCoaches.forEach(c => {
          if (c.fullName && !coachSet.has(c.fullName)) {
            coachSet.set(c.fullName, { 
              full_name: c.fullName, 
              email: c.email, 
              mobile: c.mobile, 
              school_name: c.schoolName, 
              position: c.position,
              gender: c.gender,
              birthday: c.birthday,
              emergency_contact: c.emergencyContact,
              shirt_size: c.shirtSize
            });
          }
        });
      }
    });
    if (liveTeamIds.length > 0) {
      const ph = liveTeamIds.map(() => '?').join(',');
      const [liveCoachDetail] = await pool.execute(
        `SELECT DISTINCT co.id, co.full_name, co.email, co.mobile, co.position, 
                co.gender, co.birthday, co.emergency_contact, co.shirt_size,
                sc.school_name
         FROM   coaches co
         JOIN   team_coaches tc ON tc.coach_id = co.id
         LEFT JOIN schools sc ON sc.id = co.school_id
         WHERE  tc.team_id IN (${ph}) AND co.is_deleted = 0`,
        liveTeamIds
      );
      liveCoachDetail.forEach(c => {
        if (!coachSet.has(c.full_name)) coachSet.set(c.full_name, c);
      });
    }
    const coachRows = [...coachSet.values()].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    // 6. Judges (always live — not part of the team snapshot)
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

    // 7. Distinct students — derived from snapshot-aware team members
    const studentSet = new Map();
    teamRows.forEach(t => {
      (t.members || []).forEach(m => {
        const key = m.full_name;
        if (key && !studentSet.has(key)) {
          studentSet.set(key, {
            id:            m.student_id || null,
            full_name:     m.full_name,
            age:           m.age || null,
            grade_level:   m.grade_level,
            gender:        m.gender,
            consent_signed: m.consent_signed || 0,
            shirt_size:    m.shirt_size || null,
            parent_name:   m.parent_name || null,
            personal_email: m.personal_email || null,
            parent_contact: m.parent_contact || null,
            parent_email:  m.parent_email || null,
            birthday:      m.birthday || null,
            medical_conditions: m.medical_conditions || null,
            allergies:     m.allergies || null,
            previous_participation: m.previous_participation || 0,
            school_name:   m.student_school || null,
            team_name:     t.team_name,
          });
        }
      });
    });
    const studentRows = [...studentSet.values()].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    // 8. Competition events in this season
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
// names), unique schools, coaches, judges, and students.
// For CONFIRMED teams: member/coach/school data comes from frozen snapshots.
// For non-confirmed teams: falls back to live joins.
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

    // 2. Teams in this season — fetch snapshot columns too
    const [teamRows] = await pool.execute(
      `SELECT t.id, t.team_name, t.category, t.age_group,
              t.registration_status, t.qualification_status,
              t.payment_status, t.status,
              t.school_id,
              t.snapshot_students, t.snapshot_coaches, t.snapshot_school,
              sc.school_name
       FROM   teams t
       LEFT JOIN schools sc ON sc.id = t.school_id
       WHERE  t.season = ? AND t.is_deleted = 0
       ORDER  BY t.team_name ASC`,
      [season]
    );

    // 3. Member names per team — prefer snapshots for confirmed teams
    const teamIds = teamRows.map(r => r.id);
    const memberMap  = {};  // team_id → array of member objects
    const coachMap   = {};  // team_id → coach display string

    // Live-join members only for teams that are NOT confirmed (no snapshot or not confirmed)
    const liveTeamIds = teamRows
      .filter(t => t.registration_status !== 'confirmed' || !t.snapshot_students)
      .map(t => t.id);

    if (liveTeamIds.length > 0) {
      const ph = liveTeamIds.map(() => '?').join(',');
      const [memberRows] = await pool.execute(
        `SELECT tm.team_id, s.id AS student_id, s.full_name, s.grade_level, s.age,
                s.gender, s.consent_signed, s.shirt_size,
                s.parent_name, s.personal_email, s.parent_contact, s.parent_email,
                s.birthday, s.medical_conditions, s.allergies, s.previous_participation,
                COALESCE(sc_s.school_name, sc_t.school_name) AS student_school
         FROM   team_members tm
         JOIN   students s   ON s.id  = tm.student_id  AND s.is_deleted = 0
         JOIN   teams t      ON t.id  = tm.team_id
         LEFT JOIN schools sc_s ON sc_s.id = s.school_id
         LEFT JOIN schools sc_t ON sc_t.id = t.school_id
         WHERE  tm.team_id IN (${ph})`,
        liveTeamIds
      );
      memberRows.forEach(r => {
        if (!memberMap[r.team_id]) memberMap[r.team_id] = [];
        memberMap[r.team_id].push(r);
      });

      // Live-join coaches for unconfirmed teams
      const [liveCoachRows] = await pool.execute(
        `SELECT tc.team_id,
                GROUP_CONCAT(co.full_name SEPARATOR ', ') AS coach_name,
                GROUP_CONCAT(co.email     SEPARATOR ', ') AS coach_email,
                GROUP_CONCAT(co.mobile    SEPARATOR ', ') AS coach_mobile
         FROM   team_coaches tc
         JOIN   coaches co ON co.id = tc.coach_id AND co.is_deleted = 0
         WHERE  tc.team_id IN (${ph})
         GROUP  BY tc.team_id`,
        liveTeamIds
      );
      liveCoachRows.forEach(r => { coachMap[r.team_id] = r; });
    }

    // Inflate snapshot data for confirmed teams
    teamRows.forEach(t => {
      if (t.registration_status === 'confirmed' && t.snapshot_students) {
        // Parse JSON if still a string (shouldn't be after column but just in case)
        const snapStudents = typeof t.snapshot_students === 'string'
          ? JSON.parse(t.snapshot_students) : (t.snapshot_students || []);
        const snapCoaches  = typeof t.snapshot_coaches === 'string'
          ? JSON.parse(t.snapshot_coaches)  : (t.snapshot_coaches  || []);
        const snapSchool   = typeof t.snapshot_school === 'string'
          ? JSON.parse(t.snapshot_school)   : (t.snapshot_school   || null);

        // Map snapshot students to the same shape as live-joined members
        t.members = snapStudents.map(s => ({
          student_id:    s.id,
          full_name:     s.fullName,
          grade_level:   s.gradeLevel,
          age:           s.age || null,
          gender:        s.gender,
          consent_signed: s.consentSigned || 0,
          shirt_size:    s.shirtSize || null,
          parent_name:   s.parentName || null,
          personal_email: s.personalEmail || null,
          parent_contact: s.parentContact || null,
          parent_email:  s.parentEmail || null,
          birthday:      s.birthday || null,
          medical_conditions: s.medicalConditions || null,
          allergies:     s.allergies || null,
          previous_participation: s.previousParticipation || 0,
          student_school: s.schoolName || snapSchool?.schoolName || null,
        }));
        // Merge snapshot coach info into team row (same shape the frontend expects)
        t.coach_name   = snapCoaches.map(c => c.fullName).join(', ')  || null;
        t.coach_email  = snapCoaches.map(c => c.email).join(', ')     || null;
        t.coach_mobile = snapCoaches.map(c => c.mobile).join(', ')    || null;
        // Use snapshot school name if available
        if (snapSchool?.schoolName) t.school_name = snapSchool.schoolName;
      } else {
        // Unconfirmed: use live-joined data
        t.members      = memberMap[t.id] || [];
        const lc       = coachMap[t.id];
        t.coach_name   = lc?.coach_name   || null;
        t.coach_email  = lc?.coach_email  || null;
        t.coach_mobile = lc?.coach_mobile || null;
      }
    });

    // 4. Unique schools — derived from team data (snapshots + live)
    // 4. Unique schools
    const schoolSet = new Map();

    // First pass: extract schools from confirmed team snapshots
    teamRows.forEach(t => {
      if (t.registration_status === 'confirmed') {
        const snapSchool = typeof t.snapshot_school === 'string' ? JSON.parse(t.snapshot_school) : (t.snapshot_school || null);
        if (snapSchool?.schoolName && !schoolSet.has(snapSchool.schoolName)) {
          schoolSet.set(snapSchool.schoolName, {
            school_name: snapSchool.schoolName,
            city: snapSchool.city,
            region: snapSchool.region,
            school_type: snapSchool.schoolType,
            contact_number: snapSchool.contactNumber,
            email: snapSchool.email,
            school_head: snapSchool.schoolHead,
            robotics_coordinator: snapSchool.roboticsCoordinator,
            address: snapSchool.address
          });
        }
      }
    });

    // Second pass: for unconfirmed teams, we still need live school data
    const [allSchools] = await pool.execute(
      'SELECT id, school_name, city, region, contact_number, email, school_type, school_head, robotics_coordinator, address FROM schools WHERE is_deleted = 0'
    );
    const schoolByName = {};
    allSchools.forEach(s => { schoolByName[s.school_name] = s; });

    teamRows.forEach(t => {
      if (t.registration_status !== 'confirmed') {
        t.members.forEach(m => {
          if (m.student_school && !schoolSet.has(m.student_school)) {
            schoolSet.set(m.student_school, schoolByName[m.student_school] || { school_name: m.student_school });
          }
        });
        if (t.school_name && !schoolSet.has(t.school_name)) {
          schoolSet.set(t.school_name, schoolByName[t.school_name] || { school_name: t.school_name });
        }
      }
    });

    const schoolRows = [...schoolSet.values()];
    schoolRows.sort((a, b) => (a.school_name || '').localeCompare(b.school_name || ''));

    // 5. Coaches — derived from team data (snapshots + live)
    const coachSet = new Map();
    teamRows.forEach(t => {
      if (t.registration_status === 'confirmed' && t.snapshot_coaches) {
        const snapCoaches = typeof t.snapshot_coaches === 'string'
          ? JSON.parse(t.snapshot_coaches) : (t.snapshot_coaches || []);
        snapCoaches.forEach(c => {
          if (c.fullName && !coachSet.has(c.fullName)) {
            coachSet.set(c.fullName, { 
              full_name: c.fullName, 
              email: c.email, 
              mobile: c.mobile, 
              school_name: c.schoolName, 
              position: c.position,
              gender: c.gender,
              birthday: c.birthday,
              emergency_contact: c.emergencyContact,
              shirt_size: c.shirtSize
            });
          }
        });
      }
    });
    // Live coaches for non-confirmed teams
    if (liveTeamIds.length > 0) {
      const ph = liveTeamIds.map(() => '?').join(',');
      const [liveCoachDetail] = await pool.execute(
        `SELECT DISTINCT co.id, co.full_name, co.email, co.mobile, co.position,
                         co.gender, co.birthday, co.emergency_contact, co.shirt_size,
                         sc.school_name
         FROM   coaches co
         JOIN   team_coaches tc ON tc.coach_id = co.id
         WHERE  tc.team_id IN (${ph}) AND co.is_deleted = 0`,
        liveTeamIds
      );
      liveCoachDetail.forEach(c => {
        if (!coachSet.has(c.full_name)) coachSet.set(c.full_name, c);
      });
    }
    const coachRows = [...coachSet.values()].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    // 6. Judges assigned to this season (always live — judges aren't snapshotted)
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

    // 7. Distinct students — derived from team members (snapshot-aware)
    const studentSet = new Map();
    teamRows.forEach(t => {
      (t.members || []).forEach(m => {
        const key = m.full_name;
        if (key && !studentSet.has(key)) {
          studentSet.set(key, {
            id:            m.student_id || null,
            full_name:     m.full_name,
            age:           m.age || null,
            grade_level:   m.grade_level,
            gender:        m.gender,
            consent_signed: m.consent_signed || 0,
            shirt_size:    m.shirt_size || null,
            parent_name:   m.parent_name || null,
            personal_email: m.personal_email || null,
            parent_contact: m.parent_contact || null,
            parent_email:  m.parent_email || null,
            birthday:      m.birthday || null,
            medical_conditions: m.medical_conditions || null,
            allergies:     m.allergies || null,
            previous_participation: m.previous_participation || 0,
            school_name:   m.student_school || null,
            team_name:     t.team_name,
          });
        }
      });
    });
    const studentRows = [...studentSet.values()].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

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
router.post('/', adminOnly, async (req, res) => {
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
router.put('/:id', adminOnly, async (req, res) => {
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
router.delete('/:id', adminOnly, async (req, res) => {
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
