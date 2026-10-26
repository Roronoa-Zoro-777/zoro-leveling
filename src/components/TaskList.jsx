import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryColor, today, nextDay, formatDate } from '../utils/constants';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskModal from './TaskModal';

// ─── Single Task Card ─────────────────────────────────────────────────────────
function TaskCard({ task, isDragging }) {
  const {
    state,
    toggleTask,
    toggleSubtask,
    deleteTask,
    duplicateTask,
    moveTask,
    updateTask,
    startFocusTimer,
    setBulkSelected,
  } = useApp();

  const [showEdit, setShowEdit] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);
  const titleInputRef = useRef(null);

  // Mobile touch gesture tracking
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  const catColor = getCategoryColor(task.category);
  const selectedIds = state.ui.bulkSelectedIds || [];
  const isSelected = selectedIds.includes(task.id);

  const handleTitleDoubleClick = () => {
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const saveInlineTitle = () => {
    if (titleVal.trim()) updateTask({ ...task, title: titleVal.trim() });
    else setTitleVal(task.title);
    setEditingTitle(false);
  };

  const toggleSelect = (e) => {
    e.stopPropagation();
    if (isSelected) {
      setBulkSelected(selectedIds.filter(id => id !== task.id));
    } else {
      setBulkSelected([...selectedIds, task.id]);
    }
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndXRef.current = e.changedTouches[0].clientX;
    const diff = touchEndXRef.current - touchStartXRef.current;
    // Swipe Right (>= 80px) -> Complete task
    if (diff > 80) {
      toggleTask(task.id);
    }
    // Swipe Left (<= -80px) -> Delete/Trash task
    else if (diff < -80) {
      deleteTask(task.id);
    }
  };

  const subtaskDone = task.subtasks?.filter(s => s.completed).length || 0;
  const subtaskTotal = task.subtasks?.length || 0;

  return (
    <>
      <div
        className={`task-card ${task.completed ? 'completed' : ''}`}
        style={{
          opacity: isDragging ? 0.4 : 1,
          borderLeft: `3px solid ${catColor}`,
          background: isSelected ? 'rgba(34, 211, 238, 0.08)' : undefined,
          transition: 'all 0.2s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="task-row">
          {/* Multi-select box (or regular checkbox) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              title="Multi-select for bulk actions"
              checked={isSelected}
              onChange={toggleSelect}
              style={{
                width: 14,
                height: 14,
                accentColor: 'var(--accent-cyan)',
                cursor: 'pointer',
                opacity: selectedIds.length > 0 || isSelected ? 1 : 0.25,
                transition: 'opacity 0.2s',
              }}
            />

            {/* Checkbox with procedural liquid bubble sound */}
            <label className="task-checkbox" title={task.completed ? 'Mark incomplete' : 'Mark complete'}>
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
              <div className="check-box">
                <span className="check-icon">✓</span>
              </div>
            </label>
          </div>

          {/* Body */}
          <div className="task-body">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                className="form-input"
                style={{ padding: '2px 6px', fontSize: 14, marginBottom: 4 }}
                value={titleVal}
                onChange={e => setTitleVal(e.target.value)}
                onBlur={saveInlineTitle}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveInlineTitle();
                  if (e.key === 'Escape') { setTitleVal(task.title); setEditingTitle(false); }
                }}
              />
            ) : (
              <div className="task-title" onDoubleClick={handleTitleDoubleClick} title="Double-click to inline edit">
                {task.title}
              </div>
            )}

            {task.description && <div className="task-description">{task.description}</div>}

            {/* Meta */}
            <div className="task-meta">
              <span className={`chip chip-priority-${task.priority.toLowerCase()}`}>
                {task.priority}
              </span>
              <span className="chip chip-category" style={{ borderColor: `${catColor}55`, color: catColor, background: `${catColor}15` }}>
                {task.category}
              </span>

              {/* Start & End Dates */}
              {task.startDate && task.endDate && task.startDate !== task.endDate ? (
                <span
                  className="chip"
                  style={{
                    background: 'rgba(167, 139, 250, 0.15)',
                    border: '1px solid rgba(167, 139, 250, 0.4)',
                    color: 'var(--accent-violet)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  title={`Scheduled from ${task.startDate} to ${task.endDate}`}
                >
                  📅 {task.startDate} → {task.endDate}
                </span>
              ) : (
                <span
                  className="chip"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                  }}
                  title={`Date: ${task.startDate || task.date}`}
                >
                  📅 {task.startDate || task.date}
                </span>
              )}

              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                ⏱️ ~{task.estimatedMinutes || 30}m
              </span>
              {task.time && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏰ {task.time}</span>
              )}
              {task.repeat !== 'none' && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔄 {task.repeat}</span>
              )}
              {subtaskTotal > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  📎 {subtaskDone}/{subtaskTotal} subtasks
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="task-actions">
            {!task.completed && (
              <button
                className="btn btn-sm btn-icon"
                style={{ color: 'var(--accent-cyan)', background: 'rgba(34, 211, 238, 0.1)' }}
                onClick={() => startFocusTimer(task.estimatedMinutes || 25, task.id, task.title, 'work')}
                title="Start Focus Timer on this task"
              >
                ⚡
              </button>
            )}
            <button className="btn btn-sm btn-icon" onClick={() => setShowEdit(true)} title="Edit task">✏️</button>
            <button className="btn btn-sm btn-icon" onClick={() => duplicateTask(task.id)} title="Duplicate">⊕</button>
            <button className="btn btn-sm btn-icon" onClick={() => {
              const tom = nextDay(task.date);
              moveTask(task.id, tom);
            }} title="Move to tomorrow">➡️</button>
            <button className="btn btn-sm btn-icon btn-danger" onClick={() => deleteTask(task.id)} title="Delete (moves to recycle bin)">🗑</button>
          </div>
        </div>

        {/* Subtasks */}
        {subtaskTotal > 0 && (
          <div className="subtask-list">
            {task.subtasks.map(s => (
              <div key={s.id} className={`subtask-item ${s.completed ? 'done' : ''}`}>
                <label className="task-checkbox subtask-checkbox">
                  <input type="checkbox" checked={s.completed} onChange={() => toggleSubtask(task.id, s.id)} />
                  <div className="check-box">
                    <span className="check-icon">✓</span>
                  </div>
                </label>
                <span>{s.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && <TaskModal mode="edit" task={task} onClose={() => setShowEdit(false)} />}
    </>
  );
}

// ─── Sortable Wrapper ─────────────────────────────────────────────────────────
function SortableTaskCard({ task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

// ─── Main TaskList with DnD ───────────────────────────────────────────────────
export default function TaskList({ tasks, date }) {
  const { reorderTasks } = useApp();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedTasks = [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const handleDragStart = (e) => {
    setActiveId(e.active.id);
  };

  const handleDragEnd = (e) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = sortedTasks.findIndex(t => t.id === active.id);
    const newIndex = sortedTasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
    reorderTasks(date, newOrder.map(t => t.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {sortedTasks.map(task => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
