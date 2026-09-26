import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getStats, getLast7Days, startPostureChallenge, todayKey } from '../lib/stats';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { shareAchievement, shareBadge, shareChallenge } from '../lib/sharing';
import { ACHIEVEMENTS } from '../lib/achievements';
import { CHALLENGE_DAYS } from '../lib/challenge';

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

  const challenge = stats.challenge;
  const todayDone = challenge.doneDates.includes(todayKey());
  const progressPct = Math.min(100, (challenge.doneDates.length / CHALLENGE_DAYS) * 100);
  const unlockedCount = ACHIEVEMENTS.filter((a) => stats.achievements[a.id]).length;

  function handleStartChallenge() {
    startPostureChallenge().then(setStats);
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

      <Text style={[styles.sectionLabel, styles.sectionSpaced]}>{t('challenge.sectionLabel')}</Text>
      <View style={styles.challengeCard}>
        {challenge.active || challenge.completed ? (
          <>
            <View style={styles.challengeHeaderRow}>
              <Text style={styles.challengeTitle}>
                {challenge.completed ? t('challenge.completedLabel') : t('challenge.todayGoal')}
              </Text>
              <Text style={styles.challengeCount}>
                {t('challenge.progress', { done: challenge.doneDates.length, total: CHALLENGE_DAYS })}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            {challenge.active && todayDone && (
              <Text style={styles.challengeHint}>{t('challenge.todayDone')}</Text>
            )}
          </>
        ) : (
          <Text style={styles.challengeIntro}>{t('challenge.intro')}</Text>
        )}
        {challenge.completed && (
          <Pressable onPress={() => shareChallenge({ days: CHALLENGE_DAYS })} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>{t('challenge.shareButton')}</Text>
          </Pressable>
        )}
        {!challenge.active && (
          <Pressable onPress={handleStartChallenge} style={styles.challengeButton}>
            <Text style={styles.challengeButtonText}>
              {challenge.completed ? t('challenge.restartButton') : t('challenge.startButton')}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
        {t('achievements.sectionLabel')} · {t('achievements.progress', { unlocked: unlockedCount, total: ACHIEVEMENTS.length })}
      </Text>
      <View style={styles.badgeGrid}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = !!stats.achievements[a.id];
          const title = t(`achievements.items.${a.id}.title`);
          return (
            <Pressable
              key={a.id}
              disabled={!unlocked}
              onPress={() => shareBadge({ icon: a.icon, name: title })}
              style={[styles.badgeCard, !unlocked && styles.badgeCardLocked]}
            >
              <Text style={[styles.badgeIcon, !unlocked && styles.badgeIconLocked]}>
                {unlocked ? a.icon : '🔒'}
              </Text>
              <Text style={styles.badgeTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>
                {t(`achievements.items.${a.id}.description`)}
              </Text>
            </Pressable>
          );
        })}
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
    sectionSpaced: {
      marginTop: 24,
    },
    challengeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    challengeHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    challengeTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    challengeCount: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accent,
    },
    challengeIntro: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
    },
    challengeHint: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    progressTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    challengeButton: {
      marginTop: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accentSofter,
      alignItems: 'center',
    },
    challengeButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.accentText,
    },
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
    },
    badgeCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 10,
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    badgeCardLocked: {
      opacity: 0.55,
    },
    badgeIcon: {
      fontSize: 30,
      marginBottom: 6,
    },
    badgeIconLocked: {
      opacity: 0.7,
    },
    badgeTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    badgeDesc: {
      marginTop: 2,
      fontSize: 11,
      color: colors.faint,
      textAlign: 'center',
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
