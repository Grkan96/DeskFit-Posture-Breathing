// Saf mantık (RN/AsyncStorage import yok — node ile test edilebilir).
// Hareket/egzersiz meta verisi (görsel metinler lib/locales içinde
// movements.items.<id> / exercises.items.<id> anahtarlarında), günün önerisi
// ve "60 saniyelik hızlı mola" planı burada.

export const MOVEMENT_META = [
  { id: 'shoulder-shrug', icon: '🤷', seconds: 20 },
  { id: 'neck-stretch', icon: '🙆', seconds: 20 },
  { id: 'shoulder-blade', icon: '💪', seconds: 20 },
  { id: 'wrist-stretch', icon: '🖐️', seconds: 20 },
  { id: 'torso-twist', icon: '🔄', seconds: 20 },
  { id: 'chin-tuck', icon: '🙂', seconds: 20 },
  { id: 'eye-rest', icon: '👀', seconds: 20 },
  { id: 'seated-cat-cow', icon: '🐈', seconds: 20 },
  { id: 'seated-figure-four', icon: '🦵', seconds: 20 },
  { id: 'standing-back-bend', icon: '🧍', seconds: 20 },
];

export const EXERCISE_META = [
  { id: 'wall-pushup', icon: '🧱', seconds: 25 },
  { id: 'chair-squat', icon: '🪑', seconds: 25 },
  { id: 'plank-hold', icon: '🏋️', seconds: 20 },
  { id: 'calf-raise', icon: '🦵', seconds: 20 },
  { id: 'seated-core', icon: '🔥', seconds: 20 },
  { id: 'wall-angel', icon: '👼', seconds: 25 },
  { id: 'bird-dog', icon: '🐕', seconds: 25 },
];

// Hızlı mola: ~20 sn nefes (2 tur x 10 sn) + 2 hareket x 20 sn = 60 sn.
export const QUICK_BREAK_MOVEMENT_IDS = ['neck-stretch', 'shoulder-blade'];
export const QUICK_BREAK_TOTAL_SECONDS = 60;

const SUGGESTION_TYPES = ['movements', 'exercises', 'breathing'];

export function dayOfYear(date = new Date()) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((now - start) / 86400000);
}

// Kullanıcının en az yaptığı tür; eşitlikte (veya hiç veri yoksa) güne göre döner.
// Dönüş: { type, techniqueIndex } — techniqueIndex nefes tekniği seçimi için.
export function pickSuggestion(byType, date = new Date(), techniqueCount = 3) {
  const day = dayOfYear(date);
  const counts = SUGGESTION_TYPES.map((type) => Number((byType && byType[type]) || 0));
  const min = Math.min(...counts);
  const candidates = SUGGESTION_TYPES.filter((_, i) => counts[i] === min);
  const type = candidates[day % candidates.length];
  return { type, techniqueIndex: day % Math.max(1, techniqueCount) };
}
