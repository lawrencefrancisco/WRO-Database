// ============================================================
// WRO Philippines DBMS – Auth Routes
// JWT payload carries the integer users.id as userId.
// user_code is also exposed in the token for display purposes.
// ============================================================

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND is_deleted = 0 AND is_active = 1 LIMIT 1',
      [username]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    // Support both plain-text (seed data) and bcrypt passwords
    let passwordMatch = false;
    if (user.password_hash.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Plain-text comparison for seeded demo users
      passwordMatch = (password === user.password_hash);
    }

    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    // userId is now the integer surrogate PK; user_code carries the readable code
    const payload = {
      userId:   user.id,
      userCode: user.user_code,
      name:     user.name,
      role:     user.role,
      email:    user.email,
      schoolId: user.school_id || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    // Update last login
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Determine which portal the user should be redirected to
    const isStandardUser = user.role === 'STANDARD_USER';

    res.json({
      success: true,
      token,
      user: payload,
      portal: isStandardUser ? 'standard' : 'admin',
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: `Server error during login: ${err.message}` });
  }
});

// POST /api/auth/logout (stateless – client drops token)
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// GET /api/auth/me – returns current user from token
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
