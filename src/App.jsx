import React, { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { GameProvider } from './context/GameContext';
import { TaskProvider } from './context/TaskContext';
import { IELTSProvider } from './context/IELTSContext';
import DevWarning from './components/DevWarning';

import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import Dashboard from './pages/Dashboard';
import DailyCheckInModal from './components/DailyCheckInModal';
import WeeklyReviewModal from './components/WeeklyReviewModal';
import AIChatBubble from './components/AIChatBubble';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingPage from './components/OnboardingModal';
import NotificationManager from './components/NotificationManager';
import Toast from './components/Toast';
import LevelUpModal from './components/LevelUpModal';

// Lazy-loaded pages (code splitting)
const AnalysisPage = React.lazy(() => import('./pages/AnalysisPage'));
const HatcheryPage = React.lazy(() => import('./pages/HatcheryPage'));
const WorldMapPage = React.lazy(() => import('./pages/WorldMapPage'));
const LibraryPage = React.lazy(() => import('./pages/LibraryPage'));
const FocusPage = React.lazy(() => import('./pages/FocusPage'));
const IELTSPage = React.lazy(() => import('./pages/IELTSPage'));
const HealthPage = React.lazy(() => import('./pages/HealthPage'));

import './index.css';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.substring(1) || 'dashboard';
  const { showOnboarding, setShowOnboarding } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  // Close sidebar on route change
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (showOnboarding) {
    return <OnboardingPage onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <>
      <div className="app">
        <div className={`sb-overlay${isSidebarOpen ? " open" : ""}`} onClick={() => setIsSidebarOpen(false)} />
        <button className="hamburger" onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation menu">☰</button>
        <Sidebar isOpen={isSidebarOpen} onShowWeeklyReview={() => { setShowWeeklyReview(true); setIsSidebarOpen(false); }} />

        <main className="main">
          <div className="page-enter" key={location.pathname}>
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--t2)', fontSize: 13 }}>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analysis" element={<ErrorBoundary><AnalysisPage /></ErrorBoundary>} />
                <Route path="/hatchery" element={<HatcheryPage />} />
                <Route path="/worldmap" element={<WorldMapPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/focus" element={<FocusPage />} />
                <Route path="/ielts" element={<ErrorBoundary><IELTSPage /></ErrorBoundary>} />
                <Route path="/health" element={<HealthPage />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-nav">
        {[
          { id: "dashboard", ic: "🏠", label: "Home" },
          { id: "worldmap", ic: "🗺️", label: "Map" },
          { id: "ielts", ic: "📚", label: "IELTS" },
          { id: "hatchery", ic: "⚔️", label: "Battle" },
          { id: "health", ic: "❤️", label: "Health" },
        ].map(n => (
          <button key={n.id} className={"mob-item" + (activePage === n.id ? " on" : "")} onClick={() => navigate('/' + n.id)}>
            <span className="mob-ic">{n.ic}</span>
            {n.label}
          </button>
        ))}
      </div>

      <SettingsModal />
      <DailyCheckInModal />
      <WeeklyReviewModal onClose={() => setShowWeeklyReview(false)} forceShow={showWeeklyReview} />
      <AIChatBubble />
      <NotificationManager />
      <Toast />
      <LevelUpModal />
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <TaskProvider>
          <IELTSProvider>
            <DevWarning />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </IELTSProvider>
        </TaskProvider>
      </GameProvider>
    </SettingsProvider>
  );
}
