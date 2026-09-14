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

console.log('--- VALIDATING PHASE 2 IMPLEMENTATION ---');

// 1. Validate Syntax
try {
  execSync(`node -c "${path.join(root, 'server.js')}"`);
  console.log('✅ PASS: server.js has valid JavaScript syntax.');
} catch (e) {
  assert(false, `server.js syntax error: ${e.message}`);
}

try {
  execSync(`node -c "${path.join(root, 'script.js')}"`);
  console.log('✅ PASS: script.js has valid JavaScript syntax.');
} catch (e) {
  assert(false, `script.js syntax error: ${e.message}`);
}

// 2. Validate portfolio-knowledge.json
const knowledgePath = path.join(root, 'data', 'portfolio-knowledge.json');
assert(fs.existsSync(knowledgePath), 'data/portfolio-knowledge.json exists');
if (fs.existsSync(knowledgePath)) {
  const knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
  assert(knowledge.profile && knowledge.profile.name === 'Renniel Salazar', 'Knowledge profile contains Renniel Salazar');
  assert(knowledge.currentRole && knowledge.currentRole.organization.includes('City Health Office'), 'Current role specifies City Health Office (CHO)');
  assert(knowledge.currentRole.displayDate === 'September 9, 2026 – Present', 'CHO display date is September 9, 2026 – Present');
  assert(Array.isArray(knowledge.featuredProjects) && knowledge.featuredProjects.length >= 2, 'Featured projects array has >= 2 items');
  assert(knowledge.featuredProjects[0].name.includes('Likha Apps'), 'First featured project is Likha Apps');
  assert(knowledge.featuredProjects[1].name.includes('Tipid Expense Tracker'), 'Second featured project is Tipid Expense Tracker');
  assert(Array.isArray(knowledge.developerCommunities) && knowledge.developerCommunities.length >= 2, 'Developer communities array has >= 2 items');
}

// 3. Validate server.js contents
const serverContent = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
assert(serverContent.includes('process.env.GEMEN_API_KEYS'), 'server.js preserves GEMEN_API_KEYS env variable');
assert(serverContent.includes('"gemini-2.5-flash"'), 'server.js uses gemini-2.5-flash model');
assert(serverContent.includes('portfolio-knowledge.json'), 'server.js references portfolio-knowledge.json');
assert(serverContent.includes('checkRateLimit'), 'server.js includes in-memory rate limiting');
assert(serverContent.includes('allowedOrigins'), 'server.js configures CORS whitelist');
assert(serverContent.includes('portfolio-website-iyv7.onrender.com'), 'server.js allows production domain');
assert(serverContent.includes('message.length > 500'), 'server.js enforces 500 max character limit on message');
assert(serverContent.includes('slice(-6)'), 'server.js enforces bounded conversation history');
assert(serverContent.includes('callWithTimeout'), 'server.js includes request timeout mechanism');
assert(serverContent.includes('ETIMEDOUT') && serverContent.includes('status(504)'), 'server.js handles 504 timeout status');
assert(serverContent.includes('status(429)'), 'server.js handles 429 quota/rate limit status');
assert(!serverContent.includes('error.stack'), 'server.js never leaks stack traces');

// 4. Validate index.html contents
const htmlContent = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(htmlContent.includes('id="chat-reset"'), 'index.html includes #chat-reset button');
assert(htmlContent.includes('id="chat-chips"'), 'index.html includes #chat-chips container');
assert(htmlContent.includes('data-query="What are your featured projects?"'), 'index.html includes featured projects prompt chip');
assert(htmlContent.includes('data-query="What is your current role at City Health Office?"'), 'index.html includes role at CHO prompt chip');
assert(htmlContent.includes('id="chat-char-count"'), 'index.html includes #chat-char-count element');
assert(htmlContent.includes('maxlength="500"'), 'index.html sets maxlength="500" on chat input');
assert(htmlContent.includes('aria-live="polite"'), 'index.html sets aria-live="polite" on chat messages');

// 5. Validate styles.css contents
const cssContent = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert(cssContent.includes('.chat-reset-btn'), 'styles.css defines .chat-reset-btn');
assert(cssContent.includes('.chat-chips'), 'styles.css defines .chat-chips');
assert(cssContent.includes('.chat-chip'), 'styles.css defines .chat-chip');
assert(cssContent.includes('.chat-char-count'), 'styles.css defines .chat-char-count');
assert(cssContent.includes('.chat-retry-btn'), 'styles.css defines .chat-retry-btn');
assert(cssContent.includes('.chat-bubble .chat-link'), 'styles.css defines .chat-link styling');

// 6. Validate script.js contents
const scriptContent = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
assert(scriptContent.includes('formatSafeContent'), 'script.js includes formatSafeContent safe renderer');
assert(scriptContent.includes('AbortController'), 'script.js includes AbortController for timeouts');
assert(scriptContent.includes('activeAbortController'), 'script.js tracks activeAbortController');
assert(scriptContent.includes('chatReset.addEventListener'), 'script.js wires chat reset event listener');
assert(scriptContent.includes('chat-retry-btn'), 'script.js supports retry button callback');
assert(scriptContent.includes('chat-chip'), 'script.js wires prompt chips');
assert(scriptContent.includes('chatSendBtn.disabled'), 'script.js manages send button disabled state');

if (errors.length > 0) {
  console.error(`\n❌ Completed with ${errors.length} error(s).`);
  process.exit(1);
} else {
  console.log('\n🎉 ALL PHASE 2 VALIDATION CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}

