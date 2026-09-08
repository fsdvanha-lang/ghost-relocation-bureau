import React from 'react';

export const SidebarGhostIllustration: React.FC = () => {
  return (
    <div className="pt-2 px-3 pb-3 select-none">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-[#121826] to-[#0a0e17] border border-[#1e2638] p-3 text-center flex flex-col items-center">
        {/* Subtle background stars & hill */}
        <div className="relative w-full h-16 flex items-center justify-center">
          <svg viewBox="0 0 160 80" fill="none" className="w-full h-full">
            {/* Stars */}
            <circle cx="25" cy="15" r="1" fill="#94a3b8" fillOpacity="0.8" />
            <circle cx="45" cy="25" r="1.5" fill="#f8fafc" fillOpacity="0.9" />
            <circle cx="115" cy="18" r="1" fill="#cbd5e1" fillOpacity="0.7" />
            <circle cx="135" cy="30" r="1.2" fill="#94a3b8" fillOpacity="0.8" />
            
            {/* Hill */}
            <path d="M-20 80 Q80 40 180 80 Z" fill="#080c14" />
            <path d="M20 80 Q80 50 140 80 Z" fill="#0e1422" />

            {/* Glowing moon aura behind ghost */}
            <circle cx="80" cy="36" r="24" fill="#38bdf8" fillOpacity="0.08" />
          </svg>

          {/* Little floating ghost */}
          <div className="absolute top-2 animate-bounce duration-1000">
            <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9 drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">
              <path
                d="M18 4C11.5 4 6 9.5 6 16V30C6 31.2 7.5 32 8.5 31.2L12 28.5L15.5 31.2C16.5 32 18 31.2 18 30V28.5L20.5 30.5L23 28.5V30C23 31.2 24.5 32 25.5 31.2L29 28.5L31.5 30.5C32.5 31.3 34 30.5 34 29.3V16C34 9.5 28.5 4 18 4Z"
                fill="#f8fafc"
              />
              <circle cx="14" cy="15" r="1.8" fill="#0f172a" />
              <circle cx="22" cy="15" r="1.8" fill="#0f172a" />
              <ellipse cx="11.5" cy="18" rx="1.5" ry="0.8" fill="#f472b6" fillOpacity="0.5" />
              <ellipse cx="24.5" cy="18" rx="1.5" ry="0.8" fill="#f472b6" fillOpacity="0.5" />
            </svg>
          </div>
        </div>

        {/* Catchphrase */}
        <p className="text-[11px] text-slate-400 font-medium leading-tight mt-1">
          Каждое привидение<br />
          <span className="text-slate-500">заслуживает свой дом</span>
        </p>
      </div>
    </div>
  );
};
