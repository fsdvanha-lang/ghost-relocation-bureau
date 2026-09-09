import React from 'react';
import ghost1Img from '../../assets/ghosts/ghost-1-agatha.png';
import ghost2Img from '../../assets/ghosts/ghost-2-morok.png';
import ghost3Img from '../../assets/ghosts/ghost-3-edgar.png';
import ghost4Img from '../../assets/ghosts/ghost-4-louise.png';
import ghost5Img from '../../assets/ghosts/ghost-5-bartholomew.png';
import ghost6Img from '../../assets/ghosts/ghost-6-kaspersky.png';
import ghost7Img from '../../assets/ghosts/ghost-7-seraphima.png';
import ghost8Img from '../../assets/ghosts/ghost-8-baltys.png';
import ghost9Img from '../../assets/ghosts/ghost-9-shadow.png';
import ghost10Img from '../../assets/ghosts/ghost-10-olivia.png';
import ghostGlowImg from '../../assets/locations/ghost-avatar-glow.png';

interface GhostAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ghostId?: string;
  usePhoto?: boolean;
  isDrawer?: boolean;
}

const GHOST_PORTRAITS: Record<string, string> = {
  'ghost-1': ghost1Img,
  'ghost-2': ghost2Img,
  'ghost-3': ghost3Img,
  'ghost-4': ghost4Img,
  'ghost-5': ghost5Img,
  'ghost-6': ghost6Img,
  'ghost-7': ghost7Img,
  'ghost-8': ghost8Img,
  'ghost-9': ghost9Img,
  'ghost-10': ghost10Img,
};

export const GhostAvatar: React.FC<GhostAvatarProps> = ({ 
  size = 'md', 
  className = '',
  ghostId,
  isDrawer = false,
  usePhoto: _usePhoto
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24'
  };

  const avatarImage = (ghostId && GHOST_PORTRAITS[ghostId]) || ghostGlowImg;

  return (
    <div
      className={`group relative rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-[#090e1a] border border-indigo-400/35 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:-translate-y-px hover:shadow-[0_0_14px_rgba(99,102,241,0.35)] ${
        isDrawer ? 'animate-drawer-avatar' : ''
      } ${sizeMap[size]} ${className}`}
    >
      {/* Ambient subtle glow ring */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-indigo-500/20 via-sky-500/10 to-transparent pointer-events-none blur-xs" />
      
      {/* Subtle fog shimmer overlay on hover (Requirement 8) */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-25 bg-gradient-to-t from-sky-400/30 to-transparent transition-opacity duration-200 pointer-events-none" />

      {/* Ghost portrait */}
      <img
        src={avatarImage}
        alt="Ghost avatar"
        className="w-full h-full object-cover scale-105 filter contrast-110 brightness-105 transition-transform duration-200 group-hover:scale-110"
        loading="lazy"
      />

      {/* Subtle border ring overlay */}
      <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none ring-1 ring-inset ring-white/15" />
    </div>
  );
};
