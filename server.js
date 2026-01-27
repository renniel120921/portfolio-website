const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// Matching your variable name exactly: GEMEN_API_KEYS
const apiKey = process.env.GEMENI_API_KEYS;

if (!apiKey) {
    console.error("❌ ERROR: GEMEN_API_KEYS is missing. Please check your Render Environment Variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are a helpful and professional AI assistant for a developer's portfolio. Keep your answers concise.",
});

async function verifyConnection() {
    try {
        await model.generateContent("test");
        console.log("✅ Gemini API Connection: Active");
    } catch (err) {
        console.error("❌ Gemini API Connection Failed:", err.message);
    }
}
verifyConnection();

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 500 },
        });

        const result = await chat.sendMessage(message);
        res.json({ text: result.response.text() });
    } catch (error) {
        console.error("Chat Error:", error.message);
        res.status(500).json({ error: "I'm having trouble thinking right now." });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
