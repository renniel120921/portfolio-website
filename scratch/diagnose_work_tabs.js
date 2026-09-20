const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const liveUrl = 'http://127.0.0.1:5500/index.html#work';

async function diagnoseWorkTabs() {
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9281', liveUrl]);
  await new Promise(r => setTimeout(r, 1200));
  const res = await fetch('http://127.0.0.1:9281/json');
  const pages = await res.json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
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

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 600, deviceScaleFactor: 1, mobile: true });
  await send('Runtime.evaluate', { expression: `window.location.hash = 'work';` });
  await new Promise(r => setTimeout(r, 500));

  const diag = await send('Runtime.evaluate', {
    expression: `(() => {
      const winW = window.innerWidth;
      const elements = Array.from(document.querySelectorAll('#work *'));
      const overflowing = [];
      for (const el of elements) {
        const r = el.getBoundingClientRect();
        if (r.right > winW + 2) {
          overflowing.push({
            tag: el.tagName,
            cls: el.className,
            isInsideTabs: !!el.closest('.archive-filter-tabs'),
            right: Math.round(r.right),
            text: (el.textContent || '').trim()
          });
        }
      }
      return { winW, overflowing };
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(diag?.result?.value, null, 2));
  chrome.kill();
}

diagnoseWorkTabs();
