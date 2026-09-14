const fs = require('fs');

async function testLive() {
  console.log('=== VERIFYING LIVE SERVER & DOM INTEGRITY ===');

  // 1. Check HTTP response from Live Server
  const resHtml = await fetch('http://127.0.0.1:5500/index.html');
  console.log('GET http://127.0.0.1:5500/index.html status:', resHtml.status);
  const html = await resHtml.text();

  const resScript = await fetch('http://127.0.0.1:5500/script.js');
  console.log('GET http://127.0.0.1:5500/script.js status:', resScript.status);
  const script = await resScript.text();

  const resFavicon = await fetch('http://127.0.0.1:5500/favicon.svg');
  console.log('GET http://127.0.0.1:5500/favicon.svg status:', resFavicon.status);

  // 2. Exact Hero DOM counts in served index.html
  const homeStart = html.indexOf('id="home"');
  const homeEnd = html.indexOf('id="about"');
  const homeSection = html.slice(homeStart, homeEnd);

  const heroCardCount = (homeSection.match(/class="hero-card"/g) || []).length;
  const heroPillsCount = (homeSection.match(/class="hero-trust-pills"/g) || []).length;
  const heroPillCount = (homeSection.match(/class="hero-trust-pill"/g) || []).length;
  const heroPortraitCount = (homeSection.match(/class="hero-portrait-wrap"/g) || []).length;
  const heroLeadCount = (homeSection.match(/class="hero-lead"/g) || []).length;
  const heroBioCount = (homeSection.match(/class="hero-bio"/g) || []).length;
  const heroCommCount = (homeSection.match(/class="hero-communities"/g) || []).length;
  const heroTextCount = (homeSection.match(/class="hero-text"/g) || []).length;

  console.log('\n--- Hero Component Counts in Live index.html ---');
  console.log('hero-card:', heroCardCount, '(expected: 1)', heroCardCount === 1 ? '✅' : '❌');
  console.log('hero-trust-pills:', heroPillsCount, '(expected: 1)', heroPillsCount === 1 ? '✅' : '❌');
  console.log('hero-trust-pill:', heroPillCount, '(expected: 2)', heroPillCount === 2 ? '✅' : '❌');
  console.log('hero-portrait-wrap:', heroPortraitCount, '(expected: 1)', heroPortraitCount === 1 ? '✅' : '❌');
  console.log('hero-lead:', heroLeadCount, '(expected: 1)', heroLeadCount === 1 ? '✅' : '❌');
  console.log('hero-bio:', heroBioCount, '(expected: 1)', heroBioCount === 1 ? '✅' : '❌');
  console.log('hero-communities:', heroCommCount, '(expected: 1)', heroCommCount === 1 ? '✅' : '❌');
  console.log('hero-text (obsolete):', heroTextCount, '(expected: 0)', heroTextCount === 0 ? '✅' : '❌');

  // Check script.js content
  console.log('\n--- Script.js Live Content Check ---');
  console.log('Contains requestedRoute:', script.includes('requestedRoute'), '✅');
  console.log('Contains Promise.allSettled:', script.includes('Promise.allSettled'), '✅');
  console.log('Does NOT contain unclosed else:', !script.includes('renderSection(targetSection);\n      const currentHash'), '✅');
}

testLive().catch(console.error);

