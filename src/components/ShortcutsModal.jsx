import React from 'react';
import { useApp } from '../context/AppContext';

export default function ShortcutsModal() {
  const { state, setModal } = useApp();

  if (!state.ui.shortcutsModalOpen) return null;

  const SHORTCUTS = [
    { key: 'Ctrl + K', desc: 'Command palette (jump anywhere, search, start timer)' },
    { key: 'N', desc: 'Focus smart quick-add task bar' },
    { key: '/', desc: 'Quick search' },
    { key: 'T', desc: 'Jump to Today\'s tasks' },
    { key: 'Ctrl + Z', desc: 'Undo recent task mutation' },
    { key: 'Ctrl + Shift + Z', desc: 'Redo recent task mutation' },
    { key: '?', desc: 'Open keyboard shortcuts cheat sheet' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        background: 'rgba(0,0,5,0.78)',
        backdropFilter: 'blur(36px) saturate(200%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={() => setModal({ shortcutsModalOpen: false })}
    >
      <div
        className="glass-card liquid-glass-panel"
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(34, 211, 238, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⌨️</span>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setModal({ shortcutsModalOpen: false })}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: 30,
              height: 30,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SHORTCUTS.map(s => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{s.desc}</span>
              <kbd style={{
                background: 'rgba(34, 211, 238, 0.15)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                color: 'var(--accent-cyan)',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
