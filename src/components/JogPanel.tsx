import React, { useState } from 'react';
import { Minus, Plus, Sliders, Crosshair, Wrench, Compass } from 'lucide-react';
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
    <div className="w-64 p-3.5 rounded-2xl border border-white/10 bg-[#0f111a]/90 backdrop-blur-2xl flex flex-col gap-3.5 text-xs select-none shadow-xl">
      {/* Live Monospace Telemetry Card (Cascadia Code / Tabular-nums) */}
      <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03] flex flex-col gap-1.5 shadow-inner">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Compass size={13} className="text-cyan-400" />
            Live Telemetry
          </span>
          <span className="text-[10px] text-zinc-500 font-mono uppercase">
            {coordMode}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono tabular-nums text-xs">
          {coordMode === 'cartesian' ? (
            <>
              <div className="flex justify-between bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-zinc-500 font-bold">X</span>
                <span className="text-zinc-200 font-semibold">{coords.x.toFixed(2)}</span>
              </div>
              <div className="flex justify-between bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-zinc-500 font-bold">Y</span>
                <span className="text-zinc-200 font-semibold">{coords.y.toFixed(2)}</span>
              </div>
              <div className="flex justify-between bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-zinc-500 font-bold">Z</span>
                <span className="text-zinc-200 font-semibold">{coords.z.toFixed(2)}</span>
              </div>
              <div className="flex justify-between bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-zinc-500 font-bold">R</span>
                <span className="text-zinc-200 font-semibold">{coords.r.toFixed(2)}°</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-zinc-500 font-bold">J1</span>
                <span className="text-zinc-200 font-semibold">{joints.j1.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-zinc-500 font-bold">J2</span>
                <span className="text-zinc-200 font-semibold">{joints.j2.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-zinc-500 font-bold">J3</span>
                <span className="text-zinc-200 font-semibold">{joints.j3.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-zinc-500 font-bold">J4</span>
                <span className="text-zinc-200 font-semibold">{joints.j4.toFixed(2)}°</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Coordinate Mode Segmented Pill */}
      <div>
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Crosshair size={11} className="text-blue-400" />
          Coordinate System
        </div>
        <div className="flex p-0.5 rounded-lg border border-white/10 bg-black/40 text-[11px] shadow-inner">
          <button
            onClick={() => {
              setCoordMode('cartesian');
              setSelectedAxis('x');
            }}
            className={`flex-1 py-1 rounded-md text-center transition-all font-semibold ${
              coordMode === 'cartesian'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Cartesian
          </button>
          <button
            onClick={() => {
              setCoordMode('joint');
              setSelectedAxis('j1');
            }}
            className={`flex-1 py-1 rounded-md text-center transition-all font-semibold ${
              coordMode === 'joint'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Joint
          </button>
        </div>
      </div>

      {/* Axis Selection */}
      <div>
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          Select Target Axis
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {(coordMode === 'cartesian' ? cartesianAxes : jointAxes).map((axis) => (
            <button
              key={axis}
              onClick={() => setSelectedAxis(axis)}
              className={`py-1.5 rounded-lg uppercase font-mono font-bold text-xs transition-all border ${
                selectedAxis === axis
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm scale-100'
                  : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
              }`}
            >
              {axis}
            </button>
          ))}
        </div>
      </div>

      {/* Touch Targets (>= 44px) Jog Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onJog(selectedAxis, -stepSize)}
          className="flex-1 h-12 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-blue-600 hover:border-blue-500 text-zinc-200 hover:text-white active:scale-95 transition-all text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm"
          title={`Jog ${selectedAxis.toUpperCase()} Negative`}
        >
          <Minus size={16} />
          <span className="font-mono uppercase">{selectedAxis}</span>
        </button>
        <button
          onClick={() => onJog(selectedAxis, stepSize)}
          className="flex-1 h-12 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-blue-600 hover:border-blue-500 text-zinc-200 hover:text-white active:scale-95 transition-all text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm"
          title={`Jog ${selectedAxis.toUpperCase()} Positive`}
        >
          <Plus size={16} />
          <span className="font-mono uppercase">{selectedAxis}</span>
        </button>
      </div>

      {/* Step Size Selector */}
      <div>
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          Step Size (mm / °)
        </div>
        <div className="flex gap-1">
          {stepOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStepSize(st)}
              className={`flex-1 py-1 rounded-lg text-center font-mono text-[11px] transition-all border ${
                stepSize === st
                  ? 'bg-blue-600/30 border-blue-500/50 text-cyan-300 font-bold'
                  : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              {st === 0 ? 'Cont' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders: Speed & Acceleration with SettingCard visual style */}
      <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          <Sliders size={11} className="text-zinc-400" />
          Kinematic Limits
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-medium">
            <span className="text-zinc-400">Velocity Ratio</span>
            <span className="font-mono tabular-nums text-zinc-200 font-semibold">{speedRatio}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={speedRatio}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-medium">
            <span className="text-zinc-400">Acceleration Ratio</span>
            <span className="font-mono tabular-nums text-zinc-200 font-semibold">{accelRatio}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={accelRatio}
            onChange={(e) => onAccelChange(Number(e.target.value))}
            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Motion Style Selection */}
      <div>
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          Motion Interpolation
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['MOVJ', 'MOVL', 'JUMP', 'CP', 'ARC'] as MotionStyle[]).map((ms) => (
            <button
              key={ms}
              onClick={() => onMotionStyleChange(ms)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all border ${
                motionStyle === ms
                  ? 'bg-blue-600/30 border-blue-500/50 text-cyan-300 font-bold'
                  : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {ms}
            </button>
          ))}
        </div>
      </div>

      {/* โหมดการใช้งาน (Tool Action per Waypoint) */}
      <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          <Wrench size={11} className="text-zinc-400" />
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
          className="w-full p-2 rounded-lg border border-white/10 bg-black/40 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-sans"
        >
          <option value="none" className="bg-[#0f111a] text-zinc-200">None (ไม่มีเครื่องมือ)</option>
          <option value="suction_cup" className="bg-[#0f111a] text-zinc-200">Suction Cup (ถ้วยดูดสุญญากาศ)</option>
          <option value="gripper" className="bg-[#0f111a] text-zinc-200">Gripper (ก้ามปูจับชิ้นงาน)</option>
          <option value="laser" className="bg-[#0f111a] text-zinc-200">Laser (หัวเลเซอร์)</option>
        </select>
      </div>
    </div>
  );
};
