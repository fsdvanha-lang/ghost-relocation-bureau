import React from 'react';
import { useBureau } from '../context/BureauContext';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import { Badge } from '../components/common/Badge';
import { GhostAvatar } from '../components/common/GhostAvatar';

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
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F3F3F0] shadow-[0_0_8px_#F3F3F0]" />
            <span className="font-heading uppercase tracking-[0.16em] text-[10px] text-[#7B7B78] font-bold">
              Верификация распределений
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-[#F3F3F0] tracking-tight uppercase">
            Решения и аудит
          </h2>
          <p className="text-xs text-[#7B7B78] mt-1 font-mono">
            {stats.totalGhosts} сущностей · {stats.relocatedCount} расселено · {manualAssignments.length} оверрайдов · {stats.averageScore}/100 средний скор
          </p>
        </div>

        <div>
          <button
            onClick={runAutoAllocation}
            className="px-4 py-2 bg-[#F3F3F0] hover:bg-white text-[#08080a] rounded-xl text-xs font-heading font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(243,243,240,0.15)] transition-all active:scale-95"
          >
            Пересчитать распределение
          </button>
        </div>
      </div>

      {/* 1. Manual Overrides Audit Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold uppercase tracking-[0.14em] text-xs text-[#F3F3F0]">
            Журнал ручных решений оператора ({manualAssignments.length})
          </h3>
          <span className="text-[10px] font-heading uppercase tracking-wider text-[#7B7B78]">
            Решения в режиме оверрайда
          </span>
        </div>

        <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0e0e12] shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          {manualAssignments.length === 0 ? (
            <div className="py-8 px-6 text-center space-y-1.5 bg-[#09090c]">
              <div className="text-xs font-heading font-semibold text-[#E8E6E1]">
                Ручных изменений пока нет
              </div>
              <div className="text-xs text-[#7B7B78]">
                Все текущие назначения соответствуют автоматическим рекомендациям.
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#7B7B78] font-heading font-semibold uppercase tracking-[0.14em] text-[10px] bg-[#08080a]">
                  <th className="py-3 px-5 font-normal">Сущность</th>
                  <th className="py-3 px-4 font-normal">Назначенная локация</th>
                  <th className="py-3 px-4 font-normal">Обоснование оператора</th>
                  <th className="py-3 px-4 font-normal">Score</th>
                  <th className="py-3 px-5 font-normal text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {manualAssignments.map(ghost => {
                  const place = state.places.find(p => p.id === ghost.assignedPlaceId);
                  const evalResult = ghost.assignedPlaceId
                    ? state.allocation.ghostResults[ghost.id]?.evaluations[ghost.assignedPlaceId]
                    : null;

                  return (
                    <tr
                      key={ghost.id}
                      onClick={() => selectGhost(ghost.id)}
                      className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 font-medium text-[#F3F3F0]">
                        <div className="flex items-center gap-3">
                          <GhostAvatar size="sm" ghostId={ghost.id} className="border border-white/[0.08]" />
                          <div>
                            <div className="font-display font-bold text-sm text-white">{ghost.name}</div>
                            <div className="text-[10px] text-[#7B7B78] font-mono">#{ghost.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#E8E6E1] font-display font-semibold">{place?.name}</td>
                      <td className="py-3.5 px-4 text-[#9d9d99] italic">
                        «{ghost.manualOverrideReason || 'Ручное решение'}»
                      </td>
                      <td className="py-3.5 px-4">
                        {evalResult && (
                          <ScoreBadge score={evalResult.score} isEligible={evalResult.isEligible} size="sm" />
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
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
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 2. Overloaded Places */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold uppercase tracking-[0.14em] text-xs text-[#F3F3F0]">
            Заполненность локаций
          </h3>
          <span className="text-[10px] font-heading uppercase tracking-wider text-[#7B7B78]">
            Контроль предельной емкости
          </span>
        </div>

        <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0e0e12] shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#7B7B78] font-heading font-semibold uppercase tracking-[0.14em] text-[10px] bg-[#08080a]">
                <th className="py-3 px-5 font-normal">Локация</th>
                <th className="py-3 px-4 font-normal">Занято</th>
                <th className="py-3 px-4 font-normal">Емкость</th>
                <th className="py-3 px-4 font-normal">Заполненность</th>
                <th className="py-3 px-5 font-normal text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {overloadedPlaces.slice(0, 5).map(({ place, occupantsCount, percent }) => {
                const isFull = percent >= 100;
                return (
                  <tr key={place.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-5 font-display font-bold text-sm text-[#F3F3F0]">{place.name}</td>
                    <td className="py-3.5 px-4 font-mono text-[#E8E6E1]">{occupantsCount}</td>
                    <td className="py-3.5 px-4 font-mono text-[#7B7B78]">{place.capacity}</td>
                    <td className="py-3.5 px-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[#7B7B78] text-[11px] w-10">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
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
        <h3 className="font-heading font-bold uppercase tracking-[0.14em] text-xs text-[#F3F3F0]">
          Спорные и нераспределенные заявки ({criticalGhosts.length})
        </h3>

        <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0e0e12] shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#7B7B78] font-heading font-semibold uppercase tracking-[0.14em] text-[10px] bg-[#08080a]">
                <th className="py-3 px-5 font-normal">Сущность</th>
                <th className="py-3 px-4 font-normal">Дедлайн</th>
                <th className="py-3 px-4 font-normal">Статус</th>
                <th className="py-3 px-4 font-normal">Причина проблемы</th>
                <th className="py-3 px-5 font-normal text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {criticalGhosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#7B7B78] font-mono">
                    Спорных заявок нет · Все обращения обработаны в штатном режиме
                  </td>
                </tr>
              ) : (
                criticalGhosts.map(ghost => {
                  const matchResult = state.allocation.ghostResults[ghost.id];
                  return (
                    <tr
                      key={ghost.id}
                      onClick={() => selectGhost(ghost.id)}
                      className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 font-display font-bold text-sm text-[#F3F3F0]">{ghost.name}</td>
                      <td className="py-3.5 px-4">
                        <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                      </td>
                      <td className="py-3.5 px-4">
                        {ghost.status === 'impossible' ? (
                          <Badge variant="danger" size="sm">Невозможно</Badge>
                        ) : ghost.assignedPlaceId ? (
                          <Badge variant="success" size="sm">Расселено</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Ожидает</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#9d9d99]">
                        {matchResult?.impossibleReasons?.[0] ||
                          (ghost.deadlineHoursLeft < 0
                            ? 'Дедлайн просрочен'
                            : 'Требуется подтверждение')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
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
    </div>
  );
};
