import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import LevelUpPopup from './components/LevelUpPopup';
import { ToastContainer, FloatingXPContainer } from './components/ToastSystem';
import DBLoadingScreen from './components/DBLoadingScreen';
import { OfflineIndicator, BackupReminder } from './components/OfflineIndicator';
import InstallPrompt from './components/InstallPrompt';
import GoalsPage from './pages/GoalsPage';
import GoalCompletePopup from './components/GoalCompletePopup';
import TodayPage from './pages/TodayPage';
import StatsPage from './pages/StatsPage';
import HistoryPage from './pages/HistoryPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HabitsPage from './pages/HabitsPage';
import ShopPage from './pages/ShopPage';
import InsightsPage from './pages/InsightsPage';
import DownloadLandingPage from './pages/DownloadLandingPage';

// New Liquid Glass Widgets & Modals
import FocusTimer from './components/FocusTimer';
import DailyReviewModal from './components/DailyReviewModal';
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import AppLock from './components/AppLock';
import ErrorBoundary from './components/ErrorBoundary';
import MobileNavDrawer from './components/MobileNavDrawer';

import './index.css';

// ─── Page Router ──────────────────────────────────────────────────────────────
function PageContent() {
  const { state, setPage, dbReady } = useApp();

  if (!dbReady) {
    return <DBLoadingScreen />;
  }

  const { currentPage } = state.ui;

  // Standalone landing page dedicated to downloads with its own layout
  if (currentPage === 'download') {
    return (
      <DownloadLandingPage
        onBackToApp={() => {
          setPage('today');
        }}
      />
    );
  }

  const pages = {
    today: <TodayPage />,
    habits: <HabitsPage />,
    goals: <GoalsPage />,
    shop: <ShopPage />,
    insights: <InsightsPage />,
    stats: <StatsPage />,
    history: <HistoryPage />,
    achievements: <AchievementsPage />,
    profile: <ProfilePage />,
    settings: <SettingsPage />,
  };

  const MOBILE_NAV = [
    { id: 'today', icon: '📋', label: 'Today' },
    { id: 'habits', icon: '✨', label: 'Habits' },
    { id: 'goals', icon: '🎯', label: 'Goals' },
    { id: 'shop', icon: '💎', label: 'Shop' },
    { id: 'insights', icon: '💡', label: 'Insights' },
    { id: 'stats', icon: '📊', label: 'Stats' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
    { id: 'download', icon: '📥', label: 'Download' },
  ];

  return (
    <>
      {/* Apple-grade Liquid Glass Background Layer: Vivid Aurora Mesh + Crisp Shapes */}
      <div className="orb-container" aria-hidden="true">
        <div className="orb orb-cyan" />
        <div className="orb orb-violet" />
        <div className="orb orb-magenta" />
        <div className="orb orb-blue" />
        <div className="orb orb-amber" />
        <div className="orb orb-center" />
        {/* Crisp defined vector shapes for visible edge refraction */}
        <div className="bg-crisp-shapes">
          <div className="bg-ring bg-ring-1" />
          <div className="bg-ring bg-ring-2" />
          <div className="bg-grid-lines" />
        </div>
        {/* Custom wallpaper layer if uploaded locally */}
        <div className="bg-custom-wallpaper" />
        <div className="bg-noise" />
        <div className="bg-vignette" />
      </div>

      {/* Mobile Top Bar & Animated Top-Corner Hamburger */}
      <MobileNavDrawer />

      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ paddingBottom: 80 }}>
          {pages[currentPage] || pages.today}
        </main>
      </div>

      {/* Floating Focus Timer widget */}
      <FocusTimer />

      {/* Interactive Glass Modals & Palettes */}
      <DailyReviewModal />
      <CommandPalette />
      <ShortcutsModal />
      <AppLock />

      {/* Overlays & Offline / PWA Helpers */}
      <OfflineIndicator />
      <BackupReminder />
      <InstallPrompt />
      <LevelUpPopup />
      <GoalCompletePopup />
      <ToastContainer />
      <FloatingXPContainer />

      {/* Mobile nav */}
      <nav className="mobile-nav">
        {MOBILE_NAV.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <PageContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
