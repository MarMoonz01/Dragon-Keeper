import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { GameProvider, useGame } from './context/GameContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { IELTSProvider } from './context/IELTSContext';
import DevWarning from './components/DevWarning';

import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import Dashboard from './pages/Dashboard';
import DailyCheckInModal from './components/DailyCheckInModal';
import AnalysisPage from './pages/AnalysisPage';
import HatcheryPage from './pages/HatcheryPage';
import WorldMapPage from './pages/WorldMapPage';
import LibraryPage from './pages/LibraryPage';
import FocusPage from './pages/FocusPage';
import IELTSPage from './pages/IELTSPage';
import HealthPage from './pages/HealthPage';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingPage from './components/OnboardingModal';
import NotificationManager from './components/NotificationManager';
import { DRAGONS } from './data/constants';
import './index.css';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.substring(1) || 'dashboard';

  const { showSettings, setShowSettings, showOnboarding, setShowOnboarding, resetGame, gcal, updateGcal } = useSettings();
  const { dragon, stats, health, addXP, updateHealth, defeatMonster } = useGame();
  const { tasks, analyzing, showCheckIn, setShowCheckIn, endDay, showToast, toast, completeTask, addTask, editTask, deleteTask, gcalPushing, onGcalPush } = useTasks();

  const [focusTask, setFocusTask] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const startFocus = (task) => {
    setFocusTask(task);
    navigate('/focus');
  };

  const endFocus = () => {
    setFocusTask(null);
    navigate('/dashboard');
  };

  // Derived state for props
  const streak = stats.streak || 0;

  // Gate: show full-page onboarding
  if (showOnboarding) {
    return <OnboardingPage onComplete={() => setShowOnboarding(false)} />;
  }

  // Handle Level Up Overlay
  const { levelUp, setLevelUp } = useGame();

  return (
    <>
      <div className="app">
        <div className={`sb-overlay${isSidebarOpen ? " open" : ""}`} onClick={() => setIsSidebarOpen(false)} />
        <button className="hamburger" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <Sidebar dragon={dragon} onSettings={() => setShowSettings(true)} isOpen={isSidebarOpen} />

        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <>
                <Dashboard
                  tasks={tasks}
                  onComplete={completeTask}
                  dragon={dragon}
                  streak={streak}
                  onAdd={addTask}
                  onEdit={editTask}
                  onDelete={deleteTask}
                  gcal={gcal}
                  onConnect={() => updateGcal({ ...gcal, connected: true })}
                  onPush={onGcalPush}
                  pushing={gcalPushing}
                  stats={stats}
                  onFocus={startFocus}
                />
                <div style={{ padding: "0 24px 24px" }}>
                  <button className="btn btn-gh" style={{ width: "100%", justifyContent: "center", border: "1px dashed var(--bdr)", padding: 12 }} onClick={() => setShowCheckIn(true)} disabled={analyzing}>
                    {analyzing ? "🌙 Analysing Day..." : "🌙 End Day & Analyze Performance"}
                  </button>
                </div>
              </>
            } />
            <Route path="/analysis" element={<ErrorBoundary><AnalysisPage tasks={tasks} dragon={dragon} stats={stats} streak={streak} /></ErrorBoundary>} />
            <Route path="/hatchery" element={<HatcheryPage tasks={tasks} dragon={dragon} stats={stats} onDefeat={defeatMonster} streak={streak} />} />
            <Route path="/worldmap" element={<WorldMapPage dragon={dragon} stats={stats} showToast={showToast} onXP={addXP} />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/focus" element={<FocusPage task={focusTask} onComplete={completeTask} onExit={endFocus} />} />
            <Route path="/ielts" element={<ErrorBoundary><IELTSPage /></ErrorBoundary>} />
            <Route path="/health" element={<HealthPage health={health} onSave={updateHealth} />} />
          </Routes>
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onReset={resetGame} />}
      {showCheckIn && <DailyCheckInModal onClose={() => setShowCheckIn(false)} onSave={endDay} analyzing={analyzing} />}
      <NotificationManager tasks={tasks} />

      {toast && (
        <div className="toast">
          <div className="t-ic">{toast.icon}</div>
          <div><div className="t-tl">{toast.title}</div><div className="t-msg">{toast.msg}</div></div>
        </div>
      )}

      {levelUp && (
        <div className="luov" onClick={() => setLevelUp(null)}>
          <div className="luc">
            <span className="lu-em">{DRAGONS.reduce((s, st) => levelUp >= st.lv ? st : s, DRAGONS[0]).em}</span>
            <div className="lu-t">LEVEL UP!</div>
            <div className="lu-n">Level {levelUp}</div>
            <div className="lu-m">Your dragon grows stronger!<br />{DRAGONS.find(d => d.lv === levelUp) && ("You've evolved into a " + DRAGONS.find(d => d.lv === levelUp).name + "!")}</div>
            <button className="btn btn-g" style={{ margin: "0 auto" }} onClick={() => setLevelUp(null)}>Continue Journey ✦</button>
          </div>
        </div>
      )}
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
