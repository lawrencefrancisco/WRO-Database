const pool = require('./server/db/pool');

async function test() {
  const [participationRows] = await pool.execute(`
    SELECT
      RIGHT(t.season, 4)                    AS year,
      CAST(COUNT(DISTINCT t.id) AS SIGNED)  AS teams,
      CAST(COUNT(DISTINCT tm.student_id) AS SIGNED) AS students
    FROM   teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id
    WHERE  t.is_deleted = 0
      AND  t.season IS NOT NULL
      AND  t.season != ''
      AND  RIGHT(t.season, 4) REGEXP '^[0-9]{4}$'
    GROUP  BY year
    ORDER  BY year ASC
  `);
  
  console.log("Raw SQL Result:", participationRows);
  process.exit(0);
}
test().catch(console.error);
