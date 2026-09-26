import AsyncStorage from '@react-native-async-storage/async-storage';
import { maybeRequestReview } from './review';

const STATS_KEY = 'durus-hatirlatici/stats';
const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 14;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

const STREAK_MILESTONES = [7, 30, 100];

const DEFAULT_STATS = {
  totalSessions: 0,
  streak: 0,
  lastCompletedDate: null,
  history: {},
  byType: { breathing: 0, movements: 0, exercises: 0, eyes: 0 },
  celebratedMilestones: [],
};

export async function getStats() {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      history: { ...DEFAULT_STATS.history, ...(parsed.history || {}) },
      byType: { ...DEFAULT_STATS.byType, ...(parsed.byType || {}) },
      celebratedMilestones: parsed.celebratedMilestones || [],
    };
  } catch (e) {
    return DEFAULT_STATS;
  }
}

function trimHistory(history) {
  const cutoff = Date.now() - HISTORY_DAYS * DAY_MS;
  const trimmed = {};
  for (const [date, count] of Object.entries(history)) {
    if (new Date(date).getTime() >= cutoff) {
      trimmed[date] = count;
    }
  }
  return trimmed;
}

// Bir meditasyon/nefes/hareket seansı tamamlandığında çağrılır. Günde birden
// fazla seans tamamlansa da seri (streak) sadece günde bir kez artar.
// `type`: 'breathing' | 'movements' | 'exercises' | 'eyes' — tür bazlı dökümü besler.
export async function recordSessionCompleted(type) {
  const stats = await getStats();
  const today = todayKey();
  let streak = stats.streak;

  if (stats.lastCompletedDate !== today) {
    const yesterday = todayKey(new Date(Date.now() - DAY_MS));
    streak = stats.lastCompletedDate === yesterday ? streak + 1 : 1;
  }

  const history = trimHistory({
    ...stats.history,
    [today]: (stats.history[today] || 0) + 1,
  });

  const byType = { ...stats.byType };
  if (type && byType[type] !== undefined) {
    byType[type] += 1;
  }

  // Bu seansla birlikte yeni ulaşılan bir seri (streak) kilometre taşı var mı?
  // Sadece her kilometre taşı için bir kez, kutlama/paylaşım göstermek üzere.
  const celebratedMilestones = [...stats.celebratedMilestones];
  let newMilestone = null;
  for (const milestone of STREAK_MILESTONES) {
    if (streak >= milestone && !celebratedMilestones.includes(milestone)) {
      celebratedMilestones.push(milestone);
      newMilestone = milestone;
    }
  }

  const next = {
    totalSessions: stats.totalSessions + 1,
    streak,
    lastCompletedDate: today,
    history,
    byType,
    celebratedMilestones,
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
  maybeRequestReview(next.totalSessions);
  return { ...next, newMilestone };
}

// Son 7 günün (bugün dahil) aktivitesini, en eskiden en yeniye sıralı döner.
export function getLast7Days(history) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * DAY_MS);
    const key = todayKey(date);
    days.push({ date: key, weekday: date.getDay(), count: history[key] || 0 });
  }
  return days;
}
