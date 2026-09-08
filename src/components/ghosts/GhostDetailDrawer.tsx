import React, { useState } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Thermometer, 
  Clock, 
  Flame,
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

interface GhostDetailDrawerProps {
  ghost: GhostApplication | null;
  places: RelocationPlace[];
  evaluations: Record<string, PlaceMatchEvaluation>;
  placeOccupants: Record<string, string[]>;
  recommendedPlaceId: string | null;
  displacementReason?: string;
  impossibleReasons?: string[];
  isOpen: boolean;
  onClose: () => void;
  onManualAssign: (ghostId: string, placeId: string, reason?: string) => void;
  onUnassign: (ghostId: string) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const GhostDetailDrawer: React.FC<GhostDetailDrawerProps> = ({
  ghost,
  places,
  evaluations,
  placeOccupants,
  recommendedPlaceId,
  displacementReason,
  impossibleReasons,
  isOpen,
  onClose,
  onManualAssign,
  onUnassign,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false
}) => {
  const { showToast } = useToast();
  const [showManualModal, setShowManualModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !ghost) return null;

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

  let statusBadge = (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
      Новая
    </span>
  );
  if (ghost.assignedPlaceId) {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
        <Check className="w-3 h-3" />
        Подобрано
      </span>
    );
  } else if (impossibleReasons && impossibleReasons.length > 0) {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        Невозможно
      </span>
    );
  } else if (ghost.deadlineHoursLeft <= 24) {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        Требует решения
      </span>
    );
  }

  const alternatives = places
    .filter(p => p.id !== activePlaceId && evaluations[p.id]?.isEligible)
    .sort((a, b) => (evaluations[b.id]?.score || 0) - (evaluations[a.id]?.score || 0))
    .slice(0, 3);

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
      onClose();
    }, 450);
  };

  const handleUnassign = () => {
    onUnassign(ghost.id);
    showToast({
      type: 'info',
      title: 'Назначение снято',
      message: `${ghost.name} возвращен в очередь подбора`
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay with smooth fade */}
      <div 
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-in Drawer Container with Cubic Easing */}
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[450px] bg-[#0e1320] border-l border-[#1d273d] shadow-2xl flex flex-col transition-transform duration-320 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ animation: 'drawerSlide 320ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        <style>{`
          @keyframes drawerSlide {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Top bar with Inspector Navigation & Close button */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-[#1b253b] select-none shrink-0 bg-[#0d121e]">
          {/* Previous / Next Inspector Controls */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <button
              onClick={onNavigatePrev}
              disabled={!hasPrev}
              className="px-2 py-1 rounded hover:bg-[#182338] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-0.5"
              title="Предыдущая заявка (←)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Пред.</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={onNavigateNext}
              disabled={!hasNext}
              className="px-2 py-1 rounded hover:bg-[#182338] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-0.5"
              title="Следующая заявка (→)"
            >
              <span>След.</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              #{ghost.id}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#182338] rounded-lg transition-colors"
              title="Закрыть (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic content with smooth key re-render transition */}
        <div 
          key={ghost.id}
          className="flex-1 overflow-y-auto p-6 space-y-6 transition-all duration-200"
          style={{ animation: 'entranceFadeUp 260ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
        >
          {/* 1. HERO SECTION: Big Glowing Avatar & Info */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <GhostAvatar size="xl" className="w-20 h-20 shadow-[0_0_24px_rgba(59,130,246,0.35)]" />
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{ghost.name}</h2>
                <div className="text-xs font-mono text-slate-400 mt-0.5">#{ghost.id}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {ghost.bio ? ghost.bio.split('.')[0] : 'Заявка на переселение'}
                </div>
              </div>
            </div>
            <div>{statusBadge}</div>
          </div>

          {/* 2. THREE METRIC PILLS: Anxiety, Temperature, Deadline */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#141b2b] border border-[#1f2b42] rounded-xl p-2.5 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 leading-tight">Тревожность</div>
                <div className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                  {anxietyLabels[ghost.anxietyLevel]}
                </div>
              </div>
            </div>

            <div className="bg-[#141b2b] border border-[#1f2b42] rounded-xl p-2.5 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 leading-tight">Температура</div>
                <div className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                  {tempLabels[ghost.preferredTemperature]}
                </div>
              </div>
            </div>

            <div className="bg-[#141b2b] border border-[#1f2b42] rounded-xl p-2.5 flex items-center gap-2">
              <Clock className={`w-4 h-4 shrink-0 ${ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : 'text-amber-400'}`} />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 leading-tight">Дедлайн</div>
                <div className={`text-xs font-semibold truncate mt-0.5 ${ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {formatDeadline(ghost.deadlineHoursLeft)}
                </div>
              </div>
            </div>
          </div>

          {/* 3. ОСОБЫЕ УСЛОВИЯ (Special Requirements Pills) */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Особые условия
            </h3>
            <div className="flex flex-wrap gap-2">
              {ghost.specialRequirements.requiresAttic && (
                <span className="px-3 py-1.5 rounded-lg text-xs bg-[#161f33] text-slate-200 border border-[#223152] flex items-center gap-1.5">
                  <span>🏚️</span> Нужен чердак
                </span>
              )}
              {ghost.specialRequirements.noMirrors && (
                <span className="px-3 py-1.5 rounded-lg text-xs bg-[#161f33] text-slate-200 border border-[#223152] flex items-center gap-1.5">
                  <span>🪞</span> Боится зеркал
                </span>
              )}
              {ghost.specialRequirements.isolatedFromHumans && (
                <span className="px-3 py-1.5 rounded-lg text-xs bg-[#161f33] text-slate-200 border border-[#223152] flex items-center gap-1.5">
                  <span>🚫</span> Нельзя рядом с людьми
                </span>
              )}
              {ghost.specialRequirements.requiresCellar && (
                <span className="px-3 py-1.5 rounded-lg text-xs bg-[#161f33] text-slate-200 border border-[#223152] flex items-center gap-1.5">
                  <span>🚪</span> Нужен подвал
                </span>
              )}
              {ghost.specialRequirements.prefersSilence && (
                <span className="px-3 py-1.5 rounded-lg text-xs bg-[#161f33] text-slate-200 border border-[#223152] flex items-center gap-1.5">
                  <span>🤫</span> Любит тишину
                </span>
              )}
              {ghost.specialRequirements.likesDampness && (
                <span className="px-3 py-1.5 rounded-lg text-xs bg-[#161f33] text-slate-200 border border-[#223152] flex items-center gap-1.5">
                  <span>💧</span> Любит сырость
                </span>
              )}
              {Object.keys(ghost.specialRequirements).length === 0 && (
                <span className="text-xs text-slate-500 italic">Специальных ограничений нет</span>
              )}
            </div>
          </div>

          {/* 4. РЕКОМЕНДУЕМОЕ МЕСТО (Place Card with Animated Score Ring) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-400">◎</span>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                {ghost.assignedPlaceId ? 'Назначенное место' : 'Рекомендуемое место'}
              </h3>
            </div>

            {activePlace ? (
              <div 
                onClick={() => setShowManualModal(true)}
                className="group bg-[#141b2c] hover:bg-[#18233a] border border-[#202c46] hover:border-blue-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <PlaceThumbnail
                    placeType={activePlace.type}
                    placeId={activePlace.id}
                    className="w-16 h-12 rounded-lg"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                      {activePlace.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {activePlace.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeEvaluation && (
                    <ScoreRing
                      score={activeEvaluation.score}
                      maxScore={100}
                      size={48}
                      strokeWidth={4.5}
                      colorClass={activeEvaluation.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}
                      showSubtext={true}
                    />
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                Нет доступных мест с соблюдением обязательных условий
              </div>
            )}
          </div>

          {/* 5. ПОЧЕМУ ЭТО МЕСТО? (Structured Factors with Stagger) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">📄</span>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Почему это место?
              </h3>
            </div>

            <div className="bg-[#121826] border border-[#1b253b] rounded-xl p-3.5 space-y-2.5 text-xs">
              {activeEvaluation ? (
                <>
                  {/* Hard Conflicts */}
                  {activeEvaluation.hardConflicts.map((hc, idx) => (
                    <div 
                      key={`hc-${idx}`} 
                      className="flex items-start gap-2"
                      style={{ animation: `entranceFadeUp 250ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 40}ms both` }}
                    >
                      <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="text-rose-400 font-medium">
                        {hc.message}
                      </span>
                    </div>
                  ))}

                  {/* Pros */}
                  {activeEvaluation.pros.map((pro, idx) => (
                    <div 
                      key={`pro-${idx}`} 
                      className="flex items-start gap-2"
                      style={{ animation: `entranceFadeUp 250ms cubic-bezier(0.22, 1, 0.36, 1) ${(idx + 1) * 40}ms both` }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-200">
                        {pro.message}
                      </span>
                    </div>
                  ))}

                  {/* Warnings */}
                  {activeEvaluation.warnings.map((warn, idx) => (
                    <div 
                      key={`warn-${idx}`} 
                      className="flex items-start gap-2"
                      style={{ animation: `entranceFadeUp 250ms cubic-bezier(0.22, 1, 0.36, 1) ${(idx + 3) * 40}ms both` }}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-amber-300/90">
                        {warn.message}
                      </span>
                    </div>
                  ))}

                  {/* Displacement note */}
                  {displacementReason && (
                    <div className="pt-2 border-t border-[#1b253b] flex items-start gap-2 text-amber-400">
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
                  Место еще не выбрано для оценки
                </div>
              )}
            </div>
          </div>

          {/* 6. АЛЬТЕРНАТИВНЫЕ ВАРИАНТЫ (Alternative Choices) */}
          {alternatives.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Альтернативные варианты
              </h3>

              <div className="space-y-2">
                {alternatives.map(altPlace => {
                  const altEval = evaluations[altPlace.id];
                  return (
                    <div
                      key={altPlace.id}
                      onClick={() => onManualAssign(ghost.id, altPlace.id, 'Выбор альтернативного варианта')}
                      className="group bg-[#121826] hover:bg-[#162033] border border-[#1b253b] hover:border-[#283857] rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PlaceThumbnail
                          placeType={altPlace.type}
                          placeId={altPlace.id}
                          className="w-10 h-10 rounded-lg"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                            {altPlace.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {altPlace.description.slice(0, 48)}...
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
          )}
        </div>

        {/* 7. STICKY BOTTOM ACTIONS */}
        <div className="p-4 border-t border-[#1b253b] bg-[#0b101c] flex items-center gap-2.5 select-none shrink-0">
          {ghost.assignedPlaceId && (
            <button
              onClick={handleUnassign}
              className="py-2.5 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-[#233350] transition-colors"
              title="Снять привидение с места"
            >
              Снять
            </button>
          )}

          <button
            onClick={() => setShowManualModal(true)}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-[#162033] hover:bg-[#1e2c45] border border-[#233350] transition-colors text-center"
          >
            Изменить место
          </button>

          <button
            onClick={handleSaveDecision}
            disabled={!activePlaceId}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white transition-all shadow-md flex items-center justify-center gap-1.5 ${
              saveSuccess
                ? 'bg-emerald-600'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCheck className="w-4 h-4" />
                Сохранено
              </>
            ) : (
              'Сохранить решение'
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
    </>
  );
};
