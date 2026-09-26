import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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
async function cancelByCategory(categoryIdentifier) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const targets = scheduled.filter(
    (n) => n.content && n.content.categoryIdentifier === categoryIdentifier
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
  return serialize(() => cancelByCategory(POSTURE_CATEGORY));
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
  await cancelByCategory(POSTURE_CATEGORY);
  const dates = buildScheduleDates({
    intervalMinutes,
    quietHoursEnabled,
    quietStart,
    quietEnd,
    workSchedule,
    maxCount: POSTURE_MAX,
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
export async function scheduleSnooze({ alertMode, vibrationIntensity, userName }) {
  await Notifications.scheduleNotificationAsync({
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
