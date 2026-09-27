import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  bg: '#faf8f3',
  surface: '#ffffff',
  text: '#14201a',
  subtext: '#46524a',
  muted: '#5b6860',
  faint: '#67746c',
  border: '#e8e3d7',
  borderStrong: '#cfc9b9',
  inputBg: '#f1eee5',
  accent: '#15803d',
  accentSoft: '#86efac',
  accentSofter: '#dcfce7',
  accentText: '#14532d',
  danger: '#c62828',
  overlay: 'rgba(15, 23, 42, 0.06)',
  onAccent: '#ffffff',
  onDanger: '#ffffff',
  shadow: '#1f2a22',
  // 2026 wellness/habit refresh: soft sage-green -> sky-blue gradient + glass cards.
  gradientFrom: '#bfead2',
  gradientTo: '#bfe0f5',
  glassBg: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.7)',
};

export const darkColors = {
  bg: '#0c1310',
  surface: '#16201b',
  text: '#f1f5f2',
  subtext: '#cbd5cf',
  muted: '#a3b0a8',
  faint: '#8a9890',
  border: '#26332c',
  borderStrong: '#37463d',
  inputBg: '#1d2923',
  accent: '#22c55e',
  accentSoft: '#166534',
  accentSofter: '#14532d',
  accentText: '#bbf7d0',
  danger: '#f87171',
  overlay: 'rgba(0, 0, 0, 0.3)',
  onAccent: '#04210f',
  onDanger: '#3b0a0a',
  shadow: '#000000',
  // Darker, less saturated gradient + a light frost overlay so glass cards still
  // read against the near-black background.
  gradientFrom: '#12261d',
  gradientTo: '#102432',
  glassBg: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
};

// Shared corner-radius scale for the bento/glass card language. Not theme-dependent.
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
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
