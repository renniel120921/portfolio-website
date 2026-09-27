# Project Map: Renniel Salazar Portfolio & EasyWeb PH
# Project Map: Renz.dev — Human-Centered Systems Lab

## 1. Project Overview
- **Purpose**: Minimalist, Apple Human Interface Guidelines-inspired personal portfolio and agency showcase (EasyWeb PH) for Renniel Salazar, Web Developer at City Health Office (CHO) and Founder & CEO of EasyWeb PH.
- **Main Technology Stack**:
  - **Frontend**: Vanilla HTML5 (`index.html`), External Modular CSS3 (`styles.css`), Vanilla JavaScript (`script.js`), Font Awesome 6.
- **Brand & Identity**: **Renz.dev — Human-Centered Systems Lab** by Renniel Salazar.
- **Headline**: *"I build digital systems made for real people."*
- **Design Language**: Apple Human Interface Guidelines (HIG)-inspired light mode aesthetic (`#F5F5F7` background, `#FFFFFF` surfaces, `#007AFF` accent, `#1D1D1F` text, `#6E6E73` secondary, system font stack, restrained shadows, 18–20px card radii, 8px spacing grid).
- **Core Technology Stack**:
  - **Frontend**: Semantic HTML5 (`index.html`), Apple HIG CSS3 design system (`styles.css`), Vanilla ES6+ JavaScript (`script.js`), Font Awesome 6.
  - **Backend**: Node.js, Express.js (`server.js`), Google Generative AI SDK (`@google/generative-ai` with Gemini 2.5 Flash), `cors`, `dotenv`.
  - **Knowledge Base**: Structured verified portfolio knowledge (`data/portfolio-knowledge.json`).
  - **Hosting/Deployment**: Frontend hosted via static deployment (e.g., Vercel); Backend API hosted on Render (`https://portfolio-website-iyv7.onrender.com`).
  - **Knowledge Base**: Structured grounded portfolio facts (`data/portfolio-knowledge.json`).
  - **Analytics**: Cookieless, privacy-friendly Vercel Web Analytics (`ANALYTICS_SETUP.md`).
  - **Hosting/Deployment**: Frontend on Vercel (`https://renzdev-portfolio.vercel.app/`); Backend API on Render (`https://portfolio-website-iyv7.onrender.com`).
- **Main Entry Points**:
  - Frontend: `index.html` (with `styles.css` & `script.js`)
  - Backend: `server.js`

---

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
├── ANALYTICS_SETUP.md  # Privacy architecture & Vercel Web Analytics setup guide
├── PROJECT_MAP.md      # Architecture guide and project location map
├── index.html          # Semantic single-page HTML layout containing 7 routes & dialogs
├── styles.css          # Design tokens, bento, spotlight, sheets, and responsive styles
├── script.js           # 7-route router, legacy aliases, OverlayManager, Spotlight, & AI client
├── server.js           # Express API server with rate limiting, CORS whitelist, & Gemini AI
├── package.json        # Node.js project manifest and backend runtime dependencies
├── package-lock.json   # NPM dependency lockfile ensuring reproducible dependency tree
├── .env                # Environment variables (GEMEN_API_KEYS, PORT) - do not expose
├── .gitattributes      # Git line-ending normalization rules
└── PROJECT_MAP.md      # Architecture guide and project location map
└── .gitattributes      # Git line-ending normalization rules
```

---

## 3. Module Map

| Module/Feature | Purpose | Main Files | Related Files |
|---|---|---|---|
| Collapsible Sidebar Navigation | Collapsible desktop sidebar (280px expanded / 80px collapsed via `body.sidebar-collapsed`), accessible toggle (`#sidebar-toggle-btn`), floating tooltips, off-canvas mobile drawer, two-line role display (`Web Developer at City Health Office` / `Founder, EasyWeb PH`), and animated gliding capsule | `index.html`, `styles.css`, `script.js` | `images/black_shades.jpg` |
| Home Section (5-Module IA) | 1. Hero with nested Developer Community pills (ZAN Community, App Builders PH) & CTAs; 2. 3 Verified Metrics & compact Academic Achievement card (President’s Lister); 3. Featured Work (Likha Apps & Tipid App with mascot); 4. Currently Building at CHO (3-step workflow track); 5. Final Client CTA banner | `index.html` | `images/tipid_mascot_full.png`, `images/likha-app.png`, `images/zan-community.png`, `images/app-builders.png`, `styles.css` |
| About Section | Professional background, philosophy, strengths, CHO Web Developer role, and EasyWeb PH agency introduction | `index.html` | `styles.css` |
| Services & Process | 6 structured service cards (Problem, Deliverable, Ideal Client, Support) and 4-phase engineering methodology | `index.html` | `styles.css` |
| Selected Projects | Complete verified project cards with Likha Apps and Tipid App (official mascot) positioned first, followed by EasyWeb PH, EasyThesis Solution, Custom DTR, etc. | `index.html` | `images/tipid_mascot_full.png`, `images/likha-app.png`, `images/easy-thesis.png`, `styles.css` |
| Tech Stack & Tools | Grouped technical proficiency cards (Languages, Frameworks, Databases, IoT, Security) | `index.html` | `styles.css` |
| Credentials & Recognitions | Verified credentials, education, President’s Lister academic honor (City College of San Fernando), DTI placement, and Developer Communities cards with official logos | `index.html` | `images/zan-community.png`, `images/app-builders.png`, `styles.css` |
| Gallery & Lightbox | Responsive media archive of milestone photos with accessible touch/keyboard modal viewer | `index.html`, `script.js` | `images/*.jpg`, `images/*.png`, `styles.css` |
| Career Experience | Chronological career timeline with Web Developer at City Health Office (CHO) (Sept 9, 2026 – Present) and DTI engineering internship | `index.html` | `styles.css` |
| Testimonials | Verified endorsements from SME clients, academic advisers, and engineering peers | `index.html` | `styles.css` |
| Contact & Verification | Start a Project conversion panel, direct email CTA, verified roles, and accessible FAQ accordion | `index.html`, `script.js` | `styles.css` |
| AI Chatbot Client | Restyled floating chat assistant with prompt chips, new conversation reset, timeout abort handling, retry action, and XSS-safe DOM rendering | `index.html`, `script.js` | `styles.css`, `server.js` |
| AI Chatbot Backend | Hardened Express server with portfolio knowledge grounding, input validation, 20 req/min rate limiting, CORS whitelist, and sanitized error responses | `server.js` | `data/portfolio-knowledge.json`, `package.json`, `.env` |
| Collapsible Sidebar Navigation | 7 primary destinations (`#home`, `#work`, `#lab`, `#services`, `#journey`, `#about`, `#contact`), collapsible desktop sidebar (280px / 80px), floating accessible tooltips, off-canvas mobile drawer, two-line role display (`Web Developer at City Health Office` / `Founder, EasyWeb PH`), and gliding capsule indicator | `index.html`, `styles.css`, `script.js` | `images/black_shades.jpg` |
| OverlayManager | Centralized modal coordinator managing focus trapping, topmost Escape handling, body scroll locking, and trigger focus return across Spotlight, case studies, lightbox, mobile drawer, and chatbot | `script.js` | `styles.css` |
| Spotlight AI Navigator | Keyboard-accessible (`⌘ K` / `Ctrl + K`) centered command palette with fuzzy search across sections, case studies, quick actions, and single-source natural language question handoff to AI Assistant | `index.html`, `styles.css`, `script.js` | `server.js` |
| Home Section (`#home`) | Restructured sequence: 1. Hero with dual role pills & active community memberships; 2. Spotlight trigger bar (`⌘ K`); 3. Compact Proof Bento (3 numeric metrics, President's Lister, CHO role, EasyWeb PH); 4. Featured Systems (Likha Apps & Tipid App with mascot); 5. Systems Lab / CHO Workflow preview; 6. Services preview; 7. Final Client CTA banner | `index.html` | `images/tipid_mascot_full.png`, `images/likha-app.png`, `styles.css` |
| Work & Case Studies (`#work`) | Featured Case Study cards + Interactive modal sheets for Likha Apps & Tipid App (with verified architecture flows) + Filterable Project Archive (8 category pills, initial 6 pagination, "Show More" expansion) + Milestones & Photographic Gallery with Lightbox | `index.html`, `styles.css`, `script.js` | `images/*.jpg`, `images/*.png` |
| Systems Lab (`#lab`) | Public-safe CHO ground-up workflow milestones (Data Gathering completed, Workflow Organization completed, System Development in progress) + 7 categorized technical competencies + Chronological Public Build Log | `index.html`, `styles.css` | `styles.css` |
| Services & Process (`#services`) | 6 structured service cards (Web Apps, Frontend, APIs, IoT, DevOps, Databases) + 4-phase Engineering Lifecycle (Discovery, Architecture, Engineering, Deploy & Scale) | `index.html` | `styles.css` |
| Engineering Journey (`#journey`) | Career Experience timeline (CHO, DTI Region 3, EasyWeb PH, City College SF, Freelance) + Accreditations (President's Lister 2nd Sem A.Y. 2025–2026, DTI Placement, BSIT Degree, SmartBasura Lead) + Developer Communities + Peer/Client Endorsements | `index.html` | `styles.css`, `images/zan-community.png`, `images/app-builders.png` |
| About Me (`#about`) | Background & philosophy, systems engineering approach, EasyWeb PH agency foundation, and 4 capability pillars | `index.html` | `styles.css` |
| Contact & Inquiries (`#contact`) | Start a Project conversion panel, direct channels & verified roles, accessible FAQ accordion, and privacy-friendly analytics commitment notice | `index.html`, `script.js` | `styles.css` |
| AI Chatbot Client | Floating assistant with prompt chips, cold-start handling, retry actions, conversation reset, and XSS-safe DOM formatting. Single authoritative client used by both floating drawer and Spotlight queries | `index.html`, `script.js` | `styles.css`, `server.js` |
| AI Chatbot Backend | Hardened Express server with grounded JSON knowledge, input validation, 20 req/min rate limiting, CORS whitelist, and sanitized error responses | `server.js` | `data/portfolio-knowledge.json`, `package.json`, `.env` |
| Visitor Analytics | Cookieless, privacy-friendly Vercel Web Analytics integration with safe custom event dispatcher | `index.html`, `script.js`, `ANALYTICS_SETUP.md` | `ANALYTICS_SETUP.md` |

---

## 4. Routes and Pages

| Route/Page | Main File | Related Component or Data Source |
| Route/Page | Main File | Purpose & Behavior |
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
| `#home` | `index.html` | Hero, Spotlight trigger, Proof Bento, Featured Systems, CHO Preview, Services Preview, Project CTA |
| `#work` | `index.html` | Featured Systems, Case Study modal sheets, Filterable Project Archive, Milestones Gallery & Lightbox |
| `#lab` | `index.html` | CHO Ground-Up Workflow Architecture, 7 Categorized Technical Capabilities, Public Build Log |
| `#services` | `index.html` | 6 service cards with Problem, Deliverable, Client, Support fields + 4-phase delivery process |
| `#journey` | `index.html` | Career Experience timeline, Accreditations & President's Lister, Communities, Endorsements |
| `#about` | `index.html` | Personal profile, engineering philosophy, EasyWeb PH background, 4 pillars |
| `#contact` | `index.html` | Start a Project panel, direct channels, accessible FAQ accordion, Privacy commitment |
| Legacy Hash: `#projects` | `script.js` | Seamlessly aliased to `#work` without page reloads or broken links |
| Legacy Hash: `#gallery` | `script.js` | Seamlessly aliased to `#work` without page reloads or broken links |
| Legacy Hash: `#stack` | `script.js` | Seamlessly aliased to `#lab` without page reloads or broken links |
| Legacy Hash: `#credentials` | `script.js` | Seamlessly aliased to `#journey` without page reloads or broken links |
| Legacy Hash: `#experience` | `script.js` | Seamlessly aliased to `#journey` without page reloads or broken links |
| Legacy Hash: `#testimonials` | `script.js` | Seamlessly aliased to `#journey` without page reloads or broken links |
| Backend Health (`GET /api/health`) | `server.js` | Returns `{ status: "ok" }` for cold-start health monitoring |
| AI Chat Completion (`POST /api/chat`) | `server.js` | Validates input, checks rate limits, queries Gemini 2.5 Flash with grounded knowledge |

---

## 5. Where to Make Changes

| Requested Update | Primary File(s) | Other Files to Check |
|---|---|---|
| Personal information (Name, Title, Bio) | `index.html` (`#home`, `#about`) | `data/portfolio-knowledge.json`, `server.js` (systemInstruction) |
| Personal information (Name, Title, Bio) | `index.html` (`#home`, `#about`) | `data/portfolio-knowledge.json`, `server.js` |
| AI Assistant Knowledge / Grounding | `data/portfolio-knowledge.json` | `server.js` (systemInstruction builder) |
| Resume document | `documents/Renniel-Salazar-Resume.pdf` (replace file) | `index.html` (`#home` CTA button) |
| Profile image | `images/` (replace asset file) | `index.html` (`.sidebar-profile`, `#home`) |
| Portfolio projects & order | `index.html` (`#projects`) | `data/portfolio-knowledge.json`, `images/` |
| Skills & Tech Stack | `index.html` (`#stack`) | `styles.css` (`.stack-chip`), `data/portfolio-knowledge.json` |
| Navigation items | `index.html` (`.sidebar-nav`) | `script.js` (`VALID_SECTIONS`, `SECTION_TITLES`), `styles.css` |
| Resume document | `documents/Renniel-Salazar-Resume.pdf` | `index.html` (CTA links) |
| Profile image | `images/` (replace asset file) | `index.html` (`.sidebar-profile`, `#home`, mobile header) |
| Portfolio projects & case studies | `index.html` (`#work`, modal sheets) | `data/portfolio-knowledge.json`, `script.js` |
| Skills & Technical Capabilities | `index.html` (`#lab`) | `styles.css` (`.stack-chip`), `data/portfolio-knowledge.json` |
| Navigation items & aliases | `index.html` (`.sidebar-nav`) | `script.js` (`VALID_SECTIONS`, `LEGACY_HASH_MAP`), `styles.css` |
| Contact details & links | `index.html` (`#contact`, `.sidebar-footer`) | `data/portfolio-knowledge.json` |
| Colors, typography & spacing | `styles.css` (`:root` tokens) | None |
| Colors, typography & design tokens | `styles.css` (`:root` tokens) | None |
| Responsive layout & breakpoints | `styles.css` (`@media` rules) | None |
| SEO metadata & page title | `index.html` (`<head>`) | `script.js` (`SECTION_TITLES`) |
| Developer Communities | `index.html` (`#home`, `#credentials`) | `styles.css` (`.home-communities-wrap`, `.community-card`) |
| AI Chatbot endpoint / URL | `script.js` (`API_ENDPOINT`) | `server.js` (`PORT`, routes) |
| SEO metadata & dynamic document title | `index.html` (`<head>`) | `script.js` (`SECTION_TITLES`) |
| Analytics telemetry & events | `script.js` (`trackEvent`), `ANALYTICS_SETUP.md` | `index.html` (`<head>`) |
| AI Chatbot endpoint / URL | `script.js` (`BACKEND_BASE_URL`) | `server.js` (`PORT`, routes) |

---

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
- **Zero Invented Facts**: Strictly grounded in verified credentials, projects, and roles.
- **Apple HIG Design**: Clean `#F5F5F7` background, `#FFFFFF` rounded surface cards, `#007AFF` accent, restrained 2px hover lifts, 180–260ms transitions, and complete reduced motion overrides.
- **Single Source of Truth for AI**: Floating chat assistant and Spotlight modal queries share the exact same authoritative AI request client (`handleSendMessage()`), eliminating state desynchronization.
- **Accessible Overlays**: Every modal/sheet/drawer uses `OverlayManager` to ensure focus trapping, escape dismissal, body scroll locking, and return of focus to opening triggers.
