import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Castle, 
  Activity, 
  Sparkles, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { Badge } from '../components/common/Badge';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const DashboardPage: React.FC = () => {
  const { state, stats, selectGhost, setView, runAutoAllocation } = useBureau();

  // Отбираем проблемные и приоритетные заявки (дедлайн < 24ч, просрочено, невозможно или не расселено)
  const priorityGhosts = state.ghosts
    .filter(g => g.deadlineHoursLeft <= 24 || g.status === 'impossible' || g.status === 'needs_attention')
    .sort((a, b) => a.deadlineHoursLeft - b.deadlineHoursLeft);

  const kpis = [
    {
      label: 'Всего заявок',
      value: stats.totalGhosts,
      subtext: 'В реестре бюро',
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/40',
      borderColor: 'border-indigo-800/40'
    },
    {
      label: 'Расселено',
      value: `${stats.relocatedCount}`,
      subtext: `${stats.relocatedAutoCount} авто / ${stats.relocatedManualCount} вручную`,
      icon: UserCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/40'
    },
    {
      label: 'Без места',
      value: stats.unassignedCount,
      subtext: `Из них ${stats.impossibleCount} невозможно`,
      icon: UserX,
      color: 'text-slate-400',
      bgColor: 'bg-slate-900/60',
      borderColor: 'border-slate-800'
    },
    {
      label: 'Требуют внимания',
      value: stats.needsAttentionCount,
      subtext: 'Срочные и спорные',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-800/40',
      highlight: stats.needsAttentionCount > 0
    },
    {
      label: 'Доступных мест',
      value: stats.availableSlots,
      subtext: `Из ${stats.totalCapacity} общих слотов`,
      icon: Castle,
      color: 'text-sky-400',
      bgColor: 'bg-sky-950/40',
      borderColor: 'border-sky-800/40'
    },
    {
      label: 'Загруженность мест',
      value: `${stats.occupancyPercent}%`,
      subtext: `Занято ${stats.totalOccupied} слотов`,
      icon: Activity,
      color: 'text-violet-400',
      bgColor: 'bg-violet-950/40',
      borderColor: 'border-violet-800/40'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Диспетчерский пульт
            </span>
            <span className="text-xs text-slate-400">
              Средний скор совместимости по бюро: <strong className="text-slate-200">{stats.averageScore}/100</strong>
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-100">
            Оптимизация расселения потока привидений
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl">
            Алгоритм автоматически балансирует мягкие предпочтения и жесткие ограничения с учетом дедлайнов и емкости локаций.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={runAutoAllocation}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Запустить авто-подбор</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border bg-slate-900/80 transition-all ${kpi.borderColor} ${
                kpi.highlight ? 'ring-1 ring-amber-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium line-clamp-1">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg ${kpi.bgColor} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
                {kpi.value}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{kpi.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Priority Queue & Place Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Priority Applications (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Приоритетные заявки (требуют внимания)
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {priorityGhosts.length}
              </span>
            </div>
            <button
              onClick={() => setView('applications')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Все заявки</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {priorityGhosts.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                Все срочные заявки успешно распределены и не требуют оперативного вмешательства.
              </div>
            ) : (
              priorityGhosts.map(ghost => {
                const result = state.allocation.ghostResults[ghost.id];
                const place = ghost.assignedPlaceId
                  ? state.places.find(p => p.id === ghost.assignedPlaceId)
                  : result?.recommendedPlaceId
                  ? state.places.find(p => p.id === result.recommendedPlaceId)
                  : null;

                let problemDescription = '';
                if (ghost.deadlineHoursLeft < 0) {
                  problemDescription = `Дедлайн просрочен на ${Math.abs(ghost.deadlineHoursLeft)} ч.! Срочно требуется ручное решение.`;
                } else if (result?.status === 'impossible') {
                  problemDescription = result.impossibleReasons?.[0] || 'Невозможно подобрать место из-за конфликта ограничений.';
                } else if (ghost.deadlineHoursLeft <= 24) {
                  problemDescription = `Критический дедлайн (<${ghost.deadlineHoursLeft} ч.). Требуется подтверждение назначения.`;
                } else {
                  problemDescription = 'Высокая тревожность привидения требует проверки локации.';
                }

                return (
                  <div
                    key={ghost.id}
                    className="p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100 text-sm">{ghost.name}</span>
                          <Badge
                            variant={
                              ghost.anxietyLevel === 'high'
                                ? 'danger'
                                : ghost.anxietyLevel === 'medium'
                                ? 'warning'
                                : 'success'
                            }
                            size="sm"
                          >
                            {ghost.anxietyLevel === 'high'
                              ? 'Высокая тревожность'
                              : ghost.anxietyLevel === 'medium'
                              ? 'Средняя тревожность'
                              : 'Низкая тревожность'}
                          </Badge>
                          <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                        </div>
                        <p className="text-xs text-amber-300/90 font-medium">
                          ⚠ {problemDescription}
                        </p>
                      </div>

                      <button
                        onClick={() => selectGhost(ghost.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium border border-slate-700 hover:border-transparent transition-all shrink-0"
                      >
                        Разобрать заявку
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/70 text-slate-400">
                      <div>
                        {place ? (
                          <span>
                            {ghost.assignedPlaceId ? 'Заселено в:' : 'Рекомендовано:'}{' '}
                            <strong className="text-slate-200 font-semibold">{place.name}</strong>
                          </span>
                        ) : (
                          <span className="text-rose-400">Место не назначено</span>
                        )}
                      </div>
                      {result?.evaluations && place && (
                        <ScoreBadge
                          score={result.evaluations[place.id]?.score || 0}
                          isEligible={result.evaluations[place.id]?.isEligible}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Places Occupancy Monitoring (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Castle className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Загруженность мест обитания
              </h3>
            </div>
            <button
              onClick={() => setView('places')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Все места</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {state.places.map(place => {
              const occupants = state.allocation.placeOccupants[place.id] || [];
              const percent = Math.round((occupants.length / place.capacity) * 100);
              const isFull = occupants.length >= place.capacity;

              let barColor = 'bg-emerald-500';
              if (percent > 85) barColor = 'bg-rose-500';
              else if (percent > 50) barColor = 'bg-amber-500';

              return (
                <div
                  key={place.id}
                  className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200 text-xs">{place.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({place.type})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-300">
                        {occupants.length} / {place.capacity}
                      </span>
                      {isFull ? (
                        <Badge variant="danger" size="sm">
                          Заполнено
                        </Badge>
                      ) : percent > 0 ? (
                        <Badge variant="warning" size="sm">
                          Частично
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          Свободно
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Visual progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
