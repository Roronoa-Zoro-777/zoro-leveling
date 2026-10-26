// XP values for task completion & rewards
export const XP_VALUES = {
  Low: 10,
  Medium: 20,
  High: 40,
  Subtask: 5,
  AllTasksBonus: 50,
  StreakBonusPerDay: 10,
  StreakBonusCap: 100,
  GoalPeriodBonus: 200,
  FocusSession: 15,
  HabitCheck: 5,
  DailyQuest: 25,
  WeeklyQuest: 100,
  DailyReview: 10,
};

// Priority options
export const PRIORITIES = ['Low', 'Medium', 'High'];

// Category options
export const DEFAULT_CATEGORIES = ['Work', 'Study', 'Health', 'Personal'];

// Repeat options
export const REPEAT_OPTIONS = ['none', 'daily', 'weekdays', 'weekly', 'monthly'];

// Goal period duration presets (days)
export const GOAL_PRESETS = [7, 14, 30, 60, 90];

// Focus session presets (minutes work / break)
export const FOCUS_PRESETS = [
  { id: '25_5', label: '25 / 5', work: 25, break: 5 },
  { id: '50_10', label: '50 / 10', work: 50, break: 10 },
  { id: '90_15', label: '90 / 15', work: 90, break: 15 },
  { id: 'custom', label: 'Custom', work: 30, break: 5 },
];

// XP Shop Themes
export const THEMES = {
  midnight: {
    id: 'midnight',
    name: 'Midnight Abyss',
    description: 'Deep obsidian void with cosmic cyan and violet nebulae',
    bgDeep: '#000007',
    accent: '#22d3ee',
    accentSecondary: '#a78bfa',
    glassBorder: 'rgba(34, 211, 238, 0.25)',
    price: 0,
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Bioluminescent emerald and cyan liquid refraction',
    bgDeep: '#010906',
    accent: '#34d399',
    accentSecondary: '#22d3ee',
    glassBorder: 'rgba(52, 211, 153, 0.28)',
    price: 150,
  },
  ember: {
    id: 'ember',
    name: 'Ember Core',
    description: 'Volcanic amber fire with rose liquid reflections',
    bgDeep: '#080203',
    accent: '#fbbf24',
    accentSecondary: '#f43f5e',
    glassBorder: 'rgba(251, 191, 36, 0.28)',
    price: 200,
  },
  mono: {
    id: 'mono',
    name: 'Obsidian Platinum',
    description: 'Pure high-contrast monochrome silver liquid glass',
    bgDeep: '#030305',
    accent: '#e2e8f0',
    accentSecondary: '#94a3b8',
    glassBorder: 'rgba(255, 255, 255, 0.24)',
    price: 250,
  },
};

// XP Shop Avatar Frames
export const AVATAR_FRAMES = {
  bronze: { id: 'frame_bronze', name: 'Hunter Bronze', icon: '🥉', border: '#cd7f32', glow: 'rgba(205, 127, 50, 0.35)', price: 0 },
  silver: { id: 'frame_silver', name: 'Silver Slayer', icon: '🥈', border: '#e2e8f0', glow: 'rgba(226, 232, 240, 0.45)', price: 100 },
  gold: { id: 'frame_gold', name: 'Golden Monarch', icon: '🥇', border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.55)', price: 250 },
  shadow: { id: 'frame_shadow', name: 'Shadow Sovereign', icon: '👑', border: '#a78bfa', glow: 'rgba(167, 139, 250, 0.65)', price: 500 },
  dragon: { id: 'frame_dragon', name: 'Dragon Emperor', icon: '🐉', border: '#f43f5e', glow: 'rgba(244, 63, 94, 0.65)', price: 1000 },
};

// Task Routines / Templates
export const ROUTINE_TEMPLATES = [
  {
    id: 'morning_mastery',
    title: 'Morning Mastery',
    icon: '🌅',
    category: 'Health',
    tasks: [
      { title: 'Hydrate with 500ml cold water', priority: 'Medium', category: 'Health', estimatedMinutes: 5 },
      { title: '15 min physical body conditioning', priority: 'High', category: 'Health', estimatedMinutes: 15 },
      { title: 'Review top 3 objectives for today', priority: 'High', category: 'Work', estimatedMinutes: 10 },
    ],
  },
  {
    id: 'deep_work',
    title: 'Deep Work Sprint',
    icon: '⚡',
    category: 'Work',
    tasks: [
      { title: 'Silence notifications & clear physical desk', priority: 'High', category: 'Work', estimatedMinutes: 5 },
      { title: '50-minute intense focus sprint', priority: 'High', category: 'Work', estimatedMinutes: 50 },
      { title: 'Document progress & commit clean code', priority: 'Medium', category: 'Work', estimatedMinutes: 15 },
    ],
  },
  {
    id: 'night_wind_down',
    title: 'Evening Reflection & Prep',
    icon: '🌙',
    category: 'Personal',
    tasks: [
      { title: 'Log mood & write daily reflection', priority: 'Medium', category: 'Personal', estimatedMinutes: 5 },
      { title: 'Plan tomorrow top quest targets', priority: 'High', category: 'Personal', estimatedMinutes: 10 },
      { title: '20 min reading before sleep', priority: 'Low', category: 'Study', estimatedMinutes: 20 },
    ],
  },
];

// Rank titles by level
export const RANK_TITLES = [
  { minLevel: 1, maxLevel: 4, title: 'Beginner', color: '#94a3b8' },
  { minLevel: 5, maxLevel: 9, title: 'Achiever', color: '#34d399' },
  { minLevel: 10, maxLevel: 19, title: 'Focused', color: '#60a5fa' },
  { minLevel: 20, maxLevel: 34, title: 'Disciplined', color: '#a78bfa' },
  { minLevel: 35, maxLevel: 49, title: 'Master', color: '#f59e0b' },
  { minLevel: 50, maxLevel: Infinity, title: 'Legend', color: '#f43f5e' },
];

// Compute XP required to reach a given level
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Total cumulative XP to start a given level
export function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

// Get level from total XP (Note: Spent XP does not decrease level)
export function getLevelFromXP(totalXP) {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (accumulated + needed > totalXP) break;
    accumulated += needed;
    level++;
  }
  return level;
}

// Get XP progress within current level
export function getXPProgress(totalXP) {
  const level = getLevelFromXP(totalXP);
  let accumulated = 0;
  for (let i = 1; i < level; i++) accumulated += xpForLevel(i);
  const currentLevelXP = totalXP - accumulated;
  const neededForNext = xpForLevel(level);
  return { level, currentLevelXP, neededForNext };
}

// Get rank title for a level
export function getRankTitle(level) {
  const rank = RANK_TITLES.find(r => level >= r.minLevel && level <= r.maxLevel);
  return rank || RANK_TITLES[RANK_TITLES.length - 1];
}

// Format date as YYYY-MM-DD (timezone-safe)
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's date string
export function today() {
  return formatDate(new Date());
}

// Parse date string to Date object (midnight local)
export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Get next date string
export function nextDay(dateStr) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

// Add or subtract days
export function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

// Calculate days between two date strings (inclusive difference)
export function daysBetween(startStr, endStr) {
  const d1 = parseDate(startStr);
  const d2 = parseDate(endStr);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Check if a date string falls inside [startStr, endStr]
export function isDateInRange(dateStr, startStr, endStr) {
  if (!dateStr) return false;
  if (startStr && dateStr < startStr) return false;
  if (endStr && dateStr > endStr) return false;
  return true;
}

// Get day of week (0=Sun, 6=Sat) for a date string
export function getDayOfWeek(dateStr) {
  return parseDate(dateStr).getDay();
}

// Check if date is a weekday
export function isWeekday(dateStr) {
  const dow = getDayOfWeek(dateStr);
  return dow >= 1 && dow <= 5;
}

// Check if a task is scheduled for a given date (supports exact date, multi-day spans, and repeat frequencies)
export function isTaskScheduledForDate(task, targetDate) {
  if (!task || !targetDate) return false;

  const start = task.startDate || task.date;
  const end = task.endDate || task.startDate || task.date;

  // 1. Repeating task
  if (task.repeat && task.repeat !== 'none') {
    if (start && targetDate < start) return false;
    if (end && end > start && targetDate > end) return false;

    if (task.repeat === 'daily') return true;
    if (task.repeat === 'weekdays') return isWeekday(targetDate);
    if (task.repeat === 'weekly') return getDayOfWeek(start) === getDayOfWeek(targetDate);
    if (task.repeat === 'monthly') return parseDate(start).getDate() === parseDate(targetDate).getDate();
    return true;
  }

  // 2. Multi-day or standard scheduled task with start and end dates given
  if (start && end) {
    const s = start <= end ? start : end;
    const e = start <= end ? end : start;
    return targetDate >= s && targetDate <= e;
  }

  // 3. Fallback for single date
  if (start) return targetDate === start;
  if (task.date) return targetDate === task.date;

  return false;
}

// Check if a task is marked completed on a specific target date
export function isTaskCompletedOnDate(task, targetDate) {
  if (!task || !targetDate) return false;
  if (Array.isArray(task.completedDates)) {
    return task.completedDates.includes(targetDate);
  }
  const isMultiDay = (task.startDate && task.endDate && task.startDate !== task.endDate) || (task.repeat && task.repeat !== 'none');
  if (isMultiDay) {
    if (task.completed && task.completedAt && task.completedAt.slice(0, 10) === targetDate) {
      return true;
    }
    return false;
  }
  return !!task.completed;
}

// Check if a subtask is marked completed on a specific target date
export function isSubtaskCompletedOnDate(subtask, targetDate, isMultiDay = false) {
  if (!subtask || !targetDate) return false;
  if (Array.isArray(subtask.completedDates)) {
    return subtask.completedDates.includes(targetDate);
  }
  if (isMultiDay) {
    return false;
  }
  return !!subtask.completed;
}

// Generate unique ID
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Global Date Range Options
export const DATE_FILTER_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
  { id: 'active_period', label: 'Active Period' },
  { id: 'custom', label: 'Custom Range' },
];

// Helper to calculate start & end boundaries for a date filter
export function getDateFilterBounds(filterType, customRange, activeGoal) {
  const t = today();
  const now = new Date();

  switch (filterType) {
    case 'today':
      return { start: t, end: t };

    case 'week': {
      const d = parseDate(t);
      const day = d.getDay(); // 0 is Sun
      const diffToMon = (day === 0 ? -6 : 1) - day;
      const mon = new Date(d);
      mon.setDate(d.getDate() + diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { start: formatDate(mon), end: formatDate(sun) };
    }

    case 'month': {
      const y = now.getFullYear();
      const m = now.getMonth();
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);
      return { start: formatDate(first), end: formatDate(last) };
    }

    case 'last30':
      return { start: addDays(t, -29), end: t };

    case 'year': {
      const y = now.getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }

    case 'active_period':
      if (activeGoal?.startDate && activeGoal?.endDate) {
        return { start: activeGoal.startDate, end: activeGoal.endDate };
      }
      return { start: addDays(t, -29), end: t };

    case 'custom':
      return {
        start: customRange?.startDate || addDays(t, -29),
        end: customRange?.endDate || t,
      };

    case 'all':
    default:
      return { start: '2020-01-01', end: addDays(t, 365) };
  }
}

// Achievements definition
export const ACHIEVEMENTS = [
  { id: 'first_task', title: 'First Step', description: 'Complete your first task', icon: '🎯', condition: (stats) => stats.totalCompleted >= 1 },
  { id: 'ten_tasks', title: 'Getting Going', description: 'Complete 10 tasks total', icon: '🔟', condition: (stats) => stats.totalCompleted >= 10 },
  { id: 'hundred_tasks', title: 'Century Club', description: 'Complete 100 tasks total', icon: '💯', condition: (stats) => stats.totalCompleted >= 100 },
  { id: 'streak_3', title: '3-Day Streak', description: 'Maintain a 3-day streak', icon: '🔥', condition: (stats) => stats.currentStreak >= 3 },
  { id: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚡', condition: (stats) => stats.currentStreak >= 7 },
  { id: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🌟', condition: (stats) => stats.currentStreak >= 30 },
  { id: 'perfect_day', title: 'Perfect Day', description: 'Complete 100% of tasks in a day', icon: '✨', condition: (stats) => stats.hasPerfectDay },
  { id: 'early_bird', title: 'Early Bird', description: 'Complete a task before 9 AM', icon: '🐦', condition: (stats) => stats.hasEarlyBird },
  { id: 'comeback', title: 'Comeback King', description: 'Return after a missed day', icon: '💪', condition: (stats) => stats.hasComeback },
  { id: 'first_goal_completed', title: 'Goal Crusher', description: 'Complete your first Goal Period', icon: '🏆', condition: (stats) => stats.hasGoalPeriodCompleted || (stats.completedGoalsCount && stats.completedGoalsCount >= 1) },
  { id: 'perfect_week', title: 'Perfect Week', description: 'Complete 100% of tasks for 7 consecutive days', icon: '👑', condition: (stats) => stats.hasPerfectWeek },
  { id: 'perfect_month', title: 'Untouchable', description: 'Complete 100% of tasks for 30 consecutive days', icon: '🌌', condition: (stats) => stats.hasPerfectMonth },
  { id: 'first_focus', title: 'Deep Diver', description: 'Complete your first Pomodoro focus session', icon: '🧘', condition: (stats) => (stats.focusSessionsCount || 0) >= 1 },
  { id: 'habit_streak_7', title: 'Habit Mastery', description: 'Maintain a 7-day streak on any habit', icon: '💧', condition: (stats) => (stats.maxHabitStreak || 0) >= 7 },
  { id: 'first_review', title: 'Reflective Mind', description: 'Complete your first Daily Review & Mood Log', icon: '📝', condition: (stats) => (stats.reviewsCount || 0) >= 1 },
];

// Priority colors
export const PRIORITY_COLORS = {
  Low: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)', text: '#34d399' },
  Medium: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', text: '#fbbf24' },
  High: { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', text: '#f87171' },
};

// Category colors
export const CATEGORY_COLORS = {
  Work: '#60a5fa',
  Study: '#a78bfa',
  Health: '#34d399',
  Personal: '#f472b6',
  default: '#94a3b8',
};

export function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
}

// Demo data generator (90 days + Habits + Focus Sessions + Daily Reviews + Quests)
export function generateDemoData() {
  const todayStr = today();
  const tasks = [];
  const dayHistory = {};
  let totalXP = 0;
  const completedTasks = new Set();

  const timesOfDay = [
    '08:15:00', '10:30:00', '13:45:00', '15:20:00', '19:10:00', '20:40:00', '23:15:00',
  ];

  // Generate 90 days of rich demo history
  for (let i = 90; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const categories = DEFAULT_CATEGORIES;
    const priorities = PRIORITIES;
    const dayTasks = [];
    const numTasks = Math.floor(Math.random() * 4) + 3;

    for (let j = 0; j < numTasks; j++) {
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const completed = Math.random() > 0.25;
      const id = generateId();
      const timeSample = timesOfDay[Math.floor(Math.random() * timesOfDay.length)];
      const task = {
        id,
        title: `${cat} Routine #${j + 1}`,
        description: `Dedicated session for ${cat.toLowerCase()}`,
        priority,
        category: cat,
        date: dateStr,
        startDate: dateStr,
        endDate: dateStr,
        time: timeSample.slice(0, 5),
        estimatedMinutes: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
        kanbanStatus: completed ? 'done' : (j === 0 ? 'inprogress' : 'todo'),
        repeat: 'none',
        subtasks: [
          { id: generateId(), title: 'Phase 1 - Preparation', completed },
          { id: generateId(), title: 'Phase 2 - Execution', completed },
        ],
        completed,
        completedAt: completed ? `${dateStr}T${timeSample}` : null,
        createdAt: `${dateStr}T07:30:00`,
        order: j,
      };
      dayTasks.push(task);
      if (completed) {
        totalXP += XP_VALUES[priority] + (XP_VALUES.Subtask * 2);
        completedTasks.add(id);
      }
    }

    const completedCount = dayTasks.filter(t => t.completed).length;
    const allDone = completedCount === dayTasks.length;
    if (allDone && dayTasks.length > 0) totalXP += XP_VALUES.AllTasksBonus;

    dayHistory[dateStr] = {
      totalTasks: numTasks,
      completedTasks: completedCount,
      xpEarned: dayTasks.filter(t => t.completed).reduce((s, t) => s + XP_VALUES[t.priority] + 10, 0) + (allDone ? XP_VALUES.AllTasksBonus : 0),
    };

    tasks.push(...dayTasks);
  }

  // Active goal period: "90-Day Solo Leveling Challenge"
  // Past completed goal: "30-Day Awakening Quest"
  const goals = [
    {
      id: generateId(),
      name: '90-Day Solo Leveling Challenge',
      startDate: addDays(todayStr, -60),
      endDate: addDays(todayStr, 29),
      targetType: 'tasks',
      targetValue: 250,
      color: '#22d3ee',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: '30-Day Awakening Quest',
      startDate: addDays(todayStr, -90),
      endDate: addDays(todayStr, -61),
      targetType: 'tasks',
      targetValue: 60,
      color: '#a78bfa',
      status: 'completed',
      completedAt: addDays(todayStr, -61),
      bonusAwarded: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Sample Habits with 30 days of logs
  // FIX BUG-007: habits use `title` not `name` — must match addHabit() and HabitsPage rendering
  const habits = [
    { id: 'h1', title: 'Drink 2L Water', icon: '💧', frequency: 'daily', targetPerWeek: 7, color: '#22d3ee', createdAt: addDays(todayStr, -60) },
    { id: 'h2', title: 'Read 20 Mins', icon: '📖', frequency: 'daily', targetPerWeek: 7, color: '#a78bfa', createdAt: addDays(todayStr, -60) },
    { id: 'h3', title: 'Cold Shower Conditioning', icon: '🧊', frequency: 'weekdays', targetPerWeek: 5, color: '#34d399', createdAt: addDays(todayStr, -60) },
    { id: 'h4', title: 'Daily Meditation', icon: '🧘', frequency: 'daily', targetPerWeek: 7, color: '#fbbf24', createdAt: addDays(todayStr, -60) },
  ];

  const habitLogs = [];
  for (let i = 30; i >= 0; i--) {
    const dStr = addDays(todayStr, -i);
    habits.forEach(h => {
      const completed = Math.random() > 0.2;
      habitLogs.push({
        habitId: h.id,
        date: dStr,
        completed,
      });
      if (completed) totalXP += XP_VALUES.HabitCheck;
    });
  }

  // Sample Focus Sessions
  const focusSessions = [];
  for (let i = 20; i >= 0; i--) {
    const dStr = addDays(todayStr, -i);
    const count = Math.floor(Math.random() * 3) + 1;
    for (let k = 0; k < count; k++) {
      focusSessions.push({
        id: generateId(),
        taskId: null,
        taskTitle: 'Deep Study & Coding',
        category: 'Study',
        date: dStr,
        durationMinutes: 25,
        completedAt: `${dStr}T14:30:00`,
      });
      totalXP += XP_VALUES.FocusSession;
    }
  }

  // Sample Daily Reviews
  const dailyReviews = {};
  for (let i = 14; i >= 1; i--) {
    const dStr = addDays(todayStr, -i);
    dailyReviews[dStr] = {
      date: dStr,
      mood: [4, 5, 4, 3, 5][i % 5],
      energy: [4, 5, 3, 4, 5][i % 5],
      reflection: 'Crushed the morning workout and stayed focused through afternoon deep work.',
      wins: 'Finished the hard tasks first.',
      improvements: 'Reduce social media checking during breaks.',
      createdAt: `${dStr}T21:30:00`,
    };
    totalXP += XP_VALUES.DailyReview;
  }

  // Sample Daily Quests for Today
  const quests = [
    {
      id: `quest_today_1_${todayStr}`,
      date: todayStr,
      type: 'daily',
      title: 'Conquer 3 Quests',
      description: 'Check off at least 3 tasks today',
      target: 3,
      current: 1,
      completed: false,
      xpReward: 25,
    },
    {
      id: `quest_today_2_${todayStr}`,
      date: todayStr,
      type: 'daily',
      title: 'High Priority Strike',
      description: 'Complete 1 high-priority task',
      target: 1,
      current: 0,
      completed: false,
      xpReward: 35,
    },
    {
      id: `quest_today_3_${todayStr}`,
      date: todayStr,
      type: 'daily',
      title: 'Hyperfocus Discipline',
      description: 'Complete 1 Pomodoro focus session',
      target: 1,
      current: 1,
      completed: true,
      xpReward: 25,
    },
    {
      id: `quest_week_${todayStr}`,
      date: todayStr,
      type: 'weekly',
      title: 'Weekly Warrior Apex',
      description: 'Complete 25 total tasks this week',
      target: 25,
      current: 18,
      completed: false,
      xpReward: 100,
    },
  ];

  // Today's active tasks with date ranges & estimated durations
  const todayTasks = [
    {
      id: generateId(),
      title: 'Heavy Strength Conditioning',
      description: '100 pushups, 100 situps, 10km run',
      priority: 'High',
      category: 'Health',
      date: todayStr,
      startDate: todayStr,
      endDate: todayStr,
      time: '07:00',
      estimatedMinutes: 60,
      kanbanStatus: 'todo',
      repeat: 'daily',
      subtasks: [
        { id: generateId(), title: '100 Pushups', completed: false },
        { id: generateId(), title: '100 Situps', completed: false },
        { id: generateId(), title: '10km Run', completed: false },
      ],
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: 0,
    },
    {
      id: generateId(),
      title: 'Deep Architecture Analysis',
      description: 'Review local offline database migrations and indexing',
      priority: 'High',
      category: 'Work',
      date: todayStr,
      startDate: todayStr,
      endDate: addDays(todayStr, 2),
      time: '10:00',
      estimatedMinutes: 45,
      kanbanStatus: 'inprogress',
      repeat: 'none',
      subtasks: [
        { id: generateId(), title: 'Dexie v3 Schema verification', completed: true },
        { id: generateId(), title: 'PWA audit', completed: false },
      ],
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: 1,
    },
    {
      id: generateId(),
      title: 'Master React Performance & Recharts',
      description: 'Deep dive into responsive container SVG rendering',
      priority: 'Medium',
      category: 'Study',
      date: todayStr,
      startDate: todayStr,
      endDate: todayStr,
      time: '14:30',
      estimatedMinutes: 45,
      kanbanStatus: 'todo',
      repeat: 'weekdays',
      subtasks: [],
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: 2,
    },
    {
      id: generateId(),
      title: 'Mindfulness & Ki Recovery',
      description: '20 min meditation to restore focus',
      priority: 'Low',
      category: 'Personal',
      date: todayStr,
      startDate: todayStr,
      endDate: todayStr,
      time: '19:00',
      estimatedMinutes: 20,
      kanbanStatus: 'todo',
      repeat: 'daily',
      subtasks: [],
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: 3,
    },
    {
      id: generateId(),
      title: 'Shadow Extraction Protocol Review',
      description: 'Overdue task from yesterday',
      priority: 'High',
      category: 'Work',
      date: addDays(todayStr, -1),
      startDate: addDays(todayStr, -2),
      endDate: addDays(todayStr, -1),
      time: '16:00',
      estimatedMinutes: 30,
      kanbanStatus: 'todo',
      repeat: 'none',
      subtasks: [],
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: 4,
    },
  ];

  tasks.push(...todayTasks);

  return {
    tasks,
    goals,
    habits,
    habitLogs,
    focusSessions,
    dailyReviews,
    quests,
    dayHistory,
    totalXP,
  };
}
