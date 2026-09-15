import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  subtext: '#475569',
  muted: '#64748b',
  faint: '#94a3b8',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  inputBg: '#f1f5f9',
  accent: '#16a34a',
  accentSoft: '#86efac',
  accentSofter: '#bbf7d0',
  accentText: '#14532d',
  danger: '#dc2626',
  overlay: 'rgba(15, 23, 42, 0.06)',
};

export const darkColors = {
  bg: '#0b1220',
  surface: '#151f2e',
  text: '#f1f5f9',
  subtext: '#cbd5e1',
  muted: '#94a3b8',
  faint: '#64748b',
  border: '#243044',
  borderStrong: '#334155',
  inputBg: '#1e293b',
  accent: '#22c55e',
  accentSoft: '#166534',
  accentSofter: '#14532d',
  accentText: '#bbf7d0',
  danger: '#ef4444',
  overlay: 'rgba(0, 0, 0, 0.3)',
};

const THEME_PREFERENCE_KEY = 'durus-hatirlatici/theme-preference';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreferenceState(saved);
        }
      })
      .catch(() => {});
  }, []);

  function setPreference(next) {
    setPreferenceState(next);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, next).catch(() => {});
  }

  const scheme = preference === 'system' ? systemScheme : preference;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({ colors, scheme, preference, setPreference }),
    [colors, scheme, preference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors() {
  const ctx = useContext(ThemeContext);
  return ctx ? ctx.colors : lightColors;
}

// Ayarlar ekranındaki Açık/Koyu/Sistem seçici için: [preference, setPreference].
export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return ['system', () => {}];
  return [ctx.preference, ctx.setPreference];
}
