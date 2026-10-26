import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  today, nextDay, addDays, parseDate, formatDate, DEFAULT_CATEGORIES, PRIORITIES, getCategoryColor, daysBetween, isTaskScheduledForDate,
  isTaskCompletedOnDate, isSubtaskCompletedOnDate
} from '../utils/constants';
import TaskList from '../components/TaskList';
import TaskModal from '../components/TaskModal';
import SmartQuickAdd from '../components/SmartQuickAdd';
import { KanbanView, EisenhowerView, WeekPlannerView, RoutineTemplatesModal, BulkActionBar } from '../components/TaskViews';
import { ProgressRing } from '../components/Charts';
import confetti from 'canvas-confetti';

const MOTIVATIONAL_MESSAGES = [
  { threshold: 0, emoji: '🌅', text: "Every journey starts with a single step. Let's go!" },
  { threshold: 1, emoji: '💪', text: "You've started! Keep the momentum going." },
  { threshold: 25, emoji: '🔥', text: "Making progress! Keep that energy up." },
  { threshold: 50, emoji: '⚡', text: "Halfway there! You're crushing it." },
  { threshold: 75, emoji: '🚀', text: "Almost there! Just a few more tasks left." },
  { threshold: 99, emoji: '🎉', text: "Perfect day! You completed everything!" },
];

function getMotivation(pct) {
  let msg = MOTIVATIONAL_MESSAGES[0];
  for (const m of MOTIVATIONAL_MESSAGES) {
    if (pct >= m.threshold) msg = m;
  }
  return msg;
}

// ─── Date Navigator ───────────────────────────────────────────────────────────
function DateNavigator({ date, onDateChange }) {
  const todayStr = today();
  const displayDate = useMemo(() => {
    if (date === todayStr) return 'Today';
    const tomorrowStr = nextDay(todayStr);
    if (date === tomorrowStr) return 'Tomorrow';
    const yesterdayStr = addDays(todayStr, -1);
    if (date === yesterdayStr) return 'Yesterday';
    const d = parseDate(date);
    return d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [date, todayStr]);

  const prev = () => {
    onDateChange(addDays(date, -1));
  };
  const next = () => {
    onDateChange(nextDay(date));
  };

  return (
    <div className="date-nav">
      <button className="nav-arrow" onClick={prev} title="Previous day">‹</button>
      <div className="date-display">
        {displayDate}
      </div>
      <button className="nav-arrow" onClick={next} title="Next day">›</button>
      {date !== todayStr && (
        <button className="btn btn-sm" onClick={() => onDateChange(todayStr)}>Today</button>
      )}
      <input
        type="date" className="form-input" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
        value={date}
        onChange={e => e.target.value && onDateChange(e.target.value)}
      />
    </div>
  );
}

// ─── Today Page ───────────────────────────────────────────────────────────────
export default function TodayPage() {
  const {
    state,
    addTask,
    setDate,
    setPage,
    moveTask,
    toggleTask,
    setTaskView,
    toggleRestDay,
    setModal,
  } = useApp();

  const { selectedDate, taskView } = state.ui;
  const [showModal, setShowModal] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [filterPrio, setFilterPrio] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [perfectFired, setPerfectFired] = useState(false);

  const todayStr = today();
  const isRestDay = state.restDays.includes(selectedDate);

  // Active Goal Period
  const activeGoal = state.goals.find(g => g.status === 'active');
  const goalMetrics = useMemo(() => {
    if (!activeGoal) return null;
    const totalDays = daysBetween(activeGoal.startDate, activeGoal.endDate);
    const daysElapsed = Math.max(0, Math.min(totalDays, daysBetween(activeGoal.startDate, todayStr)));
    const daysRemaining = Math.max(0, daysBetween(todayStr, activeGoal.endDate) - 1);

    const tasksInGoal = state.tasks.filter(t =>
      t.date >= activeGoal.startDate && t.date <= activeGoal.endDate
    );
    const completedInGoal = tasksInGoal.filter(t => t.completed).length;
    const target = activeGoal.targetValue || 100;
    const pct = Math.min(100, Math.round((completedInGoal / target) * 100));

    return { totalDays, daysElapsed, daysRemaining, completedInGoal, target, pct };
  }, [activeGoal, state.tasks, todayStr]);

  const displayDate = useMemo(() => {
    if (selectedDate === todayStr) return 'Today';
    const tomorrowStr = nextDay(todayStr);
    if (selectedDate === tomorrowStr) return 'Tomorrow';
    const yesterdayStr = addDays(todayStr, -1);
    if (selectedDate === yesterdayStr) return 'Yesterday';
    const d = parseDate(selectedDate);
    return d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [selectedDate, todayStr]);

  // Tasks for selected date (including tasks scheduled across start-end date ranges and repeating tasks)
  const allDateTasks = useMemo(() => {
    const candidateTasks = [];
    for (const t of state.tasks) {
      if (isTaskScheduledForDate(t, selectedDate)) {
        candidateTasks.push(t);
      }
    }

    // Deduplicate candidate tasks by normalized title and category to ensure zero duplicates ever render
    const uniqueMap = new Map();
    for (const t of candidateTasks) {
      const normTitle = (t.title || '').trim().toLowerCase();
      const key = `${normTitle}:::${(t.category || '').toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, t);
      } else {
        const existing = uniqueMap.get(key);
        const existingSpan = daysBetween(existing.startDate || existing.date, existing.endDate || existing.startDate || existing.date);
        const tSpan = daysBetween(t.startDate || t.date, t.endDate || t.startDate || t.date);
        const primary = tSpan >= existingSpan ? t : existing;
        const secondary = tSpan >= existingSpan ? existing : t;

        const mergedCompletedDates = Array.from(new Set([
          ...(primary.completedDates || (primary.completed ? [primary.date] : [])),
          ...(secondary.completedDates || (secondary.completed ? [secondary.date] : []))
        ]));
        uniqueMap.set(key, { ...primary, completedDates: mergedCompletedDates });
      }
    }

    const result = [];
    for (const [, t] of uniqueMap) {
      const isDone = isTaskCompletedOnDate(t, selectedDate);
      const isMulti = (t.startDate && t.endDate && t.startDate !== t.endDate) || (t.repeat && t.repeat !== 'none');
      const daySubtasks = (t.subtasks || []).map(s => ({
        ...s,
        completed: isSubtaskCompletedOnDate(s, selectedDate, isMulti),
      }));

      result.push({
        ...t,
        completed: isDone,
        kanbanStatus: isDone ? 'done' : (t.kanbanStatus === 'done' ? 'todo' : (t.kanbanStatus || 'todo')),
        subtasks: daySubtasks,
      });
    }

    return result;
  }, [state.tasks, selectedDate]);

  // Overdue Tasks
  const overdueTasks = useMemo(() => {
    return state.tasks.filter(t => {
      if (t.completed) return false;
      const end = t.endDate || t.date;
      return end < todayStr;
    });
  }, [state.tasks, todayStr]);

  const total = allDateTasks.length;
  const completed = allDateTasks.filter(t => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Planned Duration calculation
  const totalPlannedMinutes = useMemo(() => {
    return allDateTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  }, [allDateTasks]);

  const plannedHours = Math.floor(totalPlannedMinutes / 60);
  const plannedMins = totalPlannedMinutes % 60;

  // Focus minutes logged for selected date
  const loggedFocusMinutes = useMemo(() => {
    return state.focusSessions
      .filter(s => s.date === selectedDate)
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }, [state.focusSessions, selectedDate]);

  // Confetti on perfect day
  const isPerfect = total > 0 && pct === 100;
  if (isPerfect && !perfectFired) {
    setPerfectFired(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a78bfa', '#22d3ee', '#34d399'] });
  }
  if (!isPerfect && perfectFired) setPerfectFired(false);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return allDateTasks.filter(t => {
      if (filterCat !== 'all' && t.category !== filterCat) return false;
      if (filterPrio !== 'all' && t.priority !== filterPrio) return false;
      if (filterStatus === 'done' && !t.completed) return false;
      if (filterStatus === 'pending' && t.completed) return false;
      if (searchQ && !t.title.toLowerCase().includes(searchQ.toLowerCase()) && !t.description?.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    });
  }, [allDateTasks, filterCat, filterPrio, filterStatus, searchQ]);

  const motivation = getMotivation(pct);
  const allCategories = [...DEFAULT_CATEGORIES, ...(state.settings.customCategories || [])];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="page-title">Task Command Center</div>
            {isRestDay && (
              <span className="chip" style={{ background: 'rgba(251, 191, 36, 0.2)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)' }}>
                🏖️ Rest Day Active
              </span>
            )}
          </div>
          <div className="page-subtitle" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
            <span>{completed}/{total} tasks done {selectedDate === todayStr ? 'today' : `for ${displayDate}`}</span>
            <span>•</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Planned: {plannedHours}h {plannedMins}m
            </span>
            {loggedFocusMinutes > 0 && (
              <>
                <span>•</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  ⚡ Focused: {loggedFocusMinutes}m
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <DateNavigator date={selectedDate} onDateChange={setDate} />

          <button
            className="btn btn-secondary"
            onClick={() => toggleRestDay(selectedDate)}
            title="Mark this day as Rest Day (protects streak from breaking)"
            style={{ fontSize: 12, padding: '8px 12px' }}
          >
            {isRestDay ? '🏖️ Rest Day On' : '🏖️ Rest Day'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setModal({ dailyReviewModalOpen: true })}
            title="End of day mood and reflections"
            style={{ fontSize: 12, padding: '8px 12px' }}
          >
            🌙 Daily Review
          </button>

          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ✨ New Task
          </button>
        </div>
      </div>

      {/* Active Goal Period Banner */}
      {activeGoal && goalMetrics && (
        <div
          className="glass-card liquid-glass-panel"
          style={{
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeGoal.color}66`,
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, ${activeGoal.color}15 100%)`,
            boxShadow: `var(--glass-shadow), 0 0 24px ${activeGoal.color}20`,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <span style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'white',
                  marginRight: 8,
                }}>
                  {activeGoal.name}
                </span>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: `${activeGoal.color}33`,
                  color: activeGoal.color,
                  fontWeight: 700,
                }}>
                  Day {goalMetrics.daysElapsed} of {goalMetrics.totalDays}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {goalMetrics.daysRemaining} days remaining
              </span>
              <button
                className="btn btn-sm"
                onClick={() => setPage('goals')}
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                View Quest →
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
              <span>Progress: {goalMetrics.completedInGoal} / {goalMetrics.target} tasks</span>
              <span style={{ fontWeight: 700, color: activeGoal.color }}>{goalMetrics.pct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${goalMetrics.pct}%`,
                background: `linear-gradient(90deg, ${activeGoal.color}, var(--accent-violet))`,
                boxShadow: `0 0 10px ${activeGoal.color}`,
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Motivational banner */}
      {total > 0 && (
        <div className="motivational-banner">
          <span className="emoji">{motivation.emoji}</span>
          <span>{motivation.text}</span>
          <div style={{ marginLeft: 'auto' }}>
            <ProgressRing pct={pct} size={50} strokeWidth={5} color={pct === 100 ? '#34d399' : '#a78bfa'} />
          </div>
        </div>
      )}

      {/* Overdue Section in Red Glass */}
      {selectedDate === todayStr && overdueTasks.length > 0 && (
        <div
          className="glass-card liquid-glass-panel"
          style={{
            padding: 16,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 25px rgba(244, 63, 94, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent-rose)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Overdue Quests ({overdueTasks.length})
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Action needed to prevent streak penalty
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overdueTasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 12,
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleTask(task.id)}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#ffe4e6' }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Due: {task.endDate || task.date} • {task.category} • {task.priority} Priority
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => moveTask(task.id, todayStr)}
                    style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}
                  >
                    Reschedule to Today
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => toggleTask(task.id)}
                    style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}
                  >
                    ✓ Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Quick Add with NLP parser & preview chips */}
      <SmartQuickAdd />

      {/* View Selector & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* View mode toggle */}
        <div className="toggle-group" style={{ background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 14 }}>
          {[
            { id: 'list', label: '📋 List' },
            { id: 'kanban', label: '🗂️ Kanban' },
            { id: 'matrix', label: '🎯 Matrix' },
            { id: 'week', label: '📅 7-Day' },
          ].map(v => (
            <button
              key={v.id}
              className={`toggle-btn ${taskView === v.id ? 'active' : ''}`}
              style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}
              onClick={() => setTaskView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search tasks…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
      </div>

      {/* Secondary filter chips (only in list view) */}
      {taskView === 'list' && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="toggle-group">
            {['all', 'pending', 'done'].map(s => (
              <button key={s} className={`toggle-btn ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="filter-bar" style={{ gap: 6 }}>
            <span className={`filter-chip ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>All</span>
            {allCategories.map(c => (
              <span key={c} className={`filter-chip ${filterCat === c ? 'active' : ''}`} style={filterCat === c ? { borderColor: `${getCategoryColor(c)}80`, color: getCategoryColor(c), background: `${getCategoryColor(c)}15` } : {}} onClick={() => setFilterCat(filterCat === c ? 'all' : c)}>
                {c}
              </span>
            ))}
          </div>

          <div className="filter-bar" style={{ gap: 6 }}>
            {PRIORITIES.map(p => (
              <span key={p} className={`filter-chip ${filterPrio === p ? 'active' : ''}`} onClick={() => setFilterPrio(filterPrio === p ? 'all' : p)}>
                {p === 'Low' ? '🟢' : p === 'Medium' ? '🟡' : '🔴'} {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Views Switching */}
      {taskView === 'list' && (
        <TaskList tasks={filteredTasks} date={selectedDate} />
      )}

      {taskView === 'kanban' && (
        <KanbanView tasks={allDateTasks} />
      )}

      {taskView === 'matrix' && (
        <EisenhowerView tasks={allDateTasks} />
      )}

      {taskView === 'week' && (
        <WeekPlannerView tasks={state.tasks} />
      )}

      {/* Empty state for no tasks at all */}
      {total === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🌟</div>
          <div className="empty-title">No tasks for {selectedDate === todayStr ? 'today' : displayDate}</div>
          <div className="empty-desc" style={{ marginBottom: 16 }}>
            {selectedDate === todayStr
              ? 'Start adding tasks to begin tracking your progress and earning XP!'
              : `No tasks scheduled on ${displayDate}. Add a new task or pick another date.`}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ✨ + New Task for {displayDate}
          </button>
        </div>
      )}

      {/* Routine Templates Modal */}
      <RoutineTemplatesModal />

      {/* Bulk Action Toolbar */}
      <BulkActionBar />

      {/* New Task Modal */}
      {showModal && <TaskModal mode="create" onClose={() => setShowModal(false)} defaultDate={selectedDate} />}

      {/* FAB for mobile */}
      <button className="fab" onClick={() => setShowModal(true)} title="New Task">+</button>
    </div>
  );
}
