// Başarım/rozet tanımları ve saf (yan etkisiz) değerlendirme mantığı.
// Bu dosya bilinçli olarak React Native / AsyncStorage import etmez, böylece
// node ile doğrudan test edilebilir. Kalıcılık lib/stats.js içinde yapılır.

// `check(ctx)`: ctx = { totalSessions, streak, byType, todayCount, challengeCompleted }
export const ACHIEVEMENTS = [
  { id: 'first_session', icon: '🌱', check: (c) => c.totalSessions >= 1 },
  { id: 'streak_7', icon: '🔥', check: (c) => c.streak >= 7 },
  { id: 'streak_30', icon: '🎉', check: (c) => c.streak >= 30 },
  { id: 'streak_100', icon: '🏆', check: (c) => c.streak >= 100 },
  { id: 'sessions_20', icon: '👀', check: (c) => c.totalSessions >= 20 }, // 20-20-20
  { id: 'sessions_50', icon: '💪', check: (c) => c.totalSessions >= 50 },
  {
    id: 'all_types',
    icon: '🧭',
    check: (c) => c.byType.breathing > 0 && c.byType.movements > 0 && c.byType.exercises > 0,
  },
  { id: 'triple_day', icon: '⚡', check: (c) => c.todayCount >= 3 },
  { id: 'breathing_10', icon: '🌬️', check: (c) => c.byType.breathing >= 10 },
  { id: 'challenge', icon: '🎯', check: (c) => !!c.challengeCompleted },
];

// Henüz açılmamış olup şu an koşulu sağlanan rozetlerin id listesini döner.
export function evaluateAchievements(ctx, unlocked = {}) {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.check(ctx)).map((a) => a.id);
}
