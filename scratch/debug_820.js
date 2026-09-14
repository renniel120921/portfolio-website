const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, ['--headless=new', '--incognito', '--remote-debugging-port=9270', 'about:blank']);

async function run() {
  await new Promise(r => setTimeout(r, 1000));
  const res = await fetch('http://127.0.0.1:9270/json');
  const pages = await res.json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
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
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html#home' });
  await new Promise(r => setTimeout(r, 1500));

  await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: 'window.dispatchEvent(new Event("resize"));' });
  await new Promise(r => setTimeout(r, 400));

  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const hero = document.querySelector('.hero-card');
      const bio = document.querySelector('.hero-bio');
      const btn = document.querySelector('.btn.btn-primary');
      const sidebar = document.querySelector('.sidebar');
      const main = document.querySelector('.main-wrapper');
      return {
        clientW: document.documentElement.clientWidth,
        scrollW: document.documentElement.scrollWidth,
        bodyCollapsed: document.body.classList.contains('sidebar-collapsed'),
        sidebarW: sidebar ? sidebar.offsetWidth : 0,
        mainMarginLeft: main ? getComputedStyle(main).marginLeft : 0,
        mainW: main ? main.offsetWidth : 0,
        heroRect: hero ? hero.getBoundingClientRect() : null,
        bioRect: bio ? bio.getBoundingClientRect() : null,
        btnRect: btn ? btn.getBoundingClientRect() : null,
        heroGridCols: hero ? getComputedStyle(hero).gridTemplateColumns : '',
        heroGridAreas: hero ? getComputedStyle(hero).gridTemplateAreas : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('820px layout info:', JSON.stringify(info.result.value, null, 2));

  ws.close();
  chrome.kill();
}
run();

