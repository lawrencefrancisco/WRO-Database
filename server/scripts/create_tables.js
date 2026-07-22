// One-time script to create announcements and notification_log tables
const pool = require('../db/pool');

async function run() {
  await pool.execute([
    'CREATE TABLE IF NOT EXISTS announcements (',
    '  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,',
    '  announcement_code VARCHAR(60) NOT NULL UNIQUE,',
    '  title VARCHAR(300) NOT NULL,',
    '  body LONGTEXT,',
    '  category ENUM(\'general\',\'payment\',\'qualification\',\'competition\') DEFAULT \'general\',',
    '  recipients ENUM(\'all\',\'schools\',\'coaches\',\'teams\',\'judges\',\'volunteers\') DEFAULT \'all\',',
    '  status ENUM(\'draft\',\'published\',\'archived\') DEFAULT \'draft\',',
    '  publish_at DATETIME NULL,',
    '  created_by INT UNSIGNED NULL,',
    '  is_deleted TINYINT(1) DEFAULT 0,',
    '  deleted_at DATETIME NULL,',
    '  created_at DATETIME DEFAULT NOW(),',
    '  updated_at DATETIME DEFAULT NOW()',
    ')'
  ].join(' '));
  console.log('OK: announcements table ready.');

  await pool.execute([
    'CREATE TABLE IF NOT EXISTS notification_log (',
    '  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,',
    '  event_type VARCHAR(100) NOT NULL,',
    '  title VARCHAR(300) NOT NULL,',
    '  message LONGTEXT,',
    '  team_id INT UNSIGNED NULL,',
    '  school_id INT UNSIGNED NULL,',
    '  triggered_by VARCHAR(200),',
    '  is_read TINYINT(1) DEFAULT 0,',
    '  read_at DATETIME NULL,',
    '  created_at DATETIME DEFAULT NOW()',
    ')'
  ].join(' '));
  console.log('OK: notification_log table ready.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
