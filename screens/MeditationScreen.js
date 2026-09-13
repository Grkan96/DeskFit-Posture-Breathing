import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import BreathingScreen from './BreathingScreen';
import MovementsScreen from './MovementsScreen';

const CATEGORIES = [
  {
    id: 'movements',
    icon: '🧘',
    title: 'Hareketler',
    description: '5 kısa masa başı gerinme ve gevşeme hareketi.',
    ready: true,
  },
  {
    id: 'exercises',
    icon: '💪',
    title: 'Egzersizler',
    description: 'Duruşunu güçlendirecek basit, ekipmansız egzersizler.',
    ready: false,
  },
  {
    id: 'breathing',
    icon: '🌬️',
    title: 'Nefes Dersleri',
    description: '4-7-8 tekniğiyle rehberli bir nefes egzersizi.',
    ready: true,
  },
];

function CategoryCard({ icon, title, description, ready, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <Text style={styles.cardIcon}>{icon}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <View style={[styles.badge, ready && styles.badgeReady]}>
        <Text style={[styles.badgeText, ready && styles.badgeTextReady]}>
          {ready ? 'Başla' : 'Yakında'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MeditationScreen() {
  const [activeSession, setActiveSession] = useState(null);

  if (activeSession === 'breathing') {
    return <BreathingScreen onBack={() => setActiveSession(null)} />;
  }
  if (activeSession === 'movements') {
    return <MovementsScreen onBack={() => setActiveSession(null)} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>🌿</Text>
      <Text style={styles.header}>Meditasyon</Text>
      <Text style={styles.subtitle}>
        Duruşunu desteklemek için kısa hareketler, egzersizler ve nefes dersleri
        burada olacak.
      </Text>

      <View style={styles.cardList}>
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            {...category}
            onPress={() =>
              category.ready
                ? setActiveSession(category.id)
                : Alert.alert(category.title, 'Bu bölüm yakında eklenecek. Takipte kal! 🌱')
            }
          />
        ))}
      </View>
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
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  cardList: {
    alignSelf: 'stretch',
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
  },
  cardDescription: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  badgeReady: {
    backgroundColor: '#bbf7d0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  badgeTextReady: {
    color: '#14532d',
  },
});
