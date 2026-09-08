import React from 'react';
import { useBureau } from '../context/BureauContext';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { state, stats, selectGhost, runAutoAllocation } = useBureau();

  // Приоритетная очередь: дедлайн < 24ч, просрочено, невозможно или не расселено
  const attentionGhosts = state.ghosts
    .filter(g => g.deadlineHoursLeft <= 24 || g.status === 'impossible' || !g.assignedPlaceId)
    .sort((a, b) => a.deadlineHoursLeft - b.deadlineHoursLeft);

  return (
    <div className="space-y-8">
      {/* 1. Header with Clear Subheader & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#202326] pb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Обзор бюро</h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            {stats.totalGhosts} заявок · {stats.relocatedCount} расселено · {stats.needsAttentionCount} требуют решения
          </p>
        </div>

        <div>
          <button
            onClick={runAutoAllocation}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            Запустить авто-подбор
          </button>
        </div>
      </div>

      {/* 2. Typographic Minimalist KPIs (No big icon boxes, pure whitespace & numbers) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 py-2 border-b border-[#202326]">
        <div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{stats.totalGhosts}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Заявок</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{stats.relocatedCount}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Расселено</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-zinc-400">{stats.unassignedCount}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Без места</div>
        </div>
        <div>
          <div className={`text-2xl font-bold font-mono ${stats.needsAttentionCount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
            {stats.needsAttentionCount}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Требуют внимания</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-zinc-300">{stats.availableSlots}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Свободных мест</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-zinc-300">{stats.occupancyPercent}%</div>
          <div className="text-xs text-zinc-500 mt-0.5">Загрузка мест</div>
        </div>
      </div>

      {/* 3. SECTION 1 (MAIN): Требуют внимания */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">Требуют внимания</h3>
            <span className="text-xs font-mono text-zinc-500">({attentionGhosts.length})</span>
          </div>
          <span className="text-xs text-zinc-500">Приоритетная очередь оператора</span>
        </div>

        <div className="border border-[#202326] rounded-lg overflow-hidden bg-[#111214]">
          {attentionGhosts.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              В очереди нет критических заявок. Все привидения расселены.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#202326] text-zinc-500 font-medium">
                  <th className="py-2.5 px-4 font-normal">Привидение</th>
                  <th className="py-2.5 px-4 font-normal">Причина внимания</th>
                  <th className="py-2.5 px-4 font-normal">Дедлайн</th>
                  <th className="py-2.5 px-4 font-normal">Рекомендованное место</th>
                  <th className="py-2.5 px-4 font-normal">Скор</th>
                  <th className="py-2.5 px-4 font-normal text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1d20]">
                {attentionGhosts.map(ghost => {
                  const result = state.allocation.ghostResults[ghost.id];
                  const place = ghost.assignedPlaceId
                    ? state.places.find(p => p.id === ghost.assignedPlaceId)
                    : result?.recommendedPlaceId
                    ? state.places.find(p => p.id === result.recommendedPlaceId)
                    : null;

                  let reasonText = '';
                  if (ghost.deadlineHoursLeft < 0) {
                    reasonText = `Дедлайн просрочен (${Math.abs(ghost.deadlineHoursLeft)}ч)`;
                  } else if (result?.status === 'impossible') {
                    reasonText = result.impossibleReasons?.[0] || 'Невозможно подобрать место';
                  } else if (ghost.deadlineHoursLeft <= 24) {
                    reasonText = 'Истекает срок переселения (<24ч)';
                  } else {
                    reasonText = 'Высокая тревожность, ожидает проверки';
                  }

                  const evalScore = place && result?.evaluations ? result.evaluations[place.id]?.score : undefined;
                  const isEligible = place && result?.evaluations ? result.evaluations[place.id]?.isEligible : false;

                  return (
                    <tr
                      key={ghost.id}
                      onClick={() => selectGhost(ghost.id)}
                      className="hover:bg-[#16181b] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-zinc-200">
                        {ghost.name}
                        <span className="text-[11px] text-zinc-500 ml-1.5 font-normal">#{ghost.id}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        <span className={ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : 'text-zinc-300'}>
                          {reasonText}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {place ? place.name : <span className="text-zinc-500">Нет доступных</span>}
                      </td>
                      <td className="py-3 px-4">
                        {evalScore !== undefined ? (
                          <ScoreBadge score={evalScore} isEligible={isEligible} size="sm" />
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            selectGhost(ghost.id);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                        >
                          Разобрать
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

      {/* 4. SECTION 2: Загрузка мест (Компактная таблица) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Загрузка мест обитания</h3>
          <span className="text-xs text-zinc-500 font-mono">
            Занято {stats.totalOccupied} из {stats.totalCapacity} слотов
          </span>
        </div>

        <div className="border border-[#202326] rounded-lg overflow-hidden bg-[#111214]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#202326] text-zinc-500 font-medium">
                <th className="py-2.5 px-4 font-normal">Место</th>
                <th className="py-2.5 px-4 font-normal">Тип</th>
                <th className="py-2.5 px-4 font-normal">Занято</th>
                <th className="py-2.5 px-4 font-normal">Свободно</th>
                <th className="py-2.5 px-4 font-normal">Шкала</th>
                <th className="py-2.5 px-4 font-normal text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1d20]">
              {state.places.map(place => {
                const occupants = state.allocation.placeOccupants[place.id] || [];
                const freeSlots = Math.max(0, place.capacity - occupants.length);
                const percent = Math.round((occupants.length / place.capacity) * 100);
                const isFull = freeSlots === 0;

                return (
                  <tr key={place.id} className="hover:bg-[#16181b] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-zinc-200">{place.name}</td>
                    <td className="py-2.5 px-4 text-zinc-400">{place.type}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-300">{occupants.length}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-300">{freeSlots}</td>
                    <td className="py-2.5 px-4 w-40">
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
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

      {/* 5. SECTION 3: Второстепенная аналитика */}
      <div className="pt-2 border-t border-[#202326] flex flex-wrap items-center justify-between text-xs text-zinc-500">
        <div>
          Средняя совместимость решений: <strong className="text-zinc-300 font-mono">{stats.averageScore}/100</strong>
        </div>
        <div>
          Назначения: <span className="text-zinc-300">{stats.relocatedAutoCount} авто</span> · <span className="text-zinc-300">{stats.relocatedManualCount} вручную</span>
        </div>
      </div>
    </div>
  );
};
