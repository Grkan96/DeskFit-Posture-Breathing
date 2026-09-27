// Saf veri (RN/AsyncStorage import yok — node ile test edilebilir).
// Ergonomi ipuçları meta verisi; görsel metinler (title/body) lib/locales
// içindeki ergonomicsTips.items.<id> anahtarlarında tutulur — movements/exercises
// ile aynı desen (bkz. lib/sessionContent.js MOVEMENT_META/EXERCISE_META).
// `icon`, components/TipIcon.js'in çizeceği basit inline SVG şeklini seçen bir
// anahtar kelimedir (yeni bir görsel dosya EKLENMEZ).

export const ERGONOMICS_TIPS = [
  { id: 'screen-distance', icon: 'monitor' },
  { id: 'elbow-angle', icon: 'elbow' },
  { id: 'feet-flat', icon: 'feet' },
  { id: 'lumbar-support', icon: 'chair' },
  { id: 'eye-2020', icon: 'eye' },
  { id: 'keyboard-mouse', icon: 'keyboard' },
  { id: 'screen-brightness', icon: 'brightness' },
  { id: 'move-often', icon: 'walk' },
  { id: 'standing-desk', icon: 'standing-desk' },
  { id: 'bag-carry', icon: 'bag' },
];
