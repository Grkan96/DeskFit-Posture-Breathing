import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import TimeSlider from '../components/TimeSlider';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const INTERVALS = [15, 30, 45, 60];
const MIN_MINUTES = 1;
const MAX_CUSTOM_MINUTES = 600;
const BUTTON_SIZE = 152;

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatCountdown(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Yaklaşık geri sayım: çalışma başladığında (veya aralık değiştiğinde) sıfırlanır.
function useCountdown(isRunning, intervalMinutes) {
  const [remaining, setRemaining] = useState(intervalMinutes * 60);
  useEffect(() => {
    if (!isRunning) return undefined;
    const period = intervalMinutes * 60;
    const startedAt = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(period - (elapsed % period));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRunning, intervalMinutes]);
  return remaining;
}

export default function HomeScreen({
  userName,
  isRunning,
  intervalMinutes,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  todayReminderCount,
  onStartStop,
  onIntervalCommit,
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [customText, setCustomText] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const remaining = useCountdown(isRunning, intervalMinutes);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduceMotion(v))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Çalışırken "nefes alan" halka animasyonu.
  useEffect(() => {
    if (!isRunning || reduceMotion) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [isRunning, reduceMotion, pulse]);

  function commitCustom() {
    const parsed = parseInt(customText, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(MAX_CUSTOM_MINUTES, Math.max(MIN_MINUTES, parsed));
      onIntervalCommit(clamped);
    }
    setCustomText('');
  }

  function handleMainPress() {
    Haptics.impactAsync(
      isRunning ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy
    ).catch(() => {});
    onStartStop();
  }

  const ringColor = isRunning ? colors.danger : colors.accent;
  const ringStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
  };
  const progress = Math.min(1, Math.max(0, 1 - remaining / (intervalMinutes * 60)));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.greeting} accessibilityRole="header">
        {t('home.greeting', { name: userName })}
      </Text>
      <Text style={styles.subtitle}>
        {isRunning
          ? t('home.statusActive', { minutes: intervalMinutes }) +
            (quietHoursEnabled
              ? t('home.quietSuffix', { start: formatHour(quietStart), end: formatHour(quietEnd) })
              : '')
          : t('home.statusInactive')}
      </Text>
      {todayReminderCount > 0 && (
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>
            {t('home.reminderCount', { count: todayReminderCount })}
          </Text>
        </View>
      )}

      <View style={styles.buttonWrap}>
        {isRunning && !reduceMotion && (
          <Animated.View
            pointerEvents="none"
            style={[styles.ring, { backgroundColor: ringColor }, ringStyle]}
          />
        )}
        <Pressable
          onPress={handleMainPress}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? t('home.stop') : t('home.start')}
          accessibilityHint={isRunning ? t('home.stopHint') : t('home.startHint')}
          style={({ pressed }) => [
            styles.mainButton,
            isRunning ? styles.mainButtonStop : styles.mainButtonStart,
            pressed && styles.mainButtonPressed,
          ]}
        >
          <Text style={[styles.mainButtonText, isRunning && styles.mainButtonTextStop]}>
            {isRunning ? t('home.stop') : t('home.start')}
          </Text>
        </Pressable>
      </View>

      {isRunning && (
        <View
          style={styles.countdownCard}
          accessible
          accessibilityLabel={`${t('home.nextReminderLabel')}: ${formatCountdown(remaining)}`}
        >
          <Text style={styles.countdownLabel}>
            {t('home.nextIn', { time: '' }).trim()}
          </Text>
          <Text style={styles.countdownValue}>{formatCountdown(remaining)}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>{t('home.intervalSectionLabel')}</Text>
      <View style={styles.intervalRow}>
        {INTERVALS.map((minutes) => {
          const selected = minutes === intervalMinutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onIntervalCommit(minutes);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t('home.minutesLabel', { minutes })}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipValue, selected && styles.chipValueSelected]}>
                {minutes}
              </Text>
              <Text style={[styles.chipUnit, selected && styles.chipUnitSelected]}>
                {t('home.minuteUnit')}
              </Text>
            </Pressable>
          );
        })}
        <TextInput
          value={customText}
          onChangeText={(txt) => setCustomText(txt.replace(/[^0-9]/g, ''))}
          onSubmitEditing={commitCustom}
          onBlur={() => customText && commitCustom()}
          placeholder={t('home.customPlaceholder')}
          placeholderTextColor={colors.faint}
          keyboardType="number-pad"
          returnKeyType="done"
          accessibilityLabel={t('home.customInputLabel')}
          style={styles.customChip}
        />
      </View>

      <TimeSlider minutes={intervalMinutes} onChange={onIntervalCommit} />
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    container: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
    },
    greeting: {
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: colors.text,
    },
    subtitle: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
      color: colors.subtext,
      textAlign: 'center',
    },
    countPill: {
      marginTop: 10,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.accentSofter,
    },
    countPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accentText,
    },
    buttonWrap: {
      marginTop: 28,
      marginBottom: 28,
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
    },
    mainButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    mainButtonStart: {
      backgroundColor: colors.accent,
    },
    mainButtonStop: {
      backgroundColor: colors.danger,
    },
    mainButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.95 }],
    },
    mainButtonText: {
      color: colors.onAccent,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    mainButtonTextStop: {
      color: colors.onDanger,
    },
    countdownCard: {
      alignSelf: 'stretch',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    countdownLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
    },
    countdownValue: {
      marginTop: 2,
      fontSize: 38,
      fontWeight: '800',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    progressTrack: {
      alignSelf: 'stretch',
      height: 6,
      marginTop: 10,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: colors.inputBg,
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    sectionLabel: {
      alignSelf: 'flex-start',
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    intervalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 20,
    },
    chip: {
      flexDirection: 'row',
      gap: 3,
      minHeight: 48,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 999,
      minWidth: 64,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      elevation: 3,
      shadowColor: colors.accent,
      shadowOpacity: 0.35,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
    chipPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.96 }],
    },
    chipValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    chipValueSelected: {
      color: colors.onAccent,
    },
    chipUnit: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    chipUnitSelected: {
      color: colors.onAccent,
    },
    customChip: {
      minHeight: 48,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 999,
      minWidth: 72,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      borderStyle: 'dashed',
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
}
