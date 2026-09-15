import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { recordSessionCompleted } from '../lib/stats';
import { useThemeColors } from '../lib/theme';

const REST_SCALE = 0.75;

function initialSession(phases) {
  return { phaseIndex: 0, secondsLeft: phases[0].seconds, cycle: 1, done: false };
}

// technique: { title, phases: [{label, seconds, scale}], cycles }
export default function BreathingSession({ technique, onBack }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { phases, cycles, title } = technique;
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(() => initialSession(phases));
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
      recordSessionCompleted('breathing');
    }
  }, [session.done]);

  // Faz değiştiğinde daireyi o fazın süresi boyunca hedef büyüklüğe animasyonla götür.
  useEffect(() => {
    if (!running) return;
    const phase = phases[session.phaseIndex];
    Animated.timing(scaleAnim, {
      toValue: phase.scale,
      duration: phase.seconds * 1000,
      useNativeDriver: true,
    }).start();
  }, [running, session.phaseIndex, phases]);

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

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
        <Text style={styles.backText}>‹ Teknikler</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {phases.map((p) => `${p.label} ${p.seconds}sn`).join(' · ')} — {cycles} tur.
      </Text>

      <View style={styles.circleWrap}>
        <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}>
          {running ? (
            <>
              <Text style={styles.phaseLabel}>{phase.label}</Text>
              <Text style={styles.phaseCount}>{session.secondsLeft}</Text>
            </>
          ) : (
            <Text style={styles.circleIdleText}>
              {finished ? 'Tamamlandı 🌿' : 'Hazır mısın?'}
            </Text>
          )}
        </Animated.View>
      </View>

      <Text style={styles.cycleText}>
        {running ? `Tur ${session.cycle} / ${cycles}` : ' '}
      </Text>

      <Pressable
        onPress={running ? handleStop : handleStart}
        style={[
          styles.actionButton,
          running ? styles.actionButtonStop : styles.actionButtonStart,
        ]}
      >
        <Text style={styles.actionButtonText}>
          {running ? 'Durdur' : finished ? 'Tekrar Başla' : 'Başla'}
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
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.accentSofter,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    phaseLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.accentText,
    },
    phaseCount: {
      marginTop: 4,
      fontSize: 32,
      fontWeight: '800',
      color: colors.accentText,
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
