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

// PUT update announcement
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    await pool.execute(
      `UPDATE announcements SET title=?, body=?, image_url=?, category=?, recipients=?,
       status=?, publish_at=?, updated_at=NOW() WHERE id = ?`,
      [d.title, d.body || '', d.imageUrl !== undefined ? d.imageUrl : null,
       d.category || 'general', d.recipients || 'all',
       d.status || 'draft', d.publishAt || null, req.params.id]
    );
    const [rows] = await pool.execute(
      'SELECT id, announcement_code, title, body, image_url, category, recipients, status, publish_at, created_by, created_at, updated_at FROM announcements WHERE id = ?',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
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
