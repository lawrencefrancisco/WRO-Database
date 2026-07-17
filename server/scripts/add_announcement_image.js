// Migration: Add image_url column to announcements table
const pool = require('../db/pool');

async function run() {
  try {
    // Check if column already exists
    const [cols] = await pool.execute('SHOW COLUMNS FROM announcements LIKE "image_url"');
    if (cols.length > 0) {
      console.log('image_url column already exists — skipping.');
      process.exit(0);
    }
    await pool.execute(
      'ALTER TABLE announcements ADD COLUMN image_url MEDIUMTEXT DEFAULT NULL AFTER body'
    );
    console.log('✅ image_url column added to announcements table.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
