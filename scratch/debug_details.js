const { spawn } = require('child_process');

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

async function debugDetails() {
  const port = 9245;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    liveUrl
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
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        if (data.params.type === 'error') {
          consoleErrors.push(data.params.args.map(a => a.value || a.description).join(' '));
        }
      }
      if (data.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(data.params.exceptionDetails?.text + ' ' + (data.params.exceptionDetails?.exception?.description || ''));
      }
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await new Promise(r => setTimeout(r, 1000));

    // Check 820px
    console.log('=== Checking 820px #home ===');
    await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
    await send('Runtime.evaluate', { expression: `window.location.hash = 'home';` });
    await new Promise(r => setTimeout(r, 400));
    const diag820 = await send('Runtime.evaluate', {
      expression: `(() => {
        const clientW = document.documentElement.clientWidth;
        const overflowing = [...document.querySelectorAll('*')].filter(el => {
          if (el.closest('.sidebar:not(.open)') || el.classList.contains('sidebar-backdrop') || el.classList.contains('sidebar-tooltip') || el.closest('#lightbox:not(.active)') || el.closest('#chat-win:not(.active)')) return false;
          const r = el.getBoundingClientRect();
          return r.right > clientW + 1 || r.left < -1;
        }).map(el => ({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          left: el.getBoundingClientRect().left,
          right: el.getBoundingClientRect().right,
          width: el.getBoundingClientRect().width
        }));
        return { clientW, overflowing };
      })()`,
      returnByValue: true
    });
    console.log('820px elements:', JSON.stringify(diag820.result.value, null, 2));

    // Check 768px #about
    console.log('\n=== Checking 768px #about ===');
    await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: true });
    await send('Runtime.evaluate', { expression: `window.location.hash = 'about';` });
    await new Promise(r => setTimeout(r, 400));
    const diag768 = await send('Runtime.evaluate', {
      expression: `(() => {
        const clientW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const overflowing = [...document.querySelectorAll('*')].filter(el => {
          if (el.closest('.sidebar:not(.open)') || el.classList.contains('sidebar-backdrop') || el.classList.contains('sidebar-tooltip') || el.closest('#lightbox:not(.active)') || el.closest('#chat-win:not(.active)')) return false;
          const r = el.getBoundingClientRect();
          return r.right > clientW + 1 || r.left < -1;
        }).map(el => ({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          left: el.getBoundingClientRect().left,
          right: el.getBoundingClientRect().right,
          width: el.getBoundingClientRect().width
        }));
        return { clientW, scrollW, overflowing: overflowing.slice(0, 15) };
      })()`,
      returnByValue: true
    });
    console.log('768px #about elements:', JSON.stringify(diag768.result.value, null, 2));

    // Also let's check console errors when clicking active routes or rapid clicking
    console.log('\n=== Testing navigation rapid clicking for console errors ===');
    const sections = ['home', 'about', 'services', 'projects', 'stack', 'credentials', 'gallery', 'experience', 'testimonials', 'contact'];
    for (const sec of sections) {
      await send('Runtime.evaluate', { expression: `window.location.hash = '${sec}';` });
      await new Promise(r => setTimeout(r, 80));
    }
    await new Promise(r => setTimeout(r, 500));
    console.log('Captured console errors:', consoleErrors);

    ws.close();
  } finally {
    chrome.kill();
  }
}

debugDetails();

