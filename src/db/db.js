/**
 * db.js — Dexie.js IndexedDB schema for ZoroLevel
 * Version history ensures migrations never wipe data.
 */
import Dexie from 'dexie';

export const db = new Dexie('ZoroLevelDB');

// ─── v1 Schema ────────────────────────────────────────────────────────────────
db.version(1).stores({
  tasks:      'id, date, completed, priority, category, repeat',
  profile:    '&key',
  settings:   '&key',
  dayHistory: 'date',
  xpHistory:  'date',
});

// ─── v2 Schema Migration ──────────────────────────────────────────────────────
db.version(2).stores({
  tasks:      'id, date, startDate, endDate, completed, priority, category, repeat',
  goals:      'id, status, startDate, endDate',
  profile:    '&key',
  settings:   '&key',
  dayHistory: 'date',
  xpHistory:  'date',
}).upgrade(async tx => {
  await tx.table('tasks').toCollection().modify(task => {
    if (!task.startDate) task.startDate = task.date;
    if (!task.endDate) task.endDate = task.date;
  });
});

// ─── v3 Schema Migration ──────────────────────────────────────────────────────
// Adds Habits, Focus Sessions, Daily Reviews, Trash, Quests, Shop, and Rest Days
db.version(3).stores({
  tasks:         'id, date, startDate, endDate, completed, priority, category, repeat, kanbanStatus',
  goals:         'id, status, startDate, endDate',
  habits:        'id, frequency, createdAt',
  habitLogs:     '[habitId+date], habitId, date, completed',
  focusSessions: 'id, taskId, date, durationMinutes, completedAt',
  dailyReviews:  'date, mood, energy',
  trash:         'id, deletedAt',
  quests:        'id, date, type, completed',
  shopPurchases: 'id, itemId, purchasedAt',
  restDays:      'date',
  profile:       '&key',
  settings:      '&key',
  dayHistory:    'date',
  xpHistory:     'date',
}).upgrade(async tx => {
  await tx.table('tasks').toCollection().modify(task => {
    if (!task.kanbanStatus) task.kanbanStatus = task.completed ? 'done' : 'todo';
    if (!task.estimatedMinutes) task.estimatedMinutes = 30;
  });
});

// ─── Convenience helpers ──────────────────────────────────────────────────────
const PROFILE_KEY  = 'main';
const SETTINGS_KEY = 'main';

export const DEFAULT_PROFILE = {
  key: PROFILE_KEY,
  totalXP: 0,
  spentXP: 0,
  streakFreezes: 1,
  equippedTheme: 'midnight', // 'midnight' | 'aurora' | 'ember' | 'mono'
  equippedFrame: 'bronze',   // 'bronze' | 'silver' | 'gold' | 'shadow' | 'dragon'
  equippedAccent: '#22d3ee',
  purchasedItems: ['theme_midnight', 'frame_bronze'],
  unlockedAchievements: [],
  hasPerfectDay: false,
  hasEarlyBird:  false,
  hasComeback:   false,
  hasGoalPeriodCompleted: false,
  hasPerfectWeek: false,
  hasPerfectMonth: false,
};

export const DEFAULT_SETTINGS = {
  key: SETTINGS_KEY,
  username: 'Hero',
  customCategories: [],
  lastBackupReminder: null,
  notificationsEnabled: false,
  soundEnabled: true,
  hapticsEnabled: true,
  bgPreset: 'aurora',        // 'aurora' | 'sunset' | 'ocean' | 'midnight' | 'custom'
  customWallpaper: null,     // Base64 dataURL stored in IndexedDB
  glassBlur: 10,             // 4 to 30px (Apple Liquid Glass default: 10px)
  glassOpacity: 0.06,        // 0.02 to 0.20 (Apple clear glass default: 0.06)
  glassRim: 0.65,            // 0.2 to 0.9 (Top-left rim brightness)
  glassSheen: 0.18,          // 0.0 to 0.40 (Specular diagonal sheen)
  glassTintColor: 'default', // 'default' | 'cyan' | 'violet' | 'amber' | 'emerald'
  glassRefraction: true,     // SVG refraction lensing on/off
  reducedMotion: false,
  weekStartDay: 'mon',
  timeFormat: '12h',
  appLockEnabled: false,
  appLockPinHash: null,
  autoLockMinutes: 5,
  onboardingDone: true,
};

// ─── Read helpers ─────────────────────────────────────────────────────────────
export async function loadAllData() {
  const [
    tasks, goals, habits, habitLogs, focusSessions, dailyReviews, trash,
    quests, restDays, profile, settings, dayHistoryRows, xpHistoryRows
  ] = await Promise.all([
    db.table('tasks').toArray().catch(() => []),
    db.table('goals').toArray().catch(() => []),
    db.table('habits').toArray().catch(() => []),
    db.table('habitLogs').toArray().catch(() => []),
    db.table('focusSessions').toArray().catch(() => []),
    db.table('dailyReviews').toArray().catch(() => []),
    db.table('trash').toArray().catch(() => []),
    db.table('quests').toArray().catch(() => []),
    db.table('restDays').toArray().catch(() => []),
    db.profile.get(PROFILE_KEY),
    db.settings.get(SETTINGS_KEY),
    db.dayHistory.toArray().catch(() => []),
    db.xpHistory.toArray().catch(() => []),
  ]);

  return {
    tasks: tasks || [],
    goals: goals || [],
    habits: habits || [],
    habitLogs: habitLogs || [],
    focusSessions: focusSessions || [],
    dailyReviews: Object.fromEntries((dailyReviews || []).map(r => [r.date, r])),
    trash: trash || [],
    quests: quests || [],
    restDays: (restDays || []).map(r => r.date),
    profile: profile ? { ...DEFAULT_PROFILE, ...profile } : { ...DEFAULT_PROFILE },
    settings: settings ? { ...DEFAULT_SETTINGS, ...settings } : { ...DEFAULT_SETTINGS },
    dayHistory: Object.fromEntries((dayHistoryRows || []).map(r => [r.date, r])),
    xpHistory:  xpHistoryRows || [],
  };
}

// ─── Write helpers — Tasks & Trash ───────────────────────────────────────────
export async function saveTask(task) {
  await db.table('tasks').put(task);
}

export async function deleteTask(id) {
  await db.table('tasks').delete(id);
}

export async function deleteTasks(ids) {
  if (!ids?.length) return;
  await db.table('tasks').bulkDelete(ids);
}

export async function saveTasks(tasks) {
  if (!tasks?.length) return;
  await db.table('tasks').bulkPut(tasks);
}

export async function moveTaskToTrash(task) {
  await db.transaction('rw', db.table('tasks'), db.table('trash'), async () => {
    await db.table('tasks').delete(task.id);
    await db.table('trash').put({ ...task, deletedAt: new Date().toISOString() });
  });
}

export async function restoreTaskFromTrash(task) {
  await db.transaction('rw', db.table('tasks'), db.table('trash'), async () => {
    await db.table('trash').delete(task.id);
    const { deletedAt, ...cleanTask } = task;
    await db.table('tasks').put(cleanTask);
  });
}

export async function emptyTrashDb() {
  await db.table('trash').clear();
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export async function saveGoal(goal) {
  await db.table('goals').put(goal);
}

export async function deleteGoal(id) {
  await db.table('goals').delete(id);
}

export async function saveGoals(goals) {
  if (!goals?.length) return;
  await db.table('goals').bulkPut(goals);
}

// ─── Habits & Logs ────────────────────────────────────────────────────────────
export async function saveHabit(habit) {
  await db.table('habits').put(habit);
}

export async function deleteHabit(id) {
  await db.transaction('rw', db.table('habits'), db.table('habitLogs'), async () => {
    await db.table('habits').delete(id);
    await db.table('habitLogs').where('habitId').equals(id).delete();
  });
}

export async function saveHabitLog(log) {
  await db.table('habitLogs').put(log);
}

export async function saveHabitLogs(logs) {
  if (!logs?.length) return;
  await db.table('habitLogs').bulkPut(logs);
}

// ─── Focus Sessions ───────────────────────────────────────────────────────────
export async function saveFocusSession(session) {
  await db.table('focusSessions').put(session);
}

// ─── Daily Reviews & Rest Days ────────────────────────────────────────────────
export async function saveDailyReview(review) {
  await db.table('dailyReviews').put(review);
}

export async function toggleRestDayDb(dateStr, isRest) {
  if (isRest) {
    await db.table('restDays').put({ date: dateStr });
  } else {
    await db.table('restDays').delete(dateStr);
  }
}

// ─── Quests ───────────────────────────────────────────────────────────────────
export async function saveQuest(quest) {
  await db.table('quests').put(quest);
}

export async function saveQuests(quests) {
  if (!quests?.length) return;
  await db.table('quests').bulkPut(quests);
}

// ─── Profile & Settings ───────────────────────────────────────────────────────
export async function saveProfile(profile) {
  await db.profile.put({ key: PROFILE_KEY, ...profile });
}

export async function saveSettings(settings) {
  await db.settings.put({ key: SETTINGS_KEY, ...settings });
}

export async function saveDayHistory(date, data) {
  await db.dayHistory.put({ date, ...data });
}

export async function saveXPHistoryEntry(date, xpDelta) {
  const existing = await db.xpHistory.get(date);
  if (existing) {
    await db.xpHistory.put({ date, xp: (existing.xp || 0) + xpDelta });
  } else {
    await db.xpHistory.put({ date, xp: xpDelta });
  }
}

// ─── Bulk replace (import) ────────────────────────────────────────────────────
export async function replaceAllData({
  tasks, goals, habits, habitLogs, focusSessions, dailyReviews, trash,
  quests, restDays, profile, settings, dayHistory, xpHistory
}) {
  await db.transaction('rw',
    db.table('tasks'), db.table('goals'), db.table('habits'), db.table('habitLogs'),
    db.table('focusSessions'), db.table('dailyReviews'), db.table('trash'),
    db.table('quests'), db.table('restDays'), db.profile, db.settings,
    db.dayHistory, db.xpHistory, db.table('shopPurchases'),
    async () => {
      await db.table('tasks').clear();
      await db.table('goals').clear();
      await db.table('habits').clear();
      await db.table('habitLogs').clear();
      await db.table('focusSessions').clear();
      await db.table('dailyReviews').clear();
      await db.table('trash').clear();
      await db.table('quests').clear();
      await db.table('restDays').clear();
      await db.table('shopPurchases').clear();
      await db.profile.clear();
      await db.settings.clear();
      await db.dayHistory.clear();
      await db.xpHistory.clear();

      if (tasks?.length)         await db.table('tasks').bulkPut(tasks);
      if (goals?.length)         await db.table('goals').bulkPut(goals);
      if (habits?.length)        await db.table('habits').bulkPut(habits);
      if (habitLogs?.length)     await db.table('habitLogs').bulkPut(habitLogs);
      if (focusSessions?.length) await db.table('focusSessions').bulkPut(focusSessions);
      if (trash?.length)         await db.table('trash').bulkPut(trash);
      if (quests?.length)        await db.table('quests').bulkPut(quests);

      if (restDays?.length) {
        await db.table('restDays').bulkPut(restDays.map(d => typeof d === 'string' ? { date: d } : d));
      }

      if (dailyReviews) {
        const revRows = Array.isArray(dailyReviews) ? dailyReviews : Object.entries(dailyReviews).map(([date, r]) => ({ date, ...r }));
        if (revRows.length) await db.table('dailyReviews').bulkPut(revRows);
      }

      if (profile)  await db.profile.put({ key: PROFILE_KEY, ...profile });
      if (settings) await db.settings.put({ key: SETTINGS_KEY, ...settings });

      const dhRows = Object.entries(dayHistory || {}).map(([date, d]) => ({ date, ...d }));
      if (dhRows.length) await db.dayHistory.bulkPut(dhRows);

      const xhRows = (xpHistory || []);
      if (xhRows.length) await db.xpHistory.bulkPut(xhRows);
    }
  );
}

// ─── Merge (import — merge, not replace) ─────────────────────────────────────
export async function mergeAllData({
  tasks, goals, habits, habitLogs, focusSessions, dailyReviews, trash,
  quests, restDays, profile, settings, dayHistory, xpHistory
}) {
  await db.transaction('rw',
    db.table('tasks'), db.table('goals'), db.table('habits'), db.table('habitLogs'),
    db.table('focusSessions'), db.table('dailyReviews'), db.table('trash'),
    db.table('quests'), db.table('restDays'), db.profile, db.settings,
    db.dayHistory, db.xpHistory,
    async () => {
      if (tasks?.length)         await db.table('tasks').bulkPut(tasks);
      if (goals?.length)         await db.table('goals').bulkPut(goals);
      if (habits?.length)        await db.table('habits').bulkPut(habits);
      if (habitLogs?.length)     await db.table('habitLogs').bulkPut(habitLogs);
      if (focusSessions?.length) await db.table('focusSessions').bulkPut(focusSessions);
      if (trash?.length)         await db.table('trash').bulkPut(trash);
      if (quests?.length)        await db.table('quests').bulkPut(quests);

      if (restDays?.length) {
        await db.table('restDays').bulkPut(restDays.map(d => typeof d === 'string' ? { date: d } : d));
      }

      if (dailyReviews) {
        const revRows = Array.isArray(dailyReviews) ? dailyReviews : Object.entries(dailyReviews).map(([date, r]) => ({ date, ...r }));
        if (revRows.length) await db.table('dailyReviews').bulkPut(revRows);
      }

      if (profile)  await db.profile.put({ key: PROFILE_KEY, ...profile });
      if (settings) await db.settings.put({ key: SETTINGS_KEY, ...settings });

      const dhRows = Object.entries(dayHistory || {}).map(([date, d]) => ({ date, ...d }));
      if (dhRows.length) await db.dayHistory.bulkPut(dhRows);

      const xhRows = (xpHistory || []);
      if (xhRows.length) await db.xpHistory.bulkPut(xhRows);
    }
  );
}

// ─── Storage estimate ─────────────────────────────────────────────────────────
export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) return { usage: 0, quota: 0 };
  return navigator.storage.estimate();
}

// ─── Request persistent storage ──────────────────────────────────────────────
export async function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    const granted = await navigator.storage.persist();
    return granted;
  }
  return false;
}
