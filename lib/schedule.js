// Saf (React Native / Expo bağımsız) zamanlama mantığı — node ile test edilebilir.

const DAY_MS = 24 * 60 * 60 * 1000;

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
export function isWorkingTime(date, workSchedule) {
  if (!workSchedule || !workSchedule.enabled) return true;
  if (!workSchedule.days.includes(date.getDay())) return false;
  const { start, end } = workSchedule;
  if (start === end) return true;
  return !isQuietHour(date.getHours(), end, start);
}

export function buildScheduleDates({
  intervalMinutes,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  workSchedule,
  now = Date.now(),
  horizonHours = 48,
  maxCount = 200,
}) {
  const dates = [];
  const horizonMs = horizonHours * 60 * 60 * 1000;
  const stepMs = intervalMinutes * 60 * 1000;
  let candidate = now + stepMs;

  while (candidate <= now + horizonMs && dates.length < maxCount) {
    const candidateDate = new Date(candidate);
    const quiet =
      quietHoursEnabled && isQuietHour(candidateDate.getHours(), quietStart, quietEnd);
    if (!quiet && isWorkingTime(candidateDate, workSchedule)) {
      dates.push(candidateDate);
    }
    candidate += stepMs;
  }
  return dates;
}

// stats.js ile aynı gün anahtarı biçimi (UTC tarih).
export function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

// "Serin tehlikede" bildirimlerinin zamanlarını hesaplar.
// - Bugün seans yok, seri >= 2, saat henüz gelmediyse: bugün.
// - Bugün seans yapıldı, seri >= 2: yarın (seri yarın tehlikede olacak).
// Seri, son seans dün/bugün değilse zaten kopmuş sayılır.
export function planStreakAlertDates({ stats, streakAlert, now = Date.now(), minStreak = 2 }) {
  if (!streakAlert || !streakAlert.enabled) return [];
  const today = dayKey(new Date(now));
  const yesterday = dayKey(new Date(now - DAY_MS));
  const last = stats.lastCompletedDate;
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
