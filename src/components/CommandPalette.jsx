import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { today } from '../utils/constants';

export default function CommandPalette() {
  const { state, setModal, setPage, setDate, startFocusTimer, toggleTask } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const isOpen = state.ui.commandPaletteOpen;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => setModal({ commandPaletteOpen: false });

  // Build static navigation and action commands
  const STATIC_COMMANDS = [
    { id: 'page-today', type: 'nav', title: 'Go to Today', icon: '📋', action: () => { setPage('today'); setDate(today()); close(); } },
    { id: 'page-habits', type: 'nav', title: 'Go to Habit Tracker', icon: '✨', action: () => { setPage('habits'); close(); } },
    { id: 'page-goals', type: 'nav', title: 'Go to Goal Periods', icon: '🎯', action: () => { setPage('goals'); close(); } },
    { id: 'page-shop', type: 'nav', title: 'Go to Quests & XP Shop', icon: '💎', action: () => { setPage('shop'); close(); } },
    { id: 'page-insights', type: 'nav', title: 'Go to Smart Insights & Reviews', icon: '💡', action: () => { setPage('insights'); close(); } },
    { id: 'page-stats', type: 'nav', title: 'Go to Stats & Analytics', icon: '📊', action: () => { setPage('stats'); close(); } },
    { id: 'page-history', type: 'nav', title: 'Go to History & Journal', icon: '📅', action: () => { setPage('history'); close(); } },
    { id: 'page-settings', type: 'nav', title: 'Go to Settings', icon: '⚙️', action: () => { setPage('settings'); close(); } },
    { id: 'page-download', type: 'nav', title: 'Go to Download Desktop & Mobile Apps', icon: '📥', action: () => { setPage('download'); close(); } },
    { id: 'timer-25', type: 'action', title: 'Start 25m Focus Session', icon: '⚡', action: () => { startFocusTimer(25, null, 'Deep Work', 'work'); close(); } },
    { id: 'timer-50', type: 'action', title: 'Start 50m Focus Session', icon: '🔥', action: () => { startFocusTimer(50, null, 'Deep Work', 'work'); close(); } },
    { id: 'modal-review', type: 'action', title: 'Open Daily Review / Reflection', icon: '🌙', action: () => { setModal({ dailyReviewModalOpen: true }); close(); } },
    { id: 'modal-routine', type: 'action', title: 'Apply Routine Template', icon: '📑', action: () => { setModal({ routineModalOpen: true }); close(); } },
  ];

  // Dynamic matching tasks
  const matchedTasks = query.trim()
    ? state.tasks
        .filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || (t.category && t.category.toLowerCase().includes(query.toLowerCase())))
        .slice(0, 6)
        .map(t => ({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          sub: `${t.priority} • ${t.category} • ${t.date}`,
          icon: t.completed ? '✓' : '○',
          action: () => {
            setPage('today');
            setDate(t.date);
            close();
          },
        }))
    : [];

  const filteredCommands = query.trim()
    ? STATIC_COMMANDS.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : STATIC_COMMANDS;

  const allItems = [...matchedTasks, ...filteredCommands];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(0,0,5,0.75)',
        backdropFilter: 'blur(36px) saturate(200%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={close}
    >
      <div
        className="glass-card liquid-glass-panel"
        style={{
          width: '100%',
          maxWidth: 580,
          borderRadius: 24,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,0.9), 0 0 50px rgba(34, 211, 238, 0.2)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 12 }}>
          <span style={{ fontSize: 18, color: 'var(--accent-cyan)' }}>🔍</span>
          <input
            ref={inputRef}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
            placeholder="Type a command, jump to page, or search tasks..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-muted)' }}>
            ESC
          </span>
        </div>

        {/* Results list */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px' }}>
          {allItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No matching commands or tasks found
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(34, 211, 238, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(34, 211, 238, 0.25)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    {item.sub && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</div>
                    )}
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      Enter ↵
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
