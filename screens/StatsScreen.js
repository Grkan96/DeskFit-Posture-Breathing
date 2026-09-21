import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getStats, getLast7Days } from '../lib/stats';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { shareAchievement } from '../lib/sharing';

const BAR_MAX_HEIGHT = 90;

const TYPE_META = [
  { key: 'breathing', icon: '🌬️', labelKey: 'stats.typeBreathing' },
  { key: 'movements', icon: '🧘', labelKey: 'stats.typeMovements' },
  { key: 'exercises', icon: '💪', labelKey: 'stats.typeExercises' },
];

export default function StatsScreen({ onBack }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const weekdayLabels = t('stats.weekdays');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  if (!stats) {
    return <View style={styles.container} />;
  }

  const week = getLast7Days(stats.history);
  const maxCount = Math.max(1, ...week.map((d) => d.count));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
        <Text style={styles.backText}>{t('stats.backToMeditation')}</Text>
      </Pressable>

      <Text style={styles.header}>{t('stats.header')}</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>🔥 {stats.streak}</Text>
          <Text style={styles.summaryLabel}>{t('stats.streakLabel')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>✅ {stats.totalSessions}</Text>
          <Text style={styles.summaryLabel}>{t('stats.sessionsLabel')}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t('stats.weekSectionLabel')}</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartRow}>
          {week.map((day) => {
            const height = day.count === 0 ? 4 : Math.max(10, (day.count / maxCount) * BAR_MAX_HEIGHT);
            const isToday = day.date === week[week.length - 1].date;
            return (
              <View key={day.date} style={styles.barColumn}>
                <Text style={styles.barCount}>{day.count > 0 ? day.count : ''}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height },
                      day.count > 0 && styles.barFilled,
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                  {weekdayLabels[day.weekday]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t('stats.typeSectionLabel')}</Text>
      <View style={styles.typeList}>
        {TYPE_META.map((meta) => (
          <View key={meta.key} style={styles.typeRow}>
            <Text style={styles.typeIcon}>{meta.icon}</Text>
            <Text style={styles.typeLabel}>{t(meta.labelKey)}</Text>
            <Text style={styles.typeCount}>{stats.byType[meta.key] || 0}</Text>
          </View>
        ))}
      </View>

      {stats.totalSessions > 0 && (
        <Pressable
          onPress={() => shareAchievement({ streak: stats.streak, totalSessions: stats.totalSessions })}
          style={styles.shareButton}
        >
          <Text style={styles.shareButtonText}>{t('stats.shareButton')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 32,
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    backText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
    header: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    summaryLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      color: colors.faint,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingTop: 20,
      paddingBottom: 12,
      marginBottom: 24,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    chartRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    barColumn: {
      alignItems: 'center',
      flex: 1,
    },
    barCount: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      height: 14,
    },
    barTrack: {
      width: 18,
      height: BAR_MAX_HEIGHT,
      justifyContent: 'flex-end',
    },
    bar: {
      width: 18,
      borderRadius: 6,
      backgroundColor: colors.border,
    },
    barFilled: {
      backgroundColor: colors.accent,
    },
    barLabel: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: '600',
      color: colors.faint,
    },
    barLabelToday: {
      color: colors.accent,
    },
    typeList: {
      gap: 10,
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    typeIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    typeLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    typeCount: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.accent,
    },
    shareButton: {
      marginTop: 20,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    shareButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
}
