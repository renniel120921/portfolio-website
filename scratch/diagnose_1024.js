const { spawn } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

async function getWsUrl(port) {
  for (let i = 0; i < 20; i++) {
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

async function run() {
  const port = 9228;
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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 200));

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const clientW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bodyScrollW = document.body.scrollWidth;
        const bodyClientW = document.body.clientWidth;

        const over = Array.from(document.querySelectorAll('*')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.right > clientW;
        }).map(el => ({
          el: el.tagName + '.' + el.className,
          right: el.getBoundingClientRect().right,
          width: el.getBoundingClientRect().width,
          styleRight: window.getComputedStyle(el).right,
          styleWidth: window.getComputedStyle(el).width
        }));

        return { clientW, scrollW, bodyScrollW, bodyClientW, over };
      })()`,
      returnByValue: true
    });

    console.log(JSON.stringify(evalResult.result.value, null, 2));

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();

