const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const liveUrl = 'http://127.0.0.1:5500/index.html#home';

async function inspect820() {
  const port = 9265;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    liveUrl
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const pages = await res.json();
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const msgId = id++;
        const handler = (event) => {
          const d = JSON.parse(event.data);
          if (d.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(d.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: liveUrl });
    await new Promise(r => setTimeout(r, 1200));
    await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 800));

    const comp = await send('Runtime.evaluate', {
      expression: `(() => {
        const elements = [
          '#home',
          '.hero-card',
          '.hero-bio',
          '.btn-row',
          '.btn-primary',
          '.btn-secondary'
        ];
        return elements.map(sel => {
          const el = document.querySelector(sel);
          if (!el) return { sel, exists: false };
          const r = el.getBoundingClientRect();
          return {
            sel,
            exists: true,
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
            height: Math.round(r.height),
            display: getComputedStyle(el).display,
            visibility: getComputedStyle(el).visibility
          };
        });
      })()`,
      returnByValue: true
    });

    console.log(JSON.stringify(comp.result.value, null, 2));
    ws.close();
  } finally {
    chrome.kill();
  }
}

inspect820();
