import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr } from './locales/tr';
import { en } from './locales/en';
import { es } from './locales/es';
import { de } from './locales/de';
import { fr } from './locales/fr';
import { pt } from './locales/pt';

const LOCALE_KEY = 'durus-hatirlatici/locale';
const DEFAULT_LOCALE = 'tr';
const DICTIONARIES = { tr, en, es, de, fr, pt };

// Dil seçim ekranlarında her dil kendi adıyla gösterilir.
export const LANGUAGES = [
  { code: 'tr', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'pt', nativeName: 'Português', flag: '🇧🇷' },
];

const SUPPORTED = LANGUAGES.map((l) => l.code);

function isSupported(code) {
  return SUPPORTED.includes(code);
}

// Cihazın dil ayarını (örn. "tr-TR") desteklenen bir koda çevirir; desteklenmiyorsa null.
export function detectDeviceLocale() {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale || '';
    const base = tag.toLowerCase().split(/[-_]/)[0];
    return isSupported(base) ? base : null;
  } catch (e) {
    return null;
  }
}

const LocaleContext = createContext(null);

function lookup(dict, key) {
  let value = dict;
  for (const part of key.split('.')) {
    value = value?.[part];
    if (value === undefined) return undefined;
  }
  return value;
}

function interpolate(value, vars) {
  if (typeof value !== 'string' || !vars) return value;
  return Object.keys(vars).reduce(
    (str, k) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]),
    value
  );
}

// Anahtar seçili dilde yoksa önce İngilizceye, sonra Türkçeye, en son anahtarın
// kendisine düşer — uygulama asla boş/kırık metinle kalmaz.
function resolve(locale, key, vars) {
  const value =
    lookup(DICTIONARIES[locale], key) ??
    lookup(DICTIONARIES.en, key) ??
    lookup(DICTIONARIES[DEFAULT_LOCALE], key);
  return interpolate(value ?? key, vars);
}

// React bileşeni olmayan modüller (lib/notifications.js, lib/sharing.js gibi)
// useTranslation() hook'unu kullanamaz. Bu modül seviyesindeki değişken,
// LocaleProvider tarafından güncel tutulur ve translate() ile her yerden
// senkron olarak okunabilir.
let activeLocale = DEFAULT_LOCALE;

export function translate(key, vars) {
  return resolve(activeLocale, key, vars);
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  // localeReady: kayıtlı dil okundu mu? localeChosen: kullanıcı daha önce bir
  // dil seçti mi? (İlk açılışta dil seçim ekranını göstermek için.)
  const [localeReady, setLocaleReady] = useState(false);
  const [localeChosen, setLocaleChosen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY)
      .then((saved) => {
        if (isSupported(saved)) {
          activeLocale = saved;
          setLocaleState(saved);
          setLocaleChosen(true);
        }
      })
      .catch(() => {})
      .then(() => setLocaleReady(true));
  }, []);

  // Seçimi kalıcı yapar ve "dil seçildi" olarak işaretler.
  function setLocale(next) {
    if (!isSupported(next)) return;
    activeLocale = next;
    setLocaleState(next);
    setLocaleChosen(true);
    AsyncStorage.setItem(LOCALE_KEY, next).catch(() => {});
  }

  // Kaydetmeden yalnızca ekranı o dile çevirir (dil seçim ekranında canlı önizleme).
  function previewLocale(next) {
    if (!isSupported(next)) return;
    activeLocale = next;
    setLocaleState(next);
  }

  function t(key, vars) {
    return resolve(locale, key, vars);
  }

  const value = useMemo(
    () => ({ locale, setLocale, previewLocale, localeReady, localeChosen, t }),
    [locale, localeReady, localeChosen]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Provider bir sebeple bulunamazsa uygulama Türkçe ile çalışmaya devam eder.
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      previewLocale: () => {},
      localeReady: true,
      localeChosen: true,
      t: (key, vars) => resolve(DEFAULT_LOCALE, key, vars),
    };
  }
  return ctx;
}
