import React from 'react';

export const SkeletonView: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0f] text-[#f4f4f5] select-none overflow-hidden animate-fadeIn">
      {/* 1. Header TitleBar Skeleton */}
      <div className="h-10 bg-[#12121a]/90 border-b border-white/5 flex items-center justify-between px-3">
        <div className="flex items-center space-x-3">
          {/* App Icon */}
          <div className="w-6 h-6 rounded-md bg-white/10 relative overflow-hidden skeleton-shimmer" />
          <div className="w-32 h-4 rounded bg-white/10 relative overflow-hidden skeleton-shimmer" />
          {/* Mode Switcher Tabs */}
          <div className="flex bg-white/5 p-0.5 rounded-lg ml-4 space-x-1">
            <div className="w-24 h-6 rounded-md bg-white/15 relative overflow-hidden skeleton-shimmer" />
            <div className="w-20 h-6 rounded-md bg-white/5" />
          </div>
        </div>

        {/* Status / Hardware Badges */}
        <div className="flex items-center space-x-3">
          <div className="w-36 h-6 rounded-full bg-cyan-950/40 border border-cyan-800/30 relative overflow-hidden skeleton-shimmer" />
          <div className="w-24 h-6 rounded bg-white/10 relative overflow-hidden skeleton-shimmer" />
        </div>
      </div>

      {/* 2. Main Workspace Grid */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left / Center: 3D Digital Twin Viewport Skeleton */}
        <div className="col-span-8 flex flex-col bg-[#12121a]/60 border border-white/5 rounded-2xl p-4 relative overflow-hidden backdrop-blur-xl">
          {/* Viewport Header Chips */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/50 animate-ping" />
              <div className="w-40 h-5 rounded bg-white/10 relative overflow-hidden skeleton-shimmer" />
            </div>
            {/* Coordinate Badges (X, Y, Z, R) */}
            <div className="flex space-x-2">
              {['X: --- mm', 'Y: --- mm', 'Z: --- mm', 'R: ---°'].map((label, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 relative overflow-hidden skeleton-shimmer"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Central Holographic Wireframe Placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="w-48 h-48 rounded-full border border-cyan-500/10 flex items-center justify-center relative">
              <div className="w-36 h-36 rounded-full border border-cyan-400/20 animate-spin-slow" />
              {/* Minimalist Geometric Dobot Wireframe Outline */}
              <svg className="w-28 h-28 text-cyan-400/30 absolute" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                <circle cx="50" cy="80" r="12" strokeWidth="2" />
                <line x1="50" y1="80" x2="68" y2="45" strokeWidth="3" strokeLinecap="round" />
                <circle cx="68" cy="45" r="6" strokeWidth="2" />
                <line x1="68" y1="45" x2="40" y2="30" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="40" cy="30" r="4" strokeWidth="2" />
                <line x1="40" y1="30" x2="40" y2="20" strokeWidth="2" />
              </svg>
            </div>
            <div className="mt-4 text-xs tracking-widest text-zinc-400 uppercase font-medium">
              Initializing 3D Digital Twin Viewport...
            </div>
          </div>

          {/* Viewport Bottom Controls */}
          <div className="h-10 bg-white/5 rounded-xl flex items-center justify-between px-3 mt-auto relative overflow-hidden skeleton-shimmer">
            <div className="w-32 h-4 rounded bg-white/10" />
            <div className="w-24 h-6 rounded bg-white/10" />
          </div>
        </div>

        {/* Right: Jog & Waypoint Controls Skeleton */}
        <div className="col-span-4 flex flex-col space-y-3 overflow-hidden">
          {/* Jog Control Panel Skeleton */}
          <div className="bg-[#12121a]/60 border border-white/5 rounded-2xl p-4 flex flex-col space-y-3 relative overflow-hidden backdrop-blur-xl">
            <div className="flex justify-between items-center">
              <div className="w-28 h-4 rounded bg-white/10 relative overflow-hidden skeleton-shimmer" />
              <div className="w-24 h-6 rounded bg-white/10 relative overflow-hidden skeleton-shimmer" />
            </div>

            {/* 4 Axis Control Rows */}
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs text-zinc-500">
                    J{i}
                  </div>
                  <div className="flex-1 h-8 rounded-lg bg-white/5 relative overflow-hidden skeleton-shimmer" />
                  <div className="w-8 h-8 rounded-lg bg-white/10" />
                  <div className="w-8 h-8 rounded-lg bg-white/10" />
                </div>
              ))}
            </div>

            {/* Step Size Selector Skeleton */}
            <div className="flex justify-between space-x-1 pt-1">
              {['0.01', '0.1', '1.0', '10', 'Long'].map((s, idx) => (
                <div key={idx} className="flex-1 h-7 rounded bg-white/5 relative overflow-hidden skeleton-shimmer" />
              ))}
            </div>
          </div>

          {/* Waypoint List Skeleton */}
          <div className="flex-1 bg-[#12121a]/60 border border-white/5 rounded-2xl p-4 flex flex-col space-y-3 relative overflow-hidden backdrop-blur-xl">
            <div className="flex justify-between items-center">
              <div className="w-32 h-4 rounded bg-white/10 relative overflow-hidden skeleton-shimmer" />
              <div className="w-20 h-6 rounded bg-white/10 relative overflow-hidden skeleton-shimmer" />
            </div>

            {/* 3 Waypoint Table Rows */}
            <div className="flex-1 space-y-2 overflow-hidden">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-12 rounded-xl bg-white/5 border border-white/5 p-2 flex items-center justify-between relative overflow-hidden skeleton-shimmer"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-md bg-white/10" />
                    <div className="w-20 h-3 rounded bg-white/10" />
                  </div>
                  {/* Tool Action Placeholder */}
                  <div className="w-24 h-6 rounded-md bg-cyan-950/40 border border-cyan-800/20" />
                </div>
              ))}
            </div>

            {/* Run / E-Stop Bottom Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/30 relative overflow-hidden skeleton-shimmer" />
              <div className="h-10 rounded-xl bg-red-950/40 border border-red-800/30 relative overflow-hidden skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
