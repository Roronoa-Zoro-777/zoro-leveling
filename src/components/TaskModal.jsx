import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_CATEGORIES, PRIORITIES, REPEAT_OPTIONS, generateId, addDays, today, daysBetween } from '../utils/constants';

// ─── Task Modal (create/edit) ─────────────────────────────────────────────────
export default function TaskModal({ mode = 'create', task = null, onClose, defaultDate }) {
  const { addTask, updateTask, updateSettings, state } = useApp();
  const allCategories = [...DEFAULT_CATEGORIES, ...(state.settings?.customCategories || [])];

  const initialDate = task?.date || defaultDate || state.ui.selectedDate;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    category: task?.category || 'Personal',
    date: initialDate,
    startDate: task?.startDate || initialDate,
    endDate: task?.endDate || task?.startDate || initialDate,
    time: task?.time || '',
    estimatedMinutes: task?.estimatedMinutes || 30,
    repeat: task?.repeat || 'none',
    subtasks: task?.subtasks?.map(s => ({ ...s })) || [],
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      alert('End date cannot be earlier than start date.');
      return;
    }

    const categoryToUse = (isAddingCat && customCatInput.trim())
      ? customCatInput.trim()
      : (form.category || 'Personal');

    if (categoryToUse && !allCategories.includes(categoryToUse)) {
      updateSettings({
        ...state.settings,
        customCategories: [...(state.settings?.customCategories || []), categoryToUse]
      });
    }

    const sDate = form.startDate || form.date || defaultDate || today();
    const eDate = form.endDate || sDate;
    const finalEndDate = eDate >= sDate ? eDate : sDate;

    const taskPayload = {
      ...form,
      category: categoryToUse,
      estimatedMinutes: Number(form.estimatedMinutes) || 30,
      startDate: sDate,
      endDate: finalEndDate,
      date: sDate,
    };
    if (mode === 'create') {
      addTask(taskPayload);
    } else {
      updateTask({ ...task, ...taskPayload });
    }
    onClose();
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    set('subtasks', [...form.subtasks, { id: generateId(), title: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (id) => set('subtasks', form.subtasks.filter(s => s.id !== id));

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} onKeyDown={handleKeyDown}>
      <div className="modal-box">
        <div className="modal-title">
          <span>{mode === 'create' ? '✨ New Task' : '✏️ Edit Task'}</span>
          <button className="btn btn-sm btn-icon" onClick={onClose} title="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              ref={titleRef}
              className="form-input"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="What do you need to do?"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Add details, context or notes..."
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <div className="priority-selector">
              {PRIORITIES.map(p => (
                <button
                  key={p} type="button"
                  className={`priority-btn ${form.priority === p ? `active-${p.toLowerCase()}` : ''}`}
                  onClick={() => set('priority', p)}
                >
                  {p === 'Low' ? '🟢' : p === 'Medium' ? '🟡' : '🔴'} {p}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            {/* Category */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Category</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCat(!isAddingCat)}
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
                  {isAddingCat ? '← Choose Existing' : '+ New Category'}
                </button>
              </div>

              {isAddingCat ? (
                <input
                  type="text"
                  className="form-input"
                  placeholder="New category..."
                  value={customCatInput}
                  onChange={e => setCustomCatInput(e.target.value)}
                  autoFocus
                />
              ) : (
                <select
                  className="form-select"
                  value={form.category}
                  onChange={e => {
                    if (e.target.value === '__new__') setIsAddingCat(true);
                    else set('category', e.target.value);
                  }}
                >
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">✨ + Add New Category...</option>
                </select>
              )}
            </div>

            {/* Repeat */}
            <div className="form-group">
              <label className="form-label">Repeat</label>
              <select className="form-select" value={form.repeat} onChange={e => set('repeat', e.target.value)}>
                {REPEAT_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            {/* Start Date */}
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={e => {
                  const s = e.target.value;
                  set('startDate', s);
                  if (form.endDate < s) set('endDate', s);
                }}
              />
            </div>

            {/* End Date */}
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Quick Date Range Presets */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, marginTop: -6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="chip"
              style={{ fontSize: 11, cursor: 'pointer', padding: '3px 8px' }}
              onClick={() => set('endDate', form.startDate || today())}
            >
              📅 1 Day
            </button>
            <button
              type="button"
              className="chip"
              style={{ fontSize: 11, cursor: 'pointer', padding: '3px 8px' }}
              onClick={() => set('endDate', addDays(form.startDate || today(), 2))}
            >
              📆 3 Days
            </button>
            <button
              type="button"
              className="chip"
              style={{ fontSize: 11, cursor: 'pointer', padding: '3px 8px' }}
              onClick={() => set('endDate', addDays(form.startDate || today(), 6))}
            >
              📆 1 Week (7d)
            </button>
            <button
              type="button"
              className="chip"
              style={{ fontSize: 11, cursor: 'pointer', padding: '3px 8px', background: 'rgba(34, 211, 238, 0.15)', color: 'var(--accent-cyan)' }}
              onClick={() => set('endDate', addDays(form.startDate || today(), 29))}
            >
              🗓️ 1 Month (30d)
            </button>
            <div style={{ fontSize: 11, color: 'var(--accent-cyan)', width: '100%', marginTop: 4 }}>
              ℹ️ Active: {form.startDate || today()} → {form.endDate || form.startDate || today()} ({daysBetween(form.startDate || today(), form.endDate || form.startDate || today())} day{daysBetween(form.startDate || today(), form.endDate || form.startDate || today()) > 1 ? 's' : ''}) • Shown on Today page for every date in this range
            </div>
          </div>

          <div className="form-row">
            {/* Time */}
            <div className="form-group">
              <label className="form-label">Time (optional)</label>
              <input type="time" className="form-input" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">Est. Duration (minutes)</label>
              <input
                type="number"
                min="5"
                step="5"
                className="form-input"
                value={form.estimatedMinutes}
                onChange={e => set('estimatedMinutes', e.target.value)}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="form-group">
            <label className="form-label">Subtasks</label>
            {form.subtasks.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input className="form-input" style={{ flex: 1 }} value={s.title}
                  onChange={e => set('subtasks', form.subtasks.map(sub => sub.id === s.id ? { ...sub, title: e.target.value } : sub))}
                />
                <button type="button" className="btn btn-sm btn-danger btn-icon" onClick={() => removeSubtask(s.id)}>✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              />
              <button type="button" className="btn btn-sm" onClick={addSubtask}>+ Add</button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {mode === 'create' ? '✨ Create Task' : '💾 Save Changes'}
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 8 }}>
            Ctrl+Enter to save · Esc to cancel
          </div>
        </form>
      </div>
    </div>
  );
}
