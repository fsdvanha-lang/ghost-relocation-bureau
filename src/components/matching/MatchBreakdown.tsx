import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
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
      <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>Переселение невозможно в текущих условиях</span>
        </div>
        <p className="text-xs text-slate-300">
          Система проверила все доступные локации бюро. Выявлены блокирующие факторы:
        </p>
        <ul className="space-y-1.5 pl-2">
          {impossibleReasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-rose-300">
              <span className="text-rose-500 font-bold">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <div className="text-[11px] text-slate-400 pt-1 border-t border-rose-900/40">
          💡 Рекомендация оператору: измените требования привидения или проведите принудительное ручное назначение в режиме исключения.
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-center text-xs text-slate-400">
        Нет данных оценки совместимости
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header with Score and summary */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Обоснование подбора {placeName && <span className="text-slate-200">для «{placeName}»</span>}
          </div>
          <p className="text-xs text-slate-300 font-medium">{evaluation.summary}</p>
        </div>
        <ScoreBadge score={evaluation.score} isEligible={evaluation.isEligible} size="lg" />
      </div>

      {/* Displacement note if applicable */}
      {displacementReason && (
        <div className="flex items-start gap-2.5 p-2.5 bg-indigo-950/40 border border-indigo-800/50 rounded-lg text-xs text-indigo-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Конкуренция за слоты:</span> {displacementReason}
          </div>
        </div>
      )}

      {/* Hard Conflicts */}
      {evaluation.hardConflicts.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Критические несовместимости (Hard Constraints):</span>
          </div>
          <div className="space-y-1.5 pl-1">
            {evaluation.hardConflicts.map((c, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-rose-300/90 bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                <span className="font-bold text-rose-500">✕</span>
                <span>{c.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pros list */}
      {evaluation.pros.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Совпадающие условия и преимущества:</span>
          </div>
          <div className="space-y-1.5 pl-1">
            {evaluation.pros.map((p, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{p.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings list */}
      {evaluation.warnings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Мягкие отклонения (компромиссы):</span>
          </div>
          <div className="space-y-1.5 pl-1">
            {evaluation.warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-amber-950/20 p-2 rounded-lg border border-amber-900/30">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
