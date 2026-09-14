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
  const port = 9223;
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
        const children = [...card.querySelectorAll('*')].map(el => {
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            className: el.className,
            scrollWidth: el.scrollWidth,
            offsetWidth: el.offsetWidth,
            minWidth: style.minWidth,
            width: style.width,
            flex: style.flex,
            whiteSpace: style.whiteSpace
          };
        });
        return {
          cardScrollW: card.scrollWidth,
          cardOffsetW: card.offsetWidth,
          cardComputedW: window.getComputedStyle(card).width,
          cardParentComputedW: window.getComputedStyle(card.parentElement).width,
          cardParentScrollW: card.parentElement.scrollWidth,
          children: children.filter(c => c.offsetWidth > 350 || c.scrollWidth > 350)
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

