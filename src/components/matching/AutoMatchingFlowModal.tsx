import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GhostAvatar } from '../common/GhostAvatar';
import { PlaceThumbnail } from '../common/PlaceThumbnail';
import { Zap, Check, X, ArrowRight } from 'lucide-react';
import { sound } from '../../utils/audioSystem';
import { useBureau } from '../../context/BureauContext';

interface AutoMatchingFlowModalProps {
  isOpen: boolean;
  step: string | null;
  stageNumber: number; // 1 to 5
  onClose?: () => void;
}

export const AutoMatchingFlowModal: React.FC<AutoMatchingFlowModalProps> = ({
  isOpen,
  step,
  stageNumber,
  onClose
}) => {
  const { state } = useBureau();

  useEffect(() => {
    if (!isOpen) return;
    if (stageNumber < 5) {
      sound.playScanPulse();
    } else if (stageNumber === 5) {
      sound.playMatchSuccess();
    }
  }, [isOpen, stageNumber]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Запрещаем закрытие по Esc до завершения процесса (Этап 5), чтобы исключить скрытые мутации
      if (e.key === 'Escape' && onClose && stageNumber >= 5) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stageNumber]);

  // P0-1: Dynamic allocation summary metrics computed strictly from current state
  const summaryStats = React.useMemo(() => {
    let allocatedCount = 0;
    let impossibleCount = 0;
    const impossibleGhosts: string[] = [];
    const scores: number[] = [];

    state.ghosts.forEach(g => {
      const res = state.allocation.ghostResults[g.id];
      if (res?.status === 'assigned_auto' || res?.status === 'assigned_manual') {
        allocatedCount++;
        if (res.recommendedPlaceId && res.evaluations[res.recommendedPlaceId]) {
          scores.push(res.evaluations[res.recommendedPlaceId].score);
        }
      } else if (res?.status === 'impossible') {
        impossibleCount++;
        impossibleGhosts.push(g.name);
      }
    });

    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

    return {
      allocatedCount,
      impossibleCount,
      totalCount: state.ghosts.length,
      impossibleGhosts,
      scoreRange: scores.length > 0 ? `${minScore}–${maxScore}` : ''
    };
  }, [state.ghosts, state.allocation.ghostResults]);

  // P0-1: Stream real ghosts, real scores and constraints from state and allocation engine
  const realPairs = React.useMemo(() => {
    return state.ghosts.slice(0, 3).map(ghost => {
      const alloc = state.allocation.ghostResults[ghost.id];
      const isImpossible = alloc?.status === 'impossible';
      const recommendedPlace = alloc?.recommendedPlaceId 
        ? state.places.find(p => p.id === alloc.recommendedPlaceId)
        : null;
      
      const evalData = recommendedPlace ? alloc?.evaluations[recommendedPlace.id] : null;
      const realScore = evalData?.score ?? 0;
      
      let constraintSummary = isImpossible ? '✕ ограничения' : '✓ совместимость';
      if (isImpossible) {
        constraintSummary = '✕ нет укрытия';
      } else if (evalData?.pros && evalData.pros.length > 0) {
        constraintSummary = '✓ ' + evalData.pros[0].message;
      } else if (ghost.specialRequirements.noMirrors) {
        constraintSummary = '✓ без зеркал';
      } else if (ghost.specialRequirements.requiresCellar) {
        constraintSummary = '✓ подвал';
      }

      return {
        ghostId: ghost.id,
        ghostName: ghost.name,
        isImpossible,
        placeId: recommendedPlace?.id || null,
        placeName: isImpossible ? 'Нет доступного укрытия' : (recommendedPlace?.name || 'В поиске...'),
        placeType: recommendedPlace?.type || 'Убежище',
        score: realScore,
        constraint: constraintSummary
      };
    });
  }, [state.ghosts, state.places, state.allocation]);

  if (!isOpen) return null;

  const isLocked = stageNumber >= 4;
  const isDone = stageNumber >= 5;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg select-none animate-in fade-in duration-200"
      role="status"
      aria-live="polite"
    >
      <div 
        className="bg-[#0b0b0e] border border-white/[0.12] rounded-2xl w-full max-w-xl p-6 shadow-[0_25px_90px_rgba(0,0,0,0.98)] space-y-5 animate-modal-scale relative overflow-hidden"
      >
        {/* Luminous Top Scanline */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)]" />

        {/* Header with Title & Current Step */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[#F3F3F0] shadow-inner">
              <Zap className={`w-4 h-4 ${isDone ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-[#F3F3F0] tracking-tight uppercase">
                Алгоритмический подбор укрытий
              </h3>
              <p className="text-[11px] text-[#9E9E9A] font-mono mt-0.5">
                {step || 'Анализируем совместимость...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold border transition-colors ${
              isDone 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : 'bg-white/[0.06] border-white/[0.12] text-[#F3F3F0]'
            }`}>
              {isDone ? '✓ Готово' : `Этап ${stageNumber} / 5`}
            </span>
            {onClose && isDone && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#7B7B78] hover:text-[#F3F3F0] hover:bg-white/[0.06] transition-colors"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 5-Stage Visual Progress Bar */}
        <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-heading uppercase tracking-wider">
          <div className={`p-2 rounded-xl border transition-all ${
            stageNumber >= 1 ? 'bg-white/[0.08] border-white/20 text-[#F3F3F0]' : 'bg-[#09090c] border-white/[0.04] text-[#7B7B78]'
          }`}>
            <div className="font-bold text-xs font-mono">01</div>
            <div className="truncate mt-0.5">Заявки</div>
          </div>
          <div className={`p-2 rounded-xl border transition-all ${
            stageNumber >= 2 ? 'bg-white/[0.08] border-white/20 text-[#F3F3F0]' : 'bg-[#09090c] border-white/[0.04] text-[#7B7B78]'
          }`}>
            <div className="font-bold text-xs font-mono">02</div>
            <div className="truncate mt-0.5">Правила</div>
          </div>
          <div className={`p-2 rounded-xl border transition-all ${
            stageNumber >= 3 ? 'bg-white/[0.08] border-white/20 text-[#F3F3F0]' : 'bg-[#09090c] border-white/[0.04] text-[#7B7B78]'
          }`}>
            <div className="font-bold text-xs font-mono">03</div>
            <div className="truncate mt-0.5">Скоринг</div>
          </div>
          <div className={`p-2 rounded-xl border transition-all ${
            stageNumber >= 4 ? 'bg-white/[0.08] border-white/20 text-[#F3F3F0]' : 'bg-[#09090c] border-white/[0.04] text-[#7B7B78]'
          }`}>
            <div className="font-bold text-xs font-mono">04</div>
            <div className="truncate mt-0.5">Локации</div>
          </div>
          <div className={`p-2 rounded-xl border transition-all ${
            stageNumber >= 5 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-[#09090c] border-white/[0.04] text-[#7B7B78]'
          }`}>
            <div className="font-bold text-xs font-mono">05</div>
            <div className="truncate mt-0.5">Результат</div>
          </div>
        </div>

        {/* Live Matching Stream: Ghost -> Constraints -> Score -> Place */}
        <div className="space-y-2.5 pt-1">
          <div className="text-[10px] font-heading uppercase tracking-[0.14em] text-[#7B7B78] font-bold flex items-center justify-between px-1">
            <span>Ключевые сопоставления (превью)</span>
            <span className="text-[#F3F3F0] font-mono">Детерминированный граф</span>
          </div>

          <div className="space-y-2">
            {realPairs.map((pair, idx) => (
              <div 
                key={pair.ghostId}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#121217] border border-white/[0.08] overflow-hidden relative shadow-xs"
                style={{
                  animation: `entranceFadeUp 200ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 60}ms both`
                }}
              >
                {/* 1. Ghost Profile */}
                <div className="flex items-center gap-2.5 w-32 shrink-0">
                  <GhostAvatar size="sm" ghostId={pair.ghostId} className="w-8 h-8 rounded-lg border border-white/[0.08] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-xs text-[#F3F3F0] truncate">{pair.ghostName}</div>
                    <div className="text-[10px] text-[#7B7B78] font-mono">#{pair.ghostId}</div>
                  </div>
                </div>

                {/* 2. Beam Connector */}
                <div className="flex-1 min-w-0 flex items-center justify-center px-1">
                  <div className="w-full flex items-center justify-center gap-1.5 relative">
                    <div className="h-0.5 flex-1 bg-white/[0.08] rounded-full overflow-hidden relative">
                      <div 
                        className={`absolute inset-0 ${
                          isLocked 
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                            : 'bg-gradient-to-r from-white/20 via-white/80 to-white/20'
                        }`}
                        style={{
                          animation: isLocked ? 'none' : 'workflowConnectorPulse 1.2s linear infinite',
                          backgroundSize: '200% 100%'
                        }}
                      />
                    </div>

                    <span className={`px-2 py-0.5 rounded border text-[9px] font-mono whitespace-nowrap transition-all duration-300 ${
                      isLocked 
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-semibold' 
                        : 'bg-[#09090c] border-white/[0.1] text-[#E8E6E1]'
                    }`}>
                      {pair.constraint}
                    </span>

                    <div className="h-0.5 flex-1 bg-white/[0.08] rounded-full overflow-hidden relative">
                      <div 
                        className={`absolute inset-0 ${
                          isLocked 
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                            : 'bg-gradient-to-r from-white/20 via-white/80 to-white/20'
                        }`}
                        style={{
                          animation: isLocked ? 'none' : 'workflowConnectorPulse 1.2s linear infinite',
                          backgroundSize: '200% 100%'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Matched Sanctuary */}
                <div className="flex items-center gap-2.5 w-44 justify-end shrink-0">
                  <div className="text-right min-w-0">
                    <div className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${
                      pair.isImpossible ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isLocked && (pair.isImpossible ? <X className="w-3 h-3 text-rose-400 shrink-0" /> : <Check className="w-3 h-3 text-emerald-400 shrink-0" />)}
                      <span>{pair.isImpossible ? 'Невозможно' : `${pair.score} / 100`}</span>
                    </div>
                    <div className="text-[11px] font-display font-medium text-[#E8E6E1] truncate">
                      {pair.placeName}
                    </div>
                  </div>
                  {pair.placeId ? (
                    <PlaceThumbnail 
                      placeId={pair.placeId} 
                      placeType={pair.placeType}
                      className="w-8 h-8 rounded-lg border border-white/[0.08] shrink-0" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0 font-mono text-[10px] font-bold">
                      ✕
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 5 Resolution Card & Primary Action */}
        {isDone ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-heading font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Распределение завершено успешно</span>
                </div>
                <div className="text-[11px] text-[#E8E6E1] mt-1 space-y-0.5">
                  <div>
                    • <strong>{summaryStats.allocatedCount} из {summaryStats.totalCount}</strong> заявок получили укрытия{summaryStats.scoreRange ? ` (Score ${summaryStats.scoreRange})` : ''}.
                  </div>
                  {summaryStats.impossibleCount > 0 ? (
                    <div className="text-rose-300">
                      • <strong>{summaryStats.impossibleCount} {summaryStats.impossibleCount === 1 ? 'заявка' : 'заявок'}</strong> ({summaryStats.impossibleGhosts.join(', ')}) требует решения оператора.
                    </div>
                  ) : (
                    <div className="text-emerald-300">
                      • Все заявки распределены без конфликтов.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#F3F3F0] hover:bg-white text-[#08080a] font-heading font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(243,243,240,0.3)] hover:shadow-[0_0_30px_rgba(243,243,240,0.5)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Утвердить и перейти к реестру</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center text-[11px] text-[#7B7B78] font-mono pt-1">
            Проверка фобий, капризов и детерминированный расчет совместимости...
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
