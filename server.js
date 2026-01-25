const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// --- MODEL CHECKER (Dito natin malalaman kung ano ang available sayo) ---
async function checkAvailableModels() {
    try {
        console.log("🔍 Checking available models for your API Key...");
        // Note: Gumagamit tayo ng fetch para direct access
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("✅ AVAILABLE MODELS:");
            data.models.forEach(m => console.log(`   - ${m.name.replace('models/', '')}`));
        } else {
            console.error("❌ Walang models na nakita. Baka may problema sa API Key Project.");
            console.error("Response:", data);
        }
    } catch (err) {
        console.error("Error checking models:", err);
    }
}
checkAvailableModels(); // Patakbuhin agad pag-start ng server
// ---------------------------------------------------------------------

// Gamitin ang 'gemini-1.5-flash' bilang default, pero check mo logs kung ano ang available
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        console.log(`📩 Message: "${message}"`);

        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(message);
        const response = result.response.text();

        console.log("🤖 Sent Response");
        res.json({ text: response });
    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
