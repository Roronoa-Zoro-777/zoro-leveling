import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';

export default function GoalCompletePopup() {
  const { state, closeGoalPopup } = useApp();
  const popup = state.ui.goalCompletePopup;

  useEffect(() => {
    if (popup) {
      // Fire celebratory confetti cannons!
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f43f5e'],
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [popup]);

  if (!popup) return null;

  const { goal, tasksCompleted, targetValue, bonusXP } = popup;

  return (
    <div className="modal-backdrop" onClick={closeGoalPopup} style={{ zIndex: 5000 }}>
      <div
        className="glass-card liquid-glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 480,
          padding: 32,
          textAlign: 'center',
          position: 'relative',
          borderRadius: 24,
          background: 'rgba(10, 10, 24, 0.92)',
          border: '1px solid rgba(34, 211, 238, 0.5)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(34, 211, 238, 0.25)',
          animation: 'modalSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.6))' }}>
          🏆
        </div>

        <div style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--accent-cyan)',
          marginBottom: 6,
        }}>
          Goal Period Conquered!
        </div>

        <h2 style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 12,
          background: 'linear-gradient(135deg, #ffffff, var(--accent-cyan), var(--accent-violet))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {goal?.name || 'Milestone Accomplished'}
        </h2>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          You remained dedicated and completed your quest objectives before the deadline!
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 24,
          padding: 16,
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tasks Accomplished</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-emerald)' }}>
              {tasksCompleted} / {targetValue}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bonus Rewarded</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-amber)' }}>
              +{bonusXP || 200} XP
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={closeGoalPopup}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: 15,
            fontWeight: 800,
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
            boxShadow: '0 0 25px rgba(34, 211, 238, 0.4)',
          }}
        >
          Claim Reward & Continue ⚡
        </button>
      </div>
    </div>
  );
}
