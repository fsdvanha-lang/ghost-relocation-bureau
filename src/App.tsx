import React from 'react';
import { BureauProvider, useBureau } from './context/BureauContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { PlacesPage } from './pages/PlacesPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { AiWorklogPage } from './pages/AiWorklogPage';

const AppContent: React.FC = () => {
  const { state } = useBureau();

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

  return <AppLayout>{renderCurrentView()}</AppLayout>;
};

export function App() {
  return (
    <BureauProvider>
      <AppContent />
    </BureauProvider>
  );
}

export default App;
