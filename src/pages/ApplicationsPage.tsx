import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { Badge } from '../components/common/Badge';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { GhostAvatar } from '../components/common/GhostAvatar';

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
    <div className="space-y-5 select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b253b]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Заявки привидений</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Реестр входящих обращений и текущий статус распределения
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#141b2c] border border-[#212d46] rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0e1320] p-1 rounded-xl border border-[#1b253b] text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({state.ghosts.length})
            </button>
            <button
              onClick={() => setStatusFilter('assigned')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'assigned' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Расселено
            </button>
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'urgent' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Срочные
            </button>
            <button
              onClick={() => setStatusFilter('unassigned')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'unassigned' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Без места
            </button>
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="border border-[#1b253b] rounded-2xl overflow-hidden bg-[#101625] shadow-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1b253b] text-slate-400 font-medium">
              <th className="py-3 px-4 font-normal">Привидение</th>
              <th className="py-3 px-4 font-normal">Тревожность</th>
              <th className="py-3 px-4 font-normal">Температура</th>
              <th className="py-3 px-4 font-normal">Дедлайн</th>
              <th className="py-3 px-4 font-normal">Рекомендуемое место</th>
              <th className="py-3 px-4 font-normal">Score</th>
              <th className="py-3 px-4 font-normal">Статус</th>
              <th className="py-3 px-4 font-normal text-right">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#151c2d]">
            {filteredGhosts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
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

                let statusBadge = <Badge variant="default" size="sm">Новая</Badge>;
                if (ghost.assignedPlaceId) {
                  statusBadge = (
                    <Badge variant="success" size="sm">
                      {ghost.manualOverride ? 'Ручное' : 'Расселено'}
                    </Badge>
                  );
                } else if (matchResult?.status === 'impossible') {
                  statusBadge = <Badge variant="danger" size="sm">Невозможно</Badge>;
                } else if (ghost.deadlineHoursLeft <= 24) {
                  statusBadge = <Badge variant="warning" size="sm">Внимание</Badge>;
                }

                return (
                  <tr
                    key={ghost.id}
                    onClick={() => selectGhost(ghost.id)}
                    className="hover:bg-[#141c2c] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <GhostAvatar size="sm" />
                        <div>
                          <span className="font-semibold text-white">{ghost.name}</span>
                          <span className="text-[11px] text-slate-500 ml-1.5 font-mono">#{ghost.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400">
                      {anxietyLabels[ghost.anxietyLevel]}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400">
                      {tempLabels[ghost.preferredTemperature]}
                    </td>
                    <td className="py-2.5 px-4">
                      <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                    </td>
                    <td className="py-2.5 px-4 text-zinc-300">
                      {activePlace ? activePlace.name : <span className="text-zinc-500">—</span>}
                    </td>
                    <td className="py-2.5 px-4">
                      {evaluation ? (
                        <ScoreBadge score={evaluation.score} isEligible={evaluation.isEligible} size="sm" />
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">{statusBadge}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          selectGhost(ghost.id);
                        }}
                        className="px-2 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                      >
                        Открыть
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
