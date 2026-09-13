import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

const PHASES = [
  { key: 'inhale', label: 'Nefes Al', seconds: 4, scale: 1.35 },
  { key: 'hold', label: 'Tut', seconds: 7, scale: 1.35 },
  { key: 'exhale', label: 'Nefes Ver', seconds: 8, scale: 0.75 },
];
const REST_SCALE = 0.75;
const TOTAL_CYCLES = 4;

function initialSession() {
  return { phaseIndex: 0, secondsLeft: PHASES[0].seconds, cycle: 1, done: false };
}

export default function BreathingScreen({ onBack }) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(initialSession);
  const scaleAnim = useRef(new Animated.Value(REST_SCALE)).current;

  // Her saniye tik atar; faz süresi dolunca bir sonraki faza (veya tura) geçer.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSession((prev) => {
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }
        const nextPhaseIndex = (prev.phaseIndex + 1) % PHASES.length;
        const completedCycle = nextPhaseIndex === 0;
        const nextCycle = completedCycle ? prev.cycle + 1 : prev.cycle;
        if (completedCycle && nextCycle > TOTAL_CYCLES) {
          return { ...prev, secondsLeft: 0, done: true };
        }
        return {
          phaseIndex: nextPhaseIndex,
          secondsLeft: PHASES[nextPhaseIndex].seconds,
          cycle: nextCycle,
          done: false,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (session.done) {
      setRunning(false);
      setFinished(true);
    }
  }, [session.done]);

  // Faz değiştiğinde daireyi o fazın süresi boyunca hedef büyüklüğe animasyonla götür.
  useEffect(() => {
    if (!running) return;
    const phase = PHASES[session.phaseIndex];
    Animated.timing(scaleAnim, {
      toValue: phase.scale,
      duration: phase.seconds * 1000,
      useNativeDriver: true,
    }).start();
  }, [running, session.phaseIndex]);

  function handleStart() {
    setFinished(false);
    setSession(initialSession());
    scaleAnim.setValue(REST_SCALE);
    setRunning(true);
  }

  function handleStop() {
    setRunning(false);
    scaleAnim.stopAnimation();
    setSession(initialSession());
    scaleAnim.setValue(REST_SCALE);
  }

  const phase = PHASES[session.phaseIndex];

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
        <Text style={styles.backText}>‹ Meditasyon</Text>
      </Pressable>

      <Text style={styles.title}>4-7-8 Nefes Tekniği</Text>
      <Text style={styles.subtitle}>
        4 saniye nefes al, 7 saniye tut, 8 saniye nefes ver. {TOTAL_CYCLES} tur.
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
        {running ? `Tur ${session.cycle} / ${TOTAL_CYCLES}` : ' '}
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

const styles = StyleSheet.create({
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
    color: '#16a34a',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
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
    backgroundColor: '#bbf7d0',
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
    color: '#14532d',
  },
  phaseCount: {
    marginTop: 4,
    fontSize: 32,
    fontWeight: '800',
    color: '#14532d',
  },
  circleIdleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14532d',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  cycleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
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
    backgroundColor: '#16a34a',
  },
  actionButtonStop: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
