const { spawn } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');

async function check() {
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9239', htmlUrl]);
  await new Promise(r => setTimeout(r, 1200));
  const res = await fetch('http://127.0.0.1:9239/json');
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

  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 600, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: `window.location.hash = 'projects';` });
  await new Promise(r => setTimeout(r, 300));

  let res1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const cW = document.documentElement.clientWidth;
      const sW = document.documentElement.scrollWidth;
      const cH = document.documentElement.clientHeight;
      const sH = document.documentElement.scrollHeight;
      const hasVerticalScrollbar = sH > cH;
      const scrollbarW = window.innerWidth - cW;

      // Does horizontal scroll actually exist?
      // Try to scroll horizontally:
      const initialScrollLeft = window.scrollX || document.documentElement.scrollLeft;
      window.scrollTo(9999, 0);
      const scrolledLeft = window.scrollX || document.documentElement.scrollLeft;
      window.scrollTo(initialScrollLeft, 0);

      const canScrollHorizontally = scrolledLeft > 0;

      return {
        cW,
        sW,
        cH,
        sH,
        hasVerticalScrollbar,
        scrollbarW,
        diff: sW - cW,
        canScrollHorizontally
      };
    })()`,
    returnByValue: true
  });
  console.log('Result:', res1.result.value);

  ws.close();
  chrome.kill();
}

check();

