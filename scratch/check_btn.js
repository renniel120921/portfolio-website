const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--incognito',
  '--remote-debugging-port=9295',
  'about:blank'
]);

async function run() {
  await new Promise(r => setTimeout(r, 1000));
  const res = await fetch('http://127.0.0.1:9295/json');
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
  await new Promise(r => setTimeout(r, 1200));

  for (const w of [375, 390, 440, 768]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: true });
    await send('Runtime.evaluate', { expression: 'window.dispatchEvent(new Event("resize"));' });
    await new Promise(r => setTimeout(r, 200));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById("mobile-menu-btn");
        const hdr = document.getElementById("mobile-header");
        const r = btn ? btn.getBoundingClientRect() : null;
        const hr = hdr ? hdr.getBoundingClientRect() : null;
        return {
          w: ${w},
          innerW: window.innerWidth,
          clientW: document.documentElement.clientWidth,
          hdrDisplay: hdr ? getComputedStyle(hdr).display : null,
          hdrRect: hr ? { top: hr.top, left: hr.left, right: hr.right, width: hr.width, height: hr.height } : null,
          btnRect: r ? { top: r.top, left: r.left, right: r.right, width: r.width, height: r.height } : null,
          btnVisible: btn ? (r.width > 0 && r.height > 0) : false
        };
      })()`,
      returnByValue: true
    });
    console.log(JSON.stringify(check.result.value, null, 2));
  }
  ws.close();
  chrome.kill();
}
run();

