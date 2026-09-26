import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr } from './locales/tr';
import { en } from './locales/en';
import { es } from './locales/es';
import { de } from './locales/de';
import { pt } from './locales/pt';
import { fr } from './locales/fr';
import { ru } from './locales/ru';
import { hi } from './locales/hi';
import { id } from './locales/id';

const LOCALE_KEY = 'durus-hatirlatici/locale';
const DEFAULT_LOCALE = 'tr';
const FALLBACK_LOCALE = 'en';
// Arapça (ar) bilinçli olarak yok: RTL için I18nManager.forceRTL + uygulamanın
// yeniden başlatılması gerekir; Expo Go'da güvenilir değil.
const DICTIONARIES = { tr, en, es, de, pt, fr, ru, hi, id };

export const SUPPORTED_LOCALES = Object.keys(DICTIONARIES);

// Cihaz dilini (expo-localization eklemeden) algılar; desteklenmiyorsa İngilizce.
function detectDeviceLocale() {
  try {
    let tag = Intl.DateTimeFormat().resolvedOptions().locale;
    if (!tag) tag = I18nManager.getConstants?.().localeIdentifier;
    const lang = String(tag || '').split(/[-_]/)[0].toLowerCase();
    // Eski Android Endonezce kodu 'in' → 'id'
    const normalized = lang === 'in' ? 'id' : lang;
    if (DICTIONARIES[normalized]) return normalized;
  } catch {}
  return FALLBACK_LOCALE;
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

// Eksik anahtar: önce seçili dil, sonra İngilizce, sonra Türkçe.
function resolve(locale, key) {
  return (
    lookup(DICTIONARIES[locale], key) ??
    lookup(DICTIONARIES[FALLBACK_LOCALE], key) ??
    lookup(DICTIONARIES[DEFAULT_LOCALE], key)
  );
}

const INITIAL_LOCALE = detectDeviceLocale();

// React bileşeni olmayan modüller (lib/notifications.js, lib/sharing.js gibi)
// useTranslation() hook'unu kullanamaz. Bu modül seviyesindeki değişken,
// LocaleProvider tarafından güncel tutulur ve translate() ile her yerden
// senkron olarak okunabilir.
let activeLocale = INITIAL_LOCALE;

export function translate(key, vars) {
  return interpolate(resolve(activeLocale, key) ?? key, vars);
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(INITIAL_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY)
      .then((saved) => {
        if (saved && DICTIONARIES[saved]) setLocaleState(saved);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    activeLocale = locale;
  }, [locale]);

  function setLocale(next) {
    setLocaleState(next);
    AsyncStorage.setItem(LOCALE_KEY, next).catch(() => {});
  }

  // `key` dot.separated bir yol olabilir (örn. "home.greeting"). Bulunamazsa
  // önce İngilizce, sonra Türkçe sözlüğe, sonra anahtarın kendisine düşer —
  // uygulama asla boş/kırık metinle kalmaz.
  function t(key, vars) {
    return interpolate(resolve(locale, key) ?? key, vars);
  }

  const value = useMemo(() => ({ locale, setLocale, t }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Provider bir sebeple bulunamazsa uygulama Türkçe ile çalışmaya devam eder.
    return { locale: DEFAULT_LOCALE, setLocale: () => {}, t: (key) => key };
  }
  return ctx;
}
