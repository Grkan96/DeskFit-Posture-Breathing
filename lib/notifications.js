import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from './i18n';
import { buildScheduleDates } from './schedule';

export const POSTURE_CATEGORY = 'posture-reminder';
export const EYE_REST_CATEGORY = 'eye-rest-reminder';
export const STREAK_CATEGORY = 'streak-at-risk';
export const SNOOZE_ACTION = 'snooze';
export const DONE_ACTION = 'done';
const SNOOZE_MINUTES = 10;
// 20-20-20 kuralı: her 20 dakikada bir, 20 saniyeliğine uzağa bak.
const EYE_REST_INTERVAL_MINUTES = 20;
const EYE_REST_CHANNEL = 'eye-rest-reminders';
const STREAK_CHANNEL = 'streak-alerts';
// Ertele bildirimi sabit kimlikle zamanlanır: kuyruk yeniden doldurulurken
// (uygulama açılışı/öne gelme) silinmesin diye kategori temizliği onu atlar.
const SNOOZE_ID = 'posture-snooze';
// Bir sonraki duruş hatırlatmasını (HomeScreen için) hesaplamak üzere kendi
// zamanladığımız tarihleri saklarız; tetikleyici biçimi platforma göre değişir.
const DATES_KEY = 'durus-hatirlatici/posture-dates';
const SNOOZE_AT_KEY = 'durus-hatirlatici/posture-snooze-at';

const VIBRATION_PATTERNS = {
  light: [0, 150],
  medium: [0, 250, 100, 250],
  strong: [0, 400, 150, 400, 150, 400],
};

// Sonsuz tekrarlayan tek bir tetikleyici yerine, sessiz saatleri atlayan
// tekil bildirimler önceden zamanlanır. Bu yüzden zamanlama "dolduruldu" ve
// tükenmeden önce (en geç ~2 günde bir) uygulamanın tekrar açılması gerekir.

// iOS aynı anda en fazla 64 bekleyen bildirim tutar, fazlasını SESSİZCE atar
// (en yakın 64'ü tutar). Duruş + göz dinlendirme + seri + erteleme toplamı bu
// sınırı aşmasın diye iOS'ta kategori başına üst sınır konur (40+20+1+1 = 62).
// Kuyruk her uygulama açılışında yeniden doldurulur.
const IOS = Platform.OS === 'ios';
const POSTURE_MAX = IOS ? 40 : 200;
// iOS'ta kuyruk kademelidir: ilk 24 saat tam sıklıkta, sonraki günler 7 güne
// kadar seyreltilmiş (bkz. buildScheduleDates). Android'de 48 saat tam sıklık.
const POSTURE_TIERING = IOS ? { denseHours: 24, horizonHours: 168 } : {};
const EYE_REST_MAX = IOS ? 20 : 200;

// Aynı kategoriye ait "iptal et + yeniden zamanla" işlemleri birbirinin içine
// girerse (hızlı ayar değişikliği, açılış doldurması ile kullanıcı işlemi)
// yinelenen bildirimler oluşur. Tüm zamanlama yazımlarını sırayla çalıştır.
let queueTail = Promise.resolve();
function serialize(task) {
  const run = queueTail.then(task, task);
  queueTail = run.catch(() => {});
  return run;
}

// Uygulama açıkken de bildirim görünsün
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function channelId(alertMode, vibrationIntensity) {
  if (alertMode === 'silent') return 'reminders-silent';
  return `reminders-${alertMode}-${vibrationIntensity}`;
}

export async function ensureChannels() {
  if (Platform.OS !== 'android') return;

  const title = translate('notifications.title');

  await Notifications.setNotificationChannelAsync('reminders-silent', {
    name: `${title} (silent)`,
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: [0],
  });

  for (const intensity of Object.keys(VIBRATION_PATTERNS)) {
    await Notifications.setNotificationChannelAsync(channelId('vibrate', intensity), {
      name: `${title} (vibrate - ${intensity})`,
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      vibrationPattern: VIBRATION_PATTERNS[intensity],
    });
    await Notifications.setNotificationChannelAsync(channelId('sound', intensity), {
      name: `${title} (sound - ${intensity})`,
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: VIBRATION_PATTERNS[intensity],
    });
  }

  await Notifications.setNotificationChannelAsync(EYE_REST_CHANNEL, {
    name: `${title} — eye rest`,
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: VIBRATION_PATTERNS.medium,
  });

  await Notifications.setNotificationChannelAsync(STREAK_CHANNEL, {
    name: `${title} — streak`,
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: VIBRATION_PATTERNS.light,
  });
}

// Bildirimdeki hızlı butonlar. `opensAppToForeground: true` şart — aksi halde
// uygulama tamamen kapalıyken (öldürülmüşken) butona basınca JS tarafındaki
// dinleyici hiç tetiklenmez ve erteleme çalışmaz.
export async function ensureNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(POSTURE_CATEGORY, [
    {
      identifier: SNOOZE_ACTION,
      buttonTitle: translate('notifications.snoozeButton', { minutes: SNOOZE_MINUTES }),
      options: { opensAppToForeground: true },
    },
    {
      identifier: DONE_ACTION,
      buttonTitle: translate('notifications.doneButton'),
      options: { opensAppToForeground: true },
    },
  ]);
}

function pickRandomMessage(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildBody(userName, pool = translate('notifications.messages')) {
  const message = pickRandomMessage(pool);
  if (!userName) return message;
  return `${userName}, ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
}

// Sadece belirli bir kategoriye ait zamanlanmış bildirimleri iptal eder.
// Duruş hatırlatıcısı ve göz dinlendirme birbirinden bağımsız çalıştığı için
// cancelAllScheduledNotificationsAsync() kullanmıyoruz — biri diğerinin
// kuyruğunu silmesin diye.
async function cancelByCategory(categoryIdentifier, { keepSnooze = false } = {}) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const targets = scheduled.filter(
    (n) =>
      n.content &&
      n.content.categoryIdentifier === categoryIdentifier &&
      !(keepSnooze && n.identifier === SNOOZE_ID)
  );
  await Promise.all(
    targets.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

// App.js açılışta "duruş hatırlatıcısı zaten çalışıyor muydu?" diye bunu
// kullanır — tüm zamanlanmış bildirimleri değil, sadece kendi kategorisini
// sayar (göz dinlendirme ayrı çalışabilir).
export async function isPostureReminderScheduled() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.content && n.content.categoryIdentifier === POSTURE_CATEGORY);
}

export function cancelPostureReminders() {
  return serialize(async () => {
    await cancelByCategory(POSTURE_CATEGORY);
    await AsyncStorage.multiRemove([DATES_KEY, SNOOZE_AT_KEY]).catch(() => {});
  });
}

// Bekleyen duruş hatırlatmalarından bir sonrakinin zamanı (ms) ya da null.
export async function getNextPostureReminderAt() {
  try {
    const now = Date.now();
    const rawDates = await AsyncStorage.getItem(DATES_KEY);
    const rawSnooze = await AsyncStorage.getItem(SNOOZE_AT_KEY);
    const list = rawDates ? JSON.parse(rawDates) : [];
    const all = (Array.isArray(list) ? list : []).concat(rawSnooze ? [Number(rawSnooze)] : []);
    const future = all.filter((t) => Number.isFinite(t) && t > now);
    return future.length ? Math.min(...future) : null;
  } catch (e) {
    return null;
  }
}

export function scheduleReminder(opts) {
  return serialize(() => scheduleReminderNow(opts));
}

async function scheduleReminderNow({
  intervalMinutes,
  alertMode,
  vibrationIntensity,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  workSchedule,
  userName,
}) {
  await cancelByCategory(POSTURE_CATEGORY, { keepSnooze: true });
  const dates = buildScheduleDates({
    intervalMinutes,
    quietHoursEnabled,
    quietStart,
    quietEnd,
    workSchedule,
    maxCount: POSTURE_MAX,
    ...POSTURE_TIERING,
  });
  const channel = channelId(alertMode, vibrationIntensity);
  for (const date of dates) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: translate('notifications.title'),
        body: buildBody(userName),
        sound: alertMode === 'sound' ? 'default' : undefined,
        categoryIdentifier: POSTURE_CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: channel,
      },
    });
  }
  await AsyncStorage.setItem(DATES_KEY, JSON.stringify(dates.map((d) => d.getTime()))).catch(() => {});
}

// Göz dinlendirme (20-20-20) hatırlatıcısı — duruş hatırlatıcısından bağımsız
// sabit 20 dakikalık aralıkla çalışır, aynı sessiz saatleri paylaşır.
export function setEyeRestReminders(opts) {
  return serialize(() => setEyeRestRemindersNow(opts));
}

async function setEyeRestRemindersNow({ enabled, quietHoursEnabled, quietStart, quietEnd, workSchedule, userName }) {
  await cancelByCategory(EYE_REST_CATEGORY);
  if (!enabled) return;

  const dates = buildScheduleDates({
    intervalMinutes: EYE_REST_INTERVAL_MINUTES,
    quietHoursEnabled,
    quietStart,
    quietEnd,
    workSchedule,
    maxCount: EYE_REST_MAX,
  });
  for (const date of dates) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: translate('notifications.title'),
        body: buildBody(userName, [translate('notifications.eyeRestMessage')]),
        sound: 'default',
        categoryIdentifier: EYE_REST_CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: EYE_REST_CHANNEL,
      },
    });
  }
}

export async function sendTestNotification({ alertMode, vibrationIntensity, userName }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate('notifications.title'),
      body: buildBody(userName),
      sound: alertMode === 'sound' ? 'default' : undefined,
      categoryIdentifier: POSTURE_CATEGORY,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
      channelId: channelId(alertMode, vibrationIntensity),
    },
  });
}

// Bildirimdeki "Ertele" butonuna basıldığında tek seferlik ek bir bildirim
// zamanlar. Ana kuyruğa dokunmaz, sadece araya bir tane sıkıştırır.
export function scheduleSnooze(opts) {
  return serialize(() => scheduleSnoozeNow(opts));
}

async function scheduleSnoozeNow({ alertMode, vibrationIntensity, userName }) {
  await Notifications.scheduleNotificationAsync({
    identifier: SNOOZE_ID,
    content: {
      title: translate('notifications.title'),
      body: buildBody(userName),
      sound: alertMode === 'sound' ? 'default' : undefined,
      categoryIdentifier: POSTURE_CATEGORY,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SNOOZE_MINUTES * 60,
      repeats: false,
      channelId: channelId(alertMode, vibrationIntensity),
    },
  });
  await AsyncStorage.setItem(SNOOZE_AT_KEY, String(Date.now() + SNOOZE_MINUTES * 60 * 1000)).catch(() => {});
}

// "Serin tehlikede" akşam bildirimleri: verilen tarihler için (yeniden)
// zamanlar; boş liste = hepsini iptal et. Koşulları lib/schedule.js hesaplar.
export function setStreakAlerts(opts) {
  return serialize(() => setStreakAlertsNow(opts));
}

async function setStreakAlertsNow({ dates }) {
  await cancelByCategory(STREAK_CATEGORY);
  for (const date of dates.slice(0, 2)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: translate('notifications.streakTitle'),
        body: translate('notifications.streakBody'),
        sound: 'default',
        categoryIdentifier: STREAK_CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: STREAK_CHANNEL,
      },
    });
  }
}
