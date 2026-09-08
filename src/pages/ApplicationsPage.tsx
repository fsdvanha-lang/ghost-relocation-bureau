import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { Badge } from '../components/common/Badge';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { GhostDetailDrawer } from '../components/ghosts/GhostDetailDrawer';

export const ApplicationsPage: React.FC = () => {
  const {
    state,
    selectedGhost,
    selectGhost,
    assignManual,
    unassignGhost
  } = useBureau();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned' | 'urgent' | 'impossible'>('all');

  const filteredGhosts = useMemo(() => {
    return state.ghosts.filter(ghost => {
      // Поиск по имени или описанию
      const matchesSearch =
        ghost.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ghost.bio?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Фильтр статусов
      if (statusFilter === 'assigned') return !!ghost.assignedPlaceId;
      if (statusFilter === 'unassigned') return !ghost.assignedPlaceId;
      if (statusFilter === 'urgent') return ghost.deadlineHoursLeft <= 24;
      if (statusFilter === 'impossible') return ghost.status === 'impossible';

      return true;
    });
  }, [state.ghosts, searchQuery, statusFilter]);

  const selectedResult = selectedGhost ? state.allocation.ghostResults[selectedGhost.id] : null;

  return (
    <div className="space-y-5">
      {/* Top Controls: Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск привидения по имени или условиям..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Все ({state.ghosts.length})
          </button>
          <button
            onClick={() => setStatusFilter('assigned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'assigned'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Расселено
          </button>
          <button
            onClick={() => setStatusFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'urgent'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Срочные (&lt;24ч)
          </button>
          <button
            onClick={() => setStatusFilter('impossible')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'impossible'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Без мест
          </button>
        </div>
      </div>

      {/* Applications Table / Cards View */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3.5 px-4">Привидение</th>
                <th className="py-3.5 px-4">Тревожность</th>
                <th className="py-3.5 px-4">Температура</th>
                <th className="py-3.5 px-4">Дедлайн</th>
                <th className="py-3.5 px-4">Особые условия</th>
                <th className="py-3.5 px-4">Текущее / Реком. место</th>
                <th className="py-3.5 px-4">Скор</th>
                <th className="py-3.5 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGhosts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Заявок по заданным критериям не найдено
                  </td>
                </tr>
              ) : (
                filteredGhosts.map(ghost => {
                  const matchResult = state.allocation.ghostResults[ghost.id];
                  const activePlaceId = ghost.assignedPlaceId || matchResult?.recommendedPlaceId;
                  const activePlace = activePlaceId
                    ? state.places.find(p => p.id === activePlaceId)
                    : null;
                  const evaluation = activePlaceId
                    ? matchResult?.evaluations[activePlaceId]
                    : undefined;

                  return (
                    <tr
                      key={ghost.id}
                      onClick={() => selectGhost(ghost.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {ghost.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">#{ghost.id}</div>
                      </td>

                      {/* Anxiety */}
                      <td className="py-3.5 px-4">
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
                            ? 'Высокая'
                            : ghost.anxietyLevel === 'medium'
                            ? 'Средняя'
                            : 'Низкая'}
                        </Badge>
                      </td>

                      {/* Temp */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {ghost.preferredTemperature === 'freezing'
                          ? 'Ледяная'
                          : ghost.preferredTemperature === 'cold'
                          ? 'Холодная'
                          : ghost.preferredTemperature === 'cool'
                          ? 'Прохладная'
                          : ghost.preferredTemperature === 'moderate'
                          ? 'Умеренная'
                          : 'Тёплая'}
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4">
                        <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                      </td>

                      {/* Special requirements chips */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {ghost.specialRequirements.isolatedFromHumans && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[10px]">
                              Без людей
                            </span>
                          )}
                          {ghost.specialRequirements.requiresAttic && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[10px]">
                              Чердак
                            </span>
                          )}
                          {ghost.specialRequirements.requiresCellar && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[10px]">
                              Подвал
                            </span>
                          )}
                          {ghost.specialRequirements.noMirrors && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[10px]">
                              Без зеркал
                            </span>
                          )}
                          {ghost.specialRequirements.likesDampness && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40 text-[10px]">
                              Сырость
                            </span>
                          )}
                          {ghost.specialRequirements.prefersSilence && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 text-[10px]">
                              Тишина
                            </span>
                          )}
                          {Object.keys(ghost.specialRequirements).length === 0 && (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Relocation Destination */}
                      <td className="py-3.5 px-4">
                        {activePlace ? (
                          <div>
                            <span className="font-medium text-slate-200">{activePlace.name}</span>
                            <div className="text-[11px]">
                              {ghost.assignedPlaceId ? (
                                <span className="text-emerald-400 font-medium">
                                  {ghost.manualOverride ? 'Назначено вручную' : 'Расселено авто'}
                                </span>
                              ) : (
                                <span className="text-indigo-400">Рекомендация</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-rose-400 font-medium">Невозможно расселить</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4">
                        {evaluation ? (
                          <ScoreBadge
                            score={evaluation.score}
                            isEligible={evaluation.isEligible}
                            size="sm"
                          />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            selectGhost(ghost.id);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700/60"
                        >
                          Подробнее
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ghost Detail Drawer */}
      <GhostDetailDrawer
        ghost={selectedGhost}
        places={state.places}
        evaluations={selectedResult?.evaluations || {}}
        placeOccupants={state.allocation.placeOccupants}
        recommendedPlaceId={selectedResult?.recommendedPlaceId || null}
        displacementReason={selectedResult?.displacementReason}
        impossibleReasons={selectedResult?.impossibleReasons}
        isOpen={!!selectedGhost}
        onClose={() => selectGhost(null)}
        onManualAssign={assignManual}
        onUnassign={unassignGhost}
      />
    </div>
  );
};
