import React from 'react';

interface ScoreBadgeProps {
  score: number;
  isEligible?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  isEligible = true,
  size = 'md'
}) => {
  let textColor = 'text-emerald-400';
  if (!isEligible || score < 50) {
    textColor = 'text-rose-400';
  } else if (score < 80) {
    textColor = 'text-amber-400';
  }

  if (size === 'lg') {
    return (
      <div className="flex items-baseline gap-1 font-mono">
        <span className={`text-2xl font-semibold tracking-tight ${textColor}`}>{score}</span>
        <span className="text-xs text-zinc-500">/ 100</span>
      </div>
    );
  }

  return (
    <span className={`font-mono text-xs font-semibold ${textColor}`}>
      {score}<span className="text-zinc-500 font-normal text-[11px]">/100</span>
    </span>
  );
};
