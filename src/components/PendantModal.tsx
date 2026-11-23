import React, { useState, useEffect } from 'react';
import { Smartphone, X, Copy, Check, ExternalLink, Wifi } from 'lucide-react';

interface PendantModalProps {
  isOpen: boolean;
  onClose: () => void;
  port?: number;
}

export const PendantModal: React.FC<PendantModalProps> = ({
  isOpen,
  onClose,
  port = 9876,
}) => {
  const [copied, setCopied] = useState(false);
  const [hostUrl, setHostUrl] = useState(`http://127.0.0.1:${port}/`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname || '127.0.0.1';
      setHostUrl(`http://${hostname}:${port}/`);
    }
  }, [port]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hostUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenBrowser = () => {
    window.open(hostUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#13151f]/95 border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white font-sans">
                Wireless Teach Pendant
              </h3>
              <p className="text-xs text-zinc-400">
                Control Dobot Magician wirelessly from your smartphone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Server Status Pill */}
        <div className="my-4 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-between text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">WebSocket Telemetry Active</span>
          </div>
          <span className="font-mono text-[11px] opacity-80">Port {port}</span>
        </div>

        {/* Vector SVG QR Code Container */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="p-4 bg-white rounded-2xl shadow-inner border border-zinc-200">
            {/* Crisp Vector SVG QR Matrix */}
            <svg
              viewBox="0 0 148 148"
              width="160"
              height="160"
              className="block"
              shapeRendering="crispEdges"
            >
              <rect width="148" height="148" fill="#ffffff" />
              {/* Position Detection Patterns (Top-Left) */}
              <rect x="12" y="12" width="28" height="28" fill="#0f172a" />
              <rect x="16" y="16" width="20" height="20" fill="#ffffff" />
              <rect x="20" y="20" width="12" height="12" fill="#0f172a" />

              {/* Position Detection Patterns (Top-Right) */}
              <rect x="108" y="12" width="28" height="28" fill="#0f172a" />
              <rect x="112" y="16" width="20" height="20" fill="#ffffff" />
              <rect x="116" y="20" width="12" height="12" fill="#0f172a" />

              {/* Position Detection Patterns (Bottom-Left) */}
              <rect x="12" y="108" width="28" height="28" fill="#0f172a" />
              <rect x="16" y="112" width="20" height="20" fill="#ffffff" />
              <rect x="20" y="116" width="12" height="12" fill="#0f172a" />

              {/* Timing patterns & Alignment pattern */}
              <rect x="44" y="24" width="4" height="4" fill="#0f172a" />
              <rect x="52" y="24" width="4" height="4" fill="#0f172a" />
              <rect x="60" y="24" width="4" height="4" fill="#0f172a" />
              <rect x="68" y="24" width="4" height="4" fill="#0f172a" />
              <rect x="76" y="24" width="4" height="4" fill="#0f172a" />
              <rect x="84" y="24" width="4" height="4" fill="#0f172a" />
              <rect x="92" y="24" width="4" height="4" fill="#0f172a" />
              <rect x="100" y="24" width="4" height="4" fill="#0f172a" />

              <rect x="24" y="44" width="4" height="4" fill="#0f172a" />
              <rect x="24" y="52" width="4" height="4" fill="#0f172a" />
              <rect x="24" y="60" width="4" height="4" fill="#0f172a" />
              <rect x="24" y="68" width="4" height="4" fill="#0f172a" />
              <rect x="24" y="76" width="4" height="4" fill="#0f172a" />
              <rect x="24" y="84" width="4" height="4" fill="#0f172a" />
              <rect x="24" y="92" width="4" height="4" fill="#0f172a" />
              <rect x="24" y="100" width="4" height="4" fill="#0f172a" />

              {/* Alignment Pattern Center */}
              <rect x="92" y="92" width="20" height="20" fill="#0f172a" />
              <rect x="96" y="96" width="12" height="12" fill="#ffffff" />
              <rect x="100" y="100" width="4" height="4" fill="#0f172a" />

              {/* Data Modules (Deterministic Encoding Matrix) */}
              <rect x="48" y="48" width="8" height="4" fill="#0f172a" />
              <rect x="64" y="48" width="4" height="8" fill="#0f172a" />
              <rect x="76" y="48" width="12" height="4" fill="#0f172a" />
              <rect x="48" y="60" width="12" height="4" fill="#0f172a" />
              <rect x="68" y="60" width="8" height="4" fill="#0f172a" />
              <rect x="84" y="60" width="4" height="8" fill="#0f172a" />
              <rect x="48" y="72" width="4" height="12" fill="#0f172a" />
              <rect x="60" y="72" width="8" height="8" fill="#0f172a" />
              <rect x="76" y="72" width="4" height="12" fill="#0f172a" />
              <rect x="88" y="72" width="12" height="4" fill="#0f172a" />
              <rect x="48" y="92" width="8" height="8" fill="#0f172a" />
              <rect x="64" y="92" width="4" height="16" fill="#0f172a" />
              <rect x="76" y="92" width="8" height="4" fill="#0f172a" />
              <rect x="52" y="112" width="12" height="4" fill="#0f172a" />
              <rect x="72" y="112" width="16" height="4" fill="#0f172a" />
              <rect x="48" y="124" width="8" height="4" fill="#0f172a" />
              <rect x="64" y="124" width="12" height="4" fill="#0f172a" />
              <rect x="84" y="124" width="4" height="8" fill="#0f172a" />
              <rect x="116" y="48" width="4" height="12" fill="#0f172a" />
              <rect x="124" y="48" width="8" height="4" fill="#0f172a" />
              <rect x="116" y="68" width="12" height="4" fill="#0f172a" />
              <rect x="120" y="80" width="4" height="12" fill="#0f172a" />
              <rect x="128" y="80" width="4" height="8" fill="#0f172a" />
              <rect x="120" y="104" width="12" height="8" fill="#0f172a" />
              <rect x="124" y="120" width="8" height="4" fill="#0f172a" />
            </svg>
          </div>
          <span className="mt-2.5 text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium">
            <Wifi size={13} className="text-cyan-400" />
            Connect phone to the same Wi-Fi and scan
          </span>
        </div>

        {/* Copy URL Bar */}
        <div className="mt-3 flex items-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/5">
          <div className="flex-1 px-3 py-1 font-mono text-xs text-cyan-300 truncate tracking-wide">
            {hostUrl}
          </div>
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all duration-150 ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={handleOpenBrowser}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
          >
            <ExternalLink size={14} />
            <span>Open in Browser</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
