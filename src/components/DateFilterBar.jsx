import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DATE_FILTER_OPTIONS, getDateFilterBounds, formatDate } from '../utils/constants';

export default function DateFilterBar() {
  const { state, setDateFilter, setCustomDateRange } = useApp();
  const { dateFilter, customDateRange } = state.ui;
  const activeGoal = state.goals.find(g => g.status === 'active');

  const [customStart, setCustomStart] = useState(customDateRange?.startDate || '');
  const [customEnd, setCustomEnd] = useState(customDateRange?.endDate || '');

  const bounds = getDateFilterBounds(dateFilter, customDateRange, activeGoal);

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    if (customEnd < customStart) {
      alert('End date cannot be earlier than start date');
      return;
    }
    setCustomDateRange({ startDate: customStart, endDate: customEnd });
  };

  return (
    <div className="date-filter-bar glass-card" style={{
      padding: '12px 18px',
      marginBottom: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      borderRadius: 'var(--radius-md)',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--glass-border-bright)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            Time Scope:
          </span>
          <span style={{
            fontSize: 12,
            padding: '3px 10px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.15))',
            border: '1px solid rgba(34,211,238,0.3)',
            color: 'var(--accent-cyan)',
            fontWeight: 600,
          }}>
            {bounds.start} → {bounds.end}
          </span>
        </div>

        {/* Preset filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DATE_FILTER_OPTIONS.map(opt => {
            const isActive = dateFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setDateFilter(opt.id)}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(167,139,250,0.3))'
                    : 'rgba(255,255,255,0.04)',
                  border: isActive
                    ? '1px solid rgba(34,211,238,0.6)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  padding: '5px 12px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 0 14px rgba(34,211,238,0.25)' : 'none',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom date range inputs when 'custom' is active */}
      {dateFilter === 'custom' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Custom Range:</span>
          <input
            type="date"
            className="form-input"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            className="form-input"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={handleApplyCustom}
            style={{ padding: '5px 14px' }}
          >
            Apply Range
          </button>
        </div>
      )}
    </div>
  );
}
