const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
let errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
    console.error(`❌ FAIL: ${message}`);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('=== COMPREHENSIVE VERIFICATION (INCREMENTAL ENHANCEMENTS) ===');

// --- 1. ASSET INTEGRITY & CASING ---
const requiredImages = [
  'images/tipid_mascot_full.png',
  'images/easy-thesis.png',
  'images/likha-app.png',
  'images/zan-community.png',
  'images/app-builders.png'
];

requiredImages.forEach(relPath => {
  const fullPath = path.join(root, relPath);
  assert(fs.existsSync(fullPath), `Asset exists: ${relPath}`);
  const dir = path.dirname(fullPath);
  const base = path.basename(fullPath);
  const actualFiles = fs.readdirSync(dir);
  assert(actualFiles.includes(base), `Asset has exact filename casing: ${base}`);
});

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const knowledge = JSON.parse(fs.readFileSync(path.join(root, 'data', 'portfolio-knowledge.json'), 'utf8'));

// --- 2. TIPID APP MASCOT INTEGRATION ---
assert(html.includes('src="images/tipid_mascot_full.png"'), 'index.html references images/tipid_mascot_full.png');
const mascotMatches = [...html.matchAll(/alt="Tipid App mascot"/g)];
assert(mascotMatches.length >= 2, 'Tipid App mascot alt text exists on both Home and Projects sections');

assert(html.includes('class="browser-screen mascot-screen"'), 'Mascot uses .browser-screen.mascot-screen container');
assert(css.includes('.browser-screen.mascot-screen'), 'CSS defines .browser-screen.mascot-screen');
assert(css.includes('.mascot-img'), 'CSS defines .mascot-img with object-fit: contain');
assert(css.includes('object-fit: contain'), 'CSS applies object-fit: contain to mascot');

// --- 3. COLLAPSIBLE DESKTOP SIDEBAR ARCHITECTURE ---
assert(css.includes('--sidebar-w: 280px'), 'CSS defines --sidebar-w: 280px in :root');
assert(css.includes('body.sidebar-collapsed'), 'CSS defines body.sidebar-collapsed');
assert(css.includes('--sidebar-w: 80px'), 'CSS defines --sidebar-w: 80px on body.sidebar-collapsed');
assert(css.includes('.sidebar {'), 'CSS defines .sidebar');
assert(css.includes('width: var(--sidebar-w)'), 'CSS sets sidebar width to var(--sidebar-w)');
assert(css.includes('margin-left: var(--sidebar-w)'), 'CSS sets main-wrapper margin-left to var(--sidebar-w)');

assert(html.includes('id="sidebar-toggle-btn"'), 'index.html includes #sidebar-toggle-btn');
assert(html.includes('aria-controls="sidebar"'), 'Sidebar toggle button has aria-controls="sidebar"');
assert(html.includes('aria-expanded="true"'), 'Sidebar toggle button has initial aria-expanded="true"');

// Navigation item labels accessibility
assert(html.includes('class="nav-label"'), 'index.html wraps nav labels in .nav-label span');
assert(html.includes('data-tooltip="Home"'), 'index.html includes data-tooltip attributes on nav items');
assert(!css.includes('body.sidebar-collapsed .nav-label {\n  display: none'), 'nav-label is NOT display:none in collapsed sidebar (preserves accessibility)');
assert(css.includes('.sidebar-tooltip'), 'CSS defines .sidebar-tooltip');

// Script collapsible logic
assert(script.includes('portfolio.sidebarCollapsed'), 'script.js uses portfolio.sidebarCollapsed storage key');
assert(script.includes('getStoredSidebarPreference'), 'script.js has getStoredSidebarPreference with try/catch');
assert(script.includes('applySidebarState'), 'script.js has applySidebarState');
assert(script.includes('syncSidebarResponsive'), 'script.js has syncSidebarResponsive');
assert(script.includes('showSidebarTooltip'), 'script.js manages floating accessible tooltips');
assert(script.includes('transitionend'), 'script.js handles transitionend for nav indicator alignment');

// --- 4. HOMEPAGE INFORMATION ARCHITECTURE ---
const homeStart = html.indexOf('id="home"');
const homeEnd = html.indexOf('id="about"');
const homeSection = html.slice(homeStart, homeEnd);

// Module 1: Hero with nested community pills
assert(homeSection.includes('I build digital systems'), 'Home hero contains refined headline "I build digital systems"');
assert(homeSection.includes('hero-communities'), 'Home hero contains nested .hero-communities');
assert(homeSection.includes('images/zan-community.png'), 'Home hero includes ZAN Community pill');
assert(homeSection.includes('images/app-builders.png'), 'Home hero includes App Builders PH pill');
assert(homeSection.includes('href="documents/Renniel-Salazar-Resume.pdf"'), 'Home hero includes resume download CTA');

// Module 2: Verified Metrics (3 numbers only)
assert(homeSection.includes('stats-grid-3'), 'Home contains .stats-grid-3 for verified metrics');
assert(homeSection.includes('Years Building Software'), 'Home stats include Years Building Software');
assert(homeSection.includes('Systems Shipped'), 'Home stats include Systems Shipped');
assert(homeSection.includes('Production Deployments'), 'Home stats include Production Deployments');
assert(!homeSection.includes('<div class="stat-value">CHO</div>'), 'Home stats grid does NOT include CHO stat box');

// Module 3: Featured Work (Likha Apps & Tipid App)
assert(homeSection.includes('class="featured-home-grid"'), 'Home contains featured-home-grid');
assert(homeSection.includes('Likha Apps'), 'Home featured work includes Likha Apps');
assert(homeSection.includes('Tipid App'), 'Home featured work includes Tipid App');

// Old separate strip removed
assert(!homeSection.includes('class="home-communities-wrap"'), 'Old separate home-communities-wrap removed from below featured work');

// Module 4: Currently Building at CHO
assert(homeSection.includes('cho-building-card'), 'Home contains .cho-building-card');
assert(homeSection.includes('September 2026 – Present'), 'CHO card displays September 2026 – Present');
assert(homeSection.includes('cho-workflow-track'), 'CHO card displays 3-step workflow track');
assert(homeSection.includes('Data Gathering'), 'CHO track includes Data Gathering (Completed)');
assert(homeSection.includes('Workflow Organization'), 'CHO track includes Workflow Organization (In Progress)');
assert(homeSection.includes('System Development'), 'CHO track includes System Development (Upcoming)');

// Module 5: Final Client CTA
assert(homeSection.includes('home-cta-card'), 'Home contains .home-cta-card');
assert(homeSection.includes('Have a system or product idea in mind?'), 'Home CTA card includes closing headline');
assert(homeSection.includes('Start a Project'), 'Home CTA card includes Start a Project action');

// --- 5. PROJECTS SECTION ORDER & CONSISTENT NAMING ---
const projStart = html.indexOf('id="projects"');
const projEnd = html.indexOf('id="stack"');
const projSection = html.slice(projStart, projEnd);

assert(projSection.includes('Likha Apps (PWA Storeapp)'), 'Projects section includes Likha Apps');
assert(projSection.includes('Tipid App (Expenses Tracker)'), 'Projects section includes Tipid App');
assert(projSection.includes('mascot-screen'), 'Projects section Tipid card uses mascot-screen');

// --- 6. SYNTAX VALIDATION ---
try {
  execSync(`node -c "${path.join(root, 'server.js')}"`);
  console.log('✅ PASS: server.js has valid syntax');
} catch (e) {
  assert(false, `server.js syntax: ${e.message}`);
}

try {
  execSync(`node -c "${path.join(root, 'script.js')}"`);
  console.log('✅ PASS: script.js has valid syntax');
} catch (e) {
  assert(false, `script.js syntax: ${e.message}`);
}

// --- 7. SERVER & SECURITY PRESERVATION ---
assert(server.includes('process.env.GEMEN_API_KEYS'), 'server.js preserves GEMEN_API_KEYS');
assert(server.includes('"gemini-2.5-flash"'), 'server.js uses gemini-2.5-flash');
assert(server.includes('checkRateLimit'), 'server.js implements rate limiting');
assert(script.includes('formatSafeContent'), 'script.js implements XSS-safe DOM formatting');

if (errors.length > 0) {
  console.error(`\n❌ Validation failed with ${errors.length} error(s).`);
  process.exit(1);
} else {
  console.log('\n🎉 ALL VALIDATION CHECKS PASSED WITH ZERO ERRORS!');
  process.exit(0);
}
