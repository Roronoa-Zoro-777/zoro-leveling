import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  today, formatDate, parseDate, addDays, daysBetween, getDateFilterBounds,
  getXPProgress, getRankTitle
} from '../utils/constants';
import DateFilterBar from '../components/DateFilterBar';
import {
  ChartCard, MiniSparkline, ProgressRing,
  GoalPaceChart, StackedStatusChart, SummaryBarsChart,
  CategoryRadarChart, PriorityBarChart, WeekdayPatternChart,
  TimeOfDayChart, StreakTimelineChart, CumulativeCompletedChart,
  MonthlyComparisonChart, YearHeatmapChart, LeaderboardCards, CategoryPieChart,
  FocusMinutesChart, FocusCategoryPieChart, EstimatedVsActualChart,
  HabitCompletionBarChart, MoodEnergyCorrelationChart,
  ActivityCapsuleChart, ProgressStatisticsCard, FeaturedQuestCard, ScheduleTimeblockCards
} from '../components/Charts';

export default function StatsPage() {
  const { state, setPage } = useApp();
  const { dateFilter, customDateRange } = state.ui;
  const activeGoal = state.goals.find(g => g.status === 'active');

  const bounds = getDateFilterBounds(dateFilter, customDateRange, activeGoal);

  // Filter tasks in current time scope
  const tasksInScope = useMemo(() => {
    return state.tasks.filter(t => t.date >= bounds.start && t.date <= bounds.end);
  }, [state.tasks, bounds]);

  // Previous period tasks for comparison calculation (+X% vs last period)
  const prevPeriodTasks = useMemo(() => {
    const span = Math.max(1, daysBetween(bounds.start, bounds.end));
    const prevEnd = addDays(bounds.start, -1);
    const prevStart = addDays(prevEnd, -span + 1);
    return state.tasks.filter(t => t.date >= prevStart && t.date <= prevEnd);
  }, [state.tasks, bounds]);

  // Detailed statistics calculations
  const stats = useMemo(() => {
    const totalCreated = tasksInScope.length;
    const totalCompleted = tasksInScope.filter(t => t.completed).length;
    const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    // Previous period stats
    const prevTotal = prevPeriodTasks.length;
    const prevCompleted = prevPeriodTasks.filter(t => t.completed).length;
    const prevRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;
    const rateDiff = completionRate - prevRate;

    // Days calculation
    const daysSet = new Set(tasksInScope.map(t => t.date));
    const daysTracked = daysSet.size;
    const totalDaysInInterval = Math.max(1, daysBetween(bounds.start, Math.min(today(), bounds.end)));
    const daysMissed = Math.max(0, totalDaysInInterval - daysTracked);

    // Averages
    const avgTasksPerDay = daysTracked > 0 ? (totalCompleted / daysTracked).toFixed(1) : '0';

    // XP in range
    let xpInRange = 0;
    const xpByDate = {};
    tasksInScope.filter(t => t.completed).forEach(t => {
      const xp = t.priority === 'High' ? 40 : (t.priority === 'Medium' ? 20 : 10);
      xpInRange += xp;
      xpByDate[t.date] = (xpByDate[t.date] || 0) + xp;
    });
    const avgXPPerDay = daysTracked > 0 ? Math.round(xpInRange / daysTracked) : 0;

    // Time of day determination
    const timeHours = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    tasksInScope.filter(t => t.completed && t.completedAt).forEach(t => {
      const h = new Date(t.completedAt).getHours();
      if (h >= 6 && h < 12) timeHours.Morning++;
      else if (h >= 12 && h < 17) timeHours.Afternoon++;
      else if (h >= 17 && h < 22) timeHours.Evening++;
      else timeHours.Night++;
    });
    let bestTimeOfDay = 'Morning';
    let maxHourCount = 0;
    Object.entries(timeHours).forEach(([time, count]) => {
      if (count > maxHourCount) { maxHourCount = count; bestTimeOfDay = time; }
    });

    // Daily completion sparkline series
    const sortedDates = Array.from(daysSet).sort();
    const sparklineCompleted = sortedDates.slice(-14).map(d => {
      return tasksInScope.filter(t => t.date === d && t.completed).length;
    });
    const sparklineXP = sortedDates.slice(-14).map(d => xpByDate[d] || 0);

    return {
      totalCreated,
      totalCompleted,
      completionRate,
      rateDiff,
      daysTracked,
      daysMissed,
      avgTasksPerDay,
      avgXPPerDay,
      bestTimeOfDay,
      sparklineCompleted,
      sparklineXP,
    };
  }, [tasksInScope, prevPeriodTasks, bounds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>📊 Mission Analytics</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Deep productivity telemetry, velocity tracking, and behavioral patterns.
          </p>
        </div>
      </div>

      {/* Global Date Filter Bar */}
      <DateFilterBar />

      {/* ── Liquid Glass Hero Dashboard (Activity, Progress, Featured Quest & Schedule as in PNG) ── */}
      <div style={{ position: 'relative', marginTop: 4, marginBottom: 8 }}>
        {/* Ambient atmospheric glows */}
        <div
          style={{
            position: 'absolute',
            top: -50,
            left: -40,
            width: 320,
            height: 320,
            background: 'radial-gradient(circle, rgba(190, 242, 100, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(50px)',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: -30,
            width: 340,
            height: 340,
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(60px)',
            zIndex: 0,
          }}
        />

        {/* Top Split: Progress statistics + Featured Quest (Left) & Activity Capsule Bars + By Category list (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 20,
            position: 'relative',
            zIndex: 1,
            marginBottom: 20,
          }}
        >
          {/* Left Column: Progress Statistics & Featured Quest */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ProgressStatisticsCard tasks={tasksInScope} stats={stats} />
            <FeaturedQuestCard activeGoal={activeGoal} tasks={tasksInScope} onAction={() => setPage(activeGoal ? 'goals' : 'today')} />
          </div>

          {/* Right Column: Hero Activity Capsule Bar Chart & By Category List */}
          <ActivityCapsuleChart tasks={tasksInScope} sessions={state.focusSessions} />
        </div>

        {/* Bottom Row: My Schedule 3 Timeblock Cards */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <ScheduleTimeblockCards tasks={tasksInScope} onAction={() => setPage('today')} />
        </div>
      </div>

      {/* ── Key Metrics Cards with Sparklines & Comparisons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* 1. Completion Rate & Comparison */}
        <div className="stat-card liquid-glass-panel" style={{ padding: 18, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Efficiency</span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: stats.rateDiff >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}>
              {stats.rateDiff >= 0 ? `+${stats.rateDiff}%` : `${stats.rateDiff}%`} vs prev
            </span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0' }}>
            {stats.completionRate}%
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {stats.totalCompleted} of {stats.totalCreated} tasks
            </span>
            <MiniSparkline data={stats.sparklineCompleted} color="#34d399" />
          </div>
        </div>

        {/* 2. Days Tracked vs Missed */}
        <div className="stat-card liquid-glass-panel" style={{ padding: 18, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Days Tracked</span>
            <span style={{ fontSize: 11, color: stats.daysMissed === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {stats.daysMissed} missed
            </span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-cyan)', margin: '6px 0' }}>
            {stats.daysTracked} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>days</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Active consistency in selected scope
          </div>
        </div>

        {/* 3. Daily Velocity */}
        <div className="stat-card liquid-glass-panel" style={{ padding: 18, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Tasks / Day</span>
            <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>Velocity</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-violet)', margin: '6px 0' }}>
            {stats.avgTasksPerDay} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>tasks</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ~{stats.avgXPPerDay} XP daily gain
            </span>
            <MiniSparkline data={stats.sparklineXP} color="#a78bfa" />
          </div>
        </div>

        {/* 4. Peak Productivity Period */}
        <div className="stat-card liquid-glass-panel" style={{ padding: 18, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Prime Focus Hour</span>
            <span style={{ fontSize: 16 }}>⏰</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-amber)', margin: '6px 0' }}>
            {stats.bestTimeOfDay}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Most frequent quest completion time
          </div>
        </div>
      </div>

      {/* ── Empty State if No Data in Scope ── */}
      {tasksInScope.length === 0 ? (
        <div className="glass-card" style={{ padding: 50, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Data in Selected Time Scope</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 18px' }}>
            Try selecting "All Time", "Last 30 Days", or start completing tasks to view rich graphs and historical benchmarks.
          </div>
        </div>
      ) : (
        <>
          {/* ── Row 1: Goal Period Progress & Stacked Status ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
            <ChartCard
              title="🎯 Goal Period Pace"
              subtitle="Actual cumulative completions vs ideal pace line and target"
            >
              <GoalPaceChart />
            </ChartCard>

            <ChartCard
              title="📊 Quest Status Breakdown"
              subtitle="Completed vs pending vs overdue tasks"
            >
              <StackedStatusChart tasks={tasksInScope} bounds={bounds} />
            </ChartCard>
          </div>

          {/* ── Row 2: Category Radar & Priority Horizontal Bar ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
            <ChartCard
              title="🕸️ Category Discipline Radar"
              subtitle="Multi-attribute performance across quest categories"
            >
              <CategoryRadarChart tasks={tasksInScope} />
            </ChartCard>

            <ChartCard
              title="⚡ Output by Priority Level"
              subtitle="Completed vs total tasks across Low, Medium, and High"
            >
              <PriorityBarChart tasks={tasksInScope} />
            </ChartCard>
          </div>

          {/* ── Row 3: Cumulative Growth & Weekday Heat Pattern ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
            <ChartCard
              title="📈 Cumulative Growth Trajectory"
              subtitle="Total tasks conquered over chronological timeline"
            >
              <CumulativeCompletedChart tasks={tasksInScope} />
            </ChartCard>

            <ChartCard
              title="🗓️ Weekday Efficiency Matrix"
              subtitle="Average completion rate per day of the week"
            >
              <WeekdayPatternChart tasks={tasksInScope} />
            </ChartCard>
          </div>

          {/* ── Row 4: Time of Day & Monthly Comparison ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
            <ChartCard
              title="⏰ Time-of-Day Execution Distribution"
              subtitle="When objectives are checked off throughout the 24-hour cycle"
            >
              <TimeOfDayChart tasks={tasksInScope} />
            </ChartCard>

            <ChartCard
              title="📅 Month-over-Month Velocity"
              subtitle="Current month daily output compared directly to previous month"
            >
              <MonthlyComparisonChart tasks={state.tasks} />
            </ChartCard>
          </div>

          {/* ── Row 5: Periodic Summary & Streak Timeline ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
            <ChartCard
              title="📋 Periodic Output Summary"
              subtitle="Weekly and monthly aggregated completions"
            >
              <SummaryBarsChart tasks={tasksInScope} />
            </ChartCard>

            <ChartCard
              title="🔥 Streak Durability Timeline"
              subtitle="Historical streaks tracked as discrete endurance bars"
            >
              <StreakTimelineChart dayHistory={state.dayHistory} />
            </ChartCard>
          </div>

          {/* ── Row 6: Category Distribution & Leaderboards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
            <ChartCard
              title="🍩 Category Allocation"
              subtitle="Proportional workload distribution"
            >
              <CategoryPieChart tasks={tasksInScope} />
            </ChartCard>

            <div>
              <LeaderboardCards tasks={tasksInScope} />
            </div>
          </div>

          {/* ── Row 7: Focus Session & Pomodoro Analytics ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
            <ChartCard
              title="⏱️ Focus Minutes Per Day"
              subtitle="Daily deep work minutes logged in focus mode"
            >
              <FocusMinutesChart sessions={state.focusSessions} />
            </ChartCard>

            <ChartCard
              title="🍩 Focus By Category"
              subtitle="Where your deep attention is allocated"
            >
              <FocusCategoryPieChart sessions={state.focusSessions} />
            </ChartCard>

            <ChartCard
              title="📊 Estimated vs Actual Duration"
              subtitle="Planned minutes vs actual tracked focus minutes per task"
            >
              <EstimatedVsActualChart tasks={tasksInScope} sessions={state.focusSessions} />
            </ChartCard>
          </div>

          {/* ── Row 8: Habit Performance & Mood / Energy Correlation ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
            <ChartCard
              title="✨ Habit Consistency Rates"
              subtitle="Percentage completion per recurring routine"
            >
              <HabitCompletionBarChart habits={state.habits} habitLogs={state.habitLogs} />
            </ChartCard>

            <ChartCard
              title="🌙 Mood & Energy vs Productivity Correlation"
              subtitle="Tracking how mental state influences task completion rates"
            >
              <MoodEnergyCorrelationChart dailyReviews={state.dailyReviews} dayHistory={state.dayHistory} />
            </ChartCard>
          </div>

          {/* ── Row 9: 12-Month Contribution Heatmap ── */}
          <ChartCard
            title="🌌 Full-Year 12-Month Contribution Grid"
            subtitle="365-day density matrix of tasks completed"
          >
            <YearHeatmapChart tasks={state.tasks} />
          </ChartCard>
        </>
      )}
    </div>
  );
}
