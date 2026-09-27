import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import BreathingScreen from './BreathingScreen';
import MovementsScreen from './MovementsScreen';
import ExercisesScreen from './ExercisesScreen';
import AdBanner from '../components/AdBanner';
import BreathingSession from '../components/BreathingSession';
import QuickBreak from '../components/QuickBreak';
import { getStats, startPostureChallenge } from '../lib/stats';
import { CHALLENGE_DAYS } from '../lib/challenge';
import { TECHNIQUES } from '../lib/breathingTechniques';
import { pickSuggestion } from '../lib/sessionContent';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const CATEGORIES = [
  { id: 'movements', icon: '🧘', ready: true },
  { id: 'exercises', icon: '💪', ready: true },
  { id: 'breathing', icon: '🌬️', ready: true },
];

const RADIUS_XL = 26;
const RADIUS_LG = 20;

// 2026 wellness estetiği: ekranın arkasına, bağımlılık eklemeden düşük
// opaklıklı büyük dairelerle yumuşak bir gradient dokusu verir.
function GradientBackdrop({ colors }) {
  const from = colors.gradientFrom || colors.accentSofter;
  const to = colors.gradientTo || colors.accentSoft;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={[backdropStyles.blobTop, { backgroundColor: from }]} />
      <View style={[backdropStyles.blobBottom, { backgroundColor: to }]} />
    </View>
  );
}

const backdropStyles = StyleSheet.create({
  blobTop: {
    position: 'absolute',
    top: -60,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.28,
  },
  blobBottom: {
    position: 'absolute',
    top: 260,
    left: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.18,
  },
});

// Geniş "hero" bento kartı: hızlı mola ve günün önerisi için.
function CategoryCard({ styles, icon, title, description, ready, badgeLabel, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
    >
      <Text style={styles.cardIcon}>{icon}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <View style={[styles.badge, ready && styles.badgeReady]}>
        <Text style={[styles.badgeText, ready && styles.badgeTextReady]}>{badgeLabel}</Text>
      </View>
    </Pressable>
  );
}

// Kare bento karo: hareketler/egzersizler/nefes kategori ızgarası için.
function GridTile({ styles, icon, title, description, ready, badgeLabel, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.gridTile, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
    >
      <Text style={styles.gridTileIcon}>{icon}</Text>
      <Text style={styles.gridTileTitle}>{title}</Text>
      <Text style={styles.gridTileDescription} numberOfLines={2}>
        {description}
      </Text>
      <View style={[styles.badge, ready && styles.badgeReady, styles.gridTileBadge]}>
        <Text style={[styles.badgeText, ready && styles.badgeTextReady]}>{badgeLabel}</Text>
      </View>
    </Pressable>
  );
}

export default function MeditationScreen({ onChangeTab }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [activeSession, setActiveSession] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (activeSession === null) {
      getStats().then(setStats);
    }
  }, [activeSession]);

  // "Bugünün önerisi": en az yapılan tür (eşitlikte güne göre döner).
  const suggestion = pickSuggestion(stats && stats.byType, new Date(), TECHNIQUES.length);
  const challenge = stats && stats.challenge;
  const back = () => setActiveSession(null);

  function handleStartChallenge() {
    startPostureChallenge().then(setStats);
  }

  if (activeSession === 'quick') {
    return <QuickBreak onBack={back} />;
  }
  if (activeSession === 'suggest-breathing') {
    return (
      <BreathingSession
        technique={TECHNIQUES[suggestion.techniqueIndex]}
        onBack={back}
        autoStart
        backLabel={t('stepSession.backToMeditation')}
      />
    );
  }
  if (activeSession === 'suggest-movements') {
    return <MovementsScreen onBack={back} autoStart />;
  }
  if (activeSession === 'suggest-exercises') {
    return <ExercisesScreen onBack={back} autoStart />;
  }
  if (activeSession === 'breathing') {
    return <BreathingScreen onBack={back} />;
  }
  if (activeSession === 'movements') {
    return <MovementsScreen onBack={back} />;
  }
  if (activeSession === 'exercises') {
    return <ExercisesScreen onBack={back} />;
  }

  return (
    <View style={styles.screen}>
      <GradientBackdrop colors={colors} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🌿</Text>
        <Text style={styles.header}>{t('meditation.header')}</Text>
        <Text style={styles.subtitle}>{t('meditation.subtitle')}</Text>

        {stats && stats.totalSessions > 0 && (
          <Pressable
            style={({ pressed }) => [styles.statsRow, pressed && styles.cardPressed]}
            onPress={() => onChangeTab && onChangeTab('stats')}
            accessibilityRole="button"
            accessibilityLabel={`${t('meditation.statsStreak')} ${stats.streak}, ${t('meditation.statsSessions')} ${stats.totalSessions}. ${t('stats.seeStats')}`}
          >
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>🔥 {stats.streak}</Text>
              <Text style={styles.statLabel}>{t('meditation.statsStreak')}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>✅ {stats.totalSessions}</Text>
              <Text style={styles.statLabel}>{t('meditation.statsSessions')}</Text>
            </View>
          </Pressable>
        )}

        {challenge && (
          <View style={styles.challengeCard}>
            <Text style={styles.challengeTitle}>{t('challenge.sectionLabel')}</Text>
            {challenge.active || challenge.completed ? (
              <Pressable onPress={() => onChangeTab && onChangeTab('stats')} hitSlop={6} accessibilityRole="button">
                <Text style={styles.challengeBody}>
                  {challenge.completed
                    ? t('challenge.completedLabel')
                    : `${t('challenge.progress', { done: challenge.doneDates.length, total: CHALLENGE_DAYS })} · ${t('challenge.todayGoal')}`}
                </Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.challengeBody}>{t('challenge.intro')}</Text>
                <Pressable onPress={handleStartChallenge} style={styles.challengeButton}>
                  <Text style={styles.challengeButtonText}>{t('challenge.startButton')}</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        <View style={styles.heroList}>
          <CategoryCard
            styles={styles}
            icon="⚡"
            ready
            title={t('meditation.quickBreakTitle')}
            description={t('meditation.quickBreakDescription')}
            badgeLabel={t('meditation.badgeReady')}
            onPress={() => setActiveSession('quick')}
          />
          <CategoryCard
            styles={styles}
            icon="🎯"
            ready
            title={t('meditation.suggestionTitle')}
            description={t('meditation.suggestionBody', {
              name: t(`meditation.categories.${suggestion.type}.title`),
            })}
            badgeLabel={t('meditation.badgeReady')}
            onPress={() => setActiveSession(`suggest-${suggestion.type}`)}
          />
        </View>

        <View style={styles.grid}>
          {CATEGORIES.map((category) => {
            const title = t(`meditation.categories.${category.id}.title`);
            const description = t(`meditation.categories.${category.id}.description`);
            return (
              <GridTile
                key={category.id}
                styles={styles}
                icon={category.icon}
                ready={category.ready}
                title={title}
                description={description}
                badgeLabel={category.ready ? t('meditation.badgeReady') : t('meditation.badgeSoon')}
                onPress={() =>
                  category.ready
                    ? setActiveSession(category.id)
                    : Alert.alert(title, t('meditation.comingSoonBody'))
                }
              />
            );
          })}
        </View>

        <AdBanner />
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      alignItems: 'center',
    },
    emoji: {
      fontSize: 32,
      marginBottom: 4,
    },
    header: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      marginTop: 6,
      fontSize: 13,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 19,
    },
    statsRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
      marginBottom: 4,
    },
    statBadge: {
      flex: 1,
      backgroundColor: colors.glassBg || colors.surface,
      borderRadius: RADIUS_LG,
      borderWidth: 1,
      borderColor: colors.glassBorder || colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: 'center',
      elevation: 1,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.faint,
      marginTop: 2,
    },
    challengeCard: {
      alignSelf: 'stretch',
      backgroundColor: colors.accentSofter,
      borderRadius: RADIUS_LG,
      borderWidth: 1,
      borderColor: colors.glassBorder || colors.border,
      padding: 18,
      marginTop: 16,
      elevation: 1,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    challengeTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accentText,
    },
    challengeBody: {
      marginTop: 4,
      fontSize: 12,
      color: colors.text,
      lineHeight: 17,
    },
    challengeButton: {
      marginTop: 10,
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    challengeButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
    },
    heroList: {
      alignSelf: 'stretch',
      gap: 12,
      marginTop: 20,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glassBg || colors.surface,
      borderRadius: RADIUS_LG,
      borderWidth: 1,
      borderColor: colors.glassBorder || colors.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    cardPressed: {
      opacity: 0.8,
    },
    cardIcon: {
      fontSize: 28,
      marginRight: 14,
    },
    cardBody: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    cardDescription: {
      marginTop: 2,
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
    },
    // Hareketler/egzersizler/nefes için 2 sütunlu bento ızgara.
    grid: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
    },
    gridTile: {
      flexBasis: '47%',
      flexGrow: 1,
      minHeight: 132,
      backgroundColor: colors.glassBg || colors.surface,
      borderRadius: RADIUS_LG,
      borderWidth: 1,
      borderColor: colors.glassBorder || colors.border,
      paddingHorizontal: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    gridTileIcon: {
      fontSize: 26,
      marginBottom: 6,
    },
    gridTileTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    gridTileDescription: {
      marginTop: 3,
      fontSize: 11,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 15,
    },
    gridTileBadge: {
      marginLeft: 0,
      marginTop: 8,
    },
    badge: {
      backgroundColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginLeft: 8,
    },
    badgeReady: {
      backgroundColor: colors.accentSofter,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.muted,
    },
    badgeTextReady: {
      color: colors.accentText,
    },
  });
}
