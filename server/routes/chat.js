const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { GoogleGenAI } = require('@google/genai');

// ── Gemini client ───────────────────────────────────────────────
const ai = new GoogleGenAI({});

// ── Model fallback chain ──────────────────────────────────────
// When a model is overloaded (503), Felix automatically tries the next one.
const MODEL_FALLBACKS = {
    'gemini-3.5-flash': ['gemini-3.5-flash', 'gemini-2.5-flash'],
    'gemini-3.1-pro-preview': ['gemini-3.1-pro-preview', 'gemini-2.5-flash'],
    'gemini-2.5-flash': ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'],
    'gemini-2.5-flash-lite': ['gemini-2.5-flash-lite', 'gemini-2.5-flash'],
    'gemini-2.5-pro': ['gemini-2.5-pro', 'gemini-2.5-flash'],
    'gemini-1.5-flash': ['gemini-1.5-flash', 'gemini-2.5-flash'],
    'gemini-1.5-pro': ['gemini-1.5-pro', 'gemini-2.5-flash'],
};
const DEFAULT_MODEL = 'gemini-2.5-flash';

// ── Felix's WRO Philippines system persona ────────────────────
// This prompt gives Felix both (a) the "book knowledge" of how the WRO
// Philippines platform works — its modules, workflows, and common
// troubleshooting steps — and (b) rules for how to talk about live data
// that gets injected below at request time.
const SYSTEM_PROMPT = `
You are Felix, the expert virtual assistant for the WRO (World Robot Olympiad) Philippines Database Management System.

You help administrators, coaches, judges, school coordinators, and staff (a) look up information in the system, (b) understand how the platform works, and (c) troubleshoot problems they run into while using it.

═══════════════════════════════════════
1. SYSTEM MODULES YOU UNDERSTAND
═══════════════════════════════════════

• **Schools** — School name, type (Private/Public/Sectarian), region/province/city, DepEd ID, contact info, robotics coordinator, school head, and active/inactive status. Schools are the top-level entity that students, coaches, and teams are attached to.

• **Students** — Name, grade level, gender, age, school affiliation, birthday, shirt size, consent/waiver form status, and active/inactive status. A student can only belong to one school at a time and is typically linked to a team roster for a given season.

• **Coaches** — Name, position/role, school affiliation, contact info, certification status, years of coaching experience, and account status. Coaches are usually the ones who register teams and manage rosters.

• **Teams** — Team name, WRO competition category (e.g., RoboMission, Future Innovators, Future Engineers, RoboSports, depending on division/age bracket), competition season/year, school affiliation, assigned coach, and team member roster. Registration status tracks whether a team's entry is complete (e.g., pending, registered, disqualified).

• **Competitions / Events / Seasons** — Competition name, season/year, date(s), venue, category, status (upcoming/ongoing/completed), and the list of registered participants/teams. A "season" groups competitions and team registrations under a single competition year (e.g., WRO Philippines 2025 Season).

• **Payments** — Registration fee, amount paid, balance, payment status (paid/unpaid/partial), payment method, and the team or school it's tied to. Payment status commonly gates whether a team's registration is finalized.

• **Judging** — Judge assignments to teams/categories, rubric scores, and scoring notes. Judging data determines rankings within a category at a competition.

• **Awards** — Award/rank names, the competition they were earned at, and the recipient (school, team, or student).

• **Communications** — Announcements, messages, and notifications sent to schools, coaches, or teams (e.g., registration reminders, schedule changes).

═══════════════════════════════════════
2. HOW THE PIECES FIT TOGETHER (WORKFLOW KNOWLEDGE)
═══════════════════════════════════════

Use this general workflow knowledge to explain "how do I…" and "why is…" questions, even when it isn't spelled out in the live data below:

1. A **school** is onboarded/registered in the system first, with a coordinator and DepEd ID on file.
2. A **coach** is added and linked to that school.
3. **Students** are added under the school and made eligible for team rosters (often gated by a signed consent form).
4. A **team** is created for a specific season + category, assigned a coach, and populated with a student roster (rosters usually have min/max member limits per category — direct the user to check the category's official WRO rules if they ask for exact numbers you don't have data on).
5. **Payment** of the registration fee is submitted and marked paid/partial/unpaid — many systems will not finalize ("register") a team until payment is confirmed.
6. The team appears on the **competition/event** roster for that season once registration + payment are complete.
7. On competition day, **judges** are assigned to categories/teams and enter scores.
8. **Awards** are recorded against the results, and **communications** may go out to notify schools/teams of results or next steps.

Common troubleshooting patterns you can reason through:
- "My team isn't showing up in the competition list" → check registration_status on the team and payment status; incomplete rosters or unpaid fees are the most common causes.
- "A student can't be added to a team" → check the student's status/consent form and whether they're already rostered on another team for that season.
- "Payment shows unpaid but the school says they paid" → this is a reconciliation issue; tell the user to verify the payment record (amount, method, date) in the Payments module and contact the finance/admin team if it still doesn't match — you cannot alter payment records yourself.
- "Coach can't log in / can't see their team" → this is usually an account status or school-assignment issue; direct them to check the coach's status field, or to contact a system administrator, since you cannot change account access yourself.
- "Judge scores aren't reflecting in results" → check that the judge assignment exists for that team/category and that scores were submitted, not just drafted.

═══════════════════════════════════════
3. HOW TO ANSWER
═══════════════════════════════════════

- Be concise, warm, and professional. Prefer bullet points or short numbered steps over long paragraphs.
- When answering questions about actual records (specific schools, students, teams, payments, etc.), rely ONLY on the LIVE DATA block provided below. Never invent specific names, IDs, or numbers that aren't present in it.
- When answering "how does X work" or "how do I do Y" or troubleshooting questions, use your workflow knowledge above — you don't need live data for that.
- If the live data needed to answer a question wasn't provided to you (e.g., the user asks about judging assignments or awards but that data isn't in your context), say so plainly and explain what module of the system would hold that information, rather than guessing.
- You cannot perform actions — you cannot edit, delete, approve, or create records, log in as anyone, or change permissions. If a user asks you to *do* something rather than explain or look something up, tell them clearly that you can only provide information and guidance, and point them to the relevant part of the system (or an administrator) to make the actual change.
- If asked something entirely outside the WRO Philippines system (general trivia, unrelated coding help, etc.), politely redirect back to your role.
- Always respond in English unless the user writes in Filipino, in which case you may respond in Filipino or Taglish.
- If someone asks who created the WRO Philippines database management system, say that Lawrence Francisco AKA pogi.

You are Felix — helpful, precise, and always ready to help people understand and navigate WRO Philippines data and workflows!
`.trim();

// ── Helper: try generating with automatic model fallback ──────
async function generateWithFallback(primaryModel, contents, systemInstruction) {
    const chain = MODEL_FALLBACKS[primaryModel] || [primaryModel, 'gemini-2.5-flash'];
    let lastError;

    for (const model of chain) {
        try {
            console.log(`[Felix Chat] Trying model: ${model}`);
            const response = await ai.models.generateContent({
                model,
                contents,
                config: {
                    systemInstruction,
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            });
            if (response.text) {
                if (model !== primaryModel) {
                    console.log(`[Felix Chat] ✅ Succeeded with fallback model: ${model}`);
                }
                return response.text;
            }
        } catch (err) {
            const msg = err?.message || '';
            const isRetryable = msg.includes('503')
                || msg.includes('UNAVAILABLE')
                || msg.includes('overloaded')
                || msg.includes('high demand')
                || msg.includes('not found')
                || msg.includes('404');

            console.warn(`[Felix Chat] ⚠️ Model ${model} failed (retryable=${isRetryable}): ${msg.slice(0, 120)}`);
            lastError = err;

            if (!isRetryable) {
                // Auth errors, quota errors, invalid model, etc. – don't retry
                throw err;
            }
            // Otherwise try the next model in the chain
        }
    }
    // All fallbacks exhausted
    throw lastError;
}

// ── Helper: run a query but never let a missing/renamed table ──
// ── take down the whole chat endpoint. Logs a warning and       ──
// ── returns an empty array instead, so Felix simply says it     ──
// ── doesn't have that data rather than erroring out.             ──
async function safeQuery(label, sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (err) {
        console.warn(`[Felix Chat] ⚠️ Could not load "${label}" data: ${err?.message || err}`);
        return null; // null = "not available", distinct from [] = "available but empty"
    }
}

// ── POST /api/chat ────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { message, model, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty.' });
        }

        const selectedModel = (model && model.trim()) ? model.trim() : DEFAULT_MODEL;
        console.log(`[Felix Chat] Model: ${selectedModel} | Message: "${message.trim().slice(0, 80)}"`);

        // Build conversation contents for Gemini
        const contents = [];
        if (Array.isArray(history) && history.length > 0) {
            for (const turn of history) {
                const geminiRole = turn.role === 'assistant' ? 'model' : 'user';
                contents.push({ role: geminiRole, parts: [{ text: turn.content }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: message.trim() }] });

        // ── Fetch real-time system data to inject into Felix's context ──
        // Core modules (same as before)
        const schools = await safeQuery('schools',
            'SELECT id, school_name, school_type, region, city, robotics_coordinator, status FROM schools WHERE is_deleted = 0');
        const coaches = await safeQuery('coaches',
            'SELECT id, full_name, school_id, position, email, mobile, status FROM coaches WHERE is_deleted = 0');
        const students = await safeQuery('students',
            'SELECT id, full_name, grade_level, school_id, gender, age, status FROM students WHERE is_deleted = 0');
        const teams = await safeQuery('teams',
            'SELECT id, team_name, category, coach_id, school_id, registration_status FROM teams WHERE is_deleted = 0');
        const competitions = await safeQuery('competitions',
            'SELECT id, name, season, date, venue, status FROM competitions WHERE is_deleted = 0');
        const payments = await safeQuery('payments',
            'SELECT id, team_id, registration_fee, amount_paid, status, payment_method FROM payments WHERE is_deleted = 0');

        // Extended modules — these are queried defensively (via safeQuery) since
        // exact table/column names for judging, awards, and communications may
        // differ from your current schema. If a query fails, Felix will simply
        // tell users that data isn't available to it instead of crashing.
        // Adjust the table/column names below to match your actual schema.
        const judges = await safeQuery('judges',
            'SELECT id, full_name, category, competition_id, status FROM judges WHERE is_deleted = 0');
        const judgeAssignments = await safeQuery('judge_assignments',
            'SELECT id, judge_id, team_id, competition_id, score, notes FROM judge_assignments WHERE is_deleted = 0');
        const awards = await safeQuery('awards',
            'SELECT id, award_name, rank, competition_id, team_id, student_id FROM awards WHERE is_deleted = 0');

        const liveData = {
            schools, coaches, students, teams, competitions, payments,
            judges, judgeAssignments, awards,
        };

        // Note for Felix about which modules weren't available this turn,
        // so it can be upfront about limitations instead of guessing.
        const unavailableModules = Object.entries(liveData)
            .filter(([, v]) => v === null)
            .map(([k]) => k);

        const dynamicSystemPrompt = SYSTEM_PROMPT
            + '\n\nCRITICAL CONTEXT: Here is the LIVE, REAL-TIME data currently in the WRO Philippines database. '
            + 'Use this JSON data to answer any questions about specific records accurately. '
            + 'A value of null for a module means that data could not be loaded this turn — '
            + 'if the user asks about a module that is null, tell them you don\'t currently have access '
            + 'to that data rather than guessing.\n\n'
            + JSON.stringify(liveData)
            + (unavailableModules.length
                ? `\n\nModules unavailable this turn: ${unavailableModules.join(', ')}.`
                : '');

        const replyText = await generateWithFallback(selectedModel, contents, dynamicSystemPrompt);

        if (!replyText) {
            return res.status(500).json({ error: 'The AI returned an empty response. Please try again.' });
        }

        res.json({ reply: replyText });

    } catch (error) {
        console.error('[Felix Chat] ❌ Fatal error:', error?.message || error);

        let friendlyError = 'Felix ran into a problem. Please try again in a moment.';
        const msg = error?.message || '';

        if (msg.includes('API_KEY') || msg.includes('API key') || msg.includes('authentication credentials') || msg.includes('UNAUTHENTICATED')) {
            friendlyError = '⚠️ The Gemini API key in your .env file is invalid or expired. Please generate a new key from Google AI Studio and update your .env file.';
        } else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
            friendlyError = '⚠️ The AI daily quota has been reached. Please wait and try again tomorrow.';
        } else if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
            friendlyError = '⚠️ All AI models are currently busy. Please try again in a minute.';
        } else if (msg.includes('not found') || msg.includes('404')) {
            friendlyError = `⚠️ The selected AI model "${req.body?.model}" was not found. Please choose a different model.`;
        }

        res.status(500).json({ error: friendlyError, detail: msg });
    }
});

module.exports = router;