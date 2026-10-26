import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseSmartQuickAdd } from '../utils/nlp';
import { getCategoryColor, DEFAULT_CATEGORIES } from '../utils/constants';

export default function SmartQuickAdd() {
  const { addTask, setModal, state } = useApp();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);

  const allCategories = [...DEFAULT_CATEGORIES, ...(state.settings?.customCategories || [])];
  const targetDate = state.ui?.selectedDate;

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (val.trim().length > 2) {
      setParsed(parseSmartQuickAdd(val, targetDate, allCategories));
    } else {
      setParsed(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const taskData = parseSmartQuickAdd(text, targetDate, allCategories);
    await addTask(taskData);
    setText('');
    setParsed(null);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              id="smart-quick-add-input"
              className="form-input liquid-glass-panel"
              style={{
                width: '100%',
                padding: '12px 18px',
                paddingRight: 40,
                fontSize: 14,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              placeholder='Smart Add: e.g. "Study physics tomorrow 6pm !high #study ~45m" (Press Enter)'
              value={text}
              onChange={handleChange}
            />
            {text && (
              <button
                type="button"
                onClick={() => { setText(''); setParsed(null); }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '12px 20px', borderRadius: 16, whiteSpace: 'nowrap' }}
          >
            + Add Task
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '12px 16px', borderRadius: 16, whiteSpace: 'nowrap' }}
            onClick={() => setModal({ routineModalOpen: true })}
            title="Apply a pre-built routine template"
          >
            📑 Routines
          </button>
        </div>

        {/* Live parsed preview chips */}
        {parsed && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginTop: 8,
              padding: '6px 12px',
              borderRadius: 12,
              background: 'rgba(34, 211, 238, 0.06)',
              border: '1px solid rgba(34, 211, 238, 0.18)',
              fontSize: 11,
              flexWrap: 'wrap',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Auto-detected:</span>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.08)' }}>
              📝 {parsed.title || 'Untitled'}
            </span>
            <span className={`chip chip-priority-${parsed.priority.toLowerCase()}`}>
              ⚡ {parsed.priority}
            </span>
            <span
              className="chip chip-category"
              style={{
                borderColor: `${getCategoryColor(parsed.category)}55`,
                color: getCategoryColor(parsed.category),
              }}
            >
              🏷️ {parsed.category}
            </span>
            {parsed.startDate && parsed.endDate && parsed.startDate !== parsed.endDate ? (
              <span className="chip" style={{ background: 'rgba(167, 139, 250, 0.15)', color: 'var(--accent-violet)', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                📅 {parsed.startDate} → {parsed.endDate}
              </span>
            ) : (
              <span className="chip" style={{ background: 'rgba(255,255,255,0.08)' }}>
                📅 {parsed.date}
              </span>
            )}
            {parsed.time && (
              <span className="chip" style={{ background: 'rgba(255,255,255,0.08)' }}>
                ⏰ {parsed.time}
              </span>
            )}
            <span className="chip" style={{ background: 'rgba(255,255,255,0.08)' }}>
              ⏱️ ~{parsed.estimatedMinutes}m
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
