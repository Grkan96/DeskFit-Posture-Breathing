import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  appendSchedule,
  emptyActivity,
  normalizeActivity,
  reconcile,
  recordAction,
  setSchedule,
  todayCounts,
} from './activityLogic';
import { emitStatsChanged } from './statsEvents';

const KEY = 'durus-hatirlatici/reminder-activity';

// Okuma-değiştirme-yazma işlemleri (zamanlayıcı, bildirim dinleyicisi, ekran
// açılışı) üst üste binip birbirinin verisini ezmesin diye sıraya dizilir.
let queue = Promise.resolve();

function withState(mutate) {
  const run = queue.then(async () => {
    let state;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      state = normalizeActivity(raw ? JSON.parse(raw) : null);
    } catch (e) {
      state = emptyActivity();
    }
    const { next, result, changed } = mutate(state);
    if (changed) {
      await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    }
    return { state: next, result, changed };
  });
  queue = run.catch(() => {});
  return run;
}

export async function getReminderActivity() {
  const { state } = await withState((state) => ({ next: state, result: null, changed: false }));
  return state;
}

// Planı değiştirmeden önce zamanı gelmiş hatırlatmalar önce teslim edilmiş
// sayılır; yoksa yeniden zamanlama/iptal, henüz sayılmamış geçmiş kayıtları
// silip istatistiklerden düşürürdü.
async function changeSchedule(change) {
  const { result } = await withState((state) => {
    const { state: settled, deliveredCount } = reconcile(state, Date.now());
    return { next: change(settled), result: deliveredCount, changed: true };
  });
  if (result > 0) emitStatsChanged();
}

// Bildirimler zamanlanırken planlanan zamanları kaydeder (o türün eski planı silinir).
export async function logScheduledReminders(kind, dates) {
  await changeSchedule((state) => setSchedule(state, kind, dates.map((d) => d.getTime())));
}

// Ana planı bozmadan tek bir ek hatırlatma (erteleme, test) ekler.
export async function appendScheduledReminder(kind, date) {
  await changeSchedule((state) => appendSchedule(state, kind, [date.getTime()]));
}

export async function clearScheduledReminders(kind) {
  await changeSchedule((state) => setSchedule(state, kind, []));
}

// Zamanı gelmiş planlı hatırlatmaları teslim edilmiş sayar; değişiklik olduysa
// açık ekranlara haber verir. Bugünün toplam hatırlatma sayısını döner.
export async function reconcileDeliveredReminders() {
  const { state, result } = await withState((state) => {
    const { state: next, deliveredCount } = reconcile(state, Date.now());
    return { next, result: deliveredCount, changed: deliveredCount > 0 };
  });
  if (result > 0) emitStatsChanged();
  const today = todayCounts(state, Date.now());
  return today.posture + today.eyeRest;
}

export async function recordReminderAction(action) {
  await withState((state) => ({
    next: recordAction(state, action, Date.now()),
    changed: true,
  }));
  emitStatsChanged();
}

export async function getTodayReminderCount() {
  return reconcileDeliveredReminders();
}
