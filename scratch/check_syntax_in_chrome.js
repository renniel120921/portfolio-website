const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9245;
const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));

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
  throw new Error('Could not connect to Chrome CDP page');
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--user-data-dir=${tmpProfile}`,
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

    const errors = [];
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
        errors.push({ type: 'console.error', text: data.params.args.map(a => a.value || a.description).join(' ') });
      }
      if (data.method === 'Runtime.exceptionThrown') {
        errors.push({ type: 'exception', details: data.params.exceptionDetails });
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    // Navigate now that listeners are armed
    await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html#home' });
    await new Promise(r => setTimeout(r, 1500));

    console.log('Errors captured:', JSON.stringify(errors, null, 2));

    // Also fetch script.js text as evaluated by the browser
    const scriptEvaluation = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          scripts: Array.from(document.querySelectorAll('script')).map(s => s.src),
          hasInitApp: typeof window.renderRoute,
          sidebarToggleExists: !!document.getElementById('sidebar-toggle-btn'),
          bodyClasses: document.body.className
        };
      })()`,
      returnByValue: true
    });
    console.log('Page state:', JSON.stringify(scriptEvaluation.result.value, null, 2));

    ws.close();
  } finally {
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
  }
}

run();

