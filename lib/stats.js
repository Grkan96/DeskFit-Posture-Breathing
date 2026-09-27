import AsyncStorage from '@react-native-async-storage/async-storage';
import { maybeRequestReview } from './review';
import { refreshStreakAlerts } from './streakAlert';
import { evaluateAchievements } from './achievements';
import { DEFAULT_CHALLENGE, startChallenge, progressChallenge } from './challenge';
import {
  localDayKey,
  addDays,
  computeStreak,
  trimHistory,
  sanitizeStats,
  restWeekState,
  canMarkRestDay,
  bridgeStreakForRestDay,
  unbridgeStreakForRestDay,
  REST_DAYS_PER_WEEK,
} from './dayStreak';

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
  restDays: {}, // { 'YYYY-MM-DD': true } — dinlenme günü işaretlenmiş günler
  restDaysUsedThisWeek: 0,
  restDaysWeekStart: null, // bu haftanın Pazartesi'si (hakların sayıldığı hafta)
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

// --- Dinlenme günü (streak freeze) — haftada 2 hak, recordSessionCompleted'e dokunmaz ---

// Bu haftanın kalan dinlenme günü hakkını ve kullanılan gün sayısını döner.
// (Depolanmış sayaç geçen haftadan kalmışsa burada, salt-okunur biçimde, 0'a döner.)
export function getRestDayInfoFromStats(stats, now = new Date()) {
  const week = restWeekState(stats, now);
  return { ...week, restDays: stats.restDays };
}

export async function getRestDayInfo() {
  const stats = await getStats();
  return getRestDayInfoFromStats(stats);
}

// `dateKey` (YYYY-MM-DD) gününü dinlenme günü olarak işaretler. Kurallar:
// - sadece geçmiş gün veya bugün (gelecek olamaz)
// - o gün için kayıtlı seans olmamalı
// - zaten işaretliyse veya bu haftanın hakkı kalmadıysa reddedilir
// Seri üzerindeki etkisi bridgeStreakForRestDay ile ayrı olarak uygulanır;
// recordSessionCompleted/computeStreak'in mevcut mantığı DEĞİŞMEZ.
export async function markRestDay(dateKey) {
  const stats = await getStats();
  const today = todayKey();
  const check = canMarkRestDay(stats, dateKey, today);
  if (!check.ok) {
    return { ok: false, reason: check.reason, stats };
  }
  const week = check.week;
  const bridged = bridgeStreakForRestDay(
    { streak: stats.streak, lastCompletedDate: stats.lastCompletedDate },
    dateKey
  );
  const next = {
    ...stats,
    restDays: { ...stats.restDays, [dateKey]: true },
    restDaysWeekStart: week.weekStart,
    restDaysUsedThisWeek: week.usedThisWeek + 1,
    streak: bridged.streak,
    lastCompletedDate: bridged.lastCompletedDate,
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
  return { ok: true, stats: next };
}

// `markRestDay` işaretini geri alır ve o haftanın hakkını geri verir.
export async function unmarkRestDay(dateKey) {
  const stats = await getStats();
  if (!stats.restDays[dateKey]) {
    return { ok: false, reason: 'not-marked', stats };
  }
  const week = restWeekState(stats);
  const restDays = { ...stats.restDays };
  delete restDays[dateKey];
  const reverted = unbridgeStreakForRestDay(
    { streak: stats.streak, lastCompletedDate: stats.lastCompletedDate },
    dateKey
  );
  const next = {
    ...stats,
    restDays,
    restDaysWeekStart: week.weekStart,
    restDaysUsedThisWeek: Math.max(0, week.usedThisWeek - 1),
    streak: reverted.streak,
    lastCompletedDate: reverted.lastCompletedDate,
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
  return { ok: true, stats: next };
}

export { REST_DAYS_PER_WEEK };
