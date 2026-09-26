import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { recordSessionCompleted } from '../lib/stats';
import { celebrateIfMilestone } from '../lib/celebrateMilestone';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import Confetti from './Confetti';
import { CountdownRing, phaseColor, successHaptic, tapHaptic, useReduceMotion } from './SessionProgress';

const REST_SCALE = 0.75;
const CIRCLE = 170;
const RING = 250;

function initialSession(phases) {
  return { phaseIndex: 0, secondsLeft: phases[0].seconds, cycle: 1, done: false };
}

// technique: { id, phases: [{phaseKey, seconds, scale}], cycles }
export default function BreathingSession({ technique, onBack, autoStart = false, onComplete, backLabel }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const { phases, cycles, id } = technique;
  const title = t(`breathing.techniques.${id}.title`);
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(() => initialSession(phases));
  const reduceMotion = useReduceMotion();
  const scaleAnim = useRef(new Animated.Value(REST_SCALE)).current;

  // Her saniye tik atar; faz süresi dolunca bir sonraki faza (veya tura) geçer.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSession((prev) => {
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }
        const nextPhaseIndex = (prev.phaseIndex + 1) % phases.length;
        const completedCycle = nextPhaseIndex === 0;
        const nextCycle = completedCycle ? prev.cycle + 1 : prev.cycle;
        if (completedCycle && nextCycle > cycles) {
          return { ...prev, secondsLeft: 0, done: true };
        }
        return {
          phaseIndex: nextPhaseIndex,
          secondsLeft: phases[nextPhaseIndex].seconds,
          cycle: nextCycle,
          done: false,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phases, cycles]);

  useEffect(() => {
    if (session.done) {
      setRunning(false);
      setFinished(true);
      successHaptic();
      // onComplete verilmişse (hızlı mola akışı) kayıt akışın sonunda yapılır.
      if (onComplete) onComplete();
      else recordSessionCompleted('breathing').then(celebrateIfMilestone);
    }
  }, [session.done]);

  // Faz değiştiğinde daireyi o fazın süresi boyunca hedef büyüklüğe animasyonla götür.
  useEffect(() => {
    if (!running) return;
    const phase = phases[session.phaseIndex];
    tapHaptic();
    if (reduceMotion) {
      scaleAnim.setValue(phase.scale);
      return;
    }
    Animated.timing(scaleAnim, {
      toValue: phase.scale,
      duration: phase.seconds * 1000,
      useNativeDriver: true,
    }).start();
  }, [running, session.phaseIndex, phases, reduceMotion]);

  function handleStart() {
    setFinished(false);
    setSession(initialSession(phases));
    scaleAnim.setValue(REST_SCALE);
    setRunning(true);
  }

  function handleStop() {
    setRunning(false);
    scaleAnim.stopAnimation();
    setSession(initialSession(phases));
    scaleAnim.setValue(REST_SCALE);
  }

  const phase = phases[session.phaseIndex];
  const tint = running ? phaseColor(colors, phase.phaseKey) : colors.accent;
  const glowScale = scaleAnim.interpolate({ inputRange: [0.5, 1.5], outputRange: [0.6, 1.5] });

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={backLabel || t('breathing.backToTechniques')}
      >
        <Text style={styles.backText}>{backLabel || t('breathing.backToTechniques')}</Text>
      </Pressable>

      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.subtitle}>
        {phases.map((p) => `${t(`breathing.${p.phaseKey}`)} ${p.seconds}s`).join(' · ')}
        {' — '}
        {t('breathing.cyclesCount', { count: cycles })}
      </Text>

      <View
        style={styles.circleWrap}
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={
          running
            ? `${t(`breathing.${phase.phaseKey}`)}, ${t('breathing.secondsLeft', { count: session.secondsLeft })}`
            : finished
              ? t('breathing.doneTitle')
              : t('breathing.readyTitle')
        }
      >
        <CountdownRing
          size={RING}
          progress={running ? session.secondsLeft / phase.seconds : finished ? 1 : 0}
          color={tint}
          trackColor={colors.border}
        >
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: tint, transform: [{ scale: glowScale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.circle,
              { borderColor: tint, transform: [{ scale: scaleAnim }] },
            ]}
          />
          <View style={styles.center} pointerEvents="none">
            {running ? (
              <>
                <Text style={[styles.phaseLabel, { color: tint }]}>{t(`breathing.${phase.phaseKey}`)}</Text>
                <Text style={styles.phaseCount}>{session.secondsLeft}</Text>
              </>
            ) : (
              <Text style={styles.circleIdleText}>
                {finished ? t('breathing.doneTitle') : t('breathing.readyTitle')}
              </Text>
            )}
          </View>
        </CountdownRing>
        <Confetti active={finished} />
      </View>

      <Text style={styles.cycleText}>
        {running ? t('breathing.cycleLabel', { current: session.cycle, total: cycles }) : ' '}
      </Text>

      <Pressable
        onPress={running ? handleStop : handleStart}
        accessibilityRole="button"
        accessibilityLabel={running ? t('breathing.stop') : finished ? t('breathing.restart') : t('breathing.start')}
        style={[
          styles.actionButton,
          running ? styles.actionButtonStop : styles.actionButtonStart,
        ]}
      >
        <Text style={running ? styles.actionButtonTextStop : styles.actionButtonText}>
          {running ? t('breathing.stop') : finished ? t('breathing.restart') : t('breathing.start')}
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
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 18,
    },
    circleWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circle: {
      position: 'absolute',
      width: CIRCLE,
      height: CIRCLE,
      borderRadius: CIRCLE / 2,
      borderWidth: 4,
      backgroundColor: colors.accentSofter,
    },
    glow: {
      position: 'absolute',
      width: CIRCLE,
      height: CIRCLE,
      borderRadius: CIRCLE / 2,
      opacity: 0.14,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },
    phaseLabel: {
      fontSize: 18,
      fontWeight: '700',
    },
    phaseCount: {
      marginTop: 4,
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    circleIdleText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accentText,
      paddingHorizontal: 20,
      textAlign: 'center',
    },
    cycleText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 12,
      height: 18,
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
