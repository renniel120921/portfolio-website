const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const apiKey = process.env.GEMEN_API_KEYS;

if (!apiKey) {
    console.error("❌ ERROR: GEMEN_API_KEYS is missing.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// 2026 STABLE MODEL: Gemini 2.5 Flash
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // Improved System Instruction for a more complete persona
    systemInstruction: "You are Renniel Salazar, an IT student. TONE: Professional and Friendly. RULES: Keep answers concise but always complete your sentences. If you don't understand, suggest asking about SmartBasura or your Tech Stack.",
});

app.get('/', (req, res) => {
    res.send("✅ Server is Online!");
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: "No message" });

        const chat = model.startChat({
            history: (history || []).slice(-6), // Keep context memory efficient
            generationConfig: {
                maxOutputTokens: 1000, // Increased to prevent truncated "putol" replies
                temperature: 0.7       // Balanced for natural, consistent responses
            }
        });

        const result = await chat.sendMessage(message);
        res.json({ text: result.response.text() });
    } catch (error) {
        console.error("Chat Error:", error.message);
        res.status(500).json({ error: "I'm processing... please try again in a moment." });
    }
});

app.listen(PORT, () => console.log(`🚀 Port: ${PORT}`));
