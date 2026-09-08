import React from 'react';
import { useBureau } from '../../context/BureauContext';

export const TopBar: React.FC = () => {
  const { state, stats } = useBureau();

  const titles: Record<string, string> = {
    dashboard: 'Обзор бюро',
    applications: 'Заявки привидений',
    places: 'Места переселения',
    decisions: 'Решения',
    worklog: 'AI Worklog'
  };

  const currentTitle = titles[state.activeView] || 'Обзор бюро';

  return (
    <header className="h-14 bg-[#0e1012] border-b border-[#202326] px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-sm font-semibold text-zinc-200 tracking-tight">
          {currentTitle}
        </h1>
      </div>

      {/* Quiet, compact indicators */}
      <div className="flex items-center gap-5 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{stats.availableSlots} свободных мест</span>
        </div>

        {stats.needsAttentionCount > 0 ? (
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-medium">{stats.needsAttentionCount} требуют внимания</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span>Очередь чиста</span>
          </div>
        )}
      </div>
    </header>
  );
};
