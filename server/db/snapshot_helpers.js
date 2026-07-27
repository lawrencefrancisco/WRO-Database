// ============================================================
// WRO Philippines DBMS – Snapshot Helper Functions
// ============================================================
// Shared logic for freezing team and award snapshots.
// These helpers accept a raw connection/pool object so they
// can be used from both inside auto_init (conn) and from
// route handlers (pool).
// ============================================================

/**
 * Freeze the historical snapshot for a team.
 * Captures members, coaches, and the linked school profile at the current moment.
 *
 * @param {object} conn  - mysql2 pool or connection
 * @param {number} teamId
 */
async function freezeTeamSnapshotInline(conn, teamId) {
  const [students] = await conn.execute(`
    SELECT s.id, s.full_name AS fullName, s.grade_level AS gradeLevel,
           s.gender, s.shirt_size AS shirtSize,
           sc.school_name AS schoolName, sc.region
    FROM   team_members tm
    JOIN   students s  ON s.id = tm.student_id AND s.is_deleted = 0
    LEFT JOIN schools sc ON sc.id = s.school_id
    WHERE  tm.team_id = ?
  `, [teamId]);

  const [coaches] = await conn.execute(`
    SELECT c.id, c.full_name AS fullName, c.email, c.mobile,
           c.position, sc.school_name AS schoolName
    FROM   team_coaches tc
    JOIN   coaches c  ON c.id = tc.coach_id AND c.is_deleted = 0
    LEFT JOIN schools sc ON sc.id = c.school_id
    WHERE  tc.team_id = ?
  `, [teamId]);

  const [[team]] = await conn.execute('SELECT school_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
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
    `UPDATE teams SET snapshot_students = ?, snapshot_coaches = ?, snapshot_school = ? WHERE id = ?`,
    [JSON.stringify(students), JSON.stringify(coaches), JSON.stringify(school), teamId]
  );
}

/**
 * Freeze the historical snapshot for an award.
 * Captures the team name, schools (via members), and coaches at the current moment.
 *
 * @param {object} conn   - mysql2 pool or connection
 * @param {number} awardId
 * @param {number|null} teamId
 */
async function freezeAwardSnapshotInline(conn, awardId, teamId) {
  if (!teamId) return;

  const [[team]] = await conn.execute(
    'SELECT id, team_name AS teamName, season, category FROM teams WHERE id = ? LIMIT 1',
    [teamId]
  );
  if (!team) return;

  const [memberSchools] = await conn.execute(`
    SELECT DISTINCT sc.id, sc.school_name AS schoolName, sc.region
    FROM   team_members tm
    JOIN   students s  ON s.id = tm.student_id AND s.is_deleted = 0
    JOIN   schools  sc ON sc.id = s.school_id
    WHERE  tm.team_id = ?
  `, [teamId]);

  if (memberSchools.length === 0) {
    const [[t]] = await conn.execute('SELECT school_id FROM teams WHERE id = ?', [teamId]);
    if (t?.school_id) {
      const [[sc]] = await conn.execute(
        'SELECT id, school_name AS schoolName, region FROM schools WHERE id = ? LIMIT 1',
        [t.school_id]
      );
      if (sc) memberSchools.push(sc);
    }
  }

  const [coaches] = await conn.execute(`
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

  await conn.execute(
    'UPDATE awards SET snapshot_team = ? WHERE id = ?',
    [JSON.stringify(snapshot), awardId]
  );
}

module.exports = { freezeTeamSnapshotInline, freezeAwardSnapshotInline };
