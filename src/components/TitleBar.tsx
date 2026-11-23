import React from 'react';
import { Smartphone, ChevronRight, Activity } from 'lucide-react';

interface TitleBarProps {
  mode: 'QuickTeach' | 'Studio';
  onModeChange: (mode: 'QuickTeach' | 'Studio') => void;
  projectName: string;
  isVirtual: boolean;
  onOpenPendant: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  mode,
  onModeChange,
  projectName,
  isVirtual,
  onOpenPendant,
}) => {
  return (
    <header className="h-10 px-3.5 flex items-center justify-between text-xs select-none border-b border-white/10 bg-[#0f111a]/85 backdrop-blur-xl z-10 flex-shrink-0">
      {/* PowerToys Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-zinc-100 tracking-tight text-[13px] font-sans">
          Dobot Studio
        </span>
        <ChevronRight size={13} className="text-zinc-500" />
        <span className="font-mono text-zinc-300 truncate max-w-[240px] text-xs">
          {projectName}
        </span>
        {isVirtual && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold tracking-wide">
            <Activity size={10} className="animate-pulse" />
            <span>Virtual Twin</span>
          </div>
        )}
      </div>

      {/* Right Controls: Mode Switcher + PowerToys Wireless Pendant Trigger */}
      <div className="flex items-center gap-3">
        {/* WinUI 3 Segmented Mode Switcher */}
        <div className="flex p-0.5 rounded-lg border border-white/10 bg-black/40 text-[11px] shadow-inner">
          <button
            onClick={() => onModeChange('QuickTeach')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              mode === 'QuickTeach'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            QuickTeach
          </button>
          <button
            onClick={() => onModeChange('Studio')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              mode === 'Studio'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Studio
          </button>
        </div>

        {/* Wireless Teach Pendant Button (Clean Vector - NO EMOJI) */}
        <button
          onClick={onOpenPendant}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-xs font-semibold text-zinc-200 hover:text-white shadow-sm"
          title="Connect Wireless Mobile Teach Pendant (QR Code & WebSocket)"
        >
          <Smartphone size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>Wireless Pendant</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </button>
      </div>
    </header>
  );
};
