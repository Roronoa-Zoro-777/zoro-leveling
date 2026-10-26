import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  today, addDays, daysBetween, GOAL_PRESETS, formatDate, parseDate
} from '../utils/constants';

const GOAL_COLORS = [
  '#22d3ee', // Cyan
  '#a78bfa', // Violet
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f43f5e', // Rose
  '#60a5fa', // Blue
];

export default function GoalsPage() {
  const { state, addGoal, updateGoal, deleteGoal, setActiveGoal } = useApp();
  const { goals, tasks } = state;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(addDays(today(), 30));
  const [targetType, setTargetType] = useState('tasks');
  const [targetValue, setTargetValue] = useState(100);
  const [color, setColor] = useState('#22d3ee');
  const [selectedPreset, setSelectedPreset] = useState(30);

  const openNewModal = () => {
    setEditingGoal(null);
    setName('');
    const t = today();
    setStartDate(t);
    setEndDate(addDays(t, 30));
    setTargetType('tasks');
    setTargetValue(100);
    setColor('#22d3ee');
    setSelectedPreset(30);
    setModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setStartDate(goal.startDate);
    setEndDate(goal.endDate);
    setTargetType(goal.targetType || 'tasks');
    setTargetValue(goal.targetValue || 100);
    setColor(goal.color || '#22d3ee');
    setSelectedPreset(null);
    setModalOpen(true);
  };

  const applyPreset = (days) => {
    setSelectedPreset(days);
    const start = startDate || today();
    setEndDate(addDays(start, days));
  };

  const [formError, setFormError] = useState('');

  const isOverlapping = useMemo(() => {
    return goals.some(g => {
      if (editingGoal && g.id === editingGoal.id) return false;
      return (
        (startDate >= g.startDate && startDate <= g.endDate) ||
        (endDate >= g.startDate && endDate <= g.endDate) ||
        (startDate <= g.startDate && endDate >= g.endDate)
      );
    });
  }, [goals, editingGoal, startDate, endDate]);

  const handleSave = () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('Please enter a goal period name.');
      return;
    }
    if (endDate < startDate) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    if (editingGoal) {
      updateGoal({
        ...editingGoal,
        name: name.trim(),
        startDate,
        endDate,
        targetType,
        targetValue: Number(targetValue),
        color,
      });
    } else {
      addGoal({
        name: name.trim(),
        startDate,
        endDate,
        targetType,
        targetValue: Number(targetValue),
        color,
      });
    }

    setModalOpen(false);
  };

  const extendGoal = (goal, extraDays) => {
    const newEnd = addDays(goal.endDate, extraDays);
    updateGoal({ ...goal, endDate: newEnd });
  };

  const t = today();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>🎯 Goal Periods</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Set bounded multi-week campaigns, track your execution velocity, and unlock epic XP rewards.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          + New Goal Period
        </button>
      </div>

      {/* Goal Cards Grid */}
      {goals.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Goal Periods Created</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Start a 14-day, 30-day, or custom quest period to stay disciplined and unlock milestone rewards!
          </div>
          <button className="btn btn-primary" onClick={openNewModal}>
            Create Your First Goal Period
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
          {goals.map(goal => {
            const isActive = goal.status === 'active';
            const isCompleted = goal.status === 'completed';
            const isMissed = goal.status === 'missed' || (!isCompleted && goal.endDate < t && !isActive);

            // Compute statistics
            const totalDays = daysBetween(goal.startDate, goal.endDate);
            const daysElapsed = Math.max(0, Math.min(totalDays, daysBetween(goal.startDate, t)));
            const daysRemaining = Math.max(0, daysBetween(t, goal.endDate) - 1);

            // Tasks done in period
            const tasksInPeriod = tasks.filter(task =>
              task.date >= goal.startDate && task.date <= goal.endDate
            );
            const completedCount = tasksInPeriod.filter(t => t.completed).length;
            const targetVal = goal.targetValue || 100;
            const progressPct = Math.min(100, Math.round((completedCount / targetVal) * 100));

            return (
              <div
                key={goal.id}
                className="glass-card liquid-glass-panel"
                style={{
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  borderRadius: 'var(--radius-lg)',
                  border: isActive
                    ? `1px solid ${goal.color}`
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isActive
                    ? `0 12px 36px rgba(0,0,0,0.6), 0 0 25px ${goal.color}33`
                    : '0 8px 32px rgba(0,0,0,0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Accent top stripe */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: goal.color,
                }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: goal.color, display: 'inline-block', boxShadow: `0 0 8px ${goal.color}` }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{goal.name}</h3>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {goal.startDate} → {goal.endDate} ({totalDays} days)
                    </div>
                  </div>

                  {/* Status pill */}
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: isActive ? `${goal.color}22` : (isCompleted ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)'),
                    border: `1px solid ${isActive ? goal.color : (isCompleted ? '#34d399' : 'rgba(255,255,255,0.15)')}`,
                    color: isActive ? goal.color : (isCompleted ? '#34d399' : 'var(--text-muted)'),
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {isActive ? '⚡ Active' : (isCompleted ? '✓ Completed' : (isMissed ? '✕ Missed' : 'Upcoming'))}
                  </span>
                </div>

                {/* Days Progress banner */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Progress: </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      Day {daysElapsed} of {totalDays}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Remaining: </span>
                    <span style={{ fontWeight: 700, color: daysRemaining <= 3 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                      {daysRemaining} days left
                    </span>
                  </div>
                </div>

                {/* Task progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Target: {goal.targetType === 'days' ? 'Active Days' : 'Tasks Completed'}
                    </span>
                    <span style={{ fontWeight: 700, color: goal.color }}>
                      {completedCount} / {targetVal} ({progressPct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: `linear-gradient(90deg, ${goal.color}, var(--accent-violet))`,
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                      boxShadow: `0 0 10px ${goal.color}88`,
                    }} />
                  </div>
                </div>

                {/* Card actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 6 }}>
                  {!isActive && (
                    <button
                      className="btn btn-sm"
                      onClick={() => setActiveGoal(goal.id)}
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      Set Active
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    {/* Extend date presets */}
                    <button
                      className="btn btn-sm"
                      onClick={() => extendGoal(goal, 7)}
                      title="Extend end date by 7 days"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      +7d
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => extendGoal(goal, 14)}
                      title="Extend end date by 14 days"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      +14d
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => openEditModal(goal)}
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm(`Delete goal "${goal.name}"? Task completion history will be kept.`)) {
                          deleteGoal(goal.id);
                        }
                      }}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="modal-glass-card liquid-glass-panel"
            onClick={e => e.stopPropagation()}
            style={{ width: '90%', maxWidth: 520, padding: 26, borderRadius: 'var(--radius-lg)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>
                {editingGoal ? 'Edit Goal Period' : 'New Goal Period'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div style={{ padding: '8px 12px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: 10, fontSize: 12, color: '#f43f5e' }}>
                  {formError}
                </div>
              )}
              {isOverlapping && (
                <div style={{ padding: '8px 12px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 10, fontSize: 11, color: '#fbbf24' }}>
                  ⚠️ Notice: This goal period dates overlap with another existing period.
                </div>
              )}

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Goal Period Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. 30-Day Discipline Challenge"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              {/* Duration Presets */}
              <div>
                <label className="form-label" style={{ marginBottom: 6 }}>Duration Presets</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {GOAL_PRESETS.map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => applyPreset(days)}
                      style={{
                        background: selectedPreset === days ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                        color: selectedPreset === days ? '#000000' : 'var(--text-primary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Start & End Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      setSelectedPreset(null);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={e => {
                      setEndDate(e.target.value);
                      setSelectedPreset(null);
                    }}
                  />
                </div>
              </div>

              {/* Target Type & Value */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Target Type</label>
                  <select
                    className="form-input"
                    value={targetType}
                    onChange={e => setTargetType(e.target.value)}
                  >
                    <option value="tasks">Tasks Completed</option>
                    <option value="days">Active Days Worked</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Goal Amount</label>
                  <input
                    type="number"
                    className="form-input"
                    value={targetValue}
                    min="1"
                    onChange={e => setTargetValue(e.target.value)}
                  />
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="form-label" style={{ marginBottom: 6 }}>Theme Accent Color</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {GOAL_COLORS.map(c => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c,
                        cursor: 'pointer',
                        border: color === c ? '3px solid white' : '2px solid transparent',
                        boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button className="btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  {editingGoal ? 'Update Goal Period' : 'Create Goal Period'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
