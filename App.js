import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ensureChannels, scheduleReminder, sendTestNotification } from './lib/notifications';
import NameScreen from './screens/NameScreen';
import HomeScreen from './screens/HomeScreen';
import MeditationScreen from './screens/MeditationScreen';
import SettingsScreen from './screens/SettingsScreen';
import TabBar from './components/TabBar';

const SETTINGS_KEY = 'durus-hatirlatici/settings';
const NAME_KEY = 'durus-hatirlatici/username';
const INTERVALS = [15, 30, 45, 60];

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const [isRunning, setIsRunning] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState(23);
  const [quietEnd, setQuietEnd] = useState(8);

  useEffect(() => {
    (async () => {
      await ensureChannels();
      let settings = {
        intervalMinutes,
        soundEnabled,
        quietHoursEnabled,
        quietStart,
        quietEnd,
      };
      let name = '';
      try {
        const savedName = await AsyncStorage.getItem(NAME_KEY);
        if (savedName) name = savedName;

        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (INTERVALS.includes(saved.intervalMinutes) || Number.isInteger(saved.intervalMinutes)) {
            settings.intervalMinutes = saved.intervalMinutes;
          }
          settings.soundEnabled = saved.soundEnabled !== false;
          settings.quietHoursEnabled = saved.quietHoursEnabled === true;
          if (Number.isInteger(saved.quietStart) && saved.quietStart >= 0 && saved.quietStart < 24) {
            settings.quietStart = saved.quietStart;
          }
          if (Number.isInteger(saved.quietEnd) && saved.quietEnd >= 0 && saved.quietEnd < 24) {
            settings.quietEnd = saved.quietEnd;
          }
        }

        setUserName(name);
        setIntervalMinutes(settings.intervalMinutes);
        setSoundEnabled(settings.soundEnabled);
        setQuietHoursEnabled(settings.quietHoursEnabled);
        setQuietStart(settings.quietStart);
        setQuietEnd(settings.quietEnd);

        // Gerçek durumu işletim sisteminden oku: zamanlanmış bildirim var mı?
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const wasRunning = scheduled.length > 0;
        setIsRunning(wasRunning);
        // Zamanlama sonlu bir kuyruk olduğu için, uygulama her açıldığında
        // kuyruğu bugünden itibaren yeniden doldur.
        if (wasRunning) {
          await scheduleReminder({ ...settings, userName: name });
        }
      } catch (e) {
        // Kayıtlı ayar okunamazsa varsayılanlarla devam et
      }
      setBootstrapped(true);
    })();
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        intervalMinutes,
        soundEnabled,
        quietHoursEnabled,
        quietStart,
        quietEnd,
      })
    ).catch(() => {});
  }, [bootstrapped, intervalMinutes, soundEnabled, quietHoursEnabled, quietStart, quietEnd]);

  async function requestPermission() {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  }

  function currentSettings(overrides = {}) {
    return {
      intervalMinutes,
      soundEnabled,
      quietHoursEnabled,
      quietStart,
      quietEnd,
      userName,
      ...overrides,
    };
  }

  async function handleNameSubmit(name) {
    setUserName(name);
    await AsyncStorage.setItem(NAME_KEY, name).catch(() => {});
    if (isRunning) {
      await scheduleReminder(currentSettings({ userName: name }));
    }
  }

  async function handleStartStop() {
    if (isRunning) {
      await Notifications.cancelAllScheduledNotificationsAsync();
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

  async function handleSoundChange(value) {
    setSoundEnabled(value);
    if (isRunning) {
      await scheduleReminder(currentSettings({ soundEnabled: value }));
    }
  }

  async function handleQuietHoursToggle(value) {
    setQuietHoursEnabled(value);
    if (isRunning) {
      await scheduleReminder(currentSettings({ quietHoursEnabled: value }));
    }
  }

  async function handleQuietStartChange(hour) {
    setQuietStart(hour);
    if (isRunning) {
      await scheduleReminder(currentSettings({ quietStart: hour }));
    }
  }

  async function handleQuietEndChange(hour) {
    setQuietEnd(hour);
    if (isRunning) {
      await scheduleReminder(currentSettings({ quietEnd: hour }));
    }
  }

  async function handleTestNotification() {
    const ok = await requestPermission();
    if (!ok) return;
    await sendTestNotification({ soundEnabled, userName });
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
            <StatusBar style="dark" />
            <NameScreen onSubmit={handleNameSubmit} />
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.blank}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <StatusBar style="dark" />
          <View style={styles.screen}>
            {activeTab === 'home' && (
              <HomeScreen
                userName={userName}
                isRunning={isRunning}
                intervalMinutes={intervalMinutes}
                quietHoursEnabled={quietHoursEnabled}
                quietStart={quietStart}
                quietEnd={quietEnd}
                onStartStop={handleStartStop}
                onIntervalCommit={handleIntervalCommit}
              />
            )}
            {activeTab === 'meditation' && <MeditationScreen />}
            {activeTab === 'settings' && (
              <SettingsScreen
                userName={userName}
                onNameChange={handleNameSubmit}
                soundEnabled={soundEnabled}
                onSoundChange={handleSoundChange}
                quietHoursEnabled={quietHoursEnabled}
                onQuietHoursToggle={handleQuietHoursToggle}
                quietStart={quietStart}
                quietEnd={quietEnd}
                onQuietStartChange={handleQuietStartChange}
                onQuietEndChange={handleQuietEndChange}
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

const styles = StyleSheet.create({
  blank: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screen: {
    flex: 1,
  },
});
