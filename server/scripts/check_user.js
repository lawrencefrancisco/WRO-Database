const pool = require('../db/pool');

async function checkUser() {
  try {
    const [rows] = await pool.execute('SELECT username, name, role, email, password_hash FROM users');
    console.log('All Users:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUser();
