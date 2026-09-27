import { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import AdBanner from '../components/AdBanner';
import SettingsSection from '../components/SettingsSection';
import { isPrivacyOptionsRequired, showPrivacyOptions } from '../lib/consent';
import appConfig from '../app.json';
import { useThemeColors, useThemePreference } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { shareApp } from '../lib/sharing';
import ShareCard from '../components/ShareCard';

const THEME_MODES = [
  { key: 'system', labelKey: 'settings.themeSystem', icon: '🌓' },
  { key: 'light', labelKey: 'settings.themeLight', icon: '☀️' },
  { key: 'dark', labelKey: 'settings.themeDark', icon: '🌙' },
];

const LANGUAGE_MODES = [
  { key: 'tr', label: 'Türkçe' },
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Español' },
  { key: 'de', label: 'Deutsch' },
  { key: 'pt', label: 'Português' },
  { key: 'fr', label: 'Français' },
  { key: 'ru', label: 'Русский' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'id', label: 'Indonesia' },
];

const ALERT_MODES = [
  { key: 'silent', labelKey: 'settings.alertSilent' },
  { key: 'vibrate', labelKey: 'settings.alertVibrate' },
  { key: 'sound', labelKey: 'settings.alertSound' },
];

const VIBRATION_INTENSITIES = [
  { key: 'light', labelKey: 'settings.vibrationLight' },
  { key: 'medium', labelKey: 'settings.vibrationMedium' },
  { key: 'strong', labelKey: 'settings.vibrationStrong' },
];

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

// Date#getDay() değerleri, Pazartesi ile başlayan görüntü sırasına göre.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];

function formatMinutes(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

const SECTIONS_KEY = 'settings.sections.v1';
const DEFAULT_OPEN = { reminder: true, appearance: false, share: false, about: false };

function NotificationDeniedHint({ styles, t }) {
  return (
    <View style={styles.deniedBox}>
      <Text style={styles.deniedText}>{t('settings.notifDeniedHint')}</Text>
      <Pressable
        onPress={() => Linking.openSettings().catch(() => {})}
        accessibilityRole="button"
        style={styles.quickButton}
      >
        <Text style={styles.quickButtonText}>{t('settings.notifOpenSettings')}</Text>
      </Pressable>
    </View>
  );
}

function SegmentedControl({ styles, options, value, onChange, t, wrap }) {
  return (
    <View style={[styles.segmentRow, wrap && styles.segmentRowWrap]}>
      {options.map((option) => {
        const selected = option.key === value;
        const label = option.labelKey ? t(option.labelKey) : option.label;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            style={[styles.segment, wrap && styles.segmentWrap, selected && styles.segmentSelected]}
          >
            {option.icon && (
              <Text style={styles.segmentIcon}>{option.icon}</Text>
            )}
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HourStepper({ styles, label, hour, onChange }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControl}>
        <Pressable
          onPress={() => onChange((hour + 23) % 24)}
          style={styles.stepperButton}
          hitSlop={8}
        >
          <Text style={styles.stepperButtonText}>–</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{formatHour(hour)}</Text>
        <Pressable
          onPress={() => onChange((hour + 1) % 24)}
          style={styles.stepperButton}
          hitSlop={8}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TimeStepper({ styles, label, minutes, onChange }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControl}>
        <Pressable
          onPress={() => onChange((minutes + 1440 - 30) % 1440)}
          style={styles.stepperButton}
          hitSlop={8}
        >
          <Text style={styles.stepperButtonText}>–</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{formatMinutes(minutes)}</Text>
        <Pressable
          onPress={() => onChange((minutes + 30) % 1440)}
          style={styles.stepperButton}
          hitSlop={8}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen({
  userName,
  onNameChange,
  alertMode,
  onAlertModeChange,
  vibrationIntensity,
  onVibrationIntensityChange,
  quietHoursEnabled,
  onQuietHoursToggle,
  quietStart,
  quietEnd,
  onQuietStartChange,
  onQuietEndChange,
  eyeRestEnabled,
  onEyeRestToggle,
  onTestNotification,
  workSchedule,
  onWorkScheduleChange,
  streakAlert,
  onStreakAlertChange,
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t, locale, setLocale } = useTranslation();
  const [themePreference, setThemePreference] = useThemePreference();
  const [nameText, setNameText] = useState(userName);

  const weekdays = t('settings.weekdaysShort');

  const [openSections, setOpenSections] = useState(DEFAULT_OPEN);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [notifDenied, setNotifDenied] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);

  const isOpen = (id) => !!openSections[id];

  function toggleSection(id) {
    setOpenSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      AsyncStorage.setItem(
        SECTIONS_KEY,
        JSON.stringify({ open: next, last: next[id] ? id : null })
      ).catch(() => {});
      return next;
    });
  }

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(SECTIONS_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.open === 'object' && parsed.open) {
          setOpenSections({ ...DEFAULT_OPEN, ...parsed.open });
        }
      })
      .catch(() => {});
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduceMotion(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduceMotion(!!v));
    isPrivacyOptionsRequired()
      .then((v) => mounted && setPrivacyOptionsRequired(!!v))
      .catch(() => {});
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  const refreshNotifPermission = useCallback(() => {
    Notifications.getPermissionsAsync()
      .then((p) => setNotifDenied(!p.granted && p.status === 'denied'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshNotifPermission();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshNotifPermission();
    });
    return () => sub.remove();
  }, [refreshNotifPermission]);

  function toggleWorkDay(day) {
    const days = workSchedule.days.includes(day)
      ? workSchedule.days.filter((d) => d !== day)
      : [...workSchedule.days, day];
    onWorkScheduleChange({ ...workSchedule, days });
  }

  function commitName() {
    const trimmed = nameText.trim();
    if (trimmed) {
      onNameChange(trimmed);
    } else {
      setNameText(userName);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>{t('settings.header')}</Text>

      <View style={styles.nameCard}>
        <Text style={styles.settingLabel}>{t('settings.nameLabel')}</Text>
        <TextInput
          value={nameText}
          onChangeText={setNameText}
          onBlur={commitName}
          onSubmitEditing={commitName}
          placeholder={t('settings.namePlaceholder')}
          placeholderTextColor={colors.faint}
          maxLength={24}
          returnKeyType="done"
          style={styles.nameInput}
        />
      </View>

      <SettingsSection
        title={t('settings.sectionReminder')}
        icon="🔔"
        open={isOpen('reminder')}
        onToggle={() => toggleSection('reminder')}
        reduceMotion={reduceMotion}
      >
      <View style={styles.card}>
        <Text style={styles.settingLabel}>{t('settings.alertModeLabel')}</Text>
        <SegmentedControl
          styles={styles}
          options={ALERT_MODES}
          value={alertMode}
          onChange={onAlertModeChange}
          t={t}
        />

        {alertMode !== 'silent' && (
          <View style={styles.subSection}>
            <Text style={styles.subLabel}>{t('settings.vibrationIntensityLabel')}</Text>
            <SegmentedControl
              styles={styles}
              options={VIBRATION_INTENSITIES}
              value={vibrationIntensity}
              onChange={onVibrationIntensityChange}
              t={t}
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.settingLabel}>{t('settings.quietHoursLabel')}</Text>
          <Switch
            value={quietHoursEnabled}
            onValueChange={onQuietHoursToggle}
            trackColor={{ false: colors.borderStrong, true: colors.accentSoft }}
            thumbColor={quietHoursEnabled ? colors.accent : colors.inputBg}
          />
        </View>
        {quietHoursEnabled && (
          <View style={styles.steppersBlock}>
            <HourStepper
              styles={styles}
              label={t('settings.quietStartLabel')}
              hour={quietStart}
              onChange={onQuietStartChange}
            />
            <HourStepper
              styles={styles}
              label={t('settings.quietEndLabel')}
              hour={quietEnd}
              onChange={onQuietEndChange}
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.settingLabel}>{t('settings.workScheduleLabel')}</Text>
            <Text style={styles.settingHint}>{t('settings.workScheduleHint')}</Text>
          </View>
          <Switch
            value={workSchedule.enabled}
            onValueChange={(enabled) => onWorkScheduleChange({ ...workSchedule, enabled })}
            trackColor={{ false: colors.borderStrong, true: colors.accentSoft }}
            thumbColor={workSchedule.enabled ? colors.accent : colors.inputBg}
          />
        </View>
        {workSchedule.enabled && (
          <View style={styles.steppersBlock}>
            <View style={styles.dayRow}>
              {WEEK_ORDER.map((day, i) => {
                const selected = workSchedule.days.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleWorkDay(day)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={weekdays[i]}
                    style={[styles.dayChip, selected && styles.segmentSelected]}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                      {weekdays[i]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {workSchedule.days.length === 0 && (
              <Text
                style={styles.warningText}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {t('settings.workDaysEmptyWarning')}
              </Text>
            )}
            <Pressable
              onPress={() => onWorkScheduleChange({ ...workSchedule, days: WEEKDAYS_ONLY })}
              style={styles.quickButton}
            >
              <Text style={styles.quickButtonText}>{t('settings.workWeekdaysOnly')}</Text>
            </Pressable>
            <HourStepper
              styles={styles}
              label={t('settings.workStartLabel')}
              hour={workSchedule.start}
              onChange={(start) => onWorkScheduleChange({ ...workSchedule, start })}
            />
            <HourStepper
              styles={styles}
              label={t('settings.workEndLabel')}
              hour={workSchedule.end}
              onChange={(end) => onWorkScheduleChange({ ...workSchedule, end })}
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.settingLabel}>{t('settings.streakAlertLabel')}</Text>
            <Text style={styles.settingHint}>{t('settings.streakAlertHint')}</Text>
          </View>
          <Switch
            value={streakAlert.enabled}
            onValueChange={(enabled) => onStreakAlertChange({ ...streakAlert, enabled })}
            trackColor={{ false: colors.borderStrong, true: colors.accentSoft }}
            thumbColor={streakAlert.enabled ? colors.accent : colors.inputBg}
          />
        </View>
        {notifDenied && <NotificationDeniedHint styles={styles} t={t} />}
        {streakAlert.enabled && (
          <View style={styles.steppersBlock}>
            <TimeStepper
              styles={styles}
              label={t('settings.streakAlertTimeLabel')}
              minutes={streakAlert.minutes}
              onChange={(minutes) => onStreakAlertChange({ ...streakAlert, minutes })}
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.settingLabel}>{t('settings.eyeRestLabel')}</Text>
            <Text style={styles.settingHint}>{t('settings.eyeRestHint')}</Text>
          </View>
          <Switch
            value={eyeRestEnabled}
            onValueChange={onEyeRestToggle}
            trackColor={{ false: colors.borderStrong, true: colors.accentSoft }}
            thumbColor={eyeRestEnabled ? colors.accent : colors.inputBg}
          />
        </View>
        {notifDenied && <NotificationDeniedHint styles={styles} t={t} />}
      </View>

      <Pressable onPress={onTestNotification} style={styles.testButton}>
        <Text style={styles.testButtonText}>{t('settings.testButton')}</Text>
      </Pressable>
      </SettingsSection>

      <SettingsSection
        title={t('settings.sectionAppearance')}
        icon="🎨"
        open={isOpen('appearance')}
        onToggle={() => toggleSection('appearance')}
        reduceMotion={reduceMotion}
      >
        <View style={styles.card}>
          <Text style={styles.settingLabel}>{t('settings.appearanceLabel')}</Text>
          <SegmentedControl
            styles={styles}
            options={THEME_MODES}
            value={themePreference}
            onChange={setThemePreference}
            t={t}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.settingLabel}>{t('settings.languageLabel')}</Text>
          <SegmentedControl
            styles={styles}
            options={LANGUAGE_MODES}
            value={locale}
            onChange={setLocale}
            t={t}
            wrap
          />
        </View>
      </SettingsSection>

      <SettingsSection
        title={t('settings.sectionShare')}
        icon="💌"
        open={isOpen('share')}
        onToggle={() => toggleSection('share')}
        reduceMotion={reduceMotion}
      >
        <Pressable onPress={shareApp} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>{t('settings.shareButton')}</Text>
        </Pressable>

        <ShareCard />
      </SettingsSection>

      <SettingsSection
        title={t('settings.sectionAbout')}
        icon="ℹ️"
        open={isOpen('about')}
        onToggle={() => toggleSection('about')}
        reduceMotion={reduceMotion}
      >
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.settingLabel}>{t('settings.versionLabel')}</Text>
            <Text style={styles.stepperLabel}>{appConfig?.expo?.version ?? ''}</Text>
          </View>
        </View>

        {privacyOptionsRequired && (
          <Pressable
            onPress={() => showPrivacyOptions()}
            accessibilityRole="button"
            style={styles.quickButtonWide}
          >
            <Text style={styles.quickButtonText}>{t('settings.adPrivacyOptions')}</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => Alert.alert(t('settings.privacyTitle'), t('settings.privacyText'))}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>{t('settings.privacyLink')}</Text>
        </Pressable>
      </SettingsSection>

      <AdBanner />
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    header: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: colors.text,
      marginBottom: 18,
    },
    nameCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.glassBorder || colors.border,
      paddingHorizontal: 18,
      paddingVertical: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    // Bölüm (SettingsSection) içindeki alt bento hücreleri: bölümün kendi
    // gölgesi zaten var, burada sade/hafif kalıp yalnızca ayrım için ince
    // bir kenarlık kullanılır; boşluk SettingsSection'ın `body` gap'inden gelir.
    card: {
      backgroundColor: colors.inputBg,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    settingTextBlock: {
      flex: 1,
      marginRight: 12,
    },
    settingHint: {
      marginTop: 3,
      fontSize: 12,
      color: colors.subtext,
    },
    nameInput: {
      marginTop: 10,
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    segmentRowWrap: {
      flexWrap: 'wrap',
    },
    segmentWrap: {
      flexGrow: 1,
      flexBasis: '30%',
    },
    segment: {
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      gap: 2,
    },
    segmentSelected: {
      backgroundColor: colors.accent,
    },
    segmentIcon: {
      fontSize: 16,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
    },
    segmentTextSelected: {
      color: '#ffffff',
    },
    subSection: {
      marginTop: 14,
    },
    subLabel: {
      fontSize: 13,
      color: colors.subtext,
    },
    steppersBlock: {
      marginTop: 12,
      gap: 10,
    },
    dayRow: {
      flexDirection: 'row',
      gap: 4,
    },
    dayChip: {
      flex: 1,
      minHeight: 44,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickButton: {
      alignSelf: 'flex-start',
      minHeight: 44,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.accentSofter,
      justifyContent: 'center',
    },
    quickButtonWide: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: colors.accentSofter,
      marginBottom: 8,
    },
    warningText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#c0392b',
    },
    deniedBox: {
      marginTop: 10,
      gap: 8,
    },
    deniedText: {
      fontSize: 12,
      color: '#c0392b',
    },
    quickButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accentText,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepperLabel: {
      fontSize: 13,
      color: colors.subtext,
    },
    stepperControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    stepperButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    stepperValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      width: 48,
      textAlign: 'center',
    },
    testButton: {
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
    },
    testButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
    },
    shareButton: {
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.accentSofter,
      alignItems: 'center',
    },
    shareButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accentText,
    },
    linkRow: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    linkText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.faint,
      textDecorationLine: 'underline',
    },
  });
}
