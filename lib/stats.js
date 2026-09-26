import AsyncStorage from '@react-native-async-storage/async-storage';
import { maybeRequestReview } from './review';
import { addDays, localDateKey } from './dateKey';
import { emitStatsChanged } from './statsEvents';

const STATS_KEY = 'durus-hatirlatici/stats';
const HISTORY_DAYS = 30;

const STREAK_MILESTONES = [7, 30, 100];

const DEFAULT_STATS = {
  totalSessions: 0,
  streak: 0,
  bestStreak: 0,
  lastCompletedDate: null,
  history: {},
  byType: { breathing: 0, movements: 0, exercises: 0 },
  celebratedMilestones: [],
};

// Seri (streak), en son seans bugün ya da dün yapılmadıysa artık sürmüyordur.
// Depoda eski değer durur; okurken güncel durumu hesaplarız ki ekran her
// zaman doğru seriyi göstersin.
function effectiveStreak(stored) {
  const today = localDateKey();
  const yesterday = localDateKey(addDays(new Date(), -1));
  if (stored.lastCompletedDate === today || stored.lastCompletedDate === yesterday) {
    return stored.streak;
  }
  return 0;
}

export async function getStats() {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    const merged = {
      ...DEFAULT_STATS,
      ...parsed,
      history: { ...DEFAULT_STATS.history, ...(parsed.history || {}) },
      byType: { ...DEFAULT_STATS.byType, ...(parsed.byType || {}) },
      celebratedMilestones: parsed.celebratedMilestones || [],
    };
    const streak = effectiveStreak(merged);
    return { ...merged, streak, bestStreak: Math.max(merged.bestStreak || 0, merged.streak, streak) };
  } catch (e) {
    return DEFAULT_STATS;
  }
}

function trimHistory(history) {
  const cutoff = localDateKey(addDays(new Date(), -HISTORY_DAYS));
  const trimmed = {};
  for (const [date, count] of Object.entries(history)) {
    if (date >= cutoff) {
      trimmed[date] = count;
    }
  }
  return trimmed;
}

// Bir meditasyon/nefes/hareket seansı tamamlandığında çağrılır. Günde birden
// fazla seans tamamlansa da seri (streak) sadece günde bir kez artar.
// `type`: 'breathing' | 'movements' | 'exercises' — tür bazlı dökümü besler.
export async function recordSessionCompleted(type) {
  const stats = await getStats();
  const today = localDateKey();
  let streak = stats.streak;

  if (stats.lastCompletedDate !== today) {
    // getStats() serinin kopup kopmadığını zaten hesapladı: kopmuşsa 0 gelir.
    streak = streak + 1;
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
    bestStreak: Math.max(stats.bestStreak || 0, streak),
    lastCompletedDate: today,
    history,
    byType,
    celebratedMilestones,
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
  emitStatsChanged();
  maybeRequestReview(next.totalSessions);
  return { ...next, newMilestone };
}

// Son 7 günün (bugün dahil) seans sayısını, en eskiden en yeniye sıralı döner.
export function getLast7Days(history) {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    const key = localDateKey(date);
    days.push({ date: key, weekday: date.getDay(), count: history[key] || 0 });
  }
  return days;
}
