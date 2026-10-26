import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { today, formatDate, addDays, getCategoryColor, DEFAULT_CATEGORIES } from '../utils/constants';

export default function HabitsPage() {
  const { state, addHabit, deleteHabit, toggleHabitLog, updateSettings } = useApp();
  const allCategories = [...DEFAULT_CATEGORIES, ...(state.settings?.customCategories || [])];

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Health');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [newFreq, setNewFreq] = useState('daily');
  const [newIcon, setNewIcon] = useState('💧');
  const [newColor, setNewColor] = useState('#22d3ee');

  const todayStr = today();

  // Generate last 30 days for dot grid
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return formatDate(d);
  });

  // Calculate habit stats (current streak, best streak, 30-day completion rate)
  const computeHabitStats = (habitId) => {
    const logs = state.habitLogs.filter(l => l.habitId === habitId && l.completed);
    const completedDateSet = new Set(logs.map(l => l.date));

    // Current streak
    let currentStreak = 0;
    const d = new Date();
    while (true) {
      const ds = formatDate(d);
      if (completedDateSet.has(ds)) {
        currentStreak++;
      } else if (ds !== todayStr) {
        break;
      }
      d.setDate(d.getDate() - 1);
      if (currentStreak > 365) break;
    }

    // Best streak
    const sortedDates = Array.from(completedDateSet).sort();
    let bestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const ds of sortedDates) {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diff = (new Date(ds) - new Date(prevDate)) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) tempStreak++;
        else tempStreak = 1;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
      prevDate = ds;
    }

    // 30-day rate
    const done30 = last30Days.filter(ds => completedDateSet.has(ds)).length;
    const rate30 = Math.round((done30 / 30) * 100);

    return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak), rate30, completedDateSet };
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const categoryToUse = (isAddingNewCat && customCategoryInput.trim())
      ? customCategoryInput.trim()
      : (newCategory || 'Health');

    // If new category not in allCategories, persist it to customCategories
    if (categoryToUse && !allCategories.includes(categoryToUse)) {
      updateSettings({
        ...state.settings,
        customCategories: [...(state.settings?.customCategories || []), categoryToUse]
      });
    }

    await addHabit({
      title: newTitle.trim(),
      category: categoryToUse,
      frequency: newFreq,
      icon: newIcon,
      color: newColor || getCategoryColor(categoryToUse),
    });

    setNewTitle('');
    setCustomCategoryInput('');
    setIsAddingNewCat(false);
    setShowAddModal(false);
  };

  const ICONS = ['💧', '📖', '🏃', '🧘', '🥗', '⚡', '💻', '🎯', '🛌'];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
            Habit Discipline Engine
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            One-tap check-in, 30-day dot grids, and streaks that forge unbreakable routines (+5 XP each).
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '10px 20px', borderRadius: 16 }}
          onClick={() => setShowAddModal(true)}
        >
          + New Habit
        </button>
      </div>

      {/* Habit List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {state.habits.length === 0 ? (
          <div className="glass-card liquid-glass-panel" style={{ padding: 48, textAlign: 'center', borderRadius: 24 }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>🌱</span>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Habits Established Yet</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Small daily actions compound into legendary mastery. Start with drinking water or 15m reading.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              Create Your First Habit
            </button>
          </div>
        ) : (
          state.habits.map(habit => {
            const { currentStreak, bestStreak, rate30, completedDateSet } = computeHabitStats(habit.id);
            const isDoneToday = completedDateSet.has(todayStr);

            return (
              <div
                key={habit.id}
                className="glass-card liquid-glass-panel"
                style={{
                  borderRadius: 24,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  borderLeft: `4px solid ${habit.color || 'var(--accent-cyan)'}`,
                }}
              >
                {/* Top Row: Info & Check-in */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: `${habit.color || 'var(--accent-cyan)'}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        border: `1px solid ${habit.color || 'var(--accent-cyan)'}44`,
                      }}
                    >
                      {habit.icon || '✨'}
                    </div>

                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {habit.title}
                      </div>
                        <span
                          className="chip"
                          style={{
                            fontSize: 10,
                            padding: '3px 10px',
                            borderRadius: 10,
                            fontWeight: 700,
                            color: getCategoryColor(habit.category) || '#22d3ee',
                            background: `${getCategoryColor(habit.category) || '#22d3ee'}22`,
                            border: `1px solid ${getCategoryColor(habit.category) || '#22d3ee'}55`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          🏷️ {habit.category || 'General'}
                        </span>
                        <span style={{ fontSize: 11, color: '#ffffff', opacity: 0.85 }}>
                          🔄 {habit.frequency}
                        </span>
                    </div>
                  </div>

                  {/* Streaks & Today Check-in Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-amber)' }}>
                        🔥 {currentStreak}d streak
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        Best: {bestStreak}d • 30d: {rate30}%
                      </div>
                    </div>

                    <button
                      className="btn"
                      style={{
                        padding: '10px 18px',
                        borderRadius: 16,
                        background: isDoneToday
                          ? 'rgba(52, 211, 153, 0.25)'
                          : 'rgba(255,255,255,0.05)',
                        border: isDoneToday
                          ? '1px solid var(--accent-emerald)'
                          : '1px solid rgba(255,255,255,0.15)',
                        color: isDoneToday ? 'var(--accent-emerald)' : 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: isDoneToday ? '0 0 16px rgba(52, 211, 153, 0.3)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                      onClick={() => toggleHabitLog(habit.id, todayStr)}
                    >
                      <span>{isDoneToday ? '✓ Done' : 'Check In'}</span>
                      <span style={{ fontSize: 11, opacity: 0.8 }}>+5 XP</span>
                    </button>

                    <button
                      onClick={() => deleteHabit(habit.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
                      title="Delete habit"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 30-Day Dot Grid */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>30-Day Consistency Grid</span>
                    <span>Today</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 4 }}>
                    {last30Days.map(ds => {
                      const completed = completedDateSet.has(ds);
                      const isToday = ds === todayStr;

                      return (
                        <div
                          key={ds}
                          title={`${ds}: ${completed ? 'Completed ✓' : 'Missed'}`}
                          onClick={() => toggleHabitLog(habit.id, ds)}
                          style={{
                            height: 24,
                            borderRadius: 6,
                            background: completed
                              ? (habit.color || 'var(--accent-cyan)')
                              : 'rgba(255,255,255,0.06)',
                            border: isToday ? '1px solid #ffffff' : 'none',
                            cursor: 'pointer',
                            opacity: completed ? 0.9 : 0.4,
                            transition: 'all 0.15s ease',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Add Habit Modal ────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create habit dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: 'rgba(5, 8, 22, 0.60)',
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-card liquid-glass-panel"
            style={{
              width: '100%',
              maxWidth: 460,
              borderRadius: 28,
              padding: 28,
              boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(34, 211, 238, 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Create Recurring Habit</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHabit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                  Habit Title
                </label>
                <input
                  className="form-input"
                  placeholder="e.g. Drink 2L water, Read 20 pages"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ color: '#ffffff' }}
                  autoFocus
                />
              </div>

              {/* Icon selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                  Icon
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ICONS.map(icon => (
                    <button
                      type="button"
                      key={icon}
                      className="btn"
                      style={{
                        padding: '8px',
                        fontSize: 18,
                        background: newIcon === icon ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255,255,255,0.04)',
                        borderColor: newIcon === icon ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                      }}
                      onClick={() => setNewIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Frequency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-cyan)',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 700,
                        padding: 0,
                      }}
                    >
                      {isAddingNewCat ? '← Choose Existing' : '+ New Category'}
                    </button>
                  </div>

                  {isAddingNewCat ? (
                    <input
                      className="form-input"
                      placeholder="e.g. Fitness, Meditation..."
                      value={customCategoryInput}
                      onChange={e => setCustomCategoryInput(e.target.value)}
                      style={{ color: '#ffffff', background: 'rgba(0,0,0,0.35)', fontWeight: 600 }}
                      autoFocus
                    />
                  ) : (
                    <select
                      className="form-select"
                      value={newCategory}
                      onChange={e => {
                        if (e.target.value === '__new__') {
                          setIsAddingNewCat(true);
                        } else {
                          setNewCategory(e.target.value);
                        }
                      }}
                      style={{ color: '#ffffff', background: 'rgba(0,0,0,0.35)', fontWeight: 600 }}
                    >
                      {allCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__new__">✨ + Add New Category...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                    Schedule
                  </label>
                  <select
                    className="form-select"
                    value={newFreq}
                    onChange={e => setNewFreq(e.target.value)}
                    style={{ color: '#ffffff', background: 'rgba(0,0,0,0.35)', fontWeight: 600 }}
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="custom">X Times / Week</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
