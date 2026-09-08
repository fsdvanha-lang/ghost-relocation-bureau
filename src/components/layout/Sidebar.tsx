import React from 'react';
import { 
  Home, 
  FileText, 
  Calendar, 
  Sliders, 
  Bot,
  RotateCcw
} from 'lucide-react';
import { useBureau } from '../../context/BureauContext';
import { GhostAvatar } from '../common/GhostAvatar';
import { SidebarGhostIllustration } from './SidebarGhostIllustration';
import { useToast } from '../common/ToastContext';

export const Sidebar: React.FC = () => {
  const { state, setView, resetToSeed } = useBureau();
  const { showToast } = useToast();

  const handleReset = () => {
    resetToSeed();
    showToast({
      type: 'reset',
      title: 'Данные сброшены',
      message: 'Реестр и назначения возвращены к исходным значениям'
    });
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Обзор',
      icon: Home,
    },
    {
      id: 'applications' as const,
      label: 'Заявки',
      icon: FileText,
      badge: `${state.ghosts.length}`,
    },
    {
      id: 'places' as const,
      label: 'Места переселения',
      icon: Calendar,
      badge: `${state.places.length}`,
    },
    {
      id: 'decisions' as const,
      label: 'Решения',
      icon: Sliders,
    },
    {
      id: 'worklog' as const,
      label: 'AI Worklog',
      icon: Bot,
    }
  ];

  return (
    <aside className="w-64 bg-[#0d121d] border-r border-[#1a2234] flex flex-col shrink-0 h-screen sticky top-0 select-none z-20">
      {/* Brand Header with cute Glowing Ghost Avatar */}
      <div className="h-16 px-5 flex items-center border-b border-[#1a2234]">
        <div className="flex items-center gap-3">
          <GhostAvatar size="sm" className="w-8 h-8 shadow-[0_0_12px_rgba(59,130,246,0.3)]" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-100 text-xs tracking-tight leading-tight">
              Бюро переселения
            </span>
            <span className="text-[11px] text-slate-400 font-normal leading-tight">
              привидений
            </span>
          </div>
        </div>
      </div>

      {/* Navigation with sleek left active pill micro-animation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.activeView === item.id;
          return (
            <div key={item.id} className="relative w-full">
              {/* Active bar indicator */}
              <span 
                className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 rounded-r bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-200 ${
                  isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
                }`} 
              />
              <button
                onClick={() => setView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-180 ${
                  isActive
                    ? 'bg-[#1a2337] text-white shadow-sm font-semibold border border-[#25334d]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131b2b]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors duration-180 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full transition-colors duration-180 ${
                    isActive 
                      ? 'bg-blue-500/20 text-blue-300 font-bold' 
                      : 'bg-[#1c2438] text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom Illustration from mockup */}
      <SidebarGhostIllustration />

      {/* Reset button discreetly at bottom */}
      <div className="px-3 pb-3 border-t border-[#1a2234] pt-2">
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-slate-500 hover:text-slate-300 rounded-lg text-[11px] transition-colors hover:bg-[#131b2b]"
          title="Сбросить все назначения к начальным данным"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Сбросить данные</span>
        </button>
      </div>
    </aside>
  );
};
