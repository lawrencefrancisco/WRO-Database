// ============================================================
// WRO Philippines DBMS – AI Chat Route (Database-Grounded)
// ============================================================

const express = require('express');
const router  = express.Router();
const { GoogleGenAI } = require('@google/genai');
const pool = require('../db/pool');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Helper: fetch all relevant DB data and build context ──────
async function buildDatabaseContext() {
    const [schools]      = await pool.execute(`SELECT school_name, school_type, school_level, region, province, city, address, contact_number, email, school_head, robotics_coordinator, years_joined, status FROM schools WHERE is_deleted = 0 ORDER BY school_name`);
    const [coaches]      = await pool.execute(`SELECT c.full_name, c.gender, c.email, c.mobile, c.position, c.years_coaching, c.certifications, c.previous_awards, c.status, s.school_name FROM coaches c LEFT JOIN schools s ON c.school_id = s.id WHERE c.is_deleted = 0 ORDER BY c.full_name`);
    const [students]     = await pool.execute(`SELECT st.full_name, st.gender, st.grade_level, st.age, st.status, s.school_name FROM students st LEFT JOIN schools s ON st.school_id = s.id WHERE st.is_deleted = 0 ORDER BY st.full_name`);
    const [teams]        = await pool.execute(`SELECT t.team_name, t.category, t.age_group, t.season, t.robot_platform, t.programming_language, t.registration_status, t.payment_status, t.qualification_status, t.status, s.school_name, c.full_name AS coach_name, comp.name AS competition_name FROM teams t LEFT JOIN schools s ON t.school_id = s.id LEFT JOIN coaches c ON t.coach_id = c.id LEFT JOIN competitions comp ON t.competition_id = comp.id WHERE t.is_deleted = 0 ORDER BY t.team_name`);
    const [competitions] = await pool.execute(`SELECT name, season, theme, date, venue, organizer, registration_deadline, number_of_teams, number_of_schools, number_of_coaches, number_of_students, status FROM competitions WHERE is_deleted = 0 ORDER BY date DESC`);
    const [awards]       = await pool.execute(`SELECT a.award, a.category, a.year, a.event, a.status, t.team_name, s.school_name, c.full_name AS coach_name FROM awards a LEFT JOIN teams t ON a.team_id = t.id LEFT JOIN schools s ON a.school_id = s.id LEFT JOIN coaches c ON a.coach_id = c.id WHERE a.is_deleted = 0 ORDER BY a.year DESC, a.award`);

    // ── Format each table as readable text ────────────────────
    const fmt = {
        schools: schools.length === 0 ? 'No schools registered.' : schools.map(s =>
            `- ${s.school_name} (${s.school_type || 'N/A'}, ${s.school_level || 'N/A'}) | Region: ${s.region || 'N/A'} | City: ${s.city || 'N/A'} | Head: ${s.school_head || 'N/A'} | Robotics Coordinator: ${s.robotics_coordinator || 'N/A'} | Contact: ${s.contact_number || 'N/A'} | Email: ${s.email || 'N/A'} | Joined: ${s.years_joined || 'N/A'} | Status: ${s.status}`
        ).join('\n'),

        coaches: coaches.length === 0 ? 'No coaches registered.' : coaches.map(c =>
            `- ${c.full_name} (${c.gender || 'N/A'}) | School: ${c.school_name || 'N/A'} | Position: ${c.position || 'N/A'} | Years Coaching: ${c.years_coaching} | Certifications: ${c.certifications || 'None'} | Awards: ${c.previous_awards || 'None'} | Status: ${c.status}`
        ).join('\n'),

        students: students.length === 0 ? 'No students registered.' : students.map(s =>
            `- ${s.full_name} (${s.gender || 'N/A'}, Grade: ${s.grade_level || 'N/A'}, Age: ${s.age || 'N/A'}) | School: ${s.school_name || 'N/A'} | Status: ${s.status}`
        ).join('\n'),

        teams: teams.length === 0 ? 'No teams registered.' : teams.map(t =>
            `- ${t.team_name} | Category: ${t.category || 'N/A'} | Age Group: ${t.age_group || 'N/A'} | Season: ${t.season || 'N/A'} | School: ${t.school_name || 'N/A'} | Coach: ${t.coach_name || 'N/A'} | Competition: ${t.competition_name || 'N/A'} | Platform: ${t.robot_platform || 'N/A'} | Language: ${t.programming_language || 'N/A'} | Registration: ${t.registration_status} | Payment: ${t.payment_status} | Qualification: ${t.qualification_status}`
        ).join('\n'),

        competitions: competitions.length === 0 ? 'No competitions on record.' : competitions.map(c =>
            `- ${c.name} | Season: ${c.season || 'N/A'} | Theme: ${c.theme || 'N/A'} | Date: ${c.date ? new Date(c.date).toDateString() : 'N/A'} | Venue: ${c.venue || 'N/A'} | Organizer: ${c.organizer || 'N/A'} | Teams: ${c.number_of_teams} | Schools: ${c.number_of_schools} | Status: ${c.status}`
        ).join('\n'),

        awards: awards.length === 0 ? 'No awards on record.' : awards.map(a =>
            `- ${a.award} | Category: ${a.category || 'N/A'} | Year: ${a.year || 'N/A'} | Event: ${a.event || 'N/A'} | Team: ${a.team_name || 'N/A'} | School: ${a.school_name || 'N/A'} | Coach: ${a.coach_name || 'N/A'} | Status: ${a.status}`
        ).join('\n'),
    };

    return `You are Felix, the official AI assistant for the WRO Philippines Integrated Database Management System (DBMS).
Your name is Felix. If anyone asks who you are or what your name is, always respond that you are Felix, the WRO Philippines database assistant.

CRITICAL RULES — follow these strictly, without exception:
1. You ONLY answer questions using the data provided below. This is the live database of the WRO Philippines system.
2. NEVER use your own general knowledge, training data, or real-world information to answer any question. The data below is the ONLY truth.
3. If a user asks about something NOT found in the database (e.g. a school, person, or competition not listed), respond: "I don't have that information in the WRO Philippines database."
4. Do NOT speculate, guess, or say things like "typically" or "usually" — only state what is in the database.
5. Be concise, helpful, and factual. Format answers clearly.
6. You may answer general questions about how to use the system (navigation, features, modules) using your knowledge of the system's structure.
7. Always refer to yourself as Felix.

=== DATABASE SNAPSHOT (as of right now) ===

--- SCHOOLS (${schools.length} total) ---
${fmt.schools}

--- COACHES (${coaches.length} total) ---
${fmt.coaches}

--- STUDENTS (${students.length} total) ---
${fmt.students}

--- TEAMS (${teams.length} total) ---
${fmt.teams}

--- COMPETITIONS (${competitions.length} total) ---
${fmt.competitions}

--- AWARDS (${awards.length} total) ---
${fmt.awards}

=== END OF DATABASE SNAPSHOT ===

Remember: Base ALL answers strictly on the data above. If the answer is not in the data, say so clearly.`;
}

// ── POST /api/chat ────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build live database context
        const systemInstruction = await buildDatabaseContext();

        // Send to Gemini with system instruction grounding it to the DB
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
            },
            contents: message,
        });

        res.json({ reply: response.text });

    } catch (error) {
        console.error('Chatbot Error:', error?.message || error);
        res.status(500).json({
            error: 'Failed to generate response from AI',
            detail: error?.message || String(error)
        });
    }
});

module.exports = router;