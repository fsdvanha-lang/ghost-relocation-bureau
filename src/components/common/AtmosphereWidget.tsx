import React, { useState, useRef, useEffect } from 'react';
import { useEnvironment } from '../../services/environment/environment.adapter';
import { RefreshCw, ExternalLink, Moon, Sunset, Sunrise, Compass, Check, AlertCircle } from 'lucide-react';

export const AtmosphereWidget: React.FC = () => {
  const { data, isSyncing, refresh } = useEnvironment();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return;
    await refresh();
  };

  const isFallback = data.status === 'fallback';

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* 1. Ultra-Compact TopBar Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer border select-none ${
          isOpen
            ? 'bg-white/[0.1] text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.1)]'
            : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#D4D4D0] border-white/[0.08] hover:border-white/20'
        }`}
        title="Атмосферный монитор убежища (фаза Луны и сумерки)"
        aria-label="Атмосферный монитор убежища: фаза Луны и сумерки"
        aria-expanded={isOpen}
      >
        {/* Styled moon symbol */}
        <span className="text-sm leading-none filter drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]">
          {data.moon.symbol}
        </span>

        {/* Phase illumination (Ultra-compact per user requirement) */}
        <span className="text-[#F3F3F0] font-semibold tracking-wide">
          {data.moon.illuminationPercent}%
        </span>

        {/* Status Dot: Syncing / Synced / Fallback */}
        <span className="flex items-center ml-0.5">
          {isSyncing ? (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" title="Синхронизация..." />
          ) : isFallback ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" title="Автономный режим" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" title="Синхронизировано" />
          )}
        </span>
      </button>

      {/* 2. Detailed Secondary Popover (High contrast, fully opaque, spacious layout) */}
      {isOpen && (
        <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2.5 w-[355px] bg-[#0c0c11] border border-white/[0.14] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.98)] p-5 z-[100] text-xs font-heading text-[#F3F3F0] select-none animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Location */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-3 mb-3.5">
            <div>
              <div className="flex items-center gap-1.5 text-[#F3F3F0] text-xs font-heading font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{data.locationName}</span>
              </div>
              <div className="text-[10px] text-[#787875] font-mono mt-0.5">
                56.49°N, 4.20°W · Атмосфера среды
              </div>
            </div>

            {/* Sync Badge */}
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border flex items-center gap-1.5 ${
              isSyncing
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                : isFallback
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              {isSyncing ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : isFallback ? (
                <>
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>Автономный</span>
                </>
              ) : (
                <>
                  <Check className="w-2.5 h-2.5" />
                  <span>Synced</span>
                </>
              )}
            </div>
          </div>

          {/* Grid of live atmospheric parameters */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {/* Lunar Data Card */}
            <div className="bg-[#121217] border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-purple-300/80 mb-1.5">
                  <Moon className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>Фаза Луны</span>
                </div>
                <div className="text-xs font-heading font-bold text-white flex items-center gap-1.5">
                  <span className="text-sm">{data.moon.symbol}</span>
                  <span className="truncate">{data.moon.label}</span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#A3A3A0]">
                  <span>Освещенность</span>
                  <span className="text-white font-semibold">{data.moon.illuminationPercent}%</span>
                </div>
                <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-sky-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, Math.min(100, data.moon.illuminationPercent))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Solar / Twilight Card */}
            <div className="bg-[#121217] border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-300/80 mb-1.5">
                  <Sunset className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Сумерки & Солнце</span>
                </div>
                <div className="space-y-1.5 mt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#A3A3A0] flex items-center gap-1">
                      <Sunset className="w-2.5 h-2.5 text-amber-400/80" />
                      <span>Закат</span>
                    </span>
                    <span className="text-amber-200 font-bold">{data.sun.sunset}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#A3A3A0] flex items-center gap-1">
                      <Sunrise className="w-2.5 h-2.5 text-amber-400/80" />
                      <span>Восход</span>
                    </span>
                    <span className="text-[#D4D4D0] font-semibold">{data.sun.sunrise}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Moon Ephemeris Times */}
          <div className="bg-[#121217]/70 border border-white/[0.05] rounded-xl px-3.5 py-2 mb-3.5 text-[10px] font-mono text-[#9E9E9A] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-[#787875]">Восход Луны:</span>
              <strong className="text-[#F3F3F0]">{data.sun.moonrise}</strong>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#787875]">Заход Луны:</span>
              <strong className="text-[#F3F3F0]">{data.sun.moonset}</strong>
            </span>
          </div>

          {/* Footer Controls & Open-Meteo Attribution */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
            {/* Attribution Link (Mandatory) */}
            <a
              href={data.attribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-[#787875] hover:text-purple-300 transition-colors flex items-center gap-1"
              title="Open-Meteo Astronomy API (Free API limits: up to 10,000 requests/day, non-commercial prototype)"
            >
              <span>{data.attribution.source}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-[#D4D4D0] hover:text-white text-[10px] font-mono border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Обновить</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
