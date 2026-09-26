import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDayKey } from './dayStreak';

const KEY = 'durus-hatirlatici/daily-reminder-count';

function todayKey() {
  return localDayKey();
}

export async function getTodayReminderCount() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === todayKey() && Number.isFinite(count) ? count : 0;
  } catch (e) {
    return 0;
  }
}

// Bir duruş hatırlatma bildirimi kullanıcıya ulaştığında (uygulama açık ya
// da arka planda canlıyken) çağrılır. Gün değişince sayaç otomatik sıfırlanır.
export async function incrementTodayReminderCount() {
  const current = await getTodayReminderCount();
  const next = current + 1;
  await AsyncStorage.setItem(KEY, JSON.stringify({ date: todayKey(), count: next })).catch(
    () => {}
  );
  return next;
}
