import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getStats,
  getLast7Days,
  startPostureChallenge,
  todayKey,
  getRestDayInfo,
  getRestDayInfoFromStats,
  markRestDay,
  unmarkRestDay,
} from '../lib/stats';
import { useThemeColors, radius } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { shareAchievement, shareBadge, shareChallenge } from '../lib/sharing';
import { ACHIEVEMENTS } from '../lib/achievements';
import { CHALLENGE_DAYS } from '../lib/challenge';
import GradientCard from '../components/GradientCard';

const BAR_MAX_HEIGHT = 90;

const TYPE_META = [
  { key: 'breathing', icon: '🌬️', labelKey: 'stats.typeBreathing' },
  { key: 'movements', icon: '🧘', labelKey: 'stats.typeMovements' },
  { key: 'exercises', icon: '💪', labelKey: 'stats.typeExercises' },
];

// Kilitli rozet için kalan miktar ipucu (yalnızca görüntü; achievements.js'e dokunmaz).
function lockedHint(id, stats, t) {
  const today = stats.history[todayKey()] || 0;
  const sessions = (left) =>
    left === 1 ? t('stats.sessionOneLeft') : t('stats.sessionsLeft', { count: left });
  let left = 0;
  switch (id) {
    case 'first_session': left = 1 - stats.totalSessions; break;
    case 'sessions_20': left = 20 - stats.totalSessions; break;
    case 'sessions_50': left = 50 - stats.totalSessions; break;
    case 'breathing_10': left = 10 - (stats.byType.breathing || 0); break;
    case 'triple_day': left = 3 - today; break;
    case 'streak_7': left = 7 - stats.streak; break;
    case 'streak_30': left = 30 - stats.streak; break;
    case 'streak_100': left = 100 - stats.streak; break;
    case 'all_types': {
      const n = ['breathing', 'movements', 'exercises'].filter((k) => !(stats.byType[k] > 0)).length;
      return n > 0 ? t('stats.typesLeft', { count: n }) : null;
    }
    default: return null;
  }
  if (left <= 0) return null;
  return id.startsWith('streak_') ? t('stats.daysLeft', { count: left }) : sessions(left);
}

export default function StatsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const weekdayLabels = t('stats.weekdays');
  const [stats, setStats] = useState(null);
  const [restInfo, setRestInfo] = useState(null);

  useEffect(() => {
    getStats().then(setStats);
    getRestDayInfo().then(setRestInfo);
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

  const today = todayKey();
  const hasSessionToday = (stats.history[today] || 0) > 0;
  const isTodayRestDay = !!stats.restDays[today];
  const restRemaining = restInfo ? restInfo.remaining : 0;

  function handleToggleRestDay() {
    const action = isTodayRestDay ? unmarkRestDay : markRestDay;
    action(today).then((res) => {
      if (!res.ok) return;
      setStats(res.stats);
      setRestInfo(getRestDayInfoFromStats(res.stats));
    });
  }

  const week = getLast7Days(stats.history);
  const maxCount = Math.max(1, ...week.map((d) => d.count));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header} accessibilityRole="header">{t('stats.header')}</Text>

      {stats.totalSessions === 0 && (
        <GradientCard
          variant="soft"
          style={styles.emptyCard}
          contentStyle={styles.emptyCardContent}
        >
          <View accessible accessibilityLabel={`${t('stats.emptyTitle')}. ${t('stats.emptyBody')}`}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>{t('stats.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('stats.emptyBody')}</Text>
          </View>
        </GradientCard>
      )}

      {/* Streak + total-sessions bento tiles, same card language as Home. */}
      <View style={styles.summaryRow}>
        <GradientCard variant="soft" style={styles.summaryCard} contentStyle={styles.summaryCardContent}>
          <Text style={styles.summaryValue}>🔥 {stats.streak}</Text>
          <Text style={styles.summaryLabel}>{t('stats.streakLabel')}</Text>
        </GradientCard>
        <GradientCard variant="soft" style={styles.summaryCard} contentStyle={styles.summaryCardContent}>
          <Text style={styles.summaryValue}>✅ {stats.totalSessions}</Text>
          <Text style={styles.summaryLabel}>{t('stats.sessionsLabel')}</Text>
        </GradientCard>
      </View>

      <Text style={styles.sectionLabel}>{t('stats.weekSectionLabel')}</Text>
      <GradientCard variant="soft" style={styles.chartCard} contentStyle={styles.chartCardContent}>
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
      </GradientCard>

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
      <GradientCard style={styles.challengeCard} contentStyle={styles.challengeCardContent}>
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
      </GradientCard>

      <Text style={[styles.sectionLabel, styles.sectionSpaced]}>{t('stats.restDaySectionLabel')}</Text>
      <View style={styles.restDayCard}>
        <Text style={styles.restDayHint}>{t('stats.restDayHint')}</Text>
        <Text style={styles.restDayRemaining}>
          {restRemaining === 0
            ? t('stats.restDayRemainingNone')
            : restRemaining === 1
            ? t('stats.restDayRemainingOne')
            : t('stats.restDayRemaining', { count: restRemaining })}
        </Text>
        {isTodayRestDay && <Text style={styles.restDayMarkedText}>{t('stats.restDayMarkedToday')}</Text>}
        {!hasSessionToday && (isTodayRestDay || restRemaining > 0) && (
          <Pressable onPress={handleToggleRestDay} style={styles.restDayButton}>
            <Text style={styles.restDayButtonText}>
              {isTodayRestDay ? t('stats.restDayUnmarkButton') : t('stats.restDayMarkButton')}
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
          const description = t(`achievements.items.${a.id}.description`);
          const hint = unlocked ? null : lockedHint(a.id, stats, t);
          return (
            <Pressable
              key={a.id}
              disabled={!unlocked}
              accessibilityRole={unlocked ? 'button' : 'text'}
              accessibilityLabel={`${title}. ${description}. ${unlocked ? t('achievements.shareBadge') : `${t('achievements.locked')}${hint ? `, ${hint}` : ''}`}`}
              onPress={() => shareBadge({ icon: a.icon, name: title })}
              style={[styles.badgeCard, !unlocked && styles.badgeCardLocked]}
            >
              <Text style={[styles.badgeIcon, !unlocked && styles.badgeIconLocked]}>
                {unlocked ? a.icon : '🔒'}
              </Text>
              <Text style={styles.badgeTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>
                {description}
              </Text>
              {hint && <Text style={styles.badgeHint}>{hint}</Text>}
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
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 32,
      gap: 16,
    },
    emptyCard: {},
    emptyCardContent: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    emptyEmoji: { fontSize: 40, marginBottom: 6 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.accentText, textAlign: 'center' },
    emptyBody: { marginTop: 4, fontSize: 13, color: colors.text, textAlign: 'center', lineHeight: 19 },
    badgeHint: { marginTop: 6, fontSize: 11, fontWeight: '700', color: colors.accentText, textAlign: 'center' },
    header: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: colors.text,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
    },
    summaryCard: {
      flex: 1,
    },
    summaryCardContent: {
      paddingVertical: 18,
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
    },
    summaryLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      color: colors.faint,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sectionLabel: {
      alignSelf: 'flex-start',
      fontSize: 12,
      fontWeight: '700',
      color: colors.subtext,
      marginBottom: -4,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    chartCard: {},
    chartCardContent: {
      paddingHorizontal: 12,
      paddingTop: 20,
      paddingBottom: 12,
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
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      elevation: 1,
      shadowColor: colors.shadow,
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
    sectionSpaced: {},
    challengeCard: {},
    challengeCardContent: {
      paddingVertical: 16,
      paddingHorizontal: 16,
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
      color: colors.subtext,
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
      borderRadius: radius.md,
      backgroundColor: colors.accentSofter,
      alignItems: 'center',
    },
    challengeButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.accentText,
    },
    restDayCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    restDayHint: {
      fontSize: 13,
      color: colors.subtext,
      lineHeight: 19,
    },
    restDayRemaining: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '700',
      color: colors.accentText,
    },
    restDayMarkedText: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    restDayButton: {
      marginTop: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accentSofter,
      alignItems: 'center',
    },
    restDayButtonText: {
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
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 10,
      alignItems: 'center',
      elevation: 1,
      shadowColor: colors.shadow,
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
      marginTop: 4,
      paddingVertical: 14,
      borderRadius: radius.lg,
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
