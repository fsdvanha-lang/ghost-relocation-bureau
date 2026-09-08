import React, { useState } from 'react';
import { X, AlertTriangle, Check, AlertCircle, ShieldAlert } from 'lucide-react';
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
  const [showConfirmConflict, setShowConfirmConflict] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  if (!isOpen) return null;

  // Сортируем места: сначала без hard conflicts по score, затем остальные
  const sortedPlaces = [...places].sort((a, b) => {
    const evalA = evaluations[a.id];
    const evalB = evaluations[b.id];
    if (evalA?.isEligible && !evalB?.isEligible) return -1;
    if (!evalA?.isEligible && evalB?.isEligible) return 1;
    return (evalB?.score || 0) - (evalA?.score || 0);
  });

  const handleSelectPlace = (placeId: string) => {
    const evaluation = evaluations[placeId];
    const place = places.find(p => p.id === placeId);
    const occupants = placeOccupants[placeId] || [];
    const isOverCapacity = occupants.length >= (place?.capacity || 0);

    // Если есть конфликты или переполнение — показываем диалог подтверждения
    if (!evaluation?.isEligible || isOverCapacity || evaluation.score < 60) {
      setSelectedPlaceId(placeId);
      setShowConfirmConflict(true);
    } else {
      // Идеальное или нормальное место — назначаем напрямую
      onConfirmAssign(ghost.id, placeId, 'Ручное назначение оператора');
      onClose();
    }
  };

  const handleConfirmOverride = () => {
    if (!selectedPlaceId) return;
    onConfirmAssign(
      ghost.id,
      selectedPlaceId,
      overrideReason || 'Подтвержденный оператором ручной оверрайд с конфликтами'
    );
    setShowConfirmConflict(false);
    onClose();
  };

  const activeConflictingPlace = selectedPlaceId ? places.find(p => p.id === selectedPlaceId) : null;
  const activeConflictEvaluation = selectedPlaceId ? evaluations[selectedPlaceId] : null;
  const activeOccupants = selectedPlaceId ? placeOccupants[selectedPlaceId] || [] : [];
  const isSelectedOverCapacity = activeConflictingPlace
    ? activeOccupants.length >= activeConflictingPlace.capacity
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Main Relocation Picker Modal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Ручное расселение привидения:</span>
              <span className="text-indigo-400 font-bold">{ghost.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Выберите место из доступного пула бюро. При наличии конфликтов потребуется подтверждение.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Places List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {sortedPlaces.map(place => {
            const evaluation = evaluations[place.id];
            const occupants = placeOccupants[place.id] || [];
            const isCurrentlyAssigned = ghost.assignedPlaceId === place.id;
            const freeSlots = Math.max(0, place.capacity - occupants.length);
            const isFull = freeSlots === 0;

            return (
              <div
                key={place.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCurrentlyAssigned
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                    : evaluation?.isEligible
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-90'
                }`}
              >
                {/* Place details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">{place.name}</span>
                    <Badge variant="default" size="sm">
                      {place.type}
                    </Badge>
                    {isCurrentlyAssigned && (
                      <Badge variant="purple" size="sm">
                        Текущее место
                      </Badge>
                    )}
                    {isFull && (
                      <Badge variant="danger" size="sm">
                        Заполнено ({occupants.length}/{place.capacity})
                      </Badge>
                    )}
                    {!isFull && (
                      <Badge variant="success" size="sm">
                        Свободно: {freeSlots} из {place.capacity}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">{place.description}</p>

                  {/* Highlights / Conflicts */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
                    {evaluation?.hardConflicts && evaluation.hardConflicts.length > 0 && (
                      <span className="text-rose-400 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Конфликты: {evaluation.hardConflicts.length}</span>
                      </span>
                    )}
                    {evaluation?.pros && evaluation.pros.length > 0 && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Плюсы: {evaluation.pros.length}</span>
                      </span>
                    )}
                    {evaluation?.warnings && evaluation.warnings.length > 0 && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Предупреждения: {evaluation.warnings.length}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Score and action */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <ScoreBadge
                    score={evaluation?.score || 0}
                    isEligible={evaluation?.isEligible ?? false}
                    size="md"
                  />

                  <button
                    onClick={() => handleSelectPlace(place.id)}
                    disabled={isCurrentlyAssigned}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isCurrentlyAssigned
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : evaluation?.isEligible && !isFull
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40'
                        : 'bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{isCurrentlyAssigned ? 'Уже назначено' : 'Выбрать'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Confirmation Warning Modal for Conflicting Selection */}
      {showConfirmConflict && activeConflictingPlace && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-800/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-100">
                  Вы выбрали место с конфликтами условий!
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Назначение привидения <strong className="text-slate-200">{ghost.name}</strong> в{' '}
                  <strong className="text-slate-200">«{activeConflictingPlace.name}»</strong> нарушает правила безопасности:
                </p>
              </div>
            </div>

            {/* List of conflicts */}
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {isSelectedOverCapacity && (
                <div className="flex items-start gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Превышение вместимости: место заполнено ({activeOccupants.length}/{activeConflictingPlace.capacity}).</span>
                </div>
              )}

              {activeConflictEvaluation?.hardConflicts.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{c.message}</span>
                </div>
              ))}

              {activeConflictEvaluation?.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{w.message}</span>
                </div>
              ))}
            </div>

            {/* Reason input */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">
                Обоснование оператора (причина исключения):
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Например: временное размещение до освобождения склепа"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmConflict(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmOverride}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-amber-950/40 transition-colors"
              >
                Подтвердить ручное назначение
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
