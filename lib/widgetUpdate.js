// Android ana ekran widget'ı için GÜVENLİ güncelleme yardımcıları.
//
// `react-native-android-widget` native bir modül gerektirir ve sadece gerçek
// EAS derlemelerinde (dev/preview/production) mevcuttur. Expo Go'da bu native
// modül bulunmadığı için paketi import etmenin kendisi (üst seviyede) hata
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

function buildWidgetProps(stats, theme) {
  // stats.history yerel takvim günü anahtarıyla tutulur (bkz. lib/dayStreak.js);
  // bugünün anahtarını aynı biçimde hesaplayıp bugünkü seans sayısını okuyoruz.
  const todayKey = localDayKey(new Date());
  const todayCount = (stats && stats.history && stats.history[todayKey]) || 0;
  const streak = displayStreak(stats);
  return {
    title: translate('widget.title'),
    streak,
    todayCount,
    goal: DAILY_GOAL,
    streakA11y: translate('widget.streakA11y', { count: streak }),
    ratioA11y: translate('widget.ratioA11y', { count: todayCount, goal: DAILY_GOAL }),
    theme,
  };
}

// Ana ekrana eklenmiş tüm "StreakWidget" widget'larını günceller.
// Widget modülü yoksa, Expo Go'daysak, veya herhangi bir hata oluşursa
// sessizce hiçbir şey yapmaz — bu fonksiyon ASLA fırlatmaz.
export async function updateStreakWidget(stats) {
  if (!widgetsAvailable()) return;
  try {
    const widgetPkg = loadWidgetPackage();
    if (!widgetPkg || !widgetPkg.requestWidgetUpdate) return;
    const StreakWidget = loadWidgetComponent();
    if (!StreakWidget) return;
    const React = require('react');

    await widgetPkg.requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => ({
        light: React.createElement(StreakWidget, buildWidgetProps(stats, 'light')),
        dark: React.createElement(StreakWidget, buildWidgetProps(stats, 'dark')),
      }),
    });
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
    const React = require('react');
    const { getStats } = require('./stats');

    switch (props?.widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED': {
        const stats = await getStats();
        props.renderWidget({
          light: React.createElement(StreakWidget, buildWidgetProps(stats, 'light')),
          dark: React.createElement(StreakWidget, buildWidgetProps(stats, 'dark')),
        });
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
