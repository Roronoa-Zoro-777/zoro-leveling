/**
 * backupManager.js
 * Automatic rotating local backups, CSV task export/import,
 * and legacy storage migration for ZoroLevel.
 * 
 * 100% Offline, Zero Cloud, Zero External Server.
 */

import { db, saveTasks } from '../db/db';

const BACKUP_INDEX_KEY = 'zl_rotating_backup_index';
const MAX_ROTATING_BACKUPS = 7;

/**
 * Creates an automatic snapshot of all data and maintains a 7-day rotating ring.
 * If running inside Electron desktop app, also saves a physical file to OS user data.
 */
export async function performAutoRotatingBackup(state) {
  if (!state || !state.tasks) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Check if we already created a backup in the last 6 hours
  try {
    const rawIndex = localStorage.getItem(BACKUP_INDEX_KEY);
    const index = rawIndex ? JSON.parse(rawIndex) : [];
    const latest = index[0];
    if (latest && (Date.now() - new Date(latest.timestamp).getTime()) < 6 * 60 * 60 * 1000) {
      // Recent backup exists within 6 hours, skip unnecessary writes
      return latest;
    }

    const snapshot = {
      id: `backup-${todayKey}-${Date.now()}`,
      timestamp: now,
      date: todayKey,
      appVersion: '2.4.0',
      summary: {
        tasksCount: (state.tasks || []).length,
        completedTasks: (state.tasks || []).filter(t => t.completed).length,
        habitsCount: (state.habits || []).length,
        totalXP: state.profile?.totalXP || 0,
      },
      data: {
        tasks: state.tasks,
        goals: state.goals,
        habits: state.habits,
        habitLogs: state.habitLogs,
        focusSessions: state.focusSessions,
        dailyReviews: state.dailyReviews,
        trash: state.trash,
        quests: state.quests,
        restDays: state.restDays,
        profile: state.profile,
        settings: state.settings,
        dayHistory: state.dayHistory,
        xpHistory: state.xpHistory,
      },
    };

    // Save snapshot payload into localStorage (or IndexedDB key)
    const storageKey = `zl_snapshot_${snapshot.id}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
      // If localStorage is full, prune older snapshots
      pruneOldSnapshots(index.slice(0, 3));
      try {
        localStorage.setItem(storageKey, JSON.stringify(snapshot));
      } catch {
        // Silently skip if quota exhausted
      }
    }

    // Update rotating index (keep maximum 7 items)
    const updatedIndex = [
      {
        id: snapshot.id,
        timestamp: snapshot.timestamp,
        date: snapshot.date,
        summary: snapshot.summary,
        storageKey,
      },
      ...index.filter(item => item.date !== todayKey),
    ].slice(0, MAX_ROTATING_BACKUPS);

    // Prune removed backups from storage
    const activeKeys = new Set(updatedIndex.map(i => i.storageKey));
    index.forEach(item => {
      if (!activeKeys.has(item.storageKey)) {
        localStorage.removeItem(item.storageKey);
      }
    });

    localStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(updatedIndex));

    // If running in Electron Desktop App, write physical file to OS user data folder
    if (window.electronAPI && typeof window.electronAPI.saveNativeBackup === 'function') {
      try {
        await window.electronAPI.saveNativeBackup(`zorolevel-auto-backup-${todayKey}.json`, snapshot);
      } catch (err) {
        console.warn('Native Electron backup write skipped:', err);
      }
    }

    return snapshot;
  } catch (err) {
    console.error('Auto backup error:', err);
    return null;
  }
}

function pruneOldSnapshots(keepItems) {
  const keepKeys = new Set(keepItems.map(i => i.storageKey));
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('zl_snapshot_') && !keepKeys.has(key)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Get all available local rotating backups
 */
export function getRotatingBackups() {
  try {
    const raw = localStorage.getItem(BACKUP_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieve data for a specific rotating backup ID
 */
export function getRotatingBackupData(backupId) {
  try {
    const key = `zl_snapshot_${backupId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch {
    return null;
  }
}

/**
 * Get full list of rotating backups with summary and payload
 */
export async function getAutoRotatingBackups() {
  const index = getRotatingBackups();
  return index.map(item => {
    const data = getRotatingBackupData(item.id);
    return {
      ...item,
      data,
    };
  });
}

/**
 * Restore an automated backup snapshot by ID
 */
export async function restoreAutoBackup(backupId, importAndReplaceFn) {
  try {
    const data = getRotatingBackupData(backupId);
    if (!data) return false;
    await importAndReplaceFn(data);
    return true;
  } catch (err) {
    console.error('Failed to restore auto backup:', err);
    return false;
  }
}

// ─── CSV Task Export / Import ─────────────────────────────────────────────────

/**
 * Export tasks array to clean RFC-4180 CSV string
 */
export function exportTasksToCSV(tasks = []) {
  const headers = [
    'ID',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Date',
    'StartDate',
    'EndDate',
    'Time',
    'EstimatedMinutes',
    'SubtasksCount',
    'SubtasksList',
    'Notes',
    'CreatedAt'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = (tasks || []).map(t => {
    const subtasksList = (t.subtasks || [])
      .map(s => `${s.completed ? '[x]' : '[ ]'} ${s.title}`)
      .join('; ');

    return [
      escapeCSV(t.id),
      escapeCSV(t.title),
      escapeCSV(t.category || 'Personal'),
      escapeCSV(t.priority || 'Medium'),
      escapeCSV(t.completed ? 'Completed' : 'Pending'),
      escapeCSV(t.date || ''),
      escapeCSV(t.startDate || t.date || ''),
      escapeCSV(t.endDate || t.startDate || t.date || ''),
      escapeCSV(t.time || ''),
      escapeCSV(t.estimatedMinutes || 30),
      escapeCSV((t.subtasks || []).length),
      escapeCSV(subtasksList),
      escapeCSV(t.description || ''),
      escapeCSV(t.createdAt || '')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Parse CSV task text and return normalized task array
 */
export function importTasksFromCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse CSV row respecting quoted fields with commas
  const parseRow = (text) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase());
  const titleIdx = headers.indexOf('title');
  if (titleIdx === -1) {
    throw new Error('CSV is missing required "Title" column.');
  }

  const categoryIdx = headers.indexOf('category');
  const priorityIdx = headers.indexOf('priority');
  const statusIdx = headers.indexOf('status');
  const dateIdx = headers.indexOf('date');
  const startIdx = headers.indexOf('startdate');
  const endIdx = headers.indexOf('enddate');
  const timeIdx = headers.indexOf('time');
  const estIdx = headers.indexOf('estimatedminutes');
  const notesIdx = headers.indexOf('notes');

  const imported = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    const title = row[titleIdx];
    if (!title) continue;

    const sDate = (startIdx !== -1 && row[startIdx]) ? row[startIdx] : ((dateIdx !== -1 && row[dateIdx]) ? row[dateIdx] : todayStr);
    const eDate = (endIdx !== -1 && row[endIdx]) ? row[endIdx] : sDate;
    const isCompleted = (statusIdx !== -1 && row[statusIdx]?.toLowerCase() === 'completed');

    imported.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: title.slice(0, 200),
      category: (categoryIdx !== -1 && row[categoryIdx]) ? row[categoryIdx] : 'Personal',
      priority: (priorityIdx !== -1 && row[priorityIdx]) ? row[priorityIdx] : 'Medium',
      completed: isCompleted,
      date: sDate,
      startDate: sDate,
      endDate: eDate >= sDate ? eDate : sDate,
      time: (timeIdx !== -1 && row[timeIdx]) ? row[timeIdx] : '',
      estimatedMinutes: (estIdx !== -1 && Number(row[estIdx])) ? Number(row[estIdx]) : 30,
      description: (notesIdx !== -1 && row[notesIdx]) ? row[notesIdx] : '',
      subtasks: [],
      createdAt: new Date().toISOString(),
    });
  }

  return imported;
}

// ─── Legacy LocalStorage One-Time Migration ───────────────────────────────────

/**
 * Checks for any legacy tasks or settings previously stored in window.localStorage
 * and safely copies them into IndexedDB if not already present.
 */
export async function migrateLegacyLocalStorageData() {
  try {
    const migratedFlag = localStorage.getItem('zl_legacy_migrated_v3');
    if (migratedFlag) return false;

    const legacyKeys = ['tasks', 'zorolevel_tasks', 'zl_tasks', 'zl-tasks'];
    let foundTasks = [];

    for (const key of legacyKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            foundTasks = parsed;
            break;
          }
        } catch {
          // Ignore invalid parse
        }
      }
    }

    if (foundTasks.length > 0) {
      // Check if IndexedDB already has tasks
      const existingDbCount = await db.table('tasks').count();
      if (existingDbCount === 0) {
        await saveTasks(foundTasks);
      }
    }

    // Set flag so migration runs strictly once
    localStorage.setItem('zl_legacy_migrated_v3', new Date().toISOString());
    return true;
  } catch (err) {
    console.warn('Legacy migration check non-critical failure:', err);
    return false;
  }
}
