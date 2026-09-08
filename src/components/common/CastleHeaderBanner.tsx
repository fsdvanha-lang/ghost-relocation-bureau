import React from 'react';

export const CastleHeaderBanner: React.FC = () => {
  return (
    <div className="absolute inset-x-0 top-0 h-36 pointer-events-none overflow-hidden select-none z-0 flex items-center justify-center opacity-30">
      <svg
        viewBox="0 0 700 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[700px] h-full object-cover"
      >
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#1e293b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0b0e14" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Moon Glow */}
        <circle cx="350" cy="50" r="100" fill="url(#moonGlow)" />
        <circle cx="350" cy="50" r="28" fill="#e2e8f0" fillOpacity="0.75" />

        {/* Stars */}
        <circle cx="150" cy="25" r="1.2" fill="#94a3b8" />
        <circle cx="210" cy="40" r="1" fill="#cbd5e1" />
        <circle cx="270" cy="20" r="1.5" fill="#f8fafc" />
        <circle cx="430" cy="30" r="1.2" fill="#cbd5e1" />
        <circle cx="490" cy="18" r="1" fill="#94a3b8" />
        <circle cx="560" cy="45" r="1.5" fill="#f8fafc" />

        {/* Hill / Mountain */}
        <path
          d="M100 140 Q 350 70 600 140 Z"
          fill="#0c111c"
        />

        {/* Gothic Castle Spires & Walls */}
        <path
          d="M310 140 V85 L322 68 L334 85 V140 H310 Z"
          fill="#131b2e"
        />
        <path
          d="M330 140 V75 H345 V140 H330 Z"
          fill="#0f1626"
        />
        {/* Main tall central spire */}
        <path
          d="M344 140 V58 L350 32 L356 58 V140 H344 Z"
          fill="#0a0f1d"
        />
        {/* Windows */}
        <rect x="348" y="65" width="4" height="8" rx="2" fill="#fbbf24" fillOpacity="0.85" />
        <rect x="348" y="82" width="4" height="8" rx="2" fill="#fbbf24" fillOpacity="0.5" />
        <rect x="323" y="92" width="3" height="6" rx="1.5" fill="#fbbf24" fillOpacity="0.6" />
        <rect x="370" y="88" width="3" height="6" rx="1.5" fill="#fbbf24" fillOpacity="0.6" />

        {/* Right castle wing */}
        <path
          d="M356 140 V70 H372 V140 H356 Z"
          fill="#0f1626"
        />
        <path
          d="M368 140 V80 L378 65 L388 80 V140 H368 Z"
          fill="#131b2e"
        />

        {/* Spooky bats in sky */}
        <path d="M280 42 Q 285 38 290 42 Q 285 41 280 42 Z" fill="#475569" />
        <path d="M415 35 Q 420 31 425 35 Q 420 34 415 35 Z" fill="#475569" />
      </svg>
    </div>
  );
};
