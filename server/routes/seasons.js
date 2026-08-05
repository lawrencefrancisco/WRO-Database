// ============================================================
// WRO Philippines DBMS – Seasons Routes
// id is INT AUTO_INCREMENT. season_code is the business code
// (e.g. WRO_2026). name and year remain UNIQUE for dedup checks.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

const adminOnly = requireRole('SUPER_ADMIN', 'EVENT_ADMIN');

// ── GET /api/seasons ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, season_code, name, year, is_active, status, completed_at, created_at FROM seasons ORDER BY year DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/seasons – create by year ───────────────────────
// Body: { year: 2026 }
// Season name is auto-generated as "WRO <year>".
// season_code is auto-generated as "WRO_<year>".
router.post('/', adminOnly, async (req, res) => {
  try {
    const year = parseInt(req.body.year, 10);
    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid year. Must be between 2000 and 2100.' });
    }

    const name       = `WRO ${year}`;
    const seasonCode = `WRO_${year}`;

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

    const [result] = await pool.execute(
      "INSERT INTO seasons (season_code, name, year, is_active, status) VALUES (?, ?, ?, 1, 'ongoing')",
      [seasonCode, name, year]
    );

    const [rows] = await pool.execute('SELECT * FROM seasons WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Season already exists.' });
    }
    console.error('[Seasons] POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/seasons/:id/status ───────────────────────────────
// Body: { status: 'completed' | 'ongoing' }
// On 'completed': build and freeze a full season snapshot.
// On 'ongoing':   clear the snapshot, restore live data.
router.put('/:id/status', adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['ongoing', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, error: 'status must be "ongoing" or "completed".' });
  }

  const seasonId = parseInt(req.params.id, 10);
  const [[season]] = await pool.execute('SELECT * FROM seasons WHERE id = ?', [seasonId]);
  if (!season) return res.status(404).json({ success: false, error: 'Season not found.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (status === 'ongoing') {
      // Reactivate the season — preserve the snapshot (never wipe historical data)
      await conn.execute(
        "UPDATE seasons SET status = 'ongoing', is_active = 1 WHERE id = ?",
        [seasonId]
      );
      await conn.commit();
      const [[updated]] = await conn.execute('SELECT * FROM seasons WHERE id = ?', [seasonId]);
      return res.json({ success: true, season: updated });
    }

    // ── status === 'completed': build the full snapshot ────────────────
    const seasonName = season.name;

    // 1. Teams — include all fields needed for complete historical record
    const [teamRows] = await conn.execute(
      `SELECT t.id, t.team_code, t.team_name, t.category, t.age_group,
              t.robot_platform, t.programming_language,
              t.registration_status, t.qualification_status, t.payment_status, t.status,
              t.snapshot_students, t.snapshot_coaches, t.snapshot_school,
              sc.school_name
       FROM   teams t
       LEFT JOIN schools sc ON sc.id = t.school_id
       WHERE  t.season = ? AND t.is_deleted = 0
       ORDER  BY t.team_name ASC`,
      [seasonName]
    );

    // 2. Build members for each team
    const teamIds = teamRows.map(t => t.id);
    const memberMap = {};
    const coachMap  = {};

    if (teamIds.length > 0) {
      const ph = teamIds.map(() => '?').join(',');

      const [memberRows] = await conn.execute(
        `SELECT tm.team_id, s.id AS student_id, s.full_name, s.grade_level, s.age,
                s.gender, s.consent_signed, s.shirt_size,
                s.parent_name, s.personal_email, s.parent_contact, s.parent_email,
                s.birthday, s.medical_conditions, s.allergies, s.previous_participation,
                COALESCE(sc_s.school_name, sc_t.school_name) AS student_school
         FROM   team_members tm
         JOIN   students s   ON s.id = tm.student_id AND s.is_deleted = 0
         JOIN   teams t      ON t.id = tm.team_id
         LEFT JOIN schools sc_s ON sc_s.id = s.school_id
         LEFT JOIN schools sc_t ON sc_t.id = t.school_id
         WHERE  tm.team_id IN (${ph})`,
        teamIds
      );
      memberRows.forEach(r => {
        if (!memberMap[r.team_id]) memberMap[r.team_id] = [];
        memberMap[r.team_id].push(r);
      });

      const [liveCoachRows] = await conn.execute(
        `SELECT tc.team_id,
                co.id, co.full_name, co.email, co.mobile, co.position,
                co.birthday, co.gender, co.shirt_size,
                sc.school_name AS coach_school
         FROM   team_coaches tc
         JOIN   coaches co ON co.id = tc.coach_id AND co.is_deleted = 0
         LEFT JOIN schools sc ON sc.id = co.school_id
         WHERE  tc.team_id IN (${ph})`,
        teamIds
      );
      liveCoachRows.forEach(r => {
        if (!coachMap[r.team_id]) coachMap[r.team_id] = [];
        coachMap[r.team_id].push(r);
      });
    }

    // 3. Inflate team members + coaches (prefer existing snapshot for confirmed teams)
    // IMPORTANT: per-team snapshots (freezeTeamSnapshot) store data in camelCase
    // (fullName, gradeLevel, schoolName). The season overlay renderer expects
    // snake_case (full_name, grade_level, student_school). Normalize here.
    const normalizeMember = s => ({
      student_id:             s.student_id             || s.id              || null,
      full_name:              s.full_name              || s.fullName        || '',
      grade_level:            s.grade_level            || s.gradeLevel      || '',
      age:                    s.age                    || null,
      gender:                 s.gender                 || '',
      consent_signed:         s.consent_signed         ?? s.consentSigned  ?? 0,
      shirt_size:             s.shirt_size             || s.shirtSize       || null,
      parent_name:            s.parent_name            || s.parentName      || null,
      personal_email:         s.personal_email         || s.personalEmail   || null,
      parent_contact:         s.parent_contact         || s.parentContact   || null,
      parent_email:           s.parent_email           || s.parentEmail     || null,
      birthday:               s.birthday               || null,
      medical_conditions:     s.medical_conditions     || s.medicalConditions || null,
      allergies:              s.allergies              || null,
      previous_participation: s.previous_participation ?? s.previousParticipation ?? 0,
      // student_school: prefer explicit field, then camelCase schoolName
      student_school:         s.student_school         || s.schoolName      || '',
    });

    const normalizeCoach = c => ({
      id:           c.id           || null,
      full_name:    c.full_name    || c.fullName    || '',
      email:        c.email        || '',
      mobile:       c.mobile       || '',
      position:     c.position     || '',
      birthday:     c.birthday     || null,
      gender:       c.gender       || '',
      shirt_size:   c.shirt_size   || c.shirtSize   || null,
      coach_school: c.coach_school || c.schoolName  || '',
    });

    const snappedTeams = teamRows.map(t => {
      let members, coaches, schoolName;

      if (t.registration_status === 'confirmed' && t.snapshot_students) {
        // Already has a team-level snapshot — use it, normalizing to snake_case
        const snapS  = typeof t.snapshot_students === 'string' ? JSON.parse(t.snapshot_students) : (t.snapshot_students || []);
        const snapC  = typeof t.snapshot_coaches  === 'string' ? JSON.parse(t.snapshot_coaches)  : (t.snapshot_coaches  || []);
        const snapSc = typeof t.snapshot_school   === 'string' ? JSON.parse(t.snapshot_school)   : (t.snapshot_school   || null);
        members    = snapS.map(normalizeMember);
        coaches    = snapC.map(normalizeCoach);
        schoolName = snapSc?.schoolName || snapSc?.school_name || t.school_name;
      } else {
        members   = (memberMap[t.id] || []).map(s => ({
          student_id: s.student_id, full_name: s.full_name, grade_level: s.grade_level,
          age: s.age, gender: s.gender, consent_signed: s.consent_signed,
          shirt_size: s.shirt_size, parent_name: s.parent_name,
          personal_email: s.personal_email, parent_contact: s.parent_contact,
          parent_email: s.parent_email, birthday: s.birthday,
          medical_conditions: s.medical_conditions, allergies: s.allergies,
          previous_participation: s.previous_participation,
          student_school: s.student_school,
        }));
        coaches   = (coachMap[t.id] || []).map(c => ({
          id: c.id, full_name: c.full_name, email: c.email, mobile: c.mobile,
          position: c.position, birthday: c.birthday, gender: c.gender,
          shirt_size: c.shirt_size, coach_school: c.coach_school,
        }));
        schoolName = t.school_name;
      }

      return {
        id: t.id, team_code: t.team_code, team_name: t.team_name,
        category: t.category, age_group: t.age_group,
        robot_platform: t.robot_platform, programming_language: t.programming_language,
        registration_status: t.registration_status, qualification_status: t.qualification_status,
        payment_status: t.payment_status, status: t.status,
        school_name: schoolName,
        members, coaches,
      };
    });

    // 4. Unique schools
    const schoolSet = new Map();
    snappedTeams.forEach(t => {
      if (t.school_name && !schoolSet.has(t.school_name)) {
        schoolSet.set(t.school_name, { school_name: t.school_name });
      }
    });

    // Also pull school details directly for confirmed teams
    if (teamIds.length > 0) {
      const ph = teamIds.map(() => '?').join(',');
      const [schoolDetails] = await conn.execute(
        `SELECT DISTINCT sc.school_name, sc.school_type, sc.region, sc.province,
                sc.city, sc.address, sc.contact_number, sc.email,
                sc.school_head, sc.robotics_coordinator, sc.website, sc.status
         FROM   teams t
         JOIN   schools sc ON sc.id = t.school_id
         WHERE  t.id IN (${ph}) AND sc.is_deleted = 0`,
        teamIds
      );
      schoolDetails.forEach(s => {
        if (!schoolSet.has(s.school_name)) schoolSet.set(s.school_name, s);
        else Object.assign(schoolSet.get(s.school_name), s);
      });
    }
    const schoolRows = [...schoolSet.values()].sort((a, b) => (a.school_name || '').localeCompare(b.school_name || ''));

    // 5. Unique coaches
    const coachSet = new Map();
    snappedTeams.forEach(t => {
      (t.coaches || []).forEach(c => {
        if (c.full_name && !coachSet.has(c.full_name)) coachSet.set(c.full_name, c);
      });
    });
    const coachRows = [...coachSet.values()].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    // 6. Judges
    const [rawJudges] = await conn.execute(
      `SELECT j.id, j.full_name, j.email, j.contact_number, j.gender, j.status,
              COALESCE(
                (SELECT GROUP_CONCAT(ja.category ORDER BY ja.category SEPARATOR ', ')
                 FROM judge_assignments ja
                 WHERE ja.judge_id = j.id AND ja.season = ?),
                j.judging_category
              ) AS judging_category,
              (SELECT MAX(ja.snapshot_data) FROM judge_assignments ja WHERE ja.judge_id = j.id AND ja.season = ?) AS snapshot_data
       FROM   judges j
       WHERE  (j.season = ? OR EXISTS (
                 SELECT 1 FROM judge_assignments ja
                 WHERE ja.judge_id = j.id AND ja.season = ?
               ))
          AND j.is_deleted = 0
       ORDER  BY j.full_name ASC`,
      [seasonName, seasonName, seasonName, seasonName]
    );
    const judgeRows = rawJudges.map(j => {
      // Apply judge snapshot if available
      const snap = j.snapshot_data
        ? (typeof j.snapshot_data === 'string' ? JSON.parse(j.snapshot_data) : j.snapshot_data)
        : null;
      return {
        id: j.id,
        full_name:      snap?.full_name      || j.full_name,
        email:          snap?.email          || j.email,
        contact_number: snap?.contact_number || j.contact_number,
        gender:         snap?.gender         || j.gender,
        status:         j.status,
        judging_category: j.judging_category,
      };
    });

    // 7. Unique students across all teams
    const studentSet = new Map();
    snappedTeams.forEach(t => {
      (t.members || []).forEach(m => {
        const key = m.full_name || m.fullName;
        if (key && !studentSet.has(key)) {
          studentSet.set(key, {
            full_name:     m.full_name     || m.fullName,
            grade_level:   m.grade_level   || m.gradeLevel,
            age:           m.age,
            gender:        m.gender,
            consent_signed: m.consent_signed ?? m.consentSigned ?? 0,
            shirt_size:    m.shirt_size    || m.shirtSize,
            parent_name:   m.parent_name   || m.parentName,
            personal_email: m.personal_email || m.personalEmail,
            parent_contact: m.parent_contact || m.parentContact,
            parent_email:  m.parent_email  || m.parentEmail,
            birthday:      m.birthday,
            school_name:   m.student_school || m.schoolName,
            team_name:     t.team_name,
          });
        }
      });
    });
    const studentRows = [...studentSet.values()].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    // 8. Competition events
    const [eventRows] = await conn.execute(
      `SELECT id, name, date, venue, status, categories
       FROM   competitions
       WHERE  season = ? AND is_deleted = 0
       ORDER  BY date ASC`,
      [seasonName]
    );
    eventRows.forEach(r => {
      if (typeof r.categories === 'string') {
        try { r.categories = JSON.parse(r.categories); } catch { r.categories = []; }
      }
    });

    // 9. Payments — full payment trail for each team in this season
    const [paymentRows] = await conn.execute(
      `SELECT p.id, p.payment_code, p.amount, p.balance, p.payment_status,
              p.payment_date, p.or_number, p.payment_method, p.notes,
              t.team_name, t.team_code, sc.school_name
       FROM   payments p
       JOIN   teams t  ON t.id = p.team_id AND t.is_deleted = 0
       LEFT JOIN schools sc ON sc.id = t.school_id
       WHERE  t.season = ? AND p.is_deleted = 0
       ORDER  BY t.team_name ASC, p.payment_date ASC`,
      [seasonName]
    ).catch(() => [[]]);
    const paymentsSnap = paymentRows.map(p => ({
      payment_code:   p.payment_code,
      team_name:      p.team_name,
      team_code:      p.team_code,
      school_name:    p.school_name,
      amount:         p.amount,
      balance:        p.balance,
      payment_status: p.payment_status,
      payment_date:   p.payment_date,
      or_number:      p.or_number,
      payment_method: p.payment_method,
      notes:          p.notes,
    }));

    // 10. Awards — for teams in this season
    // NOTE: awards table has no direct season column; filter via team join.
    // Actual columns: award, category, year, has_trophy, has_medal, has_certificate, status, snapshot_team
    const [awardRows] = await conn.execute(
      `SELECT a.id, a.award, a.category, a.year,
              a.has_trophy, a.has_medal, a.has_certificate,
              a.status, a.event, a.competition_id,
              a.snapshot_team,
              t.team_name AS live_team_name,
              sc.school_name AS live_school_name
       FROM   awards a
       JOIN   teams   t  ON t.id  = a.team_id  AND t.is_deleted = 0
       LEFT JOIN schools sc ON sc.id = t.school_id AND sc.is_deleted = 0
       WHERE  t.season = ? AND a.is_deleted = 0
       ORDER  BY a.year DESC, a.award ASC`,
      [seasonName]
    ).catch(() => [[]]);

    const awardsSnap = awardRows.map(a => {
      let teamName   = a.live_team_name  || '—';
      let schoolName = a.live_school_name || '—';
      if (a.snapshot_team) {
        try {
          const snap = typeof a.snapshot_team === 'string'
            ? JSON.parse(a.snapshot_team)
            : a.snapshot_team;
          if (snap.teamName) teamName = snap.teamName;
          if (snap.schools && snap.schools.length > 0) {
            schoolName = snap.schools.map(s => s.schoolName).filter(Boolean).join(', ');
          }
        } catch (_) {}
      }
      return {
        id:              a.id,
        award:           a.award,
        category:        a.category,
        year:            a.year,
        status:          a.status,
        has_trophy:      a.has_trophy,
        has_medal:       a.has_medal,
        has_certificate: a.has_certificate,
        event:           a.event,
        competition_id:  a.competition_id,
        team_name:       teamName,
        school_name:     schoolName,
      };
    });

    const snapshotPayload = {
      frozen_at: new Date().toISOString(),
      teams:    snappedTeams,
      schools:  schoolRows,
      coaches:  coachRows,
      judges:   judgeRows,
      students: studentRows,
      events:   eventRows,
      payments: paymentsSnap,
      awards:   awardsSnap,
    };

    await conn.execute(
      "UPDATE seasons SET status = 'completed', snapshot_data = ?, completed_at = NOW(), is_active = 0 WHERE id = ?",
      [JSON.stringify(snapshotPayload), seasonId]
    );

    await conn.commit();
    const [[updated]] = await conn.execute('SELECT id, season_code, name, year, is_active, status, completed_at, created_at FROM seasons WHERE id = ?', [seasonId]);
    res.json({ success: true, season: updated });

  } catch (err) {
    await conn.rollback();
    console.error('[Seasons] PUT status error:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/seasons/:id ───────────────────────────────────
// Hard delete – seasons are lightweight reference data.
// Teams referencing this season by name string are unaffected.
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await pool.execute('DELETE FROM seasons WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Seasons] DELETE error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
