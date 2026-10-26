import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

// ─── Toast System ─────────────────────────────────────────────────────────────
export function ToastContainer() {
  const { state, removeToast, undoDelete } = useApp();
  const toasts = state.ui.toastQueue || [];

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} onUndo={() => {
          if (toast.taskSnapshot) undoDelete(toast.taskSnapshot);
          removeToast(toast.id);
        }} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove, onUndo }) {
  useEffect(() => {
    const t = setTimeout(onRemove, 5000);
    return () => clearTimeout(t);
  }, [onRemove]);

  return (
    <div className="toast">
      <span>🗑 {toast.message}</span>
      {toast.type === 'undo' && toast.taskSnapshot && (
        <span className="toast-undo" onClick={onUndo}>Undo</span>
      )}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 8, fontSize: 14 }}>✕</button>
    </div>
  );
}

// ─── Floating XP Text ─────────────────────────────────────────────────────────
export function FloatingXPContainer() {
  const { state, removeFloatingXP } = useApp();
  const floaters = state.ui.floatingXP || [];

  return (
    <>
      {floaters.map(f => (
        <FloatingXP key={f.id} floater={f} onDone={() => removeFloatingXP(f.id)} />
      ))}
    </>
  );
}

function FloatingXP({ floater, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  const sign = floater.amount >= 0 ? '+' : '';
  const color = floater.amount >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)';

  return (
    <div
      className="floating-xp"
      style={{ left: `${floater.x}px`, top: `${floater.y}px`, color, textShadow: `0 0 12px ${color}` }}
    >
      {sign}{floater.amount} XP
    </div>
  );
}
