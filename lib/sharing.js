import { Alert, Share } from 'react-native';
import { translate } from './i18n';
import { buildShareUrl, recordShare } from './referral';

// Play Store linki utm/referrer ile (kaynak ölçümü: install_referrer).
function withStoreLink(text, campaign) {
  return `${text}\n\n${buildShareUrl(campaign)}`;
}

// Paylaşımı yapar; başarılıysa sayaca ekler, her 3 paylaşımda ödül metni gösterir.
async function doShare(message, campaign) {
  try {
    const res = await Share.share({ message: withStoreLink(message, campaign) });
    if (res && res.action === Share.dismissedAction) return false;
    const state = await recordShare();
    if (state.rewarded) {
      Alert.alert(
        translate('referral.rewardTitle'),
        translate('referral.rewardBody', { count: state.count, rewards: state.rewards })
      );
    }
    return true;
  } catch (e) {
    // Kullanıcı paylaşımı iptal ettiyse veya bir hata olduysa sessizce geç
    return false;
  }
}

export function shareApp() {
  return doShare(translate('sharing.appMessage'), 'app');
}

export function shareAchievement({ streak, totalSessions }) {
  return doShare(translate('sharing.achievementMessage', { streak, totalSessions }), 'streak');
}

export function shareBadge({ icon, name }) {
  return doShare(translate('sharing.badgeMessage', { icon, name }), 'badge');
}

export function shareChallenge({ days }) {
  return doShare(translate('sharing.challengeMessage', { days }), 'challenge');
}

export function shareWeeklyCard(message) {
  return doShare(message, 'weekly');
}
