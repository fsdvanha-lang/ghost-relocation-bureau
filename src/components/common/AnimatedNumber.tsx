import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  showDelta?: boolean;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 600,
  className = '',
  showDelta = true
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [delta, setDelta] = useState<{ diff: number; key: number } | null>(null);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial mount: animate from 0 to value
    if (prevValueRef.current === null) {
      prevValueRef.current = 0;
    }

    const startVal = prevValueRef.current;
    const diff = value - startVal;

    if (diff !== 0 && showDelta && prevValueRef.current !== 0) {
      setDelta({ diff, key: Date.now() });
      const timer = setTimeout(() => {
        setDelta(null);
      }, 900);
      return () => clearTimeout(timer);
    }

    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startVal + diff * eased);

      setDisplayValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        prevValueRef.current = value;
      }
    };

    const animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [value, duration, showDelta]);

  return (
    <div className="relative inline-flex items-center">
      <span className={className}>{displayValue}</span>
      
      {/* Floating Delta Badge */}
      {delta && delta.diff !== 0 && (
        <span
          key={delta.key}
          className={`absolute -top-3.5 -right-5 text-[10px] font-mono font-bold px-1 py-0.2 rounded animate-delta ${
            delta.diff > 0 
              ? 'text-emerald-400 bg-emerald-500/15' 
              : 'text-rose-400 bg-rose-500/15'
          }`}
        >
          {delta.diff > 0 ? `↑${delta.diff}` : `↓${Math.abs(delta.diff)}`}
        </span>
      )}
    </div>
  );
};
