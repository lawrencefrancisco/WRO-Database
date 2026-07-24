const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

// GET /api/settings
// Public endpoint so the public portal can check registration link status
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings
// Admin endpoint to update settings
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'EVENT_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload.' });
    }

    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
