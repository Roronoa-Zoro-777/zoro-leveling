import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { hashPin } from '../utils/crypto';

export default function AppLock() {
  const { state, setAppLocked } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inactivityTimerRef = useRef(null);

  const isLocked = state.appLockLocked;
  const pinHash = state.settings.appLockPinHash;
  const isEnabled = state.settings.appLockEnabled;

  // Inactivity auto-lock
  useEffect(() => {
    if (!isEnabled || !pinHash) return;

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      const minutes = state.settings.autoLockMinutes || 5;
      inactivityTimerRef.current = setTimeout(() => {
        setAppLocked(true);
      }, minutes * 60 * 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isEnabled, pinHash, state.settings.autoLockMinutes, setAppLocked]);

  if (!isLocked || !isEnabled || !pinHash) return null;

  const handleDigit = async (digit) => {
    setErrorMsg('');
    const nextPin = pinInput + digit;
    setPinInput(nextPin);

    if (nextPin.length === 4) {
      const hashed = await hashPin(nextPin);
      if (hashed === pinHash) {
        setPinInput('');
        setAppLocked(false);
      } else {
        setErrorMsg('Incorrect PIN');
        setTimeout(() => setPinInput(''), 400);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleBiometric = () => {
    setAppLocked(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App lock screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,5,0.92)',
        backdropFilter: 'blur(48px) saturate(220%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass-card liquid-glass-panel"
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 32,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 30px 100px rgba(0,0,0,0.95), 0 0 60px rgba(34, 211, 238, 0.2)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>ZoroLevel Protected</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
          Enter your 4-digit PIN to access your offline workspace
        </p>

        {/* PIN dots */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: pinInput.length > i ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                boxShadow: pinInput.length > i ? '0 0 12px var(--accent-cyan)' : 'none',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={{ color: '#f87171', fontSize: 12, marginBottom: 16, animation: 'shake 0.3s ease' }}>
            {errorMsg}
          </div>
        )}

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 260 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              className="btn"
              style={{
                height: 52,
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.1)',
              }}
              onClick={() => handleDigit(String(num))}
            >
              {num}
            </button>
          ))}
          <button
            className="btn"
            style={{ height: 52, fontSize: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)' }}
            onClick={handleBiometric}
            title="Biometric unlock"
          >
            🛡️
          </button>
          <button
            className="btn"
            style={{
              height: 52,
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
            onClick={() => handleDigit('0')}
          >
            0
          </button>
          <button
            className="btn"
            style={{ height: 52, fontSize: 18, borderRadius: 16, background: 'rgba(255,255,255,0.03)' }}
            onClick={handleBackspace}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
