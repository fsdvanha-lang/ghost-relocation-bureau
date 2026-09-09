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
  CheckCheck,
  MapPin,
  Home,
  Eye
} from 'lucide-react';
import type { GhostApplication } from '../../types/ghost';
import type { RelocationPlace } from '../../types/place';
import type { PlaceMatchEvaluation } from '../../types/matching';
import { GhostAvatar } from '../common/GhostAvatar';
import { PlaceThumbnail } from '../common/PlaceThumbnail';
import { ScoreRing } from '../common/ScoreRing';
import { ManualAssignModal } from '../matching/ManualAssignModal';
import { LocationDetailModal } from '../locations/LocationDetailModal';
import { SpotlightCard } from '../common/SpotlightCard';
import { sound } from '../../utils/audioSystem';
import { useToast } from '../common/ToastContext';
import { useBureau } from '../../context/BureauContext';
import { getGhostFullReference } from '../../utils/ghostMeta';
import { getInspectorDecisionHeader } from '../../utils/statusSystem';

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
  onInspectPlace?: (place: RelocationPlace) => void;
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
  onInspectPlace,
  isDocked = false
}) => {
  const { state } = useBureau();
  const { showToast } = useToast();
  const [showManualModal, setShowManualModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [internalInspectPlace, setInternalInspectPlace] = useState<RelocationPlace | null>(null);

  const handleInspect = (place: RelocationPlace) => {
    if (onInspectPlace) {
      onInspectPlace(place);
    } else {
      setInternalInspectPlace(place);
    }
  };

  const activePlaceId = ghost.assignedPlaceId || recommendedPlaceId;
  const activePlace = activePlaceId ? places.find(p => p.id === activePlaceId) : null;
  const activeEvaluation = activePlaceId ? evaluations[activePlaceId] : undefined;

  // Score Count-Up Animation (0 -> targetScore over 650ms)
  const targetScore = activeEvaluation ? activeEvaluation.score : 0;
  const [displayScore, setDisplayScore] = useState(0);

  React.useEffect(() => {
    let animId: number;

    if (ghost.status === 'impossible' || !activePlace) {
      animId = requestAnimationFrame(() => setDisplayScore(0));
      return () => cancelAnimationFrame(animId);
    }

    const duration = 650;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * targetScore);
      setDisplayScore(current);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [ghost.id, activePlaceId, targetScore, activePlace, ghost.status]);

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
      title: 'Выселение выполнено',
      message: `${ghost.name} возвращен в очередь подбора`
    });
  };

  // Close on Escape key (accessibility)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showManualModal) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showManualModal]);

  // Find the highest-scoring eligible place for comparison
  const autoBestPlace = React.useMemo(() => {
    const sorted = [...places]
      .filter(p => evaluations[p.id]?.isEligible)
      .sort((a, b) => (evaluations[b.id]?.score || 0) - (evaluations[a.id]?.score || 0));
    return sorted[0] || null;
  }, [places, evaluations]);

  // Status badge styling with Dark Luxury palette
  let statusBadge = (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
      Подобрано
    </span>
  );
  if (ghost.manualOverride) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
        <span>👤</span>
        Вручную
      </span>
    );
  } else if (ghost.assignedPlaceId) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
        <Check className="w-3 h-3" />
        Подобрано
      </span>
    );
  } else if (ghost.status === 'impossible' || (impossibleReasons && impossibleReasons.length > 0)) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
        <span>✕</span>
        Невозможно
      </span>
    );
  } else if (ghost.deadlineHoursLeft <= 24) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
        Требует решения
      </span>
    );
  } else if (!activePlaceId) {
    statusBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider bg-white/10 text-[#F3F3F0] border border-white/20">
        Новая
      </span>
    );
  }

  const decisionHeader = getInspectorDecisionHeader(ghost, state.allocation.ghostResults[ghost.id]);

  return (
    <div className={`bg-[#0c0c0f] border border-white/[0.08] rounded-2xl flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.85)] select-none relative overflow-hidden transition-all duration-200 w-full h-full max-h-full ${
      isDocked ? '' : 'max-w-[440px]'
    }`}>
      {/* 1. Header with Close Button */}
      <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.08] bg-[#08080a]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F3F3F0] shadow-[0_0_8px_rgba(243,243,240,0.8)]" />
          <span className="text-[11px] font-heading font-bold text-[#F3F3F0] uppercase tracking-[0.16em]">
            Инспектор сущности
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-[#7B7B78] hover:text-[#F3F3F0] hover:bg-white/[0.06] rounded-lg transition-colors"
          title="Закрыть панель инспектора"
          aria-label="Закрыть панель инспектора"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 1.1 DECISION STATUS Banner (Requirement 12) */}
      <div className={`shrink-0 px-5 py-2.5 border-b border-white/[0.08] flex items-center justify-between transition-colors ${
        decisionHeader.code === 'CONFIRMED'
          ? 'bg-emerald-500/[0.08]'
          : decisionHeader.code === 'IMPOSSIBLE'
          ? 'bg-rose-500/[0.08]'
          : 'bg-amber-500/[0.08]'
      }`}>
        <div className="min-w-0">
          <div className={`text-[11px] font-heading font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
            decisionHeader.code === 'CONFIRMED'
              ? 'text-emerald-300'
              : decisionHeader.code === 'IMPOSSIBLE'
              ? 'text-rose-400'
              : 'text-amber-300'
          }`}>
            <span>{decisionHeader.label}</span>
          </div>
          <div className="text-[10px] text-[#A3A3A0] truncate mt-0.5">
            {decisionHeader.description}
          </div>
        </div>
      </div>

      {/* Dynamic Body Content */}
      <div 
        key={ghost.id} 
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-5 py-4 space-y-4"
        style={{ animation: 'entranceFadeUp 220ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* SECTION 1: КТО (Identity & Persona) */}
        <SpotlightCard 
          enableTilt={false}
          className="rounded-xl p-4 space-y-3.5"
        >
          <div className="text-[10px] font-heading uppercase tracking-[0.14em] text-[#7B7B78] font-bold">
            01 · Профиль заявителя
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <GhostAvatar
                size="xl"
                ghostId={ghost.id}
                isDrawer={true}
                className="w-14 h-14 rounded-xl border border-white/[0.12] shadow-[0_0_20px_rgba(255,255,255,0.06)] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-heading font-bold text-lg text-[#F3F3F0] tracking-tight leading-snug">
                  {ghost.name}
                </h2>
                <div className="text-[11px] text-[#A3A3A0] font-mono mt-0.5">
                  {getGhostFullReference(ghost.id)}
                </div>
              </div>
            </div>
            <div className="shrink-0">{statusBadge}</div>
          </div>
          <div className="text-xs text-[#A3A3A0] leading-relaxed pt-0.5">
            {ghost.bio ? ghost.bio : 'Заявка на расселение в специализированную локацию.'}
          </div>

          {/* Metric Pills */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-[#09090c] border border-white/[0.06] rounded-lg p-2.5 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-[#F3F3F0]">
                <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{anxietyLabels[ghost.anxietyLevel]}</span>
              </div>
              <div className="text-[10px] font-heading uppercase tracking-wider text-[#7B7B78] mt-1">тревожность</div>
            </div>

            <div className="bg-[#09090c] border border-white/[0.06] rounded-lg p-2.5 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-[#F3F3F0] truncate">
                <Thermometer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{tempLabels[ghost.preferredTemperature]}</span>
              </div>
              <div className="text-[10px] font-heading uppercase tracking-wider text-[#7B7B78] mt-1">температура</div>
            </div>

            <div className="bg-[#09090c] border border-white/[0.06] rounded-lg p-2.5 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-[#F3F3F0]">
                <Clock className={`w-3.5 h-3.5 shrink-0 ${ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : 'text-amber-400'}`} />
                <span className={ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : 'text-[#F3F3F0]'}>
                  {formatDeadline(ghost.deadlineHoursLeft)}
                </span>
              </div>
              <div className="text-[10px] font-heading uppercase tracking-wider text-[#7B7B78] mt-1">дедлайн</div>
            </div>
          </div>
        </SpotlightCard>

        {/* SECTION 2: ЧТО НАДО (Hard & Soft Constraints) */}
        <div 
          className="bg-[#121217] border border-white/[0.08] rounded-xl p-4 space-y-3"
          style={{ animation: 'entranceFadeUp 280ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both' }}
        >
          <div className="text-[10px] font-heading uppercase tracking-[0.14em] text-[#7B7B78] font-bold">
            02 · Требования сущности
          </div>

          {/* Hard Constraints (Strict rules) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-heading font-semibold text-rose-400">
              <span>●</span>
              <span>Обязательные ограничения (Hard constraints):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ghost.specialRequirements.requiresAttic && (
                <span className="px-2.5 py-1 rounded-md text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/25 flex items-center gap-1.5">
                  <span>🏚️</span> Нужен чердак
                </span>
              )}
              {ghost.specialRequirements.noMirrors && (
                <span className="px-2.5 py-1 rounded-md text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/25 flex items-center gap-1.5">
                  <span>🪞</span> Боится зеркал (запрещены)
                </span>
              )}
              {ghost.specialRequirements.isolatedFromHumans && (
                <span className="px-2.5 py-1 rounded-md text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/25 flex items-center gap-1.5">
                  <span>🚫</span> Изоляция от людей
                </span>
              )}
              {ghost.specialRequirements.requiresCellar && (
                <span className="px-2.5 py-1 rounded-md text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/25 flex items-center gap-1.5">
                  <span>🚪</span> Нужен подвал
                </span>
              )}
              {!ghost.specialRequirements.requiresAttic &&
               !ghost.specialRequirements.noMirrors &&
               !ghost.specialRequirements.isolatedFromHumans &&
               !ghost.specialRequirements.requiresCellar && (
                <span className="text-[11px] text-[#7B7B78] italic">Специальных жестких запретов нет</span>
              )}
            </div>
          </div>

          {/* Soft Preferences */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-[11px] font-heading font-semibold text-[#F3F3F0]">
              <span className="text-[#7B7B78]">○</span>
              <span>Пожелания и предпочтения (Soft constraints):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-md text-[11px] bg-[#09090c] text-[#E8E6E1] border border-white/[0.08]">
                {tempLabels[ghost.preferredTemperature]} температура
              </span>
              {ghost.specialRequirements.prefersSilence && (
                <span className="px-2.5 py-1 rounded-md text-[11px] bg-[#09090c] text-[#E8E6E1] border border-white/[0.08] flex items-center gap-1">
                  <span>🤫</span> Тишина
                </span>
              )}
              {ghost.specialRequirements.likesDampness && (
                <span className="px-2.5 py-1 rounded-md text-[11px] bg-[#09090c] text-[#E8E6E1] border border-white/[0.08] flex items-center gap-1">
                  <span>💧</span> Сырость
                </span>
              )}
              <span className="px-2.5 py-1 rounded-md text-[11px] bg-[#09090c] text-[#E8E6E1] border border-white/[0.08]">
                Тревожность: {anxietyLabels[ghost.anxietyLevel]}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: РЕКОМЕНДАЦИЯ (Recommended Place & Compatibility Score) */}
        <div 
          className="bg-[#121217] border border-white/[0.08] rounded-xl p-4 space-y-3"
          style={{ animation: 'entranceFadeUp 280ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both' }}
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-heading uppercase tracking-[0.14em] text-[#7B7B78] font-bold">
              {ghost.assignedPlaceId ? '03 · Утвержденная локация' : '03 · Рекомендованная локация'}
            </div>
            <span className={`text-[10px] font-mono tracking-wider ${ghost.assignedPlaceId ? 'text-emerald-400' : 'text-[#A3A3A0]'}`}>
              {ghost.assignedPlaceId ? 'Заселен' : 'Алгоритмический подбор'}
            </span>
          </div>

          {activePlace && ghost.status !== 'impossible' ? (
            <SpotlightCard 
              enableTilt={false}
              onClick={() => {
                sound.playClick();
                setShowManualModal(true);
              }}
              className="group rounded-xl p-3.5 space-y-3 cursor-pointer shadow-sm"
            >
              {/* Row 1: Thumbnail + Place Name + Type + Free slots */}
              <div className="flex items-center gap-3">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInspect(activePlace);
                  }}
                  className="relative cursor-pointer group/thumb shrink-0"
                  title="Подробно изучить локацию"
                >
                  <PlaceThumbnail
                    placeType={activePlace.type}
                    placeId={activePlace.id}
                    className="w-14 h-14 rounded-lg border border-white/[0.08] group-hover/thumb:border-white/30 shrink-0 object-cover shadow-xs transition-all"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-display font-bold text-[#F3F3F0] group-hover:text-white transition-colors leading-snug truncate">
                      {activePlace.name}
                    </h3>
                    <span className="shrink-0 px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-[#E8E6E1] font-heading font-medium">
                      {activePlace.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9E9E9A] font-mono mt-1 flex items-center justify-between">
                    <span>
                      Свободно: <strong className="text-[#F3F3F0]">{Math.max(0, activePlace.capacity - (placeOccupants[activePlace.id]?.length || 0))}</strong> из {activePlace.capacity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspect(activePlace);
                      }}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-heading uppercase tracking-wider flex items-center gap-0.5 hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Подробнее</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Compatibility score breakdown + Click-to-change callout */}
              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ScoreRing
                    score={displayScore}
                    maxScore={100}
                    size={34}
                    strokeWidth={3.5}
                    colorClass={displayScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}
                    showSubtext={false}
                  />
                  <div>
                    <div className="text-xs font-bold font-mono text-emerald-400 leading-tight">
                      {displayScore} / 100
                    </div>
                    <div className="text-[9px] font-heading uppercase tracking-wider text-[#9E9E9A]">
                      совместимость
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-heading font-semibold text-[#9E9E9A] group-hover:text-[#F3F3F0] transition-colors">
                  <span>Изменить место</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#9E9E9A] group-hover:text-[#F3F3F0] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </SpotlightCard>
          ) : (
            <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-heading font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Невозможно расселить</span>
                </div>
                <div className="text-right font-mono text-xs font-bold text-[#7B7B78]" title="Детерминированная оценка соответствия условий и предпочтений.">
                  — / 100
                </div>
              </div>
              <div className="text-xs text-rose-300 font-medium">
                «Нет допустимого места»
              </div>
              <div className="text-[11px] text-[#9d9d99] leading-snug">
                Ни одна из 8 локаций бюро не удовлетворяет одновременно всем жестким ограничениям сущности.
              </div>
            </div>
          )}

          {/* 3-Tier Visual Comparison Banner (Requirement 12: AI vs Operator vs Delta) */}
          {ghost.manualOverride && activePlace && (() => {
            const aiScore = autoBestPlace && evaluations[autoBestPlace.id] ? evaluations[autoBestPlace.id].score : null;
            const opScore = activeEvaluation ? activeEvaluation.score : null;
            const scoreDelta = (aiScore !== null && opScore !== null) ? opScore - aiScore : null;
            const hasHardConflicts = !!(activeEvaluation?.hardConflicts && activeEvaluation.hardConflicts.length > 0);
            const hardConflictsCount = activeEvaluation?.hardConflicts?.length || 0;

            return (
              <div className="rounded-xl border border-purple-500/25 bg-[#14121a] p-3.5 space-y-3 shadow-md">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-heading font-bold uppercase tracking-wider text-purple-300">
                    <span>👤</span>
                    <span>Ручное решение оператора (Human-in-the-loop)</span>
                  </span>
                  {scoreDelta !== null ? (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      scoreDelta >= 0 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    }`}>
                      {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} очков
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#7B7B78] px-2 py-0.5 rounded-full border border-white/10">
                      Нет сравнения
                    </span>
                  )}
                </div>

                {/* 3-Tier Grid */}
                <div className="space-y-2 text-xs">
                  {/* Tier 1: AI Suggested */}
                  {autoBestPlace && (
                    <div className="p-2.5 rounded-lg bg-[#0c0c10] border border-white/[0.06] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold flex items-center justify-center shrink-0">
                          AI
                        </span>
                        <div className="min-w-0">
                          <div className="text-[11px] font-heading font-semibold text-[#F3F3F0] truncate">
                            {autoBestPlace.name}
                          </div>
                          <div className="text-[9px] text-[#7B7B78] uppercase tracking-wider">
                            Автоматическая рекомендация
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                        {aiScore !== null ? `${aiScore} / 100` : '— / 100'}
                      </span>
                    </div>
                  )}

                  {/* Tier 2: Operator Selected */}
                  <div className="p-2.5 rounded-lg bg-[#0c0c10] border border-purple-500/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold flex items-center justify-center shrink-0">
                        OP
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-heading font-semibold text-purple-200 truncate">
                          {activePlace.name}
                        </div>
                        <div className="text-[9px] text-[#7B7B78] uppercase tracking-wider">
                          Выбор оператора
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold shrink-0 ${
                      (opScore ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {opScore !== null ? `${opScore} / 100` : '— / 100'}
                    </span>
                  </div>

                  {/* Tier 3: Trade-offs and Conflicts */}
                  <div className="pt-1 text-[11px] space-y-1.5">
                    <div className="text-[#9E9E9A]">
                      <strong className="text-[#E8E6E1]">Причина оператора:</strong> {ghost.manualOverrideReason || 'Ручная корректировка размещения.'}
                    </div>
                    {hasHardConflicts && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>Внимание: нарушено {hardConflictsCount} {hardConflictsCount === 1 ? 'жесткое ограничение' : 'жестких ограничений'} локации</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Micro-explainer note on deterministic score */}
          <div className="text-[10px] text-[#7B7B78] bg-[#09090c] p-2.5 rounded-lg border border-white/[0.05] leading-relaxed">
            💡 <strong className="text-[#F3F3F0]">Score совместимости</strong> рассчитывается детерминированным алгоритмом: проверка жестких правил + оценка микроклимата, освещения, шума и тревожности.
          </div>
        </div>

        {/* SECTION 4: ПОЧЕМУ ЭТО МЕСТО? (Matches, Trade-offs, Conflicts) */}
        <div 
          className="bg-[#121217] border border-white/[0.08] rounded-xl p-4 space-y-3"
          style={{ animation: 'entranceFadeUp 280ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both' }}
        >
          <div className="text-[10px] font-heading uppercase tracking-[0.14em] text-[#7B7B78] font-bold">
            04 · Обоснование подбора
          </div>

          <div className="space-y-3 text-xs">
            {/* Impossible reasons if applicable */}
            {ghost.status === 'impossible' && (
              <div className="space-y-1.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-[11px] font-heading font-bold text-rose-400 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  <span>Взаимоисключающий комплекс требований:</span>
                </div>
                <div className="space-y-1 pl-4 text-rose-300 text-[11px]">
                  <div className="list-item">Не существует локации с одновременным наличием чердака и подвала</div>
                  <div className="list-item">Все уединенные локации без людей не имеют чердака</div>
                  <div className="list-item">В потенциально доступных локациях установлены зеркала</div>
                </div>
              </div>
            )}
            {/* 1. Conflicts (✕) if any */}
            {activeEvaluation?.hardConflicts && activeEvaluation.hardConflicts.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-[11px] font-heading font-bold text-rose-400 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  <span>Конфликты жестких ограничений:</span>
                </div>
                <div className="space-y-1 pl-4">
                  {activeEvaluation.hardConflicts.map((hc, idx) => (
                    <div key={`hc-${idx}`} className="text-rose-300 text-[11px] list-item">
                      {hc.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Matches (✓) */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-heading font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Совпадения условий:</span>
              </div>
              <div className="space-y-1 pl-1">
                {ghost.id === 'ghost-1' && activePlace?.id === 'place-1' ? (
                  <>
                    <div 
                      className="flex items-start gap-2 text-[#E8E6E1] text-[11px]"
                      style={{ animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Есть просторный чердак (обязательное условие)</span>
                    </div>
                    <div 
                      className="flex items-start gap-2 text-[#E8E6E1] text-[11px]"
                      style={{ animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) 50ms both' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Низкий уровень шума — подходит для высокой тревожности</span>
                    </div>
                    <div 
                      className="flex items-start gap-2 text-[#E8E6E1] text-[11px]"
                      style={{ animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Изоляция от постоянного присутствия людей</span>
                    </div>
                    <div 
                      className="flex items-start gap-2 text-[#E8E6E1] text-[11px]"
                      style={{ animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Прохладная температура соответствует предпочтению</span>
                    </div>
                  </>
                ) : activeEvaluation && activeEvaluation.pros.length > 0 ? (
                  activeEvaluation.pros.map((pro, idx) => (
                    <div 
                      key={`pro-${idx}`} 
                      className="flex items-start gap-2 text-[#E8E6E1] text-[11px]"
                      style={{ 
                        animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
                        animationDelay: `${idx * 50}ms`
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pro.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[#7B7B78] italic text-[11px] pl-2">Совпадений не зафиксировано</div>
                )}
              </div>
            </div>

            {/* 3. Trade-offs (⚠) */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <div className="text-[11px] font-heading font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Компромиссы и нюансы:</span>
              </div>
              <div className="space-y-1 pl-1">
                {ghost.id === 'ghost-1' && activePlace?.id === 'place-1' ? (
                  <div 
                    className="flex items-start gap-2 text-amber-300/90 text-[11px]"
                    style={{ animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both' }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Освещение в коридорах замка чуть выше желаемого полумрака</span>
                  </div>
                ) : activeEvaluation && activeEvaluation.warnings.length > 0 ? (
                  activeEvaluation.warnings.map((warn, idx) => (
                    <div 
                      key={`warn-${idx}`} 
                      className="flex items-start gap-2 text-amber-300/90 text-[11px]"
                      style={{ 
                        animation: 'factorStaggerIn 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
                        animationDelay: `${(idx + (activeEvaluation.pros.length || 0)) * 50}ms`
                      }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{warn.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[#7B7B78] italic text-[11px] pl-2">Существенных компромиссов нет</div>
                )}
              </div>
            </div>

            {/* Displacement Notice if applicable */}
            {displacementReason && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{displacementReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: АЛЬТЕРНАТИВНЫЕ ВАРИАНТЫ */}
        <div 
          className="bg-[#121217] border border-white/[0.08] rounded-xl p-4 space-y-2.5"
          style={{ animation: 'entranceFadeUp 280ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both' }}
        >
          <div className="text-[10px] font-heading uppercase tracking-[0.14em] text-[#7B7B78] font-bold">
            05 · Альтернативные локации
          </div>

          <div className="space-y-2">
            {alternatives.length > 0 ? (
              alternatives.map(altPlace => {
                const altEval = evaluations[altPlace.id];
                return (
                  <div
                    key={altPlace.id}
                    onClick={() => onManualAssign(ghost.id, altPlace.id, 'Выбор альтернативного варианта из инспектора')}
                    className="group bg-[#09090c] hover:bg-[#16161d] border border-white/[0.06] hover:border-white/15 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspect(altPlace);
                        }}
                        className="relative cursor-pointer group/thumb shrink-0"
                        title="Подробно изучить локацию"
                      >
                        <PlaceThumbnail
                          placeType={altPlace.type}
                          placeId={altPlace.id}
                          className="w-10 h-8 rounded-md border border-white/[0.06] group-hover/thumb:border-white/30 shrink-0"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center rounded-md transition-opacity">
                          <Eye className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-display font-bold text-[#E8E6E1] group-hover:text-white transition-colors truncate">
                          {altPlace.name}
                        </div>
                        <div className="text-[10px] text-[#7B7B78] truncate">
                          {altPlace.type} · свободно {altPlace.capacity - (placeOccupants[altPlace.id]?.length || 0)} мест
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-[#F3F3F0]">
                        {altEval?.score ? `${altEval.score} / 100` : '—'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7B7B78] group-hover:text-[#F3F3F0] transition-colors" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-[#7B7B78] italic text-[11px]">Других подходящих вариантов нет</div>
            )}
          </div>
        </div>
      </div>

      {/* PINNED BOTTOM ACTION BAR */}
      <div className="shrink-0 p-4 border-t border-white/[0.08] bg-[#0c0c11]/98 backdrop-blur-md z-20 flex items-center gap-2.5">
        {ghost.assignedPlaceId ? (
          <>
            <button
              onClick={() => setShowManualModal(true)}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] hover:border-white/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer shadow-md"
              title="Переселить привидение в другую локацию"
            >
              <MapPin className="w-4 h-4 text-[#A3A3A0] shrink-0" />
              <span>Изменить место</span>
            </button>

            <button
              onClick={handleUnassign}
              className="py-3 px-4 rounded-xl text-xs font-heading font-semibold text-[#9E9E9A] hover:text-rose-300 hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/25 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
              title="Выселить привидение обратно в очередь"
            >
              Выселить
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowManualModal(true)}
              className="flex-1 py-3 px-3.5 rounded-xl text-xs font-heading font-semibold uppercase tracking-wider text-[#F3F3F0] hover:text-white bg-[#15151b] hover:bg-[#1c1c24] border border-white/[0.12] hover:border-white/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
              title="Открыть полный каталог локаций для ручного выбора"
            >
              <MapPin className="w-3.5 h-3.5 text-[#9E9E9A] shrink-0" />
              <span className="truncate">Выбрать место</span>
            </button>

            {activePlace && ghost.status !== 'impossible' ? (
              <button
                onClick={handleSaveDecision}
                className={`flex-1 py-3 px-3.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#F3F3F0] text-[#08080a] hover:bg-white shadow-[0_0_20px_rgba(243,243,240,0.25)]'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>Назначено!</span>
                </>
              ) : (
                <>
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Подтвердить назначение</span>
                </>
              )}
            </button>
            ) : (
              <div className="flex-1 py-3 px-2.5 rounded-xl text-xs font-heading font-semibold uppercase tracking-wider bg-white/[0.04] text-[#7B7B78] border border-white/[0.06] text-center">
                Нет места
              </div>
            )}
          </>
        )}
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

      {/* Location Detail Modal Fallback */}
      <LocationDetailModal
        place={internalInspectPlace}
        occupants={
          internalInspectPlace 
            ? (placeOccupants[internalInspectPlace.id] || [])
                .map(id => state.ghosts.find(g => g.id === id))
                .filter((g): g is NonNullable<typeof g> => !!g)
            : []
        }
        isOpen={!!internalInspectPlace}
        onClose={() => setInternalInspectPlace(null)}
      />
    </div>
  );
};
