import { addDays, localDateKey } from './dateKey';

// Hatırlatma etkinliğinin saf (React Native / depolama bağımsız) mantığı.
// Bildirimler zamanlanırken planlanan zaman damgaları kaydedilir; uygulama
// açıldığında ya da öne geldiğinde zamanı geçmiş olanlar "teslim edildi"
// sayılır. Böylece uygulama kapalıyken gelen hatırlatmalar da sayılır.

export const KINDS = ['posture', 'eyeRest'];
const KEEP_DAYS = 30;

export function emptyActivity() {
  return {
    schedule: { posture: [], eyeRest: [] },
    daily: {},
    totals: { posture: 0, eyeRest: 0, done: 0 },
  };
}

function cleanTimestamps(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((n) => Number.isFinite(n)))].sort((a, b) => a - b);
}

export function normalizeActivity(raw) {
  const base = emptyActivity();
  if (!raw || typeof raw !== 'object') return base;
  const daily = {};
  for (const [date, value] of Object.entries(raw.daily || {})) {
    daily[date] = {
      posture: Number(value?.posture) || 0,
      eyeRest: Number(value?.eyeRest) || 0,
      done: Number(value?.done) || 0,
    };
  }
  return {
    schedule: {
      posture: cleanTimestamps(raw.schedule?.posture),
      eyeRest: cleanTimestamps(raw.schedule?.eyeRest),
    },
    daily,
    totals: {
      posture: Number(raw.totals?.posture) || 0,
      eyeRest: Number(raw.totals?.eyeRest) || 0,
      done: Number(raw.totals?.done) || 0,
    },
  };
}

export function setSchedule(state, kind, timestamps) {
  return { ...state, schedule: { ...state.schedule, [kind]: cleanTimestamps(timestamps) } };
}

export function appendSchedule(state, kind, timestamps) {
  return setSchedule(state, kind, [...state.schedule[kind], ...timestamps]);
}

function bump(daily, key, field) {
  const current = daily[key] || { posture: 0, eyeRest: 0, done: 0 };
  return { ...daily, [key]: { ...current, [field]: current[field] + 1 } };
}

function trimDaily(daily, nowMs) {
  const cutoff = localDateKey(addDays(new Date(nowMs), -KEEP_DAYS));
  const trimmed = {};
  for (const [date, value] of Object.entries(daily)) {
    if (date >= cutoff) trimmed[date] = value;
  }
  return trimmed;
}

// Zamanı gelmiş (<= now) planlanmış hatırlatmaları teslim edilmiş sayar.
export function reconcile(state, nowMs) {
  let daily = state.daily;
  const totals = { ...state.totals };
  const schedule = { posture: [], eyeRest: [] };
  let deliveredCount = 0;

  for (const kind of KINDS) {
    for (const ts of state.schedule[kind]) {
      if (ts <= nowMs) {
        daily = bump(daily, localDateKey(new Date(ts)), kind);
        totals[kind] += 1;
        deliveredCount += 1;
      } else {
        schedule[kind].push(ts);
      }
    }
  }

  if (deliveredCount === 0) return { state, deliveredCount: 0 };
  return {
    state: { schedule, daily: trimDaily(daily, nowMs), totals },
    deliveredCount,
  };
}

// Bildirimdeki "Yaptım" gibi kullanıcı aksiyonlarını bugüne yazar.
export function recordAction(state, action, nowMs) {
  if (action !== 'done') return state;
  return {
    ...state,
    daily: trimDaily(bump(state.daily, localDateKey(new Date(nowMs)), 'done'), nowMs),
    totals: { ...state.totals, done: state.totals.done + 1 },
  };
}

export function todayCounts(state, nowMs) {
  const entry = state.daily[localDateKey(new Date(nowMs))];
  return entry || { posture: 0, eyeRest: 0, done: 0 };
}

// Son n günün (bugün dahil) dökümü, en eskiden en yeniye.
export function lastNDays(daily, n, nowMs) {
  const days = [];
  const today = new Date(nowMs);
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const key = localDateKey(date);
    const entry = daily[key] || { posture: 0, eyeRest: 0, done: 0 };
    days.push({ date: key, weekday: date.getDay(), ...entry });
  }
  return days;
}
