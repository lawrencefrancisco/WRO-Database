// ============================================================
// WRO Philippines DBMS – MySQL Connection Pool
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              parseInt(process.env.DB_PORT || '3306'),
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASS     || '',
  database:          process.env.DB_NAME     || 'wro_philippines',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  // dateStrings: true — return DATE/DATETIME columns as plain 'YYYY-MM-DD' strings
  // instead of JS Date objects. Prevents UTC-to-local timezone shifting
  // (e.g. in UTC+8 Philippines, midnight UTC+8 = "prev-dayT16:00:00Z" which
  // JSON-serializes as the previous day, causing the birthday off-by-one bug).
  dateStrings:       true,

  // Automatically parse JSON columns
  typeCast(field, next) {
    if (field.type === 'JSON') {
      try { return JSON.parse(field.string()); }
      catch { return null; }
    }
    return next();
  },
});

module.exports = pool;
