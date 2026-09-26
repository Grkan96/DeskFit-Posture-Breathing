import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useThemeColors } from '../lib/theme';
import { useReduceMotion } from './SessionProgress';

const COUNT = 34;
const PALETTE = ['#facc15', '#22c55e', '#38bdf8', '#f472b6', '#fb923c', '#a78bfa'];

// Tamamlanma kutlaması: yukarıdan süzülen konfeti + parıltı. Hareketi azalt
// açıksa hiçbir şey çizmez (sade son ekran çağıran tarafta kalır).
export default function Confetti({ active = true, height = 420 }) {
  const reduce = useReduceMotion();
  const colors = useThemeColors();
  const progress = useRef(new Animated.Value(0)).current;

  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        x: (Math.random() - 0.5) * 300,
        drift: (Math.random() - 0.5) * 80,
        delay: 0.02 + Math.random() * 0.35,
        size: 6 + Math.random() * 6,
        spin: 2 + Math.random() * 4,
        color: PALETTE[i % PALETTE.length],
        round: i % 3 === 0,
      })),
    []
  );

  useEffect(() => {
    if (!active || reduce) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active, reduce]);

  if (!active || reduce) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wrap]} importantForAccessibility="no-hide-descendants">
      {pieces.map((p, i) => {
        const s = p.delay;
        const range = [0, s, 1];
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity: progress.interpolate({ inputRange: [0, s, s + 0.05, 0.8, 1], outputRange: [0, 0, 1, 1, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: range, outputRange: [p.x * 0.3, p.x * 0.3, p.x + p.drift] }) },
                { translateY: progress.interpolate({ inputRange: range, outputRange: [-20, -20, height] }) },
                { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin * 360}deg`] }) },
              ],
            }}
          />
        );
      })}
      <Animated.Text
        style={[
          styles.sparkle,
          {
            color: colors.accent,
            opacity: progress.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1.2, 1] }) }],
          },
        ]}
      >
        ✨
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', overflow: 'hidden' },
  sparkle: { position: 'absolute', top: 40, fontSize: 44 },
});
