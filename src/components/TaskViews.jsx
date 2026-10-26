import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryColor, today, addDays, getDayOfWeek, formatDate, isTaskScheduledForDate, isTaskCompletedOnDate } from '../utils/constants';

// ─── Kanban Board View ────────────────────────────────────────────────────────
export function KanbanView({ tasks }) {
  const { setTaskKanbanStatus, toggleTask, startFocusTimer } = useApp();

  const columns = [
    { id: 'todo', title: 'To Do', icon: '📝', color: 'var(--accent-cyan)' },
    { id: 'inprogress', title: 'In Progress', icon: '⏳', color: 'var(--accent-amber)' },
    { id: 'done', title: 'Done', icon: '✅', color: 'var(--accent-emerald)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      {columns.map(col => {
        const colTasks = tasks.filter(t => (t.kanbanStatus || (t.completed ? 'done' : 'todo')) === col.id);
        return (
          <div
            key={col.id}
            className="glass-card liquid-glass-panel"
            style={{
              borderRadius: 20,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 400,
              borderTop: `3px solid ${col.color}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                <span>{col.icon}</span>
                <span>{col.title}</span>
              </div>
              <span className="chip" style={{ background: 'rgba(255,255,255,0.08)', fontSize: 11 }}>
                {colTasks.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {colTasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, margin: 'auto 0' }}>
                  No tasks in {col.title}
                </div>
              ) : (
                colTasks.map(task => {
                  const catColor = getCategoryColor(task.category);
                  return (
                    <div
                      key={task.id}
                      className="glass-card"
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        borderLeft: `3px solid ${catColor}`,
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {task.title}
                        </span>
                        <span className={`chip chip-priority-${task.priority.toLowerCase()}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                          {task.priority}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            ⏱️ ~{task.estimatedMinutes || 30}m
                          </span>
                          {task.startDate && task.endDate && task.startDate !== task.endDate ? (
                            <span className="chip" style={{ fontSize: 10, padding: '1px 6px', color: 'var(--accent-violet)', background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                              📅 {task.startDate} → {task.endDate}
                            </span>
                          ) : (
                            <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>
                              📅 {task.startDate || task.date}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 4 }}>
                          {!task.completed && (
                            <button
                              className="btn btn-sm"
                              style={{ padding: '2px 6px', fontSize: 10, background: 'rgba(34, 211, 238, 0.15)', color: 'var(--accent-cyan)' }}
                              onClick={() => startFocusTimer(task.estimatedMinutes || 25, task.id, task.title, 'work')}
                              title="Start Focus Timer on this task"
                            >
                              ⚡ Focus
                            </button>
                          )}

                          {col.id !== 'todo' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => setTaskKanbanStatus(task.id, col.id === 'done' ? 'inprogress' : 'todo')}
                              title="Move left"
                            >
                              ←
                            </button>
                          )}

                          {col.id !== 'done' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => setTaskKanbanStatus(task.id, col.id === 'todo' ? 'inprogress' : 'done')}
                              title="Move right"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Eisenhower Matrix View ───────────────────────────────────────────────────
export function EisenhowerView({ tasks }) {
  const { toggleTask, startFocusTimer } = useApp();

  const quadrants = [
    {
      id: 'q1',
      title: 'Do First (Urgent & Important)',
      subtitle: 'High Priority Deadlines',
      filter: t => t.priority === 'High',
      color: 'var(--accent-rose)',
      badge: 'URGENT',
    },
    {
      id: 'q2',
      title: 'Schedule (Important, Not Urgent)',
      subtitle: 'Medium Priority Deep Goals',
      filter: t => t.priority === 'Medium',
      color: 'var(--accent-cyan)',
      badge: 'GOALS',
    },
    {
      id: 'q3',
      title: 'Delegate / Quick (Urgent, Low Imp)',
      subtitle: 'Fast Tasks & Errands',
      filter: t => t.priority === 'Low' && t.category !== 'Personal',
      color: 'var(--accent-amber)',
      badge: 'FAST',
    },
    {
      id: 'q4',
      title: 'Eliminate / Trivial (Neither)',
      subtitle: 'Low Priority / Maintenance',
      filter: t => t.priority === 'Low' && t.category === 'Personal',
      color: 'var(--text-muted)',
      badge: 'PASSIVE',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      {quadrants.map(q => {
        const qTasks = tasks.filter(q.filter);
        return (
          <div
            key={q.id}
            className="glass-card liquid-glass-panel"
            style={{
              borderRadius: 20,
              padding: 18,
              borderTop: `3px solid ${q.color}`,
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: q.color }}>{q.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.subtitle}</div>
              </div>
              <span className="chip" style={{ fontSize: 11, background: `${q.color}22`, color: q.color }}>
                {qTasks.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {qTasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, margin: 'auto 0' }}>
                  No tasks in this quadrant
                </div>
              ) : (
                qTasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        style={{ accentColor: 'var(--accent-cyan)' }}
                      />
                      <span style={{ fontSize: 13, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {task.title}
                      </span>
                    </label>

                    {!task.completed && (
                      <button
                        className="btn btn-sm"
                        style={{ padding: '2px 6px', fontSize: 10, background: 'rgba(34, 211, 238, 0.15)', color: 'var(--accent-cyan)' }}
                        onClick={() => startFocusTimer(task.estimatedMinutes || 25, task.id, task.title, 'work')}
                        title="Start focus"
                      >
                        ⚡
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 7-Day Week Planner View ──────────────────────────────────────────────────
export function WeekPlannerView({ tasks }) {
  const { moveTask, toggleTask, setDate, setTaskView } = useApp();
  const todayStr = today();

  // Generate 7 days starting from Monday of current week
  const todayDate = new Date();
  const dayIndex = (todayDate.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const mondayDate = new Date(todayDate);
  mondayDate.setDate(todayDate.getDate() - dayIndex);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    return formatDate(d);
  });

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
      {weekDays.map((dateStr, idx) => {
        const seenIds = new Set();
        const seenKeys = new Set();
        const dayTasks = [];

        for (const t of (tasks || [])) {
          if (seenIds.has(t.id)) continue;
          seenIds.add(t.id);
          if (isTaskScheduledForDate(t, dateStr)) {
            const key = `${(t.title || '').trim().toLowerCase()}:::${(t.category || '').toLowerCase()}`;
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);
            const isDone = isTaskCompletedOnDate(t, dateStr);
            dayTasks.push({ ...t, completed: isDone });
          }
        }

        const isCurrentDay = dateStr === todayStr;

        return (
          <div
            key={dateStr}
            className="glass-card liquid-glass-panel"
            style={{
              borderRadius: 16,
              padding: 12,
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              border: isCurrentDay ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
              background: isCurrentDay ? 'rgba(34, 211, 238, 0.04)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: 6,
                cursor: 'pointer',
              }}
              onClick={() => {
                setDate(dateStr);
                setTaskView('list');
              }}
              title="Click to view and manage this day in Today view"
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: isCurrentDay ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                  {DAY_NAMES[idx]}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                  {dateStr.slice(5)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--accent-cyan)', marginLeft: 6 }} title="Open day">
                  ↗
                </span>
              </div>
              <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>
                {dayTasks.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {dayTasks.map(t => (
                <div
                  key={t.id}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTask(t.id)}
                      style={{ accentColor: 'var(--accent-cyan)' }}
                    />
                    <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </span>
                  </label>

                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      className="btn btn-sm"
                      style={{ padding: '1px 4px', fontSize: 9, background: 'none', border: 'none', color: 'var(--text-muted)' }}
                      onClick={() => moveTask(t.id, addDays(dateStr, -1))}
                      title="Move yesterday"
                    >
                      ‹
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ padding: '1px 4px', fontSize: 9, background: 'none', border: 'none', color: 'var(--text-muted)' }}
                      onClick={() => moveTask(t.id, addDays(dateStr, 1))}
                      title="Move tomorrow"
                    >
                      ›
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Routine Templates Modal ──────────────────────────────────────────────────
export function RoutineTemplatesModal() {
  const { state, setModal, applyRoutineTemplate } = useApp();

  if (!state.ui.routineModalOpen) return null;

  const ROUTINES = [
    {
      id: 'morning_mastery',
      title: 'Morning Mastery Routine',
      icon: '🌅',
      desc: 'Meditation, hydrate 500ml, high-priority deep focus sprint.',
      tasks: ['Morning hydration & mindfulness', 'Review daily quests & calendar', '90-min High Priority Deep Work Block'],
    },
    {
      id: 'deep_work',
      title: 'Deep Work Sprint',
      icon: '🧠',
      desc: 'Eliminate notifications, 50m intense study or coding, review progress.',
      tasks: ['Zero distractions phone lockdown', 'Deep Work Focus Block #1', 'Review output & commit changes'],
    },
    {
      id: 'night_wind_down',
      title: 'Night Wind-Down Routine',
      icon: '🌙',
      desc: 'Reflect on wins, clear desktop, prep priority tasks for tomorrow.',
      tasks: ['Submit Daily Review & Mood', 'Plan top 3 tasks for tomorrow', 'Read 20 min & screen shutdown'],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Routine templates dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 140,
        background: 'rgba(0,0,5,0.78)',
        backdropFilter: 'blur(36px) saturate(200%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={() => setModal({ routineModalOpen: false })}
    >
      <div
        className="glass-card liquid-glass-panel"
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 28,
          padding: 28,
          boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(34, 211, 238, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>📑</span>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Routine Templates
            </h2>
          </div>
          <button
            onClick={() => setModal({ routineModalOpen: false })}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: 30,
              height: 30,
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
          Inject curated productivity routines directly into Today with 1 tap.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ROUTINES.map(r => (
            <div
              key={r.id}
              className="glass-card"
              style={{
                padding: 16,
                borderRadius: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>{r.icon}</span>
                  <span>{r.title}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {r.desc}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.tasks.map((t, idx) => (
                    <span key={idx} className="chip" style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)' }}>
                      • {typeof t === 'string' ? t : t.title}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: 12, whiteSpace: 'nowrap' }}
                onClick={() => applyRoutineTemplate(r.id)}
              >
                + Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────
export function BulkActionBar() {
  const { state, setBulkSelected, bulkCompleteTasks, bulkDeleteTasks, bulkMoveTasks } = useApp();
  const selectedIds = state.ui.bulkSelectedIds || [];

  if (!selectedIds.length) return null;

  return (
    <div
      className="glass-card liquid-glass-panel"
      style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          borderRadius: 'var(--radius-pill)',
          padding: '10px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: 'slideUp 0.2s ease',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)' }}>
        {selectedIds.length} tasks selected
      </span>

      <button
        className="btn btn-sm"
        style={{ background: 'rgba(52, 211, 153, 0.2)', color: 'var(--accent-emerald)', border: '1px solid rgba(52,211,153,0.3)' }}
        onClick={() => bulkCompleteTasks(selectedIds)}
      >
        ✓ Complete
      </button>

      <button
        className="btn btn-sm btn-secondary"
        onClick={() => bulkMoveTasks(selectedIds, addDays(today(), 1))}
      >
        📅 Tomorrow
      </button>

      <button
        className="btn btn-sm"
        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
        onClick={() => bulkDeleteTasks(selectedIds)}
      >
        🗑️ Delete
      </button>

      <button
        onClick={() => setBulkSelected([])}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
      >
        ✕
      </button>
    </div>
  );
}
