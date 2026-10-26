import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getXPProgress, getRankTitle, today, isTaskScheduledForDate, isTaskCompletedOnDate } from '../utils/constants';

// ─── Sidebar Component ────────────────────────────────────────────────────────
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

export default function Sidebar() {
  const { state, setPage, setModal } = useApp();
  const { currentPage } = state.ui;
  const { totalXP, unlockedAchievements, streakFreezes, equippedFrame } = state.profile;
  const { level, currentLevelXP, neededForNext } = getXPProgress(totalXP);
  const rank = getRankTitle(level);
  const pct = Math.min(100, Math.round((currentLevelXP / neededForNext) * 100));

  const todayStr = today();
  const todayTasks = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const t of state.tasks) {
      if (!isTaskScheduledForDate(t, state.ui.selectedDate)) continue;
      const key = `${(t.title || '').trim().toLowerCase()}:::${(t.category || '').toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const isDone = isTaskCompletedOnDate(t, state.ui.selectedDate);
      list.push({ ...t, completed: isDone });
    }
    return list;
  }, [state.tasks, state.ui.selectedDate]);
  const pendingCount = todayTasks.filter(t => !t.completed).length;

  // Unclaimed quests badge
  const unclaimedQuestsCount = (state.quests || []).filter(q => q.completed && !q.claimed).length;

  return (
    <aside className="sidebar">
      {/* Logo & Command Palette Quick Trigger */}
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">ZoroLevel</span>
        </div>
        <button
          onClick={() => setModal({ commandPaletteOpen: true })}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '3px 8px',
            fontSize: 10,
            color: 'var(--accent-cyan)',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
          title="Open Command Palette (Ctrl+K)"
        >
          ⌘K
        </button>
      </div>

      {/* Level Badge with Frame */}
      <div className="level-badge-sidebar">
        <div className="level-badge-row">
          <div
            className="level-icon"
            style={{
              position: 'relative',
              borderRadius: '50%',
              padding: 2,
              border: equippedFrame === 'gold' ? '2px solid #fbbf24' : (equippedFrame === 'dragon' ? '2px solid #ef4444' : '2px solid transparent'),
            }}
          >
            🥋
          </div>
          <div className="level-info">
            <div className="level-num" style={{ color: rank.color }}>Level {level}</div>
            <div className="level-rank">{rank.title}</div>
          </div>
        </div>
        <div className="xp-bar-wrap">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="xp-bar-text">
          <span>{currentLevelXP.toLocaleString()} XP</span>
          <span>{neededForNext.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Navigation items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'today' && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
            {item.id === 'shop' && unclaimedQuestsCount > 0 && (
              <span className="nav-badge" style={{ background: 'var(--accent-emerald)', color: '#000', fontWeight: 800 }}>
                !
              </span>
            )}
            {item.id === 'achievements' && unlockedAchievements.length > 0 && (
              <span className="nav-badge">{unlockedAchievements.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Streak Shields & Total XP at bottom */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
          <span title="Active Streak Freezes">❄️ {streakFreezes || 0} Freezes</span>
        </div>
        <span>🌟 {totalXP.toLocaleString()} Total XP</span>
      </div>
    </aside>
  );
}
