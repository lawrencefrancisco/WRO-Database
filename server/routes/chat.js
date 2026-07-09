const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { GoogleGenAI } = require('@google/genai');

// ── Gemini client (uses your key from .env) ───────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Felix's WRO Philippines system persona ────────────────────
const SYSTEM_PROMPT = `
You are Felix, a friendly and knowledgeable AI assistant for the WRO (World Robot Olympiad) Philippines database management system.

Your role is to help administrators, coaches, judges, and staff answer questions about the WRO Philippines database. You have deep knowledge of the following data in the system:

- **Schools**: School names, types (Private/Public/Sectarian), regions, provinces, cities, DepEd IDs, contact info, robotics coordinators, and their status.
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
- If you don't have access to real-time data, provide general guidance on where to find the information in the dashboard.
- Never fabricate specific names, numbers, or records unless the user has provided them.
- Always respond in English unless the user writes in Filipino, in which case you may respond in Filipino or a mix (Taglish).
- Keep responses brief and to the point. Use bullet points or numbered lists when it helps clarity.
- If asked something outside the WRO Philippines context, politely redirect the conversation back to your role.

You are Felix — helpful, professional, and always ready to assist with WRO Philippines data!
`.trim();

// ── POST /api/chat ────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { message, model, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty.' });
        }

        // Default to gemini-2.5-flash if no model is specified
        const selectedModel = model || 'gemini-2.5-flash';
        console.log(`[Felix Chat] Model: ${selectedModel} | Message: "${message.trim()}"`);

        // Build the conversation contents array
        // history items look like: { role: "user" | "assistant", content: "..." }
        const contents = [];

        // Inject prior history (last few turns)
        if (Array.isArray(history) && history.length > 0) {
            for (const turn of history) {
                // Gemini uses "model" role for assistant messages
                const geminiRole = turn.role === 'assistant' ? 'model' : 'user';
                contents.push({
                    role: geminiRole,
                    parts: [{ text: turn.content }]
                });
            }
        }

        // Add the current user message
        contents.push({
            role: 'user',
            parts: [{ text: message.trim() }]
        });

        // Call the Gemini API
        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: contents,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });

        const replyText = response.text;

        if (!replyText) {
            return res.status(500).json({ error: 'The AI returned an empty response. Please try again.' });
        }

        res.json({ reply: replyText });

    } catch (error) {
        console.error('[Felix Chat] Error calling Gemini API:', error?.message || error);

        // Give a friendly error back to the frontend
        let friendlyError = 'Felix ran into a problem. Please try again in a moment.';
        if (error?.message?.includes('API_KEY')) {
            friendlyError = 'The Gemini API key is missing or invalid. Please check your .env file.';
        } else if (error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            friendlyError = 'The AI quota has been reached. Please wait a moment and try again.';
        } else if (error?.message?.includes('not found') || error?.message?.includes('404')) {
            friendlyError = `The selected AI model "${req.body?.model}" was not found. Please choose a different model.`;
        }

        res.status(500).json({ error: friendlyError });
    }
});

module.exports = router;