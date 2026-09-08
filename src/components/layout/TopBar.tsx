import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useBureau } from '../../context/BureauContext';

export const TopBar: React.FC = () => {
  const { state, stats } = useBureau();

  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Обзор бюро',
      subtitle: 'Главная панель мониторинга распределения и критических дедлайнов'
    },
    applications: {
      title: 'Заявки привидений',
      subtitle: 'Реестр входящих заявлений, аудит условий и распределение по локациям'
    },
    places: {
      title: 'Места переселения',
      subtitle: 'Каталог доступных локаций, физические параметры и мониторинг емкости'
    },
    decisions: {
      title: 'Сводка решений',
      subtitle: 'Аналитический отчет по автоматическим и ручным назначениям'
    },
    worklog: {
      title: 'AI Worklog',
      subtitle: 'Журнал разработки, анализ решений оператора, рефлексия AI и roadmap'
    }
  };

  const current = titles[state.activeView] || titles.dashboard;

  return (
    <header className="h-16 bg-slate-900/70 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span>{current.title}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
            v1.0-prod
          </span>
        </h2>
        <p className="text-xs text-slate-400">{current.subtitle}</p>
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Загрузка мест:</span>
          <span className="font-mono font-semibold text-slate-200">{stats.occupancyPercent}%</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Расселено:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {stats.relocatedCount} / {stats.totalGhosts}
          </span>
        </div>

        {stats.needsAttentionCount > 0 ? (
          <div className="flex items-center gap-1.5 text-xs bg-amber-950/70 text-amber-300 border border-amber-800/60 px-3 py-1.5 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-medium">Внимание: {stats.needsAttentionCount}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Все стабильно</span>
          </div>
        )}
      </div>
    </header>
  );
};
