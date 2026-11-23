import { VirtualDobotSimulator, TelemetryData } from '../simulator/virtualDobot';
import { CartesianCoord, JointCoord } from '../types/robot';

export interface PendantServerOptions {
  port?: number;
  pin?: string;
  simulator: VirtualDobotSimulator;
}

export class MobilePendantServer {
  private port: number;
  private simulator: VirtualDobotSimulator;
  private server: any = null;
  private activeWsClients: Set<any> = new Set();
  private lastHeartbeat: Map<any, number> = new Map();
  private watchdogTimer: Timer | null = null;

  constructor(options: PendantServerOptions) {
    this.port = options.port || 9876;
    this.simulator = options.simulator;
  }

  public start() {
    const simulator = this.simulator;
    const clients = this.activeWsClients;
    const lastHeartbeat = this.lastHeartbeat;

    // Subscribe to simulator telemetry and push to all connected phones
    simulator.subscribe((data: TelemetryData) => {
      const msg = JSON.stringify({ type: 'telemetry', data });
      for (const ws of clients) {
        try {
          ws.send(msg);
        } catch (_) {}
      }
    });

    this.server = Bun.serve({
      port: this.port,
      fetch(req: Request, server: any) {
        const url = new URL(req.url);

        // Upgrade WebSocket
        if (url.pathname === '/ws') {
          const success = server.upgrade(req);
          if (success) return undefined;
          return new Response('WebSocket upgrade failed', { status: 400 });
        }

        // Serve Mobile Pendant PWA HTML
        if (url.pathname === '/' || url.pathname === '/pendant') {
          return new Response(getMobilePendantHtml(), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        return new Response('Not Found', { status: 404 });
      },
      websocket: {
        open(ws: any) {
          clients.add(ws);
          lastHeartbeat.set(ws, Date.now());
          ws.send(JSON.stringify({ type: 'connected', version: '2.0.0' }));
        },
        message(ws: any, message: string) {
          lastHeartbeat.set(ws, Date.now());
          try {
            const cmd = JSON.parse(message);
            if (cmd.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
            } else if (cmd.type === 'jog_step') {
              // Micro movement / Jog step
              const { axis, step, speed } = cmd; // axis: 'x'|'y'|'z'|'r'|'j1'|'j2'|'j3'|'j4'
              const current = simulator.getCoords();
              const target = { ...current };
              if (axis === 'x') target.x += step;
              else if (axis === 'y') target.y += step;
              else if (axis === 'z') target.z += step;
              else if (axis === 'r') target.r += step;
              simulator.moveTo(target, 'MOVJ', speed || 50);
            } else if (cmd.type === 'estop') {
              // Emergency stop
              simulator.moveTo(simulator.getCoords(), 'MOVJ', 100);
            } else if (cmd.type === 'set_tool') {
              simulator.setToolAction(cmd.toolAction);
            }
          } catch (_) {}
        },
        close(ws: any) {
          clients.delete(ws);
          lastHeartbeat.delete(ws);
        },
      },
    });

    // Safety watchdog: disconnect clients if ping exceeds 500ms
    this.watchdogTimer = setInterval(() => {
      const now = Date.now();
      for (const [ws, last] of lastHeartbeat.entries()) {
        if (now - last > 1500) {
          try {
            ws.close();
          } catch (_) {}
          clients.delete(ws);
          lastHeartbeat.delete(ws);
        }
      }
    }, 500);

    return this.port;
  }

  public stop() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
    this.activeWsClients.clear();
    this.lastHeartbeat.clear();
  }
}

function getMobilePendantHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Dobot Wireless Pendant</title>
  <style>
    body { margin:0; font-family:system-ui,-apple-system,sans-serif; background:#121212; color:#fff; user-select:none; }
    .header { display:flex; justify-content:space-between; align-items:center; padding:10px 16px; background:#1c1c1c; border-bottom:1px solid #333; }
    .status { display:flex; align-items:center; gap:6px; font-size:12px; }
    .dot { width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 6px #22c55e; }
    .tabs { display:flex; border-bottom:1px solid #333; }
    .tab { flex:1; text-align:center; padding:12px 0; font-size:13px; font-weight:600; color:#888; cursor:pointer; }
    .tab.active { color:#3b82f6; border-bottom:2px solid #3b82f6; }
    .page { padding:16px; display:none; }
    .page.active { display:block; }
    .coords { display:grid; grid-template-columns:1fr 1fr; gap:8px; font-family:monospace; margin-bottom:16px; }
    .coord-card { background:#1e1e1e; padding:10px; border-radius:8px; border:1px solid #333; }
    .axis-selector { display:flex; gap:6px; margin-bottom:14px; }
    .axis-chip { flex:1; text-align:center; padding:10px 0; background:#222; border:1px solid #444; border-radius:6px; font-weight:700; cursor:pointer; }
    .axis-chip.active { background:#3b82f6; border-color:#3b82f6; color:#fff; }
    .step-selector { display:flex; gap:6px; margin-bottom:16px; }
    .step-chip { flex:1; text-align:center; padding:8px 0; background:#222; border:1px solid #444; border-radius:6px; font-size:12px; cursor:pointer; }
    .step-chip.active { background:#22c55e; border-color:#22c55e; color:#fff; font-weight:700; }
    .jog-btns { display:flex; gap:12px; margin-bottom:16px; }
    .jog-btn { flex:1; height:60px; font-size:24px; font-weight:700; background:#262626; border:1px solid #444; border-radius:10px; color:#fff; display:flex; align-items:center; justify-content:center; }
    .jog-btn:active { background:#3b82f6; }
    .wheel-container { display:flex; flex-direction:column; align-items:center; margin:20px 0; }
    .wheel { width:180px; height:180px; border-radius:50%; border:4px dashed #555; background:#1e1e1e; display:flex; align-items:center; justify-content:center; font-weight:700; color:#aaa; touch-action:none; }
    .estop-btn { width:100%; height:54px; background:#ef4444; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:800; text-transform:uppercase; margin-top:10px; }
    .estop-btn:active { background:#b91c1c; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-weight:700;">DOBOT PENDANT</div>
    <div class="status"><div class="dot"></div> <span id="statusText">Live</span></div>
  </div>
  <div class="tabs">
    <div class="tab active" onclick="setTab('jog')">Touch Jog</div>
    <div class="tab" onclick="setTab('wheel')">MPG Wheel</div>
  </div>
  <div id="jogPage" class="page active">
    <div class="coords">
      <div class="coord-card"><span style="color:#ef4444;">X</span> <span id="valX">230.00</span></div>
      <div class="coord-card"><span style="color:#22c55e;">Y</span> <span id="valY">0.00</span></div>
      <div class="coord-card"><span style="color:#3b82f6;">Z</span> <span id="valZ">-10.00</span></div>
      <div class="coord-card"><span style="color:#eab308;">R</span> <span id="valR">0.00°</span></div>
    </div>
    <div class="axis-selector" id="axisChips">
      <div class="axis-chip active" onclick="setAxis('x', this)">X</div>
      <div class="axis-chip" onclick="setAxis('y', this)">Y</div>
      <div class="axis-chip" onclick="setAxis('z', this)">Z</div>
      <div class="axis-chip" onclick="setAxis('r', this)">R</div>
    </div>
    <div class="step-selector" id="stepChips">
      <div class="step-chip" onclick="setStep(0.01, this)">0.01</div>
      <div class="step-chip" onclick="setStep(0.1, this)">0.1</div>
      <div class="step-chip active" onclick="setStep(1.0, this)">1.0</div>
      <div class="step-chip" onclick="setStep(10.0, this)">10</div>
    </div>
    <div class="jog-btns">
      <button class="jog-btn" onclick="sendJog(-1)">◄ −</button>
      <button class="jog-btn" onclick="sendJog(1)">+ ►</button>
    </div>
    <button class="estop-btn" onclick="sendEStop()">🛑 EMERGENCY STOP</button>
  </div>

  <div id="wheelPage" class="page">
    <div class="wheel-container">
      <div style="font-size:12px; color:#888; margin-bottom:10px;">Drag around wheel for CNC Micro Movement</div>
      <div class="wheel" id="mpgWheel">MPG</div>
    </div>
    <button class="estop-btn" onclick="sendEStop()">🛑 EMERGENCY STOP</button>
  </div>

  <script>
    let ws = null;
    let curAxis = 'x';
    let curStep = 1.0;

    function initWs() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(proto + '//' + location.host + '/ws');
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'telemetry') {
            document.getElementById('valX').textContent = msg.data.coords.x.toFixed(2);
            document.getElementById('valY').textContent = msg.data.coords.y.toFixed(2);
            document.getElementById('valZ').textContent = msg.data.coords.z.toFixed(2);
            document.getElementById('valR').textContent = msg.data.coords.r.toFixed(2) + '°';
          }
        } catch (_) {}
      };
      setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type:'ping' })); }, 1000);
    }
    initWs();

    function setTab(name) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      if (name === 'jog') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('jogPage').classList.add('active');
      } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('wheelPage').classList.add('active');
      }
    }
    function setAxis(ax, el) {
      curAxis = ax;
      document.querySelectorAll('#axisChips .axis-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
    function setStep(st, el) {
      curStep = st;
      document.querySelectorAll('#stepChips .step-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
    function sendJog(dir) {
      if (navigator.vibrate) navigator.vibrate(10);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'jog_step', axis: curAxis, step: curStep * dir, speed: 50 }));
      }
    }
    function sendEStop() {
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'estop' }));
      }
    }

    // MPG Touch Wheel
    let lastAngle = 0;
    const wheel = document.getElementById('mpgWheel');
    wheel.addEventListener('touchmove', (e) => {
      const rect = wheel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const touch = e.touches[0];
      const angle = Math.atan2(touch.clientY - cy, touch.clientX - cx);
      const diff = angle - lastAngle;
      if (Math.abs(diff) > 0.3) {
        sendJog(diff > 0 ? 1 : -1);
        lastAngle = angle;
      }
    });
  </script>
</body>
</html>`;
}
