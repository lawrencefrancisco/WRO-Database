const pool = require('../db/pool.js');

async function backfill() {
  try {
    // 1. Teams already backfilled 17 rows, but let's just make sure.
    
    // 2. Now backfill seasons snapshot_data
    const [seasons] = await pool.execute('SELECT id, snapshot_data FROM seasons WHERE snapshot_data IS NOT NULL');
    let seasonCount = 0;
    
    for (const season of seasons) {
      if (!season.snapshot_data) continue;
      
      let parsed;
      try {
        parsed = typeof season.snapshot_data === 'string' ? JSON.parse(season.snapshot_data) : season.snapshot_data;
      } catch(e) {
        continue;
      }
      
      if (!parsed || !Array.isArray(parsed.teams)) continue;
      
      let changed = false;
      for (const team of parsed.teams) {
        if (Array.isArray(team.members)) {
          for (const member of team.members) {
            if (member.student_id && typeof member.personal_contact === 'undefined') {
              const [student] = await pool.execute('SELECT personal_contact FROM students WHERE id = ?', [member.student_id]);
              if (student.length > 0) {
                member.personal_contact = student[0].personal_contact || null;
                changed = true;
              }
            }
          }
        }
      }
      
      if (changed) {
        await pool.execute('UPDATE seasons SET snapshot_data = ? WHERE id = ?', [JSON.stringify(parsed), season.id]);
        seasonCount++;
      }
    }
    console.log(`Backfilled personalContact for ${seasonCount} seasons.`);
    
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

backfill();
