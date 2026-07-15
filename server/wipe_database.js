// ============================================================
// WRO Philippines DBMS – Full Database Wipe Script
// WARNING: THIS WILL DELETE ALL DATA IN ALL TABLES AND RESET
// ALL AUTO_INCREMENT COUNTERS TO 1.
//
// Run from the project root: node server/wipe_database.js
// ============================================================

require('dotenv').config(); // Ensure environment variables are loaded
const pool = require('./db/pool');

const tables = [
  'audit_logs',
  'delegation',
  'communications',
  'payments',
  'awards',
  'judge_assignments',
  'team_members',
  'teams',
  'judges',
  'competitions',
  'seasons',
  'coaches',
  'students',
  'schools',
  'users'
];

async function wipeDatabase() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('⚠️ Starting full database wipe...');
    
    // 1. Disable foreign key checks
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign key checks disabled.');

    // 2. Truncate all tables (with exception for users)
    for (const table of tables) {
      if (table === 'users') {
        // Delete everyone except the super admin
        await conn.execute("DELETE FROM users WHERE user_code != 'USER_SUPERADMIN'");
        // Reset AUTO_INCREMENT (MySQL will automatically adjust to max(id) + 1)
        await conn.execute("ALTER TABLE users AUTO_INCREMENT = 1");
        console.log(`🧹 Wiped table: users (kept USER_SUPERADMIN)`);
      } else {
        await conn.execute(`TRUNCATE TABLE ${table}`);
        console.log(`🧹 Truncated table: ${table}`);
      }
    }

    // 3. Re-enable foreign key checks
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign key checks re-enabled.');
    
    console.log('\n🎉 Database completely wiped!');
    console.log('All tables are empty and AUTO_INCREMENT counters reset to 1.');
    
  } catch (err) {
    console.error('❌ Error wiping database:', err);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

wipeDatabase();
