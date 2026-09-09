import React, { useRef, useState, useCallback } from 'react';
import { sound } from '../../utils/audioSystem';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableTilt?: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.12)',
  enableTilt = false,
  onClick,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rx = -((y - centerY) / centerY) * 3.5; // Max 3.5 deg
      const ry = ((x - centerX) / centerX) * 3.5;
      setTilt({ rx, ry });
    }
  }, [enableTilt]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (enableTilt) {
      setTilt({ rx: 0, ry: 0 });
    }
  }, [enableTilt]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    sound.playClick();
    if (onClick) onClick(e);
  }, [onClick]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transform: enableTilt && isHovered 
          ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(4px)`
          : undefined,
        transition: enableTilt ? 'transform 200ms cubic-bezier(0.16,1,0.3,1)' : undefined
      }}
      className={`relative rounded-2xl bg-[#0c0c10] border border-white/[0.08] overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Radial Spotlight Overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(420px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 65%)`,
        }}
      />

      {/* Dynamic Luminous Border Highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 ease-out z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(280px circle at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.3), transparent 70%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* Card Content */}
      {children}
    </div>
  );
};
