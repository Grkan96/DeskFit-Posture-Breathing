import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import TimeSlider from '../components/TimeSlider';
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

  return (
    <View style={styles.container}>
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
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 16,
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
      marginTop: 20,
      marginBottom: 20,
      width: 140,
      height: 140,
      borderRadius: 70,
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
