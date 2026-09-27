// Android ana ekran widget'ı için GÜVENLİ güncelleme yardımcıları.
//
// `react-native-android-widget` native bir modül gerektirir ve sadece gerçek
// EAS derlemelerinde (dev/preview/production) mevcuttur. Expo Go'da bu native
// modül bulunmadığından paketi import etmenin kendisi (üst seviyede) hata
// fırlatır. Bu yüzden bu dosyada paket ve widget bileşeni HİÇBİR ZAMAN üst
// seviye `import` ile yüklenmez — sadece bu dosya içindeki fonksiyonlarda,
// Expo Go kontrolünden SONRA ve try/catch içinde `require()` ile lazy olarak
// yüklenir. Bkz. lib/ads.js'teki `isRunningInExpoGo()` deseni — burada aynı
// desen izlenir.
//
// Bu modüldeki hiçbir fonksiyon, hiçbir koşulda uygulamanın geri kalanını
// etkileyecek şekilde hata fırlatmamalıdır (widget güncellemesi başarısız
// olursa sessizce yok sayılır).
import { isRunningInExpoGo } from 'expo';
import { translate } from './i18n';
import { DAILY_GOAL, displayStreak } from './homeProgress';
import { localDayKey } from './dayStreak';

export const WIDGET_NAME = 'StreakWidget';

// En son bilinen hatırlatıcı bağlamı (App.js'ten `updateWidgetContext` ile
// beslenir). Widget'ın kendi başına (OS'nin periyodik tetiklemesiyle, headless
// task içinde) yeniden çizilmesi gerektiğinde de bu son bilinen değerler
// kullanılır. Uygulama hiç çalıştırılıp bağlam bildirilmediyse güvenli
// varsayılanlar kullanılır.
let lastContext = { isRunning: false, intervalMinutes: null, nextReminderAt: null };

// Widget'ların bu ortamda teorik olarak mevcut olup olamayacağını söyler
// (native modül gerçekten linklenmiş mi diye bakmaz — sadece Expo Go
// olmadığımızı doğrular). Gerçek varlık kontrolü require() denemesiyle olur.
export function widgetsAvailable() {
  try {
    return !isRunningInExpoGo();
  } catch {
    return false;
  }
}

// `react-native-android-widget` paketini yalnızca gerektiğinde, güvenle
// require eder. Paket yoksa (veya Expo Go'daysak) null döner, ASLA fırlatmaz.
function loadWidgetPackage() {
  if (!widgetsAvailable()) return null;
  try {
    // eslint-disable-next-line global-require
    return require('react-native-android-widget');
  } catch (e) {
    return null;
  }
}

// Widget'ın React ağacını tanımlayan bileşeni, yalnızca gerektiğinde
// güvenle require eder. Bu dosya da native paketi üst seviyede import ettiği
// için aynı şekilde korunur.
function loadWidgetComponent() {
  if (!widgetsAvailable()) return null;
  try {
    // eslint-disable-next-line global-require
    const mod = require('../components/widgets/StreakWidget');
    return mod.StreakWidget;
  } catch (e) {
    return null;
  }
}

// `nextReminderAt` (epoch ms) değerini yerel "HH:MM" metnine çevirir.
// Herhangi bir sorunda (geçersiz değer vb.) null döner, ASLA fırlatmaz.
function formatClockTime(timestamp) {
  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return null;
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch (e) {
    return null;
  }
}

// `stats` + bağlam (isRunning/nextReminderAt) verisinden StreakWidget'a
// geçilecek tüm hazır (çevrilmiş) prop'ları üretir. Widget bileşeni kendi
// çevirisini yapmaz — tüm metinler burada `translate()` ile hazırlanır.
function buildWidgetProps(stats, context, theme) {
  // stats.history yerel takvim günü anahtarıyla tutulur (bkz. lib/dayStreak.js);
  // bugünün anahtarını aynı biçimde hesaplayıp bugünkü seans sayısını okuyoruz.
  const todayKey = localDayKey(new Date());
  const todayCount = (stats && stats.history && stats.history[todayKey]) || 0;
  const streak = displayStreak(stats);
  const goal = DAILY_GOAL;
  const progressPercent = goal > 0 ? Math.max(0, Math.min(100, Math.round((todayCount / goal) * 100))) : 0;

  // Haftalık mini şerit için son 7 günün verisi (lib/stats.js zaten bu dosyayı
  // üst seviyede import ediyor — döngüsel import'tan kaçınmak için burada da
  // aynı lazy require deseni kullanılır).
  let last7Days = [];
  try {
    // eslint-disable-next-line global-require
    const { getLast7Days } = require('./stats');
    last7Days = getLast7Days((stats && stats.history) || {}) || [];
  } catch (e) {
    last7Days = [];
  }

  const isRunning = Boolean(context && context.isRunning);
  const nextReminderAt =
    context && typeof context.nextReminderAt === 'number' ? context.nextReminderAt : null;
  const nextClockTime = isRunning && nextReminderAt ? formatClockTime(nextReminderAt) : null;

  return {
    title: translate('widget.title'),
    streak,
    todayCount,
    goal,
    progressPercent,
    streakA11y: translate('widget.streakA11y', { count: streak }),
    ratioA11y: translate('widget.ratioA11y', { count: todayCount, goal }),
    isRunning,
    statusLabel: translate(isRunning ? 'widget.statusRunning' : 'widget.statusPaused'),
    statusA11y: translate(isRunning ? 'widget.statusRunningA11y' : 'widget.statusPausedA11y'),
    nextLabel: nextClockTime ? translate('widget.next', { time: nextClockTime }) : null,
    nextA11y: nextClockTime ? translate('widget.nextA11y', { time: nextClockTime }) : null,
    weekStripA11y: translate('widget.weekStripA11y'),
    last7Days,
    theme,
  };
}

// `StreakWidget`'ın light/dark iki varyantını (React elemanı olarak) üretir.
// `renderWidget` (imperative requestWidgetUpdate) ve `widgetTaskHandler`
// (native tarafın çağırdığı headless task) tarafından paylaşılan tek yol.
function buildThemedElements(StreakWidget, React, stats, context) {
  return {
    light: React.createElement(StreakWidget, buildWidgetProps(stats, context, 'light')),
    dark: React.createElement(StreakWidget, buildWidgetProps(stats, context, 'dark')),
  };
}

// Ana ekrana eklenmiş tüm "StreakWidget" widget'larını verilen stats + bağlamla
// yeniden çizer. Widget modülü yoksa, Expo Go'daysak, veya herhangi bir hata
// oluşursa sessizce hiçbir şey yapmaz — bu fonksiyon ASLA fırlatmaz.
async function renderWidget(stats, context) {
  if (!widgetsAvailable()) return;
  const widgetPkg = loadWidgetPackage();
  if (!widgetPkg || !widgetPkg.requestWidgetUpdate) return;
  const StreakWidget = loadWidgetComponent();
  if (!StreakWidget) return;
  // eslint-disable-next-line global-require
  const React = require('react');

  await widgetPkg.requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: () => buildThemedElements(StreakWidget, React, stats, context),
  });
}

// Ana ekrana eklenmiş tüm "StreakWidget" widget'larını günceller (sadece
// stats değişti; en son bilinen çalışma/hatırlatıcı bağlamı `lastContext`'ten
// kullanılır). Bu fonksiyon ASLA fırlatmaz.
export async function updateStreakWidget(stats) {
  if (!widgetsAvailable()) return;
  try {
    await renderWidget(stats, lastContext);
  } catch (e) {
    // Widget güncellemesi asla uygulamanın geri kalanını bozmamalı.
  }
}

// App.js'ten çağrılır: çalışma durumu / aralık / bir sonraki hatırlatıcı
// zamanı değiştiğinde widget'ı daha zengin bir bağlamla yeniden çizer.
// `context` kısmi olabilir — `lastContext` ile birleştirilir. Bu fonksiyon
// ASLA fırlatmaz.
export async function updateWidgetContext(context) {
  lastContext = { ...lastContext, ...(context || {}) };
  if (!widgetsAvailable()) return;
  try {
    // eslint-disable-next-line global-require
    const { getStats } = require('./stats');
    const stats = await getStats();
    await renderWidget(stats, lastContext);
  } catch (e) {
    // Widget güncellemesi asla uygulamanın geri kalanını bozmamalı.
  }
}

// index.js içinde `registerWidgetTaskHandler` ile kaydedilecek olan görev
// işleyicisi (headless task). Widget eklendiğinde veya periyodik
// `updatePeriodMillis` tetiklemesinde native taraf bunu çağırır.
export async function widgetTaskHandler(props) {
  try {
    const StreakWidget = loadWidgetComponent();
    if (!StreakWidget) return;
    // eslint-disable-next-line global-require
    const React = require('react');
    // eslint-disable-next-line global-require
    const { getStats } = require('./stats');

    switch (props?.widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED': {
        const stats = await getStats();
        props.renderWidget(buildThemedElements(StreakWidget, React, stats, lastContext));
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // Headless görev asla fırlatmamalı (native tarafta sessizce loglanır).
  }
}

// index.js'den çağrılır. `registerWidgetTaskHandler`'ı sadece Expo Go
// DIŞINDA ve güvenli bir şekilde (require + try/catch) kaydeder.
// Widget paketi bulunamazsa (örn. eski/farklı bir client) sessizce hiçbir
// şey yapmaz.
export function registerWidgetTaskHandlerSafely() {
  if (!widgetsAvailable()) return;
  try {
    const widgetPkg = loadWidgetPackage();
    if (!widgetPkg || !widgetPkg.registerWidgetTaskHandler) return;
    widgetPkg.registerWidgetTaskHandler(widgetTaskHandler);
  } catch (e) {
    // Kayıt başarısız olursa uygulama açılışı asla bundan etkilenmemeli.
  }
}
