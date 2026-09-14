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
  const port = 9225;
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
        const grid = document.querySelector('.featured-home-grid');
        const gridStyle = window.getComputedStyle(grid);
        const card = document.querySelector('.featured-card');
        const cardStyle = window.getComputedStyle(card);
        const home = document.querySelector('#home');
        const allHomeElements = Array.from(home.querySelectorAll('*')).map(el => {
          const r = el.getBoundingClientRect();
          return {
            el: el.tagName + '.' + el.className,
            left: r.left,
            right: r.right,
            width: r.width
          };
        }).filter(item => item.right > 375);

        return {
          gridTemplateColumns: gridStyle.gridTemplateColumns,
          gridWidth: grid.offsetWidth,
          gridScrollWidth: grid.scrollWidth,
          cardWidth: card.offsetWidth,
          allHomeOverflown: allHomeElements
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

