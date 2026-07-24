// ============================================================
// WRO Philippines DBMS – Direct Email Routes
// Sends emails to Standard Users via Gmail SMTP (Nodemailer).
// All endpoints require SUPER_ADMIN or EVENT_ADMIN role.
// ============================================================

const express   = require('express');
const router    = express.Router();
const nodemailer = require('nodemailer');
const pool      = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// ── Nodemailer transporter (Gmail) ───────────────────────────
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

// ── Simple rate limiter (in-memory, per user) ─────────────────
const _rateLimits = {};
const RATE_LIMIT_MAX = 10;      // max sends per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

function isRateLimited(userId) {
  const now = Date.now();
  if (!_rateLimits[userId]) {
    _rateLimits[userId] = { count: 0, windowStart: now };
  }
  const entry = _rateLimits[userId];
  if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.windowStart = now;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// ── HTML sanitizer (strip dangerous tags/attributes) ──────────
function sanitizeHtml(html) {
  if (!html) return '';
  // Remove script/style tags and their content
  let safe = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')   // remove event handlers
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
  return safe;
}

// ── GET /api/emails/recipients  ───────────────────────────────
// Returns Users, Schools, Coaches, Students, and Judges with emails for recipient selection.
router.get('/recipients', requireRole('SUPER_ADMIN', 'EVENT_ADMIN'), async (req, res) => {
  try {
    const [
      [users], [schools], [coaches], [students], [judges]
    ] = await Promise.all([
      pool.execute(
        `SELECT u.id, u.name, u.email, COALESCE(s.school_name, '—') AS school_name
         FROM users u LEFT JOIN schools s ON s.id = u.school_id
         WHERE u.role = 'STANDARD_USER' AND u.is_deleted = 0 AND u.is_active = 1 AND u.email IS NOT NULL AND u.email != ''`
      ),
      pool.execute(
        `SELECT id, school_name AS name, email, school_name 
         FROM schools WHERE status = 'active' AND is_deleted = 0 AND email IS NOT NULL AND email != ''`
      ),
      pool.execute(
        `SELECT c.id, c.full_name AS name, c.email, COALESCE(s.school_name, '—') AS school_name 
         FROM coaches c LEFT JOIN schools s ON s.id = c.school_id
         WHERE c.status = 'active' AND c.is_deleted = 0 AND c.email IS NOT NULL AND c.email != ''`
      ),
      pool.execute(
        `SELECT st.id, st.full_name AS name, st.personal_email AS email, COALESCE(s.school_name, '—') AS school_name 
         FROM students st LEFT JOIN schools s ON s.id = st.school_id
         WHERE st.status = 'active' AND st.is_deleted = 0 AND st.personal_email IS NOT NULL AND st.personal_email != ''`
      ),
      pool.execute(
        `SELECT id, full_name AS name, email, '—' AS school_name 
         FROM judges WHERE status = 'active' AND is_deleted = 0 AND email IS NOT NULL AND email != ''`
      )
    ]);

    const formatRecipients = (arr, prefix, category) => arr.map(r => ({
      id: `${prefix}_${r.id}`,
      raw_id: r.id,
      category,
      name: r.name,
      email: r.email,
      school_name: r.school_name || '—'
    }));

    let allRecipients = [
      ...formatRecipients(users, 'user', 'User'),
      ...formatRecipients(schools, 'school', 'School'),
      ...formatRecipients(coaches, 'coach', 'Coach'),
      ...formatRecipients(students, 'student', 'Student'),
      ...formatRecipients(judges, 'judge', 'Judge')
    ];

    allRecipients.sort((a, b) => a.name.localeCompare(b.name));
    res.json(allRecipients);
  } catch (err) {
    console.error('[emails] GET /recipients error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/emails/history  ──────────────────────────────────
// Returns paginated email history.
router.get('/history', requireRole('SUPER_ADMIN', 'EVENT_ADMIN'), async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const perPage = Math.min(50, parseInt(req.query.per_page) || 20);
    const search  = (req.query.search || '').trim();
    const status  = req.query.status || '';
    const offset  = (page - 1) * perPage;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (e.subject LIKE ? OR e.sender_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      where += ' AND e.status = ?';
      params.push(status);
    }

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM email_log e ${where}`, params
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT e.id, e.email_code, e.subject, e.sender_name, e.sender_id,
              e.recipient_names, e.recipient_emails,
              e.total_recipients, e.sent_count, e.failed_count,
              e.status, e.attachment_name, e.sent_at, e.created_at
       FROM email_log e ${where}
       ORDER BY e.created_at DESC
       LIMIT ${perPage} OFFSET ${offset}`,
      params
    );

    res.json({
      data: rows,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    console.error('[emails] GET /history error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/emails/history/:id  ─────────────────────────────
// Returns full detail of a single email log entry.
router.get('/history/:id', requireRole('SUPER_ADMIN', 'EVENT_ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM email_log WHERE id = ?', [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[emails] GET /history/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/emails/send  ────────────────────────────────────
// Validates, logs to DB, then sends via Gmail SMTP.
router.post('/send', requireRole('SUPER_ADMIN', 'EVENT_ADMIN'), async (req, res) => {
  const userId = req.user?.id || req.user?.userId;

  // Rate limiting check
  if (isRateLimited(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait a moment before sending more emails.',
    });
  }

  const {
    subject,
    message,
    recipientIds,
    attachmentName,
    attachmentData,
  } = req.body;

  // ── Validation ──────────────────────────────────────────────
  if (!subject || !String(subject).trim()) {
    return res.status(400).json({ success: false, error: 'Subject is required.' });
  }
  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, error: 'Message body is required.' });
  }
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one recipient is required.' });
  }
  if (recipientIds.length > 200) {
    return res.status(400).json({ success: false, error: 'Maximum 200 recipients per send.' });
  }

  // ── SMTP config check ───────────────────────────────────────
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({
      success: false,
      error: 'Email service not configured. Please set SMTP_USER and SMTP_PASS in server .env file.',
    });
  }

  // ── Fetch recipient data from DB ─────────────────────────────
  let recipients = [];
  try {
    const userIds = recipientIds.filter(id => id.startsWith('user_')).map(id => id.replace('user_', ''));
    const schoolIds = recipientIds.filter(id => id.startsWith('school_')).map(id => id.replace('school_', ''));
    const coachIds = recipientIds.filter(id => id.startsWith('coach_')).map(id => id.replace('coach_', ''));
    const studentIds = recipientIds.filter(id => id.startsWith('student_')).map(id => id.replace('student_', ''));
    const judgeIds = recipientIds.filter(id => id.startsWith('judge_')).map(id => id.replace('judge_', ''));

    const queries = [];

    if (userIds.length > 0) {
      queries.push(
        pool.execute(
          `SELECT id, name, email FROM users WHERE id IN (${userIds.map(() => '?').join(',')}) AND role='STANDARD_USER' AND is_deleted=0 AND is_active=1 AND email IS NOT NULL AND email != ''`,
          userIds
        ).then(([r]) => recipients.push(...r.map(row => ({...row, id: 'user_' + row.id}))))
      );
    }
    if (schoolIds.length > 0) {
      queries.push(
        pool.execute(
          `SELECT id, school_name AS name, email FROM schools WHERE id IN (${schoolIds.map(() => '?').join(',')}) AND status='active' AND is_deleted=0 AND email IS NOT NULL AND email != ''`,
          schoolIds
        ).then(([r]) => recipients.push(...r.map(row => ({...row, id: 'school_' + row.id}))))
      );
    }
    if (coachIds.length > 0) {
      queries.push(
        pool.execute(
          `SELECT id, full_name AS name, email FROM coaches WHERE id IN (${coachIds.map(() => '?').join(',')}) AND status='active' AND is_deleted=0 AND email IS NOT NULL AND email != ''`,
          coachIds
        ).then(([r]) => recipients.push(...r.map(row => ({...row, id: 'coach_' + row.id}))))
      );
    }
    if (studentIds.length > 0) {
      queries.push(
        pool.execute(
          `SELECT id, full_name AS name, personal_email AS email FROM students WHERE id IN (${studentIds.map(() => '?').join(',')}) AND status='active' AND is_deleted=0 AND personal_email IS NOT NULL AND personal_email != ''`,
          studentIds
        ).then(([r]) => recipients.push(...r.map(row => ({...row, id: 'student_' + row.id}))))
      );
    }
    if (judgeIds.length > 0) {
      queries.push(
        pool.execute(
          `SELECT id, full_name AS name, email FROM judges WHERE id IN (${judgeIds.map(() => '?').join(',')}) AND status='active' AND is_deleted=0 AND email IS NOT NULL AND email != ''`,
          judgeIds
        ).then(([r]) => recipients.push(...r.map(row => ({...row, id: 'judge_' + row.id}))))
      );
    }

    await Promise.all(queries);

  } catch (err) {
    console.error('[emails] Recipient fetch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch recipient data.' });
  }

  if (recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'None of the selected recipients have valid email addresses.',
    });
  }

  const senderName = req.user?.name || req.user?.username || 'Administrator';
  const safeHtml   = sanitizeHtml(message);
  const emailCode  = `EMAIL_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // ── Create log record (pending) ──────────────────────────────
  let logId;
  try {
    const recipientIdsArr    = recipients.map(r => r.id);
    const recipientEmailsArr = recipients.map(r => r.email);
    const recipientNamesArr  = recipients.map(r => r.name);

    const [result] = await pool.execute(
      `INSERT INTO email_log
         (email_code, subject, message, sender_id, sender_name,
          recipient_ids, recipient_emails, recipient_names,
          total_recipients, sent_count, failed_count, status,
          attachment_name, created_at)
       VALUES (?,?,?,?,?, ?,?,?, ?,0,0,'pending', ?,NOW())`,
      [
        emailCode,
        subject.trim(),
        safeHtml,
        userId,
        senderName,
        JSON.stringify(recipientIdsArr),
        JSON.stringify(recipientEmailsArr),
        JSON.stringify(recipientNamesArr),
        recipients.length,
        attachmentName || null,
      ]
    );
    logId = result.insertId;
  } catch (err) {
    console.error('[emails] Log insert error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create email log.' });
  }

  // Mark as sending
  await pool.execute('UPDATE email_log SET status=? WHERE id=?', ['sending', logId]);

  // ── Send emails ──────────────────────────────────────────────
  const transporter = getTransporter();
  const fromAddress = `"${process.env.SMTP_FROM_NAME || 'WRO Philippines'}" <${process.env.SMTP_USER}>`;

  let sentCount  = 0;
  let failedCount = 0;
  const errors   = [];

  // Build attachment object if provided
  let attachments = [];
  if (attachmentName && attachmentData) {
    // Strip base64 prefix if present (e.g. "data:application/pdf;base64,...")
    const base64Content = attachmentData.includes(',')
      ? attachmentData.split(',')[1]
      : attachmentData;

    // Validate size (max 5 MB base64 ≈ ~3.7 MB actual)
    if (base64Content && base64Content.length <= 7 * 1024 * 1024) {
      attachments = [{
        filename: attachmentName,
        content: Buffer.from(base64Content, 'base64'),
      }];
    }
  }

  // Email template
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); border: 1px solid #e5e7eb; }
    .header { background: #ffffff; padding: 28px 32px; border-bottom: 3px solid #F6C945; display: table; width: 100%; box-sizing: border-box; }
    .header-content { display: table-cell; vertical-align: middle; }
    .header-logo { display: table-cell; vertical-align: middle; text-align: right; width: 130px; }
    .header-logo img { max-width: 110px; height: auto; display: block; margin-left: auto; }
    .title { margin: 0; font-size: 20px; color: #111827; font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 40px 32px; color: #374151; line-height: 1.7; font-size: 15px; }
    .content h1, .content h2, .content h3 { color: #111827; margin-top: 0; font-weight: 700; }
    .content a { color: #2563eb; text-decoration: none; font-weight: 500; }
    .content a:hover { text-decoration: underline; }
    .footer-divider { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 24px; }
    .meta { font-size: 13px; color: #9ca3af; margin: 0; }
    .meta strong { color: #4b5563; }
    .footer { background: #f9fafb; padding: 24px 32px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer p { margin: 0 0 6px; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <div class="container" style="text-align: left;">
          <div class="header">
            <div class="header-content">
              <h1 class="title">WRO Philippines</h1>
              <p class="subtitle">Official Communication</p>
            </div>
            <div class="header-logo">
              <img src="https://www.felta.ph/50th/wp-content/uploads/2026/01/felta-logo-official.png" alt="FELTA Logo">
            </div>
          </div>
          <div class="content">
            ${safeHtml}
            <hr class="footer-divider">
            <p class="meta">
              Sent by <strong>${senderName}</strong> via WRO Philippines Admin Portal
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FELTA Multi-Media Inc. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from:        fromAddress,
        to:          recipient.email,
        subject:     subject.trim(),
        html:        htmlBody,
        attachments,
      });
      sentCount++;
    } catch (err) {
      failedCount++;
      errors.push({ email: recipient.email, error: err.message });
      console.error(`[emails] Failed to send to ${recipient.email}:`, err.message);
    }

    // Small delay between sends to avoid Gmail rate limits
    if (recipients.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // ── Update log with final status ─────────────────────────────
  const finalStatus = sentCount === 0
    ? 'failed'
    : failedCount > 0 ? 'partial' : 'sent';

  await pool.execute(
    `UPDATE email_log
     SET status=?, sent_count=?, failed_count=?, error_log=?, sent_at=NOW()
     WHERE id=?`,
    [finalStatus, sentCount, failedCount, JSON.stringify(errors), logId]
  );

  // Attach attachment reference to log record (not the full data, just the name)
  if (attachmentName) {
    await pool.execute('UPDATE email_log SET attachment_name=? WHERE id=?', [attachmentName, logId]);
  }

  res.json({
    success: true,
    emailCode,
    sentCount,
    failedCount,
    totalRecipients: recipients.length,
    status: finalStatus,
    errors: errors.length > 0 ? errors : undefined,
  });
});

module.exports = router;
