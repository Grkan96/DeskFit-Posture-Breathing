// Onboarding profili: masa başı süresi + en çok ağrıyan bölge (+ başlatma teklifi
// sonucu). Başka ekranlardan da okunabilir: loadProfile() / saveProfile(patch).
// Saf mantık; AsyncStorage yalnızca varsayılan depo olarak tembel yüklenir
// (node testlerinde depo enjekte edilir).

export const PROFILE_KEY = 'durus-hatirlatici/profile';
export const DESK_HOURS = ['lt4', '4-6', '6-8', '8plus'];
export const PAIN_AREAS = ['neck', 'back', 'shoulder', 'lowerBack', 'eyes'];

export const EMPTY_PROFILE = {
  deskHours: null,
  painArea: null,
  reminderOffered: null, // true: kullanıcı ilk hatırlatmayı başlatmak istedi
  notificationsGranted: null,
  completedAt: null,
};

// Bozuk/eksik veriyi güvenli bir profile çevirir; bilinmeyen değerler null olur.
export function normalizeProfile(raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    deskHours: DESK_HOURS.includes(p.deskHours) ? p.deskHours : null,
    painArea: PAIN_AREAS.includes(p.painArea) ? p.painArea : null,
    reminderOffered: typeof p.reminderOffered === 'boolean' ? p.reminderOffered : null,
    notificationsGranted: typeof p.notificationsGranted === 'boolean' ? p.notificationsGranted : null,
    completedAt: typeof p.completedAt === 'number' ? p.completedAt : null,
  };
}

export function mergeProfile(current, patch) {
  return normalizeProfile({ ...normalizeProfile(current), ...(patch || {}) });
}

function defaultStorage() {
  return require('@react-native-async-storage/async-storage').default;
}

export async function loadProfile(storage) {
  try {
    const raw = await (storage || defaultStorage()).getItem(PROFILE_KEY);
    return normalizeProfile(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

// Kısmi güncelleme: mevcut profille birleştirip yazar, birleşik profili döner.
export async function saveProfile(patch, storage) {
  const store = storage || defaultStorage();
  const merged = mergeProfile(await loadProfile(store), patch);
  try {
    await store.setItem(PROFILE_KEY, JSON.stringify(merged));
  } catch {}
  return merged;
}
