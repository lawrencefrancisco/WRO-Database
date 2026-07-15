// ============================================================
// WRO Philippines DBMS – Delegation Routes
// id is INT AUTO_INCREMENT. delegation_code is the business code.
// team_id is INT UNSIGNED FK → teams.id
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Helper: resolve integer FK from either integer or business-code string
async function resolveTeamId(value) {
  if (!value) return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) return parseInt(value, 10);
  const [rows] = await pool.execute('SELECT id FROM teams WHERE team_code = ? LIMIT 1', [value]);
  return rows[0]?.id || null;
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM delegation WHERE is_deleted = 0');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM delegation WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d              = req.body;
    const delegationCode = d.delegationCode || d.delegation_code || `DEL_${Date.now()}`;
    const teamId         = await resolveTeamId(d.teamId);

    const [result] = await pool.execute(
      `INSERT INTO delegation (delegation_code, team_id, destination_country, wro_year,
       passport_status, passport_expiry, visa_status, parent_consent, flight, hotel,
       dietary_restrictions, shirt_size, emergency_contact, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [delegationCode, teamId, d.destinationCountry, d.wroYear || null,
       d.passportStatus || 'submitted', d.passportExpiry || null,
       d.visaStatus || 'not required', d.parentConsent ? 1 : 0,
       d.flight || null, d.hotel || null, d.dietaryRestrictions || 'None',
       d.shirtSize || 'M', d.emergencyContact || null, d.status || 'confirmed']
    );
    const [rows] = await pool.execute('SELECT * FROM delegation WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const d      = req.body;
    const teamId = await resolveTeamId(d.teamId);

    await pool.execute(
      `UPDATE delegation SET team_id=?, destination_country=?, wro_year=?,
       passport_status=?, passport_expiry=?, visa_status=?, parent_consent=?, flight=?, hotel=?,
       dietary_restrictions=?, shirt_size=?, emergency_contact=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [teamId, d.destinationCountry, d.wroYear || null,
       d.passportStatus, d.passportExpiry || null, d.visaStatus, d.parentConsent ? 1 : 0,
       d.flight || null, d.hotel || null, d.dietaryRestrictions || 'None',
       d.shirtSize, d.emergencyContact || null, d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM delegation WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM delegation WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE delegation SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
