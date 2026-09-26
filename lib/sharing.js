import { Share } from 'react-native';
import { translate } from './i18n';

// TODO: Play Store'da yayınlandıktan sonra gerçek paket adına göre güncelle.
// Örn: 'https://play.google.com/store/apps/details?id=com.senin.paketadin'
const APP_STORE_URL = null;

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

export async function shareBadge({ icon, name }) {
  try {
    await Share.share({
      message: withStoreLink(translate('sharing.badgeMessage', { icon, name })),
    });
  } catch (e) {
    // Kullanıcı paylaşımı iptal ettiyse veya bir hata olduysa sessizce geç
  }
}

export async function shareChallenge({ days }) {
  try {
    await Share.share({
      message: withStoreLink(translate('sharing.challengeMessage', { days })),
    });
  } catch (e) {
    // Kullanıcı paylaşımı iptal ettiyse veya bir hata olduysa sessizce geç
  }
}
