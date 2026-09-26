import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ringFraction } from '../lib/homeProgress';

// Bağımlılıksız Apple Activity tarzı halka: iki yarım daire maskesi + dönen kenarlık.
// `count` / `goal` oranında dolar; `celebrateKey` değiştiğinde kutlama zıplaması yapar.
export default function ProgressRing({
  count,
  goal,
  size = 148,
  stroke = 14,
  color,
  trackColor,
  textColor,
  subColor,
  subLabel,
  reduceMotion = false,
  celebrateKey = 0,
  accessibilityLabel,
}) {
  const fraction = ringFraction(count, goal);
  const progress = useRef(new Animated.Value(fraction)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const lastCelebrate = useRef(celebrateKey);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(fraction);
      return;
    }
    Animated.timing(progress, {
      toValue: fraction,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fraction, reduceMotion, progress]);

  useEffect(() => {
    if (celebrateKey === lastCelebrate.current) return;
    lastCelebrate.current = celebrateKey;
    if (reduceMotion) return;
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1.12, duration: 220, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [celebrateKey, reduceMotion, bounce]);

  const half = size / 2;
  const rightRotate = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-135deg', '45deg', '45deg'],
  });
  const leftRotate = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['45deg', '45deg', '225deg'],
  });
  const arc = {
    position: 'absolute',
    top: 0,
    width: size,
    height: size,
    borderRadius: half,
    borderWidth: stroke,
    borderColor: 'transparent',
    borderTopColor: color,
    borderRightColor: color,
  };

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: goal, now: Math.min(count, goal) }}
      style={{ width: size, height: size, transform: [{ scale: bounce }] }}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: stroke,
          borderColor: trackColor,
        }}
      />
      <View style={[styles.half, { left: half, width: half, height: size }]}>
        <Animated.View style={[arc, { left: -half, transform: [{ rotate: rightRotate }] }]} />
      </View>
      <View style={[styles.half, { left: 0, width: half, height: size }]}>
        <Animated.View style={[arc, { left: 0, transform: [{ rotate: leftRotate }] }]} />
      </View>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.count, { color: textColor }]}>{count}</Text>
        {subLabel ? <Text style={[styles.sub, { color: subColor }]}>{subLabel}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  half: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
});
