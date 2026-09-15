import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../lib/theme';

const MIN_MINUTES = 1;
const MAX_MINUTES = 60;
const ITEM_WIDTH = 16;
const ARROW_ZONE = 10;
const TRACK_HEIGHT = 30;
const LABEL_ZONE = 18;
const RULER_HEIGHT = ARROW_ZONE + TRACK_HEIGHT + LABEL_ZONE;

function clamp(m) {
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, m));
}

const TICK_VALUES = Array.from(
  { length: MAX_MINUTES - MIN_MINUTES + 1 },
  (_, i) => i + MIN_MINUTES
);

export default function TimeSlider({ minutes, onChange }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastTickRef = useRef(minutes);
  const [containerWidth, setContainerWidth] = useState(0);
  const [liveMinutes, setLiveMinutes] = useState(minutes);

  const sidePadding = containerWidth / 2 - ITEM_WIDTH / 2;

  // Dışarıdan (ör. hazır seçenek çipleri) değer değiştiğinde cetveli oraya kaydır.
  useEffect(() => {
    if (isDraggingRef.current || containerWidth === 0) return;
    setLiveMinutes(minutes);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: (minutes - MIN_MINUTES) * ITEM_WIDTH, animated: true });
    }
  }, [minutes, containerWidth]);

  function valueFromOffset(offsetX) {
    return clamp(Math.round(offsetX / ITEM_WIDTH) + MIN_MINUTES);
  }

  function handleScroll(evt) {
    const v = valueFromOffset(evt.nativeEvent.contentOffset.x);
    setLiveMinutes(v);
    if (v !== lastTickRef.current) {
      Haptics.selectionAsync();
      lastTickRef.current = v;
    }
  }

  function commitFromOffset(offsetX) {
    const v = valueFromOffset(offsetX);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(v);
  }

  function handleScrollEndDrag(evt) {
    const { velocity, contentOffset } = evt.nativeEvent;
    if (!velocity || Math.abs(velocity.x) < 0.05) {
      isDraggingRef.current = false;
      commitFromOffset(contentOffset.x);
    }
  }

  function handleMomentumScrollEnd(evt) {
    isDraggingRef.current = false;
    commitFromOffset(evt.nativeEvent.contentOffset.x);
  }

  return (
    <View style={styles.card}>
      <View style={styles.valueRow}>
        <Text style={styles.valueNumber}>{liveMinutes}</Text>
        <Text style={styles.valueUnit}>dakika</Text>
      </View>

      <View
        style={styles.rulerWrap}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {containerWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            scrollEventThrottle={16}
            contentOffset={{ x: (minutes - MIN_MINUTES) * ITEM_WIDTH, y: 0 }}
            contentContainerStyle={{ paddingHorizontal: sidePadding }}
            onScroll={handleScroll}
            onScrollBeginDrag={() => {
              isDraggingRef.current = true;
            }}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            accessibilityRole="adjustable"
            accessibilityLabel="Hatırlatma aralığı kaydırıcısı"
            accessibilityValue={{ min: MIN_MINUTES, max: MAX_MINUTES, now: liveMinutes }}
          >
            {TICK_VALUES.map((v) => {
              const major = v % 5 === 0;
              return (
                <View key={v} style={styles.tickItem}>
                  <View style={styles.arrowSpacer} />
                  <View style={styles.tickBaseline}>
                    <View style={[styles.tick, major && styles.tickMajor]} />
                  </View>
                  <Text style={styles.tickLabel}>{major ? v : ''}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.indicatorArrow} pointerEvents="none" />
        <View style={styles.indicatorLine} pointerEvents="none" />
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    valueRow: {
      alignItems: 'center',
      marginBottom: 12,
    },
    valueNumber: {
      fontSize: 40,
      fontWeight: '800',
      color: colors.text,
    },
    valueUnit: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.faint,
      marginTop: -2,
    },
    rulerWrap: {
      height: RULER_HEIGHT,
    },
    tickItem: {
      width: ITEM_WIDTH,
      alignItems: 'center',
    },
    arrowSpacer: {
      height: ARROW_ZONE,
    },
    tickBaseline: {
      height: TRACK_HEIGHT,
      justifyContent: 'flex-end',
    },
    tick: {
      width: 2,
      height: 12,
      borderRadius: 1,
      backgroundColor: colors.border,
    },
    tickMajor: {
      width: 2.5,
      height: TRACK_HEIGHT,
      backgroundColor: colors.accentSoft,
    },
    tickLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '700',
      color: colors.faint,
      height: LABEL_ZONE - 4,
    },
    indicatorArrow: {
      position: 'absolute',
      top: 0,
      left: '50%',
      marginLeft: -6,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: ARROW_ZONE,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: colors.accent,
    },
    indicatorLine: {
      position: 'absolute',
      top: ARROW_ZONE,
      left: '50%',
      marginLeft: -1,
      width: 2,
      height: TRACK_HEIGHT,
      backgroundColor: colors.accent,
      borderRadius: 1,
    },
  });
}
