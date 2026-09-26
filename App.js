import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
} from './lib/notifications';
import { initializeAds } from './lib/ads';
import { getTodayReminderCount, incrementTodayReminderCount } from './lib/reminderLog';
import { useThemeColors } from './lib/theme';
import { useTranslation } from './lib/i18n';
import NameScreen from './screens/NameScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import MeditationScreen from './screens/MeditationScreen';
import SettingsScreen from './screens/SettingsScreen';
import TabBar from './components/TabBar';

const SETTINGS_KEY = 'durus-hatirlatici/settings';
const NAME_KEY = 'durus-hatirlatici/username';
const ONBOARDING_KEY = 'durus-hatirlatici/onboarding-seen';
const INTERVALS = [15, 30, 45, 60];

export default function App() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { locale } = useTranslation();
  // Bildirimlerin en son hangi dilde kurulduğunu tutar; dil değişince
  // zamanlanmış bildirimler yeni dilde yeniden oluşturulur.
  const notificationLocaleRef = useRef(locale);
  const localeJobRef = useRef(Promise.resolve());
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
  const [todayReminderCount, setTodayReminderCount] = useState(0);

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
      };
      let name = '';
      try {
        // Kanal kurulumu (veya herhangi bir adım) başarısız olsa bile
        // uygulama sonsuza kadar "yükleniyor" ekranında kalmamalı.
        await ensureChannels();
        await ensureNotificationCategories();
        initializeAds();

        const savedName = await AsyncStorage.getItem(NAME_KEY);
        if (savedName) name = savedName;

        const seenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingSeen(seenOnboarding === 'true');

        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (INTERVALS.includes(saved.intervalMinutes) || Number.isInteger(saved.intervalMinutes)) {
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
        }

        setUserName(name);
        setIntervalMinutes(settings.intervalMinutes);
        setAlertMode(settings.alertMode);
        setVibrationIntensity(settings.vibrationIntensity);
        setQuietHoursEnabled(settings.quietHoursEnabled);
        setQuietStart(settings.quietStart);
        setQuietEnd(settings.quietEnd);
        setEyeRestEnabled(settings.eyeRestEnabled);
        setTodayReminderCount(await getTodayReminderCount());

        // Gerçek durumu işletim sisteminden oku: duruş hatırlatıcısı zaten
        // zamanlanmış mı? (Göz dinlendirme ayrı bir kategoride zamanlandığı
        // için bu sayıma karışmaz.)
        const wasRunning = await isPostureReminderScheduled();
        setIsRunning(wasRunning);
        // Zamanlama sonlu bir kuyruk olduğu için, uygulama her açıldığında
        // kuyruğu bugünden itibaren yeniden doldur.
        if (wasRunning) {
          await scheduleReminder({ ...settings, userName: name });
        }
        if (settings.eyeRestEnabled) {
          await setEyeRestReminders({
            enabled: true,
            quietHoursEnabled: settings.quietHoursEnabled,
            quietStart: settings.quietStart,
            quietEnd: settings.quietEnd,
            userName: name,
          });
        }
      } catch (e) {
        // Kayıtlı ayar okunamazsa varsayılanlarla devam et
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
      const subscription = Notifications.addNotificationReceivedListener(() => {
        incrementTodayReminderCount().then(setTodayReminderCount);
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

  // Dil değişince: bildirim metinleri zamanlama anında translate() ile
  // üretildiği için, kuyruktaki bildirimler eski dilde kalırdı. Kanal adlarını,
  // "Ertele"/"Yaptım" buton başlıklarını ve aktif hatırlatıcıları yeni dilde
  // yeniden kur. Açılış (bootstrap) bitmeden çalışmaz; ardışık hızlı dil
  // değişimlerinde işler üst üste binmesin diye sıraya alınır.
  useEffect(() => {
    if (!bootstrapped) return;
    if (notificationLocaleRef.current === locale) return;
    notificationLocaleRef.current = locale;
    const settings = currentSettings();
    const eyeRest = eyeRestEnabled;
    const running = isRunning;
    localeJobRef.current = localeJobRef.current.then(async () => {
      try {
        await ensureChannels();
        await ensureNotificationCategories();
        if (running) {
          await scheduleReminder(settings);
        }
        if (eyeRest) {
          await refreshEyeRest({ enabled: true });
        }
      } catch (e) {
        // Yeniden zamanlama başarısız olursa bildirimler eski dilde kalır,
        // uygulama çalışmaya devam eder.
      }
    });
  }, [bootstrapped, locale]);

  useEffect(() => {
    if (!bootstrapped) return;
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
      })
    ).catch(() => {});
  }, [
    bootstrapped,
    intervalMinutes,
    alertMode,
    vibrationIntensity,
    quietHoursEnabled,
    quietStart,
    quietEnd,
    eyeRestEnabled,
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
      userName,
      ...overrides,
    };
  }

  async function refreshEyeRest(overrides = {}) {
    await setEyeRestReminders({
      enabled: eyeRestEnabled,
      quietHoursEnabled,
      quietStart,
      quietEnd,
      userName,
      ...overrides,
    });
  }

  async function handleNameSubmit(name) {
    setUserName(name);
    await AsyncStorage.setItem(NAME_KEY, name).catch(() => {});
    if (isRunning) {
      await scheduleReminder(currentSettings({ userName: name }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ userName: name });
    }
  }

  async function handleStartStop() {
    if (isRunning) {
      await cancelPostureReminders();
      setIsRunning(false);
      return;
    }
    const ok = await requestPermission();
    if (!ok) return;
    await scheduleReminder(currentSettings());
    setIsRunning(true);
  }

  async function handleIntervalCommit(minutes) {
    setIntervalMinutes(minutes);
    if (isRunning) {
      await scheduleReminder(currentSettings({ intervalMinutes: minutes }));
    }
  }

  async function handleAlertModeChange(mode) {
    setAlertMode(mode);
    if (isRunning) {
      await scheduleReminder(currentSettings({ alertMode: mode }));
    }
  }

  async function handleVibrationIntensityChange(intensity) {
    setVibrationIntensity(intensity);
    if (isRunning) {
      await scheduleReminder(currentSettings({ vibrationIntensity: intensity }));
    }
  }

  async function handleQuietHoursToggle(value) {
    setQuietHoursEnabled(value);
    if (isRunning) {
      await scheduleReminder(currentSettings({ quietHoursEnabled: value }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ quietHoursEnabled: value });
    }
  }

  async function handleQuietStartChange(hour) {
    setQuietStart(hour);
    if (isRunning) {
      await scheduleReminder(currentSettings({ quietStart: hour }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ quietStart: hour });
    }
  }

  async function handleQuietEndChange(hour) {
    setQuietEnd(hour);
    if (isRunning) {
      await scheduleReminder(currentSettings({ quietEnd: hour }));
    }
    if (eyeRestEnabled) {
      await refreshEyeRest({ quietEnd: hour });
    }
  }

  async function handleEyeRestToggle(value) {
    setEyeRestEnabled(value);
    await refreshEyeRest({ enabled: value });
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
                onStartStop={handleStartStop}
                onIntervalCommit={handleIntervalCommit}
              />
            )}
            {activeTab === 'meditation' && <MeditationScreen />}
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
