import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const TITLE = 'Duruş Hatırlatıcı';
export const POSTURE_CATEGORY = 'posture-reminder';
export const SNOOZE_ACTION = 'snooze';
export const DONE_ACTION = 'done';
const SNOOZE_MINUTES = 10;

// Odak alanına göre gruplanmış mesaj havuzu — hem çeşitlilik hem eğitici
// içerik sağlar. Zamanlanırken hepsi tek bir havuzda birleştirilip rastgele
// seçilir.
const MESSAGE_CATEGORIES = {
  boyun: [
    'Boynunu hafifçe sağa, sonra sola çevir 🙆',
    'Çeneni göğsüne yaklaştırıp boynunu gerdir 🦢',
    'Ekrana çok yakınsın, boynunu geriye al 📱',
  ],
  omuz: [
    'Omuzlarını kulaklarına doğru kaldır, sonra bırak 🤷',
    'Omuzlarını geriye at, göğsünü aç 💪',
    'Kürek kemiklerini birbirine yaklaştır 🔙',
  ],
  sirt: [
    'Dik otur, belini sandalyenin arkasına yasla 🪑',
    'Omurganı uzat, tepe noktandan yukarı çekiliyormuş gibi düşün 🧍',
    'Sırtını dikleştir, karnını hafifçe içeri çek 🎯',
  ],
  goz: [
    'Gözlerini 20 saniyeliğine uzağa odakla (20-20-20 kuralı) 👀',
    'Gözlerini birkaç kez sıkıca kapat, gevşet 😌',
    'Ekrandan uzaklaş, gözlerini biraz dinlendir 🖥️',
  ],
  nefes: [
    'Derin bir nefes al, omuzlarını indir 🌬️',
    'Birkaç saniye gözlerini kapatıp sadece nefesine odaklan 🧘',
  ],
};
const ALL_MESSAGES = Object.values(MESSAGE_CATEGORIES).flat();

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

  await Notifications.setNotificationChannelAsync('reminders-silent', {
    name: 'Duruş hatırlatmaları (sessiz)',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: [0],
  });

  for (const intensity of Object.keys(VIBRATION_PATTERNS)) {
    await Notifications.setNotificationChannelAsync(channelId('vibrate', intensity), {
      name: `Duruş hatırlatmaları (titreşim - ${intensity})`,
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      vibrationPattern: VIBRATION_PATTERNS[intensity],
    });
    await Notifications.setNotificationChannelAsync(channelId('sound', intensity), {
      name: `Duruş hatırlatmaları (sesli - ${intensity})`,
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: VIBRATION_PATTERNS[intensity],
    });
  }
}

// Bildirimdeki hızlı butonlar. `opensAppToForeground: true` şart — aksi halde
// uygulama tamamen kapalıyken (öldürülmüşken) butona basınca JS tarafındaki
// dinleyici hiç tetiklenmez ve erteleme çalışmaz.
export async function ensureNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(POSTURE_CATEGORY, [
    {
      identifier: SNOOZE_ACTION,
      buttonTitle: `Ertele (${SNOOZE_MINUTES} dk)`,
      options: { opensAppToForeground: true },
    },
    {
      identifier: DONE_ACTION,
      buttonTitle: 'Yaptım',
      options: { opensAppToForeground: true },
    },
  ]);
}

function pickRandomMessage() {
  return ALL_MESSAGES[Math.floor(Math.random() * ALL_MESSAGES.length)];
}

function buildBody(userName) {
  const message = pickRandomMessage();
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

export async function scheduleReminder({
  intervalMinutes,
  alertMode,
  vibrationIntensity,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  userName,
}) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const dates = buildScheduleDates({
    intervalMinutes,
    quietHoursEnabled,
    quietStart,
    quietEnd,
  });
  const channel = channelId(alertMode, vibrationIntensity);
  for (const date of dates) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: TITLE,
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

export async function sendTestNotification({ alertMode, vibrationIntensity, userName }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: TITLE,
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
      title: TITLE,
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
