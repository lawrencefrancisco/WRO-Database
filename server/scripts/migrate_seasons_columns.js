require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../db/pool');
async function run() {
  const conn = await pool.getConnection();
  try {
    const checks = [
      { col: 'status',        sql: "ALTER TABLE seasons ADD COLUMN status ENUM('ongoing','completed') NOT NULL DEFAULT 'ongoing'" },
      { col: 'snapshot_data', sql: "ALTER TABLE seasons ADD COLUMN snapshot_data JSON DEFAULT NULL COMMENT 'Frozen season data when status=completed'" },
      { col: 'completed_at',  sql: "ALTER TABLE seasons ADD COLUMN completed_at DATETIME DEFAULT NULL" },
    ];

    for (const { col, sql } of checks) {
      const [rows] = await conn.execute(
        "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seasons' AND COLUMN_NAME = ?",
        [col]
      );
      if (rows[0].cnt === 0) {
        await conn.execute(sql);
        console.log('Added seasons.' + col);
      } else {
        console.log('seasons.' + col + ' already exists');
      }
    }
    console.log('DB migration complete.');
  } finally {
    conn.release();
    process.exit(0);
  }
}
run().catch(e => { console.error(e.message); process.exit(1); });
