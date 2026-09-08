import React from 'react';
import { BureauProvider, useBureau } from './context/BureauContext';
import { ToastProvider } from './components/common/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { PlacesPage } from './pages/PlacesPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { AiWorklogPage } from './pages/AiWorklogPage';
import { GhostDetailDrawer } from './components/ghosts/GhostDetailDrawer';

const AppContent: React.FC = () => {
  const { 
    state, 
    selectedGhost, 
    selectGhost, 
    assignManual, 
    unassignGhost 
  } = useBureau();

  const selectedResult = selectedGhost ? state.allocation.ghostResults[selectedGhost.id] : null;

  // Drawer Prev / Next ghost inspector navigation
  const currentIndex = selectedGhost
    ? state.ghosts.findIndex(g => g.id === selectedGhost.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < state.ghosts.length - 1;

  const handleNavigatePrev = () => {
    if (hasPrev) selectGhost(state.ghosts[currentIndex - 1].id);
  };

  const handleNavigateNext = () => {
    if (hasNext) selectGhost(state.ghosts[currentIndex + 1].id);
  };

  const renderCurrentView = () => {
    switch (state.activeView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'places':
        return <PlacesPage />;
      case 'decisions':
        return <DecisionsPage />;
      case 'worklog':
        return <AiWorklogPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppLayout>
      {renderCurrentView()}

      {/* Global Ghost Inspection Drawer with Inspector Navigation */}
      <GhostDetailDrawer
        ghost={selectedGhost}
        places={state.places}
        evaluations={selectedResult?.evaluations || {}}
        placeOccupants={state.allocation.placeOccupants}
        recommendedPlaceId={selectedResult?.recommendedPlaceId || null}
        displacementReason={selectedResult?.displacementReason}
        impossibleReasons={selectedResult?.impossibleReasons}
        isOpen={!!selectedGhost}
        onClose={() => selectGhost(null)}
        onManualAssign={assignManual}
        onUnassign={unassignGhost}
        onNavigatePrev={hasPrev ? handleNavigatePrev : undefined}
        onNavigateNext={hasNext ? handleNavigateNext : undefined}
        hasPrev={hasPrev}
        hasNext={hasNext}
        isDashboard={state.activeView === 'dashboard'}
      />
    </AppLayout>
  );
};

export function App() {
  return (
    <BureauProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BureauProvider>
  );
}

export default App;
