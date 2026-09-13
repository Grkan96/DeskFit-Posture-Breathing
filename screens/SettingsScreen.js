import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import AdBanner from '../components/AdBanner';

const PRIVACY_TEXT =
  'Duruş Hatırlatıcı, adını ve tercihlerini yalnızca cihazında saklar; ' +
  'bunları hiçbir sunucuya göndermez.\n\n' +
  'Uygulama içindeki reklamlar Google AdMob tarafından sağlanır. AdMob, ' +
  'reklamları göstermek için cihaz tanımlayıcıları gibi bazı verileri ' +
  'işleyebilir. Daha fazla bilgi için Google\'ın gizlilik politikasına ' +
  'bakabilirsin.';

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function HourStepper({ label, hour, onChange }) {
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
  soundEnabled,
  onSoundChange,
  quietHoursEnabled,
  onQuietHoursToggle,
  quietStart,
  quietEnd,
  onQuietStartChange,
  onQuietEndChange,
  onTestNotification,
}) {
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
          placeholderTextColor="#94a3b8"
          maxLength={24}
          returnKeyType="done"
          style={styles.nameInput}
        />
      </View>

      <View style={[styles.card, styles.cardRow]}>
        <Text style={styles.settingLabel}>Bildirim sesi</Text>
        <Switch
          value={soundEnabled}
          onValueChange={onSoundChange}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={soundEnabled ? '#16a34a' : '#f1f5f9'}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.settingLabel}>Gece sessiz saatleri</Text>
          <Switch
            value={quietHoursEnabled}
            onValueChange={onQuietHoursToggle}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={quietHoursEnabled ? '#16a34a' : '#f1f5f9'}
          />
        </View>
        {quietHoursEnabled && (
          <View style={styles.steppersBlock}>
            <HourStepper label="Başlangıç" hour={quietStart} onChange={onQuietStartChange} />
            <HourStepper label="Bitiş" hour={quietEnd} onChange={onQuietEndChange} />
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

const styles = StyleSheet.create({
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
    color: '#0f172a',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
  },
  nameInput: {
    marginTop: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
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
    color: '#475569',
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
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    width: 48,
    textAlign: 'center',
  },
  testButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  linkRow: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textDecorationLine: 'underline',
  },
});
