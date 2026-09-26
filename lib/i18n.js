import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { tr } from './locales/tr';
import { en } from './locales/en';
import { es } from './locales/es';
import { de } from './locales/de';
import { pt } from './locales/pt';

const LOCALE_KEY = 'durus-hatirlatici/locale';
// Cihaz dili desteklenmiyorsa uygulama İngilizce açılır.
const FALLBACK_LOCALE = 'en';
const DICTIONARIES = { tr, en, es, de, pt };
export const SUPPORTED_LOCALES = Object.keys(DICTIONARIES);

const LocaleContext = createContext(null);

function isSupported(code) {
  return typeof code === 'string' && SUPPORTED_LOCALES.includes(code);
}

// Cihazın dil tercihleri sırasıyla gezilir; desteklenen ilk dil seçilir.
// getLocales() senkron olduğu için ilk render'da doğru dil kullanılır ve
// "yanlış dilde bir an görünme" (flash) yaşanmaz.
function detectDeviceLocale() {
  try {
    const locales = Localization.getLocales() || [];
    for (const l of locales) {
      const code = l?.languageCode?.toLowerCase();
      if (isSupported(code)) return code;
    }
  } catch (e) {
    // Native modül bir sebeple okunamazsa varsayılana düş.
  }
  return FALLBACK_LOCALE;
}

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

// Eksik anahtar için yedek sözlük: Türkçe için Türkçe, diğer tüm diller
// için İngilizce.
function resolve(locale, key, vars) {
  const fallback = locale === 'tr' ? 'tr' : FALLBACK_LOCALE;
  const value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES[fallback], key);
  return interpolate(value ?? key, vars);
}

// React bileşeni olmayan modüller (lib/notifications.js, lib/sharing.js gibi)
// useTranslation() hook'unu kullanamaz. Bu modül seviyesindeki değişken,
// LocaleProvider tarafından güncel tutulur ve translate() ile her yerden
// senkron olarak okunabilir.
let activeLocale = detectDeviceLocale();

export function translate(key, vars) {
  return resolve(activeLocale, key, vars);
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(activeLocale);

  useEffect(() => {
    // Kullanıcının kaydettiği seçim her zaman cihaz dilinden önce gelir.
    AsyncStorage.getItem(LOCALE_KEY)
      .then((saved) => {
        if (isSupported(saved)) {
          activeLocale = saved;
          setLocaleState(saved);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    activeLocale = locale;
  }, [locale]);

  function setLocale(next) {
    if (!isSupported(next)) return;
    // translate() kullanan modüller (bildirimler) yeni dili hemen görsün diye
    // modül değişkeni effect'i beklemeden güncellenir.
    activeLocale = next;
    setLocaleState(next);
    AsyncStorage.setItem(LOCALE_KEY, next).catch(() => {});
  }

  // `key` dot.separated bir yol olabilir (örn. "home.greeting"). Bulunamazsa
  // önce yedek sözlüğe (tr için Türkçe, diğerleri için İngilizce), sonra
  // anahtarın kendisine düşer — uygulama asla boş/kırık metinle kalmaz.
  function t(key, vars) {
    return resolve(locale, key, vars);
  }

  const value = useMemo(() => ({ locale, setLocale, t }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Provider bir sebeple bulunamazsa uygulama algılanan dille çalışmaya devam eder.
    return {
      locale: activeLocale,
      setLocale: () => {},
      t: (key, vars) => resolve(activeLocale, key, vars),
    };
  }
  return ctx;
}
