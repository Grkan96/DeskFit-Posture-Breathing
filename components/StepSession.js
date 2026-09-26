import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { recordSessionCompleted } from '../lib/stats';
import { celebrateIfMilestone } from '../lib/celebrateMilestone';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import Confetti from './Confetti';
import { CountdownRing, StepDots, StepProgressBar, successHaptic, tapHaptic, useReduceMotion } from './SessionProgress';

function initialSession(steps) {
  return { stepIndex: 0, secondsLeft: steps[0].seconds, done: false };
}

// Sırayla ilerleyen, her adımı bir süre boyunca gösteren genel amaçlı seans
// bileşeni. Nefes dersleri hariç (o özel bir faz/tur döngüsü kullanıyor),
// hareketler ve egzersizler bunu paylaşır.
export default function StepSession({ title, subtitle, steps, onBack, idleIcon = '🧘', type, autoStart = false }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(() => initialSession(steps));
  const reduceMotion = useReduceMotion();
  const cardAnim = useRef(new Animated.Value(1)).current;

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
      successHaptic();
      recordSessionCompleted(type).then(celebrateIfMilestone);
    }
  }, [session.done]);

  // Adım değişince kart yumuşakça belirip yerine kayar; hafif haptic.
  useEffect(() => {
    if (!running) return;
    tapHaptic();
    if (reduceMotion) return;
    cardAnim.setValue(0);
    Animated.timing(cardAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [session.stepIndex, running, reduceMotion]);

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
  const stepLabel = t('stepSession.stepOf', { current: session.stepIndex + 1, total: steps.length });
  const cardMotion = reduceMotion
    ? null
    : {
        opacity: cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('stepSession.backToMeditation')}
      >
        <Text style={styles.backText}>{t('stepSession.backToMeditation')}</Text>
      </Pressable>

      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.subtitle}>
        {subtitle}{' '}
        {t('stepSession.approxMinutes', { minutes: Math.round(totalSeconds / 60) || 1 })}
      </Text>

      <View style={styles.body}>
        {running ? (
          <>
            <View style={styles.progressWrap}>
              <StepProgressBar
                total={steps.length}
                current={session.stepIndex}
                color={colors.accent}
                trackColor={colors.border}
                reduceMotion={reduceMotion}
                label={stepLabel}
              />
              <StepDots
                total={steps.length}
                current={session.stepIndex}
                activeColor={colors.accent}
                doneColor={colors.accentSoft}
                trackColor={colors.border}
              />
              <Text style={styles.stepText}>{stepLabel}</Text>
            </View>

            <Animated.View
              style={[styles.card, cardMotion]}
              accessible
              accessibilityLabel={`${stepLabel}. ${step.title}. ${step.instruction}. ${t('stepSession.secondsLeft', { count: session.secondsLeft })}`}
            >
              <Text style={styles.cardIcon}>{step.icon}</Text>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardInstruction}>{step.instruction}</Text>
              <View style={styles.ringWrap}>
                <CountdownRing
                  size={112}
                  thickness={6}
                  segments={40}
                  progress={session.secondsLeft / step.seconds}
                  color={colors.accent}
                  trackColor={colors.border}
                >
                  <Text style={styles.cardCount}>{session.secondsLeft}</Text>
                </CountdownRing>
              </View>
            </Animated.View>

            <Pressable
              onPress={handleSkip}
              style={styles.skipButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('stepSession.nextButton')}
            >
              <Text style={styles.skipText}>{t('stepSession.nextButton')}</Text>
            </Pressable>
          </>
        ) : (
          <View
            style={styles.card}
            accessible
            accessibilityLabel={
              finished
                ? `${t('stepSession.doneTitle')}. ${t('stepSession.doneBody')}`
                : `${t('stepSession.readyTitle')}. ${t('stepSession.readyBody')}`
            }
          >
            <Text style={styles.cardIcon}>{finished ? '🎉' : idleIcon}</Text>
            <Text style={styles.cardTitle}>
              {finished ? t('stepSession.doneTitle') : t('stepSession.readyTitle')}
            </Text>
            <Text style={styles.cardInstruction}>
              {finished ? t('stepSession.doneBody') : t('stepSession.readyBody')}
            </Text>
          </View>
        )}
        <Confetti active={finished && !running} />
      </View>

      <Pressable
        onPress={running ? handleStop : handleStart}
        accessibilityRole="button"
        accessibilityLabel={
          running ? t('stepSession.stop') : finished ? t('stepSession.restart') : t('stepSession.start')
        }
        style={[
          styles.actionButton,
          running ? styles.actionButtonStop : styles.actionButtonStart,
        ]}
      >
        <Text style={running ? styles.actionButtonTextStop : styles.actionButtonText}>
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
      minHeight: 48,
      justifyContent: 'center',
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
    progressWrap: {
      alignSelf: 'stretch',
      alignItems: 'center',
      marginBottom: 20,
    },
    stepText: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    ringWrap: {
      marginTop: 16,
    },
    card: {
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 28,
      alignItems: 'center',
      elevation: 3,
      shadowColor: colors.shadow,
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
      fontSize: 36,
      fontWeight: '800',
      color: colors.accent,
    },
    skipButton: {
      marginTop: 12,
      minHeight: 48,
      minWidth: 48,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    skipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
    },
    actionButton: {
      alignSelf: 'stretch',
      borderRadius: 14,
      minHeight: 52,
      justifyContent: 'center',
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
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '700',
    },
    actionButtonTextStop: {
      color: colors.onDanger,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
