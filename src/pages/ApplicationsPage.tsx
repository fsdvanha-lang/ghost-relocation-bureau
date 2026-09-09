import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { GhostAvatar } from '../components/common/GhostAvatar';
import { sound } from '../utils/audioSystem';
import { getGhostFullReference } from '../utils/ghostMeta';
import { getResolutionStatus, getResolutionBadgeProps } from '../utils/statusSystem';

export const ApplicationsPage: React.FC = () => {
  const {
    state,
    selectGhost
  } = useBureau();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned' | 'urgent'>('all');

  const filteredGhosts = useMemo(() => {
    return state.ghosts.filter(ghost => {
      const matchesSearch =
        ghost.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ghost.bio?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'assigned') return !!ghost.assignedPlaceId;
      if (statusFilter === 'unassigned') return !ghost.assignedPlaceId;
      if (statusFilter === 'urgent') return ghost.deadlineHoursLeft <= 24;

      return true;
    });
  }, [state.ghosts, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F3F3F0] shadow-[0_0_8px_#F3F3F0]" />
            <span className="font-heading uppercase tracking-[0.16em] text-[10px] text-[#7B7B78] font-bold">
              Входящий поток
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-[#F3F3F0] tracking-tight uppercase">
            Заявки сущностей
          </h2>
          <p className="text-xs text-[#7B7B78] mt-0.5">
            Реестр входящих обращений и текущий статус распределения
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 text-[#7B7B78] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени..."
              className="w-full pl-9 pr-3 py-2 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#F3F3F0] placeholder-[#7B7B78] focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0e0e12] p-1 rounded-xl border border-white/[0.08] text-xs font-heading">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-[#F3F3F0] text-[#08080a] font-bold shadow-xs' : 'text-[#7B7B78] hover:text-[#F3F3F0]'
              }`}
            >
              Все ({state.ghosts.length})
            </button>
            <button
              onClick={() => setStatusFilter('assigned')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'assigned' ? 'bg-[#F3F3F0] text-[#08080a] font-bold shadow-xs' : 'text-[#7B7B78] hover:text-[#F3F3F0]'
              }`}
            >
              Расселено
            </button>
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'urgent' ? 'bg-[#F3F3F0] text-[#08080a] font-bold shadow-xs' : 'text-[#7B7B78] hover:text-[#F3F3F0]'
              }`}
            >
              Срочные
            </button>
            <button
              onClick={() => setStatusFilter('unassigned')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'unassigned' ? 'bg-[#F3F3F0] text-[#08080a] font-bold shadow-xs' : 'text-[#7B7B78] hover:text-[#F3F3F0]'
              }`}
            >
              Без места
            </button>
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0e0e12] shadow-[0_15px_50px_rgba(0,0,0,0.6)]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] text-[#7B7B78] font-heading font-semibold uppercase tracking-[0.14em] text-[10px] bg-[#08080a]">
              <th className="py-3 px-5 font-normal">Сущность</th>
              <th className="py-3 px-4 font-normal">Тревожность</th>
              <th className="py-3 px-4 font-normal">Температура</th>
              <th className="py-3 px-4 font-normal">Дедлайн</th>
              <th className="py-3 px-4 font-normal">Рекомендуемое место</th>
              <th className="py-3 px-4 font-normal">Score</th>
              <th className="py-3 px-4 font-normal">Статус</th>
              <th className="py-3 px-5 font-normal text-right">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredGhosts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#7B7B78] font-mono">
                  Заявок по заданным критериям не найдено.
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

                const tempLabels = {
                  freezing: 'Ледяная',
                  cold: 'Холод',
                  cool: 'Прохладно',
                  moderate: 'Умеренно',
                  warm: 'Тепло'
                };

                const anxietyLabels = {
                  low: 'Низкая',
                  medium: 'Средняя',
                  high: 'Высокая'
                };

                const resolution = getResolutionStatus(ghost, matchResult);
                const resBadge = getResolutionBadgeProps(resolution);

                return (
                  <tr
                    key={ghost.id}
                    onClick={() => {
                      sound.playClick();
                      selectGhost(ghost.id);
                    }}
                    className="hover:bg-white/[0.04] cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="py-3.5 px-5 font-medium text-[#F3F3F0]">
                      <div className="flex items-center gap-3">
                        <GhostAvatar size="sm" ghostId={ghost.id} className="border border-white/[0.08]" />
                        <div>
                          <div className="font-heading font-bold text-sm text-white">{ghost.name}</div>
                          <div className="text-[10px] text-[#9E9E9A] font-mono">{getGhostFullReference(ghost.id)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#E8E6E1]">
                      {anxietyLabels[ghost.anxietyLevel]}
                    </td>
                    <td className="py-3 px-4 text-[#E8E6E1]">
                      {tempLabels[ghost.preferredTemperature]}
                    </td>
                    <td className="py-3 px-4">
                      <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                    </td>
                    <td className="py-3 px-4 font-display font-medium text-[#E8E6E1]">
                      {activePlace ? activePlace.name : <span className="text-[#7B7B78]">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {evaluation ? (
                        <ScoreBadge score={evaluation.score} isEligible={evaluation.isEligible} size="sm" />
                      ) : (
                        <span className="text-[#7B7B78] font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-heading uppercase tracking-wider font-semibold border inline-flex items-center gap-1 ${resBadge.className}`}>
                        {resolution === 'assigned_auto' && <Check className="w-2.5 h-2.5" />}
                        {resBadge.label}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          selectGhost(ghost.id);
                        }}
                        className="px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider text-[#F3F3F0] hover:text-[#08080a] bg-[#15151b] hover:bg-[#F3F3F0] border border-white/[0.1] rounded-lg transition-all"
                      >
                        Проверить
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
  );
};
