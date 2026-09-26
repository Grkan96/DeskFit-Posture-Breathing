import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStats } from './stats';
import { setStreakAlerts } from './notifications';
import { DEFAULT_STREAK_ALERT, planStreakAlertDates } from './schedule';

// App.js ile aynı anahtar (ayarların saklandığı yer).
const SETTINGS_KEY = 'durus-hatirlatici/settings';

async function loadStreakAlertSetting() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const saved = raw ? JSON.parse(raw).streakAlert : null;
    if (saved) return { ...DEFAULT_STREAK_ALERT, ...saved };
  } catch (e) {
    // okunamazsa varsayılan
  }
  return DEFAULT_STREAK_ALERT;
}

// Güncel seriye/bugünkü seansa bakıp akşam bildirimini yeniden planlar.
// - Uygulama açılışında, ayar değişince ve her seans tamamlandığında çağrılır.
// - Seans tamamlanınca bugünün bildirimi iptal edilir, yarınınki kurulur.
// `streakAlert` verilirse (ayar henüz diske yazılmamış olabilir) o kullanılır.
export async function refreshStreakAlerts({ streakAlert, stats } = {}) {
  try {
    const setting = streakAlert || (await loadStreakAlertSetting());
    const currentStats = stats || (await getStats());
    // Bildirim izni yoksa hiçbir şey planlama (varsa eski kuyruğu da temizle).
    const perm = await Notifications.getPermissionsAsync();
    const dates = perm.granted
      ? planStreakAlertDates({ stats: currentStats, streakAlert: setting })
      : [];
    await setStreakAlerts({ dates });
  } catch (e) {
    // Bildirim planlanamazsa seans kaydı/uygulama akışı etkilenmesin.
  }
}
