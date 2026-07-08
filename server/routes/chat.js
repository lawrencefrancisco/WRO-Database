const express = require('express');
const router = express.Router();
const pool = require('../db/pool'); // Connects to your WRO database pool[cite: 2]

// This route receives the message and the model choice from your frontend select box
router.post('/', async (req, res) => {
    try {
        // This unpacks the message, history, and model choice sent from your app.js file
        const { message, model, history } = req.body;

        // If something went wrong with the dropdown, default to the safer gemini-2.5-flash
        const selectedAgentModel = model || 'gemini-2.5-flash';

        console.log(`[WRO Chat] User requested model agent: ${selectedAgentModel}`);

        // This is a safe placeholder. It proves the backend is receiving your model switch!
        res.json({ 
            reply: `Hello! I am processing your question using the [${selectedAgentModel}] agent. Your saved chat history depth is currently at ${history ? history.length : 0} messages.` 
        });

    } catch (error) {
        console.error("The backend chat router hit an error:", error);
        res.status(500).json({ error: "Failed to communicate with the AI model layer." });
    }
});

module.exports = router;