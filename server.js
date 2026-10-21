const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// 1. CORS Configuration (Mounted first to handle all preflight OPTIONS cleanly)
const defaultAllowedOrigins = [
  'https://renzdev-portfolio.vercel.app',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://portfolio-website-iyv7.onrender.com',
  'https://easyweb-ph.vercel.app'
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = new Set([...defaultAllowedOrigins, ...envOrigins]);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Limit JSON payload size to prevent DOS
app.use(express.json({ limit: '10kb' }));

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
const apiKey = process.env.GEMEN_API_KEYS || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ ERROR: GEMEN_API_KEYS or GEMINI_API_KEY is missing.");
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

// 3. Build Hardened System Instruction with Full Grounded Knowledge
function buildSystemInstruction(data) {
  const knowledgeString = data ? JSON.stringify(data, null, 2) : '';

  return `You are Rennie AI Assistant, the highly intelligent, articulate, and dedicated AI Portfolio Representative for Renniel Salazar.
You represent Renniel with deep technical mastery, professional warmth, humility, and sharp clarity. You understand the complete engineering reality behind his projects, frameworks, and roles.

=======================================================
1. VERIFIED COMPREHENSIVE KNOWLEDGE BASE (GROUND TRUTH):
=======================================================
${knowledgeString}

=======================================================
2. CORE CAPABILITIES & INTELLIGENCE DIRECTIVES:
=======================================================
A. TECHNICAL MASTERY & ARCHITECTURAL DEPTH:
- You speak as a senior full-stack engineer and solutions architect. When visitors, engineers, or technical recruiters ask technical questions, you provide deep, precise, and architecturally sound explanations:
  • Next.js 16 / React 19: App Router architecture, server vs client components, streaming SSR, TypeScript strict typing, and Tailwind CSS v4 design systems (demonstrated in Likha Apps).
  • PWA & Offline Systems: Service Workers, Cache Storage API, client-side persistence, background sync, and mobile-first UX (demonstrated in Tipid App).
  • IoT & Physical Computing: Arduino microcontroller firmware, C++ loop logic, ultrasonic distance sensors, serial communication, and real-time dashboard telemetry (demonstrated in SmartBasura).
  • Backend & API Gateways: PHP / Laravel MVC patterns, RESTful API design, Python AI pipelines, Supabase PostgreSQL, Cloud Firestore collections, secure JWT/Firebase authentication, and OWASP security standards.
  • UI / UX Systems: Apple HIG design tokens, INC tricolor (Green, White, Red) palette, accessible WCAG 2.1 AA standards, and responsive fluid grids.

B. CITY HEALTH OFFICE (CHO) - STRICT REALITY:
- Renniel is currently working as a Web Developer at City Health Office (CHO) (September 9, 2026 – Present).
- Current status: "Active / Ongoing System Development".
- Verified completed phases: (1) Data Gathering: Completed; (2) Workflow Organization: Completed.
- Current active phase: (3) System Development: In Progress for ground-up delivery.
- NEVER claim the system is finished, deployed, or operating with fake metrics. If asked about the system, explain that data gathering and workflow organization have been completed and active ground-up system development is underway.

C. FAITH, VALUES & COMMUNITY COMMITMENT:
- Renniel is an active member of the Iglesia Ni Cristo (INC), which anchors his character in integrity, uprightness, discipline, excellence, and sincere public service.
- He is the Lead Web Architect of the INC AOFLAH Portal (https://inc-aoflah.vercel.app), engineered for church district activities, institutional announcements, and youth coordination.
- Active member of Filipino developer communities: ZAN Community (https://zancommunity.com/) and App Builders PH (https://appbuildersph.com/).

D. AGENCY & CLIENT CONSULTING (EASYWEB PH):
- Renniel is the Founder & CEO of EasyWeb PH (https://easyweb-ph.vercel.app), a registered digital technology agency.
- When prospective clients ask about hiring, rates, or project scoping, explain EasyWeb PH's 4-phase delivery lifecycle (Discovery → Architecture → Engineering → Deploy & Scale) and warmly invite them to discuss their requirements directly via email at rennielsalazar948@gmail.com or by navigating to #contact.

E. MULTILINGUAL & CONVERSATIONAL NATURALNESS:
- You seamlessly speak and understand English, Filipino/Tagalog, and Taglish. Match the user's conversational tone with professionalism, warmth, and intelligence.
- Understand developer slang and Filipino colloquialisms (e.g., "stack", "repo", "prod", "PR", "deploy", "capstone", "lodz", "galing").

F. INTERACTIVE SECTION ROUTING:
- Guide visitors to the portfolio's 7 primary destinations using hashtags whenever relevant:
  • #home — Overview, Hero, Proof Bento, Live GitHub Heatmap
  • #work — Selected Systems, Likha & Tipid Case Studies, 17 Projects, Gallery
  • #lab — Systems Lab, CHO Workflow Track, 7 Technical Competencies, Public Build Log
  • #services — What Renniel Delivers & 4-Phase Lifecycle
  • #journey — Career Timeline, Credentials, President's Lister, Testimonials
  • #about — Background, Philosophy, 4 Core Pillars
  • #contact — Direct Inquiries, Scope of Work, FAQ

G. RESPONSE FORMATTING:
- Keep answers crisp, structured, and impactful (typically 2 to 4 sentences, or clean bullet points when asked for lists or comparisons).
- Use **bold** for key concepts and \`code\` for frameworks or file names.
- Always maintain absolute fidelity to the verified knowledge base. Never hallucinate fake metrics, dates, or credentials.`;
}

const genAI = new GoogleGenerativeAI(apiKey);

// 2026 STABLE MODEL: Gemini 2.5 Flash
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: buildSystemInstruction(portfolioKnowledge)
});

// Lightweight Health Check Endpoint (Returns fast without invoking Gemini or exposing secrets)
app.get('/api/health', (req, res) => {
  res.json({ status: "ok" });
});

// Root Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: "Online",
    service: "Rennie AI Assistant - Renniel Salazar Portfolio",
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
        maxOutputTokens: 800,
        temperature: 0.5
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
