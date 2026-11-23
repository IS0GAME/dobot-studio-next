async function closePendantModal() {
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const page = targets.find((t: any) => t.type === 'page' && t.url.includes('5173'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise<void>((r) => { ws.onopen = () => r(); });

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
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const doneBtn = buttons.find(b => b.textContent && b.textContent.includes('Done'));
        if (doneBtn) doneBtn.click();
      })()
    `
  });
  console.log('Closed Pendant Modal successfully');
  ws.close();
}

closePendantModal().catch(console.error);
