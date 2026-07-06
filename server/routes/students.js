// ============================================================
// WRO Philippines DBMS – Students Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/students
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM students WHERE is_deleted = 0 ORDER BY full_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/students
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || `STU_${Date.now()}`;
    await pool.execute(
      `INSERT INTO students (id, full_name, birthday, age, gender, grade_level, school_id,
       parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size,
       previous_participation, consent_signed, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, d.fullName, d.birthday || null, d.age || null, d.gender, d.gradeLevel,
       d.schoolId || null, d.parentName, d.parentContact, d.parentEmail,
       d.medicalConditions || 'None', d.allergies || 'None', d.shirtSize,
       d.previousParticipation || 0, d.consentSigned ? 1 : 0, d.status || 'active']
    );
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    await pool.execute(
      `UPDATE students SET full_name=?, birthday=?, age=?, gender=?, grade_level=?, school_id=?,
       parent_name=?, parent_contact=?, parent_email=?, medical_conditions=?, allergies=?,
       shirt_size=?, previous_participation=?, consent_signed=?, status=?, updated_at=NOW()
       WHERE id = ?`,
      [d.fullName, d.birthday || null, d.age || null, d.gender, d.gradeLevel,
       d.schoolId || null, d.parentName, d.parentContact, d.parentEmail,
       d.medicalConditions || 'None', d.allergies || 'None', d.shirtSize,
       d.previousParticipation || 0, d.consentSigned ? 1 : 0, d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE students SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
