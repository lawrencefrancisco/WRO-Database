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
const { sendOTPEmail } = require('../utils/mailer');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_deleted = 0 AND is_active = 1 LIMIT 1',
      [username, username]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    if (user.is_verified === 0) {
      return res.status(403).json({ success: false, error: 'Account not verified. Please check your email for the OTP code.' });
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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    // Reject if email already belongs to a fully verified account
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE (email = ? OR username = ?) AND is_deleted = 0 LIMIT 1',
      [email, email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert into staging table (handles re-registration before verification)
    await pool.execute(
      `INSERT INTO pending_registrations (email, name, password_hash, otp_code, otp_expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
       ON DUPLICATE KEY UPDATE
         name          = VALUES(name),
         password_hash = VALUES(password_hash),
         otp_code      = VALUES(otp_code),
         otp_expires_at = VALUES(otp_expires_at),
         created_at    = NOW()`,
      [email, name, passwordHash, otpCode]
    );

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otpCode);
    if (!emailSent) {
      console.warn(`[Auth] Failed to send OTP email to ${email}`);
    }

    res.json({ success: true, message: 'Registration successful. Please check your email for the OTP.' });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP required.' });

    // Look up in the staging table
    const [rows] = await pool.execute(
      'SELECT * FROM pending_registrations WHERE email = ? LIMIT 1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No pending registration found. Please sign up again.' });
    }

    const pending = rows[0];

    if (new Date() > new Date(pending.otp_expires_at)) {
      // Clean up expired entry so they can re-register cleanly
      await pool.execute('DELETE FROM pending_registrations WHERE email = ?', [email]);
      return res.status(400).json({ success: false, error: 'Verification code has expired. Please sign up again.' });
    }

    if (pending.otp_code !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid verification code.' });
    }

    // OTP is valid — create the real user record
    const userCode = 'U' + Date.now().toString().slice(-6);
    await pool.execute(
      `INSERT INTO users (user_code, username, name, email, password_hash, role, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, 'STANDARD_USER', 1, 1)`,
      [userCode, email, pending.name, email, pending.password_hash]
    );

    // Remove from staging table
    await pool.execute('DELETE FROM pending_registrations WHERE email = ?', [email]);

    res.json({ success: true, message: 'Account verified successfully. You can now login.' });
  } catch (err) {
    console.error('[Auth] Verify error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required.' });

    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? AND is_deleted = 0 AND is_active = 1 LIMIT 1', [email]);
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'User not found or inactive.' });

    const user = rows[0];
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.execute('UPDATE users SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?', [otpCode, user.id]);

    const emailSent = await sendOTPEmail(email, otpCode);
    if (!emailSent) {
      console.warn(`[Auth] Failed to send forgot password OTP email to ${email}`);
    }

    res.json({ success: true, message: 'Password reset code sent to email.' });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, error: 'Email, OTP, and new password required.' });

    if (newPassword.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });

    const [rows] = await pool.execute('SELECT id, otp_code, otp_expires_at FROM users WHERE email = ? AND is_deleted = 0 LIMIT 1', [email]);
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'User not found.' });

    const user = rows[0];
    if (user.otp_code !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid reset code.' });
    }
    
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ success: false, error: 'Reset code has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [passwordHash, user.id]);

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
