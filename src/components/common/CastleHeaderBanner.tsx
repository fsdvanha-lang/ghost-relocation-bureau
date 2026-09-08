import React from 'react';
import castleHeaderImg from '../../assets/castle-header.jpg';

export const CastleHeaderBanner: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Real gothic castle painted artwork from reference */}
      <img
        src={castleHeaderImg}
        alt="Gothic Castle"
        className="w-full h-full object-cover object-center opacity-45 mix-blend-screen scale-105 filter contrast-125 brightness-95"
      />
      
      {/* Atmospheric radial and linear vignette fades */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e1424] via-[#0e1424]/60 to-[#0e1424]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1424] via-transparent to-[#0e1424]/40" />
    </div>
  );
};
