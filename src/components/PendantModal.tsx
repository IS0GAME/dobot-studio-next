import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Smartphone, X, Copy, Check, ExternalLink, Wifi, RefreshCw, Globe } from 'lucide-react';

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
  const [selectedIp, setSelectedIp] = useState('127.0.0.1');
  const [availableIps, setAvailableIps] = useState<string[]>(['127.0.0.1']);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fullUrl = `http://${selectedIp}:${port}/`;

  // Fetch true LAN IPv4 from local backend
  useEffect(() => {
    let isMounted = true;
    async function detectNetwork() {
      try {
        const res = await fetch('/api/network-info');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const ips = (data.ips && data.ips.length > 0) ? data.ips : [];
            const allIps = Array.from(new Set([...ips, '127.0.0.1']));
            setAvailableIps(allIps);
            if (data.defaultIp && data.defaultIp !== '127.0.0.1') {
              setSelectedIp(data.defaultIp);
            } else if (allIps.length > 0) {
              setSelectedIp(allIps[0]);
            }
          }
        }
      } catch (_) {
        // Fallback: check window.location.hostname
        if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') {
          if (isMounted) {
            setSelectedIp(window.location.hostname);
            setAvailableIps([window.location.hostname, '127.0.0.1']);
          }
        }
      }
    }

    if (isOpen) {
      detectNetwork();
    }
    return () => { isMounted = false; };
  }, [isOpen, port]);

  // Generate real, 100% compliant, scannable QR Code SVG
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    QRCode.toString(fullUrl, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#090d16',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((svgString) => {
        if (isMounted) {
          setQrSvg(svgString);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate real QR Code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => { isMounted = false; };
  }, [fullUrl]);

  // Keyboard shortcut: Escape to close
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
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenBrowser = () => {
    window.open(fullUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#11131c]/95 border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white font-sans">
                Wireless Teach Pendant
              </h3>
              <p className="text-xs text-zinc-400">
                Scan with any smartphone camera to open Wireless Pendant PWA
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
        <div className="my-3.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-between text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">WebSocket Telemetry Active</span>
          </div>
          <span className="font-mono text-[11px] opacity-80">Port {port}</span>
        </div>

        {/* Real Vector SVG QR Code Container */}
        <div className="flex flex-col items-center justify-center py-1">
          <div className="w-52 h-52 p-3 bg-white rounded-2xl shadow-xl border border-zinc-200 flex items-center justify-center overflow-hidden">
            {qrSvg ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400 text-xs">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                <span>Generating QR...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2.5">
            <Wifi size={13} className="text-cyan-400" />
            <span>Connect smartphone to same Wi-Fi network</span>
          </div>
        </div>

        {/* Network IP Selector / Target Address */}
        <div className="mt-3.5 flex flex-col gap-1.5">
          {availableIps.length > 1 && (
            <div className="flex items-center gap-1.5 mb-1 overflow-x-auto pb-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-500">Host IP:</span>
              {availableIps.map((ip) => (
                <button
                  key={ip}
                  onClick={() => setSelectedIp(ip)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all border ${
                    selectedIp === ip
                      ? 'bg-blue-600/30 border-blue-500/50 text-cyan-300 font-bold'
                      : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  {ip === '127.0.0.1' ? '127.0.0.1 (Local)' : `${ip} (LAN)`}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-zinc-200 select-all truncate">
              {fullUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                copied
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
              }`}
              title="Copy URL to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={handleOpenBrowser}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <ExternalLink size={13} />
            <span>Open in Browser</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
