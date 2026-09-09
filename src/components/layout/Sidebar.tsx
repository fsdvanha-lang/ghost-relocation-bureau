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
import { sound } from '../../utils/audioSystem';

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
    <aside className="w-16 md:w-64 bg-[#0b0b0e] border-r border-white/[0.07] flex flex-col shrink-0 h-screen sticky top-0 select-none z-20 transition-all duration-300">
      {/* Brand Header with glowing Monogram */}
      <div className="h-16 px-3 md:px-5 flex items-center justify-center md:justify-start border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <GhostAvatar size="sm" className="w-8 h-8 ring-1 ring-white/20 shadow-[0_0_15px_rgba(255,255,255,0.15)] shrink-0" />
          <div className="hidden md:flex flex-col">
            <span className="font-display font-extrabold text-[#F3F3F0] text-xs tracking-tight leading-tight uppercase">
              Бюро переселения
            </span>
            <span className="font-heading text-[10px] text-[#7B7B78] tracking-[0.16em] uppercase font-semibold leading-tight mt-0.5">
              привидений
            </span>
          </div>
        </div>
      </div>

      {/* Navigation with sleek shared moving active indicator */}
      <nav className="p-2 md:p-3 space-y-1.5 flex-1 overflow-y-auto relative">
        {/* Single physical active indicator that smoothly travels between items */}
        <div 
          className="absolute left-0 w-1 rounded-r bg-[#F3F3F0] shadow-[0_0_12px_rgba(243,243,240,0.7)] transition-transform duration-260 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            height: '24px',
            top: '20px',
            transform: `translateY(${Math.max(0, navItems.findIndex(i => i.id === state.activeView)) * 46}px)`
          }}
        />

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.activeView === item.id;
          return (
            <div key={item.id} className="relative w-full h-[40px]">
              <button
                onClick={() => {
                  sound.playClick();
                  setView(item.id);
                }}
                title={item.label}
                aria-label={item.label}
                className={`w-full h-full flex items-center justify-center md:justify-between px-2.5 md:px-3 py-2 rounded-xl text-xs font-heading font-medium tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#15151b] text-[#F3F3F0] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] font-semibold border border-white/[0.12]'
                    : 'text-[#7B7B78] hover:text-[#F3F3F0] hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-center md:justify-start gap-3 w-full">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-[#F3F3F0]' : 'text-[#525250]'}`} />
                  <span className="hidden md:inline truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors duration-200 ${
                    isActive 
                      ? 'bg-white/15 text-[#F3F3F0] font-bold border border-white/20' 
                      : 'bg-white/[0.04] text-[#7B7B78] border border-white/[0.05]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Pinned Bottom Section: Illustration card + Reset button */}
      <div className="shrink-0 mt-auto">
        <div className="hidden md:block">
          <SidebarGhostIllustration />
        </div>

        {/* Reset button discreetly at bottom */}
        <div className="px-2 md:px-3 pb-3 border-t border-white/[0.07] pt-2.5">
          <button
            onClick={() => {
              sound.playClick();
              handleReset();
            }}
            className="w-full flex items-center justify-center gap-2 px-2 md:px-3 py-2 text-[#7B7B78] hover:text-[#F3F3F0] rounded-xl text-[11px] font-heading font-semibold uppercase tracking-wider transition-all hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] cursor-pointer"
            title="Сбросить все назначения к начальным данным"
            aria-label="Сбросить все назначения к начальным данным"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Сбросить данные</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
