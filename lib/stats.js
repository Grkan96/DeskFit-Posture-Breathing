import AsyncStorage from '@react-native-async-storage/async-storage';
import { maybeRequestReview } from './review';
import { refreshStreakAlerts } from './streakAlert';
import { evaluateAchievements } from './achievements';
import { DEFAULT_CHALLENGE, startChallenge, progressChallenge } from './challenge';
import { localDayKey, addDays, computeStreak, trimHistory, sanitizeStats } from './dayStreak';

const STATS_KEY = 'durus-hatirlatici/stats';
const HISTORY_DAYS = 14;

// Yerel takvim günü anahtarı (eskiden UTC'ydi; eski kayıtlar dayStreak.js'de göç edilir).
export function todayKey(date = new Date()) {
  return localDayKey(date);
}

const STREAK_MILESTONES = [7, 30, 100];

const DEFAULT_STATS = {
  totalSessions: 0,
  streak: 0,
  lastCompletedDate: null,
  history: {},
  byType: { breathing: 0, movements: 0, exercises: 0 },
  celebratedMilestones: [],
  achievements: {}, // { [id]: 'YYYY-MM-DD' } açılış tarihi
  challenge: DEFAULT_CHALLENGE,
};

export async function getStats() {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return sanitizeStats(JSON.parse(raw), DEFAULT_STATS);
  } catch (e) {
    return DEFAULT_STATS;
  }
}

// Bir meditasyon/nefes/hareket seansı tamamlandığında çağrılır. Günde birden
// fazla seans tamamlansa da seri (streak) sadece günde bir kez artar.
// `type`: 'breathing' | 'movements' | 'exercises' — tür bazlı dökümü besler.
export async function recordSessionCompleted(type) {
  const stats = await getStats();
  const today = todayKey();
  const streak = computeStreak({
    streak: stats.streak,
    lastCompletedDate: stats.lastCompletedDate,
    today,
    yesterday: todayKey(addDays(new Date(), -1)),
  });

  const history = trimHistory(
    { ...stats.history, [today]: (stats.history[today] || 0) + 1 },
    HISTORY_DAYS
  );

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

  // 7 günlük challenge ilerlemesi ve yeni açılan rozetler.
  const { challenge, justCompleted: challengeJustCompleted } = progressChallenge(stats.challenge, today);
  const newAchievements = evaluateAchievements(
    {
      totalSessions: stats.totalSessions + 1,
      streak,
      byType,
      todayCount: history[today] || 0,
      challengeCompleted: challenge.completed,
    },
    stats.achievements
  );
  const achievements = { ...stats.achievements };
  for (const id of newAchievements) achievements[id] = today;

  const next = {
    totalSessions: stats.totalSessions + 1,
    streak,
    lastCompletedDate: today,
    history,
    byType,
    celebratedMilestones,
    achievements,
    challenge,
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
  maybeRequestReview(next.totalSessions, { positive: Boolean(newMilestone || challengeJustCompleted || newAchievements.length) });
  // Bugün seans yapıldı: bugünkü "serin tehlikede" bildirimini iptal et (yarınınkini kur).
  refreshStreakAlerts({ stats: next });
  return { ...next, newMilestone, newAchievements, challengeJustCompleted };
}

// Challenge'ı başlatır (veya tamamlanmış/bırakılmış olanı sıfırdan yeniden başlatır).
export async function startPostureChallenge() {
  const stats = await getStats();
  const next = { ...stats, challenge: startChallenge(todayKey()) };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
  return next;
}

// Son 7 günün (bugün dahil) aktivitesini, en eskiden en yeniye sıralı döner.
export function getLast7Days(history) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(new Date(), -i);
    const key = todayKey(date);
    days.push({ date: key, weekday: date.getDay(), count: history[key] || 0 });
  }
  return days;
}
