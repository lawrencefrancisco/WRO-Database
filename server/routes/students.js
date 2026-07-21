// ============================================================
// WRO Philippines DBMS – Students Routes
// id column is now INT AUTO_INCREMENT (surrogate key).
// student_code holds the human-readable code (STU_xxxx).
// school_id is INT UNSIGNED FK → schools.id
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
// Body may pass schoolId (integer) or schoolCode (e.g. 'SCH_001'); integer wins.
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const studentCode = d.studentCode || d.student_code || `STU_${Date.now()}`;

    // Resolve school_id: accept integer directly or look up by school_code
    let schoolId = d.schoolId || null;
    if (!schoolId && d.schoolCode) {
      const [sr] = await pool.execute('SELECT id FROM schools WHERE school_code = ? LIMIT 1', [d.schoolCode]);
      schoolId = sr[0]?.id || null;
    }

    const [result] = await pool.execute(
      `INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id,
       parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size,
       consent_signed, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [studentCode, d.fullName, d.birthday || null, d.age || null, d.gender, d.gradeLevel,
       schoolId, d.parentName, d.parentContact, d.parentEmail,
       d.medicalConditions || 'None', d.allergies || 'None', d.shirtSize,
       d.consentSigned ? 1 : 0, d.status || 'active']
    );
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [result.insertId]);
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

    let schoolId = d.schoolId || null;
    if (!schoolId && d.schoolCode) {
      const [sr] = await pool.execute('SELECT id FROM schools WHERE school_code = ? LIMIT 1', [d.schoolCode]);
      schoolId = sr[0]?.id || null;
    }

    await pool.execute(
      `UPDATE students SET full_name=?, birthday=?, age=?, gender=?, grade_level=?,
       school_id=?, parent_name=?, parent_contact=?, parent_email=?, medical_conditions=?,
       allergies=?, shirt_size=?, consent_signed=?, status=?,
       updated_at=NOW() WHERE id = ?`,
      [d.fullName, d.birthday || null, d.age || null,
       d.gender, d.gradeLevel, schoolId, d.parentName, d.parentContact, d.parentEmail,
       d.medicalConditions || 'None', d.allergies || 'None', d.shirtSize,
       d.consentSigned ? 1 : 0, d.status, req.params.id]
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
    // Remove this student from all teams so counts stay accurate
    await pool.execute('DELETE FROM team_members WHERE student_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
