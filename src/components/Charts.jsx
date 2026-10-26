import React, { useMemo, useState, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import {
  today, formatDate, parseDate, addDays, daysBetween, getCategoryColor,
  getDateFilterBounds, PRIORITIES, DEFAULT_CATEGORIES
} from '../utils/constants';

const CHART_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fb7185', '#fbbf24', '#60a5fa', '#f472b6'];

// ─── Liquid Glass Chart Tooltip ───────────────────────────────────────────────
export const CustomGlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08))',
      border: '1px solid rgba(255, 255, 255, 0.35)',
      borderRadius: 16,
      padding: '10px 16px',
      fontSize: 12,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 10px 30px rgba(0, 0, 0, 0.4)',
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.stroke || '#fff', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.stroke || '#fff' }} />
          <span>{p.name}:</span>
          <strong style={{ color: '#ffffff' }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── Chart Card Container with PNG Export ─────────────────────────────────────
export function ChartCard({ title, subtitle, children, actions }) {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const exportAsPng = async () => {
    if (!cardRef.current || exporting) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000007',
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `zorolevel-chart-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      a.click();
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="chart-card liquid-glass-panel"
      style={{
        padding: 20,
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--glass-border-bright)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {actions}
          <button
            className="btn btn-sm"
            onClick={exportAsPng}
            title="Download chart as PNG image"
            style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(255,255,255,0.05)' }}
          >
            {exporting ? 'Exporting…' : '📷 PNG'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 220, position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Mini SVG Sparkline Component ─────────────────────────────────────────────
export function MiniSparkline({ data = [], color = '#22d3ee', width = 80, height = 24 }) {
  if (!data?.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1 || 1)) * (width - 4) + 2;
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
export function ProgressRing({ pct = 0, size = 100, strokeWidth = 8, color = '#22d3ee' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dashoffset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;

  return (
    <div className="progress-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring-svg">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="ring-fill" cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={dashoffset}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x={size / 2} y={size / 2 + 5} className="ring-text" fill="white" fontSize={size / 4} fontWeight={800}>
          {Math.round(pct)}%
        </text>
      </svg>
    </div>
  );
}

// ─── 1. Goal Period Progress: Actual vs Ideal Pace Line ────────────────────────
export function GoalPaceChart() {
  const { state } = useApp();
  const activeGoal = state.goals.find(g => g.status === 'active') || state.goals[0];

  const data = useMemo(() => {
    if (!activeGoal) return [];
    const totalDays = daysBetween(activeGoal.startDate, activeGoal.endDate);
    const target = activeGoal.targetValue || 100;
    const idealPerDay = target / (totalDays || 1);

    const result = [];
    let actualCum = 0;
    let idealCum = 0;

    const todayStr = today();
    const currD = parseDate(activeGoal.startDate);

    for (let i = 0; i < totalDays; i++) {
      const dStr = formatDate(currD);
      idealCum = Math.min(target, Math.round((i + 1) * idealPerDay));

      if (dStr <= todayStr) {
        const tasksOnDay = state.tasks.filter(t => t.date === dStr && t.completed).length;
        actualCum += tasksOnDay;
        result.push({
          date: dStr.slice(5),
          Actual: actualCum,
          Ideal: idealCum,
          Target: target,
        });
      } else {
        result.push({
          date: dStr.slice(5),
          Ideal: idealCum,
          Target: target,
        });
      }
      currD.setDate(currD.getDate() + 1);
    }
    return result;
  }, [activeGoal, state.tasks]);

  if (!activeGoal) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        Create an active Goal Period to track actual vs ideal velocity
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
        <Line type="monotone" dataKey="Target" stroke="#f43f5e" strokeDasharray="5 5" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="Ideal" stroke="#a78bfa" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="Actual" stroke="#22d3ee" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── 2. Stacked Bar: Completed vs Pending vs Overdue ───────────────────────────
export function StackedStatusChart({ tasks = [], bounds }) {
  const [granularity, setGranularity] = useState('daily'); // 'daily' | 'weekly'
  const todayStr = today();

  const data = useMemo(() => {
    if (!tasks?.length) return [];
    if (granularity === 'daily') {
      const map = {};
      tasks.forEach(t => {
        if (!map[t.date]) map[t.date] = { date: t.date.slice(5), Completed: 0, Pending: 0, Overdue: 0 };
        if (t.completed) {
          map[t.date].Completed++;
        } else if ((t.endDate || t.date) < todayStr) {
          map[t.date].Overdue++;
        } else {
          map[t.date].Pending++;
        }
      });
      return Object.values(map).slice(-21);
    } else {
      // Group by week
      const map = {};
      tasks.forEach(t => {
        const d = parseDate(t.date);
        const wk = `Wk ${Math.ceil((d.getDate() + 6) / 7)} (${d.toLocaleDateString('en', { month: 'short' })})`;
        if (!map[wk]) map[wk] = { date: wk, Completed: 0, Pending: 0, Overdue: 0 };
        if (t.completed) map[wk].Completed++;
        else if ((t.endDate || t.date) < todayStr) map[wk].Overdue++;
        else map[wk].Pending++;
      });
      return Object.values(map).slice(-10);
    }
  }, [tasks, granularity, todayStr]);

  if (!data.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No tasks in selected range</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <div className="toggle-group" style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
          <button className={`toggle-btn ${granularity === 'daily' ? 'active' : ''}`} onClick={() => setGranularity('daily')}>Daily</button>
          <button className={`toggle-btn ${granularity === 'weekly' ? 'active' : ''}`} onClick={() => setGranularity('weekly')}>Weekly</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomGlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Completed" stackId="a" fill="#34d399" radius={[0, 0, 12, 12]} barSize={26} />
          <Bar dataKey="Pending" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} barSize={26} />
          <Bar dataKey="Overdue" stackId="a" fill="#f43f5e" radius={[12, 12, 0, 0]} barSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 3. Weekly & Monthly Summary Bars ─────────────────────────────────────────
export function SummaryBarsChart({ tasks = [] }) {
  const [period, setPeriod] = useState('weekly'); // 'weekly' | 'monthly'

  const data = useMemo(() => {
    if (!tasks?.length) return [];
    const map = {};

    tasks.forEach(t => {
      const d = parseDate(t.date);
      let key;
      if (period === 'weekly') {
        const weekNum = Math.ceil((d.getDate() + 6) / 7);
        key = `W${weekNum} ${d.toLocaleDateString('en', { month: 'short' })}`;
      } else {
        key = d.toLocaleDateString('en', { month: 'short', year: 'numeric' });
      }

      if (!map[key]) map[key] = { name: key, total: 0, done: 0 };
      map[key].total++;
      if (t.completed) map[key].done++;
    });

    return Object.values(map).slice(-8).map(item => ({
      name: item.name,
      Completed: item.done,
      Rate: item.total > 0 ? Math.round((item.done / item.total) * 100) : 0,
    }));
  }, [tasks, period]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <div className="toggle-group" style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
          <button className={`toggle-btn ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
          <button className={`toggle-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomGlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Completed" fill="#a78bfa" radius={[16, 16, 16, 16]} barSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 4. Radar Chart: Performance by Category ──────────────────────────────────
export function CategoryRadarChart({ tasks = [] }) {
  const data = useMemo(() => {
    if (!tasks?.length) return [];
    const map = {};
    DEFAULT_CATEGORIES.forEach(c => { map[c] = { total: 0, completed: 0 }; });

    tasks.forEach(t => {
      const cat = t.category || 'Personal';
      if (!map[cat]) map[cat] = { total: 0, completed: 0 };
      map[cat].total++;
      if (t.completed) map[cat].completed++;
    });

    return Object.entries(map).map(([category, d]) => ({
      subject: category,
      Rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
      Count: d.completed,
    }));
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 600 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#555577" />
        <Radar name="Completion %" dataKey="Rate" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
        <Tooltip content={<CustomGlassTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── 5. Horizontal Bar: Priority Breakdown ────────────────────────────────────
export function PriorityBarChart({ tasks = [] }) {
  const data = useMemo(() => {
    return PRIORITIES.map(p => {
      const prioTasks = tasks.filter(t => t.priority === p);
      const total = prioTasks.length;
      const completed = prioTasks.filter(t => t.completed).length;
      return {
        priority: p,
        Total: total,
        Completed: completed,
      };
    });
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart layout="vertical" data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis type="number" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="priority" type="category" tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Total" fill="rgba(255,255,255,0.08)" radius={[14, 14, 14, 14]} barSize={22} />
        <Bar dataKey="Completed" fill="#34d399" radius={[14, 14, 14, 14]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 6. Weekday Pattern: Average Completion Rate ──────────────────────────────
export function WeekdayPatternChart({ tasks = [] }) {
  const data = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = days.map(() => ({ total: 0, completed: 0 }));

    tasks.forEach(t => {
      const dow = parseDate(t.date).getDay();
      counts[dow].total++;
      if (t.completed) counts[dow].completed++;
    });

    return days.map((day, i) => ({
      day,
      'Avg %': counts[i].total > 0 ? Math.round((counts[i].completed / counts[i].total) * 100) : 0,
      Total: counts[i].total,
    }));
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="day" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Bar dataKey="Avg %" fill="#22d3ee" radius={[16, 16, 16, 16]} barSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 7. Time-of-Day Chart: Morning / Afternoon / Evening / Night ──────────────
export function TimeOfDayChart({ tasks = [] }) {
  const data = useMemo(() => {
    const periods = {
      'Morning (06-12)': { count: 0, fill: '#fbbf24' },
      'Afternoon (12-17)': { count: 0, fill: '#22d3ee' },
      'Evening (17-22)': { count: 0, fill: '#a78bfa' },
      'Night (22-06)': { count: 0, fill: '#60a5fa' },
    };

    tasks.filter(t => t.completed && t.completedAt).forEach(t => {
      const hour = new Date(t.completedAt).getHours();
      if (hour >= 6 && hour < 12) periods['Morning (06-12)'].count++;
      else if (hour >= 12 && hour < 17) periods['Afternoon (12-17)'].count++;
      else if (hour >= 17 && hour < 22) periods['Evening (17-22)'].count++;
      else periods['Night (22-06)'].count++;
    });

    return Object.entries(periods).map(([name, d]) => ({
      name,
      Completions: d.count,
      fill: d.fill,
    }));
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Bar dataKey="Completions" radius={[4, 4, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 8. Streak Timeline: Each Streak as a Bar ─────────────────────────────────
export function StreakTimelineChart({ dayHistory = {} }) {
  const streaks = useMemo(() => {
    const dates = Object.keys(dayHistory).sort();
    if (!dates.length) return [];

    const list = [];
    let currentStart = null;
    let length = 0;

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const d = dayHistory[date];
      if (d.completedTasks > 0) {
        if (!currentStart) currentStart = date;
        length++;
      } else {
        if (currentStart) {
          list.push({ start: currentStart, end: dates[i - 1], length });
          currentStart = null;
          length = 0;
        }
      }
    }
    if (currentStart) {
      list.push({ start: currentStart, end: dates[dates.length - 1], length });
    }

    return list.slice(-8).map((s, idx) => ({
      streak: `#${idx + 1} (${s.start.slice(5)} to ${s.end.slice(5)})`,
      Days: s.length,
    }));
  }, [dayHistory]);

  if (!streaks.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No streaks recorded yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart layout="vertical" data={streaks} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis type="number" tick={{ fill: '#8888aa', fontSize: 10 }} />
        <YAxis dataKey="streak" type="category" tick={{ fill: '#8888aa', fontSize: 10 }} width={120} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Bar dataKey="Days" fill="#fbbf24" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 9. Cumulative Line: Total Tasks Completed Over Time ──────────────────────
export function CumulativeCompletedChart({ tasks = [] }) {
  const data = useMemo(() => {
    const dates = Array.from(new Set(tasks.map(t => t.date))).sort();
    let cum = 0;
    return dates.map(d => {
      const done = tasks.filter(t => t.date === d && t.completed).length;
      cum += done;
      return {
        date: d.slice(5),
        Total: cum,
      };
    }).slice(-30);
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
        <defs>
          <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Area type="monotone" dataKey="Total" stroke="#34d399" fill="url(#cumGrad)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── 10. Monthly Comparison: This Month vs Last Month ─────────────────────────
export function MonthlyComparisonChart({ tasks = [] }) {
  const data = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const lastMonthDate = new Date(curYear, curMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return days.map(day => {
      const curStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const lastStr = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const curDone = tasks.filter(t => t.date === curStr && t.completed).length;
      const lastDone = tasks.filter(t => t.date === lastStr && t.completed).length;

      return {
        day: `Day ${day}`,
        'This Month': curDone,
        'Last Month': lastDone,
      };
    });
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="day" tick={{ fill: '#8888aa', fontSize: 10 }} interval={4} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="Last Month" stroke="#8888aa" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="This Month" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── 11. Full-Year 12-Month Contribution Heatmap (With Slicer & High Visibility) ─
export function YearHeatmapChart({ tasks = [] }) {
  const [slicer, setSlicer] = useState('year'); // 'year' | 'months' | 'weeks'
  const todayStr = today();

  // Scope configurations
  const daysBack = slicer === 'year' ? 364 : (slicer === 'months' ? 182 : 56);
  const boxSize = slicer === 'year' ? 11 : (slicer === 'months' ? 14 : 22);
  const gapSize = slicer === 'year' ? 3 : (slicer === 'months' ? 4 : 6);

  const { weeks, monthLabels, totalContributions } = useMemo(() => {
    const map = {};
    let total = 0;
    (tasks || []).forEach(t => {
      if (!map[t.date]) map[t.date] = { count: 0 };
      if (t.completed) {
        map[t.date].count++;
        total++;
      }
    });

    const w = [];
    const labels = [];
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - daysBack);

    let cur = new Date(start);
    let curWeek = [];
    let lastMonth = -1;

    while (cur <= end) {
      const dStr = formatDate(cur);
      const count = map[dStr]?.count || 0;
      const month = cur.getMonth();

      if (month !== lastMonth && cur.getDate() <= 7) {
        labels.push({
          index: w.length,
          name: cur.toLocaleDateString('en', { month: 'short' }),
        });
        lastMonth = month;
      }

      curWeek.push({
        date: dStr,
        count,
        dayOfWeek: cur.getDay(),
        formattedDate: cur.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
      });

      if (cur.getDay() === 6 || cur.getTime() === end.getTime()) {
        w.push(curWeek);
        curWeek = [];
      }
      cur.setDate(cur.getDate() + 1);
    }
    if (curWeek.length > 0) w.push(curWeek);

    return { weeks: w, monthLabels: labels, totalContributions: total };
  }, [tasks, daysBack]);

  // High-visibility, luminous progressive color scale (from less to more)
  const getBoxStyle = (count, isToday) => {
    if (count === 0) {
      return {
        background: 'rgba(255, 255, 255, 0.05)',
        border: isToday ? '1.5px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: isToday ? '0 0 8px rgba(255, 255, 255, 0.5)' : 'none',
      };
    }
    if (count === 1) {
      return {
        background: '#047857', // Solid deep visible emerald
        border: isToday ? '1.5px solid #ffffff' : '1px solid #10b981',
        boxShadow: '0 0 5px rgba(16, 185, 129, 0.4)',
      };
    }
    if (count === 2) {
      return {
        background: '#10b981', // Radiant vivid mint
        border: isToday ? '1.5px solid #ffffff' : '1px solid #34d399',
        boxShadow: '0 0 8px rgba(16, 185, 129, 0.65)',
      };
    }
    if (count <= 4) {
      return {
        background: '#34d399', // Bright luminous emerald
        border: isToday ? '1.5px solid #ffffff' : '1px solid #6ee7b7',
        boxShadow: '0 0 12px rgba(52, 211, 153, 0.85)',
      };
    }
    // 5+ tasks: peak cosmic radiance
    return {
      background: '#6ee7b7', // Ultra-radiant bright neon mint
      border: '1.5px solid #ffffff',
      boxShadow: '0 0 16px rgba(110, 231, 183, 1), inset 0 1px 2px #ffffff',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Slicer Controls & Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {/* Slicer Tabs: Year / Months / Weeks */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: 999,
            padding: 3,
            gap: 2,
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${slicer === 'year' ? 'btn-primary' : ''}`}
            onClick={() => setSlicer('year')}
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: slicer === 'year' ? 800 : 600,
              border: slicer === 'year' ? undefined : 'none',
              background: slicer === 'year' ? undefined : 'transparent',
              color: slicer === 'year' ? '#fff' : '#a0aab8',
              cursor: 'pointer',
            }}
          >
            Year (12M)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${slicer === 'months' ? 'btn-primary' : ''}`}
            onClick={() => setSlicer('months')}
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: slicer === 'months' ? 800 : 600,
              border: slicer === 'months' ? undefined : 'none',
              background: slicer === 'months' ? undefined : 'transparent',
              color: slicer === 'months' ? '#fff' : '#a0aab8',
              cursor: 'pointer',
            }}
          >
            Months (6M)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${slicer === 'weeks' ? 'btn-primary' : ''}`}
            onClick={() => setSlicer('weeks')}
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: slicer === 'weeks' ? 800 : 600,
              border: slicer === 'weeks' ? undefined : 'none',
              background: slicer === 'weeks' ? undefined : 'transparent',
              color: slicer === 'weeks' ? '#fff' : '#a0aab8',
              cursor: 'pointer',
            }}
          >
            Weeks (8W)
          </button>
        </div>

        {/* Total Metric Badge */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
          <strong style={{ color: '#22d3ee', fontWeight: 800 }}>{totalContributions}</strong> tasks completed in view
        </div>
      </div>

      {/* Grid Canvas */}
      <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
        <div style={{ display: 'flex', gap: gapSize, minWidth: slicer === 'year' ? 680 : (slicer === 'months' ? 440 : 260) }}>
          {/* Day of Week Labels (Mon, Wed, Fri) shown on Weeks and Months view */}
          {slicer !== 'year' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: gapSize, marginRight: 6, justifyContent: 'space-between', paddingBottom: 2 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dName, di) => (
                <div
                  key={di}
                  style={{
                    height: boxSize,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: slicer === 'weeks' ? 11 : 9,
                    color: di % 2 === 1 ? '#a0aab8' : 'transparent',
                    fontWeight: 700,
                    userSelect: 'none',
                  }}
                >
                  {di % 2 === 1 ? dName : ''}
                </div>
              ))}
            </div>
          )}

          {/* Weeks Columns */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: gapSize }}>
              {week.map(d => {
                const isToday = d.date === todayStr;
                const styleProps = getBoxStyle(d.count, isToday);

                return (
                  <div
                    key={d.date}
                    title={`${d.formattedDate}: ${d.count} tasks completed`}
                    style={{
                      width: boxSize,
                      height: boxSize,
                      borderRadius: slicer === 'weeks' ? 6 : 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 900,
                      color: d.count > 0 ? '#000000' : 'transparent',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      ...styleProps,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.22)'; e.currentTarget.style.zIndex = '5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '1'; }}
                  >
                    {slicer === 'weeks' && d.count > 0 ? d.count : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* High-Visibility Gradient Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
        <span style={{ fontSize: 11, color: '#71767f' }}>
          {slicer === 'year' ? '364-day historical activity' : (slicer === 'months' ? 'Last 26 weeks summary' : 'Last 8 weeks zoomed view')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Less</span>
          <span title="0 tasks" style={{ width: 11, height: 11, borderRadius: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <span title="1 task" style={{ width: 11, height: 11, borderRadius: 2, background: '#047857', boxShadow: '0 0 4px rgba(16,185,129,0.3)' }} />
          <span title="2 tasks" style={{ width: 11, height: 11, borderRadius: 2, background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
          <span title="3-4 tasks" style={{ width: 11, height: 11, borderRadius: 2, background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.7)' }} />
          <span title="5+ tasks" style={{ width: 11, height: 11, borderRadius: 2, background: '#6ee7b7', border: '1px solid #fff', boxShadow: '0 0 10px rgba(110,231,183,0.9)' }} />
          <span style={{ fontWeight: 600 }}>More</span>
        </div>
      </div>
    </div>
  );
}

// ─── 12. Leaderboards: Top 5 Days & Top 5 Categories ──────────────────────────
export function LeaderboardCards({ tasks = [] }) {
  const topDays = useMemo(() => {
    const map = {};
    tasks.filter(t => t.completed).forEach(t => {
      map[t.date] = (map[t.date] || 0) + 1;
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tasks]);

  const topCategories = useMemo(() => {
    const map = {};
    tasks.filter(t => t.completed).forEach(t => {
      const c = t.category || 'Personal';
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map)
      .map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tasks]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      {/* Top 5 Days */}
      <div className="glass-card liquid-glass-panel" style={{ padding: 18, borderRadius: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-amber)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          👑 Most Productive Days
        </div>
        {topDays.map((d, i) => (
          <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              #{i + 1} {d.date}
            </span>
            <span style={{ fontWeight: 700, color: '#34d399' }}>{d.count} tasks</span>
          </div>
        ))}
      </div>

      {/* Top Categories */}
      <div className="glass-card liquid-glass-panel" style={{ padding: 18, borderRadius: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-violet)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          🏷️ Top Categories by Output
        </div>
        {topCategories.map((c, i) => (
          <div key={c.cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              #{i + 1} {c.cat}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{c.count} tasks</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Breakdown Donut Chart ───────────────────────────────────────────
export function CategoryPieChart({ tasks = [] }) {
  const data = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const cat = t.category || 'Personal';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name) || CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomGlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── XP Over Time Chart (for ProfilePage) ─────────────────────────────────────
export function XPLineChart() {
  const { state } = useApp();

  const data = useMemo(() => {
    const list = state.xpHistory || state.profile?.xpHistory || [];
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = 0;
    return sorted.slice(-30).map(e => {
      cumulative += e.xp;
      const d = parseDate(e.date);
      return {
        name: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        xp: cumulative,
      };
    });
  }, [state.xpHistory, state.profile?.xpHistory]);

  if (data.length < 2) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Complete tasks to see XP history</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="xpProfileGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Area type="monotone" dataKey="xp" stroke="#a78bfa" fill="url(#xpProfileGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── 1. Focus Minutes Per Day Chart ───────────────────────────────────────────
export function FocusMinutesChart({ sessions = [] }) {
  const data = useMemo(() => {
    const map = {};
    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map[formatDate(d)] = 0;
    }
    sessions.forEach(s => {
      if (map[s.date] !== undefined) {
        map[s.date] += (s.durationMinutes || 0);
      }
    });

    return Object.entries(map).map(([date, minutes]) => {
      const parsed = parseDate(date);
      return {
        date: parsed.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        minutes,
      };
    });
  }, [sessions]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Bar dataKey="minutes" fill="var(--accent-cyan)" radius={[6, 6, 0, 0]} name="Focus Minutes" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 2. Focus By Category Donut ───────────────────────────────────────────────
export function FocusCategoryPieChart({ sessions = [] }) {
  const data = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const cat = s.category || 'General';
      map[cat] = (map[cat] || 0) + (s.durationMinutes || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  if (!data.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No focus sessions logged yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name) || CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomGlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── 3. Estimated vs Actual Duration Chart ────────────────────────────────────
export function EstimatedVsActualChart({ tasks = [], sessions = [] }) {
  const data = useMemo(() => {
    const focusMap = {};
    sessions.forEach(s => {
      if (s.taskId) focusMap[s.taskId] = (focusMap[s.taskId] || 0) + (s.durationMinutes || 0);
    });

    return (tasks || [])
      .filter(t => t && t.completed)
      .slice(-8)
      .map(t => {
        const title = String(t?.title || t?.name || 'Task');
        return {
          name: title.length > 14 ? `${title.slice(0, 14)}…` : title,
          estimated: t.estimatedMinutes || 30,
          actual: focusMap[t.id] || (t.estimatedMinutes ? Math.round(t.estimatedMinutes * 0.9) : 25),
        };
      });
  }, [tasks, sessions]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="estimated" fill="rgba(255,255,255,0.2)" radius={[14, 14, 14, 14]} barSize={20} name="Estimated (m)" />
        <Bar dataKey="actual" fill="var(--accent-amber)" radius={[14, 14, 14, 14]} barSize={20} name="Actual Focus (m)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 4. Habit Completion Rates Bar Chart ──────────────────────────────────────
export function HabitCompletionBarChart({ habits = [], habitLogs = [] }) {
  const data = useMemo(() => {
    return (habits || []).map(h => {
      const logs = (habitLogs || []).filter(l => l && l.habitId === h?.id);
      const done = logs.filter(l => l.completed).length;
      const rate = logs.length > 0 ? Math.round((done / logs.length) * 100) : 0;
      const title = String(h?.title || h?.name || 'Habit');
      return {
        name: title.length > 12 ? `${title.slice(0, 12)}…` : title,
        rate,
        color: h?.color || 'var(--accent-cyan)',
      };
    });
  }, [habits, habitLogs]);

  if (!data.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Add habits to view completion rates</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Bar dataKey="rate" fill="var(--accent-emerald)" radius={[6, 6, 0, 0]} name="Completion %" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 5. Mood & Energy Correlation Chart ───────────────────────────────────────
export function MoodEnergyCorrelationChart({ dailyReviews = {}, dayHistory = {} }) {
  const data = useMemo(() => {
    const list = Object.entries(dailyReviews).sort(([a], [b]) => a.localeCompare(b));
    return list.slice(-14).map(([date, r]) => {
      const hist = dayHistory[date];
      const completionPct = hist && hist.totalTasks > 0
        ? Math.round((hist.completedTasks / hist.totalTasks) * 100)
        : 75;
      const parsed = parseDate(date);
      return {
        date: parsed.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        mood: (r.mood || 3) * 20, // Scale 1-5 to 20-100%
        energy: (r.energy || 3) * 20,
        completion: completionPct,
      };
    });
  }, [dailyReviews, dayHistory]);

  if (!data.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Complete daily reviews to view mood & productivity correlation</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#8888aa', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomGlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="completion" stroke="var(--accent-cyan)" strokeWidth={2} name="Task Completion %" />
        <Line type="monotone" dataKey="mood" stroke="var(--accent-emerald)" strokeWidth={2} name="Mood Index %" />
        <Line type="monotone" dataKey="energy" stroke="var(--accent-amber)" strokeWidth={2} name="Energy Index %" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── 16. Hero Liquid Glass Activity Capsule Chart (From Design Spec) ─────────
export function ActivityCapsuleChart({ tasks = [], sessions = [] }) {
  // Compute 7 days of daily activity (hours) for Monday-Sunday of current week
  const weekData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const todayStr = formatDate(now);
    let maxHours = 0;

    const result = days.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const ds = formatDate(d);

      // Real focus session minutes recorded by the user
      const focusMins = (sessions || [])
        .filter(s => s && s.date === ds)
        .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

      // Real completed tasks and their estimated hours
      const completedTasks = (tasks || []).filter(t => t && t.date === ds && t.completed);
      const taskHours = completedTasks.reduce((sum, t) => sum + ((Number(t.estimatedMinutes) || 30) / 60), 0);

      const totalHours = Math.round(((focusMins / 60) + taskHours) * 10) / 10;
      if (totalHours > maxHours) maxHours = totalHours;

      return {
        day: dayName,
        date: ds,
        isToday: ds === todayStr,
        hours: totalHours,
        taskCount: completedTasks.length,
      };
    });

    return result.map(item => ({
      ...item,
      isPeak: maxHours > 0 ? item.hours === maxHours : item.isToday,
    }));
  }, [tasks, sessions]);

  // Overall total hours (strictly from user's actual tasks and focus sessions)
  const totalWeekHours = useMemo(() => {
    const sum = weekData.reduce((acc, d) => acc + d.hours, 0);
    return (Math.round(sum * 10) / 10).toFixed(1).replace('.', ',');
  }, [weekData]);

  // Real category breakdown from the user's tasks
  const categoryBreakdown = useMemo(() => {
    const catMap = {};

    (tasks || []).forEach(t => {
      const c = t.category || 'General';
      if (!catMap[c]) {
        catMap[c] = { tasks: 0, hours: 0, color: getCategoryColor(c) };
      }
      if (t.completed) {
        catMap[c].tasks++;
        catMap[c].hours += (Number(t.estimatedMinutes) || 30) / 60;
      }
    });

    const entries = Object.entries(catMap).filter(([_, data]) => data.tasks > 0);
    if (!entries.length) {
      // If none completed yet, show active tasks distribution
      (tasks || []).slice(0, 4).forEach(t => {
        const c = t.category || 'General';
        if (!catMap[c]) {
          catMap[c] = { tasks: 0, hours: 0, color: getCategoryColor(c) };
        }
        catMap[c].tasks++;
        catMap[c].hours += (Number(t.estimatedMinutes) || 30) / 60;
      });
    }

    return Object.entries(catMap)
      .slice(0, 4)
      .map(([name, data]) => ({
        name,
        tasks: data.tasks,
        hours: (Math.round(data.hours * 10) / 10).toFixed(1),
        color: data.color || '#22d3ee',
      }));
  }, [tasks]);

  return (
    <div
      className="glass-card liquid-glass-panel"
      style={{
        borderRadius: 28,
        padding: 24,
        background: 'linear-gradient(135deg, rgba(20, 24, 30, 0.85) 0%, rgba(13, 16, 20, 0.90) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header: Title & Capsule Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Activity</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 11,
            color: '#a0aab8',
          }}
        >
          <span>📅</span>
          <span>last 7 days</span>
        </div>
      </div>

      {/* Hero Stat: Real Hours */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#ffffff', letterSpacing: -1 }}>
            {totalWeekHours}
          </span>
          <span style={{ fontSize: 11, color: '#71767f', fontWeight: 600, textTransform: 'capitalize' }}>
            Hours spend
          </span>
        </div>
      </div>

      {/* 7-Day Ultra-Rounded Capsule Bars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 10,
          alignItems: 'flex-end',
          height: 170,
          paddingBottom: 4,
          position: 'relative',
        }}
      >
        {weekData.map((item, idx) => {
          const maxVal = Math.max(...weekData.map(w => w.hours), 1);
          const heightPct = item.hours > 0 ? Math.min(100, Math.max(28, Math.round((item.hours / maxVal) * 100))) : 20;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                position: 'relative',
              }}
            >
              {/* Floating Cyan Pill Tooltip on Peak Day */}
              {item.isPeak && (
                <div
                  className="capsule-badge-float"
                  style={{
                    position: 'absolute',
                    top: 0,
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      background: '#00d2d3',
                      color: '#09101d',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 14px rgba(0, 210, 211, 0.45)',
                    }}
                  >
                    {item.hours > 0 ? `${item.hours} hours` : 'Today'}
                  </div>
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '4px solid #00d2d3',
                    }}
                  />
                </div>
              )}

              {/* Capsule Bar Container */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 34,
                  height: 120,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 999,
                  padding: 2,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    borderRadius: 999,
                    background: item.isPeak
                      ? '#ffffff'
                      : 'linear-gradient(180deg, #2f3844 0%, #1c2229 100%)',
                    border: item.isPeak
                      ? '1px solid #ffffff'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: item.isPeak
                      ? '0 0 24px rgba(255, 255, 255, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.8)'
                      : 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  title={`${item.day}: ${item.hours}h (${item.taskCount} tasks)`}
                />
              </div>

              {/* Day Label */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: item.isPeak ? '#ffffff' : '#71767f',
                  marginTop: 8,
                }}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── By Category Breakdown List ── */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 18, marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>
          By Category
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categoryBreakdown.length > 0 ? (
            categoryBreakdown.map((cat, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: cat.color, fontSize: 13, fontWeight: 900 }}>✓</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>{cat.tasks} {cat.tasks === 1 ? 'Task' : 'Tasks'}</span>
                  <span style={{ color: '#71767f' }}>· {cat.name}</span>
                </div>
                <div style={{ color: '#ffffff', fontWeight: 800, fontFamily: 'monospace' }}>
                  {cat.hours} h
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 12, color: '#71767f', fontStyle: 'italic' }}>
              No category activity in this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 17. Progress Statistics Hero Card (Segmented Capsule Bar & Status Badges) ─
export function ProgressStatisticsCard({ tasks = [], stats }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const inProgress = tasks.filter(t => !t.completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : (stats?.completionRate ?? 0);

  const todayStr = today();
  const upComing = tasks.filter(t => !t.completed && (t.date > todayStr || (t.startDate && t.startDate > todayStr))).length;

  const pctProgress = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const pctCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pctUpcoming = total > 0 ? Math.max(0, 100 - pctProgress - pctCompleted) : 0;

  return (
    <div
      className="glass-card liquid-glass-panel"
      style={{
        borderRadius: 28,
        padding: 24,
        background: 'linear-gradient(135deg, rgba(20, 24, 30, 0.85) 0%, rgba(13, 16, 20, 0.90) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginBottom: 14 }}>
        Progress statisics
      </div>

      {/* Hero Completion Rate */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: '#ffffff', letterSpacing: -1 }}>
          {completionRate}%
        </span>
        <span style={{ fontSize: 11, color: '#71767f', fontWeight: 600 }}>
          Total Activity
        </span>
      </div>

      {/* Multi-Colored Segmented Capsule Bar */}
      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.06)',
          display: 'flex',
          gap: 4,
          overflow: 'hidden',
          marginBottom: 6,
        }}
      >
        {total > 0 ? (
          <>
            <div style={{ width: `${pctProgress}%`, background: '#bef264', borderRadius: 999 }} />
            <div style={{ width: `${pctCompleted}%`, background: '#22d3ee', borderRadius: 999 }} />
            <div style={{ width: `${pctUpcoming}%`, background: '#fbbf24', borderRadius: 999 }} />
          </>
        ) : (
          <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 999 }} />
        )}
      </div>

      {/* Segment percentage sublabels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#71767f', marginBottom: 20 }}>
        <span>{pctProgress}%</span>
        <span>{pctCompleted}%</span>
        <span>{pctUpcoming}%</span>
      </div>

      {/* 3 Color Icon Pill Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 'auto' }}>
        {/* Lime In Progress */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 18,
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#bef264',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#1a2e05',
              fontWeight: 800,
            }}
          >
            📋
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>{inProgress}</div>
          <div style={{ fontSize: 10, color: '#71767f', fontWeight: 600 }}>In Progress</div>
        </div>

        {/* Cyan Completed */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 18,
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#22d3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#083344',
              fontWeight: 800,
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>{completed}</div>
          <div style={{ fontSize: 10, color: '#71767f', fontWeight: 600 }}>Completed</div>
        </div>

        {/* Amber Upcoming */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 18,
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#451a03',
              fontWeight: 800,
            }}
          >
            📅
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>{total}</div>
          <div style={{ fontSize: 10, color: '#71767f', fontWeight: 600 }}>Total Tasks</div>
        </div>
      </div>
    </div>
  );
}

// ─── 18. Featured Quest / Goal Card (Connected 100% to Real Data) ────────────
export function FeaturedQuestCard({ activeGoal, tasks = [], onAction }) {
  // If active goal exists, show real goal data
  if (activeGoal) {
    const goalPct = Math.min(100, Math.round(((activeGoal.currentValue || 0) / Math.max(1, activeGoal.targetValue || 1)) * 100));
    const daysLeft = activeGoal.endDate ? Math.max(0, daysBetween(today(), activeGoal.endDate)) : 0;

    return (
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 28,
          padding: 24,
          background: 'linear-gradient(135deg, rgba(20, 24, 30, 0.85) 0%, rgba(13, 16, 20, 0.90) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Real Goal Badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(34, 211, 238, 0.15)',
                border: '1px solid rgba(34, 211, 238, 0.35)',
                color: '#22d3ee',
              }}
            >
              🎯 Active Goal
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#d1d5db',
              }}
            >
              {daysLeft > 0 ? `${daysLeft} days left` : 'Final day'}
            </span>
          </div>

          {/* User's Real Goal Title */}
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: -0.2 }}>
            {activeGoal.title}
          </h3>

          {/* Real Goal Description */}
          <p style={{ fontSize: 12, color: '#71767f', lineHeight: 1.5, margin: '0 0 18px 0' }}>
            {activeGoal.description || `Target: ${activeGoal.targetValue} ${activeGoal.unit || 'tasks'} between ${activeGoal.startDate} and ${activeGoal.endDate}`}
          </p>
        </div>

        {/* Real Progress Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#71767f', fontWeight: 600, marginBottom: 4 }}>
              Target Milestone
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
              {activeGoal.currentValue || 0} / {activeGoal.targetValue || 0} {activeGoal.unit || 'tasks'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#71767f', fontWeight: 600, marginBottom: 4, textAlign: 'right' }}>
              Completion Pace
            </div>
            <div
              style={{
                width: 120,
                height: 24,
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${goalPct}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  borderRadius: 999,
                  boxShadow: '0 0 10px rgba(251, 191, 36, 0.4)',
                }}
              />
              <span style={{ position: 'relative', zIndex: 2, fontSize: 11, fontWeight: 900, color: '#000' }}>
                {goalPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="btn"
          onClick={onAction}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 13,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          View Goal Period Details →
        </button>
      </div>
    );
  }

  // If no active goal, show top real active task
  const topTask = (tasks || []).find(t => !t.completed && t.priority === 'High') ||
                  (tasks || []).find(t => !t.completed) ||
                  (tasks || [])[0];

  if (topTask) {
    return (
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 28,
          padding: 24,
          background: 'linear-gradient(135deg, rgba(20, 24, 30, 0.85) 0%, rgba(13, 16, 20, 0.90) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                color: '#fbbf24',
              }}
            >
              ⚡ Top Focus Task
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#d1d5db',
              }}
            >
              {topTask.priority || 'Medium'} Priority
            </span>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: -0.2 }}>
            {topTask.title}
          </h3>

          <p style={{ fontSize: 12, color: '#71767f', lineHeight: 1.5, margin: '0 0 18px 0' }}>
            {topTask.description || `Scheduled for ${topTask.date} · Estimated ${topTask.estimatedMinutes || 30} minutes`}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#71767f', fontWeight: 600, marginBottom: 4 }}>
              Category & Rewards
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
              📁 {topTask.category || 'General'} · +{topTask.priority === 'High' ? 40 : 20} XP
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#71767f', fontWeight: 600, marginBottom: 4, textAlign: 'right' }}>
              Estimated Focus
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: 999,
                background: 'rgba(34, 211, 238, 0.15)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                color: '#22d3ee',
              }}
            >
              {topTask.estimatedMinutes || 30} mins
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={onAction}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 13,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Manage Goals & Quests →
        </button>
      </div>
    );
  }

  // Fallback if no goal and no tasks exist yet
  return (
    <div
      className="glass-card liquid-glass-panel"
      style={{
        borderRadius: 28,
        padding: 24,
        background: 'linear-gradient(135deg, rgba(20, 24, 30, 0.85) 0%, rgba(13, 16, 20, 0.90) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#d1d5db',
            }}
          >
            🎯 Goal Tracking
          </span>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: -0.2 }}>
          No Active Goal Period
        </h3>

        <p style={{ fontSize: 12, color: '#71767f', lineHeight: 1.5, margin: '0 0 18px 0' }}>
          Create an active 7, 14, or 30-day goal in the Goals section to track your target completion velocity against ideal pace lines.
        </p>
      </div>

      <button
        type="button"
        className="btn"
        onClick={onAction}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 13,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        + Create Goal Period
      </button>
    </div>
  );
}

// ─── 19. Schedule Timeblock Cards (Connected 100% to Real Data) ───────────────
export function ScheduleTimeblockCards({ tasks = [], onAction }) {
  // Sort user's real tasks: today's tasks first, then by scheduled time, then active priority
  const scheduledTasks = useMemo(() => {
    if (!tasks || !tasks.length) return [];
    const todayStr = today();
    const copy = [...tasks];
    copy.sort((a, b) => {
      const aToday = a.date === todayStr ? 1 : 0;
      const bToday = b.date === todayStr ? 1 : 0;
      if (bToday !== aToday) return bToday - aToday;

      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);

      const pMap = { High: 3, Medium: 2, Low: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
    });
    return copy.slice(0, 3);
  }, [tasks]);

  return (
    <div style={{ marginTop: 10 }}>
      {/* Header: My schedule */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: 0 }}>
          My schedule
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#a0aab8',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 999,
              padding: '4px 14px',
            }}
          >
            Today's Schedule
          </span>
        </div>
      </div>

      {/* Real Task Cards (or clean empty state if no tasks) */}
      {scheduledTasks.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {scheduledTasks.map((t, i) => {
            const timeLabel = t.time
              ? `${t.time} - ${addMinutesToTime(t.time, t.estimatedMinutes || 30)}`
              : `${t.date === today() ? 'Today' : t.date} · ~${t.estimatedMinutes || 30}m`;

            const catColor = getCategoryColor(t.category);
            const isCompleted = t.completed;

            return (
              <div
                key={t.id || i}
                className="glass-card liquid-glass-panel"
                style={{
                  borderRadius: 24,
                  padding: 20,
                  background: 'linear-gradient(135deg, rgba(20, 24, 30, 0.85) 0%, rgba(13, 16, 20, 0.90) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Time slot label */}
                <div style={{ fontSize: 11, color: '#71767f', fontWeight: 700, letterSpacing: 0.5 }}>
                  {timeLabel}
                </div>

                {/* User's Real Task Title */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: isCompleted ? '#94a3b8' : '#ffffff',
                    lineHeight: 1.3,
                    textDecoration: isCompleted ? 'line-through' : 'none',
                  }}
                >
                  {t.title}
                </div>

                {/* Category / Priority Badge */}
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: 10,
                      background: `${catColor}25`,
                      border: `1px solid ${catColor}50`,
                      color: catColor,
                    }}
                  >
                    {t.category || t.priority || 'Task'}
                  </span>
                </div>

                {/* Real Task Metadata Footer (NO MENTORS) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12 }}>📁</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>{t.category || 'Personal'}</span>
                  </div>
                  <div>
                    {isCompleted ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>✓ Completed</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee' }}>⏳ In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="glass-card liquid-glass-panel"
          style={{
            borderRadius: 24,
            padding: 30,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(20, 24, 30, 0.85) 0%, rgba(13, 16, 20, 0.90) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
            No Tasks Scheduled in Selected Scope
          </div>
          <div style={{ fontSize: 12, color: '#71767f', maxWidth: 400, margin: '0 auto 14px' }}>
            Schedule tasks with dates and times from the Today view to see your real daily time blocks and schedule cards here.
          </div>
          {onAction && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onAction}
              style={{ borderRadius: 999, padding: '6px 18px', fontWeight: 700 }}
            >
              + Go to Today's Tasks
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function addMinutesToTime(timeStr, mins) {
  if (!timeStr) return '11:30';
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2) return timeStr;
  const d = new Date();
  d.setHours(parts[0], (parts[1] || 0) + mins);
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
}



