import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const CHANNEL_SOUND = 'reminders-sound';
export const CHANNEL_SILENT = 'reminders-silent';

const TITLE = 'Duruş Hatırlatıcı';
const MESSAGES = [
  'Dik otur, omuzlarını gevşet 🧘',
  'Omuzlarını geriye at, göğsünü aç 💪',
  'Ayaklarını yere düzleştir, sırtını dikleştir 🪑',
  'Ekrana çok yakınsın, biraz uzaklaş ve boynunu gevşet 🙆',
  'Derin bir nefes al, omuzlarını indir 🌬️',
  'Kalçanı sandalyenin arkasına yasla, belini destekle 🧍',
];

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

export async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_SOUND, {
    name: 'Duruş hatırlatmaları (sesli)',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
  await Notifications.setNotificationChannelAsync(CHANNEL_SILENT, {
    name: 'Duruş hatırlatmaları (sessiz)',
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
    vibrationPattern: [0, 250, 250, 250],
  });
}

function pickRandomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
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
  soundEnabled,
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
  const channelId = soundEnabled ? CHANNEL_SOUND : CHANNEL_SILENT;
  for (const date of dates) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: TITLE,
        body: buildBody(userName),
        sound: soundEnabled ? 'default' : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId,
      },
    });
  }
}

export async function sendTestNotification({ soundEnabled, userName }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: TITLE,
      body: buildBody(userName),
      sound: soundEnabled ? 'default' : undefined,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
      channelId: soundEnabled ? CHANNEL_SOUND : CHANNEL_SILENT,
    },
  });
}
