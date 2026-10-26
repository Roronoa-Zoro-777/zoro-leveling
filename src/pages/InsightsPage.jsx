import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { today, formatDate, addDays, getCategoryColor, getRankTitle, getLevelFromXP } from '../utils/constants';

export default function InsightsPage() {
  const { state } = useApp();
  const cardRef = useRef(null);

  const { tasks, dayHistory, profile, focusSessions, dailyReviews } = state;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed);

  // ── Heuristic Heuristics (Rule-Based Offline Analysis) ───────────────────────
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCompletions = [0, 0, 0, 0, 0, 0, 0];
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];

  tasks.forEach(t => {
    const d = new Date(t.date);
    const day = d.getDay();
    dayTotals[day]++;
    if (t.completed) dayCompletions[day]++;
  });

  // Best productive day of week
  let bestDayIdx = 1; // default Monday
  let maxRate = 0;
  for (let i = 0; i < 7; i++) {
    if (dayTotals[i] > 0) {
      const rate = dayCompletions[i] / dayTotals[i];
      if (rate > maxRate) {
        maxRate = rate;
        bestDayIdx = i;
      }
    }
  }

  // Category completion rates
  const catStats = {};
  tasks.forEach(t => {
    const cat = t.category || 'General';
    if (!catStats[cat]) catStats[cat] = { total: 0, done: 0 };
    catStats[cat].total++;
    if (t.completed) catStats[cat].done++;
  });

  let mostSkippedCat = 'None';
  let lowestRate = 1;
  Object.entries(catStats).forEach(([cat, s]) => {
    if (s.total >= 3) {
      const r = s.done / s.total;
      if (r < lowestRate) {
        lowestRate = r;
        mostSkippedCat = cat;
      }
    }
  });

  // Early bird vs night owl analysis
  const morningDone = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const hour = new Date(t.completedAt).getHours();
    return hour < 12;
  }).length;
  const morningPct = completedTasks.length > 0 ? Math.round((morningDone / completedTasks.length) * 100) : 50;

  // Total focus minutes
  const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Weekly review calculations (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return formatDate(d);
  });

  const weekTasks = tasks.filter(t => last7Days.includes(t.date));
  const weekDone = weekTasks.filter(t => t.completed).length;
  const weekRate = weekTasks.length > 0 ? Math.round((weekDone / weekTasks.length) * 100) : 100;
  const weekXP = last7Days.reduce((acc, ds) => acc + (dayHistory[ds]?.xpEarned || 0), 0);

  // Export card to PNG via local Canvas
  const exportAsPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 640, 420);
    grad.addColorStop(0, '#00000a');
    grad.addColorStop(0.5, '#05051a');
    grad.addColorStop(1, '#020f18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 420);

    // Border glow
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 608, 388);

    // Header
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('ZoroLevel ⚡ Weekly Mastery Card', 40, 60);

    ctx.fillStyle = '#f0f0ff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`${weekRate}% Completion Rate`, 40, 115);

    ctx.fillStyle = '#8888aa';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Tasks Crushed: ${weekDone} / ${weekTasks.length}`, 40, 155);
    ctx.fillText(`XP Gained: +${weekXP} XP`, 40, 185);
    ctx.fillText(`Focus Logged: ${totalFocusMinutes} minutes`, 40, 215);
    ctx.fillText(`Peak Productive Day: ${DAY_NAMES[bestDayIdx]}s`, 40, 245);

    // Level badge
    const lvl = getLevelFromXP(profile.totalXP);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
    ctx.fillRect(40, 280, 220, 50);
    ctx.fillStyle = '#22d3ee';
    const rankInfo = getRankTitle(lvl);
    ctx.fillText(`Level ${lvl} • ${rankInfo?.title || rankInfo || 'Beginner'}`, 55, 312);

    ctx.fillStyle = '#555577';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Verified Offline Tracker • ${today()}`, 40, 375);

    // Download
    const a = document.createElement('a');
    a.download = `zorolevel-weekly-card-${today()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
            Local Smart Insights
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            100% private, rule-based heuristics computed directly from your offline device logs. Zero external AI.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            🖨️ Print / PDF
          </button>
          <button className="btn btn-primary" onClick={exportAsPNG}>
            📸 Export Share Card
          </button>
        </div>
      </div>

      {/* ── Key Insights Heuristics Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div className="glass-card liquid-glass-panel" style={{ borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Peak Energy Zone</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            You complete <b>{Math.round(maxRate * 100 || 80)}%</b> of tasks on <b>{DAY_NAMES[bestDayIdx]}s</b>. Schedule your heaviest strategic blocks here.
          </p>
        </div>

        <div className="glass-card liquid-glass-panel" style={{ borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌅</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Time-of-Day Rhythm</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <b>{morningPct}%</b> of your high-priority items are finished before 12:00 PM. Morning momentum is your superpower.
          </p>
        </div>

        <div className="glass-card liquid-glass-panel" style={{ borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏱️</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Deep Focus Engine</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            You have invested <b>{totalFocusMinutes} minutes</b> of locked-in Pomodoro focus sessions.
          </p>
        </div>

        <div className="glass-card liquid-glass-panel" style={{ borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Weak Spot Radar</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {mostSkippedCat !== 'None'
              ? `You defer ${mostSkippedCat} tasks most frequently. Consider breaking them into smaller 15m chunks.`
              : 'Consistent completion velocity across all life categories!'}
          </p>
        </div>
      </div>

      {/* ── Auto-Generated Weekly Review Card ─────────────────────────────── */}
      <div
        ref={cardRef}
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 28,
          padding: 28,
          border: '1px solid rgba(34, 211, 238, 0.3)',
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.10) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(139, 92, 246, 0.08) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="chip chip-category" style={{ fontSize: 11, marginBottom: 6 }}>
              OFFLINE EXECUTIVE SUMMARY
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              Weekly Review & Reflection
            </h2>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Last 7 Days (Computed automatically)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
          <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>COMPLETION</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-cyan)' }}>{weekRate}%</div>
          </div>

          <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TASKS DONE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>{weekDone}</div>
          </div>

          <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>XP EARNED</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-emerald)' }}>+{weekXP}</div>
          </div>

          <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TOP DAY</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-amber)' }}>{DAY_NAMES[bestDayIdx]}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)' }}>
            💡 Suggested Next Goal
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Target completing 5 focus sessions next week and keeping {mostSkippedCat !== 'None' ? mostSkippedCat : 'Health'} routines above 80%.
          </div>
        </div>
      </div>
    </div>
  );
}
