import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_PROMPTED_KEY = 'durus-hatirlatici/review-prompted';
// Günlük duruş hedefine ulaşılan (farklı) günlerin listesi — YYYY-MM-DD.
const GOAL_DAYS_KEY = 'durus-hatirlatici/review-goal-days';
// Kullanıcı en az bu kadar seans tamamladıktan sonra (yani uygulamayı gerçekten
// kullanıp faydasını gördükten sonra) değerlendirme isteği gösterilir.
const SESSIONS_THRESHOLD = 5;
// Günlük hedef tetikleyicisi: hedefin tutturulduğu en az farklı gün sayısı.
const GOAL_DAYS_THRESHOLD = 2;

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Tek seferlik native değerlendirme penceresi (REVIEW_PROMPTED_KEY ile korunur).
async function requestReviewOnce() {
  try {
    const alreadyPrompted = await AsyncStorage.getItem(REVIEW_PROMPTED_KEY);
    if (alreadyPrompted === 'true') return;

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await AsyncStorage.setItem(REVIEW_PROMPTED_KEY, 'true');
    await StoreReview.requestReview();
  } catch (e) {
    // Değerlendirme isteği başarısız olursa sessizce yok say
  }
}

// Sadece bir kez, uygun bir anda (bir seans tamamlandıktan hemen sonra —
// kullanıcı memnun bir haldeyken) native değerlendirme penceresini tetikler.
export async function maybeRequestReview(totalSessions) {
  if (totalSessions < SESSIONS_THRESHOLD) return;
  await requestReviewOnce();
}

// Kullanıcı günlük duruş hedefine o gün İLK kez ulaştığında çağrılır — hedef
// Alert'i kapatıldıktan SONRA (butonun onPress'inden), iki pencere çakışmasın
// diye. Hedefin tutturulduğu günleri kendisi kaydeder ve en az 2 farklı günde
// hedef tutturulmadan istemez. Bugünden önce en az bir hedef günü şart
// olduğundan uygulamanın ilk gününde asla tetiklenmez.
export async function maybeRequestReviewOnGoalReached() {
  try {
    const today = todayKey();
    let days = [];
    try {
      const parsed = JSON.parse((await AsyncStorage.getItem(GOAL_DAYS_KEY)) || '[]');
      if (Array.isArray(parsed)) days = parsed;
    } catch (e) {
      days = [];
    }
    if (!days.includes(today)) {
      // Eşik küçük olduğundan son birkaç günü tutmak yeterli.
      days = [...days, today].slice(-5);
      await AsyncStorage.setItem(GOAL_DAYS_KEY, JSON.stringify(days));
    }
    const hasEarlierDay = days.some((d) => d < today);
    if (days.length < GOAL_DAYS_THRESHOLD || !hasEarlierDay) return;
    await requestReviewOnce();
  } catch (e) {
    // sessizce yok say
  }
}
