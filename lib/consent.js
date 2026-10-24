import { isRunningInExpoGo } from 'expo';

// Google UMP (User Messaging Platform) onay akışı — AB/EEA/UK kullanıcıları
// için GDPR/ePrivacy gereği. Form metni AdMob konsolundaki "Privacy &
// messaging" bölümünde yapılandırılır (kodda değil). iOS'ta AdMob konsolunda
// bir ATT mesajı da yapılandırılırsa UMP, ATT iznini kendisi ister.
//
// Expo Go'da native modül olmadığından hiçbir şey yapmaz ve reklam
// başlatılmaz (adsAvailable() ile aynı koşul).

let consentPromise = null;
let lastCanRequestAds = false;

function loadModule() {
  return require('react-native-google-mobile-ads');
}

// Onay bilgisini toplar; gerekiyorsa Google'ın onay formunu gösterir.
// Sonuç: reklam istenip istenemeyeceği (true/false). Hata durumunda
// (ör. çevrimdışı) son bilinen onay durumuna bakılır; o da yoksa false.
export function gatherAdsConsent() {
  if (isRunningInExpoGo()) return Promise.resolve(false);
  if (!consentPromise) {
    consentPromise = (async () => {
      try {
        const { AdsConsent } = loadModule();
        const info = await AdsConsent.gatherConsent();
        lastCanRequestAds = !!info.canRequestAds;
      } catch (e) {
        try {
          const { AdsConsent } = loadModule();
          const info = await AdsConsent.getConsentInfo();
          lastCanRequestAds = !!info.canRequestAds;
        } catch (e2) {
          lastCanRequestAds = false;
        }
      }
      return lastCanRequestAds;
    })();
  }
  return consentPromise;
}

// Son bilinen durum: reklam istenebilir mi? (gatherAdsConsent bitmeden false)
export function canRequestAds() {
  return lastCanRequestAds;
}

// Ayarlar ekranından "Reklam gizlilik seçenekleri" için (AB kullanıcıları
// onayını değiştirebilmeli). Henüz hiçbir ekrana bağlı değil.
export async function isPrivacyOptionsRequired() {
  if (isRunningInExpoGo()) return false;
  try {
    const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = loadModule();
    const info = await AdsConsent.getConsentInfo();
    return info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch (e) {
    return false;
  }
}

export async function showPrivacyOptions() {
  if (isRunningInExpoGo()) return false;
  try {
    const { AdsConsent } = loadModule();
    const info = await AdsConsent.showPrivacyOptionsForm();
    lastCanRequestAds = !!info.canRequestAds;
    return lastCanRequestAds;
  } catch (e) {
    return lastCanRequestAds;
  }
}
