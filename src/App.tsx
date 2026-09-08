import React from 'react';
import { BureauProvider, useBureau } from './context/BureauContext';
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

      {/* Global Ghost Inspection Drawer */}
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
      />
    </AppLayout>
  );
};

export function App() {
  return (
    <BureauProvider>
      <AppContent />
    </BureauProvider>
  );
}

export default App;
