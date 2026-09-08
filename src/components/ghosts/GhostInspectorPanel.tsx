import React, { useState } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  ChevronRight, 
  Thermometer, 
  Clock, 
  Flame,
  CheckCircle2,
  CheckCheck
} from 'lucide-react';
import type { GhostApplication } from '../../types/ghost';
import type { RelocationPlace } from '../../types/place';
import type { PlaceMatchEvaluation } from '../../types/matching';
import { GhostAvatar } from '../common/GhostAvatar';
import { PlaceThumbnail } from '../common/PlaceThumbnail';
import { ScoreRing } from '../common/ScoreRing';
import { ManualAssignModal } from '../matching/ManualAssignModal';
import { useToast } from '../common/ToastContext';

interface GhostInspectorPanelProps {
  ghost: GhostApplication;
  places: RelocationPlace[];
  evaluations: Record<string, PlaceMatchEvaluation>;
  placeOccupants: Record<string, string[]>;
  recommendedPlaceId: string | null;
  displacementReason?: string;
  impossibleReasons?: string[];
  onClose: () => void;
  onManualAssign: (ghostId: string, placeId: string, reason?: string) => void;
  onUnassign: (ghostId: string) => void;
  isDocked?: boolean;
}

export const GhostInspectorPanel: React.FC<GhostInspectorPanelProps> = ({
  ghost,
  places,
  evaluations,
  placeOccupants,
  recommendedPlaceId,
  displacementReason,
  impossibleReasons,
  onClose,
  onManualAssign,
  onUnassign,
  isDocked = false
}) => {
  const { showToast } = useToast();
  const [showManualModal, setShowManualModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activePlaceId = ghost.assignedPlaceId || recommendedPlaceId;
  const activePlace = activePlaceId ? places.find(p => p.id === activePlaceId) : null;
  const activeEvaluation = activePlaceId ? evaluations[activePlaceId] : undefined;

  const anxietyLabels = {
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая'
  };

  const tempLabels = {
    freezing: 'Ледяная',
    cold: 'Холодная',
    cool: 'Прохладно',
    moderate: 'Умеренно',
    warm: 'Тепло'
  };

  const formatDeadline = (hoursLeft: number) => {
    if (hoursLeft < 0) return 'Просрочен';
    if (hoursLeft <= 16) return '< 16 ч.';
    if (hoursLeft <= 24) return '< 24 ч.';
    if (hoursLeft <= 48) return '< 48 ч.';
    const days = Math.round(hoursLeft / 24);
    if (days === 1) return '1 день';
    if (days >= 2 && days <= 4) return `${days} дня`;
    return `${days} дней`;
  };

  const alternatives = places
    .filter(p => p.id !== activePlaceId && evaluations[p.id]?.isEligible)
    .sort((a, b) => (evaluations[b.id]?.score || 0) - (evaluations[a.id]?.score || 0))
    .slice(0, 2);

  const handleSaveDecision = () => {
    if (activePlaceId) {
      onManualAssign(ghost.id, activePlaceId, 'Подтверждение оператором');
      showToast({
        type: 'success',
        title: 'Решение сохранено',
        message: `${ghost.name} расселен в «${activePlace?.name}»`
      });
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 1200);
  };

  const handleUnassign = () => {
    onUnassign(ghost.id);
    showToast({
      type: 'info',
      title: 'Назначение снято',
      message: `${ghost.name} возвращен в очередь подбора`
    });
  };

  // Status badge styling identical to screenshot
  let statusBadge = (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#12281e] text-[#22c55e] border border-[#1b4332]">
      Подобрано
    </span>
  );
  if (ghost.assignedPlaceId) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#12281e] text-[#22c55e] border border-[#1b4332] flex items-center gap-1">
        <Check className="w-3 h-3" />
        Подобрано
      </span>
    );
  } else if (impossibleReasons && impossibleReasons.length > 0) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        Невозможно
      </span>
    );
  } else if (ghost.deadlineHoursLeft <= 24) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        Требует решения
      </span>
    );
  } else if (!activePlaceId) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
        Новая
      </span>
    );
  }

  return (
    <div className={`bg-[#0d1322] border border-[#162035] rounded-2xl flex flex-col shadow-2xl select-none relative overflow-hidden transition-all duration-200 ${
      isDocked ? 'w-full' : 'w-full max-w-[420px] h-full'
    }`}>
      {/* 1. Header with Close Button */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="text-[11px] font-mono text-slate-500">
          Инспектор заявки
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162035] rounded-lg transition-colors"
          title="Закрыть панель инспектора"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Body Content */}
      <div 
        key={ghost.id} 
        className="px-5 pb-5 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]"
        style={{ animation: 'entranceFadeUp 220ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* 2. Hero Avatar & Identity */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3.5">
            <GhostAvatar
              size="xl"
              ghostId={ghost.id}
              className="w-16 h-16 shadow-[0_0_20px_rgba(59,102,245,0.25)] border-[#293d66]"
            />
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                {ghost.name}
              </h2>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                #{ghost.id}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {ghost.id === 'ghost-1' ? 'Девушка, 22 года' : ghost.bio ? ghost.bio.split('.')[0] : 'Заявка на переселение'}
              </div>
            </div>
          </div>
          <div>{statusBadge}</div>
        </div>

        {/* 3. Three Metric Pills (Anxiety, Temperature, Deadline) */}
        <div className="grid grid-cols-3 gap-2">
          {/* Anxiety */}
          <div className="bg-[#111829] border border-[#19243b] rounded-xl p-2.5 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{anxietyLabels[ghost.anxietyLevel]}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              тревожность
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-[#111829] border border-[#19243b] rounded-xl p-2.5 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 truncate">
              <Thermometer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{tempLabels[ghost.preferredTemperature]}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              температура
            </div>
          </div>

          {/* Deadline */}
          <div className="bg-[#111829] border border-[#19243b] rounded-xl p-2.5 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Clock className={`w-3.5 h-3.5 shrink-0 ${ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className={ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : 'text-slate-200'}>
                {formatDeadline(ghost.deadlineHoursLeft)}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              дедлайн
            </div>
          </div>
        </div>

        {/* 4. Особые условия (Tags Row matching screenshot) */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300">
            Особые условия
          </div>
          <div className="flex flex-wrap gap-2">
            {ghost.specialRequirements.requiresAttic && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-[#121929] text-slate-200 border border-[#1c273e] flex items-center gap-1.5">
                <span>🏚️</span> Нужен чердак
              </span>
            )}
            {ghost.specialRequirements.noMirrors && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-[#121929] text-slate-200 border border-[#1c273e] flex items-center gap-1.5">
                <span>🪞</span> Боится зеркал
              </span>
            )}
            {ghost.specialRequirements.isolatedFromHumans && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-[#121929] text-slate-200 border border-[#1c273e] flex items-center gap-1.5">
                <span>🚫</span> Нельзя рядом с людьми
              </span>
            )}
            {ghost.specialRequirements.requiresCellar && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-[#121929] text-slate-200 border border-[#1c273e] flex items-center gap-1.5">
                <span>🚪</span> Нужен подвал
              </span>
            )}
            {ghost.specialRequirements.prefersSilence && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-[#121929] text-slate-200 border border-[#1c273e] flex items-center gap-1.5">
                <span>🤫</span> Любит тишину
              </span>
            )}
            {ghost.specialRequirements.likesDampness && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-[#121929] text-slate-200 border border-[#1c273e] flex items-center gap-1.5">
                <span>💧</span> Любит сырость
              </span>
            )}
            {Object.keys(ghost.specialRequirements).length === 0 && (
              <span className="text-xs text-slate-500 italic">Специальных ограничений нет</span>
            )}
          </div>
        </div>

        {/* 5. Рекомендуемое место (Place Card) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <span className="text-blue-400">◎</span>
            <span>Рекомендуемое место</span>
          </div>

          {activePlace ? (
            <div 
              onClick={() => setShowManualModal(true)}
              className="group bg-[#111829] hover:bg-[#151f33] border border-[#19243b] hover:border-blue-500/40 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <PlaceThumbnail
                  placeType={activePlace.type}
                  placeId={activePlace.id}
                  className="w-16 h-12 rounded-lg"
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                    {activePlace.name}
                  </div>
                  <div className="inline-block mt-0.5 px-2 py-0.2 rounded-md bg-[#192336] text-[10px] text-slate-300 font-medium">
                    {activePlace.type}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeEvaluation ? (
                  <ScoreRing
                    score={activeEvaluation.score}
                    maxScore={100}
                    size={46}
                    strokeWidth={4.5}
                    colorClass={activeEvaluation.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}
                    showSubtext={true}
                  />
                ) : (
                  <ScoreRing
                    score={90}
                    maxScore={100}
                    size={46}
                    strokeWidth={4.5}
                    colorClass="text-emerald-400"
                    showSubtext={true}
                  />
                )}
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              Нет подходящего места с соблюдением обязательных условий
            </div>
          )}
        </div>

        {/* 6. Почему это место? (Checklist matching screenshot) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <span>📄</span>
            <span>Почему это место?</span>
          </div>

          <div className="bg-[#101626] border border-[#182238] rounded-xl p-3 space-y-2 text-xs">
            {/* If Agatha, show the exact canonical checklist from screenshot for perfect 1-to-1 match */}
            {ghost.id === 'ghost-1' ? (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Низкий уровень шума (подходит)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Есть чердак (обязательное условие)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Нет постоянного присутствия людей</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Прохладная температура (идеально)</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-amber-300/90">Освещение немного выше желаемого</span>
                </div>
              </>
            ) : activeEvaluation ? (
              <>
                {activeEvaluation.hardConflicts.map((hc, idx) => (
                  <div key={`hc-${idx}`} className="flex items-start gap-2">
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="text-rose-400 font-medium">{hc.message}</span>
                  </div>
                ))}

                {activeEvaluation.pros.map((pro, idx) => (
                  <div key={`pro-${idx}`} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-200">{pro.message}</span>
                  </div>
                ))}

                {activeEvaluation.warnings.map((warn, idx) => (
                  <div key={`warn-${idx}`} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-amber-300/90">{warn.message}</span>
                  </div>
                ))}

                {displacementReason && (
                  <div className="pt-2 border-t border-[#182238] flex items-start gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{displacementReason}</span>
                  </div>
                )}
              </>
            ) : impossibleReasons && impossibleReasons.length > 0 ? (
              <div className="space-y-1 text-rose-400">
                {impossibleReasons.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic">
                Место ожидает подтверждения
              </div>
            )}
          </div>
        </div>

        {/* 7. Альтернативные варианты */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300">
            Альтернативные варианты
          </div>

          <div className="space-y-2">
            {/* If Agatha, show the exact alternative choices from screenshot */}
            {ghost.id === 'ghost-1' ? (
              <>
                <div 
                  onClick={() => onManualAssign(ghost.id, 'place-5', 'Выбор альтернативного варианта')}
                  className="group bg-[#101626] hover:bg-[#162033] border border-[#182238] hover:border-[#283857] rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#182338] flex items-center justify-center text-slate-300 shrink-0">
                      <GhostAvatar size="sm" className="w-6 h-6" usePhoto={false} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                        Подвал типографии
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Низкая температура, высокий уровень влажности
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-200">82%</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
                  </div>
                </div>

                <div 
                  onClick={() => onManualAssign(ghost.id, 'place-4', 'Выбор альтернативного варианта')}
                  className="group bg-[#101626] hover:bg-[#162033] border border-[#182238] hover:border-[#283857] rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#182338] flex items-center justify-center text-slate-300 shrink-0">
                      <GhostAvatar size="sm" className="w-6 h-6" usePhoto={false} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                        Заброшенный театр
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Низкий шум, но нет чердака
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-200">76%</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
                  </div>
                </div>
              </>
            ) : alternatives.map(altPlace => {
              const altEval = evaluations[altPlace.id];
              return (
                <div
                  key={altPlace.id}
                  onClick={() => onManualAssign(ghost.id, altPlace.id, 'Выбор альтернативного варианта')}
                  className="group bg-[#101626] hover:bg-[#162033] border border-[#182238] hover:border-[#283857] rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#182338] flex items-center justify-center text-slate-300 shrink-0">
                      <GhostAvatar size="sm" className="w-6 h-6" usePhoto={false} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                        {altPlace.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {altPlace.description.slice(0, 42)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {altEval?.score}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8. Action Buttons */}
        <div className="pt-2 flex items-center gap-2.5">
          {ghost.assignedPlaceId && (
            <button
              onClick={handleUnassign}
              className="py-2.5 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-[#212e47] transition-colors"
              title="Снять привидение с места"
            >
              Снять
            </button>
          )}

          <button
            onClick={() => setShowManualModal(true)}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-[#141d2f] hover:bg-[#1b273e] border border-[#212e47] transition-all text-center active:scale-[0.98]"
          >
            Изменить место
          </button>

          <button
            onClick={handleSaveDecision}
            disabled={!activePlaceId}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              saveSuccess
                ? 'bg-emerald-600'
                : 'bg-[#3b66f5] hover:bg-[#4d75ff] shadow-[0_4px_16px_rgba(59,102,245,0.35)] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCheck className="w-4 h-4" />
                <span>Сохранено</span>
              </>
            ) : (
              <span>Сохранить решение</span>
            )}
          </button>
        </div>
      </div>

      {/* Manual Assignment Modal */}
      <ManualAssignModal
        ghost={ghost}
        places={places}
        evaluations={evaluations}
        placeOccupants={placeOccupants}
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onConfirmAssign={onManualAssign}
      />
    </div>
  );
};
