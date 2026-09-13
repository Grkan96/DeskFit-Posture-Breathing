import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

// Gerçek bir saat kadranı gibi: üstte 0/60 yok, sadece 1-59 arası seçilebilir.
const MIN_MINUTES = 1;
const MAX_MINUTES = 59;
// Yelkovan, tam olarak işaret çizgilerinin bittiği yarıçapa kadar uzanır —
// böylece açı eşleştiğinde ibre işaretin üzerinden doğrudan geçer.
const HAND_OUTER_RADIUS = 92;
const HAND_INNER_RADIUS = 42;
const HAND_WIDTH = 6;

function angleForMinutes(minutes) {
  return (minutes % 60) * 6;
}

function minutesForPoint(x, y, center) {
  const dx = x - center;
  const dy = y - center;
  let angleRad = Math.atan2(dx, -dy);
  if (angleRad < 0) angleRad += 2 * Math.PI;
  const degrees = (angleRad * 180) / Math.PI;
  return Math.round(degrees / 6) % 60;
}

function clamp(m) {
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, m));
}

// 0 (üst/60) hariç, her 5 dakikada bir işaret: 5,10,...,55.
const TICKS = Array.from({ length: 11 }, (_, i) => i + 1);
const LABELS = [
  { minutes: 15, position: 90 },
  { minutes: 30, position: 180 },
  { minutes: 45, position: 270 },
];

export default function CircularDial({ minutes, onChange, size = 220 }) {
  const [dragging, setDragging] = useState(false);
  const [liveMinutes, setLiveMinutes] = useState(minutes);

  const center = size / 2;
  const displayMinutes = dragging ? liveMinutes : minutes;
  const angleDeg = angleForMinutes(displayMinutes);

  function updateFromEvent(evt) {
    const { x, y } = evt.nativeEvent;
    return clamp(minutesForPoint(x, y, center));
  }

  function onGestureEvent(evt) {
    setLiveMinutes(updateFromEvent(evt));
  }

  function onHandlerStateChange(evt) {
    const { state } = evt.nativeEvent;
    if (state === State.BEGAN) {
      setDragging(true);
      setLiveMinutes(updateFromEvent(evt));
    } else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      const m = updateFromEvent(evt);
      setDragging(false);
      onChange(m);
    }
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      shouldCancelWhenOutside={false}
    >
      <View style={[styles.dial, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {TICKS.map((i) => {
            const major = i % 3 === 0;
            return (
              <View
                key={i}
                style={[styles.tickPivot, { transform: [{ rotate: `${i * 30}deg` }] }]}
              >
                <View style={[styles.tick, major && styles.tickMajor]} />
              </View>
            );
          })}
          {LABELS.map(({ minutes: m, position }) => (
            <View
              key={m}
              style={[styles.tickPivot, { transform: [{ rotate: `${position}deg` }] }]}
            >
              <Text style={[styles.markLabel, { transform: [{ rotate: `${-position}deg` }] }]}>
                {m}
              </Text>
            </View>
          ))}
        </View>

        {/* Yelkovan: merkezden kadranın kenarına uzanan, dönen bir ibre */}
        <View
          style={[styles.handPivot, { transform: [{ rotate: `${angleDeg}deg` }] }]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.hand,
              { top: center - HAND_OUTER_RADIUS, left: center - HAND_WIDTH / 2 },
            ]}
          />
        </View>

        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={styles.centerValue}>{displayMinutes}</Text>
          <Text style={styles.centerUnit}>dakika</Text>
        </View>
      </View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  dial: {
    backgroundColor: '#ffffff',
    borderWidth: 14,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tickPivot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  tick: {
    width: 2,
    height: 10,
    marginTop: 6,
    borderRadius: 1,
    backgroundColor: '#cbd5e1',
  },
  tickMajor: {
    width: 3,
    height: 14,
    backgroundColor: '#86efac',
  },
  markLabel: {
    marginTop: 22,
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  handPivot: {
    ...StyleSheet.absoluteFillObject,
  },
  hand: {
    position: 'absolute',
    width: HAND_WIDTH,
    height: HAND_OUTER_RADIUS - HAND_INNER_RADIUS,
    borderRadius: HAND_WIDTH / 2,
    backgroundColor: '#16a34a',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0f172a',
  },
  centerUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: -2,
  },
});
