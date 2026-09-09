import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { GhostApplication } from '../../types/ghost';
import type { RelocationPlace } from '../../types/place';
import type { PlaceMatchEvaluation } from '../../types/matching';
import { ScoreBadge } from '../common/ScoreBadge';
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
  const [confirmReady, setConfirmReady] = useState(false);

  // Keyboard accessibility: Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPlaceId) {
          setSelectedPlaceId(null);
          setConfirmReady(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedPlaceId, onClose]);

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
  
  // Rule P0-1: capacity check excluding current ghost if already assigned to this place
  const otherOccupantsCount = activeOccupants.filter(id => id !== ghost.id).length;
  const isSelectedOverCapacity = activeConflictingPlace
    ? otherOccupantsCount >= activeConflictingPlace.capacity
    : false;

  // Rule P0-2: Distinct states for Hard Conflict vs Low Score
  const hasHardConflict = activeConflictEvaluation
    ? !activeConflictEvaluation.isEligible
    : false;

  const isLowCompatibility = !hasHardConflict && !isSelectedOverCapacity && (activeConflictEvaluation?.score ?? 100) < 60;

  const handleSelectPlace = (placeId: string) => {
    const evaluation = evaluations[placeId];
    const place = places.find(p => p.id === placeId);
    const occupants = placeOccupants[placeId] || [];
    const isOverCap = occupants.filter(id => id !== ghost.id).length >= (place?.capacity || 0);

    if (!evaluation?.isEligible || isOverCap || evaluation.score < 60) {
      setConfirmReady(false);
      setSelectedPlaceId(placeId);
    } else {
      onConfirmAssign(ghost.id, placeId, 'Ручной выбор локации оператором');
      onClose();
    }
  };

  const handleConfirmConflict = () => {
    if (!selectedPlaceId || isSelectedOverCapacity) return;
    const defaultReason = hasHardConflict
      ? 'Подтвержденный оператором ручной выбор с конфликтами условий'
      : 'Подтвержденный оператором выбор места с низкой совместимостью';

    onConfirmAssign(
      ghost.id,
      selectedPlaceId,
      overrideReason || defaultReason
    );
    setSelectedPlaceId(null);
    setConfirmReady(false);
    onClose();
  };

  const formatViolationCount = (count: number) => {
    if (count === 1) return '1 нарушение обязательных условий';
    if (count >= 2 && count <= 4) return `${count} нарушения обязательных условий`;
    return `${count} нарушений обязательных условий`;
  };

  // Helper for key factors
  const getPlaceKeyFactors = (place: RelocationPlace) => {
    const factors: { type: 'conflict' | 'warning' | 'pro'; text: string }[] = [];
    if (place.hasMirrors && ghost?.specialRequirements?.noMirrors) {
      factors.push({ type: 'conflict', text: 'Есть зеркала' });
    } else if (place.hasMirrors) {
      factors.push({ type: 'warning', text: 'Есть зеркала' });
    }

    if (ghost?.specialRequirements?.requiresAttic && !place.hasAttic) {
      factors.push({ type: 'conflict', text: 'Нет чердака' });
    } else if (place.hasAttic) {
      factors.push({ type: 'pro', text: 'Есть чердак' });
    }

    if (ghost?.specialRequirements?.requiresCellar && !place.hasCellar) {
      factors.push({ type: 'conflict', text: 'Нет подвала' });
    } else if (place.hasCellar) {
      factors.push({ type: 'pro', text: 'Есть подвал' });
    }

    if (place.noiseLevel === 'high') {
      factors.push({ type: 'warning', text: 'Высокий шум' });
    } else if (place.noiseLevel === 'medium') {
      factors.push({ type: 'warning', text: 'Средний шум' });
    } else if (place.noiseLevel === 'silent' || place.noiseLevel === 'low') {
      factors.push({ type: 'pro', text: 'Низкий шум' });
    }

    return factors.slice(0, 3);
  };

  // Find the AI recommended place for comparison transition
  const autoBestPlace = React.useMemo(() => {
    const eligible = [...places]
      .filter(p => evaluations[p.id]?.isEligible)
      .sort((a, b) => (evaluations[b.id]?.score || 0) - (evaluations[a.id]?.score || 0));
    return eligible[0] || places[0];
  }, [places, evaluations]);

  // Items count to sequentially reveal
  const itemsToReveal = isSelectedOverCapacity
    ? 1
    : hasHardConflict
    ? (activeConflictEvaluation?.hardConflicts.length || 1)
    : (activeConflictEvaluation?.warnings.length || 1);

  // Activate confirm button after sequential factors finish revealing (strictly disabled if over capacity)
  useEffect(() => {
    if (!selectedPlaceId || isSelectedOverCapacity) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setConfirmReady(true);
    }, Math.max(250, itemsToReveal * 90 + 50));
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedPlaceId, itemsToReveal, isSelectedOverCapacity]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-[#0c0c0f] border border-white/[0.1] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden animate-modal-scale"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#08080a]">
          <div className="flex items-center gap-3">
            {selectedPlaceId && (
              <button
                onClick={() => setSelectedPlaceId(null)}
                className="p-1.5 text-[#9E9E9A] hover:text-[#F3F3F0] rounded-lg hover:bg-white/[0.06] transition-colors"
                title="Назад к списку локаций"
                aria-label="Назад к списку"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 id="modal-title" className="font-display font-bold text-base text-[#F3F3F0] tracking-tight">
                {selectedPlaceId 
                  ? isSelectedOverCapacity
                    ? 'Локация полностью заполнена'
                    : hasHardConflict
                    ? 'Подтверждение локации с конфликтами' 
                    : 'Подтверждение места с низкой совместимостью'
                  : `Смена локации для «${ghost.name}»`}
              </h3>
              <p className="text-[11px] text-[#9E9E9A] mt-0.5 font-mono">
                {ghost.name} (#{ghost.id}) · {ghost.anxietyLevel === 'high' ? 'Высокая тревожность' : 'Плановое расселение'} · Выберите подходящее укрытие из 8 мест
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9E9E9A] hover:text-[#F3F3F0] hover:bg-white/[0.06] rounded-lg transition-colors"
            aria-label="Закрыть окно выбора"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Content: Detail Dialog or Place List */}
        {selectedPlaceId && activeConflictingPlace ? (
          <div 
            className="p-6 overflow-y-auto space-y-4 flex-1 animate-in fade-in duration-200"
          >
            {/* Human-in-the-loop Comparison Transition Banner */}
            <div className="p-4 bg-[#121217] border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-heading uppercase tracking-[0.14em] text-amber-400 font-bold flex items-center gap-1.5">
                  <span>👤</span>
                  <span>Ручное изменение выбора оператором</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-heading font-semibold uppercase tracking-wider">
                  Вы меняете алгоритмическую рекомендацию
                </span>
              </div>

              {/* Transition flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-center p-3 rounded-lg bg-[#09090c] border border-white/[0.06]">
                {/* 1. AI Recommendation */}
                <div className="p-1.5">
                  <div className="text-[10px] font-heading uppercase tracking-wider text-[#9E9E9A]">Алгоритм рекомендовал</div>
                  <div className="font-display font-bold text-xs text-[#F3F3F0] truncate mt-0.5">{autoBestPlace.name}</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                    {evaluations[autoBestPlace.id]?.score !== undefined ? `${evaluations[autoBestPlace.id].score} / 100` : '— / 100'}
                  </div>
                </div>

                {/* 2. Arrow & Operator Override */}
                <div className="flex flex-col items-center justify-center py-1">
                  <span className="text-[10px] text-amber-400 font-heading uppercase tracking-wider font-semibold">Ваш выбор</span>
                  <span className="text-amber-400 text-sm mt-0.5">↓</span>
                </div>

                {/* 3. Manual Decision */}
                <div className="p-1.5">
                  <div className="text-[10px] font-heading uppercase tracking-wider text-[#9E9E9A]">Выбранная локация</div>
                  <div className="font-display font-bold text-xs text-amber-300 truncate mt-0.5">{activeConflictingPlace.name}</div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                    {activeConflictEvaluation?.score ?? 35} / 100
                  </div>
                </div>
              </div>
            </div>

            {/* Rule P0-1 & P0-2: State-Specific Banner */}
            {isSelectedOverCapacity ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5 text-rose-400 font-heading font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Локация полностью заполнена</span>
                </div>
                <p className="text-xs text-[#E8E6E1] leading-relaxed">
                  Локация <strong className="text-white font-semibold">{activeConflictingPlace.name}</strong> исчерпала лимит вместимости ({activeOccupants.length} из {activeConflictingPlace.capacity} мест занято). В соответствии с регламентом бюро, ручной оверрайд не может превышать физическую вместимость.
                </p>
              </div>
            ) : hasHardConflict ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5 text-rose-400 font-heading font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formatViolationCount(activeConflictEvaluation?.hardConflicts.length || 0)}</span>
                </div>
                <p className="text-xs text-[#E8E6E1] leading-relaxed">
                  Заселение привидения <strong className="text-white font-semibold">{ghost.name}</strong> в локацию{' '}
                  <strong className="text-white font-semibold">{activeConflictingPlace.name}</strong> нарушает обязательные условия:
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5 text-amber-400 font-heading font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Низкая совместимость</span>
                </div>
                <p className="text-xs text-[#E8E6E1] leading-relaxed">
                  Место допустимо физически, но сильно не соответствует предпочтениям (совместимость: <strong className="text-amber-300 font-semibold">{activeConflictEvaluation?.score ?? 0} / 100</strong>).
                </p>
              </div>
            )}

            {/* Detailed Factors List */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-heading uppercase tracking-[0.14em] text-[#9E9E9A] block font-bold">
                {isSelectedOverCapacity
                  ? 'Статус вместимости:'
                  : hasHardConflict
                  ? 'Конкретные нарушения:'
                  : 'Факторы низкой совместимости:'}
              </span>

              <div className="space-y-1.5">
                {isSelectedOverCapacity && (
                  <div className="p-3 rounded-lg bg-[#09090c] border border-rose-500/25 flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">✕</span>
                    <div>
                      <div className="font-heading font-semibold text-rose-300 text-xs">Вместимость исчерпана</div>
                      <div className="text-[11px] text-[#9E9E9A] mt-0.5 font-mono">
                        Занято {activeOccupants.length} из {activeConflictingPlace.capacity} слотов. Свободных мест нет.
                      </div>
                    </div>
                  </div>
                )}

                {!isSelectedOverCapacity && hasHardConflict && activeConflictEvaluation?.hardConflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#09090c] border border-rose-500/25 flex items-start gap-2.5"
                    style={{ 
                      animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
                      animationDelay: `${idx * 80}ms`
                    }}
                  >
                    <span className="text-rose-400 font-bold">✕</span>
                    <div>
                      <div className="font-heading font-semibold text-rose-300 text-xs">Обязательное условие нарушено</div>
                      <div className="text-[11px] text-[#B4B4AF] mt-0.5">{conflict.message}</div>
                    </div>
                  </div>
                ))}

                {!isSelectedOverCapacity && !hasHardConflict && isLowCompatibility && (
                  activeConflictEvaluation?.warnings && activeConflictEvaluation.warnings.length > 0 ? (
                    activeConflictEvaluation.warnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#09090c] border border-amber-500/25 flex items-start gap-2.5"
                        style={{ 
                          animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
                          animationDelay: `${idx * 80}ms`
                        }}
                      >
                        <span className="text-amber-400 font-bold">⚠</span>
                        <div>
                          <div className="font-heading font-semibold text-amber-300 text-xs">Несоответствие предпочтениям</div>
                          <div className="text-[11px] text-[#B4B4AF] mt-0.5">{warn.message}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-[#09090c] border border-amber-500/25 flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold">⚠</span>
                      <div>
                        <div className="font-heading font-semibold text-amber-300 text-xs">Несоответствие комфортным параметрам</div>
                        <div className="text-[11px] text-[#B4B4AF] mt-0.5">Значительные отклонения по температуре, освещению или уровню шума.</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Operator Reason Input (strictly hidden/disabled if over capacity) */}
            {!isSelectedOverCapacity && (
              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] font-heading uppercase tracking-[0.14em] text-[#E8E6E1] block font-semibold">
                  Обоснование решения оператора (для аудита в журнале):
                </label>
                <textarea
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder={hasHardConflict 
                    ? "Например: Срочный дедлайн, временное размещение до освобождения Замка..."
                    : "Например: Размещение согласовано с оператором, параметры приемлемы..."}
                  rows={2}
                  className="w-full p-3 bg-[#09090c] border border-white/[0.08] rounded-xl text-xs text-[#F3F3F0] placeholder-[#7B7B78] focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            )}

            {/* Actions with capacity lock and sequential activation */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setSelectedPlaceId(null)}
                className="px-4 py-2.5 text-xs font-heading font-medium text-[#9E9E9A] hover:text-[#F3F3F0] rounded-xl transition-colors"
              >
                Вернуться к каталогу
              </button>
              {isSelectedOverCapacity ? (
                <button
                  disabled={true}
                  className="px-5 py-2.5 text-rose-400/60 bg-rose-500/10 border border-rose-500/20 text-xs font-heading font-bold uppercase tracking-wider rounded-xl cursor-not-allowed opacity-60"
                  title="Локация полностью заполнена. Превышение вместимости запрещено."
                >
                  Локация заполнена
                </button>
              ) : (
                <button
                  onClick={handleConfirmConflict}
                  disabled={!confirmReady}
                  className={`px-5 py-2.5 text-white text-xs font-heading font-bold uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md ${
                    confirmReady
                      ? hasHardConflict
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 active:scale-95 cursor-pointer opacity-100'
                        : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 active:scale-95 cursor-pointer opacity-100'
                      : 'bg-white/[0.05] text-[#7B7B78] cursor-not-allowed opacity-60'
                  }`}
                >
                  {hasHardConflict ? 'Подтвердить ручное назначение' : 'Подтвердить выбор'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Decision Table / List with Key Factors */
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#9E9E9A] font-heading font-semibold uppercase tracking-[0.14em] text-[10px] bg-[#08080a]">
                  <th className="py-3 px-5 font-normal">Локация</th>
                  <th className="py-3 px-4 font-normal">Свободно мест</th>
                  <th className="py-3 px-4 font-normal">Совместимость</th>
                  <th className="py-3 px-4 font-normal">Факторы условий</th>
                  <th className="py-3 px-5 font-normal text-right">Выбрать</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sortedPlaces.map(place => {
                  const evaluation = evaluations[place.id];
                  const occupants = placeOccupants[place.id] || [];
                  const isCurrent = ghost.assignedPlaceId === place.id;
                  const freeSlots = Math.max(0, place.capacity - occupants.length);
                  const isFull = freeSlots === 0;
                  const placeHardConflict = !evaluation?.isEligible;
                  const isPlaceLowScore = !placeHardConflict && !isFull && (evaluation?.score ?? 100) < 60;
                  const factors = getPlaceKeyFactors(place);

                  return (
                    <tr
                      key={place.id}
                      className={`hover:bg-[#121217] transition-colors duration-150 ${isCurrent ? 'bg-white/[0.04]' : ''}`}
                    >
                      {/* Place info */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <PlaceThumbnail
                            placeType={place.type}
                            placeId={place.id}
                            className="w-10 h-9 rounded-lg border border-white/[0.08] shrink-0"
                          />
                          <div>
                            <div className="font-display font-bold text-sm text-[#F3F3F0]">{place.name}</div>
                            <div className="text-[10px] font-heading uppercase tracking-wider text-[#9E9E9A] mt-0.5">{place.type}</div>
                          </div>
                        </div>
                      </td>

                      {/* Capacity */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#E8E6E1]">
                        {freeSlots} из {place.capacity} свободно
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4">
                        <ScoreBadge score={evaluation?.score || 0} isEligible={evaluation?.isEligible} size="sm" />
                      </td>

                      {/* Key factors */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {factors.map((f, i) => (
                            <span 
                              key={i} 
                              className={`text-[10px] px-2 py-0.5 rounded font-heading font-medium tracking-wide ${
                                f.type === 'conflict' 
                                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/25' 
                                  : f.type === 'warning' 
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25' 
                                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                              }`}
                            >
                              {f.type === 'conflict' ? '✕ ' : f.type === 'warning' ? '⚠ ' : '✓ '}
                              {f.text}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Select Action */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleSelectPlace(place.id)}
                          disabled={isCurrent}
                          className={`px-3.5 py-1.5 text-xs rounded-lg font-heading font-bold uppercase tracking-wider transition-all duration-180 ${
                            isCurrent
                              ? 'text-[#7B7B78] bg-white/[0.03] cursor-not-allowed'
                              : isFull
                              ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-rose-500/30 cursor-pointer'
                              : placeHardConflict
                              ? 'text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 border border-rose-500/30 cursor-pointer'
                              : isPlaceLowScore
                              ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/15 border border-amber-500/30 cursor-pointer'
                              : 'bg-[#F3F3F0] text-[#08080a] hover:bg-white shadow-[0_0_15px_rgba(243,243,240,0.15)] active:scale-95 cursor-pointer'
                          }`}
                        >
                          {isCurrent 
                            ? '✓ Текущее' 
                            : isFull 
                            ? 'Заполнено' 
                            : placeHardConflict 
                            ? 'Выбрать (конфликт)' 
                            : isPlaceLowScore
                            ? 'Выбрать (низк. скор)'
                            : 'Выбрать место'}
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

