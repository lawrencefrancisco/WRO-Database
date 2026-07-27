// ============================================================
// WRO Philippines DBMS – Backfill Historical Snapshots
// ============================================================
// Run once to freeze snapshots for all teams and awards that
// were created before the snapshot feature was added.
//
// Usage:
//   cd server
//   node scripts/backfill_snapshots.js
//
// This script is also called automatically by auto_init at
// startup for any teams/awards that are still unsnapshotted.
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../db/pool');

async function freezeTeamSnapshot(conn, teamId) {
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

async function freezeAwardSnapshot(conn, awardId, teamId) {
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

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('🔍 Scanning for teams without snapshots...');

    // Backfill confirmed teams (highest priority — they are frozen in history)
    const [confirmedTeams] = await conn.execute(
      `SELECT id FROM teams WHERE is_deleted = 0 AND registration_status = 'confirmed' AND snapshot_students IS NULL`
    );
    console.log(`   → ${confirmedTeams.length} confirmed team(s) to snapshot`);
    for (const t of confirmedTeams) {
      await freezeTeamSnapshot(conn, t.id);
      process.stdout.write('.');
    }

    // Also backfill all other non-deleted teams so they have a snapshot if they get confirmed later
    const [otherTeams] = await conn.execute(
      `SELECT id FROM teams WHERE is_deleted = 0 AND registration_status != 'confirmed' AND snapshot_students IS NULL`
    );
    console.log(`\n   → ${otherTeams.length} other team(s) to snapshot (pre-freeze)`);
    for (const t of otherTeams) {
      await freezeTeamSnapshot(conn, t.id);
      process.stdout.write('.');
    }

    // Backfill awards
    console.log('\n🔍 Scanning for awards without snapshots...');
    const [awards] = await conn.execute(
      `SELECT id, team_id FROM awards WHERE is_deleted = 0 AND snapshot_team IS NULL`
    );
    console.log(`   → ${awards.length} award(s) to snapshot`);
    for (const a of awards) {
      await freezeAwardSnapshot(conn, a.id, a.team_id);
      process.stdout.write('.');
    }

    console.log('\n✅ Backfill complete.');
  } catch (err) {
    console.error('\n❌ Backfill error:', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    process.exit();
  }
}

run();
