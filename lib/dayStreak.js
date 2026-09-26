// Saf (RN/AsyncStorage bağımsız) gün anahtarı + seri hesabı — node ile test edilir.
// Gün anahtarı YEREL takvim gününe göredir (YYYY-MM-DD). Eskiden UTC'ydi; eski
// kayıtlı anahtarlar aynen okunur (göç için bkz. computeStreak).

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(v) {
  return typeof v === 'string' && KEY_RE.test(v);
}

export function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Takvim günü aritmetiği (DST'de 24 saatlik kaymaya düşmez).
export function addDays(date, n) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

// Yeni seri değeri. Göç/saat dilimi güvenliği: kayıtlı son gün "bugün"den
// büyükse (eski UTC anahtarı batı saat dilimlerinde ileri görünür, ya da saat
// geri alındı) aynı gün sayılır — seri sıfırlanmaz ve artmaz.
export function computeStreak({ streak, lastCompletedDate, today, yesterday }) {
  const prev = Number.isFinite(streak) && streak > 0 ? streak : 0;
  if (!isDayKey(lastCompletedDate)) return 1;
  if (lastCompletedDate >= today) return Math.max(prev, 1);
  return lastCompletedDate === yesterday ? prev + 1 : 1;
}

// Son `days` günden eski / bozuk anahtarları atar.
export function trimHistory(history, days = 14, now = new Date()) {
  const cutoff = localDayKey(addDays(now, -days));
  const out = {};
  for (const [k, v] of Object.entries(history || {})) {
    if (isDayKey(k) && k >= cutoff && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return out;
}

const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const num = (n, d = 0) => (Number.isFinite(n) && n >= 0 ? n : d);

// AsyncStorage'dan gelen bozuk/eksik stats verisini güvenli şekle getirir.
export function sanitizeStats(parsed, defaults) {
  const p = isObj(parsed) ? parsed : {};
  const ch = isObj(p.challenge) ? p.challenge : {};
  const byType = isObj(p.byType) ? p.byType : {};
  const ownByType = {};
  for (const k of Object.keys(defaults.byType)) ownByType[k] = num(byType[k]);
  return {
    ...defaults,
    totalSessions: num(p.totalSessions),
    streak: num(p.streak),
    lastCompletedDate: isDayKey(p.lastCompletedDate) ? p.lastCompletedDate : null,
    history: trimHistory(isObj(p.history) ? p.history : {}, 3650),
    byType: ownByType,
    celebratedMilestones: Array.isArray(p.celebratedMilestones)
      ? p.celebratedMilestones.filter(Number.isFinite)
      : [],
    achievements: isObj(p.achievements) ? p.achievements : {},
    challenge: {
      ...defaults.challenge,
      active: ch.active === true,
      startDate: isDayKey(ch.startDate) ? ch.startDate : null,
      doneDates: Array.isArray(ch.doneDates) ? ch.doneDates.filter(isDayKey) : [],
      completed: ch.completed === true,
    },
  };
}
