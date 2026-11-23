import { writeFileSync } from 'fs';

async function capture() {
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const page = targets.find((t: any) => t.type === 'page' && t.url.includes('5173'));
  if (!page) {
    console.error('No page found:', targets);
    process.exit(1);
  }

  console.log('Connecting to DevTools:', page.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = (e) => reject(e);
  });

  // Enable Page domain
  ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));

  // Request screenshot
  const screenshotPromise = new Promise<string>((resolve) => {
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id === 2 && msg.result && msg.result.data) {
        resolve(msg.result.data);
      }
    };
  });

  ws.send(JSON.stringify({
    id: 2,
    method: 'Page.captureScreenshot',
    params: { format: 'png' }
  }));

  const base64Data = await screenshotPromise;
  const outPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\955763b1-38a6-405b-bd7f-d82c274fe13c\\powertoys_fluent_live_verified.png';
  writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
  console.log('Screenshot saved to:', outPath);

  ws.close();
}

capture().catch(console.error);
