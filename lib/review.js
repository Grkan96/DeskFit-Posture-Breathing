import { Alert, Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from './i18n';
import { shouldAskReview } from './reviewRules';

const REVIEW_KEY = 'durus-hatirlatici/review-state';
const FEEDBACK_EMAIL = 'uslugurkan2001@gmail.com';

async function load() {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
const save = (s) => AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(s)).catch(() => {});

// Her seans sonunda çağrılır; sadece POZİTİF anda (rozet/challenge/streak kutlaması),
// 5+ seans ve ilk kullanımdan 3+ gün sonra, tek seferlik "memnun musun?" sorar.
// evet -> store review, hayır -> geri bildirim maili.
export async function maybeRequestReview(totalSessions, { positive = false } = {}) {
  try {
    const state = await load();
    if (!state.firstUse) {
      state.firstUse = Date.now();
      await save(state);
    }
    if (!shouldAskReview({ totalSessions, positive, state, now: Date.now() })) return;
    if (!(await StoreReview.isAvailableAsync())) return;

    await save({ ...state, prompted: true });
    // Kutlama penceresiyle çakışmasın diye kısa gecikme.
    setTimeout(() => {
      Alert.alert(translate('review.askTitle'), translate('review.askBody'), [
        {
          text: translate('review.yes'),
          onPress: () => StoreReview.requestReview().catch(() => {}),
        },
        {
          text: translate('review.no'),
          onPress: () =>
            Linking.openURL(
              `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(translate('review.mailSubject'))}`
            ).catch(() => {}),
        },
        { text: translate('review.later'), style: 'cancel' },
      ]);
    }, 6000);
  } catch (e) {
    // sessizce yok say
  }
}
