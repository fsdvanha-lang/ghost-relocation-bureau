import React, { useState } from 'react';
import { X, AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import type { GhostApplication } from '../../types/ghost';
import type { RelocationPlace } from '../../types/place';
import type { PlaceMatchEvaluation } from '../../types/matching';
import { ScoreBadge } from '../common/ScoreBadge';
import { Badge } from '../common/Badge';
import { PlaceThumbnail } from '../common/PlaceThumbnail';

interface ManualAssignModalProps {
  ghost: GhostApplication;
  places: RelocationPlace[];
  evaluations: Record<string, PlaceMatchEvaluation>;
  placeOccupants: Record<string, string[]>;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAssign: (ghostId: string, placeId: string, reason?: string) => void;
}

export const ManualAssignModal: React.FC<ManualAssignModalProps> = ({
  ghost,
  places,
  evaluations,
  placeOccupants,
  isOpen,
  onClose,
  onConfirmAssign
}) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  if (!isOpen) return null;

  // Sort: eligible places first, then by score
  const sortedPlaces = [...places].sort((a, b) => {
    const evalA = evaluations[a.id];
    const evalB = evaluations[b.id];
    if (evalA?.isEligible && !evalB?.isEligible) return -1;
    if (!evalA?.isEligible && evalB?.isEligible) return 1;
    return (evalB?.score || 0) - (evalA?.score || 0);
  });

  const activeConflictingPlace = selectedPlaceId ? places.find(p => p.id === selectedPlaceId) : null;
  const activeConflictEvaluation = selectedPlaceId ? evaluations[selectedPlaceId] : null;
  const activeOccupants = selectedPlaceId ? placeOccupants[selectedPlaceId] || [] : [];
  const isSelectedOverCapacity = activeConflictingPlace
    ? activeOccupants.length >= activeConflictingPlace.capacity
    : false;

  const handleSelectPlace = (placeId: string) => {
    const evaluation = evaluations[placeId];
    const place = places.find(p => p.id === placeId);
    const occupants = placeOccupants[placeId] || [];
    const isOverCapacity = occupants.length >= (place?.capacity || 0);

    if (!evaluation?.isEligible || isOverCapacity || evaluation.score < 60) {
      setSelectedPlaceId(placeId);
    } else {
      onConfirmAssign(ghost.id, placeId, 'Ручное назначение оператора');
      onClose();
    }
  };

  const handleConfirmConflict = () => {
    if (!selectedPlaceId) return;
    onConfirmAssign(
      ghost.id,
      selectedPlaceId,
      overrideReason || 'Подтвержденный оператором ручной оверрайд с конфликтами'
    );
    setSelectedPlaceId(null);
    onClose();
  };

  const totalConflicts = (activeConflictEvaluation?.hardConflicts.length || 0) + (isSelectedOverCapacity ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div 
        className="bg-[#0e1320] border border-[#1f2b42] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1b253b] flex items-center justify-between bg-[#0b101c]">
          <div className="flex items-center gap-3">
            {selectedPlaceId && (
              <button
                onClick={() => setSelectedPlaceId(null)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#182338] transition-colors"
                title="Назад к списку"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {selectedPlaceId ? 'Предупреждение о конфликте' : `Выбор места для ${ghost.name}`}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                #{ghost.id} · {ghost.anxietyLevel === 'high' ? 'Высокая тревожность' : 'Плановое расселение'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#182338] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Content: Conflict Warning or Place List */}
        {selectedPlaceId && activeConflictingPlace ? (
          <div 
            className="p-6 overflow-y-auto space-y-5 flex-1"
            style={{ animation: 'entranceFadeUp 260ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
          >
            {/* Conflict Banner */}
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Обнаружено нарушений: {totalConflicts}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Назначение <strong className="text-white">{ghost.name}</strong> в локацию{' '}
                <strong className="text-white">{activeConflictingPlace.name}</strong> нарушает условия привидения или правила безопасности:
              </p>
            </div>

            {/* Staggered Violations List */}
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Конкретные причины несоответствия:
              </span>

              <div className="space-y-2">
                {isSelectedOverCapacity && (
                  <div 
                    className="p-2.5 rounded-lg bg-[#161d2d] border border-rose-500/30 flex items-start gap-2.5"
                    style={{ animation: 'entranceFadeUp 200ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both' }}
                  >
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-rose-300">Локация полностью заполнена</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Занято {activeOccupants.length} из {activeConflictingPlace.capacity} мест.
                      </div>
                    </div>
                  </div>
                )}

                {activeConflictEvaluation?.hardConflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#161d2d] border border-rose-500/30 flex items-start gap-2.5"
                    style={{ animation: `entranceFadeUp 200ms cubic-bezier(0.22, 1, 0.36, 1) ${(idx + 2) * 40}ms both` }}
                  >
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-rose-300">Жесткое ограничение нарушено</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{conflict.message}</div>
                    </div>
                  </div>
                ))}

                {activeConflictEvaluation?.isEligible && (activeConflictEvaluation.score < 60) && (
                  <div className="p-2.5 rounded-lg bg-[#161d2d] border border-amber-500/30 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-300">Низкий скор совместимости ({activeConflictEvaluation.score}%)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Условия локации далеки от предпочтений привидения.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Operator Reason Input */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Обоснование решения оператора (обязательно для аудита в AI Worklog):
              </label>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Например: Критический дедлайн, временное размещение до освобождения замка..."
                rows={2}
                className="w-full p-2.5 bg-[#121826] border border-[#1f2b42] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1b253b]">
              <button
                onClick={() => setSelectedPlaceId(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Вернуться к списку
              </button>
              <button
                onClick={handleConfirmConflict}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-md shadow-rose-600/30 animate-attention-once"
              >
                Подтвердить вопреки конфликтам
              </button>
            </div>
          </div>
        ) : (
          /* Decision Table / List */
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1b253b] text-slate-400 font-medium bg-[#0b101c]">
                  <th className="py-3 px-4 font-normal">Место</th>
                  <th className="py-3 px-4 font-normal">Свободно</th>
                  <th className="py-3 px-4 font-normal">Score</th>
                  <th className="py-3 px-4 font-normal">Статус</th>
                  <th className="py-3 px-4 font-normal text-right">Выбор</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151c2d]">
                {sortedPlaces.map(place => {
                  const evaluation = evaluations[place.id];
                  const occupants = placeOccupants[place.id] || [];
                  const isCurrent = ghost.assignedPlaceId === place.id;
                  const freeSlots = Math.max(0, place.capacity - occupants.length);
                  const isFull = freeSlots === 0;
                  const hasHardConflict = !evaluation?.isEligible;

                  return (
                    <tr
                      key={place.id}
                      className={`hover:bg-[#141b2c] transition-colors duration-150 ${isCurrent ? 'bg-blue-500/5' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <PlaceThumbnail
                            placeType={place.type}
                            placeId={place.id}
                            className="w-9 h-9 rounded-lg"
                          />
                          <div>
                            <div className="font-semibold text-slate-200">{place.name}</div>
                            <div className="text-[11px] text-slate-400">{place.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {freeSlots} из {place.capacity}
                      </td>
                      <td className="py-3 px-4">
                        <ScoreBadge score={evaluation?.score || 0} isEligible={evaluation?.isEligible} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        {isCurrent ? (
                          <Badge variant="default" size="sm">Текущее</Badge>
                        ) : hasHardConflict ? (
                          <span className="text-[11px] text-rose-400 font-medium">Конфликт условий</span>
                        ) : isFull ? (
                          <span className="text-[11px] text-slate-400">Заполнено</span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">Доступно</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSelectPlace(place.id)}
                          disabled={isCurrent}
                          className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all duration-180 ${
                            isCurrent
                              ? 'text-slate-600 cursor-not-allowed'
                              : hasHardConflict || isFull
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                          }`}
                        >
                          {isCurrent ? 'Назначено' : hasHardConflict || isFull ? 'Выбрать (риск)' : 'Выбрать'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
