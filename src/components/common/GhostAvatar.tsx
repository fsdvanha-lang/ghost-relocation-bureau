import React from 'react';
import agathaAvatarImg from '../../assets/agatha-avatar.jpg';
import ghostGlowImg from '../../assets/locations/ghost-avatar-glow.png';

interface GhostAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ghostId?: string;
  usePhoto?: boolean;
}

export const GhostAvatar: React.FC<GhostAvatarProps> = ({ 
  size = 'md', 
  className = '',
  ghostId,
  usePhoto
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24'
  };

  const isAgatha = usePhoto || ghostId === 'ghost-1' || size === 'xl';
  const avatarImage = isAgatha ? agathaAvatarImg : ghostGlowImg;

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-[#0d1424] border border-indigo-400/30 shadow-[0_4px_16px_rgba(0,0,0,0.5)] ${sizeMap[size]} ${className}`}
    >
      {/* Ambient subtle glow ring */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-indigo-500/20 via-sky-500/10 to-transparent pointer-events-none blur-xs" />
      
      {/* Painted ghost artwork from reference */}
      <img
        src={avatarImage}
        alt="Ghost avatar"
        className="w-full h-full object-cover scale-110 filter contrast-110 brightness-105"
        loading="lazy"
      />

      {/* Subtle border ring overlay */}
      <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none ring-1 ring-inset ring-white/15" />
    </div>
  );
};
