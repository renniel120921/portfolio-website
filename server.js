const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// Matching your Render variable exactly: GEMENI_API_KEYS (with the 'I')
const apiKey = process.env.GEMENI_API_KEYS;

if (!apiKey) {
    console.error("❌ ERROR: GEMENI_API_KEYS is missing. Please check your Render Environment Variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Using 'gemini-pro' as it is the most stable identifier to avoid 404 errors
const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    systemInstruction: "You are Renniel Salazar, a 4th-year IT student at City College of San Fernando. You are a helpful portfolio assistant. Keep your answers professional and concise (max 2-3 sentences).",
});

// Health check route to help your status dot turn green
app.get('/', (req, res) => {
    res.send("✅ Renniel's AI Portfolio Server is Live and Running!");
});

async function verifyConnection() {
    try {
        // Simple test to ensure the API Key and Model are working
        await model.generateContent("Hi");
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

        // Filter history to ensure it's in the correct format for gemini-pro
        const chat = model.startChat({
            history: (history || []).filter(h => h.role && h.parts),
            generationConfig: { maxOutputTokens: 500 },
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        console.log("🤖 Response sent successfully");
        res.json({ text: responseText });
    } catch (error) {
        console.error("Chat Error:", error.message);
        res.status(500).json({ error: "I'm having trouble thinking right now. Please try again in a moment." });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
