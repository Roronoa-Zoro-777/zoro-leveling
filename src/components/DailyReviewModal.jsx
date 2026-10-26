import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { today } from '../utils/constants';

export default function DailyReviewModal() {
  const { state, saveDailyReviewAction, setModal } = useApp();
  const todayStr = today();
  const existingReview = state.dailyReviews[todayStr];

  const [mood, setMood] = useState(existingReview?.mood || 4);
  const [energy, setEnergy] = useState(existingReview?.energy || 4);
  const [reflection, setReflection] = useState(existingReview?.reflection || '');
  const [wentWell, setWentWell] = useState(existingReview?.wentWell || '');
  const [toImprove, setToImprove] = useState(existingReview?.toImprove || '');

  if (!state.ui.dailyReviewModalOpen) return null;

  const handleSave = async () => {
    await saveDailyReviewAction({
      date: todayStr,
      mood,
      energy,
      reflection,
      wentWell,
      toImprove,
    });
    setModal({ dailyReviewModalOpen: false });
  };

  const MOOD_EMOJIS = ['😫', '😕', '😐', '🙂', '🔥'];
  const ENERGY_LABELS = ['Exhausted', 'Low', 'Balanced', 'High Energy', 'Limitless'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daily review dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(0,0,5,0.78)',
        backdropFilter: 'blur(36px) saturate(200%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.25s ease',
      }}
      onClick={() => setModal({ dailyReviewModalOpen: false })}
    >
      <div
        className="glass-card liquid-glass-panel"
        style={{
          width: '100%',
          maxWidth: 500,
          borderRadius: 28,
          padding: 28,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(34, 211, 238, 0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span className="chip chip-category" style={{ fontSize: 11, marginBottom: 4 }}>
              🌙 DAILY REFLECTION • +10 XP
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              End of Day Review
            </h2>
          </div>
          <button
            onClick={() => setModal({ dailyReviewModalOpen: false })}
            style={{
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
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Take 60 seconds to calibrate your mind. All reflections stay strictly private on your device.
        </p>

        {/* Mood scale */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            How was your mood today?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((val, idx) => (
              <button
                key={val}
                className="btn"
                style={{
                  padding: '12px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  background: mood === val ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255,255,255,0.04)',
                  borderColor: mood === val ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)',
                }}
                onClick={() => setMood(val)}
              >
                <span style={{ fontSize: 24 }}>{MOOD_EMOJIS[idx]}</span>
                <span style={{ fontSize: 11, color: mood === val ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {val}/5
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy scale */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            <span>Energy Level</span>
            <span style={{ color: 'var(--accent-amber)', fontSize: 12 }}>⚡ {ENERGY_LABELS[energy - 1]}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                className="btn"
                style={{
                  padding: '8px',
                  background: energy >= val ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: energy >= val ? 'var(--accent-amber)' : 'rgba(255,255,255,0.08)',
                  color: energy >= val ? 'var(--accent-amber)' : 'var(--text-muted)',
                  fontSize: 14,
                  fontWeight: 700,
                }}
                onClick={() => setEnergy(val)}
              >
                ⚡ {val}
              </button>
            ))}
          </div>
        </div>

        {/* What went well */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            🏆 What went well today? (Wins & breakthroughs)
          </label>
          <input
            className="form-input"
            placeholder="e.g. Completed high priority task early, drank 3L water"
            value={wentWell}
            onChange={e => setWentWell(e.target.value)}
          />
        </div>

        {/* What to improve */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            🌱 What can be improved tomorrow?
          </label>
          <input
            className="form-input"
            placeholder="e.g. Less phone distractions after 9pm"
            value={toImprove}
            onChange={e => setToImprove(e.target.value)}
          />
        </div>

        {/* Reflection thoughts */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            💭 Freeform Reflection & Journal Note
          </label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Write down any insights or thoughts..."
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setModal({ dailyReviewModalOpen: false })}
          >
            Skip for now
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{ padding: '10px 24px' }}
          >
            Save Reflection (+10 XP)
          </button>
        </div>
      </div>
    </div>
  );
}
