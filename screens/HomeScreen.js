import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import CircularDial from '../components/CircularDial';

const INTERVALS = [15, 30, 45, 60];
const MIN_MINUTES = 1;
const MAX_MINUTES = 60;

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function HomeScreen({
  userName,
  isRunning,
  intervalMinutes,
  quietHoursEnabled,
  quietStart,
  quietEnd,
  onStartStop,
  onIntervalCommit,
}) {
  const [customText, setCustomText] = useState('');

  function commitCustom() {
    const parsed = parseInt(customText, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, parsed));
      onIntervalCommit(clamped);
    }
    setCustomText('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Merhaba, {userName} 👋</Text>
      <Text style={styles.subtitle}>
        {isRunning
          ? `Aktif — her ${intervalMinutes} dakikada bir${
              quietHoursEnabled
                ? ` (${formatHour(quietStart)}–${formatHour(quietEnd)} sessiz)`
                : ''
            }`
          : 'Kapalı — başlatmak için butona dokun'}
      </Text>

      <Pressable
        onPress={onStartStop}
        style={({ pressed }) => [
          styles.mainButton,
          isRunning ? styles.mainButtonStop : styles.mainButtonStart,
          pressed && styles.mainButtonPressed,
        ]}
      >
        <Text style={styles.mainButtonText}>{isRunning ? 'DURDUR' : 'BAŞLAT'}</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Hatırlatma aralığı</Text>
      <View style={styles.intervalRow}>
        {INTERVALS.map((minutes) => {
          const selected = minutes === intervalMinutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => onIntervalCommit(minutes)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {minutes} dk
              </Text>
            </Pressable>
          );
        })}
        <TextInput
          value={customText}
          onChangeText={(t) => setCustomText(t.replace(/[^0-9]/g, ''))}
          onSubmitEditing={commitCustom}
          onBlur={() => customText && commitCustom()}
          placeholder="özel"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          returnKeyType="done"
          style={styles.customChip}
        />
      </View>

      <CircularDial minutes={intervalMinutes} onChange={onIntervalCommit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  mainButton: {
    marginTop: 20,
    marginBottom: 20,
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  mainButtonStart: {
    backgroundColor: '#16a34a',
  },
  mainButtonStop: {
    backgroundColor: '#dc2626',
  },
  mainButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  mainButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  intervalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#0f172a',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  customChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    width: 64,
    textAlign: 'center',
  },
});
