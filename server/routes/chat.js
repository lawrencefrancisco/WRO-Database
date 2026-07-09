const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { GoogleGenAI } = require('@google/genai');

// ── Gemini client (uses your key from .env) ───────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Model fallback chain ──────────────────────────────────────
// When a model is overloaded (503), Felix automatically tries the next one.
const MODEL_FALLBACKS = {
    'gemini-2.5-flash': ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'],
    'gemini-2.5-pro': ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'],
    'gemini-2.5-flash-lite-preview-06-17': ['gemini-2.5-flash-lite-preview-06-17', 'gemini-1.5-flash'],
    'gemini-1.5-flash': ['gemini-1.5-flash', 'gemini-1.5-flash-8b'],
    'gemini-1.5-pro': ['gemini-1.5-pro', 'gemini-1.5-flash'],
};
const DEFAULT_MODEL = 'gemini-2.5-flash';

// ── Felix's WRO Philippines system persona ────────────────────
const SYSTEM_PROMPT = `
You are Felix, a friendly and knowledgeable AI assistant for the WRO (World Robot Olympiad) Philippines database management system.

Your role is to help administrators, coaches, judges, and staff answer questions about the WRO Philippines database. You have deep knowledge of the following data in the system:

- **Schools**: School names, types (Private/Public/Sectarian), regions, provinces, cities, DepEd IDs, contact info, robotics coordinators, School head, and their status.
- **Students**: Student names, grades, genders, school affiliations, birthdays, shirt sizes, and consent forms.
- **Coaches**: Coach names, positions, schools, certifications, years of coaching experience.
- **Teams**: Team names, categories (WRO categories), competition year, school affiliation, coach, and team members.
- **Competitions**: Competition events, dates, venues, categories, and registered participants.
- **Payments**: Payment records, amounts, statuses (paid/unpaid/partial), school or team associations.
- **Awards**: Award names, ranks, recipients (schools, teams, students), and competition context.
- **Judging**: Judge assignments, scores, and rubric entries for teams.
- **Communications**: Announcements, messages, and notifications sent to participants.

When answering questions:
- Be concise, warm, and professional.
- Never fabricate specific names, numbers, or records unless the user has provided them.
- Always respond in English unless the user writes in Filipino, in which case you may respond in Filipino or a mix (Taglish).
- Keep responses brief and to the point. Use bullet points or numbered lists when it helps clarity.
- If asked something outside the WRO Philippines context, politely redirect the conversation back to your role.
-if someone asked who create the WRO Philippine database management. Say that Lawrence Francisco AKA pogi.
You are Felix — helpful, professional, and always ready to assist with WRO Philippines data!
`.trim();

// ── Helper: try generating with automatic model fallback ──────
async function generateWithFallback(primaryModel, contents, systemInstruction) {
    const chain = MODEL_FALLBACKS[primaryModel] || [primaryModel, 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
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
                || msg.includes('high demand');

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

        // Fetch real-time system data to inject into Felix's context
        const [schools] = await pool.execute('SELECT id, school_name, school_type, region, city, robotics_coordinator, status FROM schools WHERE is_deleted = 0');
        const [coaches] = await pool.execute('SELECT id, full_name, school_id, position, email, mobile, status FROM coaches WHERE is_deleted = 0');
        const [students] = await pool.execute('SELECT id, full_name, grade_level, school_id, gender, age, status FROM students WHERE is_deleted = 0');
        const [teams] = await pool.execute('SELECT id, team_name, category, coach_id, school_id, registration_status FROM teams WHERE is_deleted = 0');
        const [competitions] = await pool.execute('SELECT id, name, season, date, venue, status FROM competitions WHERE is_deleted = 0');
        const [payments] = await pool.execute('SELECT id, team_id, registration_fee, amount_paid, status, payment_method FROM payments WHERE is_deleted = 0');

        const dynamicSystemPrompt = SYSTEM_PROMPT
            + '\n\nCRITICAL CONTEXT: Here is the LIVE, REAL-TIME data currently in the WRO Philippines database. '
            + 'You must use this JSON data to answer any questions about the system accurately:\n\n'
            + JSON.stringify({ schools, coaches, students, teams, competitions, payments });

        const replyText = await generateWithFallback(selectedModel, contents, dynamicSystemPrompt);

        if (!replyText) {
            return res.status(500).json({ error: 'The AI returned an empty response. Please try again.' });
        }

        res.json({ reply: replyText });

    } catch (error) {
        console.error('[Felix Chat] ❌ Fatal error:', error?.message || error);

        let friendlyError = 'Felix ran into a problem. Please try again in a moment.';
        const msg = error?.message || '';

        if (msg.includes('API_KEY') || msg.includes('API key')) {
            friendlyError = '⚠️ The Gemini API key is missing or invalid. Please check your .env file.';
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