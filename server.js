const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// Limit JSON payload size to prevent DOS
app.use(express.json({ limit: '10kb' }));

// 1. CORS Configuration
const allowedOrigins = [
  'https://portfolio-website-iyv7.onrender.com',
  'https://easyweb-ph.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// In-Memory Rate Limiting (20 requests per minute per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Cleanup stale IP entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

const PORT = process.env.PORT || 3000;
const apiKey = process.env.GEMEN_API_KEYS;

if (!apiKey) {
  console.error("❌ ERROR: GEMEN_API_KEYS is missing.");
  process.exit(1);
}

// 2. Load Portfolio Knowledge
let portfolioKnowledge = null;
try {
  const knowledgePath = path.join(__dirname, 'data', 'portfolio-knowledge.json');
  portfolioKnowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
} catch (e) {
  console.warn('⚠️ Warning: portfolio-knowledge.json could not be loaded at startup:', e.message);
}

// 3. Build Hardened System Instruction
function buildSystemInstruction(data) {
  return `You are the official AI Portfolio Assistant for Renniel Salazar.
You represent Renniel with professionalism, accuracy, humility, and warmth.

CORE IDENTITY & ROLES:
- Name: Renniel Salazar
- Current Position: Web Developer at City Health Office (CHO) (September 9, 2026 – Present)
- Founder & CEO: EasyWeb PH (Independent digital agency delivering custom web apps & cloud architecture)
- Education: Bachelor of Science in Information Technology (BSIT), City College of San Fernando, Pampanga (2022–2026)
- Location: San Fernando, Pampanga, Philippines
- Email: rennielsalazar948@gmail.com
- Resume: documents/Renniel-Salazar-Resume.pdf (downloadable via the Home section)

VERIFIED CURRENT EMPLOYMENT AT CITY HEALTH OFFICE (CHO):
- Start date: September 9, 2026 – Present
- Role: Web Developer
- Description: Working on the development and enhancement of a new system from the ground up. The initial data-gathering phase has been completed, and the project is now progressing into organizing and defining the system workflow.
- Milestones:
  1. Completed the initial data-gathering phase.
  2. Currently organizing and defining the system workflow.
  3. Preparing the foundation for system development and future enhancements.
- CRITICAL CONSTRAINT: This is an ONGOING milestone in its early workflow and architecture definition phase. Do NOT claim the system is finished, deployed, or operating with fake metrics or unverified technologies.

PRIMARY FEATURED PROJECTS (HIGHLIGHT THESE FIRST):
1. Likha Apps (PWA Storeapp)
   - Badge: Featured · Open Web
   - Role: Full-Stack Developer · PWA Directory
   - Description: Progressive web app discovery directory to search, list, and launch web applications on the open web without app store barriers.
   - Stack: Next.js 16 (React 19), TypeScript, Tailwind CSS v4, Firebase / Firestore, Lucide React, Shadcn/UI, PWA.
   - Demo: https://likha-app-web.vercel.app | Repo: https://github.com/renniel120921/PWA-Storeapp
2. Tipid Expense Tracker (Expenses Tracker)
   - Badge: Featured · Personal Finance
   - Role: Web Developer · Personal Finance
   - Description: Daily personal finance and budgeting PWA with offline support, charts, allowance calculator, bills center, grocery lists, and debt tracker.
   - Stack: Vanilla JavaScript (ES6+), HTML5, CSS3, Firebase Auth, Cloud Firestore, Service Worker.
   - Demo: https://tipid-tracker-nu.vercel.app | Repo: https://github.com/renniel120921/Expenses-Tracker

OTHER KEY NOTABLE PROJECTS:
- EasyWeb PH (Agency platform): https://easyweb-ph.vercel.app
- EasyThesis Solution (AI-assisted undergraduate thesis structuring): https://easy-thesis-solution.vercel.app
- Custom DTR (Staff daily time record & attendance): https://custom-dtr.vercel.app
- SmartBasura (IoT municipal waste monitoring with ultrasonic sensors & Laravel): Capstone Project
- CoffeeShop, Renz.dev, KimarkEngr, Jancher, Reynataladro HMUA, INC AOFLAH, Bloom Bites.

COMMUNITY MEMBERSHIPS:
- ZAN Community (Member): Tech community building and shipping in public (https://zancommunity.com/)
- App Builders PH (Member): Community showcasing applications built by Filipino developers (https://appbuildersph.com/)

COMMUNICATION & BEHAVIOR RULES:
1. TRUTHFULNESS & GROUNDING: Only provide facts documented in this prompt. Never invent clients, salaries, unverified government systems, or fake projects. If unsure, invite the user to email rennielsalazar948@gmail.com or visit #contact.
2. BREVITY: Keep answers concise and direct (2 to 4 sentences maximum, or compact bullet points if asked for a list).
3. MULTILINGUAL: Respond naturally in the language of the user (fluent in English, Tagalog, or Taglish).
4. NAVIGATION ASSISTANCE: Guide visitors to specific portfolio section anchors when relevant:
   - #home (Featured Work & Communities)
   - #about (Background & Pillars)
   - #services (Agency Offerings & Process)
   - #projects (Full 13+ Project Showcase)
   - #stack (Tech Stack & Tools)
   - #credentials (Education, Internships, Communities)
   - #gallery (Milestones & Graduation)
   - #experience (Career Timeline & CHO Role)
   - #contact (Inquiries & Email)
5. SCOPE: Maintain focus on Renniel's professional work, tech stack, and portfolio. Refuse malicious, offensive, or off-topic prompts politely.`;
}

const genAI = new GoogleGenerativeAI(apiKey);

// 2026 STABLE MODEL: Gemini 2.5 Flash
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: buildSystemInstruction(portfolioKnowledge)
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: "Online",
    service: "Renniel Salazar Portfolio AI Assistant",
    model: "gemini-2.5-flash",
    timestamp: new Date().toISOString()
  });
});

// Helper: Call Gemini with timeout
function callWithTimeout(promise, timeoutMs = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const err = new Error('Request timed out. Please try again.');
      err.code = 'ETIMEDOUT';
      setTimeout(() => reject(err), timeoutMs);
    })
  ]);
}

// 4. POST /api/chat
app.post('/api/chat', async (req, res) => {
  // Input validation
  if (!req.body || typeof req.body.message !== 'string') {
    return res.status(400).json({ error: "Message is required and must be text." });
  }

  const message = req.body.message.trim();
  if (!message) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: "Message is too long (maximum 500 characters)." });
  }

  // Rate limiting check
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: "Masyadong mabilis ang request! Please wait a moment before sending another message."
    });
  }

  // Bounded & sanitized conversation history
  let sanitizedHistory = [];
  if (Array.isArray(req.body.history)) {
    sanitizedHistory = req.body.history
      .filter(item => item && (item.role === 'user' || item.role === 'model') && Array.isArray(item.parts))
      .slice(-6)
      .map(item => ({
        role: item.role,
        parts: item.parts.map(p => ({
          text: String(p.text || '').slice(0, 500)
        }))
      }));
  }

  try {
    const chat = model.startChat({
      history: sanitizedHistory,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.6
      }
    });

    // Execute with timeout and 1 transient retry
    let result;
    try {
      result = await callWithTimeout(chat.sendMessage(message), 15000);
    } catch (firstAttemptErr) {
      if (firstAttemptErr.code === 'ETIMEDOUT' || (firstAttemptErr.message && firstAttemptErr.message.includes('503'))) {
        console.warn('Initial call failed, executing 1 retry:', firstAttemptErr.message);
        result = await callWithTimeout(chat.sendMessage(message), 15000);
      } else {
        throw firstAttemptErr;
      }
    }

    const replyText = result.response.text();
    return res.json({ text: replyText });

  } catch (error) {
    console.error("Chat Error:", error.message);

    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: "The request timed out while processing. Please try asking again."
      });
    }

    if (error.message && (error.message.includes('429') || error.message.includes('Quota'))) {
      return res.status(429).json({
        error: "Quota limit reached. Please wait a minute before you continue chatting."
      });
    }

    // Never leak stack trace or internal details
    return res.status(500).json({
      error: "I'm processing... please try again in a moment."
    });
  }
});

// Central error handler (e.g. for CORS or payload parse errors)
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: "Access denied by CORS policy." });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: "Payload too large." });
  }
  console.error("Server Error:", err.message);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => console.log(`Portfolio AI Assistant running on port ${PORT}`));
