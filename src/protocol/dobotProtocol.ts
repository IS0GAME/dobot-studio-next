export const DOBOT_HEADER_1 = 0xAA;
export const DOBOT_HEADER_2 = 0xAA;

export const CMD_POSE = 10;
export const CMD_RESET_POSE = 11;
export const CMD_ALARM = 20;
export const CMD_HOME = 31;
export const CMD_END_EFFECTOR_PARAMS = 60;
export const CMD_END_EFFECTOR_LASER = 61;
export const CMD_END_EFFECTOR_SUCTION = 62;
export const CMD_END_EFFECTOR_GRIPPER = 63;
export const CMD_JOG = 73;
export const CMD_PTP = 84;
export const CMD_CP = 91;
export const CMD_ARC = 101;
export const CMD_WAIT = 110;
export const CMD_QUEUED_CMD_START_EXEC = 243;
export const CMD_QUEUED_CMD_STOP_EXEC = 244;
export const CMD_QUEUED_CMD_CLEAR = 245;

export enum PtpMode {
  JUMP_XYZ = 0,
  MOVJ_XYZ = 1,
  MOVL_XYZ = 2,
  JUMP_ANGLE = 3,
  MOVJ_ANGLE = 4,
  MOVL_ANGLE = 5,
}

export interface DobotPacket {
  id: number;
  isRead: boolean;
  isQueued: boolean;
  payload: Uint8Array;
}

export function createPtpPacket(
  mode: PtpMode,
  x: number,
  y: number,
  z: number,
  r: number,
  isQueued: boolean = true
): Uint8Array {
  const payload = new Uint8Array(17);
  const view = new DataView(payload.buffer);
  payload[0] = mode;
  view.setFloat32(1, x, true);
  view.setFloat32(5, y, true);
  view.setFloat32(9, z, true);
  view.setFloat32(13, r, true);

  return encodePacket(CMD_PTP, false, isQueued, payload);
}

export function createSuctionCupPacket(enable: boolean, suck: boolean, isQueued: boolean = true): Uint8Array {
  const payload = new Uint8Array([enable ? 1 : 0, suck ? 1 : 0]);
  return encodePacket(CMD_END_EFFECTOR_SUCTION, false, isQueued, payload);
}

export function createGripperPacket(enable: boolean, grip: boolean, isQueued: boolean = true): Uint8Array {
  const payload = new Uint8Array([enable ? 1 : 0, grip ? 1 : 0]);
  return encodePacket(CMD_END_EFFECTOR_GRIPPER, false, isQueued, payload);
}

export function encodePacket(id: number, isRead: boolean, isQueued: boolean, payload: Uint8Array): Uint8Array {
  const len = 2 + payload.length;
  let ctrl = isRead ? 0x00 : 0x01;
  if (isQueued) ctrl |= 0x02;

  const out = new Uint8Array(6 + payload.length);
  out[0] = DOBOT_HEADER_1;
  out[1] = DOBOT_HEADER_2;
  out[2] = len;
  out[3] = id;
  out[4] = ctrl;
  out.set(payload, 5);

  let sum = id + ctrl;
  for (let i = 0; i < payload.length; i++) {
    sum += payload[i];
  }
  const checksum = (256 - (sum % 256)) & 0xFF;
  out[out.length - 1] = checksum;
  return out;
}

export function verifyChecksum(bytes: Uint8Array): boolean {
  if (bytes.length < 6) return false;
  if (bytes[0] !== DOBOT_HEADER_1 || bytes[1] !== DOBOT_HEADER_2) return false;
  const len = bytes[2];
  if (bytes.length !== len + 4) return false;
  let sum = 0;
  for (let i = 3; i < bytes.length; i++) {
    sum += bytes[i];
  }
  return (sum & 0xFF) === 0;
}
