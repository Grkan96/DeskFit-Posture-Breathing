import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const FACE_SIZE = 64;
const MESSAGE_KEYS = [
  'companion.msg1',
  'companion.msg2',
  'companion.msg3',
  'companion.msg4',
  'companion.msg5',
  'companion.msg6',
];
const BUBBLE_VISIBLE_MS = 3200;

// Küçük "duruş dostu" maskot: seriye ve günlük halka doluluğuna göre ruh hali
// değiştirir, dokununca kısa bir cesaretlendirme balonu gösterir.
// Bağımlılıksız: yüz tamamen View/Animated ile çizilir, emoji sadece rozet olarak eklenir.
export default function Companion({ streak = 0, ringFraction = 0, style }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [bubbleMsg, setBubbleMsg] = useState(null);
  const lastMsgIndex = useRef(-1);
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const bubbleTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduceMotion(!!v))
      .catch(() => {});
    let sub;
    try {
      sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
        if (mounted) setReduceMotion(!!v);
      });
    } catch {}
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  const celebrating = ringFraction >= 1;

  // Kutlama zıplaması: halka tam dolunca döngüsel olarak zıplar (reduce motion açıksa durur).
  useEffect(() => {
    if (!celebrating || reduceMotion) {
      bounce.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [celebrating, reduceMotion, bounce]);

  useEffect(
    () => () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    },
    []
  );

  function showEncouragement() {
    let idx = Math.floor(Math.random() * MESSAGE_KEYS.length);
    if (MESSAGE_KEYS.length > 1 && idx === lastMsgIndex.current) {
      idx = (idx + 1) % MESSAGE_KEYS.length;
    }
    lastMsgIndex.current = idx;
    setBubbleMsg(t(MESSAGE_KEYS[idx]));

    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);

    if (reduceMotion) {
      bubbleOpacity.setValue(1);
    } else {
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }

    bubbleTimer.current = setTimeout(() => {
      if (reduceMotion) {
        bubbleOpacity.setValue(0);
        setBubbleMsg(null);
        return;
      }
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setBubbleMsg(null));
    }, BUBBLE_VISIBLE_MS);
  }

  let mood = 'sleepy';
  if (streak >= 7) mood = 'happy';
  else if (streak >= 1) mood = 'smiling';

  const badgeEmoji = celebrating ? '🎉' : mood === 'sleepy' ? '🌱' : mood === 'happy' ? '😊' : '🙂';
  const faceBg = colors.accentSofter || '#dcfce7';
  const faceBorder = colors.border || '#e8e3d7';
  const featureColor = colors.text || '#14201a';
  const bubbleBg = colors.surface || '#ffffff';
  const bubbleBorder = colors.border || '#e8e3d7';
  const bubbleText = colors.text || '#14201a';

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={[styles.wrap, style]}>
      {bubbleMsg ? (
        <Animated.View
          style={[styles.bubble, { backgroundColor: bubbleBg, borderColor: bubbleBorder, opacity: bubbleOpacity }]}
        >
          <Text style={[styles.bubbleText, { color: bubbleText }]}>{bubbleMsg}</Text>
        </Animated.View>
      ) : null}
      <Pressable
        onPress={showEncouragement}
        accessibilityRole="button"
        accessibilityLabel={t('companion.a11yLabel')}
        accessibilityHint={t('companion.a11yHint')}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Animated.View
          style={[
            styles.face,
            { backgroundColor: faceBg, borderColor: faceBorder, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.eyesRow}>
            {mood === 'sleepy' ? (
              <>
                <View style={[styles.sleepyEye, { backgroundColor: featureColor }]} />
                <View style={[styles.sleepyEye, { backgroundColor: featureColor }]} />
              </>
            ) : (
              <>
                <View style={[styles.eye, { backgroundColor: featureColor }]} />
                <View style={[styles.eye, { backgroundColor: featureColor }]} />
              </>
            )}
          </View>
          {mood === 'sleepy' ? (
            <View style={[styles.flatMouth, { backgroundColor: featureColor }]} />
          ) : (
            <View
              style={[
                styles.smileMouth,
                mood === 'happy' && styles.smileMouthBig,
                { borderBottomColor: featureColor },
              ]}
            />
          )}
          {mood === 'happy' && (
            <>
              <View style={[styles.cheek, styles.cheekLeft]} />
              <View style={[styles.cheek, styles.cheekRight]} />
            </>
          )}
          <Text style={styles.badge}>{badgeEmoji}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  face: {
    width: FACE_SIZE,
    height: FACE_SIZE,
    borderRadius: FACE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  eye: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sleepyEye: {
    width: 9,
    height: 2,
    borderRadius: 1,
  },
  flatMouth: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  smileMouth: {
    width: 18,
    height: 9,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  smileMouthBig: {
    width: 24,
    height: 12,
  },
  cheek: {
    position: 'absolute',
    bottom: 16,
    width: 7,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#fda4af',
    opacity: 0.55,
  },
  cheekLeft: {
    left: 8,
  },
  cheekRight: {
    right: 8,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    fontSize: 16,
  },
  bubble: {
    maxWidth: 220,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
