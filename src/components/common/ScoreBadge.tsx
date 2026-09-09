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
  showLabel = false
}) => {
  let textColor = 'text-emerald-400';
  if (!isEligible || score < 50) {
    textColor = 'text-rose-400';
  } else if (score < 80) {
    textColor = 'text-amber-400';
  }

  if (!isEligible && score === 0) {
    return (
      <span 
        className="font-mono text-xs font-semibold text-slate-500 inline-flex items-baseline gap-1 cursor-help"
        title="Детерминированная оценка соответствия условий и предпочтений. Нет допустимого места."
      >
        <span>—</span>
        <span className="text-slate-500 font-normal text-[10px]">/ 100</span>
        {showLabel && <span className="text-[10px] text-slate-500 ml-0.5">Совместимость</span>}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div 
        className="flex items-baseline gap-1.5 font-mono cursor-help"
        title="Детерминированная оценка соответствия условий и предпочтений."
      >
        <span className={`text-2xl font-bold tracking-tight ${textColor}`}>{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
        {showLabel && <span className="text-xs text-slate-400 font-sans ml-1">Совместимость</span>}
      </div>
    );
  }

  return (
    <span 
      className={`font-mono text-xs font-semibold ${textColor} inline-flex items-baseline gap-1 cursor-help`}
      title="Детерминированная оценка соответствия условий и предпочтений."
    >
      <span>{score}</span>
      <span className="text-slate-400 font-normal text-[10px]">/ 100</span>
      {showLabel && <span className="text-[10px] text-slate-400 font-sans ml-0.5">Совместимость</span>}
    </span>
  );
};

