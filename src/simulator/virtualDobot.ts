import { CartesianCoord, JointCoord, MotionStyle, ToolAction, Waypoint } from '../types/robot';
import { DobotKinematics } from '../kinematics/dobotKinematics';

export interface TelemetryData {
  coords: CartesianCoord;
  joints: JointCoord;
  toolAction: ToolAction;
  isMoving: boolean;
  queuedCmdIndex: number;
}

export type TelemetryListener = (data: TelemetryData) => void;

export class VirtualDobotSimulator {
  private coords: CartesianCoord = { x: 230.0, y: 0.0, z: -10.0, r: 0.0 };
  private joints: JointCoord = { j1: 0.0, j2: 45.0, j3: 35.0, j4: 0.0 };
  private toolAction: ToolAction = { type: 'none' };
  private isMoving = false;
  private queuedCmdIndex = 0;
  private listeners: Set<TelemetryListener> = new Set();
  private timer: Timer | null = null;

  constructor() {
    this.updateJointsFromCoords();
    this.startTelemetryLoop();
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener({
      coords: { ...this.coords },
      joints: { ...this.joints },
      toolAction: { ...this.toolAction },
      isMoving: this.isMoving,
      queuedCmdIndex: this.queuedCmdIndex,
    });
    return () => this.listeners.delete(listener);
  }

  public getCoords(): CartesianCoord {
    return { ...this.coords };
  }

  public getJoints(): JointCoord {
    return { ...this.joints };
  }

  public getToolAction(): ToolAction {
    return { ...this.toolAction };
  }

  public setToolAction(action: ToolAction) {
    this.toolAction = action;
    this.broadcast();
  }

  public async moveTo(target: CartesianCoord, style: MotionStyle = 'MOVJ', speedRatio: number = 80): Promise<boolean> {
    if (!DobotKinematics.isReachable(target)) {
      return false;
    }

    this.isMoving = true;
    const start = { ...this.coords };
    const distance = Math.hypot(target.x - start.x, target.y - start.y, target.z - start.z);
    const speed = Math.max(10, (speedRatio / 100) * 150); // mm/s
    const durationMs = Math.max(100, (distance / speed) * 1000);
    const steps = Math.ceil(durationMs / 20); // 50Hz update

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Smooth cosine easing (S-curve velocity profile)
      const ease = (1 - Math.cos(t * Math.PI)) / 2;

      this.coords = {
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
        z: start.z + (target.z - start.z) * ease,
        r: start.r + (target.r - start.r) * ease,
      };

      this.updateJointsFromCoords();
      this.broadcast();
      await new Promise(r => setTimeout(r, 20));
    }

    this.coords = { ...target };
    this.updateJointsFromCoords();
    this.isMoving = false;
    this.queuedCmdIndex++;
    this.broadcast();
    return true;
  }

  public async executeWaypoint(wp: Waypoint, speedRatio: number = 80): Promise<boolean> {
    const success = await this.moveTo(wp.coords, wp.motionStyle, speedRatio);
    if (!success) return false;

    this.setToolAction(wp.toolAction);

    if (wp.pauseTime > 0) {
      await new Promise(r => setTimeout(r, wp.pauseTime * 1000));
    }
    return true;
  }

  private updateJointsFromCoords() {
    const calculated = DobotKinematics.inverse(this.coords);
    if (calculated) {
      this.joints = calculated;
    }
  }

  private startTelemetryLoop() {
    this.timer = setInterval(() => {
      this.broadcast();
    }, 50); // 20Hz heartbeat
  }

  private broadcast() {
    const data: TelemetryData = {
      coords: { ...this.coords },
      joints: { ...this.joints },
      toolAction: { ...this.toolAction },
      isMoving: this.isMoving,
      queuedCmdIndex: this.queuedCmdIndex,
    };
    for (const listener of this.listeners) {
      listener(data);
    }
  }

  public destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.listeners.clear();
  }
}
