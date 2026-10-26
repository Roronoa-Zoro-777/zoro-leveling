import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getRankTitle } from '../utils/constants';
import confetti from 'canvas-confetti';

// ─── Level-Up Popup ───────────────────────────────────────────────────────────
export default function LevelUpPopup() {
  const { state, closeLevelUp } = useApp();
  const { levelUpPopup } = state.ui;
  const fired = useRef(false);

  useEffect(() => {
    if (levelUpPopup && !fired.current) {
      fired.current = true;
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) { clearInterval(interval); return; }
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#a78bfa', '#22d3ee', '#f0abfc'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#a78bfa', '#22d3ee', '#34d399'],
        });
      }, 100);
    }
    return () => { fired.current = false; };
  }, [levelUpPopup]);

  if (!levelUpPopup) return null;

  const { level, rank } = levelUpPopup;

  return (
    <div className="levelup-overlay" onClick={closeLevelUp}>
      <div className="levelup-box" onClick={e => e.stopPropagation()}>
        <div className="levelup-glow" />
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 2 }}>
          Level Up!
        </div>
        <div className="levelup-level">{level}</div>
        <div className="levelup-title">You reached Level {level}!</div>
        <div className="levelup-rank" style={{ color: rank?.color || 'var(--accent-violet)' }}>
          ★ {rank?.title || 'Hero'} ★
        </div>
        <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '20px 0', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: '100%',
            background: `linear-gradient(90deg, ${rank?.color || 'var(--accent-violet)'}, var(--accent-cyan))`,
            borderRadius: 2, animation: 'xpFill 1s ease forwards',
            boxShadow: `0 0 12px ${rank?.color || 'var(--accent-violet)'}`,
          }} />
        </div>
        <style>{`@keyframes xpFill { from { width: 0; } to { width: 100%; } }`}</style>
        <button className="btn btn-primary" onClick={closeLevelUp} style={{ marginTop: 8 }}>
          🚀 Keep Going!
        </button>
      </div>
    </div>
  );
}
