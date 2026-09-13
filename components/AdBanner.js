import { StyleSheet, Text, View } from 'react-native';
import { adsAvailable, BANNER_AD_UNIT_ID } from '../lib/ads';

// Statik `import` yerine koşullu `require`: Expo Go'da bu satır hiç
// çalışmadığından native modül aranmaz ve uygulama çökmez. Gerçek bir
// development/production derlemede ise reklam normal şekilde yüklenir.
let AdComponents = null;
if (adsAvailable()) {
  AdComponents = require('react-native-google-mobile-ads');
}

export default function AdBanner() {
  if (!AdComponents) {
    if (__DEV__) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            📢 Reklam alanı — Expo Go'da görünmez, development build'de aktif olur
          </Text>
        </View>
      );
    }
    return null;
  }

  const { BannerAd, BannerAdSize } = AdComponents;
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 16,
  },
  placeholder: {
    marginTop: 16,
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
