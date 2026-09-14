const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const liveUrl = 'http://127.0.0.1:5500/index.html#home';
const port = 9286;

async function getWsUrl() {
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
  throw new Error('Could not connect');
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--incognito',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ]);

  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const msgId = id++;
        const handler = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(d.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
        console.log('[Console Error]:', d.params.args.map(a => a.value || a.description).join(' '));
      }
      if (d.method === 'Runtime.exceptionThrown') {
        console.log('[EXCEPTION THROWN]:', JSON.stringify(d.params.exceptionDetails));
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    await send('Page.navigate', { url: liveUrl });
    await new Promise(r => setTimeout(r, 1200));

    // Test 820x1180
    await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
    await send('Runtime.evaluate', { expression: 'window.dispatchEvent(new Event("resize"));' });
    await new Promise(r => setTimeout(r, 300));

    const sections = ['home', 'about', 'services', 'projects', 'stack', 'credentials', 'gallery', 'experience', 'testimonials', 'contact'];
    for (const sec of sections) {
      console.log(`Setting hash to #${sec}...`);
      await send('Runtime.evaluate', { expression: `window.location.hash = '${sec}';` });
      await new Promise(r => setTimeout(r, 400));

      const active = await send('Runtime.evaluate', {
        expression: `(() => {
          const activeSec = document.querySelector('.content-section.active');
          const clientW = document.documentElement.clientWidth;
          const scrollW = document.documentElement.scrollWidth;

          // Check overflowing elements within active content
          const overflowing = [...document.querySelectorAll('*')].filter(el => {
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
          });

          return {
            activeId: activeSec ? activeSec.id : 'none',
            clientW,
            scrollW,
            diff: scrollW - clientW,
            overflowing: overflowing.map(el => ({ tag: el.tagName, cls: el.className, left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right) }))
          };
        })()`,
        returnByValue: true
      });
      console.log(`Result for #${sec}:`, active.result.value);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

run();

