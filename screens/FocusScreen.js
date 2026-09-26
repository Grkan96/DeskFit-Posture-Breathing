import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useKeepAwake } from 'expo-keep-awake';
import { scheduleFocusBreakNotification, cancelFocusNotifications } from '../lib/notifications';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const STATE_KEY = 'durus-hatirlatici/focus-state';
const LOG_KEY = 'durus-hatirlatici/focus-log';
const LOG_KEEP_DAYS = 90;
const TICK_MS = 500;

// Çalışma/mola süreleri (dakika).
const PRESETS = [
  { id: '25-5', work: 25, break: 5 },
  { id: '50-10', work: 50, break: 10 },
  { id: '90-15', work: 90, break: 15 },
];

const INITIAL_STATE = {
  presetId: '25-5',
  phase: 'work', // 'work' | 'break'
  status: 'idle', // 'idle' | 'running' | 'paused'
  endAt: null, // çalışırken: fazın biteceği an (ms, Date.now() cinsinden)
  remainingMs: null, // duraklatılmışken: kalan süre
};

function getPreset(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

function phaseDurationMs(presetId, phase) {
  const preset = getPreset(presetId);
  return (phase === 'break' ? preset.break : preset.work) * 60 * 1000;
}

// Yerel (cihaz saat dilimine göre) gün anahtarı — toISOString() UTC olduğu
// için gece yarısı civarında yanlış güne yazardı.
function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Zamanlayıcıyı "şimdi"ye kadar ilerletir. Uygulama arka plandayken ya da
// kapalıyken biten fazları da yakalar: çalışma bittiyse tur sayılır ve mola
// çalışma bitiş anından itibaren başlar; mola da bittiyse zamanlayıcı yeni
// bir çalışma turu için beklemeye geçer.
function advance(state, now) {
  let next = state;
  const completedDays = [];
  while (next.status === 'running' && next.endAt != null && next.endAt <= now) {
    if (next.phase === 'work') {
      completedDays.push(localDateKey(new Date(next.endAt)));
      next = {
        ...next,
        phase: 'break',
        endAt: next.endAt + phaseDurationMs(next.presetId, 'break'),
      };
    } else {
      next = { ...next, phase: 'work', status: 'idle', endAt: null, remainingMs: null };
    }
  }
  return { next, completedDays };
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function pruneLog(log) {
  const cutoff = localDateKey(new Date(Date.now() - LOG_KEEP_DAYS * 24 * 60 * 60 * 1000));
  const pruned = {};
  for (const key of Object.keys(log)) {
    if (key >= cutoff) pruned[key] = log[key];
  }
  return pruned;
}

async function ensureNotificationPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch (e) {
    return false;
  }
}

function hapticPhaseChange() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch (e) {
    // Titreşim desteklenmiyorsa sessizce geç.
  }
}

// useKeepAwake bir hook olduğu için koşullu çağrılamaz; bu bileşen yalnızca
// zamanlayıcı çalışırken render edilir ve ekranın kapanmasını engeller.
function KeepAwakeWhileRunning() {
  useKeepAwake('focus-timer');
  return null;
}

export default function FocusScreen({ onOpenMeditation }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();

  const [loaded, setLoaded] = useState(false);
  const [timer, setTimer] = useState(INITIAL_STATE);
  const [log, setLog] = useState({});
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef(timer);
  timerRef.current = timer;

  // Tamamlanan turları günlük kayda ekler ve kaydı saklar.
  function recordRounds(days) {
    if (days.length === 0) return;
    setLog((prev) => {
      const next = { ...prev };
      for (const day of days) next[day] = (next[day] || 0) + 1;
      const pruned = pruneLog(next);
      AsyncStorage.setItem(LOG_KEY, JSON.stringify(pruned)).catch(() => {});
      return pruned;
    });
  }

  // Zamanlayıcıyı güncel zamana göre ilerletir. `withHaptic` sadece uygulama
  // açıkken canlı faz geçişinde true — arka plandan dönüşte titreşim yok.
  function sync(withHaptic) {
    const current = Date.now();
    setNow(current);
    const { next, completedDays } = advance(timerRef.current, current);
    if (next !== timerRef.current) {
      timerRef.current = next;
      setTimer(next);
      recordRounds(completedDays);
      if (withHaptic) hapticPhaseChange();
    }
  }

  // Açılışta kayıtlı zamanlayıcı durumunu ve tur kaydını yükle.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let restored = INITIAL_STATE;
      let savedLog = {};
      try {
        const [rawState, rawLog] = await Promise.all([
          AsyncStorage.getItem(STATE_KEY),
          AsyncStorage.getItem(LOG_KEY),
        ]);
        if (rawLog) {
          const parsed = JSON.parse(rawLog);
          if (parsed && typeof parsed === 'object') savedLog = parsed;
        }
        if (rawState) {
          const parsed = JSON.parse(rawState);
          if (
            parsed &&
            PRESETS.some((p) => p.id === parsed.presetId) &&
            ['work', 'break'].includes(parsed.phase) &&
            ['idle', 'running', 'paused'].includes(parsed.status)
          ) {
            restored = { ...INITIAL_STATE, ...parsed };
          }
        }
      } catch (e) {
        // Bozuk kayıt: varsayılanlarla devam et.
      }
      if (cancelled) return;
      const { next, completedDays } = advance(restored, Date.now());
      for (const day of completedDays) savedLog[day] = (savedLog[day] || 0) + 1;
      if (completedDays.length > 0) {
        AsyncStorage.setItem(LOG_KEY, JSON.stringify(pruneLog(savedLog))).catch(() => {});
      }
      timerRef.current = next;
      setTimer(next);
      setLog(pruneLog(savedLog));
      setNow(Date.now());
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Durum her değiştiğinde kalıcı hale getir (uygulama yeniden başlasa da sürsün).
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(timer)).catch(() => {});
  }, [loaded, timer]);

  // Çalışırken periyodik olarak kalan süreyi Date.now()'dan yeniden hesapla.
  useEffect(() => {
    if (timer.status !== 'running') return undefined;
    const id = setInterval(() => sync(true), TICK_MS);
    return () => clearInterval(id);
  }, [timer.status]);

  // Arka plandan öne gelince hemen senkronize et.
  useEffect(() => {
    try {
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') sync(false);
      });
      return () => subscription.remove();
    } catch (e) {
      return undefined;
    }
  }, []);

  function handlePresetSelect(presetId) {
    if (timer.status !== 'idle') return;
    setTimer({ ...INITIAL_STATE, presetId });
  }

  async function handleStart() {
    const current = Date.now();
    const remaining =
      timer.status === 'paused' && timer.remainingMs != null
        ? timer.remainingMs
        : phaseDurationMs(timer.presetId, timer.phase);
    const endAt = current + remaining;
    const next = { ...timer, status: 'running', endAt, remainingMs: null };
    timerRef.current = next;
    setNow(current);
    setTimer(next);

    // Çalışma bloğu başlıyorsa bitişinde "mola başladı" bildirimi zamanla.
    if (next.phase === 'work') {
      const ok = await ensureNotificationPermission();
      if (!ok) return;
      try {
        await scheduleFocusBreakNotification({
          endAt,
          breakMinutes: getPreset(next.presetId).break,
        });
      } catch (e) {
        // Bildirim zamanlanamasa da zamanlayıcı uygulama içinde çalışır.
      }
    }
  }

  async function handlePause() {
    const current = Date.now();
    const next = {
      ...timer,
      status: 'paused',
      remainingMs: Math.max(0, (timer.endAt || current) - current),
      endAt: null,
    };
    timerRef.current = next;
    setTimer(next);
    try {
      await cancelFocusNotifications();
    } catch (e) {
      // İptal başarısız olursa bildirim yine de gelebilir; kritik değil.
    }
  }

  async function handleReset() {
    const next = { ...INITIAL_STATE, presetId: timer.presetId };
    timerRef.current = next;
    setTimer(next);
    try {
      await cancelFocusNotifications();
    } catch (e) {
      // İptal başarısız olursa bildirim yine de gelebilir; kritik değil.
    }
  }

  const totalMs = phaseDurationMs(timer.presetId, timer.phase);
  let remainingMs = totalMs;
  if (timer.status === 'running' && timer.endAt != null) {
    remainingMs = Math.max(0, timer.endAt - now);
  } else if (timer.status === 'paused' && timer.remainingMs != null) {
    remainingMs = timer.remainingMs;
  }
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0;
  const isBreak = timer.phase === 'break';
  const isRunning = timer.status === 'running';
  const todayRounds = log[localDateKey(new Date(now))] || 0;

  if (!loaded) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isRunning && <KeepAwakeWhileRunning />}

      <Text style={styles.header}>{t('focus.header')}</Text>
      <Text style={styles.subtitle}>{t('focus.subtitle')}</Text>

      <Text style={styles.sectionLabel}>{t('focus.presetLabel')}</Text>
      <View style={styles.presetRow}>
        {PRESETS.map((preset) => {
          const selected = preset.id === timer.presetId;
          const locked = timer.status !== 'idle';
          return (
            <Pressable
              key={preset.id}
              onPress={() => handlePresetSelect(preset.id)}
              disabled={locked}
              style={[
                styles.preset,
                selected && styles.presetSelected,
                locked && !selected && styles.presetLocked,
              ]}
            >
              <Text style={[styles.presetText, selected && styles.presetTextSelected]}>
                {t('focus.presetValue', { work: preset.work, break: preset.break })}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {timer.status !== 'idle' && <Text style={styles.hint}>{t('focus.presetLocked')}</Text>}

      <View style={[styles.timerCard, isBreak && styles.timerCardBreak]}>
        <Text style={styles.phaseLabel}>
          {isBreak ? t('focus.breakPhase') : t('focus.workPhase')}
        </Text>
        <Text style={styles.countdown}>{formatTime(remainingMs)}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              isBreak && styles.progressFillBreak,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={isRunning ? handlePause : handleStart}
        >
          <Text style={styles.primaryButtonText}>
            {isRunning
              ? t('focus.pause')
              : timer.status === 'paused'
                ? t('focus.resume')
                : t('focus.start')}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          onPress={handleReset}
          disabled={timer.status === 'idle'}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              timer.status === 'idle' && styles.secondaryButtonTextDisabled,
            ]}
          >
            {t('focus.reset')}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.rounds}>{t('focus.roundsToday', { count: todayRounds })}</Text>

      {isBreak && (
        <View style={styles.breakCard}>
          <Text style={styles.breakCardTitle}>{t('focus.breakCardTitle')}</Text>
          <Pressable
            style={({ pressed }) => [styles.breakCardButton, pressed && styles.pressed]}
            onPress={() => onOpenMeditation && onOpenMeditation()}
          >
            <Text style={styles.breakCardButtonText}>{t('focus.breakCardButton')}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      padding: 24,
      paddingBottom: 40,
    },
    header: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginTop: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
      marginBottom: 8,
    },
    presetRow: {
      flexDirection: 'row',
      gap: 8,
    },
    preset: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    presetSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSofter,
    },
    presetLocked: {
      opacity: 0.5,
    },
    presetText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.subtext,
    },
    presetTextSelected: {
      color: colors.accentText,
    },
    hint: {
      fontSize: 12,
      color: colors.faint,
      marginTop: 6,
    },
    timerCard: {
      marginTop: 24,
      paddingVertical: 28,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    timerCardBreak: {
      borderColor: colors.accent,
    },
    phaseLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.subtext,
    },
    countdown: {
      fontSize: 64,
      fontWeight: '700',
      color: colors.text,
      marginVertical: 12,
      fontVariant: ['tabular-nums'],
    },
    progressTrack: {
      alignSelf: 'stretch',
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.inputBg,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    progressFillBreak: {
      backgroundColor: colors.accentSoft,
    },
    controls: {
      marginTop: 20,
      flexDirection: 'row',
      gap: 12,
    },
    primaryButton: {
      flex: 2,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButtonTextDisabled: {
      color: colors.faint,
    },
    pressed: {
      opacity: 0.8,
    },
    rounds: {
      marginTop: 20,
      fontSize: 15,
      fontWeight: '600',
      color: colors.subtext,
      textAlign: 'center',
    },
    breakCard: {
      marginTop: 20,
      padding: 18,
      borderRadius: 16,
      backgroundColor: colors.accentSofter,
      gap: 12,
    },
    breakCardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accentText,
      textAlign: 'center',
    },
    breakCardButton: {
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    breakCardButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
