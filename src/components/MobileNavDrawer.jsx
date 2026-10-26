import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getXPProgress, getRankTitle, today, isTaskScheduledForDate, isTaskCompletedOnDate } from '../utils/constants';

const NAV_ITEMS = [
  { id: 'today', icon: '📋', label: 'Today' },
  { id: 'habits', icon: '✨', label: 'Habits' },
  { id: 'goals', icon: '🎯', label: 'Goals' },
  { id: 'shop', icon: '💎', label: 'Quests & Shop' },
  { id: 'insights', icon: '💡', label: 'Insights' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'history', icon: '📅', label: 'History' },
  { id: 'achievements', icon: '🏆', label: 'Achievements' },
  { id: 'profile', icon: '👤', label: 'Profile' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
  { id: 'download', icon: '📥', label: 'Download' },
];

export default function MobileNavDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { state, setPage, setModal } = useApp();
  const { currentPage } = state.ui;
  const { totalXP, unlockedAchievements, streakFreezes, equippedFrame } = state.profile;
  const { level, currentLevelXP, neededForNext } = getXPProgress(totalXP);
  const rank = getRankTitle(level);
  const pct = Math.min(100, Math.round((currentLevelXP / neededForNext) * 100));

  // Compute pending tasks badge
  const pendingCount = useMemo(() => {
    const seen = new Set();
    let count = 0;
    for (const t of state.tasks) {
      if (!isTaskScheduledForDate(t, state.ui.selectedDate)) continue;
      const key = `${(t.title || '').trim().toLowerCase()}:::${(t.category || '').toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!isTaskCompletedOnDate(t, state.ui.selectedDate)) {
        count++;
      }
    }
    return count;
  }, [state.tasks, state.ui.selectedDate]);

  const unclaimedQuestsCount = (state.quests || []).filter(q => q.completed && !q.claimed).length;

  // Lock body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNavClick = (id) => {
    setPage(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* ── Top Corner Floating Mobile Header with Animated Hamburger ── */}
      <header className="mobile-top-bar" aria-label="Mobile Navigation Bar">
        <div className="mobile-top-bar-brand" onClick={() => handleNavClick('today')}>
          <span className="brand-bolt">⚡</span>
          <span className="brand-title">ZoroLevel</span>
          <span className="brand-level-pill" style={{ borderColor: rank.color, color: rank.color }}>
            Lv.{level}
          </span>
        </div>

        {/* Animated Hamburger Button in Top Corner */}
        <button
          type="button"
          className={`mobile-hamburger-btn ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(prev => !prev)}
          aria-label={isOpen ? 'Close menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          title={isOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="hamburger-line line-top" />
          <span className="hamburger-line line-middle" />
          <span className="hamburger-line line-bottom" />
        </button>
      </header>

      {/* ── Backdrop Overlay ── */}
      <div
        className={`mobile-drawer-backdrop ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ── Slide-in Liquid Glass Drawer ── */}
      <nav
        className={`mobile-drawer-panel ${isOpen ? 'open' : ''}`}
        aria-label="Mobile Full Menu"
        aria-hidden={!isOpen}
      >
        <div className="mobile-drawer-header">
          <div className="mobile-user-profile">
            <div
              className="mobile-avatar"
              style={{
                borderColor: equippedFrame === 'gold' ? '#fbbf24' : (equippedFrame === 'dragon' ? '#ef4444' : 'rgba(255,255,255,0.2)'),
              }}
            >
              🥋
            </div>
            <div className="mobile-user-meta">
              <div className="mobile-user-level" style={{ color: rank.color }}>
                Level {level} · {rank.title}
              </div>
              <div className="mobile-user-xp">
                {currentLevelXP.toLocaleString()} / {neededForNext.toLocaleString()} XP
              </div>
            </div>
          </div>

          <div className="mobile-xp-bar-wrap">
            <div className="mobile-xp-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, var(--accent-cyan), ${rank.color})` }} />
          </div>
        </div>

        {/* Quick Actions Row inside Drawer */}
        <div className="mobile-drawer-quick-actions">
          <button
            type="button"
            className="mobile-quick-action-btn"
            onClick={() => {
              setIsOpen(false);
              setModal({ commandPaletteOpen: true });
            }}
          >
            <span className="quick-action-icon">⌘</span>
            <span>Search / ⌘K</span>
          </button>

          <button
            type="button"
            className="mobile-quick-action-btn"
            onClick={() => {
              setIsOpen(false);
              setModal({ shortcutsOpen: true });
            }}
          >
            <span className="quick-action-icon">⌨️</span>
            <span>Shortcuts</span>
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="mobile-drawer-nav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="mobile-drawer-item-icon">{item.icon}</span>
                <span className="mobile-drawer-item-label">{item.label}</span>

                {item.id === 'today' && pendingCount > 0 && (
                  <span className="mobile-item-badge badge-pending">{pendingCount}</span>
                )}
                {item.id === 'shop' && unclaimedQuestsCount > 0 && (
                  <span className="mobile-item-badge badge-alert">!</span>
                )}
                {item.id === 'achievements' && unlockedAchievements.length > 0 && (
                  <span className="mobile-item-badge badge-info">{unlockedAchievements.length}</span>
                )}
                <span className="mobile-drawer-item-chevron">›</span>
              </button>
            );
          })}
        </div>

        {/* Footer info inside Drawer */}
        <div className="mobile-drawer-footer">
          <div className="mobile-footer-stats">
            <span>❄️ {streakFreezes || 0} Freezes</span>
            <span>·</span>
            <span>🌟 {totalXP.toLocaleString()} Total XP</span>
          </div>
          <div className="mobile-footer-status">
            <span className="status-dot-pulse" />
            <span>100% Offline · Local Storage</span>
          </div>
        </div>
      </nav>
    </>
  );
}
