import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr } from './locales/tr';
import { en } from './locales/en';

const LOCALE_KEY = 'durus-hatirlatici/locale';
const DEFAULT_LOCALE = 'tr';
const DICTIONARIES = { tr, en };

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

// React bileşeni olmayan modüller (lib/notifications.js, lib/sharing.js gibi)
// useTranslation() hook'unu kullanamaz. Bu modül seviyesindeki değişken,
// LocaleProvider tarafından güncel tutulur ve translate() ile her yerden
// senkron olarak okunabilir.
let activeLocale = DEFAULT_LOCALE;

export function translate(key, vars) {
  const value =
    lookup(DICTIONARIES[activeLocale], key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key);
  return interpolate(value ?? key, vars);
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY)
      .then((saved) => {
        if (saved === 'tr' || saved === 'en') setLocaleState(saved);
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
  // önce Türkçe sözlüğe, sonra anahtarın kendisine düşer — uygulama asla
  // boş/kırık metinle kalmaz.
  function t(key, vars) {
    const value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key);
    return interpolate(value ?? key, vars);
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
