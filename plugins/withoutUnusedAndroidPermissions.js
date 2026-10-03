const { withAndroidManifest } = require('expo/config-plugins');

// Expo'nun "bare minimum" şablonu (@expo/config-plugins/build/plugins/withAndroidBaseMods.js,
// getAndroidManifestTemplate) HER yeni Expo projesine, hiçbir bağımlılık istemese bile,
// şu üç izni "OPTIONAL PERMISSIONS, REMOVE WHATEVER YOU DO NOT NEED" yorumuyla varsayılan
// olarak ekliyor. Biz hiçbirini kullanmıyoruz:
//   - SYSTEM_ALERT_WINDOW: "diğer uygulamaların üzerine çiz" — overlay/floating view
//     özelliğimiz yok. Play Store incelemesinde gerekçe istenen hassas izinlerden biri.
//   - READ/WRITE_EXTERNAL_STORAGE: dosya seçici veya harici depolama erişimi yok (ses
//     dosyalarımız APK içinde paketli asset, harici depolamaya dokunmuyor).
// VIBRATE kasıtlı olarak BIRAKILIYOR — expo-haptics onu kendi (gerçekten kullanılan)
// manifestinde zaten doğru şekilde talep ediyor, burada kaldırmak hiçbir şey değiştirmez.
const UNUSED_PERMISSIONS = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

function withoutUnusedAndroidPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = manifest['uses-permission'].filter((entry) => {
        const name = entry.$ && entry.$['android:name'];
        return !UNUSED_PERMISSIONS.includes(name);
      });
    }
    return config;
  });
}

module.exports = withoutUnusedAndroidPermissions;
