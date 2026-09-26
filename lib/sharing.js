import { Share } from 'react-native';
import { translate } from './i18n';

// TODO: Bu değer app.json içindeki `expo.android.package` ile birebir aynı
// olmalı. Paket adı değişirse iki yeri birlikte güncelle.
export const ANDROID_PACKAGE = 'com.durushatirlatici.app';

// Mağaza bağlantısı tek bir yerden, paket adından üretilir.
export const APP_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

function withStoreLink(text) {
  return APP_STORE_URL ? `${text}\n\n${APP_STORE_URL}` : text;
}

export async function shareApp() {
  try {
    await Share.share({
      message: withStoreLink(translate('sharing.appMessage')),
    });
  } catch (e) {
    // Kullanıcı paylaşımı iptal ettiyse veya bir hata olduysa sessizce geç
  }
}

export async function shareAchievement({ streak, totalSessions }) {
  try {
    await Share.share({
      message: withStoreLink(translate('sharing.achievementMessage', { streak, totalSessions })),
    });
  } catch (e) {
    // Kullanıcı paylaşımı iptal ettiyse veya bir hata olduysa sessizce geç
  }
}

// Paylaşım kartını (components/ShareCard.js) görsel olarak yakalayıp
// sistem paylaşım menüsüyle paylaşır. Yakalama veya paylaşım mümkün değilse
// (modül yok, cihaz desteklemiyor, hata) düz metin paylaşımına düşer.
// Native modüller dinamik olarak yüklenir: biri eksik olsa bile uygulama çökmez.
export async function shareAchievementImage(viewRef, { streak, totalSessions }) {
  try {
    const { captureRef } = require('react-native-view-shot');
    const Sharing = require('expo-sharing');
    const available = await Sharing.isAvailableAsync();
    if (!available || !viewRef?.current) {
      throw new Error('image-share-unavailable');
    }
    const uri = await captureRef(viewRef, { format: 'png', quality: 1, result: 'tmpfile' });
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: translate('shareCard.dialogTitle'),
      UTI: 'public.png',
    });
  } catch (e) {
    // Görsel paylaşılamadıysa en azından metin + mağaza bağlantısı paylaşılsın
    await shareAchievement({ streak, totalSessions });
  }
}
