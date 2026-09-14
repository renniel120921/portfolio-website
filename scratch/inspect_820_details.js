const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9270',
  '--disable-gpu',
  'http://127.0.0.1:5500/index.html#home'
]);

async function run() {
  await new Promise(r => setTimeout(r, 1200));
  const res = await fetch('http://127.0.0.1:9270/json');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise(resolve => {
    const msgId = id++;
    const h = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === msgId) { ws.removeEventListener('message', h); resolve(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html#home' });
  await new Promise(r => setTimeout(r, 1200));

  await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: `document.body.classList.remove('sidebar-collapsed');` });
  await new Promise(r => setTimeout(r, 500));

  const diag = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.hero-card');
      const bio = document.querySelector('.hero-bio');
      const btnP = document.querySelector('.hero-card .btn-primary');
      const btnS = document.querySelector('.hero-card .btn-secondary');
      const clientW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return {
        clientW,
        scrollW,
        cardRect: { left: card.getBoundingClientRect().left, right: card.getBoundingClientRect().right, width: card.getBoundingClientRect().width },
        btnPRect: { left: btnP.getBoundingClientRect().left, right: btnP.getBoundingClientRect().right, width: btnP.getBoundingClientRect().width },
        btnSRect: { left: btnS.getBoundingClientRect().left, right: btnS.getBoundingClientRect().right, width: btnS.getBoundingClientRect().width },
        bioRect: { left: bio.getBoundingClientRect().left, right: bio.getBoundingClientRect().right, width: bio.getBoundingClientRect().width }
      };
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(diag.result.value, null, 2));
  ws.close();
  chrome.kill();
}

run();
