import React, { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  strokeColor?: string;
  showSubtext?: boolean;
  unit?: string;
  className?: string;
  animate?: boolean;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  maxScore = 100,
  size = 52,
  strokeWidth = 4.5,
  colorClass = 'text-emerald-500',
  strokeColor,
  showSubtext = false,
  unit = '%',
  className = '',
  animate = true
}) => {
  const [animatedScore, setAnimatedScore] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setAnimatedScore(score);
      return;
    }

    const startVal = 0;
    const diff = score - startVal;
    const duration = 650;
    const startTime = performance.now();

    const frame = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const cur = Math.round(startVal + diff * eased);
      setAnimatedScore(cur);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [score, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, (animatedScore / maxScore) * 100));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800/80"
          fill="none"
        />
        {/* Progress bar with smooth ease-out offset */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor || 'currentColor'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${!strokeColor ? colorClass : ''} transition-all duration-300 ease-out`}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
        <span className="text-xs font-bold font-mono text-slate-100 leading-none">
          {animatedScore}{unit && !showSubtext ? unit : ''}
        </span>
        {showSubtext && (
          <span className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">
            /{maxScore}
          </span>
        )}
      </div>
    </div>
  );
};
