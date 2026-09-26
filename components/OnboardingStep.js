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
            style={styles.topButton}
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
            style={styles.topButton}
          >
            <Text style={styles.topButtonText}>{t('onboardingFlow.skip')}</Text>
          </Pressable>
        ) : (
          <View style={styles.topButton} />
        )}
      </View>

      <View
        style={styles.progress}
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
        <Animated.View style={[styles.body, { opacity: fade }]}>
          {emoji ? (
            <View style={styles.emojiCircle} accessible={false} importantForAccessibility="no-hide-descendants">
              <Text style={styles.emoji}>{emoji}</Text>
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
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    topButton: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
    topButtonText: { color: colors.subtext, fontSize: 15, fontWeight: '600' },
    progress: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 32,
      marginTop: 4,
    },
    segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
    segmentActive: { backgroundColor: colors.accent },
    content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 16 },
    body: { alignItems: 'center' },
    emojiCircle: {
      width: 112,
      height: 112,
      borderRadius: 56,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
      backgroundColor: colors.accentSofter,
    },
    emoji: { fontSize: 54 },
    title: {
      fontSize: 26,
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
    footer: { paddingHorizontal: 32, paddingBottom: 28, paddingTop: 8 },
    button: {
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderRadius: 16,
      minHeight: 52,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: { backgroundColor: colors.borderStrong, opacity: 0.7 },
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
      backgroundColor: colors.surface,
      justifyContent: 'center',
    },
    chipSelected: { backgroundColor: colors.accentSofter, borderColor: colors.accent },
    chipText: { fontSize: 15, color: colors.text, fontWeight: '600' },
    chipTextSelected: { color: colors.accentText },
  });
}
