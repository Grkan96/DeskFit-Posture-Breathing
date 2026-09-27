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
  const rawRestDays = isObj(p.restDays) ? p.restDays : {};
  const restDays = {};
  for (const [k, v] of Object.entries(rawRestDays)) {
    if (isDayKey(k) && v === true) restDays[k] = true;
  }
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
    // Dinlenme günü (streak freeze) alanları — eski kayıtlarda yok, varsayılana düşer (göç).
    restDays,
    restDaysUsedThisWeek: num(p.restDaysUsedThisWeek),
    restDaysWeekStart: isDayKey(p.restDaysWeekStart) ? p.restDaysWeekStart : null,
  };
}

// --- Dinlenme günü (haftada 2 hak, seri dondurma) — saf mantık ---

export const REST_DAYS_PER_WEEK = 2;

// "YYYY-MM-DD" anahtarını yerel Date'e çevirir (takvim günü aritmetiği için).
export function dayKeyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Verilen tarihin ait olduğu haftanın Pazartesi günü (yerel takvime göre).
export function weekStartKey(date = new Date()) {
  const day = date.getDay(); // 0=Paz..6=Cmt
  const sinceMonday = (day + 6) % 7;
  return localDayKey(addDays(date, -sinceMonday));
}

// Depolanmış haftalık sayaç "şimdi"ye göre güncel mi? Hafta değiştiyse (Pazartesi
// geçtiyse) kullanılmamış haklar birikmez — sayaç 0'a döner.
export function restWeekState({ restDaysUsedThisWeek, restDaysWeekStart }, now = new Date()) {
  const weekStart = weekStartKey(now);
  const usedThisWeek = restDaysWeekStart === weekStart ? num(restDaysUsedThisWeek) : 0;
  return { weekStart, usedThisWeek, remaining: Math.max(0, REST_DAYS_PER_WEEK - usedThisWeek) };
}

// `markRestDay` çağrılmadan önceki saf doğrulama (AsyncStorage'a dokunmaz).
// Kurallar: sadece geçerli bir geçmiş gün veya bugün (gelecek olamaz), o gün
// için kayıtlı seans olmamalı, zaten işaretli olmamalı, bu haftanın hakkı kalmalı.
export function canMarkRestDay(stats, dateKey, today = localDayKey()) {
  if (!isDayKey(dateKey) || dateKey > today) return { ok: false, reason: 'invalid-date' };
  if (stats?.history?.[dateKey]) return { ok: false, reason: 'has-session' };
  if (stats?.restDays?.[dateKey]) return { ok: false, reason: 'already-marked' };
  const week = restWeekState(stats, isDayKey(today) ? dayKeyToDate(today) : new Date());
  if (week.remaining <= 0) return { ok: false, reason: 'no-rights-left' };
  return { ok: true, week };
}

// Bir günü dinlenme günü işaretlemenin seriye etkisi: SADECE o gün, mevcut
// lastCompletedDate'in tam bir sonraki günüyse zinciri "köprüler" — seri ne
// kırılır ne artar, lastCompletedDate o güne ilerler. Aksi halde (zincirle
// bitişik olmayan / ilgisiz bir geçmiş gün) seriye dokunulmaz; gerçek boşluklar
// hâlâ normal kuralla (computeStreak) kırılır.
export function bridgeStreakForRestDay({ streak, lastCompletedDate }, dateKey) {
  const prevStreak = num(streak);
  if (!isDayKey(lastCompletedDate)) return { streak: prevStreak, lastCompletedDate: lastCompletedDate ?? null };
  const nextExpected = localDayKey(addDays(dayKeyToDate(lastCompletedDate), 1));
  if (dateKey === nextExpected) return { streak: prevStreak, lastCompletedDate: dateKey };
  return { streak: prevStreak, lastCompletedDate };
}

// Dinlenme günü işaretini geri alma: sadece bu gün en son köprülenen günse
// (lastCompletedDate === dateKey) köprüyü bir gün geriye sarar; daha karmaşık
// zincirlerde güvenli taraf seçilir ve seriye dokunulmaz.
export function unbridgeStreakForRestDay({ streak, lastCompletedDate }, dateKey) {
  const prevStreak = num(streak);
  if (lastCompletedDate !== dateKey) return { streak: prevStreak, lastCompletedDate };
  return { streak: prevStreak, lastCompletedDate: localDayKey(addDays(dayKeyToDate(dateKey), -1)) };
}
