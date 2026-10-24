import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { darkColors } from '../lib/theme';

// Sistem "hareketi azalt" ayarını izler (açıksa animasyonsuz sade arayüz).
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

export function tapHaptic() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {}
}

export function successHaptic() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {}
}

// Nefes aşaması renkleri: al = vurgu, tut = mavi, ver = mor.
export function phaseColor(colors, phaseKey) {
  const dark = colors === darkColors;
  if (phaseKey === 'phaseHold') return dark ? '#60a5fa' : '#2563eb';
  if (phaseKey === 'phaseExhale') return dark ? '#a78bfa' : '#7c3aed';
  return colors.accent;
}

// Kalan süreyi gösteren halka: SVG olmadan, çember üzerinde dizilmiş
// küçük parçalardan oluşur. progress 1 = dolu, 0 = boş.
export function CountdownRing({ size = 220, progress = 1, color, trackColor, thickness = 6, segments = 60, children }) {
  const r = size / 2 - thickness;
  const c = size / 2;
  const lit = Math.round(Math.max(0, Math.min(1, progress)) * segments);
  const w = Math.max(3, (2 * Math.PI * r) / segments - 2);
  const items = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * 2 * Math.PI;
    items.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          width: w,
          height: thickness,
          borderRadius: thickness / 2,
          left: c + r * Math.sin(a) - w / 2,
          top: c - r * Math.cos(a) - thickness / 2,
          backgroundColor: i < lit ? color : trackColor,
          opacity: i < lit ? 1 : 0.5,
          transform: [{ rotate: `${(a * 180) / Math.PI + 90}deg` }],
        }}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {items}
      {children}
    </View>
  );
}

// Adım ilerleme çubuğu: tamamlanan oran yumuşakça dolar.
export function StepProgressBar({ total, current, color, trackColor, reduceMotion, label }) {
  const [width, setWidth] = useState(0);
  const [anim] = useState(() => new Animated.Value(current));
  useEffect(() => {
    if (reduceMotion) anim.setValue(current);
    else Animated.timing(anim, { toValue: current, duration: 350, useNativeDriver: false }).start();
  }, [current, reduceMotion]);
  const fill = anim.interpolate({
    inputRange: [0, Math.max(total, 1)],
    outputRange: [0, width],
    extrapolate: 'clamp',
  });
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: current }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[progressStyles.bar, { backgroundColor: trackColor }]}
    >
      <Animated.View style={[progressStyles.fill, { width: fill, backgroundColor: color }]} />
    </View>
  );
}

export function StepDots({ total, current, activeColor, doneColor, trackColor }) {
  const dots = [];
  for (let i = 0; i < total; i++) {
    dots.push(
      <View
        key={i}
        style={[
          progressStyles.dot,
          { backgroundColor: i === current ? activeColor : i < current ? doneColor : trackColor },
          i === current && progressStyles.dotActive,
        ]}
      />
    );
  }
  return (
    <View style={progressStyles.dots} importantForAccessibility="no-hide-descendants">
      {dots}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  bar: { alignSelf: 'stretch', height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 22 },
});
