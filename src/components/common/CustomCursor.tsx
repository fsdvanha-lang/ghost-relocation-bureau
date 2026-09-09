import React, { useEffect, useState, useRef } from 'react';

/**
 * Minimalist precision dot cursor without any outer rings, lagging circles, or popup text.
 */
export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const mousePos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Only run on desktop with fine pointer
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none">
      {/* Precision Micro Dot (Zero outer circle) */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-0.5 -mt-0.5 w-1.5 h-1.5 rounded-full bg-[#F3F3F0] will-change-transform shadow-[0_0_6px_rgba(243,243,240,0.7)]"
      />
    </div>
  );
};
