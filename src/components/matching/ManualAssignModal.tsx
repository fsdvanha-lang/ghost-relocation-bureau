import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { GhostApplication } from '../../types/ghost';
import type { RelocationPlace } from '../../types/place';
import type { PlaceMatchEvaluation } from '../../types/matching';
import { ScoreBadge } from '../common/ScoreBadge';
import { Badge } from '../common/Badge';

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

  // Сортировка: сначала подходящие по скору, затем остальные
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
      // Требуется подтверждение оверрайда
      setSelectedPlaceId(placeId);
    } else {
      // Идеальное или допустимое место — назначаем сразу
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-[#111214] border border-[#26292d] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#202326] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Ручное назначение: <span className="text-zinc-300">{ghost.name}</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Выберите место обитания из списка доступных локаций бюро
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedPlaceId(null);
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Confirmation State if a conflicting place is clicked */}
        {selectedPlaceId && activeConflictingPlace ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1.5">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Обнаружены конфликты при выборе «{activeConflictingPlace.name}»</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Выбранное место нарушает физические ограничения или исчерпало базовую вместимость:
              </p>
            </div>

            {/* List of conflicts */}
            <div className="space-y-1.5 text-xs">
              {isSelectedOverCapacity && (
                <div className="text-rose-400 flex items-start gap-1.5">
                  <span className="font-bold">✕</span>
                  <span>Локация полностью заполнена ({activeOccupants.length}/{activeConflictingPlace.capacity}).</span>
                </div>
              )}
              {activeConflictEvaluation?.hardConflicts.map((c, i) => (
                <div key={i} className="text-rose-400 flex items-start gap-1.5">
                  <span className="font-bold">✕</span>
                  <span>{c.message}</span>
                </div>
              ))}
              {activeConflictEvaluation?.warnings.map((w, i) => (
                <div key={i} className="text-amber-400 flex items-start gap-1.5">
                  <span className="font-bold">⚠</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>

            {/* Justification input */}
            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-medium text-zinc-400">
                Обоснование исключения (причина ручного решения):
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Например: временное размещение до освобождения склепа"
                className="w-full px-3 py-1.5 bg-[#181a1d] border border-[#2b2f35] rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#202326]">
              <button
                onClick={() => setSelectedPlaceId(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              >
                Вернуться к списку
              </button>
              <button
                onClick={handleConfirmConflict}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded transition-colors"
              >
                Подтвердить выбор с конфликтом
              </button>
            </div>
          </div>
        ) : (
          /* Decision Table / List */
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#202326] text-zinc-500 font-medium bg-[#131517]">
                  <th className="py-2.5 px-4 font-normal">Место</th>
                  <th className="py-2.5 px-4 font-normal">Свободно</th>
                  <th className="py-2.5 px-4 font-normal">Score</th>
                  <th className="py-2.5 px-4 font-normal">Статус</th>
                  <th className="py-2.5 px-4 font-normal text-right">Выбор</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1d20]">
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
                      className={`hover:bg-[#16181b] transition-colors ${isCurrent ? 'bg-zinc-800/20' : ''}`}
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-zinc-200">{place.name}</div>
                        <div className="text-[11px] text-zinc-500">{place.type}</div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-zinc-300">
                        {freeSlots} из {place.capacity}
                      </td>
                      <td className="py-2.5 px-4">
                        <ScoreBadge score={evaluation?.score || 0} isEligible={evaluation?.isEligible} size="sm" />
                      </td>
                      <td className="py-2.5 px-4">
                        {isCurrent ? (
                          <Badge variant="default" size="sm">Текущее</Badge>
                        ) : hasHardConflict ? (
                          <span className="text-[11px] text-rose-400">Конфликт условий</span>
                        ) : isFull ? (
                          <span className="text-[11px] text-zinc-500">Заполнено</span>
                        ) : (
                          <span className="text-[11px] text-emerald-400">Доступно</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleSelectPlace(place.id)}
                          disabled={isCurrent}
                          className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                            isCurrent
                              ? 'text-zinc-600 cursor-not-allowed'
                              : hasHardConflict || isFull
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
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
