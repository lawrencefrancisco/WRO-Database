// ============================================================
// WRO Philippines DBMS – AI Chat Route (Database-Grounded)
// Version 2.0 – Full Schema Integration & Auto-Sync
// ============================================================

const express = require('express');
const router  = express.Router();
const { GoogleGenAI } = require('@google/genai');
const pool = require('../db/pool');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Schema-Aware Column Lists ──────────────────────────────────
// These are the columns exposed to the AI per table.
// Sensitive columns (password_hash, deleted_at) are excluded.
const SCHEMA = {
    users: `
        TABLE: users
        Columns: id (VARCHAR 60, PK), username (VARCHAR 100, UNIQUE), name (VARCHAR 200),
                 role (ENUM: SUPER_ADMIN|EVENT_ADMIN|JUDGE|COACH|VOLUNTEER), email (VARCHAR 200),
                 is_active (TINYINT 0/1), last_login (DATETIME), created_at (DATETIME)
        Purpose: System user accounts. Roles control access levels.`,

    schools: `
        TABLE: schools
        Columns: id (VARCHAR 60, PK), school_name (VARCHAR 300), school_type (ENUM: Private|Public|Sectarian),
                 school_level (VARCHAR 100), deped_id (VARCHAR 50), region (VARCHAR 200), province (VARCHAR 200),
                 city (VARCHAR 200), address (VARCHAR 500), contact_number (VARCHAR 50), email (VARCHAR 200),
                 school_head (VARCHAR 200), robotics_coordinator (VARCHAR 200), website (VARCHAR 300),
                 years_joined (YEAR), status (ENUM: active|inactive), created_at (DATETIME)
        Indexes: idx_region, idx_status, idx_school_name`,

    coaches: `
        TABLE: coaches
        Columns: id (VARCHAR 60, PK), full_name (VARCHAR 200), birthday (DATE), gender (ENUM: Male|Female|Other),
                 email (VARCHAR 200), mobile (VARCHAR 20), school_id (FK->schools.id), position (VARCHAR 200),
                 shirt_size (ENUM: XS|S|M|L|XL|XXL), emergency_contact (VARCHAR 300), certifications (VARCHAR 300),
                 years_coaching (INT), previous_awards (VARCHAR 300), status (ENUM: active|inactive), created_at (DATETIME)
        FK: coaches.school_id -> schools.id (SET NULL on delete)`,

    students: `
        TABLE: students
        Columns: id (VARCHAR 60, PK), full_name (VARCHAR 200), birthday (DATE), age (INT), gender (ENUM: Male|Female|Other),
                 grade_level (VARCHAR 50), school_id (FK->schools.id), parent_name (VARCHAR 200),
                 parent_contact (VARCHAR 20), parent_email (VARCHAR 200), medical_conditions (VARCHAR 300),
                 allergies (VARCHAR 300), shirt_size (ENUM: XS|S|M|L|XL), previous_participation (INT),
                 consent_signed (TINYINT 0/1), status (ENUM: active|inactive), created_at (DATETIME)
        FK: students.school_id -> schools.id (SET NULL on delete)`,

    competitions: `
        TABLE: competitions
        Columns: id (VARCHAR 60, PK), name (VARCHAR 300), season (VARCHAR 50), theme (VARCHAR 200),
                 date (DATE), venue (VARCHAR 300), organizer (VARCHAR 200), registration_deadline (DATE),
                 categories (JSON), number_of_teams (INT), number_of_schools (INT), number_of_coaches (INT),
                 number_of_students (INT), status (ENUM: upcoming|ongoing|completed|cancelled), created_at (DATETIME)
        Indexes: idx_season, idx_status`,

    teams: `
        TABLE: teams
        Columns: id (VARCHAR 60, PK), season (VARCHAR 50), competition_id (FK->competitions.id),
                 team_name (VARCHAR 200), category (VARCHAR 200), age_group (ENUM: Elementary|Junior|Senior|Open),
                 school_id (FK->schools.id), coach_id (FK->coaches.id), robot_platform (VARCHAR 200),
                 programming_language (VARCHAR 200), registration_status (ENUM: registered|confirmed|waitlisted|withdrawn),
                 payment_status (ENUM: unpaid|partial|paid), qualification_status (ENUM: pending|qualified|disqualified),
                 status (ENUM: active|inactive), created_at (DATETIME)
        FK: teams.competition_id -> competitions.id, teams.school_id -> schools.id, teams.coach_id -> coaches.id`,

    team_members: `
        TABLE: team_members  [Junction Table]
        Columns: team_id (FK->teams.id, PK), student_id (FK->students.id, PK)
        Purpose: Maps students to teams (many-to-many). Both FKs CASCADE on delete.
        FK: team_members.team_id -> teams.id (CASCADE), team_members.student_id -> students.id (CASCADE)`,

    judging: `
        TABLE: judging
        Columns: id (VARCHAR 60, PK), team_id (FK->teams.id), judge_name (VARCHAR 200), category (VARCHAR 200),
                 criteria (JSON: {robotDesign, programming, missionPoints}), score (INT),
                 comments (TEXT), violations (VARCHAR 200), final_score (INT), ranking (INT),
                 status (ENUM: draft|submitted|finalized), created_at (DATETIME)
        Indexes: idx_team, idx_final_score
        FK: judging.team_id -> teams.id (SET NULL on delete)`,

    awards: `
        TABLE: awards
        Columns: id (VARCHAR 60, PK), team_id (FK->teams.id), school_id (FK->schools.id),
                 coach_id (FK->coaches.id), category (VARCHAR 200), award (VARCHAR 200), year (YEAR),
                 event (VARCHAR 300), has_trophy (TINYINT 0/1), has_medal (TINYINT 0/1),
                 has_certificate (TINYINT 0/1), status (ENUM: confirmed|pending|revoked), created_at (DATETIME)
        FK: awards.team_id -> teams.id, awards.school_id -> schools.id, awards.coach_id -> coaches.id`,

    payments: `
        TABLE: payments
        Columns: id (VARCHAR 60, PK), team_id (FK->teams.id), school_id (FK->schools.id),
                 registration_fee (DECIMAL 10,2), amount_paid (DECIMAL 10,2), balance (DECIMAL 10,2),
                 payment_date (DATE), payment_method (VARCHAR 100), or_number (VARCHAR 50),
                 sponsorship (DECIMAL 10,2), scholarship (VARCHAR 100), status (ENUM: unpaid|partial|paid),
                 created_at (DATETIME)
        FK: payments.team_id -> teams.id, payments.school_id -> schools.id`,

    communications: `
        TABLE: communications
        Columns: id (VARCHAR 60, PK), team_id (FK->teams.id), registration_confirmation (TINYINT 0/1),
                 payment_confirmation (TINYINT 0/1), certificate_sent (TINYINT 0/1),
                 email_history (JSON), sms_history (JSON), announcement_received (TINYINT 0/1),
                 feedback_submitted (TINYINT 0/1), status (ENUM: active|inactive), created_at (DATETIME)
        FK: communications.team_id -> teams.id (SET NULL on delete)`,

    delegation: `
        TABLE: delegation
        Columns: id (VARCHAR 60, PK), team_id (FK->teams.id), destination_country (VARCHAR 200),
                 wro_year (YEAR), passport_status (ENUM: submitted|processing|approved|expired),
                 passport_expiry (DATE), visa_status (ENUM: not required|applied|approved|denied),
                 parent_consent (TINYINT 0/1), flight (VARCHAR 300), hotel (VARCHAR 200),
                 dietary_restrictions (VARCHAR 200), shirt_size (ENUM: XS|S|M|L|XL|XXL),
                 emergency_contact (VARCHAR 200), status (ENUM: confirmed|pending|cancelled), created_at (DATETIME)
        FK: delegation.team_id -> teams.id (SET NULL on delete)`,

    audit_logs: `
        TABLE: audit_logs
        Columns: id (VARCHAR 80, PK), action (ENUM: INSERT|UPDATE|DELETE|LOGIN|LOGOUT),
                 table_name (VARCHAR 100), record_id (VARCHAR 80), user_id (VARCHAR 60),
                 user_name (VARCHAR 200), timestamp (DATETIME)
        Purpose: Tracks all database changes and user actions for auditing.
        Indexes: idx_action, idx_table, idx_timestamp, idx_user`,
};

// ── Dynamic Schema Sync: discover any new tables at runtime ───
async function discoverLiveTables() {
    try {
        const [rows] = await pool.execute(
            `SELECT TABLE_NAME FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_TYPE = 'BASE TABLE'
             ORDER BY TABLE_NAME`
        );
        return rows.map(r => r.TABLE_NAME);
    } catch {
        return Object.keys(SCHEMA);
    }
}

// ── Helper: fetch all relevant DB data and build context ──────
async function buildDatabaseContext() {
    // Run all queries in parallel for performance
    const [
        [schools],
        [coaches],
        [students],
        [teams],
        [competitions],
        [awards],
        [payments],
        [teamMembers],
        [judging],
        [communications],
        [delegation],
        [users],
        [auditLogs],
        liveTables,
    ] = await Promise.all([
        pool.execute(`
            SELECT school_name, school_type, school_level, region, province, city,
                   address, contact_number, email, school_head, robotics_coordinator,
                   years_joined, status
            FROM schools
            WHERE is_deleted = 0
            ORDER BY school_name`),

        pool.execute(`
            SELECT c.full_name, c.gender, c.email, c.mobile, c.position,
                   c.years_coaching, c.certifications, c.previous_awards, c.status,
                   s.school_name
            FROM coaches c
            LEFT JOIN schools s ON c.school_id = s.id
            WHERE c.is_deleted = 0
            ORDER BY c.full_name`),

        pool.execute(`
            SELECT st.full_name, st.gender, st.grade_level, st.age,
                   st.previous_participation, st.consent_signed, st.status,
                   s.school_name
            FROM students st
            LEFT JOIN schools s ON st.school_id = s.id
            WHERE st.is_deleted = 0
            ORDER BY st.full_name`),

        pool.execute(`
            SELECT t.team_name, t.category, t.age_group, t.season,
                   t.robot_platform, t.programming_language,
                   t.registration_status, t.payment_status, t.qualification_status, t.status,
                   s.school_name, c.full_name AS coach_name, comp.name AS competition_name
            FROM teams t
            LEFT JOIN schools s        ON t.school_id     = s.id
            LEFT JOIN coaches c        ON t.coach_id      = c.id
            LEFT JOIN competitions comp ON t.competition_id = comp.id
            WHERE t.is_deleted = 0
            ORDER BY t.team_name`),

        pool.execute(`
            SELECT name, season, theme, date, venue, organizer, registration_deadline,
                   number_of_teams, number_of_schools, number_of_coaches, number_of_students, status
            FROM competitions
            WHERE is_deleted = 0
            ORDER BY date DESC`),

        pool.execute(`
            SELECT a.award, a.category, a.year, a.event,
                   a.has_trophy, a.has_medal, a.has_certificate, a.status,
                   t.team_name, s.school_name, c.full_name AS coach_name
            FROM awards a
            LEFT JOIN teams t   ON a.team_id   = t.id
            LEFT JOIN schools s ON a.school_id = s.id
            LEFT JOIN coaches c ON a.coach_id  = c.id
            WHERE a.is_deleted = 0
            ORDER BY a.year DESC, a.award`),

        pool.execute(`
            SELECT p.registration_fee, p.amount_paid, p.balance,
                   p.payment_date, p.payment_method, p.or_number,
                   p.sponsorship, p.scholarship, p.status,
                   t.team_name, s.school_name
            FROM payments p
            LEFT JOIN teams t   ON p.team_id   = t.id
            LEFT JOIN schools s ON p.school_id = s.id
            WHERE p.is_deleted = 0
            ORDER BY p.payment_date DESC`),

        pool.execute(`
            SELECT tm.team_id, tm.student_id,
                   t.team_name, st.full_name AS student_name, st.grade_level, st.gender,
                   s.school_name
            FROM team_members tm
            LEFT JOIN teams t     ON tm.team_id    = t.id
            LEFT JOIN students st ON tm.student_id = st.id
            LEFT JOIN schools s   ON t.school_id   = s.id
            WHERE t.is_deleted = 0 AND st.is_deleted = 0
            ORDER BY t.team_name, st.full_name`),

        pool.execute(`
            SELECT j.judge_name, j.category, j.score, j.final_score,
                   j.ranking, j.comments, j.violations, j.status,
                   t.team_name, s.school_name
            FROM judging j
            LEFT JOIN teams t   ON j.team_id   = t.id
            LEFT JOIN schools s ON t.school_id = s.id
            WHERE j.is_deleted = 0
            ORDER BY j.final_score DESC, j.ranking ASC`),

        pool.execute(`
            SELECT co.registration_confirmation, co.payment_confirmation,
                   co.certificate_sent, co.announcement_received,
                   co.feedback_submitted, co.status,
                   t.team_name, s.school_name
            FROM communications co
            LEFT JOIN teams t   ON co.team_id  = t.id
            LEFT JOIN schools s ON t.school_id = s.id
            WHERE co.is_deleted = 0
            ORDER BY t.team_name`),

        pool.execute(`
            SELECT d.destination_country, d.wro_year, d.passport_status,
                   d.passport_expiry, d.visa_status, d.parent_consent,
                   d.flight, d.hotel, d.dietary_restrictions, d.status,
                   t.team_name, s.school_name
            FROM delegation d
            LEFT JOIN teams t   ON d.team_id   = t.id
            LEFT JOIN schools s ON t.school_id = s.id
            WHERE d.is_deleted = 0
            ORDER BY d.wro_year DESC, t.team_name`),

        // Users: expose roles and activity info, never passwords
        pool.execute(`
            SELECT username, name, role, email, is_active, last_login, created_at
            FROM users
            WHERE is_deleted = 0
            ORDER BY role, name`),

        // Audit logs: last 200 entries for recent activity context
        pool.execute(`
            SELECT action, table_name, record_id, user_name, timestamp
            FROM audit_logs
            ORDER BY timestamp DESC
            LIMIT 200`),

        discoverLiveTables(),
    ]);

    // ── Format each table as readable text ────────────────────
    const fmt = {
        schools: schools.length === 0 ? 'No schools registered.' : schools.map(s =>
            `- ${s.school_name} (${s.school_type || 'N/A'}, ${s.school_level || 'N/A'}) | Region: ${s.region || 'N/A'} | Province: ${s.province || 'N/A'} | City: ${s.city || 'N/A'} | Head: ${s.school_head || 'N/A'} | Coordinator: ${s.robotics_coordinator || 'N/A'} | Contact: ${s.contact_number || 'N/A'} | Email: ${s.email || 'N/A'} | Joined: ${s.years_joined || 'N/A'} | Status: ${s.status}`
        ).join('\n'),

        coaches: coaches.length === 0 ? 'No coaches registered.' : coaches.map(c =>
            `- ${c.full_name} (${c.gender || 'N/A'}) | School: ${c.school_name || 'N/A'} | Position: ${c.position || 'N/A'} | Years Coaching: ${c.years_coaching ?? 'N/A'} | Certifications: ${c.certifications || 'None'} | Awards: ${c.previous_awards || 'None'} | Email: ${c.email || 'N/A'} | Mobile: ${c.mobile || 'N/A'} | Status: ${c.status}`
        ).join('\n'),

        students: students.length === 0 ? 'No students registered.' : students.map(s =>
            `- ${s.full_name} (${s.gender || 'N/A'}, Grade: ${s.grade_level || 'N/A'}, Age: ${s.age || 'N/A'}) | School: ${s.school_name || 'N/A'} | Prev. Participations: ${s.previous_participation ?? 0} | Consent Signed: ${s.consent_signed ? 'Yes' : 'No'} | Status: ${s.status}`
        ).join('\n'),

        teams: teams.length === 0 ? 'No teams registered.' : teams.map(t =>
            `- ${t.team_name} | Category: ${t.category || 'N/A'} | Age Group: ${t.age_group || 'N/A'} | Season: ${t.season || 'N/A'} | School: ${t.school_name || 'N/A'} | Coach: ${t.coach_name || 'N/A'} | Competition: ${t.competition_name || 'N/A'} | Platform: ${t.robot_platform || 'N/A'} | Language: ${t.programming_language || 'N/A'} | Registration: ${t.registration_status} | Payment: ${t.payment_status} | Qualification: ${t.qualification_status} | Status: ${t.status}`
        ).join('\n'),

        competitions: competitions.length === 0 ? 'No competitions on record.' : competitions.map(c =>
            `- ${c.name} | Season: ${c.season || 'N/A'} | Theme: ${c.theme || 'N/A'} | Date: ${c.date ? new Date(c.date).toDateString() : 'N/A'} | Deadline: ${c.registration_deadline ? new Date(c.registration_deadline).toDateString() : 'N/A'} | Venue: ${c.venue || 'N/A'} | Organizer: ${c.organizer || 'N/A'} | Teams: ${c.number_of_teams} | Schools: ${c.number_of_schools} | Coaches: ${c.number_of_coaches} | Students: ${c.number_of_students} | Status: ${c.status}`
        ).join('\n'),

        awards: awards.length === 0 ? 'No awards on record.' : awards.map(a =>
            `- ${a.award} | Category: ${a.category || 'N/A'} | Year: ${a.year || 'N/A'} | Event: ${a.event || 'N/A'} | Team: ${a.team_name || 'N/A'} | School: ${a.school_name || 'N/A'} | Coach: ${a.coach_name || 'N/A'} | Trophy: ${a.has_trophy ? 'Yes' : 'No'} | Medal: ${a.has_medal ? 'Yes' : 'No'} | Certificate: ${a.has_certificate ? 'Yes' : 'No'} | Status: ${a.status}`
        ).join('\n'),

        payments: payments.length === 0 ? 'No payment records.' : payments.map(p =>
            `- Team: ${p.team_name || 'N/A'} | School: ${p.school_name || 'N/A'} | Fee: P${p.registration_fee ?? 0} | Paid: P${p.amount_paid ?? 0} | Balance: P${p.balance ?? 0} | Date: ${p.payment_date ? new Date(p.payment_date).toDateString() : 'N/A'} | Method: ${p.payment_method || 'N/A'} | OR#: ${p.or_number || 'N/A'} | Sponsorship: P${p.sponsorship ?? 0} | Scholarship: ${p.scholarship || 'None'} | Status: ${p.status}`
        ).join('\n'),

        teamMembers: teamMembers.length === 0 ? 'No team member assignments.' : teamMembers.map(m =>
            `- Team: ${m.team_name || 'N/A'} | Student: ${m.student_name || 'N/A'} | Grade: ${m.grade_level || 'N/A'} | Gender: ${m.gender || 'N/A'} | School: ${m.school_name || 'N/A'}`
        ).join('\n'),

        judging: judging.length === 0 ? 'No judging records.' : judging.map(j =>
            `- Team: ${j.team_name || 'N/A'} | School: ${j.school_name || 'N/A'} | Judge: ${j.judge_name || 'N/A'} | Category: ${j.category || 'N/A'} | Score: ${j.score ?? 0} | Final Score: ${j.final_score ?? 0} | Ranking: ${j.ranking ?? 'N/A'} | Violations: ${j.violations || 'None'} | Comments: ${j.comments || 'None'} | Status: ${j.status}`
        ).join('\n'),

        communications: communications.length === 0 ? 'No communication records.' : communications.map(c =>
            `- Team: ${c.team_name || 'N/A'} | School: ${c.school_name || 'N/A'} | Reg Confirmed: ${c.registration_confirmation ? 'Yes' : 'No'} | Payment Confirmed: ${c.payment_confirmation ? 'Yes' : 'No'} | Certificate Sent: ${c.certificate_sent ? 'Yes' : 'No'} | Announcement Received: ${c.announcement_received ? 'Yes' : 'No'} | Feedback Submitted: ${c.feedback_submitted ? 'Yes' : 'No'} | Status: ${c.status}`
        ).join('\n'),

        delegation: delegation.length === 0 ? 'No delegation records.' : delegation.map(d =>
            `- Team: ${d.team_name || 'N/A'} | School: ${d.school_name || 'N/A'} | Destination: ${d.destination_country || 'N/A'} | WRO Year: ${d.wro_year || 'N/A'} | Passport: ${d.passport_status} (Expiry: ${d.passport_expiry ? new Date(d.passport_expiry).toDateString() : 'N/A'}) | Visa: ${d.visa_status} | Parent Consent: ${d.parent_consent ? 'Yes' : 'No'} | Flight: ${d.flight || 'N/A'} | Hotel: ${d.hotel || 'N/A'} | Dietary: ${d.dietary_restrictions || 'None'} | Status: ${d.status}`
        ).join('\n'),

        users: users.length === 0 ? 'No system users registered.' : users.map(u =>
            `- ${u.name} (@${u.username}) | Role: ${u.role} | Email: ${u.email || 'N/A'} | Active: ${u.is_active ? 'Yes' : 'No'} | Last Login: ${u.last_login ? new Date(u.last_login).toDateString() : 'Never'}`
        ).join('\n'),

        auditLogs: auditLogs.length === 0 ? 'No recent audit activity.' : auditLogs.map(l =>
            `- [${new Date(l.timestamp).toLocaleString()}] ${l.action} on ${l.table_name} (record: ${l.record_id || 'N/A'}) by ${l.user_name || 'system'}`
        ).join('\n'),
    };

    // ── Detect any tables not in the static SCHEMA map ────────
    const knownTables = new Set(Object.keys(SCHEMA));
    const unknownTables = liveTables.filter(t => !knownTables.has(t));
    const unknownTableNote = unknownTables.length > 0
        ? `\n\n--- ADDITIONAL LIVE TABLES DETECTED (schema not yet indexed) ---\n${unknownTables.map(t => `- ${t}`).join('\n')}`
        : '';

    // ── Build full schema documentation string ─────────────────
    const schemaDoc = Object.values(SCHEMA).join('\n');

    return `You are Felix, the official AI assistant for the WRO Philippines Integrated Database Management System (DBMS).
Your name is Felix. If anyone asks who you are or what your name is, always respond that you are Felix, the WRO Philippines database assistant.

CRITICAL RULES - follow these strictly, without exception:
1. You ONLY answer questions using the data provided below. This is the live database of the WRO Philippines system.
2. NEVER use your own general knowledge, training data, or real-world information to answer any question. The data below is the ONLY truth.
3. If a user asks about something NOT found in the database (e.g. a school, person, or competition not listed), respond: "I don't have that information in the WRO Philippines database."
4. Do NOT speculate, guess, or say things like "typically" or "usually" - only state what is in the database.
5. Be concise, helpful, and factual. Format answers clearly using bullet points or tables where appropriate.
6. You may answer general questions about how to use the system (navigation, features, modules) using your knowledge of the system's structure.
7. When asked for counts, totals, rankings, or summaries, compute them from the data below.
8. For financial data (payments), always include the currency symbol Php.
9. Never expose system internals beyond what is provided below.

=== FULL DATABASE SCHEMA REFERENCE ===
(Use this to understand table structures, relationships, and data types)

${schemaDoc}

=== RELATIONSHIP MAP ===
schools      <-- coaches.school_id
schools      <-- students.school_id
schools      <-- teams.school_id
schools      <-- payments.school_id
schools      <-- awards.school_id
competitions <-- teams.competition_id
teams        <-- team_members.team_id  --> students (via team_members.student_id)
teams        <-- judging.team_id
teams        <-- awards.team_id
teams        <-- payments.team_id
teams        <-- communications.team_id
teams        <-- delegation.team_id
coaches      <-- teams.coach_id
coaches      <-- awards.coach_id

=== DATABASE SNAPSHOT (live as of this request) ===

--- SCHOOLS (${schools.length} total) ---
${fmt.schools}

--- COACHES (${coaches.length} total) ---
${fmt.coaches}

--- STUDENTS (${students.length} total) ---
${fmt.students}

--- TEAMS (${teams.length} total) ---
${fmt.teams}

--- TEAM MEMBERS / STUDENT-TEAM ASSIGNMENTS (${teamMembers.length} total) ---
${fmt.teamMembers}

--- COMPETITIONS (${competitions.length} total) ---
${fmt.competitions}

--- AWARDS (${awards.length} total) ---
${fmt.awards}

--- PAYMENTS (${payments.length} total) ---
${fmt.payments}

--- JUDGING RECORDS (${judging.length} total) ---
${fmt.judging}

--- COMMUNICATIONS (${communications.length} total) ---
${fmt.communications}

--- DELEGATION / INTERNATIONAL (${delegation.length} total) ---
${fmt.delegation}

--- SYSTEM USERS (${users.length} total) ---
${fmt.users}

--- RECENT AUDIT LOG (last ${auditLogs.length} entries) ---
${fmt.auditLogs}
${unknownTableNote}

=== END OF DATABASE SNAPSHOT ===

Remember: Base ALL answers strictly on the data above. If the answer is not in the data, say so clearly.`;
}

// ── POST /api/chat ────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;

        // ── Input validation ──────────────────────────────────
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'A non-empty string "message" is required.' });
        }

        const trimmed = message.trim();
        if (trimmed.length === 0) {
            return res.status(400).json({ error: 'Message cannot be blank.' });
        }

        if (trimmed.length > 4000) {
            return res.status(400).json({ error: 'Message is too long. Please keep it under 4000 characters.' });
        }

        // ── Build live database context ───────────────────────
        const systemInstruction = await buildDatabaseContext();

        // ── Build conversation contents (with optional history) ─
        let contents;
        if (Array.isArray(history) && history.length > 0) {
            // Keep last 10 turns max to stay within token limits
            const recentHistory = history.slice(-10);
            contents = [
                ...recentHistory.map(turn => ({
                    role: turn.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: String(turn.content || '') }],
                })),
                { role: 'user', parts: [{ text: trimmed }] },
            ];
        } else {
            contents = trimmed;
        }

        // ── Send to Gemini with full DB system instruction ────
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
                temperature: 0.2,
                maxOutputTokens: 2048,
            },
            contents,
        });

        res.json({ reply: response.text });

    } catch (error) {
        const errMsg = error?.message || String(error);
        console.error('[Chatbot Error]', errMsg);

        // ── Friendly error classification ─────────────────────
        if (errMsg.includes('API_KEY') || errMsg.includes('PERMISSION_DENIED')) {
            return res.status(503).json({
                error: 'AI service is temporarily unavailable. Please check the API key configuration.',
            });
        }
        if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
            return res.status(429).json({
                error: 'AI quota exceeded. Please try again shortly.',
            });
        }
        if (errMsg.includes('ER_') || errMsg.includes('connect ECONNREFUSED')) {
            return res.status(503).json({
                error: 'Database is temporarily unavailable. Please try again in a moment.',
            });
        }

        res.status(500).json({
            error: 'Failed to generate a response. Please try again.',
            detail: process.env.NODE_ENV === 'development' ? errMsg : undefined,
        });
    }
});

module.exports = router;
