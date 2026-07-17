// ============================================================
// WRO Philippines DBMS – MySQL Connection Pool
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || '[https://wro-database.onrender.com](https://wro-database.onrender.com)',
  port:              parseInt(process.env.DB_PORT || '3306'),
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASS     || '',
  database:          process.env.DB_NAME     || 'wro_philippines',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  // Return JS Date objects for DATETIME columns
  dateStrings:       false,
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
