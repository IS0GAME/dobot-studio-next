import React from 'react';
import { Crosshair, PenTool, Code, Settings } from 'lucide-react';

export type NavTabId = 'teach' | 'draw' | 'script' | 'settings';

interface NavigationRailProps {
  activeId: NavTabId;
  onSelect: (id: NavTabId) => void;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const primaryNavItems: NavItem[] = [
  { id: 'teach', label: 'Teach & Playback', icon: Crosshair },
  { id: 'draw', label: 'Draw & Engrave', icon: PenTool, badge: 'Preview' },
  { id: 'script', label: 'Python & Blockly', icon: Code, badge: 'Preview' },
];

export const NavigationRail: React.FC<NavigationRailProps> = ({ activeId, onSelect }) => {
  return (
    <aside
      className="w-12 h-full flex flex-col items-center py-2.5 select-none z-20 flex-shrink-0 bg-[#0f111a]/90 backdrop-blur-2xl border-r border-white/10"
      aria-label="Application Navigation"
    >
      {/* Top Logo Badge */}
      <div className="mb-4">
        <div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0a192f] to-[#1e3a8a] border border-cyan-400/40 flex items-center justify-center shadow-sm"
          title="Dobot Studio Next-Gen v2.0"
        >
          <span className="font-extrabold text-white text-xs tracking-tight font-sans">D</span>
        </div>
      </div>

      {/* Primary Navigation Stack */}
      <nav className="flex-1 flex flex-col items-center gap-1.5 w-full">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-cyan-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
              title={item.label + (item.badge ? ` (${item.badge})` : '')}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* PowerToys Active Left Accent Pill */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              )}

              <Icon size={18} className="transition-transform group-active:scale-95" />

              {/* Tooltip on Hover */}
              <div className="absolute left-14 px-2.5 py-1 rounded-md bg-[#181a24] text-zinc-200 text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 border border-white/10 shadow-lg z-50">
                {item.label}
                {item.badge && (
                  <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Settings Navigation */}
      <div className="w-full flex flex-col items-center pt-2 border-t border-white/5">
        <button
          onClick={() => onSelect('settings')}
          className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 ${
            activeId === 'settings'
              ? 'bg-white/10 text-cyan-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
          title="Settings & Hardware Diagnostics"
          aria-current={activeId === 'settings' ? 'page' : undefined}
        >
          {activeId === 'settings' && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
          )}

          <Settings size={18} className="transition-transform group-hover:rotate-45 duration-300" />

          <div className="absolute left-14 px-2.5 py-1 rounded-md bg-[#181a24] text-zinc-200 text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 border border-white/10 shadow-lg z-50">
            Settings & Diagnostics
          </div>
        </button>
      </div>
    </aside>
  );
};
