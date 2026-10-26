import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  today, formatDate, parseDate, addDays, nextDay, getDateFilterBounds,
  DEFAULT_CATEGORIES, PRIORITIES, getCategoryColor, generateId, isTaskScheduledForDate, isTaskCompletedOnDate
} from '../utils/constants';
import DateFilterBar from '../components/DateFilterBar';
import { ProgressRing } from '../components/Charts';
import TaskModal from '../components/TaskModal';

export default function HistoryPage() {
  const { state, addTask, updateTask, toggleTask, setDate, setPage } = useApp();
  const { dateFilter, customDateRange } = state.ui;
  const activeGoal = state.goals.find(g => g.status === 'active');

  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'calendar' | 'table'
  const [selectedDay, setSelectedDay] = useState(null);

  // Filters inside History
  const [searchQ, setSearchQ] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterPrio, setFilterPrio] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGoal, setFilterGoal] = useState('all');

  // Table sorting
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Calendar month state
  const [calDate, setCalDate] = useState(new Date());

  // Task edit / backfill modal
  const [backfillTitle, setBackfillTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  // Compute active bounds from global date filter
  const bounds = getDateFilterBounds(dateFilter, customDateRange, activeGoal);

  // Filter tasks based on global date filter & goal filter
  const tasksInScope = useMemo(() => {
    return state.tasks.filter(t => {
      const taskStart = t.startDate || t.date;
      const taskEnd = t.endDate || taskStart;

      // Date filter: check if task interval overlaps [bounds.start, bounds.end]
      if (taskEnd < bounds.start || taskStart > bounds.end) return false;

      // Goal period filter
      if (filterGoal !== 'all') {
        const goal = state.goals.find(g => g.id === filterGoal);
        if (goal && (taskEnd < goal.startDate || taskStart > goal.endDate)) return false;
      }

      // Category filter
      if (filterCat !== 'all' && t.category !== filterCat) return false;

      // Priority filter
      if (filterPrio !== 'all' && t.priority !== filterPrio) return false;

      // Status filter
      if (filterStatus === 'done' && !t.completed) return false;
      if (filterStatus === 'pending' && t.completed) return false;

      // Search query
      if (searchQ) {
        const q = searchQ.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [state.tasks, bounds, filterGoal, filterCat, filterPrio, filterStatus, searchQ, state.goals]);

  // Aggregate stats per date for the timeline, calendar, and table
  const daysData = useMemo(() => {
    const map = {};

    // Group tasksInScope by date, taking into account multi-day ranges within bounds
    tasksInScope.forEach(t => {
      const start = t.startDate || t.date;
      const end = t.endDate || start;

      if (!t.startDate || !t.endDate || t.startDate === t.endDate) {
        const d = t.date;
        if (!map[d]) {
          map[d] = {
            date: d,
            tasks: [],
            total: 0,
            completed: 0,
            xpEarned: state.dayHistory[d]?.xpEarned || 0,
          };
        }
        map[d].tasks.push(t);
        map[d].total++;
        if (isTaskCompletedOnDate(t, d)) map[d].completed++;
      } else {
        let curr = start < bounds.start ? bounds.start : start;
        const maxEnd = end > bounds.end ? bounds.end : end;
        while (curr <= maxEnd) {
          if (isTaskScheduledForDate(t, curr)) {
            if (!map[curr]) {
              map[curr] = {
                date: curr,
                tasks: [],
                total: 0,
                completed: 0,
                xpEarned: state.dayHistory[curr]?.xpEarned || 0,
              };
            }
            map[curr].tasks.push(t);
            map[curr].total++;
            if (isTaskCompletedOnDate(t, curr)) map[curr].completed++;
          }
          curr = nextDay(curr);
        }
      }
    });

    const list = Object.values(map).map(d => ({
      ...d,
      pct: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    }));

    // Sort list
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'total') cmp = a.total - b.total;
      else if (sortField === 'completed') cmp = a.completed - b.completed;
      else if (sortField === 'pct') cmp = a.pct - b.pct;
      else if (sortField === 'xp') cmp = a.xpEarned - b.xpEarned;
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [tasksInScope, bounds, state.dayHistory, sortField, sortAsc]);

  // Export filtered history as JSON
  const exportHistoryJSON = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      bounds,
      history: daysData,
      tasks: tasksInScope,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zorolevel-history-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export filtered history as CSV
  const exportHistoryCSV = () => {
    const headers = ['Date', 'Weekday', 'Total Tasks', 'Completed', 'Completion %', 'XP Earned'];
    const rows = daysData.map(d => {
      const parsed = parseDate(d.date);
      const weekday = parsed.toLocaleDateString('en', { weekday: 'short' });
      return [d.date, weekday, d.total, d.completed, `${d.pct}%`, d.xpEarned];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zorolevel-history-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick Backfill task to a past selected day
  const handleAddBackfill = (e) => {
    e.preventDefault();
    if (!backfillTitle.trim() || !selectedDay) return;
    addTask({
      title: `${backfillTitle.trim()} (Backfilled)`,
      date: selectedDay.date,
      startDate: selectedDay.date,
      endDate: selectedDay.date,
      completed: true,
      completedAt: `${selectedDay.date}T12:00:00`,
      priority: 'Medium',
      category: 'Personal',
      isBackfilled: true,
    });
    setBackfillTitle('');
  };

  // Calendar grid calculations
  const calMonth = calDate.getMonth();
  const calYear = calDate.getFullYear();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const prevMonth = () => setCalDate(new Date(calYear, calMonth - 1, 1));
  const nextMonth = () => setCalDate(new Date(calYear, calMonth + 1, 1));

  const allCategories = [...DEFAULT_CATEGORIES, ...(state.settings.customCategories || [])];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>📜 Audit History</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Examine past quests, inspect completion velocity, backfill missed logs, and export records.
          </p>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              📜 Timeline
            </button>
            <button
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              📅 Calendar
            </button>
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📊 Table
            </button>
            <button
              className={`toggle-btn ${viewMode === 'journal' ? 'active' : ''}`}
              onClick={() => setViewMode('journal')}
            >
              📖 Journal
            </button>
          </div>

          <button className="btn btn-sm" onClick={exportHistoryJSON} title="Export as JSON">
            📥 JSON
          </button>
          <button className="btn btn-sm" onClick={exportHistoryCSV} title="Export as CSV">
            📊 CSV
          </button>
        </div>
      </div>

      {/* Global Date Filter Bar */}
      <DateFilterBar />

      {/* Local Filter Bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div className="search-input-wrap" style={{ flex: '1 1 200px' }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search history by task name..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>

        {/* Goal period filter */}
        {state.goals.length > 0 && (
          <select
            className="form-input"
            value={filterGoal}
            onChange={e => setFilterGoal(e.target.value)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
          >
            <option value="all">🎯 All Goal Periods</option>
            {state.goals.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}

        {/* Category filter */}
        <select
          className="form-input"
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
        >
          <option value="all">🏷️ All Categories</option>
          {allCategories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          className="form-input"
          value={filterPrio}
          onChange={e => setFilterPrio(e.target.value)}
          style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
        >
          <option value="all">⚡ All Priorities</option>
          {PRIORITIES.map(p => (
            <option key={p} value={p}>{p} Priority</option>
          ))}
        </select>

        {/* Status filter */}
        <div className="toggle-group">
          {['all', 'done', 'pending'].map(s => (
            <button
              key={s}
              className={`toggle-btn ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── View 1: Timeline ── */}
      {viewMode === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {daysData.length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📜</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>No entries match your time scope or filters</div>
            </div>
          ) : (
            daysData.map(day => {
              const parsed = parseDate(day.date);
              const weekday = parsed.toLocaleDateString('en', { weekday: 'long' });
              const monthDay = parsed.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
              const isSelected = selectedDay?.date === day.date;

              return (
                <div
                  key={day.date}
                  className={`glass-card liquid-glass-panel ${isSelected ? 'pulse-glow' : ''}`}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '14px 20px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <ProgressRing pct={day.pct} size={46} strokeWidth={5} color={day.pct === 100 ? '#34d399' : '#22d3ee'} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{monthDay}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({weekday})</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {day.completed}/{day.total} tasks completed • {day.pct}% efficiency
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--accent-amber)',
                      padding: '4px 10px',
                      borderRadius: 14,
                      background: 'rgba(251,191,36,0.1)',
                      border: '1px solid rgba(251,191,36,0.2)',
                    }}>
                      +{day.xpEarned} XP
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>
                      Inspect Day →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── View 2: Calendar ── */}
      {viewMode === 'calendar' && (
        <div className="glass-card liquid-glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
          {/* Calendar header with month navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button className="btn btn-sm" onClick={prevMonth}>‹ Prev Month</button>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>
              {calDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="btn btn-sm" onClick={nextMonth}>Next Month ›</button>
          </div>

          {/* Weekday labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', marginBottom: 10 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {/* Empty offset padding */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: 70, opacity: 0.2 }} />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayData = daysData.find(d => d.date === dStr);
              const pct = dayData ? dayData.pct : 0;

              // Color codes
              let bg = 'rgba(255,255,255,0.02)';
              let border = 'rgba(255,255,255,0.06)';
              let textColor = 'var(--text-muted)';

              if (dayData && dayData.total > 0) {
                if (pct === 100) {
                  bg = 'rgba(52,211,153,0.22)';
                  border = 'rgba(52,211,153,0.5)';
                  textColor = '#34d399';
                } else if (pct >= 70) {
                  bg = 'rgba(34,211,238,0.22)';
                  border = 'rgba(34,211,238,0.5)';
                  textColor = '#22d3ee';
                } else if (pct >= 35) {
                  bg = 'rgba(251,191,36,0.18)';
                  border = 'rgba(251,191,36,0.4)';
                  textColor = '#fbbf24';
                } else {
                  bg = 'rgba(244,63,94,0.18)';
                  border = 'rgba(244,63,94,0.4)';
                  textColor = '#f43f5e';
                }
              }

              return (
                <div
                  key={dStr}
                  onClick={() => dayData && setSelectedDay(dayData)}
                  style={{
                    height: 70,
                    padding: 8,
                    borderRadius: 12,
                    background: bg,
                    border: `1px solid ${border}`,
                    cursor: dayData ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: dStr === today() ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                      {dayNum}
                    </span>
                    {dayData && dayData.total > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: textColor }}>
                        {pct}%
                      </span>
                    )}
                  </div>

                  {dayData && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      {dayData.completed}/{dayData.total} done
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(244,63,94,0.5)' }} /> Low (&lt;35%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(251,191,36,0.5)' }} /> Medium (35-70%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(34,211,238,0.5)' }} /> High (70-99%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(52,211,153,0.6)' }} /> Perfect (100%)
            </span>
          </div>
        </div>
      )}

      {/* ── View 3: Table ── */}
      {viewMode === 'table' && (
        <div className="glass-card liquid-glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {[
                  ['date', 'Date & Weekday'],
                  ['total', 'Total Tasks'],
                  ['completed', 'Completed'],
                  ['pct', 'Efficiency %'],
                  ['xp', 'XP Earned'],
                ].map(([f, label]) => (
                  <th
                    key={f}
                    onClick={() => {
                      if (sortField === f) setSortAsc(!sortAsc);
                      else { setSortField(f); setSortAsc(false); }
                    }}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      color: sortField === f ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      fontWeight: 700,
                    }}
                  >
                    {label} {sortField === f ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                ))}
                <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {daysData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching records found
                  </td>
                </tr>
              ) : (
                daysData.map(d => {
                  const parsed = parseDate(d.date);
                  const weekday = parsed.toLocaleDateString('en', { weekday: 'short' });
                  return (
                    <tr
                      key={d.date}
                      onClick={() => setSelectedDay(d)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {d.date} ({weekday})
                      </td>
                      <td style={{ padding: '12px 14px' }}>{d.total}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {d.completed}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: d.pct === 100 ? 'rgba(52,211,153,0.15)' : 'rgba(34,211,238,0.15)',
                          color: d.pct === 100 ? '#34d399' : '#22d3ee',
                          fontWeight: 700,
                        }}>
                          {d.pct}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--accent-amber)', fontWeight: 700 }}>
                        +{d.xpEarned} XP
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          className="btn btn-sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedDay(d); }}
                          style={{ fontSize: 11, padding: '4px 10px' }}
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── View 4: Journal & Reflections ── */}
      {viewMode === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {daysData.length === 0 ? (
            <div className="glass-card liquid-glass-panel" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 20 }}>
              No reflection entries in selected range
            </div>
          ) : (
            daysData.map(d => {
              const review = state.dailyReviews[d.date];
              const MOOD_EMOJIS = ['😫', '😕', '😐', '🙂', '🔥'];

              return (
                <div
                  key={d.date}
                  className="glass-card liquid-glass-panel"
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    borderLeft: review ? '4px solid var(--accent-cyan)' : '4px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📅</span>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{d.date}</span>
                      <span className="chip" style={{ fontSize: 11, background: d.pct === 100 ? 'rgba(52,211,153,0.15)' : 'rgba(34,211,238,0.15)', color: d.pct === 100 ? '#34d399' : '#22d3ee' }}>
                        {d.completed}/{d.total} tasks ({d.pct}%)
                      </span>
                    </div>

                    {review && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 13 }}>
                          Mood: <b>{MOOD_EMOJIS[(review.mood || 3) - 1]} ({review.mood}/5)</b>
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--accent-amber)' }}>
                          ⚡ Energy: <b>{review.energy}/5</b>
                        </span>
                      </div>
                    )}
                  </div>

                  {review ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 14 }}>
                      {review.wentWell && (
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>🏆 What went well:</span>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{review.wentWell}</div>
                        </div>
                      )}
                      {review.toImprove && (
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>🌱 What to improve:</span>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{review.toImprove}</div>
                        </div>
                      )}
                      {review.reflection && (
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>💭 Reflection:</span>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, fontStyle: 'italic' }}>"{review.reflection}"</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No evening reflection recorded for this day.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Day Detail Drawer / Modal with Backfilling & Full Task Management ── */}
      {selectedDay && (
        <div className="modal-backdrop" onClick={() => setSelectedDay(null)}>
          <div
            className="modal-glass-card liquid-glass-panel"
            onClick={e => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: 620,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 26,
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                  📅 Tasks for {selectedDay.date}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {selectedDay.completed} of {selectedDay.total} completed ({selectedDay.pct}%) • +{selectedDay.xpEarned} XP earned
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setDate(selectedDay.date);
                    setPage('today');
                  }}
                  title="Navigate to Today view for this date"
                >
                  ⚡ View this Day in Today →
                </button>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Backfill Missed Task */}
            <form onSubmit={handleAddBackfill} style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <input
                className="form-input"
                placeholder="+ Backfill a missed task for this day..."
                value={backfillTitle}
                onChange={e => setBackfillTitle(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-sm btn-primary" style={{ whiteSpace: 'nowrap' }}>
                + Add Missed
              </button>
            </form>

            {/* Tasks List for Day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedDay.tasks.map(t => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: t.completed ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)',
                    border: t.completed ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTask(t.id)}
                      style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16 }}
                    />
                    <div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: t.completed ? 'line-through' : 'none',
                        color: t.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                      }}>
                        {t.title}
                        {t.isBackfilled && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(167,139,250,0.2)', color: 'var(--accent-violet)', marginLeft: 8 }}>
                            Backfilled
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {t.description}
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>🏷️ {t.category}</span>
                        <span>•</span>
                        <span>⚡ {t.priority}</span>
                        {t.startDate && t.endDate && t.startDate !== t.endDate ? (
                          <span className="chip" style={{ fontSize: 10, padding: '1px 6px', color: 'var(--accent-violet)', background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                            📅 {t.startDate} → {t.endDate}
                          </span>
                        ) : (
                          <span>• 📅 {t.startDate || t.date}</span>
                        )}
                        {t.time && <span>• ⏰ {t.time}</span>}
                        {t.subtasks?.length > 0 && (
                          <span>• ({t.subtasks.filter(s => s.completed).length}/{t.subtasks.length} subtasks)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-sm"
                    onClick={() => setEditingTask(t)}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingTask && (
        <TaskModal
          mode="edit"
          task={editingTask}
          onClose={() => setEditingTask(null)}
          defaultDate={selectedDay?.date}
        />
      )}
    </div>
  );
}
