// ============================================================
// WRO Philippines DBMS – Students Routes
// id column is now INT AUTO_INCREMENT (surrogate key).
// student_code holds the human-readable code (STU_xxxx).
// school_id is INT UNSIGNED FK → schools.id
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

const adminOnly = requireRole('SUPER_ADMIN', 'EVENT_ADMIN');

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
router.post('/', adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const studentCode = d.studentCode || d.student_code || `STU_${Date.now()}`;

    // Resolve school_id: accept integer directly or look up by school_code
    let schoolId = d.schoolId || null;
    if (!schoolId && d.schoolCode) {
      const [sr] = await pool.execute('SELECT id FROM schools WHERE school_code = ? LIMIT 1', [d.schoolCode]);
      schoolId = sr[0]?.id || null;
    }

    // ── Smart Duplicate Check: Global full name check ────────────
    if (!d.fullName) return res.status(400).json({ success: false, error: 'Full Name is required.' });
    
    // 1. Exact match in the exact same school
    const [exactDup] = await pool.execute(
      'SELECT id FROM students WHERE full_name = ? AND school_id <=> ? AND is_deleted = 0 LIMIT 1',
      [d.fullName.trim(), schoolId]
    );
    if (exactDup.length > 0) {
      return res.status(409).json({ success: false, error: `A student named "${d.fullName}" already exists in this school.` });
    }

    // 2. Global match in ANY school (Transfer scenario vs Name Collision)
    const [globalDup] = await pool.execute(
      `SELECT s.id, sch.school_name 
       FROM students s 
       LEFT JOIN schools sch ON s.school_id = sch.id 
       WHERE s.full_name = ? AND s.is_deleted = 0 LIMIT 1`,
      [d.fullName.trim()]
    );
    if (globalDup.length > 0) {
      const oldSchool = globalDup[0].school_name || 'another school';
      return res.status(409).json({ 
        success: false, 
        error: `A student named "${d.fullName}" already exists at ${oldSchool}. If this student transferred, please edit their existing profile instead of creating a new one. If this is a different person, please add a middle initial (e.g., 'Juan M. Cruz') to distinguish them.` 
      });
    }
    const [result] = await pool.execute(
      `INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id,
       parent_name, parent_contact, parent_email, personal_email, shirt_size,
       consent_signed, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [studentCode, d.fullName, d.birthday || null, d.age || null, d.gender, d.gradeLevel,
       schoolId, d.parentName, d.parentContact, d.parentEmail, d.personalEmail || null, d.shirtSize,
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
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const d = req.body;

    let schoolId = d.schoolId || null;
    if (!schoolId && d.schoolCode) {
      const [sr] = await pool.execute('SELECT id FROM schools WHERE school_code = ? LIMIT 1', [d.schoolCode]);
      schoolId = sr[0]?.id || null;
    }

    // ── Smart Duplicate Check: New name+school must not clash globally ──
    if (d.fullName) {
      // 1. Exact match in the exact same school
      const [exactDup] = await pool.execute(
        'SELECT id FROM students WHERE full_name = ? AND school_id <=> ? AND is_deleted = 0 AND id != ? LIMIT 1',
        [d.fullName.trim(), schoolId, req.params.id]
      );
      if (exactDup.length > 0) {
        return res.status(409).json({ success: false, error: `Another student named "${d.fullName}" already exists in this school.` });
      }

      // 2. Global match in ANY school
      const [globalDup] = await pool.execute(
        `SELECT s.id, sch.school_name 
         FROM students s 
         LEFT JOIN schools sch ON s.school_id = sch.id 
         WHERE s.full_name = ? AND s.is_deleted = 0 AND s.id != ? LIMIT 1`,
        [d.fullName.trim(), req.params.id]
      );
      if (globalDup.length > 0) {
        const oldSchool = globalDup[0].school_name || 'another school';
        return res.status(409).json({ 
          success: false, 
          error: `Another student named "${d.fullName}" already exists at ${oldSchool}. Please add a middle initial (e.g., 'Juan M. Cruz') to distinguish this student.` 
        });
      }
    }

    await pool.execute(
      `UPDATE students SET full_name=?, birthday=?, age=?, gender=?, grade_level=?,
       school_id=?, parent_name=?, parent_contact=?, parent_email=?, personal_email=?,
       shirt_size=?, consent_signed=?, status=?,
       updated_at=NOW() WHERE id = ?`,
      [d.fullName, d.birthday || null, d.age || null,
       d.gender, d.gradeLevel, schoolId, d.parentName, d.parentContact, d.parentEmail,
       d.personalEmail || null,
       d.shirtSize, d.consentSigned ? 1 : 0, d.status, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', adminOnly, async (req, res) => {
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
