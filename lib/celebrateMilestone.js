import { Alert } from 'react-native';
import { shareAchievement, shareBadge, shareChallenge } from './sharing';
import { translate } from './i18n';
import { ACHIEVEMENTS } from './achievements';
import { CHALLENGE_DAYS } from './challenge';

const MILESTONE_KEYS = { 7: 'sharing.milestone7', 30: 'sharing.milestone30', 100: 'sharing.milestone100' };

// recordSessionCompleted()'in döndürdüğü sonuçta yeni bir kilometre taşı
// (7/30/100 gün seri), rozet veya challenge tamamlanması varsa TEK bir
// kutlama + paylaşım penceresi gösterir (üst üste birden çok Alert açmamak için).
export function celebrateIfMilestone(result) {
  if (!result) return;
  const { newMilestone, streak, totalSessions, newAchievements = [], challengeJustCompleted } = result;
  const badges = ACHIEVEMENTS.filter((a) => newAchievements.includes(a.id));
  if (!newMilestone && badges.length === 0 && !challengeJustCompleted) return;

  const lines = [];
  if (newMilestone) {
    const bodyKey = MILESTONE_KEYS[newMilestone];
    lines.push(bodyKey ? translate(bodyKey) : `${newMilestone}`);
  }
  if (challengeJustCompleted) {
    lines.push(translate('challenge.completedBody', { days: CHALLENGE_DAYS }));
  }
  for (const b of badges) {
    lines.push(`${b.icon} ${translate(`achievements.items.${b.id}.title`)}`);
  }

  // Paylaşım önceliği: challenge > rozet > seri kilometre taşı.
  let onShare = () => shareAchievement({ streak, totalSessions });
  if (challengeJustCompleted) {
    onShare = () => shareChallenge({ days: CHALLENGE_DAYS });
  } else if (badges.length > 0) {
    const b = badges[badges.length - 1];
    onShare = () => shareBadge({ icon: b.icon, name: translate(`achievements.items.${b.id}.title`) });
  }

  const title = newMilestone && badges.length === 0 && !challengeJustCompleted
    ? translate('sharing.milestoneAlertTitle')
    : translate('achievements.unlockedTitle');
  Alert.alert(title, lines.join('\n'), [
    { text: translate('sharing.shareCta'), onPress: onShare },
    { text: translate('sharing.closeCta'), style: 'cancel' },
  ]);
}
