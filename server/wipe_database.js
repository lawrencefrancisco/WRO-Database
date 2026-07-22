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
  'announcement_reads',
  'announcements',
  'audit_logs',
  'awards',
  'coaches',
  'communications',
  'competitions',
  'email_log',
  'judge_assignments',
  'judges',
  'judging',
  'notification_log',
  'payment_logs',
  'payments',
  'schools',
  'seasons',
  'students',
  'team_members',
  'teams',
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
        // Keep all user accounts as requested
        console.log(`🧹 Skipped table: users (preserved all user accounts)`);
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
