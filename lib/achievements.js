import AsyncStorage from '@react-native-async-storage/async-storage';

// Rozet (başarım) tanımları. Metinler burada değil, lib/locales/{tr,en}.js
// içindeki achievements.items.<id>.{title,description} anahtarlarında tutulur.
// Her tanım `current(stats)` ile mevcut değeri, `target` ile hedefi verir;
// yeni rozet eklemek için bu listeye bir satır eklemek yeterli.
const CATEGORY_TYPES = ['breathing', 'movements', 'exercises', 'eyes'];

const ACHIEVEMENT_DEFS = [
  { id: 'first-session', icon: '🌱', target: 1, current: (s) => s.totalSessions },
  { id: 'sessions-10', icon: '✅', target: 10, current: (s) => s.totalSessions },
  { id: 'sessions-50', icon: '🏅', target: 50, current: (s) => s.totalSessions },
  { id: 'sessions-100', icon: '🏆', target: 100, current: (s) => s.totalSessions },
  { id: 'streak-3', icon: '🔥', target: 3, current: (s) => s.streak },
  { id: 'streak-7', icon: '📅', target: 7, current: (s) => s.streak },
  { id: 'streak-30', icon: '👑', target: 30, current: (s) => s.streak },
  {
    id: 'all-categories',
    icon: '🧭',
    target: CATEGORY_TYPES.length,
    current: (s) => CATEGORY_TYPES.filter((type) => (s.byType?.[type] || 0) > 0).length,
  },
  { id: 'eyes-10', icon: '👀', target: 10, current: (s) => s.byType?.eyes || 0 },
  { id: 'breathing-10', icon: '🌬️', target: 10, current: (s) => s.byType?.breathing || 0 },
];

// Saf fonksiyon: istatistiklerden her rozetin kilit durumunu ve ilerlemesini
// (0..1) hesaplar. Yan etkisi yoktur, ekranda ve kutlamada ortak kullanılır.
export function computeAchievements(stats) {
  const safeStats = stats || {};
  return ACHIEVEMENT_DEFS.map((def) => {
    const value = Math.max(0, Number(def.current(safeStats)) || 0);
    const progress = Math.min(1, value / def.target);
    return {
      id: def.id,
      icon: def.icon,
      unlocked: value >= def.target,
      progress,
      value: Math.min(value, def.target),
      target: def.target,
    };
  });
}

const ANNOUNCED_KEY = 'durus-hatirlatici/announced-badges';

async function getAnnouncedBadges() {
  try {
    const raw = await AsyncStorage.getItem(ANNOUNCED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Açılmış ama henüz duyurulmamış rozetleri döner ve hepsini "duyuruldu"
// olarak işaretler — böylece her rozet yalnızca bir kez kutlanır.
export async function claimNewlyUnlockedBadges(stats) {
  const announced = await getAnnouncedBadges();
  const fresh = computeAchievements(stats).filter(
    (a) => a.unlocked && !announced.includes(a.id)
  );
  if (fresh.length > 0) {
    const next = [...announced, ...fresh.map((a) => a.id)];
    await AsyncStorage.setItem(ANNOUNCED_KEY, JSON.stringify(next)).catch(() => {});
  }
  return fresh;
}
