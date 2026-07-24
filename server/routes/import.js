// ============================================================
// WRO Philippines DBMS – Bulk Import Routes
// POST /api/import/schools
// POST /api/import/coaches
// POST /api/import/students
// POST /api/import/teams
//
// Strategy: Option A – Skip existing records (never overwrite).
// Uses multer (memoryStorage) + xlsx to parse .xlsx / .csv files.
// ============================================================

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const XLSX     = require('xlsx');
const pool     = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ── Multer: accept files in memory only (no disk writes) ─────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter(req, file, cb) {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .xlsx, .xls, or .csv files are allowed.'), ok);
  },
});

// ── All import routes require auth + admin role ───────────────
router.use(authMiddleware);
router.use(requireRole('SUPER_ADMIN', 'EVENT_ADMIN'));

// ── Helper: parse uploaded file → array of row objects ───────
function parseFile(buffer, mimetype) {
  const wb   = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ── Helper: normalise a cell value to a trimmed string ───────
const str  = v => (v === null || v === undefined ? '' : String(v).trim());
const opt  = v => str(v) || null;

// ── Helper: resolve school_id from school name ───────────────
async function resolveSchoolId(pool, schoolName) {
  if (!schoolName) return null;
  const [rows] = await pool.execute(
    'SELECT id FROM schools WHERE school_name = ? AND is_deleted = 0 LIMIT 1',
    [schoolName.trim()]
  );
  return rows[0]?.id || null;
}

// ═══════════════════════════════════════════════════════════
//  POST /api/import/schools
// ═══════════════════════════════════════════════════════════
router.post('/schools', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const rows    = parseFile(req.file.buffer);
    let inserted  = 0;
    let skipped   = 0;
    const errors  = [];

    for (let i = 0; i < rows.length; i++) {
      const r        = rows[i];
      const rowNum   = i + 2; // row 1 = header
      const name     = str(r['School Name'] || r['school_name'] || r['name']);

      if (!name) { errors.push(`Row ${rowNum}: School Name is required.`); continue; }

      // Check for duplicate
      const [existing] = await pool.execute(
        'SELECT id FROM schools WHERE school_name = ? AND is_deleted = 0 LIMIT 1',
        [name]
      );
      if (existing.length > 0) { skipped++; continue; }

      const code = `SCH_${Date.now()}_${i}`;
      try {
        await pool.execute(
          `INSERT INTO schools
             (school_code, school_name, school_type, school_level, region,
              province, city, address, contact_number, email,
              school_head, robotics_coordinator, website, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
          [
            code, name,
            opt(r['School Type']    || r['school_type']),
            opt(r['School Level']   || r['school_level']),
            opt(r['Region']         || r['region']),
            opt(r['Province']       || r['province']),
            opt(r['City']           || r['city']),
            opt(r['Address']        || r['address']),
            opt(r['Contact Number'] || r['contact_number']),
            opt(r['Email']          || r['email']),
            opt(r['School Head']    || r['school_head']),
            opt(r['Robotics Coordinator'] || r['robotics_coordinator']),
            opt(r['Website']        || r['website']),
            str(r['Status']         || r['status']) || 'active',
          ]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    console.error('[import/schools]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  POST /api/import/coaches
// ═══════════════════════════════════════════════════════════
router.post('/coaches', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const rows   = parseFile(req.file.buffer);
    let inserted = 0;
    let skipped  = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r      = rows[i];
      const rowNum = i + 2;
      const name   = str(r['Full Name']  || r['full_name']);
      const email  = str(r['Email']      || r['email']);

      if (!name)  { errors.push(`Row ${rowNum}: Full Name is required.`);  continue; }
      if (!email) { errors.push(`Row ${rowNum}: Email is required.`);       continue; }

      // Duplicate check by email
      const [existing] = await pool.execute(
        'SELECT id FROM coaches WHERE email = ? AND is_deleted = 0 LIMIT 1',
        [email]
      );
      if (existing.length > 0) { skipped++; continue; }

      const schoolId = await resolveSchoolId(pool, str(r['School Name'] || r['school_name']));
      const code     = `COA_${Date.now()}_${i}`;

      try {
        await pool.execute(
          `INSERT INTO coaches
             (coach_code, full_name, birthday, gender, email, mobile, school_id,
              position, shirt_size, emergency_contact, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
          [
            code, name,
            opt(r['Birthday']          || r['birthday']),
            opt(r['Gender']            || r['gender']),
            email,
            opt(r['Mobile']            || r['mobile']),
            schoolId,
            opt(r['Position']          || r['position']),
            opt(r['Shirt Size']        || r['shirt_size']),
            opt(r['Emergency Contact'] || r['emergency_contact']),
            str(r['Status']            || r['status']) || 'active',
          ]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    console.error('[import/coaches]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  POST /api/import/students
// ═══════════════════════════════════════════════════════════
router.post('/students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const rows   = parseFile(req.file.buffer);
    let inserted = 0;
    let skipped  = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r          = rows[i];
      const rowNum     = i + 2;
      const name       = str(r['Full Name']   || r['full_name']);
      const schoolName = str(r['School Name'] || r['school_name']);

      if (!name) { errors.push(`Row ${rowNum}: Full Name is required.`); continue; }

      // Duplicate check: same name + same school
      const schoolId = await resolveSchoolId(pool, schoolName);
      const [existing] = await pool.execute(
        'SELECT id FROM students WHERE full_name = ? AND school_id <=> ? AND is_deleted = 0 LIMIT 1',
        [name, schoolId]
      );
      if (existing.length > 0) { skipped++; continue; }

      const code = `STU_${Date.now()}_${i}`;

      try {
        await pool.execute(
          `INSERT INTO students
             (student_code, full_name, birthday, age, gender, grade_level, school_id,
              parent_name, parent_contact, parent_email, personal_email, shirt_size,
              consent_signed, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
          [
            code, name,
            opt(r['Birthday']        || r['birthday']),
            opt(r['Age']             || r['age'])             || null,
            opt(r['Gender']          || r['gender']),
            opt(r['Grade Level']     || r['grade_level']),
            schoolId,
            opt(r['Parent Name']     || r['parent_name']),
            opt(r['Parent Contact']  || r['parent_contact']),
            opt(r['Parent Email']    || r['parent_email']),
            opt(r['Personal Email']  || r['personal_email']),
            opt(r['Shirt Size']      || r['shirt_size']),
            0, // consent_signed defaults to 0
            str(r['Status']          || r['status']) || 'active',
          ]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    console.error('[import/students]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  POST /api/import/teams
// ═══════════════════════════════════════════════════════════
router.post('/teams', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const rows   = parseFile(req.file.buffer);
    let inserted = 0;
    let skipped  = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r        = rows[i];
      const rowNum   = i + 2;
      const teamName = str(r['Team Name'] || r['team_name']);

      if (!teamName) { errors.push(`Row ${rowNum}: Team Name is required.`); continue; }

      // Duplicate check by team name
      const [existing] = await pool.execute(
        'SELECT id FROM teams WHERE team_name = ? AND is_deleted = 0 LIMIT 1',
        [teamName]
      );
      if (existing.length > 0) { skipped++; continue; }

      // Resolve optional FKs
      const schoolId = await resolveSchoolId(pool, str(r['School Name'] || r['school_name']));

      // Resolve coach by email
      let coachId = null;
      const coachEmail = str(r['Coach Email'] || r['coach_email']);
      if (coachEmail) {
        const [cr] = await pool.execute(
          'SELECT id FROM coaches WHERE email = ? AND is_deleted = 0 LIMIT 1',
          [coachEmail]
        );
        coachId = cr[0]?.id || null;
      }

      // Resolve competition by name
      let compId = null;
      const compName = str(r['Competition'] || r['competition']);
      if (compName) {
        const [cor] = await pool.execute(
          'SELECT id FROM competitions WHERE name = ? AND is_deleted = 0 LIMIT 1',
          [compName]
        );
        compId = cor[0]?.id || null;
      }

      const code = `TEAM_${Date.now()}_${i}`;
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
          `INSERT INTO teams
             (team_code, team_name, category, season, age_group, school_id, coach_id, competition_id,
              registration_status, payment_status, qualification_status, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
          [
            code, teamName,
            opt(r['Category']  || r['category']),
            opt(r['Season']    || r['season']),
            opt(r['Age Group'] || r['age_group']),
            schoolId,
            coachId,
            compId,
            'registered', 'unpaid', 'pending', 'active',
          ]
        );
        const newTeamId = result.insertId;

        // Resolve and link members (comma-separated full names)
        const memberStr = str(r['Members (comma-separated full names)'] || r['members'] || '');
        if (memberStr) {
          const memberNames = memberStr.split(',').map(n => n.trim()).filter(Boolean);
          for (const memberName of memberNames) {
            const [sr] = await conn.execute(
              'SELECT id FROM students WHERE full_name = ? AND is_deleted = 0 LIMIT 1',
              [memberName]
            );
            if (sr[0]?.id) {
              await conn.execute(
                'INSERT IGNORE INTO team_members (team_id, student_id) VALUES (?,?)',
                [newTeamId, sr[0].id]
              );
            }
          }
        }

        await conn.commit();
        inserted++;
      } catch (err) {
        await conn.rollback();
        errors.push(`Row ${rowNum}: ${err.message}`);
      } finally {
        conn.release();
      }
    }

    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    console.error('[import/teams]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
