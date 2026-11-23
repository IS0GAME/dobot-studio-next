import React from 'react';

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
    <div className="h-9 px-3 flex items-center justify-between text-xs select-none border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-[var(--primary)] flex items-center justify-center text-[9px] font-bold text-[var(--primary-foreground)]">
          D
        </div>
        <span className="font-semibold text-[var(--foreground)]">Dobot Studio</span>
        <span className="text-[var(--muted-foreground)]">/</span>
        <span className="text-[var(--muted-foreground)] truncate max-w-[200px]">{projectName}</span>
        {isVirtual && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 font-medium">
            Virtual Simulator
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Mode Switcher */}
        <div className="flex p-0.5 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 text-[11px]">
          <button
            onClick={() => onModeChange('QuickTeach')}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              mode === 'QuickTeach'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            QuickTeach
          </button>
          <button
            onClick={() => onModeChange('Studio')}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              mode === 'Studio'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Studio
          </button>
        </div>

        {/* Mobile Pendant Button */}
        <button
          onClick={onOpenPendant}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)] transition-colors text-xs font-medium"
          title="Connect Wireless Mobile Teach Pendant"
        >
          <span>📱</span>
          <span>Pendant</span>
        </button>
      </div>
    </div>
  );
};
