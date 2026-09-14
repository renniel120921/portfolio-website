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
  const port = 9226;
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
      width: 375,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true
    });

    await new Promise(r => setTimeout(r, 200));

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.featured-card');
        // Test what happens if we set min-width: 0 on .featured-card or minmax(0, 1fr) on .featured-home-grid
        const grid = document.querySelector('.featured-home-grid');
        grid.style.gridTemplateColumns = 'minmax(0, 1fr)';
        const newCardWidth = card.offsetWidth;
        const newGridScrollWidth = grid.scrollWidth;

        // Also inspect what child had large intrinsic width
        const details = Array.from(card.querySelectorAll('*')).map(el => {
          return {
            el: el.tagName + '.' + el.className,
            scrollW: el.scrollWidth,
            offsetW: el.offsetWidth,
            clientW: el.clientWidth
          };
        });

        return {
          withMinMax0: {
            newCardWidth,
            newGridScrollWidth
          },
          details: details.filter(d => d.scrollW > 300)
        };
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

