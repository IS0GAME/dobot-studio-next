import React, { useState } from 'react';
import { CartesianCoord, JointCoord, MotionStyle, ToolAction } from '../types/robot';

interface JogPanelProps {
  coords: CartesianCoord;
  joints: JointCoord;
  onJog: (axis: string, step: number) => void;
  speedRatio: number;
  accelRatio: number;
  onSpeedChange: (speed: number) => void;
  onAccelChange: (acc: number) => void;
  selectedToolAction: ToolAction;
  onToolActionChange: (action: ToolAction) => void;
  motionStyle: MotionStyle;
  onMotionStyleChange: (style: MotionStyle) => void;
}

export const JogPanel: React.FC<JogPanelProps> = ({
  coords,
  joints,
  onJog,
  speedRatio,
  accelRatio,
  onSpeedChange,
  onAccelChange,
  selectedToolAction,
  onToolActionChange,
  motionStyle,
  onMotionStyleChange,
}) => {
  const [coordMode, setCoordMode] = useState<'cartesian' | 'joint'>('cartesian');
  const [selectedAxis, setSelectedAxis] = useState<string>('x');
  const [stepSize, setStepSize] = useState<number>(1.0);

  const cartesianAxes = ['x', 'y', 'z', 'r'];
  const jointAxes = ['j1', 'j2', 'j3', 'j4'];
  const stepOptions = [0.01, 0.1, 1.0, 10.0, 0]; // 0 for continuous

  return (
    <div className="w-56 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col gap-3 text-xs select-none shadow-sm">
      {/* Coordinate Mode */}
      <div>
        <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          Coordinate System
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setCoordMode('cartesian');
              setSelectedAxis('x');
            }}
            className={`flex-1 py-1 rounded text-center transition-colors font-medium border ${
              coordMode === 'cartesian'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            Cartesian
          </button>
          <button
            onClick={() => {
              setCoordMode('joint');
              setSelectedAxis('j1');
            }}
            className={`flex-1 py-1 rounded text-center transition-colors font-medium border ${
              coordMode === 'joint'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            Joint
          </button>
        </div>
      </div>

      {/* Axis Selection */}
      <div>
        <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          Select Axis
        </div>
        <div className="flex gap-1">
          {(coordMode === 'cartesian' ? cartesianAxes : jointAxes).map((axis) => (
            <button
              key={axis}
              onClick={() => setSelectedAxis(axis)}
              className={`flex-1 py-1.5 rounded uppercase font-bold text-xs transition-colors border ${
                selectedAxis === axis
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent shadow-sm'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {axis}
            </button>
          ))}
        </div>
      </div>

      {/* Big Jog Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onJog(selectedAxis, -stepSize)}
          className="flex-1 h-11 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] active:scale-95 transition-all text-base font-bold flex items-center justify-center"
        >
          ◄ −
        </button>
        <button
          onClick={() => onJog(selectedAxis, stepSize)}
          className="flex-1 h-11 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] active:scale-95 transition-all text-base font-bold flex items-center justify-center"
        >
          + ►
        </button>
      </div>

      {/* Step Size Selector */}
      <div>
        <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          Step Size (mm / °)
        </div>
        <div className="flex gap-1">
          {stepOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStepSize(st)}
              className={`flex-1 py-1 rounded text-center font-mono text-[11px] transition-colors border ${
                stepSize === st
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent font-bold'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {st === 0 ? 'Cont' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Speed Slider */}
      <div>
        <div className="flex justify-between text-[11px] mb-1 font-medium">
          <span className="text-[var(--muted-foreground)]">Speed</span>
          <span className="font-mono">{speedRatio}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={speedRatio}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-full h-1.5 accent-[var(--primary)] cursor-pointer"
        />
      </div>

      {/* Acceleration Slider */}
      <div>
        <div className="flex justify-between text-[11px] mb-1 font-medium">
          <span className="text-[var(--muted-foreground)]">Acceleration</span>
          <span className="font-mono">{accelRatio}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={accelRatio}
          onChange={(e) => onAccelChange(Number(e.target.value))}
          className="w-full h-1.5 accent-[var(--primary)] cursor-pointer"
        />
      </div>

      {/* Motion Style */}
      <div>
        <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          Motion Style
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['MOVJ', 'MOVL', 'JUMP', 'CP', 'ARC'] as MotionStyle[]).map((ms) => (
            <button
              key={ms}
              onClick={() => onMotionStyleChange(ms)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                motionStyle === ms
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent font-bold'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {ms}
            </button>
          ))}
        </div>
      </div>

      {/* โหมดการใช้งาน (Tool Action per Waypoint) */}
      <div>
        <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          โหมดการใช้งาน (Tool Action)
        </div>
        <select
          value={selectedToolAction.type}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'none') onToolActionChange({ type: 'none' });
            else if (val === 'suction_cup') onToolActionChange({ type: 'suction_cup', enabled: true });
            else if (val === 'gripper') onToolActionChange({ type: 'gripper', state: 'close' });
            else if (val === 'laser') onToolActionChange({ type: 'laser', power: 100 });
          }}
          className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
        >
          <option value="none">None (ไม่มีเครื่องมือ)</option>
          <option value="suction_cup">Suction Cup (ถ้วยดูดสุญญากาศ)</option>
          <option value="gripper">Gripper (ก้ามปูจับชิ้นงาน)</option>
          <option value="laser">Laser (หัวเลเซอร์)</option>
        </select>
      </div>
    </div>
  );
};
