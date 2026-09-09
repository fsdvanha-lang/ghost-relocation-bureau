import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CustomCursor } from '../common/CustomCursor';
import { OccultAmbientCanvas } from '../common/OccultAmbientCanvas';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#08080a] text-[#F3F3F0] font-sans antialiased selection:bg-[#F3F3F0] selection:text-[#08080a] relative overflow-hidden">
      {/* 1. Ethereal 60fps Ambient Spirit Canvas */}
      <OccultAmbientCanvas />

      {/* 2. Tactile Organic Film Grain Overlay */}
      <div className="film-grain-overlay" aria-hidden="true" />

      {/* 3. Awwwards Precision Custom Cursor */}
      <CustomCursor />

      {/* 4. Left Sidebar */}
      <Sidebar />

      {/* 5. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden z-10 relative">
        <TopBar />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto scroll-smooth">
          <div className="max-w-[1740px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
