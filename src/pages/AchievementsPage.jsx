import React from 'react';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS, today, formatDate } from '../utils/constants';

export default function AchievementsPage() {
  const { state } = useApp();
  const { unlockedAchievements } = state.profile;

  // Compute stats for achievement check display
  const totalCompleted = state.tasks.filter(t => t.completed).length;

  // Streak calculation
  const todayStr = today();
  const byDate = {};
  state.tasks.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = { total: 0, completed: 0 };
    byDate[t.date].total++;
    if (t.completed) byDate[t.date].completed++;
  });
  let currentStreak = 0;
  let d = new Date();
  while (true) {
    const ds = formatDate(d);
    const day = byDate[ds];
    if (day && day.completed > 0) { currentStreak++; d.setDate(d.getDate() - 1); }
    else if (ds === todayStr) { d.setDate(d.getDate() - 1); continue; }
    else break;
    if (currentStreak > 365) break;
  }

  const stats = {
    totalCompleted,
    currentStreak,
    hasPerfectDay: state.profile.hasPerfectDay || false,
    hasEarlyBird: state.profile.hasEarlyBird || false,
    hasComeback: state.profile.hasComeback || false,
    daysWorked: Object.values(byDate).filter(d => d.completed > 0).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <div className="page-title" style={{ color: '#ffffff' }}>Achievements</div>
          <div className="page-subtitle" style={{ color: '#ffffff', opacity: 0.9 }}>{unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="chart-card glass-card liquid-glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: '#ffffff' }}>
          <span style={{ fontWeight: 600, color: '#ffffff' }}>Achievement Mastery</span>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>{unlockedAchievements.length} / {ACHIEVEMENTS.length} ({Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%)</span>
        </div>
        <div className="xp-bar-wrap" style={{ height: 10 }}>
          <div className="xp-bar-fill" style={{ width: `${Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%`, background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-emerald))' }} />
        </div>
      </div>

      <div className="achievements-grid">
        {ACHIEVEMENTS.map(ach => {
          const unlocked = unlockedAchievements.includes(ach.id);
          const progress = getAchievementProgress(ach.id, stats);

          return (
            <div key={ach.id} className={`achievement-card glass-card liquid-glass-panel ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>{ach.icon}</div>
              <div className="achievement-title" style={{ color: '#ffffff' }}>{ach.title}</div>
              <div className="achievement-desc" style={{ color: '#ffffff' }}>{ach.description}</div>
              {!unlocked && progress && (
                <div style={{ marginTop: 10 }}>
                  <div className="xp-bar-wrap" style={{ height: 5 }}>
                    <div className="xp-bar-fill" style={{ width: `${progress.pct}%`, background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-cyan))' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#ffffff', marginTop: 4 }}>
                    <span style={{ color: '#ffffff', opacity: 0.85 }}>In progress</span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{progress.current}/{progress.target}</span>
                  </div>
                </div>
              )}
              {unlocked && (
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>✓</span> Unlocked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getAchievementProgress(id, stats) {
  switch (id) {
    case 'first_task': return { pct: Math.min(100, (stats.totalCompleted / 1) * 100), current: stats.totalCompleted, target: 1 };
    case 'ten_tasks': return { pct: Math.min(100, (stats.totalCompleted / 10) * 100), current: stats.totalCompleted, target: 10 };
    case 'hundred_tasks': return { pct: Math.min(100, (stats.totalCompleted / 100) * 100), current: stats.totalCompleted, target: 100 };
    case 'streak_3': return { pct: Math.min(100, (stats.currentStreak / 3) * 100), current: stats.currentStreak, target: 3 };
    case 'streak_7': return { pct: Math.min(100, (stats.currentStreak / 7) * 100), current: stats.currentStreak, target: 7 };
    case 'streak_30': return { pct: Math.min(100, (stats.currentStreak / 30) * 100), current: stats.currentStreak, target: 30 };
    default: return null;
  }
}
