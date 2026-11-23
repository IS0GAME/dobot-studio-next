import { expect, test, describe } from 'bun:test';
import { MobilePendantServer } from '../src/server/pendantServer';
import { VirtualDobotSimulator } from '../src/simulator/virtualDobot';

describe('Mobile Wireless Teach Pendant Server', () => {
  test('HTTP Endpoint serves Pendant PWA', async () => {
    const sim = new VirtualDobotSimulator();
    const server = new MobilePendantServer({ port: 9879, simulator: sim });
    server.start();

    const res = await fetch('http://127.0.0.1:9879/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('DOBOT PENDANT');
    expect(html).toContain('MPG Wheel');
    expect(html).toContain('EMERGENCY STOP');

    server.stop();
    sim.destroy();
  });

  test('WebSocket bidirectional communication and Jog execution', async () => {
    const sim = new VirtualDobotSimulator();
    const server = new MobilePendantServer({ port: 9880, simulator: sim });
    server.start();

    const startX = sim.getCoords().x;
    const ws = new WebSocket('ws://127.0.0.1:9880/ws');

    await new Promise<void>((resolve) => {
      ws.onopen = () => {
        // Send a jog step of +10mm along X
        ws.send(JSON.stringify({ type: 'jog_step', axis: 'x', step: 10.0, speed: 100 }));
        setTimeout(resolve, 300);
      };
    });

    const endX = sim.getCoords().x;
    expect(endX).toBeGreaterThan(startX);

    ws.close();
    server.stop();
    sim.destroy();
  });
});
