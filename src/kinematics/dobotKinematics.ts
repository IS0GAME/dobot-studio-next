import { CartesianCoord, JointCoord } from '../types/robot';

export const L_BASE = 138.0;
export const L_REAR_ARM = 135.0;
export const L_FOREARM = 147.0;
export const L_END_EFFECTOR = 60.0;

export const WORKSPACE_LIMITS = {
  minRadius: 140.0,
  maxRadius: 330.0,
  minZ: -60.0,
  maxZ: 160.0,
  minJ1: -90.0,
  maxJ1: 90.0,
  minJ2: 0.0,
  maxJ2: 85.0,
  minJ3: -10.0,
  maxJ3: 90.0,
};

export class DobotKinematics {
  static isReachable(pose: CartesianCoord): boolean {
    const r = Math.hypot(pose.x, pose.y);
    if (r < WORKSPACE_LIMITS.minRadius || r > WORKSPACE_LIMITS.maxRadius) return false;
    if (pose.z < WORKSPACE_LIMITS.minZ || pose.z > WORKSPACE_LIMITS.maxZ) return false;
    return true;
  }

  static forward(joints: JointCoord): CartesianCoord {
    const toRad = Math.PI / 180;
    const j1Rad = joints.j1 * toRad;
    const j2Rad = joints.j2 * toRad;
    const j3Rad = joints.j3 * toRad;

    // Dobot parallel linkage keeps forearm relative to horizon
    const rArm = L_REAR_ARM * Math.cos(j2Rad) + L_FOREARM * Math.cos(j3Rad) + L_END_EFFECTOR;
    const zArm = L_BASE + L_REAR_ARM * Math.sin(j2Rad) - L_FOREARM * Math.sin(j3Rad);

    const x = rArm * Math.cos(j1Rad);
    const y = rArm * Math.sin(j1Rad);
    const z = zArm - L_BASE;
    const r = joints.j1 + joints.j4;

    return { x, y, z, r };
  }

  static inverse(pose: CartesianCoord): JointCoord | null {
    if (!this.isReachable(pose)) return null;

    const toDeg = 180 / Math.PI;
    const j1 = Math.atan2(pose.y, pose.x) * toDeg;

    const rTotal = Math.hypot(pose.x, pose.y);
    const rArm = rTotal - L_END_EFFECTOR;
    const zArm = pose.z;

    const dSq = rArm * rArm + zArm * zArm;
    const d = Math.sqrt(dSq);

    const l2 = L_REAR_ARM;
    const l3 = L_FOREARM;

    if (d > (l2 + l3) || d < Math.abs(l2 - l3)) return null;

    const beta = Math.atan2(zArm, rArm);
    const cosAlpha = Math.max(-1, Math.min(1, (l2 * l2 + dSq - l3 * l3) / (2 * l2 * d)));
    const alpha = Math.acos(cosAlpha);

    const j2 = (beta + alpha) * toDeg;

    const cosGamma = Math.max(-1, Math.min(1, (l2 * l2 + l3 * l3 - dSq) / (2 * l2 * l3)));
    const gamma = Math.acos(cosGamma);

    const j3 = (Math.PI - gamma - (beta + alpha)) * toDeg;
    const j4 = pose.r - j1;

    // Validate joint ranges
    if (j1 < WORKSPACE_LIMITS.minJ1 || j1 > WORKSPACE_LIMITS.maxJ1) return null;
    if (j2 < WORKSPACE_LIMITS.minJ2 || j2 > WORKSPACE_LIMITS.maxJ2) return null;
    if (j3 < WORKSPACE_LIMITS.minJ3 || j3 > WORKSPACE_LIMITS.maxJ3) return null;

    return { j1, j2, j3, j4 };
  }
}
