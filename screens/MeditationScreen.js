import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import BreathingScreen from './BreathingScreen';
import MovementsScreen from './MovementsScreen';
import ExercisesScreen from './ExercisesScreen';
import EyeExercisesScreen from './EyeExercisesScreen';
import StatsScreen from './StatsScreen';
import AdBanner from '../components/AdBanner';
import { getStats } from '../lib/stats';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const CATEGORIES = [
  { id: 'movements', icon: '🧘', ready: true },
  { id: 'exercises', icon: '💪', ready: true },
  { id: 'breathing', icon: '🌬️', ready: true },
  { id: 'eyes', icon: '👀', ready: true },
];

function CategoryCard({ styles, icon, title, description, ready, badgeLabel, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
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

export default function MeditationScreen() {
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

  if (activeSession === 'breathing') {
    return <BreathingScreen onBack={() => setActiveSession(null)} />;
  }
  if (activeSession === 'movements') {
    return <MovementsScreen onBack={() => setActiveSession(null)} />;
  }
  if (activeSession === 'exercises') {
    return <ExercisesScreen onBack={() => setActiveSession(null)} />;
  }
  if (activeSession === 'eyes') {
    return <EyeExercisesScreen onBack={() => setActiveSession(null)} />;
  }
  if (activeSession === 'stats') {
    return <StatsScreen onBack={() => setActiveSession(null)} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>🌿</Text>
      <Text style={styles.header}>{t('meditation.header')}</Text>
      <Text style={styles.subtitle}>{t('meditation.subtitle')}</Text>

      {stats && stats.totalSessions > 0 && (
        <Pressable
          style={({ pressed }) => [styles.statsRow, pressed && styles.cardPressed]}
          onPress={() => setActiveSession('stats')}
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

      <View style={styles.cardList}>
        {CATEGORIES.map((category) => {
          const title = t(`meditation.categories.${category.id}.title`);
          const description = t(`meditation.categories.${category.id}.description`);
          return (
            <CategoryCard
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
  );
}

function createStyles(colors) {
  return StyleSheet.create({
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
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
      marginBottom: 4,
    },
    statBadge: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
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
    cardList: {
      alignSelf: 'stretch',
      gap: 12,
      marginTop: 20,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
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
