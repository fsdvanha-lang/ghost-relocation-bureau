import React, { useState, useMemo } from 'react';
import { 
  Check, 
  AlertTriangle, 
  Search, 
  MapPin, 
  Zap, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { GhostAvatar } from '../components/common/GhostAvatar';
import { PlaceThumbnail } from '../components/common/PlaceThumbnail';
import { CastleHeaderBanner } from '../components/common/CastleHeaderBanner';
import { AnimatedNumber } from '../components/common/AnimatedNumber';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { sound } from '../utils/audioSystem';
import { useToast } from '../components/common/ToastContext';
import { GhostInspectorPanel } from '../components/ghosts/GhostInspectorPanel';
import { BureauWorkflowChain } from '../components/dashboard/BureauWorkflowChain';
import { AutoMatchingFlowModal } from '../components/matching/AutoMatchingFlowModal';
import { LocationDetailModal } from '../components/locations/LocationDetailModal';
import type { GhostApplication } from '../types/ghost';
import type { GhostMatchResult } from '../types/matching';
import type { RelocationPlace } from '../types/place';
import { getGhostFullReference } from '../utils/ghostMeta';
import { 
  getAttentionInfo, 
  getResolutionStatus, 
  getResolutionBadgeProps 
} from '../utils/statusSystem';

export const DashboardPage: React.FC = () => {
  const { 
    state, 
    stats, 
    selectedGhost,
    selectGhost, 
    assignManual,
    unassignGhost,
    setView, 
    runAutoAllocation,
    closeAllocationModal,
    isAllocating,
    allocationStep,
    allocationStageNumber,
    recentlyUpdatedGhostIds
  } = useBureau();

  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'new' | 'matched' | 'relocated' | 'problem'>('all');
  const [onlyUrgentInTable, setOnlyUrgentInTable] = useState(false);
  const [selectedPlaceForModal, setSelectedPlaceForModal] = useState<RelocationPlace | null>(null);

  const selectedResult = selectedGhost ? state.allocation.ghostResults[selectedGhost.id] : null;

  // Trigger auto allocation with user feedback
  const handleAutoAllocate = async () => {
    if (isAllocating) return;
    try {
      await runAutoAllocation();
      showToast({
        type: 'success',
        title: '✓ Авто-подбор завершён',
        message: `${stats.relocatedCount} заявок распределено · ${stats.unassignedCount} требует ручного решения`
      });
    } catch {
      showToast({
        type: 'warning',
        title: 'Ошибка подбора',
        message: 'Проверьте доступность мест и правила ограничений'
      });
    }
  };

  // 1. Strict tiered problem priority (Requirement 7)
  const getUrgentPriority = (ghost: GhostApplication, result?: GhostMatchResult): number => {
    // Priority 1: Невозможно расселить
    if (ghost.status === 'impossible' || result?.status === 'impossible' || 
        (result?.evaluations && Object.values(result.evaluations).every(e => !e.isEligible))) {
      return 1;
    }
    // Priority 2: Просрочено
    if (ghost.deadlineHoursLeft < 0) {
      return 2;
    }
    // Priority 3: Критический дедлайн (<= 16 ч.)
    if (ghost.deadlineHoursLeft <= 16) {
      return 3;
    }
    // Priority 4: Срочный дедлайн (<= 24 ч.)
    if (ghost.deadlineHoursLeft <= 24) {
      return 4;
    }
    // Priority 5: Ручное решение / низкий score / внимание (<= 48 ч.)
    return 5;
  };

  // 2. Reason metadata for attention & urgency (Requirements 1, 7, 11, 13)
  const getUrgentDetails = (ghost: GhostApplication, result?: GhostMatchResult) => {
    const info = getAttentionInfo(ghost, result);
    return { 
      title: info.badgeText, 
      badgeBg: info.badgeBg,
      subtext: info.why,
      actionLabel: info.actionLabel,
      isActionRequired: info.isActionRequired,
      isImpossible: info.badgeText.includes('Невозможно')
    };
  };

  // Helper: short recommendation reason tags
  const getPlaceReasonTags = (place?: RelocationPlace | null) => {
    if (!place) return null;
    const tags: string[] = [];
    if (place.noiseLevel === 'silent' || place.noiseLevel === 'low') tags.push('тишина');
    if (place.humidity === 'high') tags.push('сырость');
    if (place.hasAttic) tags.push('чердак');
    if (place.hasCellar) tags.push('подвал');
    if (place.humanPresence === 'none') tags.push('без людей');
    return tags.slice(0, 2).join(' · ');
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

  // Urgent / Attention Ghosts sorted by real priority (Requirements 1, 7, 11)
  const urgentGhosts = useMemo(() => {
    const list = state.ghosts.filter(g => {
      const res = state.allocation.ghostResults[g.id];
      const info = getAttentionInfo(g, res);
      return info.needsAttention;
    });

    return list.sort((a, b) => {
      const resA = state.allocation.ghostResults[a.id];
      const resB = state.allocation.ghostResults[b.id];
      const prioA = getUrgentPriority(a, resA);
      const prioB = getUrgentPriority(b, resB);
      if (prioA !== prioB) {
        return prioA - prioB;
      }
      return a.deadlineHoursLeft - b.deadlineHoursLeft;
    });
  }, [state.ghosts, state.allocation]);

  // P2: Separate Action-Required (unassigned / impossible) from Monitor-Only (assigned + deadline attention)
  const actionRequiredCount = useMemo(() => {
    return urgentGhosts.filter(g => {
      const res = state.allocation.ghostResults[g.id];
      return getAttentionInfo(g, res).isActionRequired;
    }).length;
  }, [urgentGhosts, state.allocation]);

  const monitoringCount = useMemo(() => {
    return urgentGhosts.filter(g => {
      const res = state.allocation.ghostResults[g.id];
      return !getAttentionInfo(g, res).isActionRequired;
    }).length;
  }, [urgentGhosts, state.allocation]);

  // Filtered Ghosts for the Main Table
  const filteredTableGhosts = useMemo(() => {
    return state.ghosts.filter(ghost => {
      if (onlyUrgentInTable) {
        const res = state.allocation.ghostResults[ghost.id];
        const info = getAttentionInfo(ghost, res);
        if (!info.needsAttention) return false;
      }

      const matchesSearch =
        ghost.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ghost.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ghost.bio?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const result = state.allocation.ghostResults[ghost.id];
      if (tableFilter === 'new') return !ghost.assignedPlaceId && result?.status === 'new';
      if (tableFilter === 'matched') return !ghost.assignedPlaceId && !!result?.recommendedPlaceId;
      if (tableFilter === 'relocated') return !!ghost.assignedPlaceId;
      if (tableFilter === 'problem') return ghost.deadlineHoursLeft <= 24 || result?.status === 'impossible';

      return true;
    });
  }, [state.ghosts, state.allocation, searchQuery, tableFilter, onlyUrgentInTable]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start relative select-none">
      {/* =========================================================================
          LEFT / MAIN OPERATIONS WORKSPACE
          ========================================================================= */}
      <div className="flex-1 min-w-0 space-y-5 w-full">
        {/* 1. HERO BANNER: ЦЕНТР РЕШЕНИЙ (Dark Luxury Editorial) */}
        <SpotlightCard 
          enableTilt={false}
          className="relative rounded-2xl bg-[#0c0c10] border border-white/[0.1] p-5 sm:p-7 overflow-hidden shadow-2xl animate-entrance-1"
        >
          <CastleHeaderBanner />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Title, Subtitle, and Operations Summary */}
            <div className="space-y-2.5 max-w-xl">
              <div className="flex items-center gap-3 animate-entrance-0">
                <span className="font-mono text-[10px] text-amber-300/90 tracking-[0.2em] uppercase font-bold px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25">
                  BUREAU DE RELOCATION
                </span>
                <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-heading text-[11px] font-semibold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span>Система стабильна</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-[#F3F3F0] tracking-[-0.03em] uppercase leading-none drop-shadow-sm">
                Центр решений
              </h1>

              <p className="text-xs font-sans text-[#B4B4AF] leading-relaxed animate-entrance-1 max-w-lg">
                Интеллектуальная система распределения привидений по безопасным укрытиям. Детерминированный алгоритм сопоставляет фобии и микроклимат, а оператор верифицирует решения.
              </p>

              {/* Quick Tour: Minimalist compact sequence */}
              <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] animate-entrance-2">
                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-[#E8E6E1] font-heading">
                  <strong className="text-white mr-1">1</strong> Авто-подбор
                </span>
                <span className="text-[#525250]">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-[#E8E6E1] font-heading">
                  <strong className="text-white mr-1">2</strong> Проверить
                </span>
                <span className="text-[#525250]">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-[#E8E6E1] font-heading">
                  <strong className="text-white mr-1">3</strong> Подтвердить
                </span>
              </div>

              {/* Compact Statistics */}
              <div className="pt-0.5 flex flex-wrap items-center gap-2 text-xs font-mono animate-entrance-3">
                <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/[0.1] text-[#B4B4AF]">
                  <strong className="text-[#F3F3F0]">{stats.totalGhosts}</strong> заявок
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/[0.1] text-[#B4B4AF] flex items-center gap-1">
                  <strong className="text-emerald-400 font-bold">
                    <AnimatedNumber value={stats.relocatedCount} /> / {stats.totalGhosts}
                  </strong>
                  <span>расселено</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/[0.1] text-[#B4B4AF] flex items-center gap-1">
                  <strong className="text-amber-400 font-bold">
                    <AnimatedNumber value={stats.unassignedCount} />
                  </strong>
                  <span>без места</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/[0.1] text-[#B4B4AF] flex items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    <strong className="text-rose-400 font-bold">
                      <AnimatedNumber value={actionRequiredCount} />
                    </strong>
                    <span>к решению</span>
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1">
                    <strong className="text-amber-400 font-bold">
                      <AnimatedNumber value={monitoringCount} />
                    </strong>
                    <span>на контроле</span>
                  </span>
                </span>
              </div>
            </div>

            {/* Primary CTA Button: [ Запустить авто-подбор ] */}
            <div className="shrink-0 flex items-center animate-entrance-4">
              <button
                onClick={() => {
                  sound.playScanPulse();
                  handleAutoAllocate();
                }}
                disabled={isAllocating}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg ${
                  isAllocating
                    ? 'bg-amber-600 text-white cursor-wait shadow-amber-600/30'
                    : 'bg-[#F3F3F0] text-[#08080a] hover:bg-white hover:shadow-[0_0_35px_rgba(243,243,240,0.4)] hover:-translate-y-0.5 active:translate-y-0'
                }`}
                title="Запустить алгоритм детерминированного подбора"
              >
                {isAllocating ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin shrink-0 text-amber-200" />
                    <span>Сканирование...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 shrink-0 text-[#08080a]" />
                    <span>Запустить авто-подбор</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </SpotlightCard>

        {/* 2. OPERATIONAL DIRECTIVE PHRASE (Rule P2) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b0b0e] border-l-2 border-[#F3F3F0] border-y border-r border-white/[0.07] rounded-xl shadow-sm animate-entrance-2">
          <div className="flex items-center gap-2.5 text-xs font-heading">
            <span className="w-2 h-2 rounded-full bg-[#F3F3F0] shadow-[0_0_8px_rgba(243,243,240,0.8)]" />
            <span className="font-semibold text-[#F3F3F0] tracking-wide">
              {actionRequiredCount > 0 || monitoringCount > 0
                ? `${actionRequiredCount} к решению · ${monitoringCount} на контроле`
                : 'Все заявки оператора на сегодня успешно обработаны'}
            </span>
          </div>
          <span className="text-[11px] text-[#7B7B78] font-mono uppercase tracking-wider hidden sm:inline">
            Приоритет: конфликт условий → дедлайн → score
          </span>
        </div>

        {/* 3. PIPELINE VISUALIZER: КАК РАБОТАЕТ БЮРО */}
        <div className="animate-entrance-2">
          <BureauWorkflowChain />
        </div>

        {/* 4. MAIN OPERATIONAL BLOCK: ТРЕБУЮТ ВНИМАНИЯ (Ultra-dense Minimalist Triage Table) */}
        <div className="bg-[#0b0b0e] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl animate-entrance-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <h2 className="text-xs font-heading font-bold uppercase tracking-[0.16em] text-[#F3F3F0]">
                Требуют внимания
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/25">
                {actionRequiredCount} к решению · {monitoringCount} на контроле
              </span>
            </div>

            <button
              onClick={() => setView('applications')}
              className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[#7B7B78] hover:text-[#F3F3F0] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Все заявки →</span>
            </button>
          </div>

          {urgentGhosts.length === 0 ? (
            <div className="py-6 text-center bg-[#09090c] border border-white/[0.06] rounded-xl flex items-center justify-center gap-2 text-xs text-[#7B7B78]">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Все заявки обработаны · Бюро работает стабильно</span>
            </div>
          ) : (
            <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0e0e12]">
              <div className="divide-y divide-white/[0.04]">
                {urgentGhosts.map(ghost => {
                  const result = state.allocation.ghostResults[ghost.id];
                  const activePlaceId = ghost.assignedPlaceId || result?.recommendedPlaceId;
                  const activePlace = activePlaceId ? state.places.find(p => p.id === activePlaceId) : null;
                  const evalScore = activePlaceId && result?.evaluations ? result.evaluations[activePlaceId]?.score : undefined;
                  const urgent = getUrgentDetails(ghost, result);
                  const isSelected = selectedGhost?.id === ghost.id;
                  const isOverdue = ghost.deadlineHoursLeft < 0;

                  return (
                    <div
                      key={ghost.id}
                      onClick={() => {
                        sound.playClick();
                        selectGhost(ghost.id);
                      }}
                      className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 group ${
                        isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* 1. Entity (Avatar + Name + ID) */}
                      <div className="flex items-center gap-2.5 w-44 sm:w-52 shrink-0">
                        <GhostAvatar 
                          size="sm" 
                          ghostId={ghost.id} 
                          className="w-7 h-7 rounded-lg shrink-0 ring-1 ring-white/10"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-heading font-bold text-[#F3F3F0] group-hover:text-white truncate">
                            {ghost.name}
                          </div>
                          <div className="text-[10px] text-[#9E9E9A] font-mono truncate">
                            {getGhostFullReference(ghost.id)}
                          </div>
                        </div>
                      </div>

                      {/* 2. Reason Pill */}
                      <div className="flex-1 min-w-0 hidden md:flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-heading font-semibold uppercase tracking-wider rounded border shrink-0 ${urgent.badgeBg}`}>
                          {urgent.isImpossible && <ShieldAlert className="w-2.5 h-2.5 shrink-0" />}
                          <span>{urgent.title}</span>
                        </span>
                        <span className="text-[10px] text-[#7B7B78] truncate">
                          {urgent.subtext}
                        </span>
                      </div>

                      {/* 3. Recommendation or Conflict */}
                      <div className="w-36 sm:w-44 shrink-0 text-left sm:text-right">
                        {urgent.isImpossible || !activePlace ? (
                          <span className="text-[11px] font-mono text-rose-400/90 font-medium">
                            — / 100 <span className="text-[9px] text-[#7B7B78]">нет места</span>
                          </span>
                        ) : (
                          <div className="truncate">
                            <span className="text-xs font-medium text-[#E8E6E1]">{activePlace.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold ml-1.5">
                              {evalScore}/100
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 4. Deadline */}
                      <div className="w-16 text-right shrink-0">
                        <span className={`text-[11px] font-mono font-bold ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`}>
                          {formatDeadline(ghost.deadlineHoursLeft)}
                        </span>
                      </div>

                      {/* 5. Compact Action */}
                      <div className="w-20 text-right shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            sound.playClick();
                            selectGhost(ghost.id);
                          }}
                          className="px-2.5 py-1 bg-[#F3F3F0] hover:bg-white text-[#08080a] rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-xs cursor-pointer w-full text-center"
                        >
                          Проверить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. SECONDARY METRICS: COMPACT HORIZONTAL STATS ROW (Dark Luxury Architectural Stat Slabs) */}
        <div className="bg-[#0b0b0e] border border-white/[0.07] rounded-2xl p-4 shadow-sm animate-entrance-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
            {/* Metric 1: Total */}
            <div className="px-3 py-1">
              <div className="text-[10px] font-heading text-[#9E9E9A] uppercase tracking-[0.14em] font-semibold">Заявок</div>
              <div className="text-2xl font-heading font-bold text-[#F3F3F0] tracking-tight tabular-nums mt-1">
                <AnimatedNumber value={stats.totalGhosts} />
              </div>
            </div>

            {/* Metric 2: Relocated */}
            <div className="px-3 py-1">
              <div className="text-[10px] font-heading text-[#9E9E9A] uppercase tracking-[0.14em] font-semibold">Расселено</div>
              <div className="text-2xl font-heading font-bold text-emerald-400 tracking-tight tabular-nums mt-1">
                <AnimatedNumber value={stats.relocatedCount} /> / {stats.totalGhosts}
              </div>
              <div className="text-[10px] text-[#9E9E9A] font-mono truncate mt-0.5">
                {stats.relocatedAutoCount} авто · {stats.relocatedManualCount} ручных
              </div>
            </div>

            {/* Metric 3: Unassigned */}
            <div className="px-3 py-1">
              <div className="text-[10px] font-heading text-[#9E9E9A] uppercase tracking-[0.14em] font-semibold">Без места</div>
              <div className="text-2xl font-heading font-bold text-rose-400 tracking-tight tabular-nums mt-1">
                <AnimatedNumber value={stats.unassignedCount} />
              </div>
            </div>

            {/* Metric 4: Action Required / Monitoring */}
            <div className="px-3 py-1">
              <div className="text-[10px] font-heading text-[#9E9E9A] uppercase tracking-[0.14em] font-semibold">Решение / Контроль</div>
              <div className="text-2xl font-heading font-bold text-amber-400 tracking-tight tabular-nums mt-1 flex items-baseline gap-1">
                <span>{actionRequiredCount}</span>
                <span className="text-xs text-[#7B7B78] font-normal font-sans">реш.</span>
                <span className="text-white/20 font-normal">/</span>
                <span>{monitoringCount}</span>
                <span className="text-xs text-[#7B7B78] font-normal font-sans">контр.</span>
              </div>
              <div className="text-[10px] text-[#9E9E9A] font-mono truncate mt-0.5">
                {actionRequiredCount} к решению · {monitoringCount} на контроле
              </div>
            </div>

            {/* Metric 5: Available slots */}
            <div className="px-3 py-1">
              <div className="text-[10px] font-heading text-[#9E9E9A] uppercase tracking-[0.14em] font-semibold">Свободно мест</div>
              <div className="text-2xl font-heading font-bold text-[#F3F3F0] tracking-tight tabular-nums mt-1">
                <AnimatedNumber value={stats.availableSlots} />
              </div>
            </div>

            {/* Metric 6: Occupancy */}
            <div className="px-3 py-1">
              <div className="text-[10px] font-heading text-[#9E9E9A] uppercase tracking-[0.14em] font-semibold">Загрузка</div>
              <div className="text-2xl font-heading font-bold text-[#F3F3F0] tracking-tight tabular-nums mt-1">
                {stats.occupancyPercent}%
              </div>
              <div className="text-[10px] text-[#9E9E9A] font-mono truncate mt-0.5">
                {stats.totalOccupied} из {stats.totalCapacity} мест
              </div>
            </div>
          </div>
        </div>
        {/* 6. CENTRAL REGISTRY TABLE: ВСЕ ЗАЯВКИ */}
        <div className="bg-[#0b0b0e] border border-white/[0.08] rounded-2xl p-5 lg:p-6 space-y-4 shadow-sm animate-entrance-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-display font-extrabold text-[#F3F3F0] uppercase tracking-wider">Все заявки</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[#7B7B78] border border-white/[0.08]">
                {state.ghosts.length} заявок · {actionRequiredCount} к решению · {monitoringCount} на контроле
              </span>
            </div>

            {/* Actions: [ Только требующие внимания ] toggle + Search */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOnlyUrgentInTable(prev => !prev)}
                className={`px-3 py-1.5 text-xs rounded-xl font-heading font-medium uppercase tracking-wider border transition-all ${
                  onlyUrgentInTable 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 shadow-sm'
                    : 'bg-[#101014] text-[#7B7B78] border-white/[0.08] hover:border-white/20 hover:text-[#F3F3F0]'
                }`}
              >
                Только требующие внимания
              </button>

              <div className="relative w-44 sm:w-56">
                <Search className="w-3.5 h-3.5 text-[#7B7B78] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, условиям..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#101014] border border-white/[0.08] rounded-xl text-xs text-[#F3F3F0] placeholder-[#525250] focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Standard tabs */}
              <div className="flex items-center gap-1 bg-[#101014] p-0.5 rounded-xl border border-white/[0.06] text-xs font-heading">
                <button
                  onClick={() => setTableFilter('all')}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-all ${
                    tableFilter === 'all' ? 'bg-white/10 text-[#F3F3F0] font-bold border border-white/15' : 'text-[#7B7B78] hover:text-[#F3F3F0]'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setTableFilter('matched')}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-all ${
                    tableFilter === 'matched' ? 'bg-white/10 text-[#F3F3F0] font-bold border border-white/15' : 'text-[#7B7B78] hover:text-[#F3F3F0]'
                  }`}
                >
                  Подобрано
                </button>
                <button
                  onClick={() => setTableFilter('relocated')}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-all ${
                    tableFilter === 'relocated' ? 'bg-white/10 text-[#F3F3F0] font-bold border border-white/15' : 'text-[#7B7B78] hover:text-[#F3F3F0]'
                  }`}
                >
                  Расселено
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] text-[#7B7B78] font-heading font-semibold text-[10px] uppercase tracking-wider bg-[#0c0c10]">
                  <th className="py-3 px-3 font-semibold">Привидение</th>
                  <th className="py-3 px-3 font-semibold">Ограничения</th>
                  <th className="py-3 px-3 font-semibold">Рекомендация</th>
                  <th className="py-3 px-3 font-semibold">Совместимость</th>
                  <th className="py-3 px-3 font-semibold">Дедлайн</th>
                  <th className="py-3 px-3 font-semibold">Статус</th>
                  <th className="py-3 px-3 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredTableGhosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-[#7B7B78] font-mono">
                      По заданным критериям заявок не найдено.
                    </td>
                  </tr>
                ) : (
                  filteredTableGhosts.map(ghost => {
                    const result = state.allocation.ghostResults[ghost.id];
                    const activePlaceId = ghost.assignedPlaceId || result?.recommendedPlaceId;
                    const activePlace = activePlaceId ? state.places.find(p => p.id === activePlaceId) : null;
                    const evalScore = activePlaceId && result?.evaluations ? result.evaluations[activePlaceId]?.score : undefined;
                    const isUpdated = recentlyUpdatedGhostIds.includes(ghost.id);
                    const isSelected = selectedGhost?.id === ghost.id;
                    const placeTag = getPlaceReasonTags(activePlace);
                    const resolution = getResolutionStatus(ghost, result);
                    const resBadge = getResolutionBadgeProps(resolution);

                    return (
                      <tr
                        key={ghost.id}
                        onClick={() => {
                          sound.playClick();
                          selectGhost(ghost.id);
                        }}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected 
                            ? 'bg-[#15151c] font-medium' 
                            : 'hover:bg-[#121217]'
                        } ${isUpdated ? 'animate-row-update' : ''}`}
                      >
                        {/* 1. Ghost Name + ID */}
                        <td className="py-3 px-3 font-medium text-[#F3F3F0]">
                          <div className="flex items-center gap-3">
                            <GhostAvatar size="sm" ghostId={ghost.id} className="ring-1 ring-white/15" />
                            <div>
                              <div className="font-heading font-bold text-xs text-[#F3F3F0]">{ghost.name}</div>
                              <div className="text-[10px] text-[#9E9E9A] font-mono">{getGhostFullReference(ghost.id)}</div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Special Requirements (Minimalist chips) */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {ghost.specialRequirements.requiresAttic && (
                              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[10px] font-heading uppercase tracking-wider text-[#E8E6E1]">
                                🏚️ Чердак
                              </span>
                            )}
                            {ghost.specialRequirements.noMirrors && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-heading uppercase tracking-wider text-rose-300">
                                🪞 Без зеркал
                              </span>
                            )}
                            {ghost.specialRequirements.isolatedFromHumans && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-heading uppercase tracking-wider text-rose-300">
                                🚫 Без людей
                              </span>
                            )}
                            {ghost.specialRequirements.requiresCellar && (
                              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[10px] font-heading uppercase tracking-wider text-[#E8E6E1]">
                                🚪 Подвал
                              </span>
                            )}
                            {ghost.specialRequirements.prefersSilence && (
                              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[10px] font-heading uppercase tracking-wider text-[#E8E6E1]">
                                🤫 Тишина
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Recommendation */}
                        <td className="py-3 px-3 text-[#F3F3F0]">
                          {activePlace ? (
                            <div>
                              <div className="font-heading font-semibold text-xs text-[#F3F3F0]">{activePlace.name}</div>
                              {placeTag && (
                                <div className="text-[10px] text-[#7B7B78]">
                                  {placeTag}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#525250] italic">Нет подходящей локации</span>
                          )}
                        </td>

                        {/* 4. Score */}
                        <td className="py-3 px-3 font-mono font-bold">
                          {ghost.status === 'impossible' || !activePlace ? (
                            <span 
                              className="text-[#525250] cursor-help" 
                              title="Детерминированная оценка соответствия условий и предпочтений. Нет допустимого места."
                            >
                              — / 100
                            </span>
                          ) : (
                            <span 
                              className={`cursor-help ${evalScore && evalScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}
                              title="Детерминированная оценка соответствия условий и предпочтений."
                            >
                              {evalScore} <span className="text-[10px] text-[#7B7B78] font-normal font-sans">/ 100</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Deadline */}
                        <td className={`py-3 px-3 font-medium font-mono ${ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : ghost.deadlineHoursLeft <= 24 ? 'text-amber-400' : 'text-[#7B7B78]'}`}>
                          {formatDeadline(ghost.deadlineHoursLeft)}
                        </td>

                        {/* 6. Status (Orthogonal Resolution category) */}
                        <td className="py-3 px-3">
                          {ghost.manualOverride ? (
                            <div className="relative group inline-block">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading uppercase tracking-wider font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 cursor-help">
                                <span>👤</span> Вручную
                              </span>
                              {/* Human-in-the-loop tooltip on hover */}
                              <div className="hidden group-hover:block absolute z-30 bottom-full mb-1 left-0 w-64 p-3 bg-[#111115] border border-white/20 rounded-xl shadow-2xl text-[11px] pointer-events-none">
                                <div className="font-bold text-[#F3F3F0] mb-1 flex items-center gap-1 font-heading uppercase tracking-wider">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Human-in-the-loop</span>
                                </div>
                                <div className="text-[#7B7B78]">
                                  Автоматическая рекомендация:
                                  <div className="text-[#F3F3F0] font-medium">{result?.recommendedPlaceId ? state.places.find(p => p.id === result.recommendedPlaceId)?.name : 'Не определено'}</div>
                                </div>
                                <div className="text-[#7B7B78] mt-1">
                                  Фактическое размещение:
                                  <div className="text-amber-300 font-medium">{activePlace?.name || '—'} · {evalScore !== undefined ? `${evalScore} / 100` : '—'}</div>
                                </div>
                                <div className="text-[#7B7B78] mt-1 pt-1 border-t border-white/[0.08]">
                                  Причина:
                                  <div className="text-[#E8E6E1] italic">{ghost.manualOverrideReason || 'Оператор изменил автоматическую рекомендацию.'}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-heading uppercase tracking-wider font-semibold border inline-flex items-center gap-1 ${resBadge.className}`}>
                              {resolution === 'assigned_auto' && <Check className="w-2.5 h-2.5" />}
                              {resBadge.label}
                            </span>
                          )}
                        </td>

                        {/* 7. Action */}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              sound.playClick();
                              selectGhost(ghost.id);
                            }}
                            className="px-3 py-1 bg-[#15151b] hover:bg-[#F3F3F0] text-[#E8E6E1] hover:text-[#08080a] rounded-xl text-xs font-heading font-bold uppercase tracking-wider border border-white/[0.08] hover:border-white transition-all shadow-xs cursor-pointer"
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

        {/* 7. BOTTOM TIER: ЗАГРУЗКА МЕСТ */}
        <div className="bg-[#0b0b0e] border border-white/[0.08] rounded-2xl p-5 lg:p-6 space-y-4 shadow-sm animate-entrance-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#F3F3F0]" />
              <h2 className="text-sm font-display font-extrabold text-[#F3F3F0] uppercase tracking-wider">
                Загрузка мест
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[#7B7B78] border border-white/[0.08]">
                {state.places.length} локаций
              </span>
            </div>

            <button
              onClick={() => setView('places')}
              className="text-xs font-heading font-semibold uppercase tracking-wider text-[#7B7B78] hover:text-[#F3F3F0] flex items-center gap-1 transition-colors group"
            >
              <span>Все места →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {state.places.map(place => {
              const occupants = state.allocation.placeOccupants[place.id] || [];
              const percent = Math.round((occupants.length / place.capacity) * 100);
              const freeSlots = Math.max(0, place.capacity - occupants.length);
              const isFull = freeSlots === 0;

              return (
                <SpotlightCard 
                  key={place.id}
                  enableTilt={true}
                  onClick={() => setSelectedPlaceForModal(place)}
                  className="group bg-[#101014] border border-white/[0.07] hover:border-white/25 rounded-xl p-3.5 space-y-2.5 cursor-pointer transition-all duration-220 hover:bg-[#141419] hover:-translate-y-0.5 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <PlaceThumbnail
                      placeId={place.id}
                      placeType={place.type}
                      name={place.name}
                      className="w-11 h-9 rounded-lg shrink-0 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-heading font-bold text-[#F3F3F0] truncate group-hover:text-white transition-colors">
                          {place.name}
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[#7B7B78] ml-1 shrink-0">
                          {occupants.length} / {place.capacity}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#7B7B78] font-heading uppercase tracking-wider truncate mt-0.5">
                        {place.type}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isFull ? 'bg-amber-400' : 'bg-[#F3F3F0]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-heading pt-0.5">
                    <span className={isFull ? 'text-amber-400 font-bold uppercase tracking-wider' : 'text-[#7B7B78]'}>
                      {isFull ? 'Заполнено' : `${freeSlots} свободно`}
                    </span>
                    <span className="text-[#525250] flex items-center gap-0.5 group-hover:text-[#F3F3F0] transition-colors">
                      <span className="text-[9px] uppercase tracking-wider">Открыть</span>
                      <span className="transition-transform duration-220 group-hover:translate-x-0.5">→</span>
                    </span>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: DOCKED GHOST INSPECTOR PANEL (DETAIL DRAWER)
          ========================================================================= */}
      {selectedGhost && (
        <div className="hidden xl:block w-[420px] shrink-0 sticky top-0 h-[calc(100vh-6.5rem)] max-h-[calc(100vh-6.5rem)] animate-in fade-in slide-in-from-right-4 duration-200 z-20">
          <GhostInspectorPanel
            ghost={selectedGhost}
            places={state.places}
            evaluations={selectedResult?.evaluations || {}}
            placeOccupants={state.allocation.placeOccupants}
            recommendedPlaceId={selectedResult?.recommendedPlaceId || null}
            displacementReason={selectedResult?.displacementReason}
            impossibleReasons={selectedResult?.impossibleReasons}
            onClose={() => selectGhost(null)}
            onManualAssign={assignManual}
            onUnassign={unassignGhost}
            onInspectPlace={setSelectedPlaceForModal}
            isDocked={true}
          />
        </div>
      )}

      {/* Auto-Matching Multi-Stage Analysis Modal (Requirement 8 & 9) */}
      <AutoMatchingFlowModal
        isOpen={isAllocating}
        step={allocationStep}
        stageNumber={allocationStageNumber}
        onClose={closeAllocationModal}
      />

      {/* Location Detail Modal (Requirement 10 & 11) */}
      <LocationDetailModal
        place={selectedPlaceForModal}
        occupants={
          selectedPlaceForModal 
            ? (state.allocation.placeOccupants[selectedPlaceForModal.id] || [])
                .map(id => state.ghosts.find(g => g.id === id))
                .filter((g): g is NonNullable<typeof g> => !!g)
            : []
        }
        isOpen={!!selectedPlaceForModal}
        onClose={() => setSelectedPlaceForModal(null)}
      />
    </div>
  );
};
