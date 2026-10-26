/**
 * AppContext.jsx — Global state + IndexedDB persistence via Dexie v3
 * Offline-first, Zero CDN, Procedural Audio, Liquid Glass State Engine
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import {
  generateId, today, formatDate, isWeekday, getDayOfWeek, addDays, daysBetween, parseDate, isTaskScheduledForDate,
  isTaskCompletedOnDate, isSubtaskCompletedOnDate,
  XP_VALUES, getLevelFromXP, getXPProgress, getRankTitle, ACHIEVEMENTS, generateDemoData,
  THEMES, AVATAR_FRAMES, ROUTINE_TEMPLATES,
} from '../utils/constants';
import {
  db, loadAllData, saveTask, deleteTask as dbDeleteTask, deleteTasks as dbDeleteTasks, saveTasks,
  saveGoal, deleteGoal as dbDeleteGoal, saveGoals,
  saveHabit, deleteHabit as dbDeleteHabit, saveHabitLog, saveHabitLogs,
  saveFocusSession, saveDailyReview, toggleRestDayDb,
  moveTaskToTrash as dbMoveTaskToTrash, restoreTaskFromTrash as dbRestoreTaskFromTrash, emptyTrashDb,
  saveQuest, saveQuests,
  saveProfile, saveSettings, saveDayHistory, saveXPHistoryEntry,
  replaceAllData, mergeAllData, requestPersistentStorage, DEFAULT_PROFILE, DEFAULT_SETTINGS,
} from '../db/db';
import { soundManager } from '../utils/audio';
import { performAutoRotatingBackup, migrateLegacyLocalStorageData } from '../utils/backupManager';

const AppContext = createContext(null);

// ─── Default in-memory state ──────────────────────────────────────────────────
const DEFAULT_STATE = {
  tasks: [],
  goals: [],
  habits: [],
  habitLogs: [],
  focusSessions: [],
  dailyReviews: {},
  trash: [],
  quests: [],
  restDays: [],
  profile: { ...DEFAULT_PROFILE },
  settings: { ...DEFAULT_SETTINGS },
  dayHistory: {},
  xpHistory: [],
  undoStack: [],
  redoStack: [],
  activeFocusTimer: {
    isRunning: false,
    taskId: null,
    taskTitle: '',
    durationMinutes: 25,
    mode: 'work',
    startTime: null,
    secondsLeft: 25 * 60,
  },
  appLockLocked: false,
  ui: {
    currentPage: (typeof window !== 'undefined' && window.location.pathname === '/download')
      ? 'download'
      : (localStorage.getItem('zl-page') || 'today'),
    selectedDate: localStorage.getItem('zl-date') || today(),
    dateFilter: localStorage.getItem('zl-date-filter') || 'all',
    taskView: localStorage.getItem('zl-task-view') || 'list', // 'list' | 'kanban' | 'matrix' | 'week'
    customDateRange: {
      startDate: localStorage.getItem('zl-custom-start') || addDays(today(), -29),
      endDate: localStorage.getItem('zl-custom-end') || today(),
    },
    levelUpPopup: null,
    goalCompletePopup: null,
    dailyReviewModalOpen: false,
    commandPaletteOpen: false,
    shortcutsModalOpen: false,
    routineModalOpen: false,
    toastQueue: [],
    floatingXP: [],
    searchQuery: '',
    filterCategory: 'all',
    filterPriority: 'all',
    filterStatus: 'all',
    bulkSelectedIds: [],
  },
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Hydration from DB ──
    case 'HYDRATE': {
      const p = action.payload;
      const initialSettings = { ...DEFAULT_SETTINGS, ...p.settings };
      return {
        ...state,
        tasks:         p.tasks || [],
        goals:         p.goals || [],
        habits:        p.habits || [],
        habitLogs:     p.habitLogs || [],
        focusSessions: p.focusSessions || [],
        dailyReviews:  p.dailyReviews || {},
        trash:         p.trash || [],
        quests:        p.quests || [],
        restDays:      p.restDays || [],
        profile:       { ...DEFAULT_PROFILE, ...p.profile },
        settings:      initialSettings,
        dayHistory:    p.dayHistory || {},
        xpHistory:     p.xpHistory  || [],
        appLockLocked: initialSettings.appLockEnabled && !!initialSettings.appLockPinHash,
      };
    }

    // ── App Lock ──
    case 'SET_APP_LOCKED':
      return { ...state, appLockLocked: action.payload };

    // ── Undo / Redo Stacks ──
    case 'PUSH_UNDO':
      return {
        ...state,
        undoStack: [action.payload, ...state.undoStack].slice(0, 30),
        redoStack: [],
      };
    case 'POP_UNDO': {
      if (!state.undoStack.length) return state;
      const [top, ...restUndo] = state.undoStack;
      return {
        ...state,
        undoStack: restUndo,
        redoStack: [action.payload.redoAction, ...state.redoStack].slice(0, 30),
      };
    }
    case 'POP_REDO': {
      if (!state.redoStack.length) return state;
      const [top, ...restRedo] = state.redoStack;
      return {
        ...state,
        redoStack: restRedo,
        undoStack: [action.payload.undoAction, ...state.undoStack].slice(0, 30),
      };
    }

    // ── Goals ──
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
    case 'SET_ACTIVE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => ({
          ...g,
          status: g.id === action.payload ? 'active' : (g.status === 'active' ? 'completed' : g.status),
        })),
      };
    case 'GOAL_COMPLETE_POPUP':
      return { ...state, ui: { ...state.ui, goalCompletePopup: action.payload } };
    case 'CLOSE_GOAL_POPUP':
      return { ...state, ui: { ...state.ui, goalCompletePopup: null } };

    // ── Tasks ──
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'MOVE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, date: action.payload.date } : t) };
    case 'SET_TASK_KANBAN_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? {
          ...t,
          kanbanStatus: action.payload.kanbanStatus,
          completed: action.payload.kanbanStatus === 'done',
          completedAt: action.payload.kanbanStatus === 'done' ? (t.completedAt || new Date().toISOString()) : null,
        } : t),
      };
    case 'DUPLICATE_TASK': {
      return { ...state, tasks: [...state.tasks, action.payload.copy] };
    }
    case 'REORDER_TASKS': {
      const { date, orderedIds } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(t => {
          if (t.date !== date) return t;
          const idx = orderedIds.indexOf(t.id);
          return idx !== -1 ? { ...t, order: idx } : t;
        }),
      };
    }
    case 'TOGGLE_TASK': {
      const { id, xpDelta, levelUpInfo, floatingXP,
              dayHistoryUpdate, achievementsUpdate, xpHistoryDelta,
              hasPerfectDay, hasEarlyBird, goalCompletePopup } = action.payload;

      const newTasks = state.tasks.map(t =>
        t.id === id ? {
          ...t,
          completed: !t.completed,
          kanbanStatus: !t.completed ? 'done' : 'todo',
          completedAt: !t.completed ? new Date().toISOString() : null
        } : t
      );
      const newTotalXP = Math.max(0, state.profile.totalXP + xpDelta);
      const newAchievements = [...state.profile.unlockedAchievements];
      (achievementsUpdate || []).forEach(a => { if (!newAchievements.includes(a)) newAchievements.push(a); });

      const newXpHistory = state.xpHistory ? [...state.xpHistory] : [];
      if (xpHistoryDelta) {
        const ei = newXpHistory.findIndex(e => e.date === xpHistoryDelta.date);
        if (ei !== -1) newXpHistory[ei] = { ...newXpHistory[ei], xp: newXpHistory[ei].xp + xpHistoryDelta.xp };
        else newXpHistory.push({ date: xpHistoryDelta.date, xp: xpHistoryDelta.xp });
      }

      const newDayHistory = { ...state.dayHistory };
      if (dayHistoryUpdate) newDayHistory[dayHistoryUpdate.date] = dayHistoryUpdate.data;

      const newFloating = [...(state.ui.floatingXP || [])];
      if (floatingXP) newFloating.push(floatingXP);

      return {
        ...state,
        tasks: newTasks,
        xpHistory: newXpHistory,
        dayHistory: newDayHistory,
        profile: {
          ...state.profile,
          totalXP: newTotalXP,
          unlockedAchievements: newAchievements,
          hasPerfectDay: state.profile.hasPerfectDay || !!hasPerfectDay,
          hasEarlyBird:  state.profile.hasEarlyBird  || !!hasEarlyBird,
          hasGoalPeriodCompleted: state.profile.hasGoalPeriodCompleted || (achievementsUpdate || []).includes('first_goal_completed'),
        },
        ui: {
          ...state.ui,
          levelUpPopup: levelUpInfo || state.ui.levelUpPopup,
          goalCompletePopup: goalCompletePopup || state.ui.goalCompletePopup,
          floatingXP: newFloating,
        },
      };
    }

    case 'TOGGLE_SUBTASK': {
      const { taskId, subtaskId, xpDelta } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
          };
        }),
        profile: {
          ...state.profile,
          totalXP: Math.max(0, state.profile.totalXP + xpDelta),
        },
      };
    }

    case 'TOGGLE_TASK_ON_DATE': {
      const { id, updatedTask, xpDelta, levelUpInfo, floatingXP,
              dayHistoryUpdate, achievementsUpdate, xpHistoryDelta,
              hasPerfectDay, hasEarlyBird, goalCompletePopup } = action.payload;

      const newTasks = state.tasks.map(t => t.id === id ? updatedTask : t);
      const newTotalXP = Math.max(0, state.profile.totalXP + xpDelta);
      const newAchievements = [...state.profile.unlockedAchievements];
      (achievementsUpdate || []).forEach(a => { if (!newAchievements.includes(a)) newAchievements.push(a); });

      const newXpHistory = state.xpHistory ? [...state.xpHistory] : [];
      if (xpHistoryDelta) {
        const ei = newXpHistory.findIndex(e => e.date === xpHistoryDelta.date);
        if (ei !== -1) newXpHistory[ei] = { ...newXpHistory[ei], xp: newXpHistory[ei].xp + xpHistoryDelta.xp };
        else newXpHistory.push({ date: xpHistoryDelta.date, xp: xpHistoryDelta.xp });
      }

      const newDayHistory = { ...state.dayHistory };
      if (dayHistoryUpdate) newDayHistory[dayHistoryUpdate.date] = dayHistoryUpdate.data;

      const newFloating = [...(state.ui.floatingXP || [])];
      if (floatingXP) newFloating.push(floatingXP);

      return {
        ...state,
        tasks: newTasks,
        xpHistory: newXpHistory,
        dayHistory: newDayHistory,
        profile: {
          ...state.profile,
          totalXP: newTotalXP,
          unlockedAchievements: newAchievements,
          hasPerfectDay: state.profile.hasPerfectDay || !!hasPerfectDay,
          hasEarlyBird:  state.profile.hasEarlyBird  || !!hasEarlyBird,
          hasGoalPeriodCompleted: state.profile.hasGoalPeriodCompleted || (achievementsUpdate || []).includes('first_goal_completed'),
        },
        ui: {
          ...state.ui,
          levelUpPopup: levelUpInfo || state.ui.levelUpPopup,
          goalCompletePopup: goalCompletePopup || state.ui.goalCompletePopup,
          floatingXP: newFloating,
        },
      };
    }

    case 'TOGGLE_SUBTASK_ON_DATE': {
      const { taskId, updatedTask, xpDelta } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
        profile: {
          ...state.profile,
          totalXP: Math.max(0, state.profile.totalXP + xpDelta),
        },
      };
    }

    // ── Trash ──
    case 'MOVE_TO_TRASH':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload.id),
        trash: [action.payload, ...state.trash],
      };
    case 'RESTORE_FROM_TRASH': {
      // FIX BUG-006: strip deletedAt so restored tasks don't carry trash metadata
      const { deletedAt: _deletedAt, ...restoredTask } = action.payload;
      return {
        ...state,
        trash: state.trash.filter(t => t.id !== action.payload.id),
        tasks: [...state.tasks, restoredTask],
      };
    }
    case 'EMPTY_TRASH':
      return { ...state, trash: [] };

    // ── Habits ──
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return { ...state, habits: state.habits.map(h => h.id === action.payload.id ? { ...h, ...action.payload } : h) };
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter(h => h.id !== action.payload),
        habitLogs: state.habitLogs.filter(l => l.habitId !== action.payload),
      };
    case 'TOGGLE_HABIT_LOG': {
      const { log, isCompleted, xpDelta, floatingXP } = action.payload;
      const filtered = state.habitLogs.filter(l => !(l.habitId === log.habitId && l.date === log.date));
      const nextLogs = isCompleted ? [...filtered, log] : filtered;
      const nextTotalXP = Math.max(0, state.profile.totalXP + xpDelta);

      const newFloating = [...(state.ui.floatingXP || [])];
      if (floatingXP) newFloating.push(floatingXP);

      return {
        ...state,
        habitLogs: nextLogs,
        profile: { ...state.profile, totalXP: nextTotalXP },
        ui: { ...state.ui, floatingXP: newFloating },
      };
    }

    // ── Focus Timer ──
    case 'SET_ACTIVE_FOCUS_TIMER':
      return { ...state, activeFocusTimer: { ...state.activeFocusTimer, ...action.payload } };
    case 'LOG_FOCUS_SESSION': {
      const { session, xpDelta, floatingXP } = action.payload;
      const newFloating = [...(state.ui.floatingXP || [])];
      if (floatingXP) newFloating.push(floatingXP);
      return {
        ...state,
        focusSessions: [session, ...state.focusSessions],
        profile: { ...state.profile, totalXP: Math.max(0, state.profile.totalXP + xpDelta) },
        ui: { ...state.ui, floatingXP: newFloating },
      };
    }

    // ── Daily Reviews & Rest Days ──
    case 'SAVE_DAILY_REVIEW': {
      const { review, xpDelta } = action.payload;
      return {
        ...state,
        dailyReviews: { ...state.dailyReviews, [review.date]: review },
        profile: { ...state.profile, totalXP: Math.max(0, state.profile.totalXP + (xpDelta || 0)) },
      };
    }
    case 'TOGGLE_REST_DAY': {
      const { dateStr, isRest } = action.payload;
      const nextRestDays = isRest
        ? [...new Set([...state.restDays, dateStr])]
        : state.restDays.filter(d => d !== dateStr);
      return { ...state, restDays: nextRestDays };
    }

    // ── Quests ──
    case 'SET_QUESTS':
      return { ...state, quests: action.payload };
    case 'UPDATE_QUEST':
      return { ...state, quests: state.quests.map(q => q.id === action.payload.id ? { ...q, ...action.payload } : q) };
    case 'CLAIM_QUEST': {
      const { questId, rewardXP, floatingXP } = action.payload;
      const newFloating = [...(state.ui.floatingXP || [])];
      if (floatingXP) newFloating.push(floatingXP);
      return {
        ...state,
        quests: state.quests.map(q => q.id === questId ? { ...q, claimed: true } : q),
        profile: { ...state.profile, totalXP: state.profile.totalXP + rewardXP },
        ui: { ...state.ui, floatingXP: newFloating },
      };
    }

    // ── XP Shop Purchases ──
    case 'PURCHASE_SHOP_ITEM': {
      const { itemKey, cost, newProfile } = action.payload;
      return {
        ...state,
        profile: newProfile,
      };
    }

    // ── Profile / Settings ──
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    // ── UI ──
    case 'SET_PAGE':
      localStorage.setItem('zl-page', action.payload);
      return { ...state, ui: { ...state.ui, currentPage: action.payload } };
    case 'SET_DATE':
      localStorage.setItem('zl-date', action.payload);
      return { ...state, ui: { ...state.ui, selectedDate: action.payload } };
    case 'SET_DATE_FILTER':
      localStorage.setItem('zl-date-filter', action.payload);
      return { ...state, ui: { ...state.ui, dateFilter: action.payload } };
    case 'SET_TASK_VIEW':
      localStorage.setItem('zl-task-view', action.payload);
      return { ...state, ui: { ...state.ui, taskView: action.payload } };
    case 'SET_CUSTOM_DATE_RANGE':
      localStorage.setItem('zl-custom-start', action.payload.startDate);
      localStorage.setItem('zl-custom-end', action.payload.endDate);
      return { ...state, ui: { ...state.ui, customDateRange: action.payload } };
    case 'SET_SEARCH':
      return { ...state, ui: { ...state.ui, searchQuery: action.payload } };
    case 'SET_FILTER':
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case 'SET_MODAL':
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case 'SET_BULK_SELECTED':
      return { ...state, ui: { ...state.ui, bulkSelectedIds: action.payload } };
    case 'CLOSE_LEVEL_UP':
      return { ...state, ui: { ...state.ui, levelUpPopup: null } };
    case 'ADD_TOAST':
      return { ...state, ui: { ...state.ui, toastQueue: [...state.ui.toastQueue, action.payload] } };
    case 'REMOVE_TOAST':
      return { ...state, ui: { ...state.ui, toastQueue: state.ui.toastQueue.filter(t => t.id !== action.payload) } };
    case 'REMOVE_FLOATING_XP':
      return { ...state, ui: { ...state.ui, floatingXP: state.ui.floatingXP.filter(f => f.id !== action.payload) } };

    // ── Import / Replace ──
    case 'REPLACE_DATA': {
      const p = action.payload;
      return {
        ...state,
        tasks:         p.tasks || [],
        goals:         p.goals || [],
        habits:        p.habits || [],
        habitLogs:     p.habitLogs || [],
        focusSessions: p.focusSessions || [],
        dailyReviews:  p.dailyReviews || {},
        trash:         p.trash || [],
        quests:        p.quests || [],
        restDays:      p.restDays || [],
        profile:       { ...DEFAULT_PROFILE, ...p.profile },
        settings:      { ...DEFAULT_SETTINGS, ...p.settings },
        dayHistory:    p.dayHistory || {},
        xpHistory:     p.xpHistory  || [],
        ui: { ...state.ui },
      };
    }

    case 'MERGE_DATA': {
      const p = action.payload;
      const taskMap = new Map(state.tasks.map(t => [t.id, t]));
      (p.tasks || []).forEach(t => taskMap.set(t.id, t));

      const goalMap = new Map(state.goals.map(g => [g.id, g]));
      (p.goals || []).forEach(g => goalMap.set(g.id, g));

      const habitMap = new Map(state.habits.map(h => [h.id, h]));
      (p.habits || []).forEach(h => habitMap.set(h.id, h));

      return {
        ...state,
        tasks: Array.from(taskMap.values()),
        goals: Array.from(goalMap.values()),
        habits: Array.from(habitMap.values()),
        habitLogs: [...state.habitLogs, ...(p.habitLogs || [])],
        focusSessions: [...state.focusSessions, ...(p.focusSessions || [])],
        dailyReviews: { ...state.dailyReviews, ...(p.dailyReviews || {}) },
        profile: { ...DEFAULT_PROFILE, ...state.profile, ...p.profile },
        settings: { ...DEFAULT_SETTINGS, ...state.settings, ...p.settings },
        dayHistory: { ...state.dayHistory, ...(p.dayHistory || {}) },
        xpHistory: [...state.xpHistory, ...(p.xpHistory || [])],
      };
    }

    default:
      return state;
  }
}

// ─── Provider Component ───────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [dbReady, setDbReady] = useState(false);
  const pendingUndoRef = useRef({});

  // ── Sync Focus Timer from localStorage & Interval ──
  useEffect(() => {
    const saved = localStorage.getItem('zl-focus-timer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.startTime) {
          const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
          const totalSecs = (parsed.durationMinutes || 25) * 60;
          const remaining = Math.max(0, totalSecs - elapsed);
          dispatch({
            type: 'SET_ACTIVE_FOCUS_TIMER',
            payload: { ...parsed, secondsLeft: remaining, isRunning: remaining > 0 }
          });
        } else {
          dispatch({ type: 'SET_ACTIVE_FOCUS_TIMER', payload: parsed });
        }
      } catch (e) {
        console.warn('Failed to parse focus timer:', e);
      }
    }
  }, []);

  // Save focus timer state to localStorage whenever it changes
  useEffect(() => {
    if (state.activeFocusTimer) {
      localStorage.setItem('zl-focus-timer', JSON.stringify(state.activeFocusTimer));
    }
  }, [state.activeFocusTimer]);

  // Handle browser back/forward navigation for /download standalone landing page
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/download') {
          dispatch({ type: 'SET_PAGE', payload: 'download' });
        } else {
          const saved = localStorage.getItem('zl-page') || 'today';
          dispatch({ type: 'SET_PAGE', payload: saved === 'download' ? 'today' : saved });
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Apply Apple Liquid Glass theme, background preset, and glass optical physics to document
  useEffect(() => {
    const root = document.documentElement;
    const themeKey = state.profile.equippedTheme || 'midnight';
    const theme = THEMES[themeKey] || THEMES.midnight;
    const bgPreset = state.settings.bgPreset || 'aurora';
    const blur = state.settings.glassBlur ?? 10;
    const opacity = state.settings.glassOpacity ?? 0.06;
    const rim = state.settings.glassRim ?? 0.65;
    const sheen = state.settings.glassSheen ?? 0.18;
    const tintColor = state.settings.glassTintColor || 'default';
    const refraction = state.settings.glassRefraction !== false;
    const customWallpaper = state.settings.customWallpaper || null;

    root.setAttribute('data-theme', themeKey);
    root.setAttribute('data-bg-preset', bgPreset);
    root.setAttribute('data-refraction', refraction ? 'true' : 'false');
    root.setAttribute('data-tint', tintColor);

    root.style.setProperty('--bg-deep', theme.bgDeep);
    root.style.setProperty('--bg-dark', theme.bgDark);
    root.style.setProperty('--accent-cyan', state.profile.equippedAccent || theme.accent);
    root.style.setProperty('--glass-blur', `${blur}px`);
    root.style.setProperty('--glass-opacity', `${opacity}`);
    root.style.setProperty('--glass-rim', `${rim}`);
    root.style.setProperty('--glass-sheen', `${sheen}`);

    if (customWallpaper) {
      root.style.setProperty('--custom-wallpaper', `url(${customWallpaper})`);
    } else {
      root.style.removeProperty('--custom-wallpaper');
    }

    if (state.settings.reducedMotion) {
      root.classList.add('reduced-motion');
      document.body.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
      document.body.classList.remove('reduced-motion');
    }
  }, [
    state.profile.equippedTheme,
    state.profile.equippedAccent,
    state.settings.bgPreset,
    state.settings.customWallpaper,
    state.settings.glassBlur,
    state.settings.glassOpacity,
    state.settings.glassRim,
    state.settings.glassSheen,
    state.settings.glassTintColor,
    state.settings.glassRefraction,
    state.settings.reducedMotion,
  ]);

  // ── Hydrate from IndexedDB on mount ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      await requestPersistentStorage();
      await migrateLegacyLocalStorageData();
      const data = await loadAllData();

      // Clean up any duplicate tasks caused by legacy seeding or repeated date navigations
      const rawTasks = data.tasks || [];
      const duplicateIdsToDelete = [];
      const seenTaskKeys = new Map();

      for (const t of rawTasks) {
        const normTitle = (t.title || '').trim().toLowerCase();
        const identityKey = `${normTitle}:::${(t.category || '').toLowerCase()}`;
        if (!seenTaskKeys.has(identityKey)) {
          seenTaskKeys.set(identityKey, [t]);
        } else {
          seenTaskKeys.get(identityKey).push(t);
        }
      }

      const keptTasks = [];
      for (const [, group] of seenTaskKeys) {
        if (group.length === 1) {
          keptTasks.push(group[0]);
          continue;
        }

        // Group into clusters that represent duplicate records of the same task
        const clusters = [];
        for (const task of group) {
          const s = task.startDate || task.date;
          const e = task.endDate || task.startDate || task.date;

          let matchedCluster = null;
          for (const cluster of clusters) {
            const cs = cluster.primary.startDate || cluster.primary.date;
            const ce = cluster.primary.endDate || cluster.primary.startDate || cluster.primary.date;

            // Same start/end span OR one is enclosed inside another OR exact same start date
            if ((s === cs && e === ce) || (s >= cs && e <= ce) || (cs >= s && ce <= e) || (s === cs)) {
              matchedCluster = cluster;
              break;
            }
          }

          if (matchedCluster) {
            matchedCluster.tasks.push(task);
          } else {
            clusters.push({ primary: task, tasks: [task] });
          }
        }

        for (const cluster of clusters) {
          if (cluster.tasks.length === 1) {
            keptTasks.push(cluster.tasks[0]);
            continue;
          }

          // Pick the best primary task (prefer widest date range, then completed status):
          const sorted = [...cluster.tasks].sort((a, b) => {
            const aSpan = daysBetween(a.startDate || a.date, a.endDate || a.startDate || a.date);
            const bSpan = daysBetween(b.startDate || b.date, b.endDate || b.startDate || b.date);
            if (aSpan !== bSpan) return bSpan - aSpan; // widest span first
            if (a.completed !== b.completed) return a.completed ? -1 : 1;
            return (a.createdAt || '').localeCompare(b.createdAt || '');
          });

          const primary = sorted[0];
          // Merge completed dates from all cluster tasks so no user progress is lost
          const allMergedDates = Array.from(new Set(
            cluster.tasks.flatMap(t => t.completedDates || (t.completed ? [t.date || t.startDate] : []))
          ));
          primary.completedDates = allMergedDates;
          keptTasks.push(primary);

          for (let i = 1; i < sorted.length; i++) {
            duplicateIdsToDelete.push(sorted[i].id);
          }
        }
      }

      if (duplicateIdsToDelete.length > 0) {
        await dbDeleteTasks(duplicateIdsToDelete);
      }

      // Sanitize any future/next-day tasks that might have completed subtasks
      const todayStr = today();
      let tasksModified = false;
      const sanitizedTasks = keptTasks.map(t => {
        if (t.date > todayStr && !t.completed && (t.subtasks || []).some(s => s.completed)) {
          tasksModified = true;
          return {
            ...t,
            subtasks: t.subtasks.map(s => ({ ...s, completed: false })),
          };
        }
        return t;
      });
      if (tasksModified) {
        await saveTasks(sanitizedTasks);
      }
      data.tasks = sanitizedTasks;

      dispatch({ type: 'HYDRATE', payload: data });
      setDbReady(true);
      performAutoRotatingBackup(data).catch(err => console.warn('Auto rotating backup skipped:', err));

      // Auto-generate Quests for today if not yet created and sync with current tasks
      initQuestsForToday(data.quests, data.tasks, data.focusSessions, dispatch);
    }
    init();
  }, []); // eslint-disable-line

  // ── Focus Timer Actions ─────────────────────────────────────────────────────
  const startFocusTimer = useCallback((minutes = 25, taskId = null, taskTitle = '', mode = 'work') => {
    const startTime = Date.now();
    const durationSeconds = minutes * 60;
    const timerData = {
      isRunning: true,
      taskId,
      taskTitle: taskTitle || (taskId ? state.tasks.find(t => t.id === taskId)?.title : 'Deep Focus'),
      durationMinutes: minutes,
      mode,
      startTime,
      secondsLeft: durationSeconds,
    };
    dispatch({ type: 'SET_ACTIVE_FOCUS_TIMER', payload: timerData });
  }, [state.tasks]);

  const pauseFocusTimer = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_FOCUS_TIMER', payload: { isRunning: false } });
  }, []);

  const resumeFocusTimer = useCallback(() => {
    const elapsedSoFar = (state.activeFocusTimer.durationMinutes * 60) - state.activeFocusTimer.secondsLeft;
    const newStartTime = Date.now() - (elapsedSoFar * 1000);
    dispatch({
      type: 'SET_ACTIVE_FOCUS_TIMER',
      payload: { isRunning: true, startTime: newStartTime }
    });
  }, [state.activeFocusTimer]);

  const resetFocusTimer = useCallback((minutes = 25) => {
    dispatch({
      type: 'SET_ACTIVE_FOCUS_TIMER',
      payload: {
        isRunning: false,
        durationMinutes: minutes,
        secondsLeft: minutes * 60,
        startTime: null,
      }
    });
  }, []);

  const completeFocusSession = useCallback(async () => {
    const timer = state.activeFocusTimer;
    const session = {
      id: generateId(),
      taskId: timer.taskId || null,
      taskTitle: timer.taskTitle || 'Focus Session',
      category: timer.taskId ? state.tasks.find(t => t.id === timer.taskId)?.category : 'Deep Work',
      date: today(),
      durationMinutes: timer.durationMinutes || 25,
      completedAt: new Date().toISOString(),
    };

    soundManager.playTimerBell(state.settings.soundEnabled);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Focus Session Complete! ⚡', {
          body: `Great discipline! You completed ${session.durationMinutes}m of focus and earned +15 XP.`,
          icon: '/icon-192.png',
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }

    const xpDelta = XP_VALUES.FocusSession || 15;
    const floatingXP = { id: generateId(), text: `+${xpDelta} XP Focus`, x: window.innerWidth / 2, y: window.innerHeight / 2 };

    dispatch({
      type: 'LOG_FOCUS_SESSION',
      payload: { session, xpDelta, floatingXP },
    });
    dispatch({
      type: 'SET_ACTIVE_FOCUS_TIMER',
      payload: { isRunning: false, secondsLeft: timer.durationMinutes * 60, startTime: null },
    });

    await saveFocusSession(session);
    await saveProfile({ ...state.profile, totalXP: state.profile.totalXP + xpDelta });
    await saveXPHistoryEntry(today(), xpDelta);

    // Update quest progress if "focus" quest exists
    updateQuestProgress('focus', 1);
  }, [state.activeFocusTimer, state.tasks, state.settings, state.profile]);

  // ── Habit Actions ───────────────────────────────────────────────────────────
  const addHabit = useCallback(async (habitData) => {
    const habit = {
      id: habitData.id || generateId(),
      title: habitData.title || 'Untitled Habit',
      category: habitData.category || 'Health',
      frequency: habitData.frequency || 'daily', // 'daily' | 'weekdays' | 'custom'
      targetDaysPerWeek: Number(habitData.targetDaysPerWeek) || 7,
      color: habitData.color || '#22d3ee',
      icon: habitData.icon || '✨',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_HABIT', payload: habit });
    await saveHabit(habit);
  }, []);

  const updateHabit = useCallback(async (habitData) => {
    dispatch({ type: 'UPDATE_HABIT', payload: habitData });
    await saveHabit(habitData);
  }, []);

  const deleteHabit = useCallback(async (id) => {
    dispatch({ type: 'DELETE_HABIT', payload: id });
    await dbDeleteHabit(id);
  }, []);

  const toggleHabitLog = useCallback(async (habitId, dateStr = today()) => {
    const existing = state.habitLogs.find(l => l.habitId === habitId && l.date === dateStr);
    const isCompleted = !existing?.completed;

    // Organic liquid bubble pop sound & mobile haptics!
    if (isCompleted) {
      soundManager.playBubblePop(state.settings.soundEnabled);
      soundManager.triggerHaptic(state.settings.hapticsEnabled);
    }

    const log = { habitId, date: dateStr, completed: isCompleted };
    const xpDelta = isCompleted ? (XP_VALUES.HabitCheck || 5) : -(XP_VALUES.HabitCheck || 5);
    const floatingXP = isCompleted
      ? { id: generateId(), text: `+${XP_VALUES.HabitCheck || 5} XP`, x: window.innerWidth / 2, y: window.innerHeight / 2 }
      : null;

    dispatch({
      type: 'TOGGLE_HABIT_LOG',
      payload: { log, isCompleted, xpDelta, floatingXP },
    });

    await saveHabitLog(log);
    const newTotalXP = Math.max(0, state.profile.totalXP + xpDelta);
    await saveProfile({ ...state.profile, totalXP: newTotalXP });
    if (xpDelta !== 0) await saveXPHistoryEntry(dateStr, xpDelta);

    // Update quest progress
    if (isCompleted) updateQuestProgress('habit', 1);
  }, [state.habitLogs, state.settings, state.profile]);

  // ── Daily Review Actions ────────────────────────────────────────────────────
  const saveDailyReviewAction = useCallback(async (reviewData) => {
    const review = {
      date: reviewData.date || today(),
      mood: reviewData.mood || 3, // 1-5
      energy: reviewData.energy || 3, // 1-5
      reflection: reviewData.reflection || '',
      wentWell: reviewData.wentWell || '',
      toImprove: reviewData.toImprove || '',
      completedAt: new Date().toISOString(),
    };

    const alreadyReviewed = !!state.dailyReviews[review.date];
    const xpDelta = alreadyReviewed ? 0 : (XP_VALUES.DailyReview || 10);

    dispatch({
      type: 'SAVE_DAILY_REVIEW',
      payload: { review, xpDelta },
    });

    await saveDailyReview(review);
    if (xpDelta > 0) {
      await saveProfile({ ...state.profile, totalXP: state.profile.totalXP + xpDelta });
      await saveXPHistoryEntry(review.date, xpDelta);
    }
  }, [state.dailyReviews, state.profile]);

  // ── Rest Days & Streak Freeze Actions ───────────────────────────────────────
  const toggleRestDay = useCallback(async (dateStr) => {
    const isRest = !state.restDays.includes(dateStr);
    dispatch({ type: 'TOGGLE_REST_DAY', payload: { dateStr, isRest } });
    await toggleRestDayDb(dateStr, isRest);
  }, [state.restDays]);

  const useStreakFreeze = useCallback(async () => {
    if (state.profile.streakFreezes <= 0) return false;
    const newProfile = { ...state.profile, streakFreezes: state.profile.streakFreezes - 1 };
    dispatch({ type: 'UPDATE_PROFILE', payload: newProfile });
    await saveProfile(newProfile);
    dispatch({
      type: 'ADD_TOAST',
      payload: { id: generateId(), message: '❄️ Streak Freeze activated! Your streak is protected.', type: 'info' }
    });
    return true;
  }, [state.profile]);

  // ── XP Shop Purchases ───────────────────────────────────────────────────────
  const purchaseShopItem = useCallback(async (item) => {
    // Check available XP: totalXP - spentXP
    const availableXP = Math.max(0, state.profile.totalXP - (state.profile.spentXP || 0));
    if (availableXP < item.cost) {
      dispatch({
        type: 'ADD_TOAST',
        payload: { id: generateId(), message: `Need ${item.cost - availableXP} more XP to unlock!`, type: 'error' }
      });
      return false;
    }

    soundManager.playVictoryChord(state.settings.soundEnabled);

    const purchased = [...(state.profile.purchasedItems || [])];
    if (!purchased.includes(item.id)) purchased.push(item.id);

    const updatedProfile = {
      ...state.profile,
      spentXP: (state.profile.spentXP || 0) + item.cost, // Level never decreases because level is computed from totalXP!
      purchasedItems: purchased,
    };

    if (item.type === 'theme') updatedProfile.equippedTheme = item.value;
    if (item.type === 'frame') updatedProfile.equippedFrame = item.value;
    if (item.type === 'accent') updatedProfile.equippedAccent = item.value;
    if (item.type === 'freeze') updatedProfile.streakFreezes = (state.profile.streakFreezes || 0) + 1;

    dispatch({
      type: 'PURCHASE_SHOP_ITEM',
      payload: { itemKey: item.id, cost: item.cost, newProfile: updatedProfile }
    });

    await saveProfile(updatedProfile);
    dispatch({
      type: 'ADD_TOAST',
      payload: { id: generateId(), message: `Unlocked: ${item.name}! ✨`, type: 'success' }
    });
    return true;
  }, [state.profile, state.settings]);

  // ── Trash & Soft Delete ────────────────────────────────────────────────────
  const moveToTrash = useCallback(async (task) => {
    dispatch({ type: 'MOVE_TO_TRASH', payload: task });
    await dbMoveTaskToTrash(task);
    dispatch({
      type: 'ADD_TOAST',
      payload: { id: generateId(), message: `Moved "${task.title}" to Recycle Bin`, type: 'info' }
    });
  }, []);

  const restoreFromTrash = useCallback(async (task) => {
    dispatch({ type: 'RESTORE_FROM_TRASH', payload: task });
    await dbRestoreTaskFromTrash(task);
    dispatch({
      type: 'ADD_TOAST',
      payload: { id: generateId(), message: `Restored "${task.title}"!`, type: 'success' }
    });
  }, []);

  const emptyTrash = useCallback(async () => {
    dispatch({ type: 'EMPTY_TRASH' });
    await emptyTrashDb();
  }, []);

  // ── Quests Tracking (Directly Connected to Real Tasks & Sessions) ────────────
  const syncQuestsWithData = useCallback(async (currentTasks = state.tasks, currentSessions = state.focusSessions) => {
    const todayStr = today();
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const mondayStr = formatDate(monday);

    const todayCompleted = currentTasks.filter(t => t.date === todayStr && t.completed);
    const todayHighCompleted = todayCompleted.filter(t => t.priority === 'High');
    const todaySessions = (currentSessions || []).filter(s => s && s.date === todayStr);
    const weekCompleted = currentTasks.filter(t => t.completed && t.date >= mondayStr && t.date <= todayStr);

    let xpAdjustment = 0;
    let hasChanges = false;

    const updated = state.quests.map(q => {
      let actualCount = q.currentCount || 0;
      if (q.type === 'task' || q.id.includes('daily_3_tasks') || q.id.includes('task')) {
        actualCount = todayCompleted.length;
      } else if (q.type === 'high_task' || q.id.includes('daily_high') || q.id.includes('high')) {
        actualCount = todayHighCompleted.length;
      } else if (q.type === 'focus' || q.id.includes('daily_focus') || q.id.includes('focus')) {
        actualCount = todaySessions.length;
      } else if (q.type === 'weekly' || q.id.includes('weekly')) {
        actualCount = weekCompleted.length;
      }

      const target = q.targetCount || 1;
      const isDone = actualCount >= target;

      // If user undid a task so the requirement is no longer met:
      if (!isDone) {
        if (q.claimed) {
          xpAdjustment -= (q.rewardXP || 25);
          hasChanges = true;
        }
        if (q.completed || q.claimed || q.currentCount !== actualCount) {
          hasChanges = true;
        }
        return {
          ...q,
          currentCount: actualCount,
          completed: false,
          claimed: false, // Reverts to incomplete / in progress!
        };
      }

      // Requirement is met
      if (q.currentCount !== actualCount || !q.completed) {
        hasChanges = true;
      }
      return {
        ...q,
        currentCount: actualCount,
        completed: true,
        claimed: q.claimed || false,
      };
    });

    if (hasChanges) {
      dispatch({ type: 'SET_QUESTS', payload: updated });
      await saveQuests(updated);

      if (xpAdjustment !== 0) {
        const nextXP = Math.max(0, state.profile.totalXP + xpAdjustment);
        dispatch({ type: 'UPDATE_PROFILE', payload: { totalXP: nextXP } });
        await saveProfile({ ...state.profile, totalXP: nextXP });
      }
    }
  }, [state.quests, state.tasks, state.focusSessions, state.profile]);

  const updateQuestProgress = useCallback(async (type, amount = 1) => {
    await syncQuestsWithData();
  }, [syncQuestsWithData]);

  const claimQuestReward = useCallback(async (quest) => {
    if (!quest.completed || quest.claimed) return;
    soundManager.playVictoryChord(state.settings.soundEnabled);

    const rewardXP = quest.rewardXP || 25;
    const floatingXP = { id: generateId(), text: `+${rewardXP} XP Quest`, x: window.innerWidth / 2, y: window.innerHeight / 2 };

    dispatch({
      type: 'CLAIM_QUEST',
      payload: { questId: quest.id, rewardXP, floatingXP }
    });

    const updatedQuest = { ...quest, claimed: true };
    await saveQuest(updatedQuest);
    await saveProfile({ ...state.profile, totalXP: state.profile.totalXP + rewardXP });
    await saveXPHistoryEntry(today(), rewardXP);
  }, [state.settings, state.profile]);

  // ── Undo / Redo System ─────────────────────────────────────────────────────
  const pushUndoAction = useCallback((action) => {
    dispatch({ type: 'PUSH_UNDO', payload: action });
  }, []);

  const undo = useCallback(async () => {
    if (!state.undoStack.length) return;
    const action = state.undoStack[0];
    let nextTasks = state.tasks;
    if (action.type === 'TASK_DELETE') {
      await saveTask(action.task);
      nextTasks = [...state.tasks, action.task];
      dispatch({ type: 'ADD_TASK', payload: action.task });
    } else if (action.type === 'TASK_ADD') {
      await dbDeleteTask(action.taskId);
      nextTasks = state.tasks.filter(t => t.id !== action.taskId);
      dispatch({ type: 'DELETE_TASK', payload: action.taskId });
    } else if (action.type === 'TASK_UPDATE' || action.type === 'TASK_TOGGLE') {
      await saveTask(action.prevTask);
      nextTasks = state.tasks.map(t => t.id === action.prevTask.id ? action.prevTask : t);
      dispatch({ type: 'UPDATE_TASK', payload: action.prevTask });
    }
    dispatch({ type: 'POP_UNDO', payload: { redoAction: action } });
    await syncQuestsWithData(nextTasks);
  }, [state.undoStack, state.tasks, syncQuestsWithData]);

  const redo = useCallback(async () => {
    if (!state.redoStack.length) return;
    const action = state.redoStack[0];
    let nextTasks = state.tasks;
    if (action.type === 'TASK_DELETE') {
      await dbDeleteTask(action.task.id);
      nextTasks = state.tasks.filter(t => t.id !== action.task.id);
      dispatch({ type: 'DELETE_TASK', payload: action.task.id });
    } else if (action.type === 'TASK_ADD') {
      await saveTask(action.task);
      nextTasks = [...state.tasks, action.task];
      dispatch({ type: 'ADD_TASK', payload: action.task });
    } else if (action.type === 'TASK_UPDATE' || action.type === 'TASK_TOGGLE') {
      const taskToApply = action.nextTask || action.task;
      if (taskToApply) {
        await saveTask(taskToApply);
        nextTasks = state.tasks.map(t => t.id === taskToApply.id ? taskToApply : t);
        dispatch({ type: 'UPDATE_TASK', payload: taskToApply });
      }
    }
    dispatch({ type: 'POP_REDO', payload: { undoAction: action } });
    await syncQuestsWithData(nextTasks);
  }, [state.redoStack, state.tasks, syncQuestsWithData]);

  // Global Keyboard Shortcuts (Ctrl+K, N, /, T, ?, Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input or textarea
      const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL', payload: { commandPaletteOpen: !state.ui.commandPaletteOpen } });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (inInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const quickAddInput = document.getElementById('smart-quick-add-input');
        if (quickAddInput) quickAddInput.focus();
      } else if (e.key === '/') {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL', payload: { commandPaletteOpen: true } });
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        dispatch({ type: 'SET_PAGE', payload: 'today' });
        dispatch({ type: 'SET_DATE', payload: today() });
      } else if (e.key === '?') {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL', payload: { shortcutsModalOpen: true } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.ui.commandPaletteOpen, undo, redo]);

  // ── Goal Period Actions ────────────────────────────────────────────────────
  const addGoal = useCallback(async (goalData) => {
    const goal = {
      id:          goalData.id || generateId(),
      name:        goalData.name || 'New Goal Period',
      startDate:   goalData.startDate || today(),
      endDate:     goalData.endDate || addDays(today(), 30),
      targetType:  goalData.targetType || 'tasks',
      targetValue: Number(goalData.targetValue) || 100,
      color:       goalData.color || '#22d3ee',
      status:      goalData.status || (state.goals.some(g => g.status === 'active') ? 'upcoming' : 'active'),
      createdAt:   new Date().toISOString(),
    };
    dispatch({ type: 'ADD_GOAL', payload: goal });
    await saveGoal(goal);
  }, [state.goals]);

  const updateGoal = useCallback(async (goalData) => {
    dispatch({ type: 'UPDATE_GOAL', payload: goalData });
    await saveGoal(goalData);
  }, []);

  const deleteGoal = useCallback(async (id) => {
    dispatch({ type: 'DELETE_GOAL', payload: id });
    await dbDeleteGoal(id);
  }, []);

  const setActiveGoal = useCallback(async (id) => {
    dispatch({ type: 'SET_ACTIVE_GOAL', payload: id });
    const updatedGoals = state.goals.map(g => ({
      ...g,
      status: g.id === id ? 'active' : (g.status === 'active' ? 'completed' : g.status),
    }));
    await saveGoals(updatedGoals);
  }, [state.goals]);

  const closeGoalPopup = useCallback(() => {
    dispatch({ type: 'CLOSE_GOAL_POPUP' });
  }, []);

  // ── Task Actions ───────────────────────────────────────────────────────────
  const addTask = useCallback(async (taskData) => {
    const task = buildTask(taskData, state.tasks);
    dispatch({ type: 'ADD_TASK', payload: task });
    pushUndoAction({ type: 'TASK_ADD', taskId: task.id, task });
    await saveTask(task);
    return task;
  }, [state.tasks, pushUndoAction]);

  const updateTask = useCallback(async (taskData) => {
    const prev = state.tasks.find(t => t.id === taskData.id);
    if (prev) pushUndoAction({ type: 'TASK_UPDATE', prevTask: prev, nextTask: taskData });
    dispatch({ type: 'UPDATE_TASK', payload: taskData });
    await saveTask(taskData);
  }, [state.tasks, pushUndoAction]);

  const deleteTask = useCallback(async (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    // Use soft trash retention for 30 days
    await moveToTrash(task);
  }, [state.tasks, moveToTrash]);

  const duplicateTask = useCallback(async (id) => {
    const src = state.tasks.find(t => t.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: generateId(),
      title: `${src.title} (copy)`,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: (src.subtasks || []).map(s => ({ ...s, id: generateId(), completed: false })),
      order: state.tasks.filter(t => t.date === src.date).length,
    };
    dispatch({ type: 'DUPLICATE_TASK', payload: { id, copy } });
    await saveTask(copy);
  }, [state.tasks]);

  const moveTask = useCallback(async (id, date) => {
    dispatch({ type: 'MOVE_TASK', payload: { id, date } });
    const task = state.tasks.find(t => t.id === id);
    if (task) await saveTask({ ...task, date, startDate: date, endDate: date });
  }, [state.tasks]);

  const setTaskKanbanStatus = useCallback(async (id, kanbanStatus) => {
    dispatch({ type: 'SET_TASK_KANBAN_STATUS', payload: { id, kanbanStatus } });
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      const isDone = kanbanStatus === 'done';
      await saveTask({ ...task, kanbanStatus, completed: isDone, completedAt: isDone ? (task.completedAt || new Date().toISOString()) : null });
    }
  }, [state.tasks]);

  const reorderTasks = useCallback(async (date, orderedIds) => {
    dispatch({ type: 'REORDER_TASKS', payload: { date, orderedIds } });
    const tasksToUpdate = state.tasks
      .filter(t => t.date === date)
      .map(t => ({ ...t, order: orderedIds.indexOf(t.id) }));
    await saveTasks(tasksToUpdate);
  }, [state.tasks]);

  // ── Checkbox Toggle with Liquid Bubble Sound & XP ──────────────────────────
  const toggleTask = useCallback(async (id, customDate = null) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const targetDate = customDate || state.ui.selectedDate || task.date || today();
    const isMultiDay = (task.startDate && task.endDate && task.startDate !== task.endDate) || (task.repeat && task.repeat !== 'none');

    // Current completed dates list
    let currentCompletedDates = Array.isArray(task.completedDates)
      ? [...task.completedDates]
      : (task.completed ? [task.date || task.startDate || today()] : []);

    const wasCompletedOnDate = currentCompletedDates.includes(targetDate);
    const nowCompleting = !wasCompletedOnDate;

    let newCompletedDates;
    if (nowCompleting) {
      newCompletedDates = Array.from(new Set([...currentCompletedDates, targetDate]));
    } else {
      newCompletedDates = currentCompletedDates.filter(d => d !== targetDate);
    }

    // Organic procedural bubble sound & mobile haptics!
    if (nowCompleting) {
      soundManager.playBubblePop(state.settings.soundEnabled);
      soundManager.triggerHaptic(state.settings.hapticsEnabled);
    }

    const baseXP = XP_VALUES[task.priority] || 10;
    let xpDelta = nowCompleting ? baseXP : -baseXP;

    const dateTasks = state.tasks.filter(t => isTaskScheduledForDate(t, targetDate));
    const wasAllDone = dateTasks.every(t => isTaskCompletedOnDate(t, targetDate));
    let bonusXP = 0;
    let hasPerfectDay = false;

    if (nowCompleting) {
      const nowAllDone = dateTasks.every(t => t.id === id || isTaskCompletedOnDate(t, targetDate));
      if (nowAllDone && !wasAllDone && dateTasks.length > 0) {
        bonusXP += XP_VALUES.AllTasksBonus;
        hasPerfectDay = true;
      }
    } else {
      if (wasAllDone && dateTasks.length > 0) {
        bonusXP -= XP_VALUES.AllTasksBonus;
      }
    }
    xpDelta += bonusXP;

    // Check active goal progress and period completion
    let goalCompletePopup = null;
    const activeGoal = state.goals.find(g => g.status === 'active');
    if (activeGoal && nowCompleting) {
      const tasksInGoal = state.tasks.filter(t =>
        (isTaskCompletedOnDate(t, targetDate) || t.id === id) &&
        targetDate >= activeGoal.startDate &&
        targetDate <= activeGoal.endDate
      ).length;

      if (tasksInGoal >= activeGoal.targetValue && !activeGoal.bonusAwarded) {
        xpDelta += XP_VALUES.GoalPeriodBonus;
        goalCompletePopup = {
          goal: activeGoal,
          tasksCompleted: tasksInGoal,
          targetValue: activeGoal.targetValue,
          bonusXP: XP_VALUES.GoalPeriodBonus,
        };
        saveGoal({ ...activeGoal, bonusAwarded: true, status: 'completed' });
      }
    }

    const newTotalXP = Math.max(0, state.profile.totalXP + xpDelta);
    const oldLevel   = getLevelFromXP(state.profile.totalXP);
    const newLevel   = getLevelFromXP(newTotalXP);

    let levelUpInfo = null;
    if (newLevel > oldLevel) {
      levelUpInfo = { level: newLevel, rank: getRankTitle(newLevel) };
      soundManager.playVictoryChord(state.settings.soundEnabled);
    }

    let floatingXP = null;
    if (xpDelta > 0) {
      floatingXP = { id: generateId(), text: `+${xpDelta} XP`, x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    // Day history update
    const currentCompleted = dateTasks.filter(t => t.id === id ? nowCompleting : isTaskCompletedOnDate(t, targetDate)).length;
    const dayHistoryUpdate = {
      date: targetDate,
      data: {
        totalTasks:     dateTasks.length,
        completedTasks: currentCompleted,
        xpEarned:       Math.max(0, (state.dayHistory[targetDate]?.xpEarned || 0) + xpDelta),
      },
    };

    const hasEarlyBird = nowCompleting && new Date().getHours() < 9;
    const newDayHistoryState = { ...state.dayHistory, [targetDate]: dayHistoryUpdate.data };
    const stats = computeStats(
      state.tasks.map(t => t.id === id ? { ...t, completedDates: newCompletedDates } : t),
      newDayHistoryState,
      newTotalXP,
      state.goals,
      state.restDays
    );

    const achievementsUpdate = checkAchievements(stats, state.profile.unlockedAchievements, hasPerfectDay, hasEarlyBird);
    const xpHistoryDelta = nowCompleting ? { date: targetDate, xp: baseXP } : { date: targetDate, xp: -baseXP };

    const isCompletedPrimary = isMultiDay ? newCompletedDates.includes(today()) : nowCompleting;

    const updatedTask = {
      ...task,
      completedDates: newCompletedDates,
      completed: isCompletedPrimary,
      kanbanStatus: nowCompleting ? 'done' : 'todo',
      completedAt: nowCompleting ? new Date().toISOString() : null
    };

    const nextTasks = state.tasks.map(t => t.id === id ? updatedTask : t);
    pushUndoAction({ type: 'TASK_TOGGLE', prevTask: task, nextTask: updatedTask });

    dispatch({
      type: 'TOGGLE_TASK_ON_DATE',
      payload: {
        id,
        targetDate,
        updatedTask,
        xpDelta,
        levelUpInfo,
        floatingXP,
        dayHistoryUpdate,
        achievementsUpdate,
        xpHistoryDelta,
        hasPerfectDay,
        hasEarlyBird,
        goalCompletePopup,
      },
    });

    const updatedProfile = {
      ...state.profile,
      totalXP: newTotalXP,
      unlockedAchievements: [...new Set([...state.profile.unlockedAchievements, ...achievementsUpdate])],
      hasPerfectDay: state.profile.hasPerfectDay || hasPerfectDay,
      hasEarlyBird:  state.profile.hasEarlyBird  || hasEarlyBird,
      hasGoalPeriodCompleted: state.profile.hasGoalPeriodCompleted || achievementsUpdate.includes('first_goal_completed'),
    };

    await Promise.all([
      saveTask(updatedTask),
      saveProfile(updatedProfile),
      saveDayHistory(targetDate, dayHistoryUpdate.data),
      saveXPHistoryEntry(targetDate, xpHistoryDelta.xp),
    ]);

    await syncQuestsWithData(nextTasks);
  }, [state.tasks, state.dayHistory, state.profile, state.goals, state.settings, state.restDays, state.ui.selectedDate, syncQuestsWithData, pushUndoAction]);

  // ── Bulk Actions ───────────────────────────────────────────────────────────
  const bulkCompleteTasks = useCallback(async (ids) => {
    soundManager.playBubblePop(state.settings.soundEnabled);
    for (const id of ids) {
      const task = state.tasks.find(t => t.id === id);
      if (task && !isTaskCompletedOnDate(task, state.ui.selectedDate)) {
        await toggleTask(id);
      }
    }
    dispatch({ type: 'SET_BULK_SELECTED', payload: [] });
  }, [state.settings, state.tasks, state.ui.selectedDate, toggleTask]);

  const bulkDeleteTasks = useCallback(async (ids) => {
    for (const id of ids) {
      const task = state.tasks.find(t => t.id === id);
      if (task) await moveToTrash(task);
    }
    dispatch({ type: 'SET_BULK_SELECTED', payload: [] });
  }, [state.tasks, moveToTrash]);

  const bulkMoveTasks = useCallback(async (ids, targetDate) => {
    for (const id of ids) {
      await moveTask(id, targetDate);
    }
    dispatch({ type: 'SET_BULK_SELECTED', payload: [] });
  }, [moveTask]);

  const bulkCategorizeTasks = useCallback(async (ids, category) => {
    for (const id of ids) {
      const task = state.tasks.find(t => t.id === id);
      if (task) await updateTask({ ...task, category });
    }
    dispatch({ type: 'SET_BULK_SELECTED', payload: [] });
  }, [state.tasks, updateTask]);

  const toggleSubtask = useCallback(async (taskId, subtaskId, customDate = null) => {
    let task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetDate = customDate || state.ui.selectedDate || task.date || today();
    const isMultiDay = (task.startDate && task.endDate && task.startDate !== task.endDate) || (task.repeat && task.repeat !== 'none');

    const subtask = (task.subtasks || []).find(s => s.id === subtaskId);
    if (!subtask) return;

    let currentCompletedDates = Array.isArray(subtask.completedDates)
      ? [...subtask.completedDates]
      : (subtask.completed ? [task.date || today()] : []);

    const wasDone = currentCompletedDates.includes(targetDate);
    const nowCompleting = !wasDone;

    let newCompletedDates;
    if (nowCompleting) {
      newCompletedDates = Array.from(new Set([...currentCompletedDates, targetDate]));
    } else {
      newCompletedDates = currentCompletedDates.filter(d => d !== targetDate);
    }

    if (nowCompleting) {
      soundManager.playBubblePop(state.settings.soundEnabled);
      soundManager.triggerHaptic(state.settings.hapticsEnabled);
    }

    const xpDelta = nowCompleting ? XP_VALUES.Subtask : -XP_VALUES.Subtask;

    const updatedSubtasks = (task.subtasks || []).map(s => {
      if (s.id !== subtaskId) return s;
      return {
        ...s,
        completedDates: newCompletedDates,
        completed: isMultiDay ? newCompletedDates.includes(today()) : nowCompleting,
      };
    });

    const updatedTask = {
      ...task,
      subtasks: updatedSubtasks,
    };

    dispatch({ type: 'TOGGLE_SUBTASK_ON_DATE', payload: { taskId, updatedTask, xpDelta } });

    const newTotalXP = Math.max(0, state.profile.totalXP + xpDelta);
    await Promise.all([
      saveTask(updatedTask),
      saveProfile({ ...state.profile, totalXP: newTotalXP }),
    ]);
  }, [state.tasks, state.profile, state.settings, state.ui.selectedDate]);

  // Apply Routine Template
  const applyRoutineTemplate = useCallback(async (routineKey) => {
    // FIX BUG-002: ROUTINE_TEMPLATES is an array, use .find() not bracket notation
    const template = ROUTINE_TEMPLATES.find(t => t.id === routineKey);
    if (!template) return;
    const createdTasks = [];
    for (const t of template.tasks) {
      const task = await addTask({
        ...t,
        date: today(),
        category: template.category,
      });
      createdTasks.push(task);
    }
    dispatch({
      type: 'ADD_TOAST',
      payload: { id: generateId(), message: `Applied ${template.title} (+${createdTasks.length} tasks)`, type: 'success' }
    });
    dispatch({ type: 'SET_MODAL', payload: { routineModalOpen: false } });
  }, [addTask]);

  const updateProfile = useCallback(async (data) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: data });
    await saveProfile({ ...state.profile, ...data });
  }, [state.profile]);

  const updateSettings = useCallback(async (data) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: data });
    await saveSettings({ ...state.settings, ...data });
  }, [state.settings]);

  // ── Import / Export ─────────────────────────────────────────────────────────
  const exportData = useCallback(async () => {
    const exportPayload = {
      tasks:         state.tasks,
      goals:         state.goals,
      habits:        state.habits,
      habitLogs:     state.habitLogs,
      focusSessions: state.focusSessions,
      dailyReviews:  state.dailyReviews,
      trash:         state.trash,
      quests:        state.quests,
      restDays:      state.restDays,
      profile:       state.profile,
      settings:      state.settings,
      dayHistory:    state.dayHistory,
      xpHistory:     state.xpHistory,
      exportedAt:    new Date().toISOString(),
      version:       3,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `zorolevel-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const newSettings = { ...state.settings, lastBackupReminder: new Date().toISOString() };
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    await saveSettings(newSettings);
  }, [state]);

  const importAndReplace = useCallback(async (importedData) => {
    dispatch({ type: 'REPLACE_DATA', payload: importedData });
    await replaceAllData(importedData);
  }, []);

  const importAndMerge = useCallback(async (importedData) => {
    dispatch({ type: 'MERGE_DATA', payload: importedData });
    await mergeAllData(importedData);
  }, []);

  const loadDemo = useCallback(async () => {
    const demo = generateDemoData();
    const demoData = {
      tasks:         demo.tasks,
      goals:         demo.goals,
      habits:        demo.habits || [],
      habitLogs:     demo.habitLogs || [],
      focusSessions: demo.focusSessions || [],
      dailyReviews:  demo.dailyReviews || {},
      trash:         [],
      quests:        demo.quests || [],
      restDays:      demo.restDays || [],
      profile:       { ...DEFAULT_PROFILE, totalXP: demo.totalXP, unlockedAchievements: ['first_task', 'ten_tasks', 'hundred_tasks', 'streak_7', 'perfect_day', 'first_goal_completed'] },
      settings:      { ...DEFAULT_SETTINGS, username: 'Zoro' },
      dayHistory:    demo.dayHistory,
      xpHistory:     Object.entries(demo.dayHistory).map(([date, d]) => ({ date, xp: d.xpEarned || 0 })),
    };
    dispatch({ type: 'REPLACE_DATA', payload: demoData });
    await replaceAllData(demoData);
  }, []);

  const resetAllData = useCallback(async () => {
    localStorage.removeItem('zl-focus-timer');
    const resetData = {
      tasks: [],
      goals: [],
      habits: [],
      habitLogs: [],
      focusSessions: [],
      dailyReviews: {},
      trash: [],
      quests: [],
      restDays: [],
      profile: { ...DEFAULT_PROFILE },
      settings: { ...state.settings },
      dayHistory: {},
      xpHistory: [],
    };
    dispatch({ type: 'REPLACE_DATA', payload: resetData });
    await replaceAllData(resetData);
    dispatch({
      type: 'ADD_TOAST',
      payload: { id: generateId(), message: '✨ All tasks and history deleted. Reset to Level 1!', type: 'success' },
    });
  }, [state.settings]);

  // ── Setters & Controls ──────────────────────────────────────────────────────
  const setDateFilter      = useCallback((filter) => dispatch({ type: 'SET_DATE_FILTER', payload: filter }), []);
  const setTaskView        = useCallback((view)   => dispatch({ type: 'SET_TASK_VIEW', payload: view }), []);
  const setCustomDateRange = useCallback((range)  => dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: range }), []);
  const removeToast        = useCallback((id)     => dispatch({ type: 'REMOVE_TOAST', payload: id }), []);
  const removeFloatingXP   = useCallback((id)     => dispatch({ type: 'REMOVE_FLOATING_XP', payload: id }), []);
  const setPage = useCallback((p) => {
    dispatch({ type: 'SET_PAGE', payload: p });
    localStorage.setItem('zl-page', p);
    if (typeof window !== 'undefined') {
      if (p === 'download') {
        if (window.location.pathname !== '/download') {
          window.history.pushState({ page: 'download' }, '', '/download');
        }
      } else {
        if (window.location.pathname === '/download') {
          window.history.pushState({ page: p }, '', '/');
        }
      }
    }
  }, []);
  const setDate            = useCallback((d)      => {
    dispatch({ type: 'SET_DATE', payload: d });
  }, []);
  const closeLevelUp       = useCallback(()       => dispatch({ type: 'CLOSE_LEVEL_UP' }), []);
  const setSearch          = useCallback((q)      => dispatch({ type: 'SET_SEARCH', payload: q }), []);
  const setFilter          = useCallback((f)      => dispatch({ type: 'SET_FILTER', payload: f }), []);
  const setModal           = useCallback((m)      => dispatch({ type: 'SET_MODAL', payload: m }), []);
  const setBulkSelected    = useCallback((ids)    => dispatch({ type: 'SET_BULK_SELECTED', payload: ids }), []);
  const setAppLocked       = useCallback((locked) => dispatch({ type: 'SET_APP_LOCKED', payload: locked }), []);

  const value = {
    state, dispatch, dbReady,
    addGoal, updateGoal, deleteGoal, setActiveGoal, closeGoalPopup,
    addTask, updateTask, deleteTask, duplicateTask, moveTask, setTaskKanbanStatus,
    reorderTasks, toggleTask, toggleSubtask, updateProfile, updateSettings,
    exportData, importAndReplace, importAndMerge, loadDemo, resetAllData,
    setDateFilter, setTaskView, setCustomDateRange,
    removeToast, removeFloatingXP, setPage, setDate, closeLevelUp, setSearch, setFilter, setModal,
    setBulkSelected, bulkCompleteTasks, bulkDeleteTasks, bulkMoveTasks, bulkCategorizeTasks,
    // Focus Timer
    startFocusTimer, pauseFocusTimer, resumeFocusTimer, resetFocusTimer, completeFocusSession,
    // Habits
    addHabit, updateHabit, deleteHabit, toggleHabitLog,
    // Reviews & Rest Days
    saveDailyReviewAction, toggleRestDay, useStreakFreeze,
    // Quests & Shop
    claimQuestReward, purchaseShopItem,
    // Trash & Undo
    moveToTrash, restoreFromTrash, emptyTrash, undo, redo,
    // Routines & AppLock
    applyRoutineTemplate, setAppLocked,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildTask(taskData, existingTasks) {
  const startDate = taskData.startDate || taskData.date || today();
  const endDate = taskData.endDate || startDate;
  const sDate = startDate;
  const eDate = endDate >= sDate ? endDate : sDate;
  return {
    id:               taskData.id || generateId(),
    title:            taskData.title || 'Untitled',
    description:      taskData.description || '',
    priority:         taskData.priority || 'Medium',
    category:         taskData.category || 'Personal',
    date:             sDate,
    startDate:        sDate,
    endDate:          eDate,
    time:             taskData.time || '',
    repeat:           taskData.repeat || 'none',
    estimatedMinutes: Number(taskData.estimatedMinutes) || 30,
    kanbanStatus:     taskData.kanbanStatus || (taskData.completed ? 'done' : 'todo'),
    subtasks:         (taskData.subtasks || []).map(s => ({
      id: s.id || generateId(), title: s.title || s, completed: s.completed || false,
    })),
    completed:        taskData.completed || false,
    completedAt:      taskData.completedAt || null,
    createdAt:        taskData.createdAt || new Date().toISOString(),
    order:            taskData.order ?? existingTasks.filter(t => t.date === sDate).length,
  };
}

// seedRepeatTasks is deprecated: All scheduled, date-range, and repeating tasks
// are rendered dynamically and efficiently via isTaskScheduledForDate(task, date).
// Navigating dates never writes or clones task entities into the database.
async function seedRepeatTasks() {
  // Safe no-op to prevent any duplicate task generation
}

function initQuestsForToday(existingQuests, tasks = [], focusSessions = [], dispatch) {
  const todayStr = today();
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const mondayStr = formatDate(monday);

  const todayCompleted = (tasks || []).filter(t => t.date === todayStr && t.completed);
  const todayHigh = todayCompleted.filter(t => t.priority === 'High');
  const todayFocus = (focusSessions || []).filter(s => s && s.date === todayStr);
  const weekCompleted = (tasks || []).filter(t => t.completed && t.date >= mondayStr && t.date <= todayStr);

  const todayQuests = (existingQuests || []).filter(q => q.date === todayStr || q.type === 'weekly');
  const baseQuests = todayQuests.length ? existingQuests : [
    ...(existingQuests || []),
    { id: `daily_3_tasks_${todayStr}`, title: 'Complete 3 Tasks', date: todayStr, type: 'task', targetCount: 3, currentCount: 0, rewardXP: 25, completed: false, claimed: false },
    { id: `daily_high_task_${todayStr}`, title: 'Crush 1 High-Priority Task', date: todayStr, type: 'high_task', targetCount: 1, currentCount: 0, rewardXP: 25, completed: false, claimed: false },
    { id: `daily_focus_${todayStr}`, title: 'Finish 1 Focus Session', date: todayStr, type: 'focus', targetCount: 1, currentCount: 0, rewardXP: 25, completed: false, claimed: false },
    { id: `weekly_20_tasks_${todayStr.slice(0, 7)}`, title: 'Weekly Warrior: 20 Tasks', date: todayStr, type: 'weekly', targetCount: 20, currentCount: 0, rewardXP: 100, completed: false, claimed: false },
  ];

  const synced = baseQuests.map(q => {
    let actualCount = q.currentCount || 0;
    if (q.type === 'task' || q.id.includes('daily_3_tasks') || q.id.includes('task')) {
      actualCount = todayCompleted.length;
    } else if (q.type === 'high_task' || q.id.includes('daily_high') || q.id.includes('high')) {
      actualCount = todayHigh.length;
    } else if (q.type === 'focus' || q.id.includes('daily_focus') || q.id.includes('focus')) {
      actualCount = todayFocus.length;
    } else if (q.type === 'weekly' || q.id.includes('weekly')) {
      actualCount = weekCompleted.length;
    }

    const target = q.targetCount || 1;
    const isDone = actualCount >= target;

    return {
      ...q,
      currentCount: actualCount,
      completed: isDone,
      claimed: isDone ? (q.claimed || false) : false,
    };
  });

  dispatch({ type: 'SET_QUESTS', payload: synced });
  saveQuests(synced);
}

function computeCurrentStreak(tasks, dayHistory, restDays = []) {
  const todayStr = today();
  let streak = 0;
  const d = new Date();
  let maxDays = 365;
  while (maxDays-- > 0) {
    const ds = formatDate(d);
    // If it's a rest day, it doesn't break streak!
    if (restDays.includes(ds)) {
      d.setDate(d.getDate() - 1);
      continue;
    }
    const dayTasks = tasks.filter(t => t.date === ds);
    const hist = dayHistory[ds];
    const isCompleted = (dayTasks.filter(t => t.completed).length > 0) || ((hist?.completedTasks || 0) > 0);

    if (ds === todayStr) {
      if (isCompleted) {
        streak++;
      }
      // If not completed today yet, active streak from previous days continues!
    } else {
      if (isCompleted) {
        streak++;
      } else {
        break;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function checkPerfectStreak(dayHistory, targetDays) {
  const dates = Object.keys(dayHistory).sort();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const d = dayHistory[dates[i]];
    if (d && d.totalTasks > 0 && d.completedTasks === d.totalTasks) {
      streak++;
      if (streak >= targetDays) return true;
    } else {
      streak = 0;
    }
  }
  return false;
}

function computeStats(tasks, dayHistory, totalXP, goals = [], restDays = []) {
  const completedGoalsCount = goals.filter(g => g.status === 'completed').length;
  return {
    totalCompleted: tasks.filter(t => t.completed).length,
    currentStreak:  computeCurrentStreak(tasks, dayHistory, restDays),
    daysWorked:     Object.values(dayHistory).filter(d => d.completedTasks > 0).length,
    totalXP,
    completedGoalsCount,
    hasPerfectWeek: checkPerfectStreak(dayHistory, 7),
    hasPerfectMonth: checkPerfectStreak(dayHistory, 30),
  };
}

function checkAchievements(stats, unlocked, hasPerfectDay, hasEarlyBird) {
  return ACHIEVEMENTS
    .filter(a => !unlocked.includes(a.id) && a.condition({ ...stats, hasPerfectDay, hasEarlyBird, hasComeback: false }))
    .map(a => a.id);
}
