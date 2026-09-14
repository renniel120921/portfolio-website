const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const liveUrl = 'http://127.0.0.1:5500/index.html#home';

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
}

async function run() {
  const port = 9242;
  const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, liveUrl]);
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

  const logs = [];
  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled' || data.method === 'Runtime.exceptionThrown') {
      logs.push(data);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await new Promise(r => setTimeout(r, 600));

  // Check 320px on #about
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 650, deviceScaleFactor: 1, mobile: true });
  await send('Runtime.evaluate', { expression: `window.location.hash = 'about';` });
  await new Promise(r => setTimeout(r, 350));
  let resAbout = await send('Runtime.evaluate', {
    expression: `(() => {
      const cW = document.documentElement.clientWidth;
      return [...document.querySelectorAll('*')].filter(el => {
        if (el.closest('.sidebar:not(.open)') || el.classList.contains('sidebar-backdrop') || el.classList.contains('sidebar-tooltip') || el.closest('#lightbox:not(.active)') || el.closest('#chat-win:not(.active)')) return false;
        const r = el.getBoundingClientRect();
        return r.right > cW + 1 || r.left < -1;
      }).map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        left: Math.round(el.getBoundingClientRect().left),
        right: Math.round(el.getBoundingClientRect().right),
        w: Math.round(el.getBoundingClientRect().width)
      }));
    })()`,
    returnByValue: true
  });
  console.log('320px #about overflowing:', JSON.stringify(resAbout.result.value, null, 2));

  // Check 320px on #services
  await send('Runtime.evaluate', { expression: `window.location.hash = 'services';` });
  await new Promise(r => setTimeout(r, 350));
  let resServices = await send('Runtime.evaluate', {
    expression: `(() => {
      const cW = document.documentElement.clientWidth;
      return [...document.querySelectorAll('*')].filter(el => {
        if (el.closest('.sidebar:not(.open)') || el.classList.contains('sidebar-backdrop') || el.classList.contains('sidebar-tooltip') || el.closest('#lightbox:not(.active)') || el.closest('#chat-win:not(.active)')) return false;
        const r = el.getBoundingClientRect();
        return r.right > cW + 1 || r.left < -1;
      }).map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        left: Math.round(el.getBoundingClientRect().left),
        right: Math.round(el.getBoundingClientRect().right),
        w: Math.round(el.getBoundingClientRect().width)
      }));
    })()`,
    returnByValue: true
  });
  console.log('320px #services overflowing:', JSON.stringify(resServices.result.value, null, 2));

  // Check 1440px on #testimonials
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: `window.location.hash = 'testimonials';` });
  await new Promise(r => setTimeout(r, 350));
  let resTestimonials = await send('Runtime.evaluate', {
    expression: `(() => {
      const cW = document.documentElement.clientWidth;
      const sW = document.documentElement.scrollWidth;
      const over = [...document.querySelectorAll('*')].filter(el => {
        if (el.closest('.sidebar:not(.open)') || el.classList.contains('sidebar-backdrop') || el.classList.contains('sidebar-tooltip') || el.closest('#lightbox:not(.active)') || el.closest('#chat-win:not(.active)')) return false;
        const r = el.getBoundingClientRect();
        return r.right > cW + 1 || r.left < -1;
      }).map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        left: Math.round(el.getBoundingClientRect().left),
        right: Math.round(el.getBoundingClientRect().right),
        w: Math.round(el.getBoundingClientRect().width)
      }));
      return { cW, sW, over: over.slice(0, 5) };
    })()`,
    returnByValue: true
  });
  console.log('1440px #testimonials:', JSON.stringify(resTestimonials.result.value, null, 2));

  console.log('Console logs:', JSON.stringify(logs, null, 2));

  ws.close();
  chrome.kill();
}

run();

