import React from 'react';
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
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
          Waypoints ({waypoints.length})
        </span>
        <span className="text-[11px] text-[var(--muted-foreground)]">Click to highlight in 3D</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {waypoints.map((wp, idx) => {
          const isSelected = selectedIndex === idx;

          let toolBadge = 'None';
          let toolColor = 'bg-gray-500/10 text-gray-400';
          if (wp.toolAction.type === 'suction_cup') {
            toolBadge = wp.toolAction.enabled ? 'Suction ●' : 'Suction ○';
            toolColor = wp.toolAction.enabled ? 'bg-emerald-500/15 text-emerald-500 font-semibold' : 'bg-gray-500/10 text-gray-400';
          } else if (wp.toolAction.type === 'gripper') {
            toolBadge = `Gripper: ${wp.toolAction.state}`;
            toolColor = 'bg-blue-500/15 text-blue-500 font-semibold';
          } else if (wp.toolAction.type === 'laser') {
            toolBadge = `Laser: ${wp.toolAction.power}%`;
            toolColor = 'bg-purple-500/15 text-purple-500 font-semibold';
          }

          return (
            <div
              key={wp.id}
              onClick={() => onSelect(idx)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer text-xs flex items-center gap-3 ${
                isSelected
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm'
                  : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50'
              }`}
            >
              {/* Index Number */}
              <div className="w-5 h-5 rounded-md bg-[var(--muted)] flex items-center justify-center font-bold text-[11px] text-[var(--muted-foreground)]">
                {idx + 1}
              </div>

              {/* Waypoint Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{wp.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--muted)] text-[var(--muted-foreground)] font-mono font-medium">
                    {wp.motionStyle}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${toolColor}`}>
                    {toolBadge}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[var(--muted-foreground)] mt-0.5">
                  X:{wp.coords.x.toFixed(1)} Y:{wp.coords.y.toFixed(1)} Z:{wp.coords.z.toFixed(1)} R:{wp.coords.r.toFixed(1)}°
                </div>
              </div>

              {/* Pause Time Input */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] text-[var(--muted-foreground)]">Pause:</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.1"
                  value={wp.pauseTime}
                  onChange={(e) => onPauseTimeChange(idx, parseFloat(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--background)] text-center font-mono text-[11px]"
                />
                <span className="text-[10px] text-[var(--muted-foreground)]">s</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={idx === 0}
                  onClick={() => onMoveUp(idx)}
                  className="p-1 rounded hover:bg-[var(--muted)] disabled:opacity-30 text-xs"
                  title="Move Up"
                >
                  ▲
                </button>
                <button
                  disabled={idx === waypoints.length - 1}
                  onClick={() => onMoveDown(idx)}
                  className="p-1 rounded hover:bg-[var(--muted)] disabled:opacity-30 text-xs"
                  title="Move Down"
                >
                  ▼
                </button>
                <button
                  onClick={() => onDelete(idx)}
                  className="p-1 rounded hover:bg-red-500/20 text-red-500 text-xs font-bold"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
