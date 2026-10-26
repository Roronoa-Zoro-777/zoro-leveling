/**
 * DBLoadingScreen.jsx
 * Shown while IndexedDB hydrates on first load.
 * Prevents flash of empty content.
 */
import React from 'react';

export default function DBLoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-deep)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 9999,
    }}>
      {/* Orbs */}
      <div className="orb-container">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12, animation: 'pulse-glow 2s ease infinite' }}>⚡</div>
        <div style={{
          fontSize: 22, fontWeight: 800,
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>
          ZoroLevel
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your data…</div>

        {/* Progress bar */}
        <div style={{
          width: 180, height: 3, background: 'rgba(255,255,255,0.08)',
          borderRadius: 2, margin: '18px auto 0', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: '60%',
            background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))',
            borderRadius: 2, animation: 'loadingPulse 1.2s ease infinite',
          }} />
        </div>
        <style>{`
          @keyframes loadingPulse {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    </div>
  );
}
