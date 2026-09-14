const { spawn } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

async function getWsUrl(port) {
  for (let i = 0; i < 20; i++) {
  for (let i = 0; i < 25; i++) {
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

async function run() {
  const port = 9227;
  const port = 9228;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    htmlUrl
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

    const consoleLogs = [];
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({
          type: data.params.type,
          args: data.params.args.map(a => a.value || a.description || '')
        });
      }
      if (data.method === 'Runtime.exceptionThrown') {
        consoleLogs.push({
          type: 'exception',
          text: data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text
        });
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    const sections = ['home', 'about', 'services', 'projects', 'stack', 'credentials', 'gallery', 'experience', 'testimonials', 'contact'];
    const widths = [320, 375, 390, 440, 768, 1024];
    const viewports = [
      { name: '320px (iPhone SE mini)', width: 320, height: 650, mobile: true },
      { name: '375px (iPhone standard)', width: 375, height: 667, mobile: true },
      { name: '390px (iPhone 12/13/14)', width: 390, height: 844, mobile: true },
      { name: '440px (iPhone 16 Pro Max / large phone)', width: 440, height: 956, mobile: true },
      { name: '768px (iPad portrait / tablet)', width: 768, height: 1024, mobile: true },
      { name: '820px (iPad Air portrait)', width: 820, height: 1180, mobile: false },
      { name: '1024px (iPad landscape / small laptop)', width: 1024, height: 768, mobile: false },
      { name: '1280px (Standard desktop)', width: 1280, height: 800, mobile: false },
      { name: '1440px (Wide desktop)', width: 1440, height: 900, mobile: false },
      { name: '844x390 (Landscape phone)', width: 844, height: 390, mobile: true }
    ];

    console.log('=== FULL PORTFOLIO RESPONSIVE AUDIT ===');
    console.log('=== 1. FULL PORTFOLIO RESPONSIVE AUDIT ACROSS 10 VIEWPORTS ===');
    const report = [];

    for (const w of widths) {
    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 850,
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: w <= 768
        mobile: vp.mobile
      });

      for (const sec of sections) {
        // Switch section
        await send('Runtime.evaluate', {
          expression: `window.location.hash = '${sec}';`
        });
        await new Promise(r => setTimeout(r, 250));
        await new Promise(r => setTimeout(r, 200));

        const res = await send('Runtime.evaluate', {
          expression: `(() => {
            const clientW = document.documentElement.clientWidth;
            const scrollW = document.documentElement.scrollWidth;
            const overflowing = [...document.querySelectorAll('*')].filter((el) => {
              if (el.closest('.sidebar:not(.open)') || el.classList.contains('sidebar-backdrop') || el.classList.contains('sidebar-tooltip') || el.closest('#lightbox:not(.active)') || el.closest('#chat-win:not(.active)')) return false;
              const r = el.getBoundingClientRect();
              return r.right > clientW + 1 || r.left < -1;
            }).map(el => ({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              left: Math.round(el.getBoundingClientRect().left),
              right: Math.round(el.getBoundingClientRect().right),
              width: Math.round(el.getBoundingClientRect().width)
            }));

            // Check hamburger menu button on mobile
            let menuBtnCheck = null;
            if (window.innerWidth <= 768) {
              const btn = document.getElementById('mobile-menu-btn');
              if (btn) {
                const b = btn.getBoundingClientRect();
                menuBtnCheck = {
                  visible: b.width > 0 && b.height > 0 && getComputedStyle(btn).display !== 'none',
                  left: Math.round(b.left),
                  right: Math.round(b.right),
                  width: Math.round(b.width),
                  height: Math.round(b.height),
                  insideViewport: b.right <= clientW && b.left >= 0
                };
              }
            }


            const initialX = window.scrollX;
            window.scrollBy(50, 0);
            const canScrollX = (window.scrollX > initialX);
            window.scrollTo(initialX, window.scrollY);

            const verticalScrollbarW = window.innerWidth - clientW;

            return {
              scrollW,
              clientW,
              diff: scrollW - clientW,
              count: overflowing.length,
              topOverflows: overflowing.slice(0, 5)
              verticalScrollbarW,
              canScrollX,
              overflowCount: overflowing.length,
              topOverflows: overflowing.slice(0, 3),
              menuBtnCheck
            };
          })()`,
          returnByValue: true
        });

        const val = res.result.value;
        if (val.diff > 0) {
          report.push({
            width: w,
            section: sec,
            diff: val.diff,
            count: val.count,
            topOverflows: val.topOverflows
          });
        }
        // True overflow means either elements overflow client bounds, horizontal scrolling is possible, or diff exceeds vertical scrollbar
        const hasTrueOverflow = val.overflowCount > 0 || val.canScrollX || (val.diff > val.verticalScrollbarW);
        const menuBtnOk = !val.menuBtnCheck || (val.menuBtnCheck.visible && val.menuBtnCheck.insideViewport);

        report.push({
          vpName: vp.name,
          width: vp.width,
          section: sec,
          scrollW: val.scrollW,
          clientW: val.clientW,
          diff: val.diff,
          canScrollX: val.canScrollX,
          overflowCount: val.overflowCount,
          menuBtnCheck: val.menuBtnCheck,
          passed: !hasTrueOverflow && menuBtnOk
        });
      }
    }

    console.log(`Audit finished. Found ${report.length} section/width overflow issues.`);
    report.forEach(r => {
      console.log(`[${r.width}px #${r.section}] Overflow: +${r.diff}px (${r.count} items). Top item: ${r.topOverflows[0]?.tag}.${r.topOverflows[0]?.className} (w: ${r.topOverflows[0]?.width}, r: ${r.topOverflows[0]?.right})`);
    const failed = report.filter(r => !r.passed);
    console.log(`Responsive Audit Completed: ${report.length - failed.length}/${report.length} checks PASSED.`);

    if (failed.length > 0) {
      console.log('FAILURES:');
      failed.forEach(f => {
        console.log(`- [${f.vpName} #${f.section}]: scrollW=${f.scrollW}, clientW=${f.clientW}, diff=${f.diff}, count=${f.overflowCount}`);
        if (f.menuBtnCheck && !f.menuBtnCheck.insideViewport) {
          console.log(`  Menu btn outside viewport: right=${f.menuBtnCheck.right}, clientW=${f.clientW}`);
        }
      });
    } else {
      console.log('ALL 100 VIEWPORT/SECTION CHECKS PERFECT! 0 OVERFLOWS, HAMBURGER PERFECTLY PLACED.');
    }

    console.log('\n=== 2. RAPID VIEW TRANSITION & ROUTING STRESS TEST ===');
    consoleLogs.length = 0; // Clear logs

    // Rapid navigation through sections
    const navSequence = ['about', 'services', 'projects', 'home', 'stack', 'credentials', 'gallery', 'experience', 'testimonials', 'contact', 'home'];
    for (const target of navSequence) {
      await send('Runtime.evaluate', {
        expression: `window.location.hash = '${target}';`
      });
      // Deliberately fast: 30ms interval to test race conditions and ViewTransition cancellation
      await new Promise(r => setTimeout(r, 30));
    }

    // Also test clicking active hash
    await send('Runtime.evaluate', {
      expression: `window.location.hash = 'home';`
    });
    await new Promise(r => setTimeout(r, 50));

    // Test non-existent hash
    await send('Runtime.evaluate', {
      expression: `window.location.hash = 'nonexistent';`
    });
    await new Promise(r => setTimeout(r, 300));

    // Allow ViewTransitions to settle
    await new Promise(r => setTimeout(r, 500));

    const errors = consoleLogs.filter(l => l.type === 'error' || l.type === 'exception');
    console.log(`Console check after rapid navigation: ${errors.length} errors/exceptions.`);
    if (errors.length > 0) {
      console.error('Console errors logged:', JSON.stringify(errors, null, 2));
    } else {
      console.log('ZERO unhandled exceptions or console errors during rapid navigation!');
    }

    ws.close();
  } catch (err) {
    console.error('Error in audit:', err);
    console.error('Error in test:', err);
  } finally {
    chrome.kill();
  }
}

run();

