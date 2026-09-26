// Saf (React Native / Expo bağımsız) zamanlama mantığı — node ile test edilebilir.

import { localDayKey, addDays, isDayKey } from './dayStreak.js';

export const DEFAULT_WORK_SCHEDULE = {
  enabled: false,
  days: [1, 2, 3, 4, 5], // Date#getDay(): 0 = Pazar ... 6 = Cumartesi
  start: 9,
  end: 18,
};

export const DEFAULT_STREAK_ALERT = {
  enabled: true,
  minutes: 19 * 60 + 30, // gün içindeki dakika: 19:30
};

// start === end -> sessiz pencere yok sayılır (asla sessiz değil).
// start < end   -> aynı gün içinde bir aralık (örn. 01-06).
// start > end   -> gece yarısını aşan aralık (örn. 23-08).
export function isQuietHour(hour, start, end) {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

// Çalışma günü/saati filtresi. Kapalıysa her zaman true.
// start === end -> gün içinde saat kısıtı yok (sadece gün seçimi geçerli).
// start < end   -> aynı gün içinde pencere (örn. 09-18).
// start > end   -> geceye taşan pencere (örn. 22-06): pencere BAŞLADIĞI günün
//   vardiyasıdır. days=[Cuma] ise Cuma 22:00 - Cumartesi 06:00 dahil,
//   Cumartesi 22:00 hariçtir.
export function isWorkingTime(date, workSchedule) {
  if (!workSchedule || !workSchedule.enabled) return true;
  if (!Array.isArray(workSchedule.days)) return false;
  const { start, end, days } = workSchedule;
  const day = date.getDay();
  const hour = date.getHours();
  if (start === end) return days.includes(day);
  if (start < end) return days.includes(day) && hour >= start && hour < end;
  if (hour >= start) return days.includes(day); // pencerenin başladığı gün
  if (hour < end) return days.includes((day + 6) % 7); // önceki gün başlayan pencere
  return false;
}

// Not: `denseHours` verilirse (iOS'un 64 bildirim sınırı için) kuyruk kademeli
// kurulur: ilk `denseHours` saat tam sıklıkta (bütçenin en fazla %60'ı),
// kalan bütçe `horizonHours`'a kadar olan ileri zamanlara eşit aralıkla
// seyreltilerek dağıtılır. Verilmezse eski davranış: ilk `maxCount` aday.
export function buildScheduleDates({
  intervalMinutes,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  workSchedule,
  now = Date.now(),
  horizonHours = 48,
  maxCount = 200,
  denseHours,
  denseShare = 0.6,
}) {
  const dates = [];
  // Geçersiz aralık (0/negatif/NaN) sonsuz döngüye ya da geçmiş tarihe yol açar.
  if (!Number.isFinite(intervalMinutes) || intervalMinutes < 1) return dates;
  const horizonMs = horizonHours * 60 * 60 * 1000;
  const stepMs = intervalMinutes * 60 * 1000;
  const tiered = Number.isFinite(denseHours);
  const denseEnd = tiered ? now + denseHours * 60 * 60 * 1000 : 0;
  const dense = [];
  const rest = [];
  let candidate = now + stepMs;

  while (candidate <= now + horizonMs && (tiered || dates.length < maxCount)) {
    const candidateDate = new Date(candidate);
    const quiet =
      quietHoursEnabled && isQuietHour(candidateDate.getHours(), quietStart, quietEnd);
    if (!quiet && isWorkingTime(candidateDate, workSchedule)) {
      if (!tiered) dates.push(candidateDate);
      else if (candidate <= denseEnd) dense.push(candidateDate);
      else rest.push(candidateDate);
    }
    candidate += stepMs;
  }
  if (!tiered) return dates;

  const denseKeep = rest.length === 0
    ? Math.min(dense.length, maxCount)
    : Math.min(dense.length, Math.max(1, Math.ceil(maxCount * denseShare)));
  const budget = Math.max(0, maxCount - denseKeep);
  const out = dense.slice(0, denseKeep);
  if (rest.length <= budget) return out.concat(rest);
  for (let i = 0; i < budget; i++) out.push(rest[Math.floor((i * rest.length) / budget)]);
  return out;
}

// stats.js ile aynı gün anahtarı biçimi (yerel takvim günü).
export const dayKey = localDayKey;

// "Serin tehlikede" bildirimlerinin zamanlarını hesaplar.
// - Bugün seans yok, seri >= 2, saat henüz gelmediyse: bugün.
// - Bugün seans yapıldı, seri >= 2: yarın (seri yarın tehlikede olacak).
// Seri, son seans dün/bugün değilse zaten kopmuş sayılır.
export function planStreakAlertDates({ stats, streakAlert, now = Date.now(), minStreak = 2 }) {
  if (!streakAlert || !streakAlert.enabled) return [];
  const today = dayKey(new Date(now));
  const yesterday = dayKey(addDays(new Date(now), -1));
  // Son gün "bugün"den büyükse (eski UTC anahtarı / saat geri alındı) bugün sayılır.
  const last =
    isDayKey(stats.lastCompletedDate) && stats.lastCompletedDate > today
      ? today
      : stats.lastCompletedDate;
  const alive = last === today || last === yesterday;
  const streak = alive ? stats.streak : 0;
  if (streak < minStreak) return [];

  const at = (dayOffset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(Math.floor(streakAlert.minutes / 60), streakAlert.minutes % 60, 0, 0);
    return d;
  };

  if (last === today) return [at(1)];
  const todayAt = at(0);
  return todayAt.getTime() > now ? [todayAt] : [];
}
