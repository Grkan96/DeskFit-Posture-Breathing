import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { translate } from './i18n';
import {
  appendScheduledReminder,
  clearScheduledReminders,
  logScheduledReminders,
} from './reminderLog';

export const POSTURE_CATEGORY = 'posture-reminder';
export const EYE_REST_CATEGORY = 'eye-rest-reminder';
export const SNOOZE_ACTION = 'snooze';
export const DONE_ACTION = 'done';
const SNOOZE_MINUTES = 10;
// 20-20-20 kuralı: her 20 dakikada bir, 20 saniyeliğine uzağa bak.
const EYE_REST_INTERVAL_MINUTES = 20;
const EYE_REST_CHANNEL = 'eye-rest-reminders';

const VIBRATION_PATTERNS = {
  light: [0, 150],
  medium: [0, 250, 100, 250],
  strong: [0, 400, 150, 400, 150, 400],
};

// Sonsuz tekrarlayan tek bir tetikleyici yerine, sessiz saatleri atlayan
// tekil bildirimler önceden zamanlanır. Bu yüzden zamanlama "dolduruldu" ve
// tükenmeden önce (en geç ~2 günde bir) uygulamanın tekrar açılması gerekir.
const SCHEDULE_HORIZON_HOURS = 48;
const SCHEDULE_MAX_COUNT = 200;

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

// start === end -> sessiz pencere yok sayılır (asla sessiz değil).
// start < end   -> aynı gün içinde bir aralık (örn. 01-06).
// start > end   -> gece yarısını aşan aralık (örn. 23-08).
function isQuietHour(hour, start, end) {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function buildScheduleDates({ intervalMinutes, quietHoursEnabled, quietStart, quietEnd }) {
  const dates = [];
  const now = Date.now();
  const horizonMs = SCHEDULE_HORIZON_HOURS * 60 * 60 * 1000;
  const stepMs = intervalMinutes * 60 * 1000;
  let candidate = now + stepMs;

  while (candidate <= now + horizonMs && dates.length < SCHEDULE_MAX_COUNT) {
    const candidateDate = new Date(candidate);
    const quiet =
      quietHoursEnabled && isQuietHour(candidateDate.getHours(), quietStart, quietEnd);
    if (!quiet) {
      dates.push(candidateDate);
    }
    candidate += stepMs;
  }
  return dates;
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

export async function cancelPostureReminders() {
  await cancelByCategory(POSTURE_CATEGORY);
  await clearScheduledReminders('posture');
}

export async function scheduleReminder({
  intervalMinutes,
  alertMode,
  vibrationIntensity,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  userName,
}) {
  await cancelByCategory(POSTURE_CATEGORY);
  const dates = buildScheduleDates({
    intervalMinutes,
    quietHoursEnabled,
    quietStart,
    quietEnd,
  });
  const channel = channelId(alertMode, vibrationIntensity);
  const scheduled = [];
  try {
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
      scheduled.push(date);
    }
  } finally {
    // İstatistikler için planlanan zamanları kaydet: uygulama kapalıyken gelen
    // hatırlatmalar da açılışta "teslim edildi" olarak sayılabilsin.
    await logScheduledReminders('posture', scheduled);
  }
}

// Göz dinlendirme (20-20-20) hatırlatıcısı — duruş hatırlatıcısından bağımsız
// sabit 20 dakikalık aralıkla çalışır, aynı sessiz saatleri paylaşır.
export async function setEyeRestReminders({ enabled, quietHoursEnabled, quietStart, quietEnd, userName }) {
  await cancelByCategory(EYE_REST_CATEGORY);
  if (!enabled) {
    await clearScheduledReminders('eyeRest');
    return;
  }

  const dates = buildScheduleDates({
    intervalMinutes: EYE_REST_INTERVAL_MINUTES,
    quietHoursEnabled,
    quietStart,
    quietEnd,
  });
  const scheduled = [];
  try {
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
      scheduled.push(date);
    }
  } finally {
    await logScheduledReminders('eyeRest', scheduled);
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
  await appendScheduledReminder('posture', new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000));
}
