const pool = require('../db/pool');
async function run() {
  const [r] = await pool.execute('SELECT id, username, role FROM users');
  console.log('Before:', JSON.stringify(r));
  await pool.execute("UPDATE users SET role='STANDARD_USER' WHERE role IS NULL OR role=''");
  const [r2] = await pool.execute('SELECT id, username, role FROM users');
  console.log('After fix:', JSON.stringify(r2));
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
