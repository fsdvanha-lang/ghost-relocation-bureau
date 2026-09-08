import React from 'react';

interface ScoreBadgeProps {
  score: number;
  isEligible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  isEligible = true,
  size = 'md',
  showLabel = true
}) => {
  let colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60';
  let barColor = 'bg-emerald-500';

  if (!isEligible || score < 50) {
    colorClasses = 'bg-rose-950/70 text-rose-400 border-rose-800/60';
    barColor = 'bg-rose-500';
  } else if (score < 80) {
    colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-800/60';
    barColor = 'bg-amber-500';
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className={`font-mono font-semibold rounded-md border flex items-center gap-1 ${colorClasses} ${paddingClass}`}>
        {showLabel && <span className="opacity-70 text-[10px] uppercase font-sans">Скор</span>}
        <span>{score}</span>
        <span className="opacity-50 text-[10px]">/100</span>
      </div>
      {size === 'lg' && (
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
          />
        </div>
      )}
    </div>
  );
};
