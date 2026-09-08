import React from 'react';
import { useBureau } from '../../context/BureauContext';
import { MapPin, AlertTriangle } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { state, stats } = useBureau();

  // On dashboard, the header banner with greeting & tools is rendered directly on the page
  if (state.activeView === 'dashboard') {
    return null;
  }

  const titles: Record<string, string> = {
    applications: 'Заявки привидений',
    places: 'Места переселения',
    decisions: 'Решения оператора',
    worklog: 'AI Worklog'
  };

  const currentTitle = titles[state.activeView] || 'Бюро переселения';

  return (
    <header className="h-14 bg-[#0d121d] border-b border-[#1a2234] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      <div>
        <h1 className="text-sm font-bold text-slate-100 tracking-tight">
          {currentTitle}
        </h1>
      </div>

      {/* Compact indicators */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141b2c] border border-[#212d46] rounded-full text-slate-300">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span className="font-bold text-white">{stats.availableSlots}</span>
          <span className="text-slate-400">свободных мест</span>
        </div>

        {stats.needsAttentionCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141b2c] border border-[#212d46] rounded-full text-amber-400">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="font-bold">{stats.needsAttentionCount}</span>
            <span className="text-amber-300/80">требуют внимания</span>
          </div>
        )}
      </div>
    </header>
  );
};
