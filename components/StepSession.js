import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { recordSessionCompleted } from '../lib/stats';
import { celebrateIfMilestone } from '../lib/celebrateMilestone';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

function initialSession(steps) {
  return { stepIndex: 0, secondsLeft: steps[0].seconds, done: false };
}

// Sırayla ilerleyen, her adımı bir süre boyunca gösteren genel amaçlı seans
// bileşeni. Nefes dersleri hariç (o özel bir faz/tur döngüsü kullanıyor),
// hareketler ve egzersizler bunu paylaşır.
export default function StepSession({ title, subtitle, steps, onBack, idleIcon = '🧘', type }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(() => initialSession(steps));

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSession((prev) => {
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }
        const nextIndex = prev.stepIndex + 1;
        if (nextIndex >= steps.length) {
          return { ...prev, secondsLeft: 0, done: true };
        }
        return { stepIndex: nextIndex, secondsLeft: steps[nextIndex].seconds, done: false };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, steps]);

  useEffect(() => {
    if (session.done) {
      setRunning(false);
      setFinished(true);
      recordSessionCompleted(type).then(celebrateIfMilestone);
    }
  }, [session.done]);

  function handleStart() {
    setFinished(false);
    setSession(initialSession(steps));
    setRunning(true);
  }

  function handleStop() {
    setRunning(false);
    setSession(initialSession(steps));
  }

  function handleSkip() {
    setSession((prev) => {
      const nextIndex = prev.stepIndex + 1;
      if (nextIndex >= steps.length) {
        return { ...prev, secondsLeft: 0, done: true };
      }
      return { stepIndex: nextIndex, secondsLeft: steps[nextIndex].seconds, done: false };
    });
  }

  const step = steps[session.stepIndex];
  const totalSeconds = steps.reduce((sum, s) => sum + s.seconds, 0);

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
        <Text style={styles.backText}>{t('stepSession.backToMeditation')}</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {subtitle}{' '}
        {t('stepSession.approxMinutes', { minutes: Math.round(totalSeconds / 60) || 1 })}
      </Text>

      <View style={styles.body}>
        {running ? (
          <>
            <View style={styles.dots}>
              {steps.map((s, i) => (
                <View
                  key={s.id}
                  style={[
                    styles.dot,
                    i === session.stepIndex && styles.dotActive,
                    i < session.stepIndex && styles.dotDone,
                  ]}
                />
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardIcon}>{step.icon}</Text>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardInstruction}>{step.instruction}</Text>
              <Text style={styles.cardCount}>{session.secondsLeft}</Text>
            </View>

            <Pressable onPress={handleSkip} style={styles.skipButton} hitSlop={8}>
              <Text style={styles.skipText}>{t('stepSession.nextButton')}</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardIcon}>{finished ? '🎉' : idleIcon}</Text>
            <Text style={styles.cardTitle}>
              {finished ? t('stepSession.doneTitle') : t('stepSession.readyTitle')}
            </Text>
            <Text style={styles.cardInstruction}>
              {finished ? t('stepSession.doneBody') : t('stepSession.readyBody')}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={running ? handleStop : handleStart}
        style={[
          styles.actionButton,
          running ? styles.actionButtonStop : styles.actionButtonStart,
        ]}
      >
        <Text style={styles.actionButtonText}>
          {running
            ? t('stepSession.stop')
            : finished
              ? t('stepSession.restart')
              : t('stepSession.start')}
        </Text>
      </Pressable>
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
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    backText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 18,
    },
    body: {
      flex: 1,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.accent,
      width: 20,
    },
    dotDone: {
      backgroundColor: colors.accentSoft,
    },
    card: {
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 32,
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    cardIcon: {
      fontSize: 40,
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    cardInstruction: {
      marginTop: 8,
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 19,
    },
    cardCount: {
      marginTop: 18,
      fontSize: 36,
      fontWeight: '800',
      color: colors.accent,
    },
    skipButton: {
      marginTop: 18,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    skipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
    },
    actionButton: {
      alignSelf: 'stretch',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 24,
    },
    actionButtonStart: {
      backgroundColor: colors.accent,
    },
    actionButtonStop: {
      backgroundColor: colors.danger,
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
