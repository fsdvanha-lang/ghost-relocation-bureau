import React from 'react';

interface GhostAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GhostAvatar: React.FC<GhostAvatarProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24'
  };

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 bg-gradient-to-b from-[#1c2438] via-[#131a2b] to-[#0c101c] border border-indigo-400/25 shadow-[0_4px_16px_rgba(0,0,0,0.5)] ${sizeMap[size]} ${className}`}
    >
      {/* Outer subtle glow ring for large avatar */}
      {size === 'xl' && (
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent pointer-events-none blur-sm" />
      )}

      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[78%] h-[78%] drop-shadow-[0_4px_12px_rgba(148,163,184,0.35)]"
      >
        <defs>
          <linearGradient id="ghostGrad" x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="0.75" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="ghostShadow" x1="32" y1="40" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#94a3b8" stopOpacity="0" />
            <stop offset="1" stopColor="#64748b" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Ghost flowing body */}
        <path
          d="M32 8C20.9543 8 12 16.9543 12 28V51C12 53.2 14.5 54.5 16.2 53.1L21.5 48.8L26.8 53.1C28.5 54.5 31 53.2 31 51V49L32 49.8L33 49V51C33 53.2 35.5 54.5 37.2 53.1L42.5 48.8L47.8 53.1C49.5 54.5 52 53.2 52 51V28C52 16.9543 43.0457 8 32 8Z"
          fill="url(#ghostGrad)"
        />
        
        {/* Soft lower drapery shadow */}
        <path
          d="M12 40V51C12 53.2 14.5 54.5 16.2 53.1L21.5 48.8L26.8 53.1C28.5 54.5 31 53.2 31 51V49L32 49.8L33 49V51C33 53.2 35.5 54.5 37.2 53.1L42.5 48.8L47.8 53.1C49.5 54.5 52 53.2 52 51V40H12Z"
          fill="url(#ghostShadow)"
        />

        {/* Eyes: friendly expressive dark ovals */}
        <ellipse cx="25" cy="27" rx="3.2" ry="4.2" fill="#0f172a" />
        <ellipse cx="39" cy="27" rx="3.2" ry="4.2" fill="#0f172a" />
        
        {/* Eye highlights */}
        <circle cx="26" cy="25.5" r="1.2" fill="#ffffff" />
        <circle cx="40" cy="25.5" r="1.2" fill="#ffffff" />

        {/* Cute rosy cheeks */}
        <ellipse cx="21" cy="33" rx="2.5" ry="1.4" fill="#f472b6" fillOpacity="0.45" />
        <ellipse cx="43" cy="33" rx="2.5" ry="1.4" fill="#f472b6" fillOpacity="0.45" />
        
        {/* Sweet tiny mouth */}
        <path
          d="M29 33.5Q32 36.5 35 33.5"
          stroke="#0f172a"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};
