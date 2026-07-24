const pool = require('../db/pool');

async function deleteTestUser() {
  try {
    const email = 'lawrence.dhaniel@gmail.com';
    const [result] = await pool.execute('DELETE FROM users WHERE email = ?', [email]);
    console.log(`Deleted ${result.affectedRows} row(s) for email ${email}.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

deleteTestUser();
