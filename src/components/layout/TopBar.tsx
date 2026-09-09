import React, { useState, useEffect } from 'react';
import { useBureau } from '../../context/BureauContext';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/audioSystem';
import { useToast } from '../common/ToastContext';
import { AtmosphereWidget } from '../common/AtmosphereWidget';

export const TopBar: React.FC = () => {
  const { state, stats, resetToSeed } = useBureau();
  const { showToast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(sound.getIsEnabled());
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s} GMT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const newState = sound.toggleMute();
    setSoundEnabled(newState);
    showToast({
      type: 'info',
      title: newState ? 'Звуковые эффекты включены' : 'Звуковые эффекты отключены',
      message: newState ? 'Тактильные отклики и звуковые сигналы активны' : 'Тихий режим'
    });
  };

  const handleReset = () => {
    sound.playClick();
    resetToSeed();
    showToast({
      type: 'reset',
      title: 'Данные сброшены',
      message: 'Реестр и назначения возвращены к исходным значениям'
    });
  };

  const titles: Record<string, string> = {
    dashboard: 'Центр решений',
    applications: 'Заявки привидений',
    places: 'Места переселения',
    decisions: 'Решения оператора',
    worklog: 'AI Worklog'
  };

  const currentTitle = titles[state.activeView] || 'Бюро переселения';

  return (
    <header className="h-14 bg-[#08080a]/90 backdrop-blur-md border-b border-white/[0.08] px-5 lg:px-7 flex items-center justify-between sticky top-0 z-50 select-none">
      {/* Left: View Title & Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-xs font-display font-black text-[#F3F3F0] uppercase tracking-[0.16em] truncate">
          {currentTitle}
        </h1>
        <span className="hidden md:inline text-[10px] text-[#7B7B78] font-mono uppercase tracking-wider border-l border-white/[0.1] pl-3">
          Ghost Relocation Bureau
        </span>
      </div>

      {/* Center: Occult Clock & Live Atmosphere Widget */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-[#9E9E9A]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[#F3F3F0] font-semibold">{timeStr}</span>
        </div>
        <AtmosphereWidget />
      </div>

      {/* Right: Sound FX Toggle, Status Pills, and Reset */}
      <div className="flex items-center gap-2.5 text-xs font-heading">
        {/* Sound FX Toggle (Web Audio API) */}
        <button
          onClick={handleToggleSound}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-mono transition-all cursor-pointer ${
            soundEnabled 
              ? 'bg-white/[0.06] text-[#F3F3F0] border-white/20 hover:bg-white/10 hover:border-white/30' 
              : 'bg-black/40 text-[#7B7B78] border-white/[0.06] hover:text-[#F3F3F0]'
          }`}
          title={soundEnabled ? 'Отключить звуковые эффекты (Web Audio API)' : 'Включить звуковые эффекты'}
          aria-label={soundEnabled ? 'Отключить звуковые эффекты' : 'Включить звуковые эффекты'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Звук</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-[#7B7B78]" />
              <span className="hidden sm:inline">Без звука</span>
            </>
          )}
        </button>

        {/* System Health Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#121217] border border-white/[0.08] rounded-full text-[#7B7B78]">
          <span className={`w-1.5 h-1.5 rounded-full ${stats.needsAttentionCount > 0 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} />
          <span className="font-semibold text-[#F3F3F0] text-[11px] tracking-wide">
            {stats.relocatedCount}/{stats.totalGhosts} расселено
          </span>
        </div>

        {/* Quick Reset */}
        <button
          onClick={handleReset}
          className="p-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-[#7B7B78] hover:text-[#F3F3F0] border border-white/[0.06] transition-colors cursor-pointer"
          title="Сбросить состояние к исходному"
          aria-label="Сбросить состояние к исходному"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
