import React from 'react';
import { ChevronUp, ChevronDown, Trash2, Clock, Waypoints, Cpu } from 'lucide-react';
import { Waypoint } from '../types/robot';

interface WaypointListProps {
  waypoints: Waypoint[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onPauseTimeChange: (index: number, time: number) => void;
}

export const WaypointList: React.FC<WaypointListProps> = ({
  waypoints,
  selectedIndex,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  onPauseTimeChange,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-2.5 min-h-0 select-none">
      <div className="flex justify-between items-center text-xs px-1">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-400 uppercase tracking-wider text-[11px]">
          <Waypoints size={13} className="text-blue-400" />
          <span>Recorded Motion Sequence</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 font-mono text-[10px]">
            {waypoints.length}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">Click card to preview pose</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-fluent-scrollbar">
        {waypoints.map((wp, idx) => {
          const isSelected = selectedIndex === idx;

          let toolBadge = 'None';
          let toolBadgeClass = 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
          if (wp.toolAction.type === 'suction_cup') {
            toolBadge = wp.toolAction.enabled ? 'Suction ON' : 'Suction OFF';
            toolBadgeClass = wp.toolAction.enabled
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
          } else if (wp.toolAction.type === 'gripper') {
            toolBadge = `Gripper: ${wp.toolAction.state.toUpperCase()}`;
            toolBadgeClass = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
          } else if (wp.toolAction.type === 'laser') {
            toolBadge = `Laser: ${wp.toolAction.power}%`;
            toolBadgeClass = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
          }

          return (
            <div
              key={wp.id}
              onClick={() => onSelect(idx)}
              className={`p-3 rounded-xl border transition-all cursor-pointer text-xs flex items-center gap-3 ${
                isSelected
                  ? 'border-blue-500 bg-blue-600/10 shadow-md ring-1 ring-blue-500/30'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              {/* Index Number Badge */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/10 text-zinc-400'
                }`}
              >
                {idx + 1}
              </div>

              {/* Waypoint Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200 truncate">{wp.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-zinc-400 font-mono font-medium">
                    {wp.motionStyle}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${toolBadgeClass}`}>
                    {toolBadge}
                  </span>
                </div>
                {/* Monospace Cascadia Code Coordinates */}
                <div className="font-mono tabular-nums text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                  <span>X: <strong className="text-zinc-300 font-normal">{wp.coords.x.toFixed(1)}</strong></span>
                  <span>Y: <strong className="text-zinc-300 font-normal">{wp.coords.y.toFixed(1)}</strong></span>
                  <span>Z: <strong className="text-zinc-300 font-normal">{wp.coords.z.toFixed(1)}</strong></span>
                  <span>R: <strong className="text-zinc-300 font-normal">{wp.coords.r.toFixed(1)}°</strong></span>
                </div>
              </div>

              {/* Pause Time Input */}
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-black/30"
                onClick={(e) => e.stopPropagation()}
              >
                <Clock size={12} className="text-zinc-500" />
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.1"
                  value={wp.pauseTime}
                  onChange={(e) => onPauseTimeChange(idx, parseFloat(e.target.value) || 0)}
                  className="w-11 px-1 py-0.5 rounded bg-transparent text-center font-mono text-[11px] text-zinc-200 focus:outline-none focus:bg-white/5"
                />
                <span className="text-[10px] text-zinc-500">s</span>
              </div>

              {/* Reorder and Delete Action Buttons (Lucide Vector Icons) */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={idx === 0}
                  onClick={() => onMoveUp(idx)}
                  className="w-7 h-7 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-20 text-zinc-300 flex items-center justify-center transition-all"
                  title="Move Up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  disabled={idx === waypoints.length - 1}
                  onClick={() => onMoveDown(idx)}
                  className="w-7 h-7 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-20 text-zinc-300 flex items-center justify-center transition-all"
                  title="Move Down"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => onDelete(idx)}
                  className="w-7 h-7 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all"
                  title="Delete Waypoint"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
