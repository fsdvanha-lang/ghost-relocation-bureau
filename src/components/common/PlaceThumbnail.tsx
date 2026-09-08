import React from 'react';
import libraryThumbImg from '../../assets/library-thumb.jpg';
import castleHeaderImg from '../../assets/castle-header.jpg';

interface PlaceThumbnailProps {
  placeType?: string;
  placeId?: string;
  name?: string;
  className?: string;
}

export const PlaceThumbnail: React.FC<PlaceThumbnailProps> = ({
  placeType = '',
  placeId = '',
  className = 'w-16 h-12 rounded-lg'
}) => {
  // Return tailored atmospheric images and SVG backgrounds based on place type or id
  const isLibrary = placeType.toLowerCase().includes('библиотека') || placeId === 'place-3';
  const isCastle = placeType.toLowerCase().includes('замок') || placeId === 'place-1';
  const isTheater = placeType.toLowerCase().includes('театр') || placeId === 'place-4';
  const isBasement = placeType.toLowerCase().includes('подвал') || placeType.toLowerCase().includes('подземелье') || placeId === 'place-5';
  const isLighthouse = placeType.toLowerCase().includes('маяк') || placeId === 'place-2';
  const isCrypt = placeType.toLowerCase().includes('склеп') || placeId === 'place-6';
  const isObservatory = placeType.toLowerCase().includes('обсерватория') || placeId === 'place-7';

  return (
    <div className={`relative overflow-hidden shrink-0 border border-[#212f4d] shadow-md ${className}`}>
      {isLibrary ? (
        <img
          src={libraryThumbImg}
          alt="Старая библиотека"
          className="w-full h-full object-cover filter contrast-110"
        />
      ) : isCastle ? (
        <img
          src={castleHeaderImg}
          alt="Замок на утесе"
          className="w-full h-full object-cover object-center filter contrast-110"
        />
      ) : isTheater ? (
        <svg viewBox="0 0 120 90" fill="none" className="w-full h-full object-cover">
          <rect width="120" height="90" fill="#150914" />
          {/* Stage spotlights */}
          <path d="M20 0 L60 70 L40 70 Z" fill="#fbcfe8" fillOpacity="0.15" />
          <path d="M100 0 L60 70 L80 70 Z" fill="#c084fc" fillOpacity="0.15" />
          {/* Velvet curtains */}
          <path d="M0 0 Q25 45 0 90 L30 90 Q40 45 20 0 Z" fill="#831843" />
          <path d="M120 0 Q95 45 120 90 L90 90 Q80 45 100 0 Z" fill="#831843" />
          {/* Stage plank floor */}
          <path d="M0 72 L120 72 L120 90 L0 90 Z" fill="#2d1b16" />
        </svg>
      ) : isBasement ? (
        <svg viewBox="0 0 120 90" fill="none" className="w-full h-full object-cover">
          <rect width="120" height="90" fill="#0d1117" />
          {/* Stone arch */}
          <path d="M15 90 V45 Q60 15 105 45 V90 H90 V50 Q60 30 30 50 V90 Z" fill="#1e293b" />
          {/* Old industrial print gear */}
          <circle cx="60" cy="58" r="14" stroke="#334155" strokeWidth="4" strokeDasharray="6 3" fill="#0f172a" />
          {/* Cool misty subterranean glow */}
          <circle cx="60" cy="58" r="8" fill="#38bdf8" fillOpacity="0.2" />
        </svg>
      ) : isLighthouse ? (
        <svg viewBox="0 0 120 90" fill="none" className="w-full h-full object-cover">
          <rect width="120" height="90" fill="#081426" />
          {/* Beam of light */}
          <path d="M48 28 L120 0 L120 50 Z" fill="#fef08a" fillOpacity="0.25" />
          {/* Tower */}
          <path d="M40 85 L46 25 H54 L60 85 Z" fill="#e2e8f0" />
          <path d="M42 65 L44 55 H56 L58 65 Z" fill="#dc2626" />
          <path d="M44 42 L45 35 H55 L56 42 Z" fill="#dc2626" />
          {/* Sea rocks */}
          <path d="M0 90 L30 75 L70 80 L120 90 Z" fill="#0f172a" />
        </svg>
      ) : isCrypt ? (
        <svg viewBox="0 0 120 90" fill="none" className="w-full h-full object-cover">
          <rect width="120" height="90" fill="#0b0f15" />
          <path d="M30 85 L35 55 H85 L90 85 Z" fill="#1e293b" />
          <path d="M40 55 L45 42 H75 L80 55 Z" fill="#334155" />
          {/* Eerie green / blue spirit glow */}
          <circle cx="60" cy="40" r="12" fill="#34d399" fillOpacity="0.2" />
        </svg>
      ) : isObservatory ? (
        <svg viewBox="0 0 120 90" fill="none" className="w-full h-full object-cover">
          <rect width="120" height="90" fill="#070b14" />
          {/* Stars */}
          <circle cx="30" cy="20" r="1" fill="#fff" />
          <circle cx="85" cy="15" r="1" fill="#fff" />
          <circle cx="100" cy="35" r="1.5" fill="#93c5fd" />
          {/* Dome */}
          <path d="M35 75 C35 45 85 45 85 75 Z" fill="#1e293b" />
          {/* Telescope slit */}
          <path d="M56 46 L68 25" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 120 90" fill="none" className="w-full h-full object-cover">
          <rect width="120" height="90" fill="#0d131f" />
          <circle cx="60" cy="45" r="20" fill="#3b82f6" fillOpacity="0.15" />
          <path d="M0 70 Q60 50 120 70 L120 90 L0 90 Z" fill="#131b2c" />
        </svg>
      )}
    </div>
  );
};
