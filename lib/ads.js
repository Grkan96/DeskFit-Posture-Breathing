import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

// Google'ın resmi TEST reklam kimlikleri — her zaman dolar, gerçek para
// üretmez, gerçek AdMob hesabı olmadan güvenle geliştirme yapmak içindir.
// https://developers.google.com/admob/android/test-ads
const TEST_BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/2934735716',
  android: 'ca-app-pub-3940256099942544/6300978111',
  default: 'ca-app-pub-3940256099942544/6300978111',
});

// Gerçek AdMob banner reklam birimi. iOS için henüz ayrı bir birim
// oluşturulmadığından iOS test kimliğinde kalır.
const REAL_BANNER_AD_UNIT_ID = Platform.select({
  android: 'ca-app-pub-3272042685849939/6915556770',
  default: TEST_BANNER_AD_UNIT_ID,
});

// Geliştirmede her zaman test reklamı: kendi gerçek reklamına tıklamak AdMob
// hesabının kapatılmasına yol açabilir. Yayın derlemesinde gerçek ID kullanılır.
export const BANNER_AD_UNIT_ID = __DEV__ ? TEST_BANNER_AD_UNIT_ID : REAL_BANNER_AD_UNIT_ID;

export function adsAvailable() {
  return !isRunningInExpoGo();
}

let initPromise = null;

// Reklam SDK'sını uygulama açılışında bir kez başlatır. Expo Go'da native
// modül bulunamayacağından bu fonksiyon orada hiçbir şey yapmaz.
export function initializeAds() {
  if (!adsAvailable()) return Promise.resolve();
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const { default: mobileAds } = require('react-native-google-mobile-ads');
        await mobileAds().initialize();
      } catch (e) {
        // Reklam SDK'sı başlatılamazsa uygulamanın geri kalanı etkilenmesin
      }
    })();
  }
  return initPromise;
}
