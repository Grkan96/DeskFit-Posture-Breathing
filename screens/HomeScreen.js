import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostureDial from '../components/PostureDial';
import QuickBreak from '../components/QuickBreak';
import AdBanner from '../components/AdBanner';
import { getStats, getLast7Days } from '../lib/stats';
import { displayStreak, remainingFromTarget, countdownProgress } from '../lib/homeProgress';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

// "Kadran" ekranı: enstrüman panosu hissi (mono rakamlar, amber vurgu) ama
// artık uygulamanın paylaşılan tema sistemini (lib/theme.js) kullanıyor, bu
// yüzden açık/koyu mod sistem ayarına göre otomatik değişir.
const INTERVALS = [15, 30, 45, 60];
const MIN_MINUTES = 1;
const MAX_CUSTOM_MINUTES = 600;

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Yaklaşık geri sayım: çalışma başladığında (veya aralık değiştiğinde) sıfırlanır.
// `nextReminderAt` (ms) verilirse geri sayım doğrudan ona göre işler.
function useCountdown(isRunning, intervalMinutes, nextReminderAt) {
  const [remaining, setRemaining] = useState(intervalMinutes * 60);
  useEffect(() => {
    if (!isRunning) {
      setRemaining(intervalMinutes * 60);
      return undefined;
    }
    const period = intervalMinutes * 60;
    const startedAt = Date.now();
    const tick = () => {
      const exact = remainingFromTarget(nextReminderAt);
      if (exact !== null) {
        setRemaining(exact);
        return;
      }
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(period - (elapsed % period));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRunning, intervalMinutes, nextReminderAt]);
  return remaining;
}

// Minimalist fincan ikonu (feather-icons "coffee" hattı) — MOLA butonunun yanında.
function CupIcon({ size = 16, color = '#000000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8h1a4 4 0 010 8h-1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="6" y1="1" x2="6" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="10" y1="1" x2="10" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="14" y1="1" x2="14" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// 60x32 pill toggle — mockup'taki running/duraklatıldı anahtarı.
function RunToggle({ value, onPress, reduceMotion, colors, accessibilityLabel, accessibilityHint }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(value ? 1 : 0);
      return;
    }
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [value, reduceMotion, anim]);

  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 31] });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accentSoft],
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
      style={styles.toggleHitArea}
    >
      <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.toggleKnob, { left }]} />
      </Animated.View>
    </Pressable>
  );
}

// GÜN SERİ ve (varsa) BUGÜN okumalarını tek bir panelde, aralarında ince bir
// ayraçla gösterir — iki ayrı kutu yerine daha sade tek bir satır.
function StatsPanel({ streak, streakLabel, streakA11y, todayCount, todayLabel, todayA11y, colors }) {
  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.panelItem} accessible accessibilityLabel={streakA11y}>
        <Text style={[styles.panelLabel, { color: colors.subtext }]}>{streakLabel}</Text>
        <Text style={[styles.panelValue, { color: colors.accent }]}>{streak}</Text>
      </View>
      {todayCount > 0 && (
        <>
          <View style={[styles.panelDivider, { backgroundColor: colors.border }]} />
          <View style={styles.panelItem} accessible accessibilityLabel={todayA11y}>
            <Text style={[styles.panelLabel, { color: colors.subtext }]}>{todayLabel}</Text>
            <Text style={[styles.panelValue, { color: colors.accent }]}>{todayCount}</Text>
          </View>
        </>
      )}
    </View>
  );
}

export default function HomeScreen({
  userName,
  isRunning,
  intervalMinutes,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  todayReminderCount,
  onStartStop,
  onIntervalCommit,
  nextReminderAt = null,
}) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [customText, setCustomText] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const remaining = useCountdown(isRunning, intervalMinutes, nextReminderAt);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [breakOpen, setBreakOpen] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduceMotion(v))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const loadStats = useCallback(async () => {
    const s = await getStats();
    if (!mountedRef.current) return;
    setStats(s);
  }, []);

  // Ekran (sekme) odağa gelince ve uygulama ön plana dönünce veriyi yeniden oku.
  useEffect(() => {
    mountedRef.current = true;
    loadStats();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') loadStats();
    });
    return () => {
      mountedRef.current = false;
      sub.remove();
    };
  }, [loadStats]);

  function closeBreak() {
    setBreakOpen(false);
    loadStats();
  }

  function commitCustom() {
    const parsed = parseInt(customText, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(MAX_CUSTOM_MINUTES, Math.max(MIN_MINUTES, parsed));
      onIntervalCommit(clamped);
    }
    setCustomText('');
  }

  function handleToggle() {
    Haptics.impactAsync(
      isRunning ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy
    ).catch(() => {});
    onStartStop();
  }

  function handleSelectInterval(minutes) {
    Haptics.selectionAsync().catch(() => {});
    onIntervalCommit(minutes);
  }

  function handleBreakPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBreakOpen(true);
  }

  const periodSeconds = intervalMinutes * 60;
  const progress = isRunning ? countdownProgress(remaining, periodSeconds) : 0;
  const centerValue = isRunning ? formatCountdown(remaining) : formatCountdown(periodSeconds);
  const centerLabel = isRunning ? t('home.nextReminderLabel') : t('home.statusPaused');

  const days = getLast7Days((stats && stats.history) || {});
  const streak = displayStreak(stats);
  const weekLabels = t('home.weekDays').split(',');

  const statusLabel = isRunning
    ? t('home.statusActiveShort', { minutes: intervalMinutes }) +
      (quietHoursEnabled
        ? t('home.quietSuffix', { start: formatHour(quietStart), end: formatHour(quietEnd) })
        : '')
    : t('home.statusPaused');

  const intervalItems = INTERVALS.map((minutes) => ({
    minutes,
    label: t('home.minutesLabel', { minutes }),
    selected: minutes === intervalMinutes,
  }));

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 10 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.statusGroup}>
            <View
              style={[styles.dot, { backgroundColor: isRunning ? colors.accent : colors.faint }]}
            />
            <Text style={[styles.statusText, { color: colors.subtext }]} numberOfLines={1}>
              {statusLabel}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.faint }]} numberOfLines={1}>
            {userName}
          </Text>
        </View>

        <View style={styles.dialSection}>
          <PostureDial
            centerAccessibilityLabel={
              isRunning
                ? `${t('home.nextReminderLabel')}: ${centerValue}`
                : `${t('home.statusPaused')}: ${centerValue}`
            }
            progress={progress}
            centerValue={centerValue}
            centerLabel={centerLabel}
            intervalItems={intervalItems}
            onSelectInterval={handleSelectInterval}
            reduceMotion={reduceMotion}
          />

          <View style={styles.customRow}>
            <Text style={[styles.customLabel, { color: colors.subtext }]}>
              {t('home.customPlaceholder')}:
            </Text>
            <TextInput
              value={customText}
              onChangeText={(txt) => setCustomText(txt.replace(/[^0-9]/g, ''))}
              onSubmitEditing={commitCustom}
              onBlur={() => customText && commitCustom()}
              placeholder="15–600"
              placeholderTextColor={colors.faint}
              keyboardType="number-pad"
              returnKeyType="done"
              accessibilityLabel={t('home.customInputLabel')}
              style={[
                styles.customInput,
                { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
              ]}
              maxLength={3}
            />
            <Text style={[styles.customLabel, { color: colors.subtext }]}>
              {t('home.minuteUnit')}
            </Text>
          </View>
        </View>

        <View
          style={styles.weekRow}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          {days.map((d, i) => {
            const done = d.count > 0;
            const isToday = i === days.length - 1;
            const name = weekLabels[d.weekday] || '';
            const a11y = `${name}${isToday ? `, ${t('home.weekToday')}` : ''}: ${
              done ? t('home.weekDone') : t('home.weekMissed')
            }`;
            return (
              <View
                key={d.date}
                style={styles.weekCell}
                accessible
                importantForAccessibility="yes"
                accessibilityLabel={a11y}
              >
                <View
                  style={[
                    styles.weekBar,
                    done
                      ? { backgroundColor: colors.accent }
                      : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
                    isToday && { borderWidth: 1.5, borderColor: colors.accent },
                  ]}
                />
                <Text
                  style={[
                    styles.weekLabel,
                    { color: isToday ? colors.accent : colors.faint },
                    isToday && styles.weekLabelToday,
                  ]}
                >
                  {name}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.statsRow}>
          <StatsPanel
            streak={streak}
            streakLabel={t('home.streakPanelLabel')}
            streakA11y={streak > 0 ? t('home.streakA11y', { count: streak }) : t('home.streakNone')}
            todayCount={todayReminderCount}
            todayLabel={t('home.todayPanelLabel')}
            todayA11y={t('home.reminderCount', { count: todayReminderCount })}
            colors={colors}
          />
          <RunToggle
            value={isRunning}
            onPress={handleToggle}
            reduceMotion={reduceMotion}
            colors={colors}
            accessibilityLabel={isRunning ? t('home.stop') : t('home.start')}
            accessibilityHint={isRunning ? t('home.stopHint') : t('home.startHint')}
          />
        </View>

        <View style={styles.breakRow}>
          <Pressable
            onPress={handleBreakPress}
            accessibilityRole="button"
            accessibilityLabel={t('home.breakNow')}
            accessibilityHint={t('home.breakNowHint')}
            style={({ pressed }) => [
              styles.breakButton,
              { borderColor: colors.borderStrong },
              pressed && styles.breakButtonPressed,
            ]}
          >
            <CupIcon size={15} color={colors.text} />
            <Text style={[styles.breakButtonText, { color: colors.text }]}>
              {t('home.breakShortLabel')}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={breakOpen}
        animationType={reduceMotion ? 'none' : 'slide'}
        onRequestClose={closeBreak}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          {breakOpen && <QuickBreak onBack={closeBreak} />}
        </View>
      </Modal>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 26,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  userName: {
    fontFamily: 'monospace',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dialSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  customInput: {
    minWidth: 56,
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontFamily: 'monospace',
    fontSize: 13,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  weekBar: {
    alignSelf: 'stretch',
    height: 28,
    borderRadius: 6,
  },
  weekLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
  weekLabelToday: {
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  panel: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelDivider: {
    width: 1,
    height: '70%',
    marginHorizontal: 14,
  },
  panelLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  panelValue: {
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 20,
  },
  toggleHitArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTrack: {
    width: 60,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
  },
  toggleKnob: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    left: 3,
  },
  breakRow: {
    alignItems: 'flex-end',
  },
  breakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  breakButtonPressed: {
    opacity: 0.7,
  },
  breakButtonText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
