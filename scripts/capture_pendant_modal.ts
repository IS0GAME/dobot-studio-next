import { writeFileSync } from 'fs';

async function testPendantModal() {
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const page = targets.find((t: any) => t.type === 'page' && t.url.includes('5173'));
  if (!page) {
    console.error('No page found');
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = (e) => reject(e);
  });

  let msgId = 1;
  const send = (method: string, params: any = {}) => {
    const id = msgId++;
    return new Promise<any>((resolve) => {
      const handler = (event: any) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await send('Runtime.enable');
  await send('Page.enable');

  // Find and click the Wireless Pendant button
  console.log('Clicking Wireless Pendant button in TitleBar...');
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const pendantBtn = buttons.find(b => b.textContent && b.textContent.includes('Wireless Pendant'));
        if (pendantBtn) {
          pendantBtn.click();
          return 'Clicked Pendant Button';
        }
        return 'Button not found';
      })()
    `,
    returnByValue: true
  });

  console.log('Evaluation result:', evalResult?.result?.value);

  // Wait 400ms for modal animation
  await new Promise((r) => setTimeout(r, 400));

  // Capture screenshot of the modal
  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\955763b1-38a6-405b-bd7f-d82c274fe13c\\powertoys_pendant_modal_live_verified.png';
  writeFileSync(outPath, Buffer.from(screenshotRes.data, 'base64'));
  console.log('Pendant modal screenshot saved to:', outPath);

  ws.close();
}

testPendantModal().catch(console.error);
