import React from 'react';
import castleHeaderImg from '../../assets/castle-header.jpg';

export const CastleHeaderBanner: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. High-resolution Gothic Manor Artwork on the right half */}
      <img
        src={castleHeaderImg}
        alt="Gothic Manor Twilight"
        className="absolute right-0 top-0 w-full lg:w-[68%] h-full object-cover object-[center_25%] opacity-85 filter contrast-115 brightness-105 transition-transform duration-700 group-hover:scale-[1.02]"
      />

      {/* 2. Seamless Editorial Gradient Mask (Dark on left for text legibility, clear on right for artwork) */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, #0c0c10 0%, #0c0c10 32%, rgba(12, 12, 16, 0.85) 52%, rgba(12, 12, 16, 0.25) 75%, transparent 100%)'
        }}
      />

      {/* 3. Top and Bottom Vignette for seamless card boundary blending */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10] via-transparent to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c10]/60 via-transparent to-transparent" />

      {/* 4. Subtle Ambient Ethereal Glow */}
      <div 
        className="absolute right-12 top-6 w-64 h-48 pointer-events-none opacity-20 animate-pulse"
        style={{
          background: 'radial-gradient(circle at 60% 40%, rgba(186, 230, 253, 0.35), transparent 70%)',
          filter: 'blur(20px)'
        }}
      />
    </div>
  );
};

