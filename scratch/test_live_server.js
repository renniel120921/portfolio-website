const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const liveUrl = 'http://127.0.0.1:5500/index.html#home';

async function getWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const pages = await res.json();
      const page = pages.find(p => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Could not connect to Chrome CDP page');
}

async function runLiveTests() {
  const port = 9290;
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-live-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--user-data-dir=${tmpProfile}`,
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  try {
    const wsUrl = await getWsUrl(port);
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    const consoleErrors = [];
    const network404s = [];
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        if (data.params.type === 'error') {
          const errText = data.params.args.map(a => a.value || a.description).join(' ');
          console.error('[Browser Console Error]:', errText);
          consoleErrors.push(errText);
        }
      }
      if (data.method === 'Runtime.exceptionThrown') {
        const details = data.params.exceptionDetails;
        const errText = `${details?.text} ${details?.exception?.description || ''} at ${details?.url}:${details?.lineNumber}:${details?.columnNumber}`;
        console.error('[Browser Exception Details]:', JSON.stringify(details));
        consoleErrors.push(errText);
      }
      if (data.method === 'Network.responseReceived') {
        if (data.params.response.status === 404) {
          network404s.push(data.params.response.url);
        }
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    // Navigate to live URL after listeners are active
    await send('Page.navigate', { url: liveUrl });
    await new Promise(r => setTimeout(r, 1500));

    console.log('=== TEST 1: LIVE SERVER CONSOLE & NETWORK INTEGRITY ===');
    console.log('Console Errors on Load:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Errors found:', consoleErrors);
    }
    console.log('404 Responses:', network404s);

    console.log('\n=== TEST 2: HERO DOM EXACT ELEMENT COUNTS ===');
    const heroCounts = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          heroCard: document.querySelectorAll('#home .hero-card').length,
          heroTrustPills: document.querySelectorAll('#home .hero-trust-pills').length,
          heroTrustPill: document.querySelectorAll('#home .hero-trust-pill').length,
          heroPortraitWrap: document.querySelectorAll('#home .hero-portrait-wrap').length,
          heroLead: document.querySelectorAll('#home .hero-lead').length,
          heroBio: document.querySelectorAll('#home .hero-bio').length,
          heroCommunities: document.querySelectorAll('#home .hero-communities').length,
          heroCardBg: getComputedStyle(document.querySelector('#home .hero-card')).backgroundColor
        };
      })()`,
      returnByValue: true
    });
    console.log('Hero DOM counts:', heroCounts.result.value);

    console.log('\n=== TEST 3: DESKTOP SIDEBAR COLLAPSE FUNCTIONALITY ===');
    // Ensure desktop viewport
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await send('Runtime.evaluate', { expression: 'window.dispatchEvent(new Event("resize"));' });
    await new Promise(r => setTimeout(r, 200));

    const toggleTest = await send('Runtime.evaluate', {
      expression: `(() => {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('sidebar');
        const main = document.getElementById('main-content');

        const initialCollapsed = document.body.classList.contains('sidebar-collapsed');
        const initialWidth = sidebar.offsetWidth;

        // Click to collapse
        toggleBtn.click();
        const collapsedAfter1 = document.body.classList.contains('sidebar-collapsed');
        const aria1 = toggleBtn.getAttribute('aria-expanded');
        const width1 = sidebar.offsetWidth;
        const storage1 = localStorage.getItem('portfolio.sidebarCollapsed');

        // Click to expand
        toggleBtn.click();
        const collapsedAfter2 = document.body.classList.contains('sidebar-collapsed');
        const aria2 = toggleBtn.getAttribute('aria-expanded');
        const width2 = sidebar.offsetWidth;
        const storage2 = localStorage.getItem('portfolio.sidebarCollapsed');

        return {
          initialCollapsed,
          initialWidth,
          firstClick: { collapsedAfter1, aria1, width1, storage1 },
          secondClick: { collapsedAfter2, aria2, width2, storage2 }
        };
      })()`,
      returnByValue: true
    });
    console.log('Sidebar Toggle Test Result:', JSON.stringify(toggleTest.result.value, null, 2));

    console.log('\n=== TEST 4: MOBILE SIDEBAR DRAWER FUNCTIONALITY ===');
    // Mobile viewport
    await send('Emulation.setDeviceMetricsOverride', { width: 440, height: 956, deviceScaleFactor: 1, mobile: true });
    await send('Runtime.evaluate', { expression: 'window.dispatchEvent(new Event("resize"));' });
    await new Promise(r => setTimeout(r, 200));

    const mobileDrawerTest = await send('Runtime.evaluate', {
      expression: `(() => {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');

        // Open drawer
        menuBtn.click();
        const open1 = sidebar.classList.contains('open');
        const backdropActive1 = backdrop.classList.contains('active');

        // Close with backdrop
        backdrop.click();
        const open2 = sidebar.classList.contains('open');
        const backdropActive2 = backdrop.classList.contains('active');

        return {
          opened: open1 && backdropActive1,
          closed: !open2 && !backdropActive2
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Drawer Test Result:', mobileDrawerTest.result.value);

    console.log('\n=== TEST 5: 10-ROUTE NAVIGATION CONTROLLER & HISTORY ===');
    const sections = ['home', 'about', 'services', 'projects', 'stack', 'credentials', 'gallery', 'experience', 'testimonials', 'contact'];
    let navPassed = 0;

    for (const sec of sections) {
      await send('Runtime.evaluate', {
        expression: `window.location.hash = '${sec}';`
      });
      await new Promise(r => setTimeout(r, 350));

      const routeCheck = await send('Runtime.evaluate', {
        expression: `(() => {
          const activeSections = document.querySelectorAll('.content-section.active');
          const singleActive = activeSections.length === 1 && activeSections[0].id === '${sec}';
          const activeNav = document.querySelector('.sidebar-nav .nav-item.active');
          const navMatch = activeNav && activeNav.getAttribute('href') === '#${sec}';
          const ariaCurrent = activeNav && activeNav.getAttribute('aria-current') === 'page';
          const titleOk = document.title.includes('Renniel Salazar');
          return { singleActive, navMatch, ariaCurrent, titleOk };
        })()`,
        returnByValue: true
      });

      const v = routeCheck.result.value;
      if (v.singleActive && v.navMatch && v.ariaCurrent && v.titleOk) {
        navPassed++;
      } else {
        console.error(`Route #${sec} FAILED:`, v);
        const debugNav = await send('Runtime.evaluate', {
          expression: `(() => {
            return {
              activeSections: [...document.querySelectorAll('.content-section.active')].map(s => s.id),
              activeNavs: [...document.querySelectorAll('.sidebar-nav .nav-item.active')].map(n => n.getAttribute('href'))
            };
          })()`,
          returnByValue: true
        });
        console.error('Debug nav details:', debugNav.result.value);
      }
    }
    console.log(`Navigation Result: ${navPassed}/10 routes cleanly switched.`);

    // Test fallback for invalid route
    await send('Runtime.evaluate', { expression: `window.location.hash = 'invalid-route-xyz';` });
    await new Promise(r => setTimeout(r, 250));
    const fallbackCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const active = document.querySelector('.content-section.active');
        return active ? active.id : 'none';
      })()`,
      returnByValue: true
    });
    console.log('Invalid route fallback section:', fallbackCheck.result.value, fallbackCheck.result.value === 'home' ? '✅' : '❌');

    console.log('\n=== TEST 6: COMPREHENSIVE RESPONSIVE AUDIT ACROSS VIEWPORTS ===');
    const viewports = [
      { name: '320x650 (iPhone SE mini)', width: 320, height: 650, mobile: true },
      { name: '375x667 (iPhone standard)', width: 375, height: 667, mobile: true },
      { name: '390x844 (iPhone 12/13/14)', width: 390, height: 844, mobile: true },
      { name: '440x956 (iPhone 16 Pro Max)', width: 440, height: 956, mobile: true },
      { name: '768x1024 (iPad portrait)', width: 768, height: 1024, mobile: true },
      { name: '820x1180 (iPad Air portrait)', width: 820, height: 1180, mobile: false },
      { name: '1024x768 (iPad landscape)', width: 1024, height: 768, mobile: false },
      { name: '1280x800 (Standard desktop)', width: 1280, height: 800, mobile: false },
      { name: '1440x900 (Wide desktop)', width: 1440, height: 900, mobile: false },
      { name: '844x390 (Landscape phone)', width: 844, height: 390, mobile: true }
    ];

    let vpPassed = 0;
    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await send('Runtime.evaluate', { expression: 'window.dispatchEvent(new Event("resize"));' });
      await new Promise(r => setTimeout(r, 200));

      for (const sec of sections) {
        await send('Runtime.evaluate', { expression: `window.location.hash = '${sec}';` });
        await new Promise(r => setTimeout(r, 350));

        const res = await send('Runtime.evaluate', {
          expression: `(() => {
            const clientW = document.documentElement.clientWidth;
            const scrollW = document.documentElement.scrollWidth;
            const verticalScrollbarW = window.innerWidth - clientW;
            const diff = scrollW - clientW;

            // Check overflowing elements within active content and visible chrome
            const overflowing = [...document.querySelectorAll('*')].filter(el => {
              if (
                el.closest('.sidebar:not(.open)') ||
                el.classList.contains('sidebar-backdrop') ||
                el.classList.contains('sidebar-tooltip') ||
                el.closest('#lightbox:not(.active)') ||
                el.closest('#chat-win:not(.active)') ||
                el.closest('.content-section:not(.active)')
              ) return false;

              // Skip elements that are not rendered (display: none or zero size with no children)
              const r = el.getBoundingClientRect();
              if (r.width === 0 && r.height === 0) return false;

              return r.right > clientW + 1 || r.left < -1;
            });

            let hamburgerOk = true;
            if (window.innerWidth <= 768) {
              const btn = document.getElementById('mobile-menu-btn');
              if (btn) {
                const r = btn.getBoundingClientRect();
                hamburgerOk = r.right <= clientW && r.left >= 0 && r.width >= 40 && r.height >= 40;
              }
            }

            const trueOverflow = overflowing.length > 0 || (diff > verticalScrollbarW);
            return { trueOverflow, hamburgerOk, overflowCount: overflowing.length, diff };
          })()`,
          returnByValue: true
        });

        const v = res.result.value;
        if (!v.trueOverflow && v.hamburgerOk) {
          vpPassed++;
        } else {
          console.error(`[${vp.name} #${sec}] FAIL: overflowCount=${v.overflowCount}, diff=${v.diff}, hamburgerOk=${v.hamburgerOk}`);
          const failDetails = await send('Runtime.evaluate', {
            expression: `(() => {
              const clientW = document.documentElement.clientWidth;
              return [...document.querySelectorAll('*')].filter(el => {
                if (
                  el.closest('.sidebar:not(.open)') ||
                  el.classList.contains('sidebar-backdrop') ||
                  el.classList.contains('sidebar-tooltip') ||
                  el.closest('#lightbox:not(.active)') ||
                  el.closest('#chat-win:not(.active)') ||
                  el.closest('.content-section:not(.active)')
                ) return false;
                const r = el.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) return false;
                return r.right > clientW + 1 || r.left < -1;
              }).slice(0, 8).map(el => ({
                tag: el.tagName,
                id: el.id,
                cls: el.className,
                left: Math.round(el.getBoundingClientRect().left),
                right: Math.round(el.getBoundingClientRect().right),
                clientW
              }));
            })()`,
            returnByValue: true
          });
          console.error('Failing element samples:', JSON.stringify(failDetails.result.value));
        }
      }
    }
    console.log(`Responsive Viewport Checks: ${vpPassed}/100 passed.`);

    console.log('\n=== FINAL CONSOLE ERROR CHECK ===');
    console.log('Total Console Errors During All Live Tests:', consoleErrors.length);
    console.log('Total 404s During All Live Tests:', network404s.length);

    ws.close();
  } catch (err) {
    console.error('Error in live test:', err);
  } finally {
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
  }
}

runLiveTests();

