import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getXPProgress, getRankTitle, ACHIEVEMENTS } from '../utils/constants';
import { XPLineChart } from '../components/Charts';

export default function ProfilePage() {
  const { state, resetAllData } = useApp();
  const [showResetModal, setShowResetModal] = useState(false);
  const { totalXP, unlockedAchievements } = state.profile;
  const { level, currentLevelXP, neededForNext } = getXPProgress(totalXP);
  const rank = getRankTitle(level);
  const xpPct = Math.round((currentLevelXP / neededForNext) * 100);
  const username = state.settings.username || 'Hero';

  const totalCompleted = state.tasks.filter(t => t.completed).length;
  const totalTasks = state.tasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-title">Profile</div>

      {/* Profile header */}
      <div className="profile-header glass-card liquid-glass-panel">
        <div className="profile-avatar">
          {username.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div className="profile-name">{username}</div>
          <div className="profile-rank" style={{ color: rank.color }}>★ {rank.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {totalCompleted} tasks completed · {totalXP.toLocaleString()} total XP
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 44, fontWeight: 900, background: `linear-gradient(135deg, white, ${rank.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
            {level}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Level</div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="chart-card glass-card liquid-glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#ffffff' }}>Level {level} → {level + 1}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{currentLevelXP.toLocaleString()} / {neededForNext.toLocaleString()} XP</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: rank.color }}>{xpPct}%</div>
        </div>
        <div className="xp-bar-wrap" style={{ height: 10 }}>
          <div className="xp-bar-fill" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${rank.color}, var(--accent-cyan))` }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {[
          { icon: '🌟', value: totalXP.toLocaleString(), label: 'Total XP' },
          { icon: '⚡', value: level, label: 'Current Level' },
          { icon: '✅', value: totalCompleted, label: 'Tasks Done' },
          { icon: '🏆', value: unlockedAchievements.length, label: 'Achievements' },
        ].map((s, i) => (
          <div key={i} className="stat-card glass-card liquid-glass-panel">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* XP over time */}
      <div className="chart-card glass-card liquid-glass-panel">
        <div className="chart-title">⚡ XP Earned Over Time</div>
        <XPLineChart />
      </div>

      {/* Recent achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="chart-card glass-card liquid-glass-panel">
          <div className="chart-title">🏆 Unlocked Achievements</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            {unlockedAchievements.map(id => {
              const ach = ACHIEVEMENTS.find(a => a.id === id);
              if (!ach) return null;
              return (
                <div
                  key={id}
                  className="glass-pill"
                  style={{
                    background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.18), rgba(34, 211, 238, 0.10))',
                    border: '1px solid rgba(167, 139, 250, 0.35)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '8px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{ach.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>{ach.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset Progress Section */}
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: 22,
          border: '1px solid rgba(244, 63, 94, 0.4)',
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(244, 63, 94, 0.04) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fecdd3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> Reset Progress to Level 1
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Permanently delete all tasks, history, and reset your level to start from zero.
          </div>
        </div>

        <button
          className="btn btn-danger"
          style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.3) 0%, rgba(225, 29, 72, 0.3) 100%)',
            borderColor: 'rgba(244, 63, 94, 0.65)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 12,
            padding: '8px 18px',
          }}
          onClick={() => setShowResetModal(true)}
        >
          🗑️ Delete & Reset to Level 1
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div
            className="modal-glass-card liquid-glass-panel"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 440,
              border: '1px solid rgba(244, 63, 94, 0.55)',
              boxShadow: 'var(--glass-inner-light), 0 20px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(244, 63, 94, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: '#fecdd3', margin: 0 }}>
                Reset to Level 1?
              </h2>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              This will permanently delete all tasks, subtasks, completion history, focus sessions, and reset your XP to 0:
            </p>

            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: 12,
              lineHeight: 1.8,
              color: '#ffe4e6',
              marginBottom: 18,
            }}>
              <div>❌ Delete all tasks & subtasks</div>
              <div>❌ Delete all completion logs & streaks</div>
              <div>❌ Clear all focus records & habits</div>
              <div>🔄 Reset Level to <strong>Level 1 (0 XP)</strong></div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.6) 0%, rgba(225, 29, 72, 0.6) 100%)',
                  borderColor: 'rgba(244, 63, 94, 0.9)',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
                onClick={async () => {
                  setShowResetModal(false);
                  await resetAllData();
                }}
              >
                Yes, Delete & Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
