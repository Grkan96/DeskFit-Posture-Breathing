import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

// Onboarding adımı için ortak iskelet: ilerleme çubuğu, geri/atla, başlık,
// içerik ve ana düğme. NameScreen ve OnboardingScreen aynı görünümü paylaşır.
// Görsel: 2026 wellness estetiği — sakin arka plan, yumuşak "halo" içinde
// büyük emoji dairesi, tek bento kart içinde başlık/alt başlık/içerik, zarif
// ilerleme çubuğu. Prop sözleşmesi (step, total, emoji, title, subtitle,
// onBack, onSkip, primaryLabel, onPrimary, primaryDisabled, secondaryLabel,
// onSecondary, children) aynen korunur.
export const ONBOARDING_TOTAL_STEPS = 5;

export default function OnboardingStep({
  step,
  total = ONBOARDING_TOTAL_STEPS,
  emoji,
  title,
  subtitle,
  onBack,
  onSkip,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  children,
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduceMotion(v))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Adım değişince yumuşak giriş; reduce-motion açıksa animasyon yok.
  useEffect(() => {
    if (reduceMotion) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [step, reduceMotion, fade]);

  function press(fn) {
    return () => {
      Haptics.selectionAsync().catch(() => {});
      fn?.();
    };
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        {onBack ? (
          <Pressable
            onPress={press(onBack)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('onboardingFlow.back')}
            style={({ pressed }) => [styles.topButton, pressed && styles.topButtonPressed]}
          >
            <Text style={styles.topButtonText}>{'‹ ' + t('onboardingFlow.back')}</Text>
          </Pressable>
        ) : (
          <View style={styles.topButton} />
        )}
        {onSkip ? (
          <Pressable
            onPress={press(onSkip)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('onboardingFlow.skip')}
            style={({ pressed }) => [styles.topButton, pressed && styles.topButtonPressed]}
          >
            <Text style={styles.topButtonText}>{t('onboardingFlow.skip')}</Text>
          </Pressable>
        ) : (
          <View style={styles.topButton} />
        )}
      </View>

      <View
        style={styles.progressTrack}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('onboardingFlow.stepOf', { current: step, total })}
        accessibilityValue={{ min: 1, max: total, now: step }}
      >
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, i < step && styles.segmentActive]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.card, { opacity: fade }]}>
          {emoji ? (
            <View style={styles.emojiWrap}>
              <View style={styles.emojiGlow} />
              <View style={styles.emojiCircle}>
                <Text style={styles.emoji}>{emoji}</Text>
              </View>
            </View>
          ) : null}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={press(onPrimary)}
          disabled={primaryDisabled}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          accessibilityState={{ disabled: primaryDisabled }}
          style={({ pressed }) => [
            styles.button,
            primaryDisabled && styles.buttonDisabled,
            pressed && !primaryDisabled && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{primaryLabel}</Text>
        </Pressable>
        {secondaryLabel ? (
          <Pressable
            onPress={press(onSecondary)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// Tek seçimli chip grubu (soru ekranı için).
export function OptionGroup({ label, options, value, onChange }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(opt.value);
              }}
              accessibilityRole="radio"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected, checked: selected }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors) {
  // lib/theme.js henüz yumuşak-cam (glass) / gradient token'larını
  // yayınlamamış olabilir (paralel bir ajan ekliyor) — bu isimleri güvenli
  // fallback ile tüket, theme.js dosyasının kendisine dokunma.
  const glassBg = colors.glassBg || colors.accentSofter;
  const glassBorder = colors.glassBorder || colors.border;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    topButton: {
      minWidth: 64,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    topButtonPressed: { backgroundColor: colors.overlay },
    topButtonText: { color: colors.subtext, fontSize: 15, fontWeight: '600' },
    // Zarif ilerleme çubuğu: ince, yuvarlak kapaklı, yumuşak dolgu rengi.
    progressTrack: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 32,
      marginTop: 6,
      marginBottom: 2,
    },
    segment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    segmentActive: { backgroundColor: colors.accent },
    content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    // Tüm adım içeriğini (emoji, başlık, alt başlık, form alanları) saran
    // tek bento kart: yumuşak gölge, yuvarlak köşe, ince kenarlık.
    card: {
      alignSelf: 'stretch',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: glassBorder,
      paddingHorizontal: 24,
      paddingVertical: 32,
      shadowColor: colors.shadow,
      shadowOpacity: 0.09,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    emojiWrap: {
      width: 148,
      height: 148,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
    },
    emojiGlow: {
      position: 'absolute',
      width: 148,
      height: 148,
      borderRadius: 74,
      backgroundColor: glassBg,
      opacity: 0.6,
    },
    emojiCircle: {
      width: 112,
      height: 112,
      borderRadius: 56,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSofter,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    emoji: { fontSize: 50 },
    title: {
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 10,
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 24,
    },
    footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 10 },
    button: {
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderRadius: 18,
      minHeight: 54,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    buttonDisabled: { backgroundColor: colors.borderStrong, opacity: 0.7, shadowOpacity: 0 },
    buttonPressed: { opacity: 0.85 },
    buttonText: { color: colors.onAccent, fontSize: 16, fontWeight: '700' },
    secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    secondaryText: { color: colors.subtext, fontSize: 15, fontWeight: '600' },
    group: { alignSelf: 'stretch', marginTop: 24 },
    groupLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      backgroundColor: colors.inputBg,
      justifyContent: 'center',
    },
    chipSelected: { backgroundColor: colors.accentSofter, borderColor: colors.accent },
    chipText: { fontSize: 15, color: colors.text, fontWeight: '600' },
    chipTextSelected: { color: colors.accentText },
  });
}
