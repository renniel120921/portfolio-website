# Project Map: Renniel Salazar Portfolio & EasyWeb PH

## 1. Project Overview
- **Purpose**: Minimalist, Apple Human Interface Guidelines-inspired personal portfolio and agency showcase (EasyWeb PH) for Renniel Salazar, Web Developer at City Health Office (CHO) and Founder & CEO of EasyWeb PH.
- **Main Technology Stack**:
  - **Frontend**: Vanilla HTML5 (`index.html`), External Modular CSS3 (`styles.css`), Vanilla JavaScript (`script.js`), Font Awesome 6.
  - **Backend**: Node.js, Express.js (`server.js`), Google Generative AI SDK (`@google/generative-ai` with Gemini 2.5 Flash), `cors`, `dotenv`.
  - **Knowledge Base**: Structured verified portfolio knowledge (`data/portfolio-knowledge.json`).
  - **Hosting/Deployment**: Frontend hosted via static deployment (e.g., Vercel); Backend API hosted on Render (`https://portfolio-website-iyv7.onrender.com`).
- **Main Entry Points**:
  - Frontend: `index.html` (with `styles.css` & `script.js`)
  - Backend: `server.js`

## 2. Important Folder Structure
```text
portfolio-website/
├── data/               # Grounded knowledge source (portfolio-knowledge.json)
├── documents/          # Verified downloadable documents (Renniel-Salazar-Resume.pdf)
├── images/             # Static media assets (project screenshots, logos, credentials)
│   ├── tipid_mascot_full.png # Official Tipid App mascot (290x431)
│   ├── easy-thesis.png # EasyThesis Solution preview
│   ├── likha-app.png   # Likha Apps (PWA Storeapp) preview
│   ├── zan-community.png # ZAN Community logo (152x62)
│   └── app-builders.png # App Builders PH logo (232x76)
├── index.html          # Semantic single-page HTML layout containing 10 view sections
├── styles.css          # Apple HIG-inspired design tokens, collapsible sidebar, and UI styles
├── script.js           # Hash router, collapsible desktop sidebar, drawer, lightbox, and AI chat client
├── server.js           # Express API server with rate limiting, CORS whitelist, & Gemini AI
├── package.json        # Node.js project manifest and backend runtime dependencies
├── package-lock.json   # NPM dependency lockfile ensuring reproducible dependency tree
├── .env                # Environment variables (GEMEN_API_KEYS, PORT) - do not expose
├── .gitattributes      # Git line-ending normalization rules
└── PROJECT_MAP.md      # Architecture guide and project location map
```

## 3. Module Map

| Module/Feature | Purpose | Main Files | Related Files |
|---|---|---|---|
| Collapsible Sidebar Navigation | Collapsible desktop sidebar (280px expanded / 80px collapsed via `body.sidebar-collapsed`), accessible toggle (`#sidebar-toggle-btn`), floating tooltips, off-canvas mobile drawer, two-line role display (`Web Developer at City Health Office` / `Founder, EasyWeb PH`), and animated gliding capsule | `index.html`, `styles.css`, `script.js` | `images/black_shades.jpg` |
| Home Section (5-Module IA) | 1. Hero with nested Developer Community pills (ZAN Community, App Builders PH) & CTAs; 2. 3 Verified Metrics; 3. Featured Work (Likha Apps & Tipid App with mascot); 4. Currently Building at CHO (3-step workflow track); 5. Final Client CTA banner | `index.html` | `images/tipid_mascot_full.png`, `images/likha-app.png`, `images/zan-community.png`, `images/app-builders.png`, `styles.css` |
| About Section | Professional background, philosophy, strengths, CHO Web Developer role, and EasyWeb PH agency introduction | `index.html` | `styles.css` |
| Services & Process | 6 structured service cards (Problem, Deliverable, Ideal Client, Support) and 4-phase engineering methodology | `index.html` | `styles.css` |
| Selected Projects | Complete verified project cards with Likha Apps and Tipid App (official mascot) positioned first, followed by EasyWeb PH, EasyThesis Solution, Custom DTR, etc. | `index.html` | `images/tipid_mascot_full.png`, `images/likha-app.png`, `images/easy-thesis.png`, `styles.css` |
| Tech Stack & Tools | Grouped technical proficiency cards (Languages, Frameworks, Databases, IoT, Security) | `index.html` | `styles.css` |
| Credentials & Recognitions | Verified credentials, education, DTI placement, and Developer Communities cards with official logos | `index.html` | `images/zan-community.png`, `images/app-builders.png`, `styles.css` |
| Gallery & Lightbox | Responsive media archive of milestone photos with accessible touch/keyboard modal viewer | `index.html`, `script.js` | `images/*.jpg`, `images/*.png`, `styles.css` |
| Career Experience | Chronological career timeline with Web Developer at City Health Office (CHO) (Sept 9, 2026 – Present) and DTI engineering internship | `index.html` | `styles.css` |
| Testimonials | Verified endorsements from SME clients, academic advisers, and engineering peers | `index.html` | `styles.css` |
| Contact & Verification | Start a Project conversion panel, direct email CTA, verified roles, and accessible FAQ accordion | `index.html`, `script.js` | `styles.css` |
| AI Chatbot Client | Restyled floating chat assistant with prompt chips, new conversation reset, timeout abort handling, retry action, and XSS-safe DOM rendering | `index.html`, `script.js` | `styles.css`, `server.js` |
| AI Chatbot Backend | Hardened Express server with portfolio knowledge grounding, input validation, 20 req/min rate limiting, CORS whitelist, and sanitized error responses | `server.js` | `data/portfolio-knowledge.json`, `package.json`, `.env` |

## 4. Routes and Pages

| Route/Page | Main File | Related Component or Data Source |
|---|---|---|
| SPA Root (`/` or `index.html`) | `index.html` | Renders `#home` by default and manages hash switching |
| `#home` | `index.html` | 5 Modules: Hero with community pills, 3 verified metrics, Featured Work (Likha Apps & Tipid App), Currently Building at CHO card, Final Client CTA |
| `#about` | `index.html` | Biography, CHO Web Developer role, EasyWeb PH overview, and 4 core capabilities |
| `#services` | `index.html` | 6 service cards with Problem, Deliverable, Client, and Support fields, plus 4-step engineering lifecycle |
| `#projects` | `index.html` | Full project showcase: Likha Apps (#1), Tipid App (#2), EasyWeb PH (#3), EasyThesis Solution (#4), etc. |
| `#stack` | `index.html` | 4 categorized skill groups and technology chips |
| `#credentials` | `index.html` | Certifications, academic honors, and Developer Communities subsection with ZAN Community & App Builders PH |
| `#gallery` | `index.html` | Photo grid with accessible Lightbox (`#lightbox`) |
| `#experience` | `index.html` | Chronological career timeline with Web Developer at City Health Office (CHO) (Sept 9, 2026 – Present) |
| `#testimonials` | `index.html` | 3 verified client, adviser, and peer quote cards |
| `#contact` | `index.html` | Start a Project panel, verified channels, and accessible FAQ accordion |
| Backend Health Check (`GET /`) | `server.js` | Returns JSON status `{ status: "Online", service: "...", model: "gemini-2.5-flash" }` |
| AI Chat Completion (`POST /api/chat`) | `server.js` | Validates input, checks rate limits, and queries Gemini 2.5 Flash with grounded knowledge |

## 5. Where to Make Changes

| Requested Update | Primary File(s) | Other Files to Check |
|---|---|---|
| Personal information (Name, Title, Bio) | `index.html` (`#home`, `#about`) | `data/portfolio-knowledge.json`, `server.js` (systemInstruction) |
| AI Assistant Knowledge / Grounding | `data/portfolio-knowledge.json` | `server.js` (systemInstruction builder) |
| Resume document | `documents/Renniel-Salazar-Resume.pdf` (replace file) | `index.html` (`#home` CTA button) |
| Profile image | `images/` (replace asset file) | `index.html` (`.sidebar-profile`, `#home`) |
| Portfolio projects & order | `index.html` (`#projects`) | `data/portfolio-knowledge.json`, `images/` |
| Skills & Tech Stack | `index.html` (`#stack`) | `styles.css` (`.stack-chip`), `data/portfolio-knowledge.json` |
| Navigation items | `index.html` (`.sidebar-nav`) | `script.js` (`VALID_SECTIONS`, `SECTION_TITLES`), `styles.css` |
| Contact details & links | `index.html` (`#contact`, `.sidebar-footer`) | `data/portfolio-knowledge.json` |
| Colors, typography & spacing | `styles.css` (`:root` tokens) | None |
| Responsive layout & breakpoints | `styles.css` (`@media` rules) | None |
| SEO metadata & page title | `index.html` (`<head>`) | `script.js` (`SECTION_TITLES`) |
| Developer Communities | `index.html` (`#home`, `#credentials`) | `styles.css` (`.home-communities-wrap`, `.community-card`) |
| AI Chatbot endpoint / URL | `script.js` (`API_ENDPOINT`) | `server.js` (`PORT`, routes) |

## 6. Key Conventions
- **Naming and file-placement patterns**:
  - Semantic HTML markup in `index.html`.
  - Reusable Apple HIG-inspired styling in `styles.css`.
  - Client-side navigation, drawer, lightbox, and chatbot logic in `script.js`.
  - Server-side verified knowledge base in `data/portfolio-knowledge.json`.
  - Static media files in `images/` with exact lowercase kebab-case naming.
  - Backend API server in `server.js` at root.
- **Styling approach**:
  - Apple HIG-inspired light palette (`#F5F5F7` background, `#1D1D1F` text, `#007AFF` accent).
  - Native system font stack (`-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, etc.).
  - Animated vertical selection capsule (`.nav-indicator`) gliding on `transform: translateY()`.
  - Responsive cards with subtle hover scale (`1.015` - `1.025`) and pressed states (`0.98`).
  - Safe mobile insets supported via `env(safe-area-inset-*)`.
  - Responsive layout architecture: CSS Grid tracks configured with `minmax(0, 1fr)` to prevent card and image blowouts; `overflow-x: clip;` on `html, body`; Option A mobile Hero grid areas (`roles -> portrait -> headline -> bio -> actions -> communities`); sticky `.mobile-header` constrained to 100% width with ellipsis branding and 44x44px touch target.
- **State/data-fetching approach**:
  - Hash-based client routing (`window.location.hash` and `hashchange`). Only the active section has `.active` class displayed. Synchronous `requestedRoute` and `renderedRoute` tracking prevents navigation race conditions.
  - View Transitions API integration uses `Promise.allSettled()` to cleanly absorb expected navigation `AbortError`s during rapid user switching while surfacing genuine programming errors.
  - Chat state maintained in-memory in `script.js`, passing bounded history (max 6 items) to `/api/chat`.
  - Client-side XSS safety: AI/user message content formatted via DOM text nodes and element builders (`formatSafeContent`), never raw `innerHTML`.
- **Important files that should not be edited manually**:
  - `package-lock.json` (auto-managed by npm).
  - `.env` (contains sensitive API keys `GEMEN_API_KEYS`; must never be committed or exposed).
  - `.gitattributes` (git normalization rules).

## 7. Quick Reference
- **Pages & Content location**: `index.html` (10 single-view sections)
- **Styles location**: `styles.css`
- **Client Logic & Routing**: `script.js`
- **Knowledge Base location**: `data/portfolio-knowledge.json`
- **Portfolio content location**: `index.html` (`#projects`, `#stack`, `#credentials`, `#gallery`, `#experience`)
- **API/backend location**: `server.js`
- **Verification scripts**: `scratch/validate_all.js`, `scratch/audit_all_sections.js`
