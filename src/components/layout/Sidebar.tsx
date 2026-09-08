import React from 'react';
import { 
  LayoutDashboard, 
  ScrollText, 
  Castle, 
  Scale, 
  Bot,
  RotateCcw
} from 'lucide-react';
import { useBureau } from '../../context/BureauContext';

export const Sidebar: React.FC = () => {
  const { state, setView, stats, resetToSeed } = useBureau();

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Обзор',
      icon: LayoutDashboard,
      badge: stats.needsAttentionCount > 0 ? `${stats.needsAttentionCount}` : undefined,
    },
    {
      id: 'applications' as const,
      label: 'Заявки',
      icon: ScrollText,
    },
    {
      id: 'places' as const,
      label: 'Места',
      icon: Castle,
    },
    {
      id: 'decisions' as const,
      label: 'Решения',
      icon: Scale,
    },
    {
      id: 'worklog' as const,
      label: 'AI Worklog',
      icon: Bot,
    }
  ];

  return (
    <aside className="w-56 bg-[#0e1012] border-r border-[#202326] flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header - Clean & Minimal */}
      <div className="h-14 px-5 flex items-center border-b border-[#202326]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-semibold text-zinc-200">
            Б
          </div>
          <span className="font-semibold text-zinc-200 text-xs tracking-tight">
            Бюро переселения
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: Single quiet Reset action */}
      <div className="p-3 border-t border-[#202326]">
        <button
          onClick={resetToSeed}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-zinc-500 hover:text-zinc-300 rounded text-[11px] transition-colors"
          title="Сбросить все назначения к начальным данным"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Сбросить к исходным</span>
        </button>
      </div>
    </aside>
  );
};
