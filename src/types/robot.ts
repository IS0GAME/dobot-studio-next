export type MotionStyle = 'MOVJ' | 'MOVL' | 'JUMP' | 'CP' | 'ARC';

export type ToolAction = 
  | { type: 'none' }
  | { type: 'suction_cup'; enabled: boolean }
  | { type: 'gripper'; state: 'open' | 'close' | 'release' }
  | { type: 'laser'; power: number }
  | { type: 'eio'; pin: number; value: number };

export interface CartesianCoord {
  x: number;
  y: number;
  z: number;
  r: number;
}

export interface JointCoord {
  j1: number;
  j2: number;
  j3: number;
  j4: number;
}

export interface Waypoint {
  id: string;
  name: string;
  coords: CartesianCoord;
  joints?: JointCoord;
  motionStyle: MotionStyle;
  pauseTime: number; // seconds
  toolAction: ToolAction; // "โหมดการใช้งาน"
  speedRatio?: number;
  accelRatio?: number;
  trigger?: {
    pin: number;
    condition: '==' | '!=' | '>' | '<';
    value: number;
  };
}

export interface RobotState {
  connected: boolean;
  isVirtual: boolean;
  coords: CartesianCoord;
  joints: JointCoord;
  speedRatio: number;
  accelRatio: number;
  activeWaypointIndex: number | null;
  isPlaying: boolean;
  isPaused: boolean;
}
