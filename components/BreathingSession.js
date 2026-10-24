import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { recordSessionCompleted } from '../lib/stats';
import { celebrateIfMilestone } from '../lib/celebrateMilestone';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import Confetti from './Confetti';
import { CountdownRing, phaseColor, successHaptic, tapHaptic, useReduceMotion } from './SessionProgress';

// --- Opsiyonel ortam sesi (yağmur / beyaz gürültü) --------------------------
// Nefes seansı mantığına (faz zamanlaması, haptic, milestone, kayıt) dokunmayan,
// tamamen izole, ekstra bir katman. Kullanıcı tercihi cihazda kalıcı olur ve
// bir sonraki seansta hatırlanır.
const AMBIENT_STORAGE_KEY = 'durus-hatirlatici/ambient-sound';
const AMBIENT_CYCLE = ['off', 'rain', 'white'];
const AMBIENT_ICON = { off: '🔈', rain: '🌧️', white: '📻' };
const AMBIENT_LABEL_KEY = { off: 'ambientOff', rain: 'ambientRain', white: 'ambientWhiteNoise' };
// require() ile statik yol vermek zorunlu (Metro dinamik string interpolasyonu çözemez).
const AMBIENT_SOURCES = {
  rain: require('../assets/sounds/rain.wav'),
  white: require('../assets/sounds/white-noise.wav'),
};

// Kullanıcının ortam sesi tercihini AsyncStorage'da saklayıp okuyan, ve
// Kapalı → Yağmur → Beyaz Gürültü → Kapalı döngüsünde ilerleten küçük hook.
function useAmbientSoundPreference() {
  const [ambientSound, setAmbientSound] = useState('off');

  useEffect(() => {
    AsyncStorage.getItem(AMBIENT_STORAGE_KEY)
      .then((saved) => {
        if (AMBIENT_CYCLE.includes(saved)) {
          setAmbientSound(saved);
        }
      })
      .catch(() => {});
  }, []);

  function cycleAmbientSound() {
    setAmbientSound((prev) => {
      const next = AMBIENT_CYCLE[(AMBIENT_CYCLE.indexOf(prev) + 1) % AMBIENT_CYCLE.length];
      AsyncStorage.setItem(AMBIENT_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }

  return [ambientSound, cycleAmbientSound];
}

const REST_SCALE = 0.75;
const CIRCLE = 170;
const RING = 250;
const RADIUS_XL = 28;
const RADIUS_PILL = 20;

// 2026 wellness estetiği: seans arka planına iki yumuşak "blob" ile hafif bir
// gradient hissi verir. Gerçek LinearGradient/blur bağımlılığı eklemeden,
// düşük opaklıklı büyük daireler üst üste bindirilerek sakin bir doku elde edilir.
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
    top: -90,
    right: -70,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.32,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -110,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.24,
  },
});

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

  // Ortam sesi: seçime göre kaynak değişir, useAudioPlayer yeni kaynak için
  // otomatik olarak yeni bir AudioPlayer oluşturur ve eskisini serbest bırakır.
  const [ambientSound, cycleAmbientSound] = useAmbientSoundPreference();
  const ambientSource = ambientSound === 'off' ? null : AMBIENT_SOURCES[ambientSound];
  const ambientPlayer = useAudioPlayer(ambientSource);

  // Seans çalışırken ve bir ses seçiliyken döngülü çal; durunca/bitince/unmount
  // olunca durdur. Ses oynatma hatası ana nefes akışını asla çökertmemeli.
  useEffect(() => {
    if (!ambientPlayer) return;
    try {
      ambientPlayer.loop = true;
      if (running && ambientSound !== 'off') {
        ambientPlayer.play();
      } else {
        ambientPlayer.pause();
      }
    } catch (e) {
      // Sessiz başarısızlık: ortam sesi opsiyonel bir ek katman.
    }
    return () => {
      try {
        ambientPlayer.pause();
      } catch (e) {
        // no-op
      }
    };
  }, [ambientPlayer, running, ambientSound]);

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
      <GradientBackdrop colors={colors} />
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={backLabel || t('breathing.backToTechniques')}
        >
          <Text style={styles.backText}>{backLabel || t('breathing.backToTechniques')}</Text>
        </Pressable>

        <Pressable
          onPress={cycleAmbientSound}
          style={styles.ambientButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t(`breathing.${AMBIENT_LABEL_KEY[ambientSound]}`)}
        >
          <Text style={styles.ambientButtonIcon}>{AMBIENT_ICON[ambientSound]}</Text>
        </Pressable>
      </View>

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
      backgroundColor: colors.bg,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    ambientButton: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glassBg || colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder || colors.border,
    },
    ambientButtonIcon: {
      fontSize: 20,
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
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 16,
      borderRadius: RADIUS_XL,
      backgroundColor: colors.glassBg || colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder || colors.border,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
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
      borderRadius: RADIUS_PILL,
      minHeight: 52,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      elevation: 1,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
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
