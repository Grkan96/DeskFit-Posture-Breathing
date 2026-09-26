import { Alert } from 'react-native';
import { shareAchievement } from './sharing';
import { translate } from './i18n';
import { openSharePreview } from './sharePreview';

const MILESTONE_KEYS = { 7: 'sharing.milestone7', 30: 'sharing.milestone30', 100: 'sharing.milestone100' };

// recordSessionCompleted()'in döndürdüğü sonuçta yeni bir kilometre taşına
// ulaşıldıysa (7/30/100 gün seri), kutlama + paylaşım isteği gösterir.
export function celebrateIfMilestone(result) {
  if (!result || !result.newMilestone) return;
  const { newMilestone, streak, totalSessions } = result;
  const bodyKey = MILESTONE_KEYS[newMilestone];
  const body = bodyKey ? translate(bodyKey) : `${newMilestone}`;
  Alert.alert(translate('sharing.milestoneAlertTitle'), body, [
    {
      text: translate('sharing.shareCta'),
      // Önce görsel kart önizlemesini aç; modal yoksa düz metin paylaşımına düş.
      onPress: () => {
        const opened = openSharePreview({ streak, totalSessions, history: result.history, message: body });
        if (!opened) shareAchievement({ streak, totalSessions });
      },
    },
    { text: translate('sharing.closeCta'), style: 'cancel' },
  ]);
}
