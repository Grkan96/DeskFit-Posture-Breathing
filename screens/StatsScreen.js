import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getStats, getLast7Days } from '../lib/stats';
import { getReminderActivity, reconcileDeliveredReminders } from '../lib/reminderLog';
import { lastNDays, todayCounts } from '../lib/activityLogic';
import { subscribeStatsChanged } from '../lib/statsEvents';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { shareAchievement } from '../lib/sharing';

const BAR_MAX_HEIGHT = 90;

const SESSION_TYPES = [
  { key: 'breathing', icon: '🌬️', labelKey: 'stats.typeBreathing' },
  { key: 'movements', icon: '🧘', labelKey: 'stats.typeMovements' },
  { key: 'exercises', icon: '💪', labelKey: 'stats.typeExercises' },
];

const METRICS = [
  { key: 'sessions', labelKey: 'stats.metricSessions' },
  { key: 'reminders', labelKey: 'stats.metricReminders' },
];

// `onBack` verilirse (Meditasyon içinden açıldığında) geri butonu gösterilir;
// alt sekme olarak açıldığında verilmez.
export default function StatsScreen({ onBack }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const weekdayLabels = t('stats.weekdays');
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [metric, setMetric] = useState('sessions');

  const load = useCallback(async () => {
    // Zamanı gelmiş hatırlatmalar önce teslim edilmiş sayılır, sonra okunur.
    await reconcileDeliveredReminders();
    const [nextStats, nextActivity] = await Promise.all([getStats(), getReminderActivity()]);
    setStats(nextStats);
    setActivity(nextActivity);
  }, []);

  // Canlı güncelleme: ekran açılınca, seans/hatırlatma kaydı değişince ve
  // uygulama arka plandan dönünce veriler yeniden okunur.
  useEffect(() => {
    load();
    const unsubscribe = subscribeStatsChanged(load);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, [load]);

  if (!stats || !activity) {
    return <View style={styles.container} />;
  }

  const now = Date.now();
  const today = todayCounts(activity, now);
  const todaySessions = getLast7Days(stats.history)[6].count;
  const sessionWeek = getLast7Days(stats.history);
  const reminderWeek = lastNDays(activity.daily, 7, now);
  const week = sessionWeek.map((day, i) => ({
    date: day.date,
    weekday: day.weekday,
    count: metric === 'sessions' ? day.count : reminderWeek[i].posture + reminderWeek[i].eyeRest,
  }));
  const maxCount = Math.max(1, ...week.map((d) => d.count));
  const hasAnyActivity =
    stats.totalSessions > 0 ||
    activity.totals.posture + activity.totals.eyeRest + activity.totals.done > 0;

  const reminderRows = [
    { key: 'posture', icon: '🪑', labelKey: 'stats.typePosture', value: activity.totals.posture },
    { key: 'eyeRest', icon: '👀', labelKey: 'stats.typeEyeRest', value: activity.totals.eyeRest },
    { key: 'done', icon: '✅', labelKey: 'stats.typeDone', value: activity.totals.done },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Text style={styles.backText}>{t('stats.backToMeditation')}</Text>
        </Pressable>
      )}

      <Text style={styles.header}>{t('stats.header')}</Text>

      {!hasAnyActivity && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>{t('stats.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('stats.emptyBody')}</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>{t('stats.todaySectionLabel')}</Text>
      <View style={styles.todayCard}>
        <View style={styles.todayItem}>
          <Text style={styles.todayValue}>{today.posture + today.eyeRest}</Text>
          <Text style={styles.todayLabel}>{t('stats.todayReminders')}</Text>
        </View>
        <View style={styles.todayDivider} />
        <View style={styles.todayItem}>
          <Text style={styles.todayValue}>{today.done}</Text>
          <Text style={styles.todayLabel}>{t('stats.todayDone')}</Text>
        </View>
        <View style={styles.todayDivider} />
        <View style={styles.todayItem}>
          <Text style={styles.todayValue}>{todaySessions}</Text>
          <Text style={styles.todayLabel}>{t('stats.todaySessions')}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>🔥 {stats.streak}</Text>
          <Text style={styles.summaryLabel}>{t('stats.streakLabel')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>🏆 {stats.bestStreak}</Text>
          <Text style={styles.summaryLabel}>{t('stats.bestStreakLabel')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>✅ {stats.totalSessions}</Text>
          <Text style={styles.summaryLabel}>{t('stats.sessionsLabel')}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t('stats.weekSectionLabel')}</Text>
      <View style={styles.chartCard}>
        <View style={styles.metricRow}>
          {METRICS.map((option) => {
            const selected = option.key === metric;
            return (
              <Pressable
                key={option.key}
                onPress={() => setMetric(option.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.metricChip, selected && styles.metricChipSelected]}
              >
                <Text style={[styles.metricText, selected && styles.metricTextSelected]}>
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
        {SESSION_TYPES.map((meta) => (
          <View key={meta.key} style={styles.typeRow}>
            <Text style={styles.typeIcon}>{meta.icon}</Text>
            <Text style={styles.typeLabel}>{t(meta.labelKey)}</Text>
            <Text style={styles.typeCount}>{stats.byType[meta.key] || 0}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
        {t('stats.reminderSectionLabel')}
      </Text>
      <View style={styles.typeList}>
        {reminderRows.map((row) => (
          <View key={row.key} style={styles.typeRow}>
            <Text style={styles.typeIcon}>{row.icon}</Text>
            <Text style={styles.typeLabel}>{t(row.labelKey)}</Text>
            <Text style={styles.typeCount}>{row.value}</Text>
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
    emptyCard: {
      backgroundColor: colors.accentSofter,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 18,
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyEmoji: {
      fontSize: 28,
      marginBottom: 6,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accentText,
      textAlign: 'center',
    },
    emptyBody: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
      color: colors.accentText,
      textAlign: 'center',
    },
    todayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    todayItem: {
      flex: 1,
      alignItems: 'center',
    },
    todayValue: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.accent,
    },
    todayLabel: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '600',
      color: colors.faint,
      textAlign: 'center',
    },
    todayDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 24,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    summaryLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      color: colors.faint,
      textAlign: 'center',
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sectionSpaced: {
      marginTop: 24,
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 12,
      marginBottom: 24,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    metricRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    metricChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.inputBg,
    },
    metricChipSelected: {
      backgroundColor: colors.accent,
    },
    metricText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.subtext,
    },
    metricTextSelected: {
      color: '#ffffff',
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
