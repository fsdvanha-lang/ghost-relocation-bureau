import React from 'react';
import type { GhostApplication } from '../../types/ghost';
import type { RelocationPlace } from '../../types/place';
import type { PlaceMatchEvaluation } from '../../types/matching';
import { GhostInspectorPanel } from './GhostInspectorPanel';

interface GhostDetailDrawerProps {
  ghost: GhostApplication | null;
  places: RelocationPlace[];
  evaluations: Record<string, PlaceMatchEvaluation>;
  placeOccupants: Record<string, string[]>;
  recommendedPlaceId: string | null;
  displacementReason?: string;
  impossibleReasons?: string[];
  isOpen: boolean;
  onClose: () => void;
  onManualAssign: (ghostId: string, placeId: string, reason?: string) => void;
  onUnassign: (ghostId: string) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  isDashboard?: boolean;
  onInspectPlace?: (place: RelocationPlace) => void;
}

export const GhostDetailDrawer: React.FC<GhostDetailDrawerProps> = ({
  ghost,
  places,
  evaluations,
  placeOccupants,
  recommendedPlaceId,
  displacementReason,
  impossibleReasons,
  isOpen,
  onClose,
  onManualAssign,
  onUnassign,
  onInspectPlace,
  isDashboard = false
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ghost) return null;

  return (
    <div className={isDashboard ? 'xl:hidden' : ''}>
      {/* Backdrop overlay for modal drawer */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-in Drawer Container (Full height pinned drawer) */}
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] h-full flex flex-col animate-drawer-slide shadow-2xl"
      >
        <GhostInspectorPanel
          ghost={ghost}
          places={places}
          evaluations={evaluations}
          placeOccupants={placeOccupants}
          recommendedPlaceId={recommendedPlaceId}
          displacementReason={displacementReason}
          impossibleReasons={impossibleReasons}
          onClose={onClose}
          onManualAssign={onManualAssign}
          onUnassign={onUnassign}
          onInspectPlace={onInspectPlace}
          isDocked={false}
        />
      </div>
    </div>
  );
};
