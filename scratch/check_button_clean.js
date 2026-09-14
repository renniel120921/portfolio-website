const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--incognito',
  '--remote-debugging-port=9296',
  'about:blank'
]);

async function run() {
  await new Promise(r => setTimeout(r, 1000));
  const res = await fetch('http://127.0.0.1:9296/json');
  const pages = await res.json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(m, p = {}) {
    return new Promise(res => {
      const msgId = id++;
      const h = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === msgId) { ws.removeEventListener('message', h); res(d.result); }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: msgId, method: m, params: p }));
    });
  }

  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html#home' });

  await new Promise(resolve => {
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });

  // Now set 440px
  await send('Emulation.setDeviceMetricsOverride', { width: 440, height: 956, deviceScaleFactor: 1, mobile: true });
  await new Promise(r => setTimeout(r, 300));

  const btnCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('mobile-menu-btn');
      const r = btn.getBoundingClientRect();
      const clientW = document.documentElement.clientWidth;
      return {
        clientW,
        left: r.left,
        right: r.right,
        width: r.width,
        height: r.height,
        display: getComputedStyle(btn).display,
        visibility: getComputedStyle(btn).visibility,
        hamburgerOk: r.right <= clientW && r.left >= 0 && r.width >= 40 && r.height >= 40
      };
    })()`,
    returnByValue: true
  });
  console.log('Button at 440px:', btnCheck.result.value);

  ws.close();
  chrome.kill();
}
run();

