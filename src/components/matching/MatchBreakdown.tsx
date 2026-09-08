import React from 'react';
import type { PlaceMatchEvaluation } from '../../types/matching';
import { ScoreBadge } from '../common/ScoreBadge';

interface MatchBreakdownProps {
  evaluation?: PlaceMatchEvaluation;
  placeName?: string;
  displacementReason?: string;
  impossibleReasons?: string[];
}

export const MatchBreakdown: React.FC<MatchBreakdownProps> = ({
  evaluation,
  placeName,
  displacementReason,
  impossibleReasons
}) => {
  if (impossibleReasons && impossibleReasons.length > 0) {
    return (
      <div className="space-y-2 text-xs">
        <div className="text-rose-400 font-semibold">
          Переселение невозможно в текущих условиях:
        </div>
        <ul className="space-y-1 pl-1">
          {impossibleReasons.map((reason, idx) => (
            <li key={idx} className="text-rose-300 flex items-start gap-1.5">
              <span className="text-rose-500 font-bold">✕</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-xs text-zinc-500 italic">
        Оценка совместимости не рассчитана
      </div>
    );
  }

  const matchesCount = evaluation.pros.length;
  const compromisesCount = evaluation.warnings.length;

  return (
    <div className="space-y-3 text-xs">
      {/* Score and Count Summary */}
      <div className="flex items-baseline justify-between border-b border-[#202326] pb-2">
        <div>
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">
            Совместимость {placeName && <span>· {placeName}</span>}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            {matchesCount} {matchesCount === 1 ? 'совпадение' : matchesCount < 5 ? 'совпадения' : 'совпадений'}
            {compromisesCount > 0 && ` · ${compromisesCount} компромисс`}
          </div>
        </div>
        <ScoreBadge score={evaluation.score} isEligible={evaluation.isEligible} size="lg" />
      </div>

      {/* Displacement note */}
      {displacementReason && (
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-[11px] leading-relaxed">
          <span className="text-zinc-200 font-medium">Конкуренция за слоты:</span> {displacementReason}
        </div>
      )}

      {/* Factors List */}
      <div className="space-y-1.5 pt-1">
        {/* Hard Conflicts (Red) */}
        {evaluation.hardConflicts.map((c, idx) => (
          <div key={`c-${idx}`} className="flex items-start gap-2 text-rose-400 font-medium">
            <span className="shrink-0 font-bold">✕</span>
            <span>{c.message}</span>
          </div>
        ))}

        {/* Pros (Green) */}
        {evaluation.pros.map((p, idx) => (
          <div key={`p-${idx}`} className="flex items-start gap-2 text-emerald-400">
            <span className="shrink-0 font-bold">✓</span>
            <span className="text-zinc-300">{p.message}</span>
          </div>
        ))}

        {/* Warnings (Amber) */}
        {evaluation.warnings.map((w, idx) => (
          <div key={`w-${idx}`} className="flex items-start gap-2 text-amber-400">
            <span className="shrink-0 font-bold">⚠</span>
            <span className="text-zinc-400">{w.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
