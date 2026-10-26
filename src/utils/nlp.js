import { today, formatDate, addDays, getDayOfWeek, parseDate } from './constants';

export function parseSmartQuickAdd(inputStr, defaultDate = today(), categories = ['Work', 'Study', 'Health', 'Personal']) {
  if (!inputStr) return { title: '', date: defaultDate, priority: 'Medium', category: 'Personal', time: '', estimatedMinutes: 30 };

  let text = inputStr.trim();
  let priority = 'Medium';
  let category = 'Personal';
  let date = defaultDate;
  let time = '';
  let estimatedMinutes = 30;

  // 1. Priority: !high, !med, !medium, !low
  const prioMatch = text.match(/(?:^|\s)!(high|med|medium|low)(?:\s|$)/i);
  if (prioMatch) {
    const val = prioMatch[1].toLowerCase();
    if (val === 'high') priority = 'High';
    else if (val === 'low') priority = 'Low';
    else priority = 'Medium';
    text = text.replace(prioMatch[0], ' ');
  }

  // 2. Category: #tag
  const catMatch = text.match(/(?:^|\s)#([a-zA-Z0-9_-]+)(?:\s|$)/);
  if (catMatch) {
    const matchedTag = catMatch[1];
    const found = categories.find(c => c.toLowerCase() === matchedTag.toLowerCase());
    if (found) category = found;
    else category = matchedTag.charAt(0).toUpperCase() + matchedTag.slice(1);
    text = text.replace(catMatch[0], ' ');
  }

  // 3. Estimated duration: ~30m, ~1h, ~45m, ~1.5h
  const estMatch = text.match(/(?:^|\s)~([0-9.]+)(m|min|mins|h|hr|hours?)(?:\s|$)/i);
  if (estMatch) {
    const num = parseFloat(estMatch[1]);
    const unit = estMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      estimatedMinutes = Math.round(num * 60);
    } else {
      estimatedMinutes = Math.round(num);
    }
    text = text.replace(estMatch[0], ' ');
  }

  // 4. Date parsing: today, tomorrow, mon..sun, YYYY-MM-DD
  const todayStr = today();
  const datePatterns = [
    { regex: /(?:^|\s)\b(today)\b(?:\s|$)/i, getDate: () => todayStr },
    { regex: /(?:^|\s)\b(tomorrow)\b(?:\s|$)/i, getDate: () => addDays(todayStr, 1) },
    {
      regex: /(?:^|\s)\b(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b(?:\s|$)/i,
      getDate: (m) => {
        const dayMap = { sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2, wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6 };
        const targetDay = dayMap[m.toLowerCase().slice(0, 3)];
        const currentD = parseDate(todayStr);
        const currentDay = currentD.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        return addDays(todayStr, daysToAdd);
      }
    },
    {
      regex: /(?:^|\s)\b([0-9]{4}-[0-9]{2}-[0-9]{2})\b(?:\s|$)/,
      getDate: (m) => m
    }
  ];

  let startDate = date;
  let endDate = date;

  // 4. Date range parsing: e.g. "from 2026-10-25 to 2026-10-30" or "2026-10-25 to 2026-10-30"
  const rangeMatch = text.match(/(?:from\s+)?([0-9]{4}-[0-9]{2}-[0-9]{2})\s+(?:to|until|-)\s+([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  if (rangeMatch) {
    startDate = rangeMatch[1];
    endDate = rangeMatch[2];
    date = startDate;
    text = text.replace(rangeMatch[0], ' ');
  } else {
    for (const dp of datePatterns) {
      const match = text.match(dp.regex);
      if (match) {
        date = dp.getDate(match[1]);
        startDate = date;
        endDate = date;
        text = text.replace(match[0], ' ');
        break;
      }
    }
  }

  // Duration in days: e.g. "for 3 days", "for 1 week"
  const forDaysMatch = text.match(/(?:^|\s)for\s+([0-9]+)\s*(days?|weeks?|months?)(?:\s|$)/i);
  if (forDaysMatch) {
    const num = parseInt(forDaysMatch[1], 10);
    const unit = forDaysMatch[2].toLowerCase();
    if (unit.startsWith('day')) endDate = addDays(startDate, num - 1);
    else if (unit.startsWith('week')) endDate = addDays(startDate, (num * 7) - 1);
    else if (unit.startsWith('month')) endDate = addDays(startDate, (num * 30) - 1);
    text = text.replace(forDaysMatch[0], ' ');
  }

  // 5. Time parsing: 6pm, 9:30am, 18:00, 7am
  const time12Match = text.match(/(?:^|\s)\b([0-1]?[0-9]|2[0-3])(?::([0-5][0-9]))?\s*(am|pm)\b(?:\s|$)/i);
  if (time12Match) {
    let hour = parseInt(time12Match[1], 10);
    const min = time12Match[2] ? time12Match[2] : '00';
    const ampm = time12Match[3].toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    time = `${String(hour).padStart(2, '0')}:${min}`;
    text = text.replace(time12Match[0], ' ');
  } else {
    const time24Match = text.match(/(?:^|\s)\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])\b(?:\s|$)/);
    if (time24Match) {
      time = `${String(parseInt(time24Match[1], 10)).padStart(2, '0')}:${time24Match[2]}`;
      text = text.replace(time24Match[0], ' ');
    }
  }

  const cleanTitle = text.replace(/\s+/g, ' ').trim() || inputStr.trim();

  return {
    title: cleanTitle,
    priority,
    category,
    date: startDate,
    startDate,
    endDate: endDate >= startDate ? endDate : startDate,
    time,
    estimatedMinutes,
  };
}
