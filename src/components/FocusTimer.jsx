import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { FOCUS_PRESETS } from '../utils/constants';

export default function FocusTimer() {
  const {
    state,
    dispatch,
    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    resetFocusTimer,
    completeFocusSession,
  } = useApp();

  const [expanded, setExpanded] = useState(false);
  const [customMin, setCustomMin] = useState(25);
  const [soundBellEnabled, setSoundBellEnabled] = useState(true);

  const timer = state.activeFocusTimer || {
    isRunning: false,
    durationMinutes: 25,
    secondsLeft: 25 * 60,
    taskTitle: '',
    mode: 'work',
  };

  useEffect(() => {
    if (timer.durationMinutes) {
      setCustomMin(timer.durationMinutes);
    }
  }, [timer.durationMinutes]);

  // Interval ticker when running — dispatches state updates so React re-renders the countdown
  useEffect(() => {
    let interval = null;
    if (timer.isRunning) {
      interval = setInterval(() => {
        if (timer.startTime) {
          const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
          const totalSecs = (timer.durationMinutes || 25) * 60;
          const remaining = totalSecs - elapsed;

          if (remaining <= 0) {
            clearInterval(interval);
            completeFocusSession();
          } else {
            // FIX BUG-001: dispatch to state instead of direct mutation
            dispatch({ type: 'SET_ACTIVE_FOCUS_TIMER', payload: { secondsLeft: remaining } });
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime, timer.durationMinutes, completeFocusSession, dispatch]);

  const mins = Math.floor(Math.max(0, timer.secondsLeft || 0) / 60);
  const secs = Math.max(0, timer.secondsLeft || 0) % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0,
    (((timer.durationMinutes * 60) - (timer.secondsLeft || 0)) / (timer.durationMinutes * 60)) * 100
  ));

  const applyCustomTime = (mins, autoStart = false) => {
    const m = Math.max(1, Math.min(360, parseInt(mins, 10) || 25));
    setCustomMin(m);
    if (autoStart || timer.isRunning) {
      startFocusTimer(m, timer.taskId, timer.taskTitle, timer.mode || 'work');
    } else {
      dispatch({
        type: 'SET_ACTIVE_FOCUS_TIMER',
        payload: {
          isRunning: false,
          durationMinutes: m,
          secondsLeft: m * 60,
          startTime: null,
        }
      });
    }
  };

  const addMinutesToTimer = (deltaMins) => {
    const addSecs = deltaMins * 60;
    const newSecsLeft = Math.max(10, (timer.secondsLeft || 0) + addSecs);
    const newTotalMins = Math.max(1, (timer.durationMinutes || 25) + deltaMins);
    dispatch({
      type: 'SET_ACTIVE_FOCUS_TIMER',
      payload: {
        secondsLeft: newSecsLeft,
        durationMinutes: newTotalMins,
        ...(timer.isRunning ? { startTime: Date.now() - ((newTotalMins * 60 - newSecsLeft) * 1000) } : {})
      }
    });
  };

  const requestNotif = () => {
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  return (
    <>
      {/* ── Minimized Floating Liquid Glass Widget ──────────────────────── */}
      <aside
        aria-label="Focus timer dock"
        className="glass-card liquid-glass-panel"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 80,
          borderRadius: 24,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          backdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(34, 211, 238, 0.25)',
          boxShadow: timer.isRunning
            ? '0 12px 36px rgba(0,0,0,0.7), 0 0 20px rgba(34, 211, 238, 0.25)'
            : '0 8px 30px rgba(0,0,0,0.5)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={() => {
          requestNotif();
          setExpanded(true);
        }}
        title="Open Glass Focus Timer"
      >
        <div style={{ position: 'relative', width: 28, height: 28 }}>
          <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3.5"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--accent-cyan)"
              strokeWidth="3.5"
              strokeDasharray={`${progressPercent}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
          }}>
            {timer.isRunning ? '⚡' : '⏱️'}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 0.5, color: 'var(--text-primary)' }}>
            {timeFormatted}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {timer.taskTitle || (timer.isRunning ? 'Focusing...' : 'Focus Timer')}
          </div>
        </div>

        {timer.isRunning ? (
          <button
            className="btn btn-sm"
            style={{ padding: '4px 8px', fontSize: 11, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={(e) => {
              e.stopPropagation();
              pauseFocusTimer();
            }}
          >
            ⏸️
          </button>
        ) : (
          <button
            className="btn btn-sm btn-primary"
            style={{ padding: '4px 8px', fontSize: 11 }}
            onClick={(e) => {
              e.stopPropagation();
              resumeFocusTimer();
            }}
          >
            ▶️
          </button>
        )}
      </aside>

      {/* ── Expanded Liquid Glass Focus Overlay ─────────────────────────── */}
      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Focus timer dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,5,0.75)',
            backdropFilter: 'blur(36px) saturate(210%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setExpanded(false)}
        >
          <div
            className="glass-card liquid-glass-panel"
            style={{
              width: '100%',
              maxWidth: 440,
              borderRadius: 32,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 0 50px rgba(34, 211, 238, 0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setExpanded(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: 32,
                height: 32,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>

            <span className="chip chip-category" style={{ marginBottom: 12, fontSize: 12 }}>
              {timer.mode === 'work' ? '⚡ DEEP WORK' : '☕ REST BREAK'} • +15 XP
            </span>

            <div style={{ width: '100%', maxWidth: 300, marginBottom: 4 }}>
              <input
                className="form-input"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: '6px 14px',
                  width: '100%',
                }}
                value={timer.taskTitle || ''}
                onChange={(e) => dispatch({ type: 'SET_ACTIVE_FOCUS_TIMER', payload: { taskTitle: e.target.value } })}
                placeholder="Session objective / task..."
              />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Stay in flow state. Audio bell & notification trigger on completion.
            </p>

            {/* Glowing circular progress indicator */}
            <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 28 }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="6"
                />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="var(--accent-cyan)"
                  strokeWidth="6"
                  strokeDasharray={`${(progressPercent / 100) * 276.4} 276.4`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease', filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.6))' }}
                />
              </svg>

              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 44, fontWeight: 900, fontFamily: 'monospace', letterSpacing: -1, textShadow: '0 0 20px rgba(34,211,238,0.4)' }}>
                  {timeFormatted}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {Math.round(progressPercent)}% completed
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center', marginBottom: 24 }}>
              {timer.isRunning ? (
                <button
                  className="btn"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', flex: 1, padding: '12px' }}
                  onClick={pauseFocusTimer}
                >
                  ⏸️ Pause
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: 14 }}
                  onClick={resumeFocusTimer}
                >
                  ▶️ Start Focus
                </button>
              )}

              <button
                className="btn btn-secondary"
                style={{ padding: '12px 18px' }}
                onClick={() => resetFocusTimer(timer.durationMinutes)}
                title="Reset timer"
              >
                🔄
              </button>

              <button
                className="btn"
                style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px 16px' }}
                onClick={completeFocusSession}
                title="Finish early & log session"
              >
                ✓ Finish
              </button>
            </div>

            {/* Custom Duration & Presets */}
            <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18 }}>
              {/* Presets Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  ⏱️ Set Focus Duration
                </span>
                <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  Current: {timer.durationMinutes || 25}m
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
                {[15, 25, 45, 60, 90].map(m => (
                  <button
                    key={m}
                    className={`btn btn-sm ${timer.durationMinutes === m ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: 12,
                      padding: '7px 4px',
                      textAlign: 'center',
                      fontWeight: 700,
                      borderRadius: 10,
                      ...(timer.durationMinutes === m ? { boxShadow: '0 0 12px rgba(34, 211, 238, 0.4)' } : {})
                    }}
                    onClick={() => applyCustomTime(m, false)}
                    title={`Set duration to ${m} minutes`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              {/* Custom Time Input & Stepper */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Custom:
                </span>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: 32, height: 32, padding: 0, borderRadius: 8, fontSize: 13, fontWeight: 800 }}
                  onClick={() => {
                    const next = Math.max(1, (parseInt(customMin, 10) || 25) - 5);
                    setCustomMin(next);
                  }}
                  title="Minus 5 minutes"
                >
                  -5
                </button>

                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1, minWidth: 60 }}>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    step="1"
                    className="form-input"
                    value={customMin}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomMin(val === '' ? '' : parseInt(val, 10) || 1);
                    }}
                    onBlur={() => {
                      if (!customMin || customMin < 1) setCustomMin(1);
                      else if (customMin > 360) setCustomMin(360);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCustomTime(customMin, false);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 28px 6px 10px',
                      fontSize: 14,
                      fontWeight: 700,
                      textAlign: 'center',
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.3)',
                    }}
                    placeholder="25"
                    aria-label="Set custom minutes"
                  />
                  <span style={{
                    position: 'absolute',
                    right: 8,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                    fontWeight: 600
                  }}>
                    m
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: 32, height: 32, padding: 0, borderRadius: 8, fontSize: 13, fontWeight: 800 }}
                  onClick={() => {
                    const next = Math.min(360, (parseInt(customMin, 10) || 25) + 5);
                    setCustomMin(next);
                  }}
                  title="Plus 5 minutes"
                >
                  +5
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 10, whiteSpace: 'nowrap' }}
                  onClick={() => applyCustomTime(customMin, false)}
                >
                  Set Time
                </button>
              </div>

              {/* In-Session Quick Extension Chips */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 2 }}>
                  Quick Nudge:
                </span>
                {[-5, 5, 10, 15].map(d => (
                  <button
                    key={d}
                    type="button"
                    className="chip"
                    style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      cursor: 'pointer',
                      background: d > 0 ? 'rgba(34, 211, 238, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      borderColor: d > 0 ? 'rgba(34, 211, 238, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                      color: d > 0 ? 'var(--accent-cyan)' : '#f87171',
                      borderRadius: 12,
                      fontWeight: 600,
                    }}
                    onClick={() => addMinutesToTimer(d)}
                    title={`${d > 0 ? 'Add' : 'Subtract'} ${Math.abs(d)} minutes`}
                  >
                    {d > 0 ? `+${d}m` : `${d}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
