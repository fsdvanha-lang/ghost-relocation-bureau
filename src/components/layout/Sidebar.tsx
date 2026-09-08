import React from 'react';
import { 
  LayoutDashboard, 
  ScrollText, 
  Castle, 
  Scale, 
  Bot, 
  RotateCcw, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useBureau } from '../../context/BureauContext';

export const Sidebar: React.FC = () => {
  const { state, setView, stats, resetToSeed, runAutoAllocation } = useBureau();

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Обзор',
      icon: LayoutDashboard,
      badge: stats.needsAttentionCount > 0 ? `${stats.needsAttentionCount}` : undefined,
      badgeVariant: 'warning' as const
    },
    {
      id: 'applications' as const,
      label: 'Заявки',
      icon: ScrollText,
      badge: `${stats.totalGhosts}`,
      badgeVariant: 'default' as const
    },
    {
      id: 'places' as const,
      label: 'Места переселения',
      icon: Castle,
      badge: `${stats.totalOccupied}/${stats.totalCapacity}`,
      badgeVariant: 'default' as const
    },
    {
      id: 'decisions' as const,
      label: 'Решения',
      icon: Scale,
      badge: `${stats.relocatedCount}`,
      badgeVariant: 'success' as const
    },
    {
      id: 'worklog' as const,
      label: 'AI Worklog',
      icon: Bot,
      highlight: true
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-950/50">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 text-sm tracking-tight leading-tight">
              Бюро Переселения
            </h1>
            <p className="text-xs text-slate-400 font-mono">Ghost Relocation OPS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Основное меню
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    item.badgeVariant === 'warning'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      : item.badgeVariant === 'success'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Action shortcuts */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Свободно мест:</span>
          <span className="font-mono font-medium text-slate-200">{stats.availableSlots} из {stats.totalCapacity}</span>
        </div>

        <button
          onClick={runAutoAllocation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-950/50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Авто-распределение</span>
        </button>

        <button
          onClick={resetToSeed}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium border border-slate-700/50 transition-colors"
          title="Сбросить все изменения к исходному датасету"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Сбросить данные к Seed</span>
        </button>

        {stats.needsAttentionCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-950/30 border border-amber-800/40 rounded-lg text-[11px] text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Требуют решения: {stats.needsAttentionCount} заявок</span>
          </div>
        )}
      </div>
    </aside>
  );
};
