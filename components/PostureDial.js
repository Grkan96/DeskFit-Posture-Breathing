import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// "Kadran" enstrüman panosu paleti — bu ekran KASITLI olarak sistem
// açık/koyu temasından bağımsızdır (bkz. HomeScreen.js), bu yüzden renkler
// burada sabit tutulur (lib/theme.js kullanılmaz).
export const DIAL_COLORS = {
  bg: '#1B1D1F',
  track: '#2A2D30',
  amber: '#F2A64B',
  amberSoft: '#5C4423',
  text: '#EDEAE3',
  subtext: '#9A9DA1',
  faint: '#6E7175',
  tickIdle: '#222426',
  tickBorder: '#3A3D41',
};

// Kadran çevresinde 4 tik konumu: üst / sağ / alt / sol (saat 12/3/6/9 hissi).
const TICK_ANGLES_DEG = [-90, 0, 90, 180];
const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// Duruş hatırlatıcısının "kadranı": dıştaki amber ark sonraki hatırlatmaya
// kalan ilerlemeyi gösterir, ortadaki metin geri sayımı/etiketi taşır,
// çevresindeki 4 tik butonu aralık (dakika) seçimini yapar. Tamamen sunum
// katmanıdır — i18n ve zamanlama mantığı HomeScreen.js'de kalır.
export default function PostureDial({
  size = 264,
  strokeWidth = 10,
  progress = 0,
  centerValue,
  centerLabel,
  intervalItems = [],
  onSelectInterval,
  reduceMotion = false,
  tickSize = 46,
  centerAccessibilityLabel,
}) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const clamped = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const progressAnim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(clamped);
      return;
    }
    Animated.timing(progressAnim, {
      toValue: clamped,
      duration: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [clamped, reduceMotion, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={DIAL_COLORS.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={DIAL_COLORS.amber}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      <View
        style={styles.center}
        pointerEvents="none"
        accessible
        accessibilityLabel={centerAccessibilityLabel || `${centerLabel || ''} ${centerValue || ''}`.trim()}
      >
        <Text style={styles.value} importantForAccessibility="no">
          {centerValue}
        </Text>
        {centerLabel ? (
          <Text style={styles.label} importantForAccessibility="no">
            {centerLabel}
          </Text>
        ) : null}
      </View>

      {intervalItems.map((item, index) => {
        const angleDeg = TICK_ANGLES_DEG[index % TICK_ANGLES_DEG.length];
        const angleRad = (angleDeg * Math.PI) / 180;
        const tickCx = cx + radius * Math.cos(angleRad);
        const tickCy = cy + radius * Math.sin(angleRad);
        return (
          <Pressable
            key={item.minutes}
            onPress={() => onSelectInterval && onSelectInterval(item.minutes)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: item.selected }}
            hitSlop={6}
            style={({ pressed }) => [
              styles.tick,
              {
                width: tickSize,
                height: tickSize,
                borderRadius: tickSize / 2,
                left: tickCx - tickSize / 2,
                top: tickCy - tickSize / 2,
              },
              item.selected ? styles.tickSelected : styles.tickIdle,
              pressed && styles.tickPressed,
            ]}
          >
            <Text style={[styles.tickText, item.selected && styles.tickTextSelected]}>
              {item.minutes}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: MONO_FONT,
    fontWeight: '700',
    fontSize: 44,
    letterSpacing: -1,
    color: DIAL_COLORS.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  label: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: DIAL_COLORS.subtext,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tick: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tickIdle: {
    backgroundColor: DIAL_COLORS.tickIdle,
    borderColor: DIAL_COLORS.tickBorder,
  },
  tickSelected: {
    backgroundColor: DIAL_COLORS.amber,
    borderColor: DIAL_COLORS.amber,
  },
  tickPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  tickText: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: DIAL_COLORS.text,
  },
  tickTextSelected: {
    color: DIAL_COLORS.bg,
  },
});
