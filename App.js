import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ensureChannels,
  ensureNotificationCategories,
  isPostureReminderScheduled,
  cancelPostureReminders,
  scheduleReminder,
  scheduleSnooze,
  sendTestNotification,
  setEyeRestReminders,
  SNOOZE_ACTION,
  DONE_ACTION,
  POSTURE_CATEGORY,
  getNextPostureReminderAt,
} from './lib/notifications';
import { refreshStreakAlerts } from './lib/streakAlert';
import { DEFAULT_WORK_SCHEDULE, DEFAULT_STREAK_ALERT } from './lib/schedule';
import { initializeAds } from './lib/ads';
import { getTodayReminderCount, incrementTodayReminderCount } from './lib/reminderLog';
import { useThemeColors } from './lib/theme';
import NameScreen from './screens/NameScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import MeditationScreen from './screens/MeditationScreen';
import SettingsScreen from './screens/SettingsScreen';
import TabBar from './components/TabBar';
import StatsScreen from './screens/StatsScreen';

const SETTINGS_KEY = 'durus-hatirlatici/settings';
const NAME_KEY = 'durus-hatirlatici/username';
const ONBOARDING_KEY = 'durus-hatirlatici/onboarding-seen';
// Kullanıcı START'a bastıysa 'true'; STOP'ta silinir. Bildirim kuyruğu boşalsa
// bile arayüzün 'çalışıyor' göstermesini ve kuyruğun yeniden dolmasını sağlar.
const RUNNING_KEY = 'durus-hatirlatici/running';
// Kuyruk yenilemeleri arası asgari süre (bildirim başına gereksiz yeniden
// zamanlamayı önler).
const REFILL_MIN_GAP_MS = 30 * 1000;

function sanitizeWorkSchedule(saved) {
  const base = DEFAULT_WORK_SCHEDULE;
  if (!saved || typeof saved !== 'object') return base;
  const validHour = (h, d) => (Number.isInteger(h) && h >= 0 && h < 24 ? h : d);
  return {
    enabled: saved.enabled === true,
    days: Array.isArray(saved.days)
      ? saved.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : base.days,
    start: validHour(saved.start, base.start),
    end: validHour(saved.end, base.end),
  };
}

function sanitizeStreakAlert(saved) {
  const base = DEFAULT_STREAK_ALERT;
  if (!saved || typeof saved !== 'object') return base;
  return {
    enabled: saved.enabled !== false,
    minutes:
      Number.isInteger(saved.minutes) && saved.minutes >= 0 && saved.minutes < 1440
        ? saved.minutes
        : base.minutes,
  };
}

export default function App() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [userName, setUserName] = useState('');
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const [isRunning, setIsRunning] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [alertMode, setAlertMode] = useState('sound');
  const [vibrationIntensity, setVibrationIntensity] = useState('medium');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState(23);
  const [quietEnd, setQuietEnd] = useState(8);
  const [eyeRestEnabled, setEyeRestEnabled] = useState(false);
  const [workSchedule, setWorkSchedule] = useState(DEFAULT_WORK_SCHEDULE);
  const [streakAlert, setStreakAlert] = useState(DEFAULT_STREAK_ALERT);
  const [todayReminderCount, setTodayReminderCount] = useState(0);
  const [nextReminderAt, setNextReminderAt] = useState(null);
  // Kayıtlı ayarlar gerçekten okunup uygulanmadan diske yazma yapılmaz
  // (4 sn'lik fail-safe arayüzü açsa bile varsayılanlar kayıtlıyı ezmesin).
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  // Dinleyicilerin (bir kez kurulan) her zaman güncel değerleri görmesi için.
  const latest = useRef({});
  const lastRefillAt = useRef(0);
  latest.current = {
    bootstrapped,
    isRunning,
    intervalMinutes,
    alertMode,
    vibrationIntensity,
    quietHoursEnabled,
    quietStart,
    quietEnd,
    eyeRestEnabled,
    workSchedule,
    streakAlert,
    userName,
  };

  async function refreshNextReminder() {
    setNextReminderAt(await getNextPostureReminderAt());
  }

  // Kuyrukları bugünden itibaren yeniden doldurur (iOS 64 sınırı ve sonlu
  // kuyruk nedeniyle): bildirim ulaşınca ve uygulama öne gelince çağrılır.
  async function refillQueues(force = false) {
    const c = latest.current;
    if (!c.bootstrapped) return;
    const t = Date.now();
    if (!force && t - lastRefillAt.current < REFILL_MIN_GAP_MS) return;
    lastRefillAt.current = t;
    try {
      if (c.isRunning) {
        await scheduleReminder({
          intervalMinutes: c.intervalMinutes,
          alertMode: c.alertMode,
          vibrationIntensity: c.vibrationIntensity,
          quietHoursEnabled: c.quietHoursEnabled,
          quietStart: c.quietStart,
          quietEnd: c.quietEnd,
          workSchedule: c.workSchedule,
          userName: c.userName,
        });
      }
      if (c.eyeRestEnabled) {
        await setEyeRestReminders({
          enabled: true,
          quietHoursEnabled: c.quietHoursEnabled,
          quietStart: c.quietStart,
          quietEnd: c.quietEnd,
          workSchedule: c.workSchedule,
          userName: c.userName,
        });
      }
      await refreshStreakAlerts({ streakAlert: c.streakAlert });
    } catch (e) {}
    refreshNextReminder();
  }

  useEffect(() => {
    // Aşağıdaki adımlardan biri (örn. bildirim API'si) hiç yanıt vermezse
    // uygulama sonsuza kadar "yükleniyor" ekranında kalmasın diye emniyet.
    const failSafe = setTimeout(() => setBootstrapped(true), 4000);
    (async () => {
      let settings = {
        intervalMinutes,
        alertMode,
        vibrationIntensity,
        quietHoursEnabled,
        quietStart,
        quietEnd,
        eyeRestEnabled,
        workSchedule,
        streakAlert,
      };
      let name = '';
      let runningFlag = false;
      try {
        // Önce depolamadan oku (native bildirim adımları takılsa bile ayarlar
        // yüklensin ve güvenle kaydedilebilsin).
        const savedName = await AsyncStorage.getItem(NAME_KEY);
        if (savedName) name = savedName;

        const seenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingSeen(seenOnboarding === 'true');

        runningFlag = (await AsyncStorage.getItem(RUNNING_KEY)) === 'true';

        // getItem hata verirse dış catch'e düşer: settingsLoaded açılmaz.
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        // Bozuk ayar verisi kullanıcı adını/kuyruk yenilemeyi engellemesin diye
        // ayrı try/catch (yoksa isim state'e hiç yazılmaz, NameScreen tekrar çıkar).
        let saved = null;
        try {
          const p = raw ? JSON.parse(raw) : null;
          if (p && typeof p === 'object' && !Array.isArray(p)) saved = p;
        } catch (e) {}
        if (saved) {
          if (Number.isInteger(saved.intervalMinutes) && saved.intervalMinutes >= 1 && saved.intervalMinutes <= 1440) {
            settings.intervalMinutes = saved.intervalMinutes;
          }
          if (['silent', 'vibrate', 'sound'].includes(saved.alertMode)) {
            settings.alertMode = saved.alertMode;
          } else if (typeof saved.soundEnabled === 'boolean') {
            // Eski ayar biçiminden göç: sesli aç/kapa -> yeni 3'lü mod.
            settings.alertMode = saved.soundEnabled ? 'sound' : 'vibrate';
          }
          if (['light', 'medium', 'strong'].includes(saved.vibrationIntensity)) {
            settings.vibrationIntensity = saved.vibrationIntensity;
          }
          settings.quietHoursEnabled = saved.quietHoursEnabled === true;
          if (Number.isInteger(saved.quietStart) && saved.quietStart >= 0 && saved.quietStart < 24) {
            settings.quietStart = saved.quietStart;
          }
          if (Number.isInteger(saved.quietEnd) && saved.quietEnd >= 0 && saved.quietEnd < 24) {
            settings.quietEnd = saved.quietEnd;
          }
          settings.eyeRestEnabled = saved.eyeRestEnabled === true;
          settings.workSchedule = sanitizeWorkSchedule(saved.workSchedule);
          settings.streakAlert = sanitizeStreakAlert(saved.streakAlert);
        }

        setUserName(name);
        setIntervalMinutes(settings.intervalMinutes);
        setAlertMode(settings.alertMode);
        setVibrationIntensity(settings.vibrationIntensity);
        setQuietHoursEnabled(settings.quietHoursEnabled);
        setQuietStart(settings.quietStart);
        setQuietEnd(settings.quietEnd);
        setEyeRestEnabled(settings.eyeRestEnabled);
        setWorkSchedule(settings.workSchedule);
        setStreakAlert(settings.streakAlert);
        setIsRunning(runningFlag); // kalıcı bayrak: kuyruk boş olsa da 'çalışıyor'
        setSettingsLoaded(true);
        setTodayReminderCount(await getTodayReminderCount());
      } catch (e) {
        // Depolama okunamazsa varsayılanlarla devam et; settingsLoaded false
        // kaldığı için bu oturumda ayarlar diske YAZILMAZ (kayıtlı veri ezilmez).
      }

      try {
        // Kanal kurulumu (veya herhangi bir adım) başarısız olsa bile
        // uygulama sonsuza kadar "yükleniyor" ekranında kalmamalı.
        await ensureChannels();
        await ensureNotificationCategories();
        initializeAds();

        const perm = await Notifications.getPermissionsAsync();
        // Bayrak yoksa eski sürümden göç: kuyrukta duruş bildirimi varsa çalışıyordu.
        let wasRunning = runningFlag || (await isPostureReminderScheduled());
        if (wasRunning && !perm.granted) {
          // İzin geri alınmış: hiçbir şey gösterilemez, 'çalışıyor' yalan olur.
          wasRunning = false;
          await cancelPostureReminders();
          await AsyncStorage.removeItem(RUNNING_KEY).catch(() => {});
        }
        setIsRunning(wasRunning);
        // Zamanlama sonlu bir kuyruk olduğu için, uygulama her açıldığında
        // kuyruğu bugünden itibaren yeniden doldur.
        if (wasRunning) {
          await AsyncStorage.setItem(RUNNING_KEY, 'true').catch(() => {});
          await scheduleReminder({ ...settings, userName: name });
        }
        if (settings.eyeRestEnabled && perm.granted) {
          await setEyeRestReminders({
            enabled: true,
            quietHoursEnabled: settings.quietHoursEnabled,
            quietStart: settings.quietStart,
            quietEnd: settings.quietEnd,
            workSchedule: settings.workSchedule,
            userName: name,
          });
        }
        // İzin açıkça reddedilmişse seri uyarısı ayarı 'açık' görünüp boşa
        // durmasın: kapalıya çevir (henüz sorulmadıysa dokunma).
        let streak = settings.streakAlert;
        if (streak.enabled && perm.status === 'denied' && !perm.canAskAgain) {
          streak = { ...streak, enabled: false };
          setStreakAlert(streak);
        }
        await refreshStreakAlerts({ streakAlert: streak });
        setNextReminderAt(await getNextPostureReminderAt());
      } catch (e) {
        // Bildirim adımları başarısızsa uygulama yine açılsın
      }
      clearTimeout(failSafe);
      setBootstrapped(true);
    })();
    return () => clearTimeout(failSafe);
  }, []);

  // Bir duruş hatırlatma bildirimi ulaştığında günlük sayacı artır.
  // Dinleyici kurulumu (native modül tarafında) beklenmedik şekilde hata
  // verirse bile bu, tüm uygulamayı çökertmesin diye try/catch ile sarıldı.
  useEffect(() => {
    try {
      const subscription = Notifications.addNotificationReceivedListener((notification) => {
        const category =
          notification && notification.request && notification.request.content
            ? notification.request.content.categoryIdentifier
            : null;
        if (category === POSTURE_CATEGORY) {
          incrementTodayReminderCount().then(setTodayReminderCount);
        }
        // Bir bildirim tükendi: kuyruğu tazele (iOS 64 sınırı / sonlu kuyruk).
        refillQueues();
      });
      return () => subscription.remove();
    } catch (e) {
      // Dinleyici kurulamadıysa günlük sayaç güncellenmez, uygulamanın geri
      // kalanı normal çalışmaya devam eder.
    }
  }, []);

  // Bildirimdeki "Ertele"/"Yaptım" butonlarına basılınca çalışır. Güncel
  // ayarları kullanabilmek için alertMode/vibrationIntensity/userName
  // değiştikçe dinleyici yeniden kurulur (eski değerlere takılı kalmasın diye).
  useEffect(() => {
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const action = response.actionIdentifier;
        if (action === SNOOZE_ACTION) {
          scheduleSnooze({ alertMode, vibrationIntensity, userName });
        }
        // DONE_ACTION için ek bir işlem gerekmiyor, bildirim kendiliğinden kapanır.
      });
      return () => subscription.remove();
    } catch (e) {
      // Dinleyici kurulamadıysa "Ertele"/"Yaptım" butonları çalışmaz, ama
      // uygulama çökmez.
    }
  }, [alertMode, vibrationIntensity, userName]);

  // Uygulama arka plandan öne gelince kuyrukları tazele.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refillQueues();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        intervalMinutes,
        alertMode,
        vibrationIntensity,
        quietHoursEnabled,
        quietStart,
        quietEnd,
        eyeRestEnabled,
        workSchedule,
        streakAlert,
      })
    ).catch(() => {});
  }, [
    settingsLoaded,
    intervalMinutes,
    alertMode,
    vibrationIntensity,
    quietHoursEnabled,
    quietStart,
    quietEnd,
    eyeRestEnabled,
    workSchedule,
    streakAlert,
  ]);

  async function requestPermission() {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  }

  function currentSettings(overrides = {}) {
    return {
      intervalMinutes,
      alertMode,
      vibrationIntensity,
      quietHoursEnabled,
      quietStart,
      quietEnd,
      workSchedule,
      userName,
      ...overrides,
    };
  }

  async function reschedulePosture(settings) {
    await scheduleReminder(settings);
    await refreshNextReminder();
  }

  async function refreshEyeRest(overrides = {}) {
    await setEyeRestReminders({
      enabled: eyeRestEnabled,
      quietHoursEnabled,
      quietStart,
      quietEnd,
      workSchedule,
      userName,
      ...overrides,
    });
  }

  async function handleNameSubmit(name) {
    setUserName(name);
    await AsyncStorage.setItem(NAME_KEY, name).catch(() => {});
    if (isRunning) {
      await reschedulePosture(currentSettings({ userName: name }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ userName: name });
    }
  }

  async function handleStartStop() {
    if (isRunning) {
      await cancelPostureReminders();
      await AsyncStorage.removeItem(RUNNING_KEY).catch(() => {});
      setIsRunning(false);
      setNextReminderAt(null);
      return;
    }
    const ok = await requestPermission();
    if (!ok) return;
    await AsyncStorage.setItem(RUNNING_KEY, 'true').catch(() => {});
    setIsRunning(true);
    await reschedulePosture(currentSettings());
    // İzin yeni verildiyse seri uyarısı da şimdi planlanabilir.
    refreshStreakAlerts({ streakAlert });
  }

  async function handleIntervalCommit(minutes) {
    setIntervalMinutes(minutes);
    if (isRunning) {
      await reschedulePosture(currentSettings({ intervalMinutes: minutes }));
    }
  }

  async function handleAlertModeChange(mode) {
    setAlertMode(mode);
    if (isRunning) {
      await reschedulePosture(currentSettings({ alertMode: mode }));
    }
  }

  async function handleVibrationIntensityChange(intensity) {
    setVibrationIntensity(intensity);
    if (isRunning) {
      await reschedulePosture(currentSettings({ vibrationIntensity: intensity }));
    }
  }

  async function handleQuietHoursToggle(value) {
    setQuietHoursEnabled(value);
    if (isRunning) {
      await reschedulePosture(currentSettings({ quietHoursEnabled: value }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ quietHoursEnabled: value });
    }
  }

  async function handleQuietStartChange(hour) {
    setQuietStart(hour);
    if (isRunning) {
      await reschedulePosture(currentSettings({ quietStart: hour }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ quietStart: hour });
    }
  }

  async function handleQuietEndChange(hour) {
    setQuietEnd(hour);
    if (isRunning) {
      await reschedulePosture(currentSettings({ quietEnd: hour }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ quietEnd: hour });
    }
  }

  async function handleEyeRestToggle(value) {
    setEyeRestEnabled(value);
    await refreshEyeRest({ enabled: value });
  }

  async function handleWorkScheduleChange(next) {
    setWorkSchedule(next);
    if (isRunning) {
      await reschedulePosture(currentSettings({ workSchedule: next }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ workSchedule: next });
    }
  }

  async function handleStreakAlertChange(next) {
    setStreakAlert(next);
    if (next.enabled) {
      const ok = await requestPermission();
      if (!ok) {
        // İzin yok: ayar 'açık' görünüp hiçbir şey planlamasın.
        const off = { ...next, enabled: false };
        setStreakAlert(off);
        await refreshStreakAlerts({ streakAlert: off });
        return;
      }
    }
    await refreshStreakAlerts({ streakAlert: next });
  }

  async function handleOnboardingFinish() {
    setOnboardingSeen(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
  }

  async function handleTestNotification() {
    const ok = await requestPermission();
    if (!ok) return;
    await sendTestNotification({ alertMode, vibrationIntensity, userName });
  }

  if (!bootstrapped) {
    return (
      <GestureHandlerRootView style={styles.blank}>
        <SafeAreaProvider>
          <View style={styles.blank} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!userName) {
    return (
      <GestureHandlerRootView style={styles.blank}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.blank} edges={['top', 'bottom']}>
            <StatusBar style="auto" />
            <NameScreen onSubmit={handleNameSubmit} />
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!onboardingSeen) {
    return (
      <GestureHandlerRootView style={styles.blank}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.blank} edges={['top', 'bottom']}>
            <StatusBar style="auto" />
            <OnboardingScreen onFinish={handleOnboardingFinish} />
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.blank}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <StatusBar style="auto" />
          <View style={styles.screen}>
            {activeTab === 'home' && (
              <HomeScreen
                userName={userName}
                isRunning={isRunning}
                intervalMinutes={intervalMinutes}
                quietHoursEnabled={quietHoursEnabled}
                quietStart={quietStart}
                quietEnd={quietEnd}
                todayReminderCount={todayReminderCount}
                nextReminderAt={isRunning ? nextReminderAt : null}
                onStartStop={handleStartStop}
                onIntervalCommit={handleIntervalCommit}
              />
            )}
            {activeTab === 'meditation' && <MeditationScreen onChangeTab={setActiveTab} />}
            {activeTab === 'stats' && <StatsScreen />}
            {activeTab === 'settings' && (
              <SettingsScreen
                userName={userName}
                onNameChange={handleNameSubmit}
                alertMode={alertMode}
                onAlertModeChange={handleAlertModeChange}
                vibrationIntensity={vibrationIntensity}
                onVibrationIntensityChange={handleVibrationIntensityChange}
                quietHoursEnabled={quietHoursEnabled}
                onQuietHoursToggle={handleQuietHoursToggle}
                quietStart={quietStart}
                quietEnd={quietEnd}
                onQuietStartChange={handleQuietStartChange}
                onQuietEndChange={handleQuietEndChange}
                eyeRestEnabled={eyeRestEnabled}
                onEyeRestToggle={handleEyeRestToggle}
                workSchedule={workSchedule}
                onWorkScheduleChange={handleWorkScheduleChange}
                streakAlert={streakAlert}
                onStreakAlertChange={handleStreakAlertChange}
                onTestNotification={handleTestNotification}
              />
            )}
          </View>
          <TabBar activeTab={activeTab} onChange={setActiveTab} />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    blank: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    screen: {
      flex: 1,
    },
  });
}
