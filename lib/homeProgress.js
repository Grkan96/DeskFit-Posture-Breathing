// Ana ekran için saf (RN bağımsız) yardımcılar — node ile test edilir.
import { localDayKey, addDays } from './dayStreak.js';

export const DAILY_GOAL = 3;

// 0..1 arası halka oranı.
export function ringFraction(count, goal = DAILY_GOAL) {
  if (!Number.isFinite(count) || !Number.isFinite(goal) || goal <= 0) return 0;
  return Math.min(1, Math.max(0, count / goal));
}

// Kayıtlı seri, son tamamlanan gün bugün/dün değilse bozulmuştur -> 0 göster.
export function displayStreak(stats, now = new Date()) {
  if (!stats || !(stats.streak > 0)) return 0;
  const last = stats.lastCompletedDate;
  if (last && last >= localDayKey(addDays(now, -1))) return stats.streak;
  return 0;
}

// nextReminderAt (ms) verilmişse kalan saniye; yoksa null (çağıran yaklaşık mantığa düşer).
export function remainingFromTarget(nextReminderAt, now = Date.now()) {
  if (typeof nextReminderAt !== 'number' || !Number.isFinite(nextReminderAt)) return null;
  return Math.max(0, Math.ceil((nextReminderAt - now) / 1000));
}

export function countdownProgress(remaining, periodSeconds) {
  if (!(periodSeconds > 0)) return 0;
  return Math.min(1, Math.max(0, 1 - remaining / periodSeconds));
}
