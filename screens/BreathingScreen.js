import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BreathingSession from '../components/BreathingSession';
import { TECHNIQUES } from '../lib/breathingTechniques';
import { useThemeColors } from '../lib/theme';

export default function BreathingScreen({ onBack }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [technique, setTechnique] = useState(null);

  if (technique) {
    return <BreathingSession technique={technique} onBack={() => setTechnique(null)} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
        <Text style={styles.backText}>‹ Meditasyon</Text>
      </Pressable>

      <Text style={styles.header}>Nefes Dersleri</Text>
      <Text style={styles.subtitle}>Bir teknik seç, adımları takip et.</Text>

      <View style={styles.list}>
        {TECHNIQUES.map((t) => (
          <Pressable
            key={t.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => setTechnique(t)}
          >
            <Text style={styles.cardIcon}>{t.icon}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.cardDescription}>{t.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    backText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
    header: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.subtext,
      marginBottom: 20,
    },
    list: {
      gap: 12,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    cardPressed: {
      opacity: 0.8,
    },
    cardIcon: {
      fontSize: 28,
      marginRight: 14,
    },
    cardBody: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    cardDescription: {
      marginTop: 2,
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
    },
  });
}
