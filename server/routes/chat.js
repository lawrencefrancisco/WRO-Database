const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Initialize the Google Gen AI client
// It automatically detects the GEMINI_API_KEY from your .env file
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Send the user's message to Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
        });

        // Send the AI's response back to the frontend
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