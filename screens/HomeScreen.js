import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import TimeSlider from '../components/TimeSlider';
import GoalRing from '../components/GoalRing';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const INTERVALS = [15, 30, 45, 60];
const MIN_MINUTES = 1;
const MAX_CUSTOM_MINUTES = 600;

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function HomeScreen({
  userName,
  isRunning,
  intervalMinutes,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  todayReminderCount,
  checkinCount = 0,
  dailyGoal = 8,
  checkinStreak = 0,
  onCheckin,
  onStartStop,
  onIntervalCommit,
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [customText, setCustomText] = useState('');

  function commitCustom() {
    const parsed = parseInt(customText, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(MAX_CUSTOM_MINUTES, Math.max(MIN_MINUTES, parsed));
      onIntervalCommit(clamped);
    }
    setCustomText('');
  }

  const goalMet = checkinCount >= dailyGoal;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.greeting}>{t('home.greeting', { name: userName })}</Text>
      <Text style={styles.subtitle}>
        {isRunning
          ? t('home.statusActive', { minutes: intervalMinutes }) +
            (quietHoursEnabled
              ? t('home.quietSuffix', { start: formatHour(quietStart), end: formatHour(quietEnd) })
              : '')
          : t('home.statusInactive')}
      </Text>
      {todayReminderCount > 0 && (
        <Text style={styles.reminderCount}>
          {t('home.reminderCount', { count: todayReminderCount })}
        </Text>
      )}

      {/* Günlük hedef halkası + Başlat/Durdur butonu yan yana */}
      <View style={styles.heroRow}>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('checkin.ringAccessibilityLabel', {
            count: checkinCount,
            goal: dailyGoal,
          })}
        >
          <GoalRing progress={dailyGoal > 0 ? checkinCount / dailyGoal : 0} size={132} thickness={11}>
            <Text style={styles.ringValue}>
              {checkinCount}/{dailyGoal}
            </Text>
            <Text style={styles.ringLabel}>{goalMet ? t('checkin.ringDone') : t('checkin.ringLabel')}</Text>
          </GoalRing>
        </View>

        <Pressable
          onPress={onStartStop}
          style={({ pressed }) => [
            styles.mainButton,
            isRunning ? styles.mainButtonStop : styles.mainButtonStart,
            pressed && styles.mainButtonPressed,
          ]}
        >
          <Text style={styles.mainButtonText}>{isRunning ? t('home.stop') : t('home.start')}</Text>
        </Pressable>
      </View>

      <Text style={styles.streakText}>
        {checkinStreak > 0
          ? t('checkin.streak', { count: checkinStreak })
          : t('checkin.streakEmpty')}
      </Text>

      <Pressable
        onPress={onCheckin}
        accessibilityRole="button"
        accessibilityLabel={t('checkin.button')}
        style={({ pressed }) => [styles.checkinButton, pressed && styles.checkinButtonPressed]}
      >
        <Text style={styles.checkinButtonText}>{t('checkin.button')}</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>{t('home.intervalSectionLabel')}</Text>
      <View style={styles.intervalRow}>
        {INTERVALS.map((minutes) => {
          const selected = minutes === intervalMinutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => onIntervalCommit(minutes)}
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
    heroRow: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    },
    ringValue: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
    },
    ringLabel: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    streakText: {
      marginTop: 12,
      fontSize: 13,
      fontWeight: '700',
      color: colors.subtext,
    },
    checkinButton: {
      marginTop: 12,
      marginBottom: 20,
      alignSelf: 'stretch',
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.accentSofter,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
    },
    checkinButtonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    checkinButtonText: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.accentText,
    },
    greeting: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.subtext,
      textAlign: 'center',
    },
    reminderCount: {
      marginTop: 6,
      fontSize: 12,
      fontWeight: '600',
      color: colors.accent,
    },
    mainButton: {
      width: 116,
      height: 116,
      borderRadius: 58,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    mainButtonStart: {
      backgroundColor: colors.accent,
    },
    mainButtonStop: {
      backgroundColor: colors.danger,
    },
    mainButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    mainButtonText: {
      color: '#ffffff',
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    sectionLabel: {
      alignSelf: 'flex-start',
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 8,
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
      alignItems: 'baseline',
      gap: 3,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 999,
      minWidth: 62,
      justifyContent: 'center',
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
      color: '#ffffff',
    },
    chipUnit: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.faint,
    },
    chipUnitSelected: {
      color: 'rgba(255, 255, 255, 0.8)',
    },
    customChip: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 999,
      minWidth: 62,
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
