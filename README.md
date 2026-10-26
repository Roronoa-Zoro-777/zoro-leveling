# ⚡ ZoroLevel — Gamified To-Do & Productivity Tracker

A stunning, fully-featured productivity app built with **React + Vite** featuring a **Black Liquid Glass** UI, gamified leveling system, live charts, and full localStorage persistence.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Open in browser
# → http://localhost:5173
```

> Click **"🎮 Load Demo Data"** to instantly populate the app with 30 days of sample tasks, XP, and level history to preview all features.

---

## ✨ Features

### Task Management (Full CRUD)
- **Quick-add bar** — type a task + Enter to add instantly
- **New Task modal** — title, notes, priority, category, date, time, repeat, subtasks
- **Edit modal** — pre-filled for all fields; double-click title for inline editing
- **Delete with Undo** — 5-second toast with one-click undo
- **Duplicate, Move to Tomorrow**, drag-and-drop reorder
- **Search & Filters** — by status, category, priority

### ⚔️ Gamification / Leveling
| Action | XP |
|--------|-----|
| Low priority task | +10 XP |
| Medium priority task | +20 XP |
| High priority task | +40 XP |
| Subtask completed | +5 XP |
| All tasks done (day bonus) | +50 XP |
| Streak bonus per day (max 10 days) | +10 XP |

**Rank Titles:** Beginner → Achiever → Focused → Disciplined → Master → Legend

- Animated XP bar always visible in sidebar
- Level-up popup with **confetti** and glow effect
- Floating "+XP" text on task completion
- Unchecking a task removes the XP (no double-dipping)

### 🏆 Achievements
First Task · 10 Tasks · 100 Tasks · 3/7/30-Day Streaks · Perfect Day · Early Bird · Comeback King

### 📊 Stats & Charts
- Today's completion ring + motivational message
- Bar chart: tasks completed per day (last 7 days)
- Area chart: completion % over last 30 days
- Pie chart: tasks by category
- Line chart: XP over time
- **GitHub-style heatmap calendar** (last 365 days)
- Stat cards: total tasks, days worked, streaks, best day, most productive weekday

### 📅 Daily Tracking
- Date navigator (arrow keys or calendar picker)
- Repeat tasks (daily / weekdays / weekly) auto-generated
- History page: browse any past day with task details

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx        # Level badge, XP bar, navigation
│   ├── TaskList.jsx        # Drag-and-drop, task cards, subtasks
│   ├── TaskModal.jsx       # Create/edit modal with all fields
│   ├── Charts.jsx          # All Recharts components + heatmap
│   ├── LevelUpPopup.jsx    # Confetti popup on level-up
│   └── ToastSystem.jsx     # Undo toasts + floating XP text
├── context/
│   └── AppContext.jsx      # Global state, reducer, all actions
├── pages/
│   ├── TodayPage.jsx       # Main task board
│   ├── StatsPage.jsx       # Dashboard with charts
│   ├── HistoryPage.jsx     # Past days browser
│   ├── AchievementsPage.jsx
│   ├── ProfilePage.jsx
│   └── SettingsPage.jsx
├── utils/
│   └── constants.js        # XP values, level math, demo data
├── App.jsx                 # Root layout + router
├── main.jsx
└── index.css               # Full glass-morphism design system
```

---

## 🎨 Design System — Black Liquid Glass

- Deep black background (`#000005`) with animated violet/cyan gradient orbs
- All cards use `backdrop-filter: blur(24px) saturate(180%)`
- 1px translucent borders with bright top-left edge
- Neon-soft chart accents: **cyan**, **violet**, **emerald**
- Inter font, hover lifts, spring-like animations
- Fully responsive: sidebar collapses on tablet, mobile nav at bottom

---

## 🛡️ 100% Offline-First Data Architecture (Zero Cloud, Zero Backend)

All core application data lives on the user's device in **IndexedDB** managed via **Dexie.js** with a versioned migration schema (`v1`).

- **Dexie.js Tables:**
  - `tasks`: id, date, priority, category, repeat, completed, subtasks, order
  - `profile`: hunter level, total XP, unlocked achievements, perfect day records
  - `settings`: username, custom tags, backup timestamps, notification preferences
  - `dayHistory`: daily completion aggregates & XP per date
  - `xpHistory`: cumulative daily XP log for time-series charts
- **Storage Durability:** Calls `navigator.storage.persist()` on launch to protect data from browser eviction.
- **PWA & Offline Asset Pre-caching:** Configured via `vite-plugin-pwa` and Workbox. Works completely offline.
- **Self-Hosted Typography:** `@fontsource/inter` bundled directly (no external Google Fonts requests).
- **Backup & Restore:** Full JSON export, with your choice of **Merge** (safe append) or **Replace All** (complete recovery).
- **Auto Reminders:** Gentle backup reminder banner appears if 7 days have passed since your last export.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Storage Engine | IndexedDB via Dexie.js (v1 Schema) |
| UI Preferences | localStorage (active tab, theme) |
| PWA & Caching | vite-plugin-pwa + Workbox |
| Offline Fonts | @fontsource/inter (Self-hosted) |
| Analytics Charts | Recharts |
| Drag & Drop | @dnd-kit (core, sortable, utilities) |
| Celebrations | canvas-confetti |
| Design System | Vanilla CSS (Black Liquid Glass + backdrop-filter) |
