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
  // Amber identity (shared with the Home "Kadran" dial): darkened from the
  // dial's #F2A64B so accent-as-text still clears WCAG AA (>=4.5:1) on our
  // light backgrounds. accent on bg #faf8f3 = 5.37:1, on surface #ffffff =
  // 5.70:1, on inputBg #f1eee5 = 4.92:1. onAccent white on accent = 5.70:1
  // (dark text on accent only manages ~3.0:1, so white wins here).
  accent: '#A34F0E',
  accentSoft: '#F3D9AE',
  accentSofter: '#FBEDD6',
  accentText: '#7A3D0E',
  danger: '#c62828',
  overlay: 'rgba(15, 23, 42, 0.06)',
  onAccent: '#FFFFFF',
  onDanger: '#ffffff',
  shadow: '#1f2a22',
  // Warm cream -> light amber wash (replaces the old sage/sky gradient) — kept
  // subtle, just enough texture behind the glass cards.
  gradientFrom: '#FDECD3',
  gradientTo: '#FBDCB0',
  glassBg: 'rgba(255, 250, 240, 0.55)',
  glassBorder: 'rgba(255, 224, 178, 0.6)',
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
  // Same amber identity as the Home "Kadran" dial — this IS the dial's
  // #F2A64B now that the dial follows the shared theme instead of a fixed
  // palette. accent on bg #0c1310 = 9.26:1, on surface #16201b = 8.22:1.
  // onAccent dark text on accent = 8.32:1 (white on accent only ~2.0:1, so
  // dark wins here — opposite of the light theme).
  accent: '#F2A64B',
  accentSoft: '#5C4423',
  accentSofter: '#3A2D18',
  accentText: '#F2A64B',
  danger: '#f87171',
  overlay: 'rgba(0, 0, 0, 0.3)',
  onAccent: '#1B1D1F',
  onDanger: '#3b0a0a',
  shadow: '#000000',
  // Very subtle warm-dark gradient (barely lighter than bg) + a light frost
  // overlay so glass cards still read against the near-black background.
  gradientFrom: '#241C10',
  gradientTo: '#2E2312',
  glassBg: 'rgba(255, 214, 170, 0.06)',
  glassBorder: 'rgba(255, 200, 140, 0.14)',
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
