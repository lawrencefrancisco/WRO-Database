// ============================================================
// WRO Philippines DBMS – Role Migration Script
// Removes JUDGE, COACH, VOLUNTEER roles → STANDARD_USER
// Adds school_id column to users table
// ============================================================

const pool = require('../db/pool');

async function run() {
  console.log('Starting role migration...');

  // 1. Add school_id to users if not exists
  try {
    await pool.execute(
      'ALTER TABLE users ADD COLUMN school_id INT UNSIGNED NULL DEFAULT NULL AFTER email'
    );
    console.log('OK: Added school_id column to users table.');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('OK: school_id column already exists, skipping.');
    } else {
      throw e;
    }
  }

  // 2. Add FK for school_id if not exists
  try {
    await pool.execute(
      'ALTER TABLE users ADD CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL'
    );
    console.log('OK: Added FK constraint for school_id.');
  } catch (e) {
    if (e.code === 'ER_DUP_KEY' || e.message.includes('Duplicate')) {
      console.log('OK: FK constraint already exists, skipping.');
    } else {
      // Not fatal – FK might fail if MySQL version differs; log and continue
      console.warn('WARN: Could not add FK constraint:', e.message);
    }
  }

  // 3. Convert COACH → STANDARD_USER
  const [coachRes] = await pool.execute(
    "UPDATE users SET role = 'STANDARD_USER' WHERE role = 'COACH'"
  );
  console.log(`OK: Converted ${coachRes.affectedRows} COACH user(s) → STANDARD_USER.`);

  // 4. Convert JUDGE → STANDARD_USER
  const [judgeRes] = await pool.execute(
    "UPDATE users SET role = 'STANDARD_USER' WHERE role = 'JUDGE'"
  );
  console.log(`OK: Converted ${judgeRes.affectedRows} JUDGE user(s) → STANDARD_USER.`);

  // 5. Convert VOLUNTEER → STANDARD_USER
  const [volRes] = await pool.execute(
    "UPDATE users SET role = 'STANDARD_USER' WHERE role = 'VOLUNTEER'"
  );
  console.log(`OK: Converted ${volRes.affectedRows} VOLUNTEER user(s) → STANDARD_USER.`);

  // 6. Modify the ENUM column to remove old roles
  await pool.execute(
    `ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN','EVENT_ADMIN','STANDARD_USER') NOT NULL DEFAULT 'STANDARD_USER'`
  );
  console.log('OK: Updated role ENUM to SUPER_ADMIN, EVENT_ADMIN, STANDARD_USER.');

  const [users] = await pool.execute('SELECT id, username, name, role FROM users WHERE is_deleted=0');
  console.log('\nCurrent users after migration:');
  users.forEach(u => console.log(`  [${u.role}] ${u.username} – ${u.name}`));

  console.log('\nMigration complete!');
  process.exit(0);
}

run().catch(e => {
  console.error('MIGRATION FAILED:', e.message);
  process.exit(1);
});
