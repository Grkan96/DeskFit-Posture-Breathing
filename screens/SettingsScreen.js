import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import AdBanner from '../components/AdBanner';
import { useThemeColors, useThemePreference } from '../lib/theme';

const PRIVACY_TEXT =
  'Duruş Hatırlatıcı, adını ve tercihlerini yalnızca cihazında saklar; ' +
  'bunları hiçbir sunucuya göndermez.\n\n' +
  'Uygulama içindeki reklamlar Google AdMob tarafından sağlanır. AdMob, ' +
  'reklamları göstermek için cihaz tanımlayıcıları gibi bazı verileri ' +
  'işleyebilir. Daha fazla bilgi için Google\'ın gizlilik politikasına ' +
  'bakabilirsin.';

const THEME_MODES = [
  { key: 'system', label: 'Sistem', icon: '🌓' },
  { key: 'light', label: 'Açık', icon: '☀️' },
  { key: 'dark', label: 'Koyu', icon: '🌙' },
];

const ALERT_MODES = [
  { key: 'silent', label: 'Sessiz' },
  { key: 'vibrate', label: 'Titreşim' },
  { key: 'sound', label: 'Sesli' },
];

const VIBRATION_INTENSITIES = [
  { key: 'light', label: 'Hafif' },
  { key: 'medium', label: 'Orta' },
  { key: 'strong', label: 'Güçlü' },
];

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function SegmentedControl({ styles, options, value, onChange }) {
  return (
    <View style={styles.segmentRow}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            {option.icon && (
              <Text style={styles.segmentIcon}>{option.icon}</Text>
            )}
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {option.label}
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
  onTestNotification,
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
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
      <Text style={styles.header}>Ayarlar</Text>

      <View style={styles.card}>
        <Text style={styles.settingLabel}>İsmin</Text>
        <TextInput
          value={nameText}
          onChangeText={setNameText}
          onBlur={commitName}
          onSubmitEditing={commitName}
          placeholder="İsmin"
          placeholderTextColor={colors.faint}
          maxLength={24}
          returnKeyType="done"
          style={styles.nameInput}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.settingLabel}>Görünüm</Text>
        <SegmentedControl
          styles={styles}
          options={THEME_MODES}
          value={themePreference}
          onChange={setThemePreference}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.settingLabel}>Uyarı modu</Text>
        <SegmentedControl
          styles={styles}
          options={ALERT_MODES}
          value={alertMode}
          onChange={onAlertModeChange}
        />

        {alertMode !== 'silent' && (
          <View style={styles.subSection}>
            <Text style={styles.subLabel}>Titreşim şiddeti</Text>
            <SegmentedControl
              styles={styles}
              options={VIBRATION_INTENSITIES}
              value={vibrationIntensity}
              onChange={onVibrationIntensityChange}
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.settingLabel}>Gece sessiz saatleri</Text>
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
              label="Başlangıç"
              hour={quietStart}
              onChange={onQuietStartChange}
            />
            <HourStepper styles={styles} label="Bitiş" hour={quietEnd} onChange={onQuietEndChange} />
          </View>
        )}
      </View>

      <Pressable onPress={onTestNotification} style={styles.testButton}>
        <Text style={styles.testButtonText}>Şimdi Test Et (2 sn sonra)</Text>
      </Pressable>

      <Pressable
        onPress={() => Alert.alert('Gizlilik Politikası', PRIVACY_TEXT)}
        style={styles.linkRow}
      >
        <Text style={styles.linkText}>Gizlilik Politikası</Text>
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
