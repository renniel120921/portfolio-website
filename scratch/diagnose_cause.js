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
  const port = 9224;
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
        // Test hiding children one by one to see when width drops
        const results = [];
        const children = Array.from(card.children);
        for (const child of children) {
          const originalDisplay = child.style.display;
          child.style.display = 'none';
          results.push({
            childClass: child.className || child.tagName,
            cardWidthWithoutIt: card.offsetWidth
          });
          child.style.display = originalDisplay;
        }

        // Also check if any element on the whole page is causing body/main-wrapper to expand
        const mainWrapper = document.querySelector('.main-wrapper');
        const contentContainer = document.querySelector('.content-container');
        const homeSection = document.querySelector('#home');

        return {
          windowWidth: window.innerWidth,
          bodyWidth: document.body.offsetWidth,
          mainWrapperWidth: mainWrapper.offsetWidth,
          contentContainerWidth: contentContainer.offsetWidth,
          homeSectionWidth: homeSection.offsetWidth,
          cardResults: results
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

