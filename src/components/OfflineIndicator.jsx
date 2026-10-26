/**
 * OfflineIndicator.jsx
 * Shows a small glass pill indicating offline/online status.
 * Also triggers backup reminder if 7 days have passed since last backup.
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Only show the offline badge when actually offline
  if (online) return null;

  return (
    <div style={{
      position: 'fixed', top: 12, right: 12, zIndex: 3000,
      background: 'rgba(10,10,30,0.92)',
      border: '1px solid rgba(251,191,36,0.4)',
      borderRadius: 20, padding: '5px 12px',
      backdropFilter: 'blur(12px)',
      fontSize: 11, fontWeight: 600,
      color: '#fbbf24',
      display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: '0 0 20px rgba(251,191,36,0.15)',
      animation: 'fadeIn 0.3s ease',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', boxShadow: '0 0 6px #fbbf24' }} />
      Offline — data saved locally
    </div>
  );
}

// ─── Backup Reminder Banner ───────────────────────────────────────────────────
export function BackupReminder() {
  const { state, exportData } = useApp();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const last = state.settings?.lastBackupReminder;
    if (!last) {
      // First time — wait a week, then remind
      const createdAgo = Date.now() - new Date(state.settings?.createdAt || Date.now()).getTime();
      if (createdAgo > 7 * 24 * 60 * 60 * 1000) setShow(true);
      return;
    }
    const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) setShow(true);
  }, [state.settings]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('zl-backup-dismissed-until', Date.now() + 7 * 86400000);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 3000, width: '90%', maxWidth: 440,
      background: 'rgba(10,10,30,0.95)',
      border: '1px solid rgba(34,211,238,0.35)',
      borderRadius: 14, padding: '12px 18px',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'toastSlide 0.3s ease',
    }}>
      <span style={{ fontSize: 22 }}>💾</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 12 }}>Back up your data</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          It's been a while — export a JSON backup to keep your data safe.
        </div>
      </div>
      <button
        onClick={() => { exportData(); dismiss(); }}
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.2))',
          border: '1px solid rgba(34,211,238,0.4)', borderRadius: 8,
          color: 'white', fontWeight: 700, fontSize: 11, padding: '5px 12px', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Export now
      </button>
      <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
    </div>
  );
}

// ─── Offline-ready indicator (shown briefly on load) ─────────────────────────
export function OfflineReadyBadge({ show, onDismiss }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDismiss, 3500);
      return () => clearTimeout(t);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 3000,
      background: 'rgba(10,10,30,0.92)',
      border: '1px solid rgba(52,211,153,0.4)',
      borderRadius: 20, padding: '7px 14px',
      backdropFilter: 'blur(12px)',
      fontSize: 11, fontWeight: 600,
      color: '#34d399',
      display: 'flex', alignItems: 'center', gap: 7,
      boxShadow: '0 0 20px rgba(52,211,153,0.15)',
      animation: 'toastSlide 0.3s ease',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', display: 'inline-block' }} />
      ✓ Offline ready
    </div>
  );
}
