const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

async function getWsUrl(port) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const pages = await res.json();
      const page = pages.find(p => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Could not connect to Chrome CDP page');
}

async function run() {
  const port = 9222;
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
    console.log('Connected to CDP at', wsUrl);

    // Dynamic import ws or use raw WebSocket available in Node 22
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

    const viewports = [320, 375, 390, 440, 768, 820, 1024];

    for (const w of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 800,
        deviceScaleFactor: 1,
        mobile: w <= 768
      });

      // Wait a frame
      await new Promise(r => setTimeout(r, 200));

      const evalResult = await send('Runtime.evaluate', {
        expression: `(() => {
          const clientW = document.documentElement.clientWidth;
          const scrollW = document.documentElement.scrollWidth;
          const overflowing = [...document.querySelectorAll('*')].filter((el) => {
            if (el.closest('.sidebar:not(.open)') || el.classList.contains('sidebar-backdrop') || el.classList.contains('sidebar-tooltip') || el.closest('#lightbox:not(.active)')) return false;
            const r = el.getBoundingClientRect();
            return r.right > clientW + 1 || r.left < -1;
          }).map(el => ({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            left: Math.round(el.getBoundingClientRect().left),
            right: Math.round(el.getBoundingClientRect().right),
            width: Math.round(el.getBoundingClientRect().width),
            text: el.textContent ? el.textContent.trim().slice(0, 40) : ''
          }));

          return { clientW, scrollW, hasOverflow: scrollW > clientW, count: overflowing.length, items: overflowing.slice(0, 10) };
        })()`,
        returnByValue: true
      });

      console.log(`\n--- Viewport ${w}px ---`);
      console.log(JSON.stringify(evalResult.result.value, null, 2));
    }

    ws.close();
  } catch (err) {
    console.error('Error running audit:', err);
  } finally {
    chrome.kill();
  }
}

run();
