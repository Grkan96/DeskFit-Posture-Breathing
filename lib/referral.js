// Viral döngü mantığı: paylaşım linki (utm/referrer), yerel paylaşım sayacı ve
// haftalık kart metni. Üst seviyede import YOK: node ile test edilebilir saf mantık.
// (lib/achievements.js'e dokunmaz; davet rozeti burada bağımsız tutulur.)

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gurkanuslu.durus';
export const SHARE_REWARD_EVERY = 3;
const SHARE_KEY = 'durus-hatirlatici/share-count';

// Kaynağı ölçülebilir Play Store linki. referrer değeri URL-encoded olmalı.
export function buildShareUrl(campaign) {
  const ref =
    'utm_source%3Dshare%26utm_medium%3Dapp' +
    (campaign ? `%26utm_campaign%3D${encodeURIComponent(campaign)}` : '');
  return `${PLAY_STORE_URL}&referrer=${ref}`;
}

// Paylaşım sayacı: her SHARE_REWARD_EVERY paylaşımda bir ödül.
export function nextShareState(prev) {
  const count = ((prev && prev.count) || 0) + 1;
  return {
    count,
    rewards: Math.floor(count / SHARE_REWARD_EVERY),
    rewarded: count % SHARE_REWARD_EVERY === 0,
    untilNext: SHARE_REWARD_EVERY - (count % SHARE_REWARD_EVERY),
  };
}

export function shareProgress(count) {
  const c = count || 0;
  return {
    count: c,
    rewards: Math.floor(c / SHARE_REWARD_EVERY),
    untilNext: SHARE_REWARD_EVERY - (c % SHARE_REWARD_EVERY),
  };
}

// 7 günlük sayıları emoji çubuğuna çevirir: 🟩 = seans yapılan gün.
export function buildWeekBar(counts) {
  return counts.map((n) => (n > 0 ? '🟩' : '⬜')).join('');
}

async function storage() {
  const mod = await import('@react-native-async-storage/async-storage');
  return mod.default;
}

export async function getShareCount() {
  try {
    const raw = await (await storage()).getItem(SHARE_KEY);
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (e) {
    return 0;
  }
}

// Başarılı bir paylaşımı kaydeder; { count, rewards, rewarded, untilNext } döner.
export async function recordShare() {
  const next = nextShareState({ count: await getShareCount() });
  try {
    await (await storage()).setItem(SHARE_KEY, String(next.count));
  } catch (e) {}
  return next;
}
