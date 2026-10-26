/**
 * InstallPrompt.jsx
 * Shows a glass "Install App" banner when the browser fires beforeinstallprompt.
 * Dismissed state is saved to localStorage so it doesn't re-appear every refresh.
 */
import React, { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or installed
    if (localStorage.getItem('zl-install-dismissed')) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Hide if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setVisible(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setInstalled(true);
    }
    setPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('zl-install-dismissed', '1');
  };

  if (!visible || installed) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 4000, width: '90%', maxWidth: 400,
      background: 'rgba(10,10,30,0.95)',
      border: '1px solid rgba(167,139,250,0.35)',
      borderRadius: 18, padding: '14px 18px',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(167,139,250,0.1)',
      display: 'flex', alignItems: 'center', gap: 14,
      animation: 'toastSlide 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>📲</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Install ZoroLevel</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Add to your home screen for a native app experience — works offline!
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.35), rgba(34,211,238,0.25))',
            border: '1px solid rgba(167,139,250,0.5)', borderRadius: 9,
            color: 'white', fontWeight: 700, fontSize: 12, padding: '6px 14px', cursor: 'pointer',
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 11, cursor: 'pointer', textAlign: 'center',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
