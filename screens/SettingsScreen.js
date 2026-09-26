import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import AdBanner from '../components/AdBanner';
import { useThemeColors, useThemePreference } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { shareApp } from '../lib/sharing';

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
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t, locale, setLocale } = useTranslation();
  const [themePreference, setThemePreference] = useThemePreference();
  const [nameText, setNameText] = useState(userName);

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

      <View style={styles.card}>
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
      </View>

      <Pressable onPress={onTestNotification} style={styles.testButton}>
        <Text style={styles.testButtonText}>{t('settings.testButton')}</Text>
      </Pressable>

      <Pressable onPress={shareApp} style={styles.shareButton}>
        <Text style={styles.shareButtonText}>{t('settings.shareButton')}</Text>
      </Pressable>

      <Pressable
        onPress={() => Alert.alert(t('settings.privacyTitle'), t('settings.privacyText'))}
        style={styles.linkRow}
      >
        <Text style={styles.linkText}>{t('settings.privacyLink')}</Text>
      </Pressable>

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
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
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
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
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
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.border,
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
      marginTop: 8,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.border,
      alignItems: 'center',
    },
    testButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
    },
    shareButton: {
      marginTop: 10,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accentSofter,
      alignItems: 'center',
    },
    shareButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accentText,
    },
    linkRow: {
      marginTop: 16,
      alignItems: 'center',
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
