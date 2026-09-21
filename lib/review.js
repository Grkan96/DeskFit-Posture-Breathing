import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_PROMPTED_KEY = 'durus-hatirlatici/review-prompted';
// Kullanıcı en az bu kadar seans tamamladıktan sonra (yani uygulamayı gerçekten
// kullanıp faydasını gördükten sonra) değerlendirme isteği gösterilir.
const SESSIONS_THRESHOLD = 5;

// Sadece bir kez, uygun bir anda (bir seans tamamlandıktan hemen sonra —
// kullanıcı memnun bir haldeyken) native değerlendirme penceresini tetikler.
export async function maybeRequestReview(totalSessions) {
  if (totalSessions < SESSIONS_THRESHOLD) return;
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
