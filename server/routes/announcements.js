// ============================================================
// WRO Philippines DBMS – Announcements Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET all announcements (published + drafts for admin)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, announcement_code, title, body, image_url, category, recipients, status, publish_at, created_by, created_at, updated_at FROM announcements WHERE is_deleted = 0 ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single announcement
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, announcement_code, title, body, image_url, category, recipients, status, publish_at, created_by, created_at, updated_at FROM announcements WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create announcement
router.post('/', async (req, res) => {
  try {
    const d    = req.body;
    const code = d.announcementCode || `ANN_${Date.now()}`;
    const [result] = await pool.execute(
      `INSERT INTO announcements (announcement_code, title, body, image_url, category, recipients,
       status, publish_at, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [code, d.title, d.body || '', d.imageUrl || null,
       d.category || 'general', d.recipients || 'all',
       d.status || 'draft', d.publishAt || null, d.createdBy || null]
    );
    const [rows] = await pool.execute(
      'SELECT id, announcement_code, title, body, image_url, category, recipients, status, publish_at, created_by, created_at, updated_at FROM announcements WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update announcement – partial update (only updates fields provided in body)
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    const validRoles = ['SUPER_ADMIN', 'EVENT_ADMIN'];

    // Build SET clause dynamically so a partial payload (e.g. just { status })
    // does NOT overwrite the other columns with null/undefined.
    const fieldMap = {
      title:      d.title,
      body:       d.body,
      image_url:  d.imageUrl !== undefined ? d.imageUrl : (d.image_url !== undefined ? d.image_url : undefined),
      category:   d.category,
      recipients: d.recipients,
      status:     d.status,
      publish_at: d.publishAt !== undefined ? d.publishAt : d.publish_at,
    };

    const setClauses = [];
    const values     = [];
    for (const [col, val] of Object.entries(fieldMap)) {
      if (val !== undefined) {
        setClauses.push(`${col} = ?`);
        values.push(val === '' && col !== 'body' ? null : val);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update.' });
    }

    setClauses.push('updated_at = NOW()');
    values.push(req.params.id);

    await pool.execute(
      `UPDATE announcements SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await pool.execute(
      'SELECT id, announcement_code, title, body, image_url, category, recipients, status, publish_at, created_by, created_at, updated_at FROM announcements WHERE id = ?',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('[Announcements PUT] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE announcement (soft)
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      await pool.execute('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    } else {
      await pool.execute('UPDATE announcements SET is_deleted=1, deleted_at=NOW() WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
