import React from 'react';
import { Scale, Sparkles, UserCheck, ShieldAlert, TrendingUp } from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { Badge } from '../components/common/Badge';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const DecisionsPage: React.FC = () => {
  const { state, stats, selectGhost, runAutoAllocation } = useBureau();

  // Находим самые перегруженные места
  const overloadedPlaces = [...state.places]
    .map(place => {
      const occupants = state.allocation.placeOccupants[place.id] || [];
      const percent = Math.round((occupants.length / place.capacity) * 100);
      return { place, occupantsCount: occupants.length, percent };
    })
    .sort((a, b) => b.percent - a.percent);

  // Заявки с ручными назначениями
  const manualAssignments = state.ghosts.filter(g => g.manualOverride && g.assignedPlaceId);

  // Критичные и проблемные заявки
  const criticalGhosts = state.ghosts.filter(
    g => g.deadlineHoursLeft <= 24 || g.status === 'impossible' || !g.assignedPlaceId
  );

  return (
    <div className="space-y-6">
      {/* Overview Analytics Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <span>Итоговый отчет по решениям переселения</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Сводная статистика работы бюро, аудит ручных оверрайдов и оценка эффективности алгоритма
            </p>
          </div>
          <button
            onClick={runAutoAllocation}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-950/40 transition-colors shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Пересчитать распределение</span>
          </button>
        </div>

        {/* 6 Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Всего привидений</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">{stats.totalGhosts}</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Расселено авто</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{stats.relocatedAutoCount}</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Расселено вручную</span>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">{stats.relocatedManualCount}</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Осталось без места</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">{stats.unassignedCount}</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Критичные заявки</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">{stats.needsAttentionCount}</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Средний скор</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">{stats.averageScore}/100</div>
          </div>
        </div>
      </div>

      {/* Two Columns: Overloaded Places & Manual Overrides Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Overloaded Habitats (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>Самые перегруженные локации</span>
          </h4>
          <div className="space-y-2">
            {overloadedPlaces.slice(0, 5).map(({ place, occupantsCount, percent }) => (
              <div
                key={place.id}
                className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{place.name}</span>
                  <span className="font-mono font-bold text-slate-300">
                    {occupantsCount} / {place.capacity} ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      percent >= 100 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Overrides Log (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Журнал ручных решений оператора ({manualAssignments.length})</span>
          </h4>
          <div className="space-y-2">
            {manualAssignments.length === 0 ? (
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                Все назначения в бюро выполнены автоматически. Ручных оверрайдов не зафиксировано.
              </div>
            ) : (
              manualAssignments.map(ghost => {
                const place = state.places.find(p => p.id === ghost.assignedPlaceId);
                const evalResult = ghost.assignedPlaceId
                  ? state.allocation.ghostResults[ghost.id]?.evaluations[ghost.assignedPlaceId]
                  : null;

                return (
                  <div
                    key={ghost.id}
                    onClick={() => selectGhost(ghost.id)}
                    className="p-3.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-xs">{ghost.name}</span>
                        <span className="text-[11px] text-slate-400">→</span>
                        <span className="font-medium text-indigo-300 text-xs">{place?.name}</span>
                        <Badge variant="purple" size="sm">Ручной выбор</Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Обоснование: <em className="text-slate-300">{ghost.manualOverrideReason}</em>
                      </p>
                    </div>
                    {evalResult && (
                      <ScoreBadge
                        score={evalResult.score}
                        isEligible={evalResult.isEligible}
                        size="sm"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Critical & Unresolved Applications Table */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Проблемные и нераспределенные заявки ({criticalGhosts.length})</span>
        </h4>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[11px] uppercase font-semibold">
                <th className="py-3 px-4">Привидение</th>
                <th className="py-3 px-4">Дедлайн</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4">Причина проблемы</th>
                <th className="py-3 px-4 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {criticalGhosts.map(ghost => {
                const matchResult = state.allocation.ghostResults[ghost.id];
                return (
                  <tr
                    key={ghost.id}
                    onClick={() => selectGhost(ghost.id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-100">{ghost.name}</td>
                    <td className="py-3 px-4">
                      <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          ghost.status === 'impossible'
                            ? 'danger'
                            : ghost.assignedPlaceId
                            ? 'success'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {ghost.status === 'impossible'
                          ? 'Невозможно'
                          : ghost.assignedPlaceId
                          ? 'Расселено'
                          : 'Ожидает'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {matchResult?.impossibleReasons?.[0] ||
                        (ghost.deadlineHoursLeft < 0
                          ? 'Дедлайн просрочен'
                          : 'Требуется подтверждение')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          selectGhost(ghost.id);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                      >
                        Разобрать
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
