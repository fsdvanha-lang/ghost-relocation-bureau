import React from 'react';
import { useBureau } from '../context/BureauContext';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import { Badge } from '../components/common/Badge';

export const DecisionsPage: React.FC = () => {
  const { state, stats, selectGhost, runAutoAllocation } = useBureau();

  const overloadedPlaces = [...state.places]
    .map(place => {
      const occupants = state.allocation.placeOccupants[place.id] || [];
      const percent = Math.round((occupants.length / place.capacity) * 100);
      return { place, occupantsCount: occupants.length, percent };
    })
    .sort((a, b) => b.percent - a.percent);

  const manualAssignments = state.ghosts.filter(g => g.manualOverride && g.assignedPlaceId);

  const criticalGhosts = state.ghosts.filter(
    g => g.deadlineHoursLeft <= 24 || g.status === 'impossible' || !g.assignedPlaceId
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#202326] pb-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Решения и аудит</h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            {stats.totalGhosts} привидений · {stats.relocatedCount} расселено · {manualAssignments.length} оверрайдов · {stats.averageScore}/100 средний скор
          </p>
        </div>

        <div>
          <button
            onClick={runAutoAllocation}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors"
          >
            Пересчитать распределение
          </button>
        </div>
      </div>

      {/* 1. Manual Overrides Audit Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">
            Журнал ручных решений оператора ({manualAssignments.length})
          </h3>
          <span className="text-xs text-zinc-500">Решения в режиме исключения</span>
        </div>

        <div className="border border-[#202326] rounded-lg overflow-hidden bg-[#111214]">
          {manualAssignments.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              Ручных оверрайдов не зафиксировано. Все заявки распределены по правилам алгоритма.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#202326] text-zinc-500 font-medium">
                  <th className="py-2.5 px-4 font-normal">Привидение</th>
                  <th className="py-2.5 px-4 font-normal">Назначенная локация</th>
                  <th className="py-2.5 px-4 font-normal">Обоснование оператора</th>
                  <th className="py-2.5 px-4 font-normal">Score</th>
                  <th className="py-2.5 px-4 font-normal text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1d20]">
                {manualAssignments.map(ghost => {
                  const place = state.places.find(p => p.id === ghost.assignedPlaceId);
                  const evalResult = ghost.assignedPlaceId
                    ? state.allocation.ghostResults[ghost.id]?.evaluations[ghost.assignedPlaceId]
                    : null;

                  return (
                    <tr
                      key={ghost.id}
                      onClick={() => selectGhost(ghost.id)}
                      className="hover:bg-[#16181b] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-zinc-200">
                        {ghost.name}
                        <span className="text-[11px] text-zinc-500 ml-1.5">#{ghost.id}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-medium">{place?.name}</td>
                      <td className="py-3 px-4 text-zinc-400 italic">
                        «{ghost.manualOverrideReason || 'Ручное решение'}»
                      </td>
                      <td className="py-3 px-4">
                        {evalResult && (
                          <ScoreBadge score={evalResult.score} isEligible={evalResult.isEligible} size="sm" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            selectGhost(ghost.id);
                          }}
                          className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800 rounded transition-colors"
                        >
                          Изменить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 2. Overloaded Places */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Перегрузка локаций</h3>
          <span className="text-xs text-zinc-500">Контроль предельной емкости</span>
        </div>

        <div className="border border-[#202326] rounded-lg overflow-hidden bg-[#111214]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#202326] text-zinc-500 font-medium">
                <th className="py-2.5 px-4 font-normal">Локация</th>
                <th className="py-2.5 px-4 font-normal">Занято</th>
                <th className="py-2.5 px-4 font-normal">Емкость</th>
                <th className="py-2.5 px-4 font-normal">Заполненность</th>
                <th className="py-2.5 px-4 font-normal text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1d20]">
              {overloadedPlaces.slice(0, 5).map(({ place, occupantsCount, percent }) => {
                const isFull = percent >= 100;
                return (
                  <tr key={place.id} className="hover:bg-[#16181b] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-zinc-200">{place.name}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-300">{occupantsCount}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-400">{place.capacity}</td>
                    <td className="py-2.5 px-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <span className="font-mono text-zinc-400 text-[11px] w-8">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {isFull ? (
                        <Badge variant="danger" size="sm">Заполнено</Badge>
                      ) : percent > 0 ? (
                        <Badge variant="warning" size="sm">Частично</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Свободно</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Problematic & Unresolved Requests */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          Спорные и нераспределенные заявки ({criticalGhosts.length})
        </h3>

        <div className="border border-[#202326] rounded-lg overflow-hidden bg-[#111214]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#202326] text-zinc-500 font-medium">
                <th className="py-2.5 px-4 font-normal">Привидение</th>
                <th className="py-2.5 px-4 font-normal">Дедлайн</th>
                <th className="py-2.5 px-4 font-normal">Статус</th>
                <th className="py-2.5 px-4 font-normal">Причина проблемы</th>
                <th className="py-2.5 px-4 font-normal text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1d20]">
              {criticalGhosts.map(ghost => {
                const matchResult = state.allocation.ghostResults[ghost.id];
                return (
                  <tr
                    key={ghost.id}
                    onClick={() => selectGhost(ghost.id)}
                    className="hover:bg-[#16181b] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-zinc-200">{ghost.name}</td>
                    <td className="py-2.5 px-4">
                      <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                    </td>
                    <td className="py-2.5 px-4">
                      {ghost.status === 'impossible' ? (
                        <Badge variant="danger" size="sm">Невозможно</Badge>
                      ) : ghost.assignedPlaceId ? (
                        <Badge variant="success" size="sm">Расселено</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Ожидает</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400">
                      {matchResult?.impossibleReasons?.[0] ||
                        (ghost.deadlineHoursLeft < 0
                          ? 'Дедлайн просрочен'
                          : 'Требуется подтверждение')}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          selectGhost(ghost.id);
                        }}
                        className="px-2 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 rounded transition-colors"
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
