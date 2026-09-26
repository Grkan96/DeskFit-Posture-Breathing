import { Alert } from 'react-native';
import { shareAchievement } from './sharing';
import { translate } from './i18n';
import { claimNewlyUnlockedBadges } from './achievements';

const MILESTONE_KEYS = { 7: 'sharing.milestone7', 30: 'sharing.milestone30', 100: 'sharing.milestone100' };

// recordSessionCompleted()'in döndürdüğü sonuçta yeni bir kilometre taşına
// ulaşıldıysa (7/30/100 gün seri), kutlama + paylaşım isteği gösterir.
// Kilometre taşı yoksa, yeni açılan rozet(ler) için kısa bir kutlama gösterir.
// İki uyarı aynı anda çıkmasın diye: seri kutlaması gösterilirse yeni
// rozetler sessizce "duyuruldu" olarak işaretlenir.
export function celebrateIfMilestone(result) {
  if (!result) return;
  if (result.newMilestone) {
    claimNewlyUnlockedBadges(result).catch(() => {});
    const { newMilestone, streak, totalSessions } = result;
    const bodyKey = MILESTONE_KEYS[newMilestone];
    const body = bodyKey ? translate(bodyKey) : `${newMilestone}`;
    Alert.alert(translate('sharing.milestoneAlertTitle'), body, [
      { text: translate('sharing.shareCta'), onPress: () => shareAchievement({ streak, totalSessions }) },
      { text: translate('sharing.closeCta'), style: 'cancel' },
    ]);
    return;
  }
  celebrateNewBadges(result).catch(() => {});
}

async function celebrateNewBadges(stats) {
  const fresh = await claimNewlyUnlockedBadges(stats);
  if (fresh.length === 0) return;
  const lines = fresh
    .map((badge) => `${badge.icon} ${translate(`achievements.items.${badge.id}.title`)}`)
    .join('\n');
  const title =
    fresh.length === 1
      ? translate('achievements.unlockedAlertTitle')
      : translate('achievements.unlockedAlertTitleMany', { count: fresh.length });
  Alert.alert(title, lines, [{ text: translate('sharing.closeCta'), style: 'cancel' }]);
}
