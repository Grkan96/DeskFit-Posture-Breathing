import AsyncStorage from '@react-native-async-storage/async-storage';

// Duruş "check-in" kayıtları: kullanıcı bildirimdeki "Yaptım" butonuna ya da
// ana ekrandaki "Dik oturdum" butonuna bastığında bir check-in sayılır.
// Kayıt biçimi: { 'YYYY-MM-DD': { count, goal } } — o günün hedefi de
// saklanır ki hedef sonradan değişse bile geçmiş günlerin "hedef tuttu mu"
// bilgisi bozulmasın.
const LOG_KEY = 'durus-hatirlatici/checkins';
const GOAL_KEY = 'durus-hatirlatici/checkin-goal';
const CELEBRATED_KEY = 'durus-hatirlatici/checkin-goal-celebrated';
const HANDLED_RESPONSE_KEY = 'durus-hatirlatici/checkin-last-response';

export const DEFAULT_GOAL = 8;
export const MIN_GOAL = 4;
export const MAX_GOAL = 16;
const KEEP_DAYS = 30;

// Not: stats.js / reminderLog.js UTC tarih kullanıyor; burada kasıtlı olarak
// YEREL tarih kullanılıyor ki gece yarısı kullanıcının kendi saatine göre dönsün.
export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysAgoKey(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // yaz saati geçişlerinde gün atlamasın diye öğlen
  d.setDate(d.getDate() - n);
  return localDateKey(d);
}

export function clampGoal(value) {
  const n = Number.isInteger(value) ? value : DEFAULT_GOAL;
  return Math.min(MAX_GOAL, Math.max(MIN_GOAL, n));
}

async function readLog() {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

async function writeLog(log) {
  // Sadece son ~30 günü tut, depolama şişmesin.
  const oldestKept = daysAgoKey(KEEP_DAYS);
  const pruned = {};
  Object.keys(log).forEach((key) => {
    if (key >= oldestKept) pruned[key] = log[key];
  });
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(pruned)).catch(() => {});
}

export async function getDailyGoal() {
  try {
    const raw = await AsyncStorage.getItem(GOAL_KEY);
    return raw ? clampGoal(parseInt(raw, 10)) : DEFAULT_GOAL;
  } catch (e) {
    return DEFAULT_GOAL;
  }
}

function isMet(entry, fallbackGoal) {
  if (!entry) return false;
  const goal = Number.isInteger(entry.goal) ? entry.goal : fallbackGoal;
  return (entry.count || 0) >= goal;
}

// Seri: hedefin tutturulduğu ardışık günler. Bugün henüz hedef tutmadıysa
// seri kırılmış sayılmaz, dünden geriye doğru sayılır.
function computeStreak(log, goal) {
  let start = isMet(log[daysAgoKey(0)], goal) ? 0 : 1;
  let streak = 0;
  for (let i = start; i <= KEEP_DAYS; i += 1) {
    if (!isMet(log[daysAgoKey(i)], goal)) break;
    streak += 1;
  }
  return streak;
}

function buildSummary(log, goal) {
  const today = log[localDateKey()];
  const todayCount = today ? today.count || 0 : 0;
  return {
    todayCount,
    goal,
    streak: computeStreak(log, goal),
    goalMetToday: todayCount >= goal,
  };
}

export async function getCheckinSummary() {
  const [log, goal] = await Promise.all([readLog(), getDailyGoal()]);
  return buildSummary(log, goal);
}

// Aynı anda gelen iki check-in (örn. bildirim + buton) birbirinin kaydını
// ezmesin diye yazma işlemleri sıraya alınır.
let queue = Promise.resolve();
function enqueue(task) {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
}

// Bir check-in kaydeder. Dönen özet, hedefe bugün İLK KEZ ulaşıldıysa
// `justReachedGoal: true` içerir (kutlama bir kez gösterilsin diye).
export function recordCheckin() {
  return enqueue(async () => {
    const [log, goal] = await Promise.all([readLog(), getDailyGoal()]);
    const key = localDateKey();
    const prev = log[key] || { count: 0, goal };
    log[key] = { count: (prev.count || 0) + 1, goal };
    await writeLog(log);

    const summary = buildSummary(log, goal);
    let justReachedGoal = false;
    if (summary.goalMetToday) {
      try {
        const celebrated = await AsyncStorage.getItem(CELEBRATED_KEY);
        if (celebrated !== key) {
          justReachedGoal = true;
          await AsyncStorage.setItem(CELEBRATED_KEY, key);
        }
      } catch (e) {
        // Kutlama bayrağı okunamazsa kutlamayı atla, check-in yine kaydedildi.
      }
    }
    return { ...summary, justReachedGoal };
  });
}

// Günlük hedefi değiştirir; bugünün kaydındaki hedef de güncellenir.
export function setDailyGoal(value) {
  return enqueue(async () => {
    const goal = clampGoal(value);
    await AsyncStorage.setItem(GOAL_KEY, String(goal)).catch(() => {});
    const log = await readLog();
    const key = localDateKey();
    if (log[key]) {
      log[key] = { ...log[key], goal };
      await writeLog(log);
    }
    return buildSummary(log, goal);
  });
}

// Aynı bildirim yanıtı (örn. soğuk açılışta hem dinleyici hem
// getLastNotificationResponseAsync ile) iki kez gelirse çift sayılmasın diye.
// İlk kez görülüyorsa true döner ve kimliği kaydeder.
const handledInSession = new Set();
export async function markResponseHandled(responseId) {
  if (!responseId) return true;
  // Önce bellekteki küme: iki çağrı aynı anda gelirse ikisi de AsyncStorage'ı
  // okumadan önce burada elenir.
  if (handledInSession.has(responseId)) return false;
  handledInSession.add(responseId);
  try {
    const last = await AsyncStorage.getItem(HANDLED_RESPONSE_KEY);
    if (last === responseId) return false;
    await AsyncStorage.setItem(HANDLED_RESPONSE_KEY, responseId);
  } catch (e) {
    // Okunamazsa yine de işle; en kötü ihtimalle bir kez fazla sayılır.
  }
  return true;
}
