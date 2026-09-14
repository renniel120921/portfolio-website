const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const liveUrl = 'http://127.0.0.1:5500/index.html#testimonials';

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

async function debugTestimonials() {
  const port = 9250;
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

    await send('Page.enable');
    await send('Runtime.enable');
    await new Promise(r => setTimeout(r, 1000));

    await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
    await send('Runtime.evaluate', { expression: `window.location.hash = 'testimonials';` });
    await new Promise(r => setTimeout(r, 400));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const clientW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;

        // Find what elements have scrollWidth > clientWidth or offsetWidth > clientWidth
        const wideElements = [...document.querySelectorAll('*')].filter(el => {
          return el.scrollWidth > clientW || el.offsetWidth > clientW;
        }).map(el => ({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          scrollW: el.scrollWidth,
          offsetW: el.offsetWidth,
          clientW: el.clientWidth,
          rect: el.getBoundingClientRect()
        }));

        return { clientW, scrollW, wideElements };
      })()`,
      returnByValue: true
    });

    console.log('Result:', JSON.stringify(check.result.value, null, 2));

    ws.close();
  } finally {
    chrome.kill();
  }
}

debugTestimonials();

