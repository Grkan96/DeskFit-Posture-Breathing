import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const MOVEMENTS = [
  {
    id: 'shoulder-shrug',
    icon: '🤷',
    title: 'Omuz Silkme',
    instruction: 'Omuzlarını kulaklarına doğru kaldır, 2 saniye tut, sonra bırak. Tekrar et.',
    seconds: 20,
  },
  {
    id: 'neck-stretch',
    icon: '🙆',
    title: 'Boyun Gerdirme',
    instruction: 'Başını yavaşça sağa eğ, birkaç saniye tut, sonra sola geç.',
    seconds: 20,
  },
  {
    id: 'shoulder-blade',
    icon: '💪',
    title: 'Kürek Kemiği Sıkma',
    instruction: 'Omuzlarını geriye çek ve kürek kemiklerini birbirine yaklaştır.',
    seconds: 20,
  },
  {
    id: 'wrist-stretch',
    icon: '🖐️',
    title: 'Bilek Gerdirme',
    instruction: 'Kolunu öne uzat, avuç içini yukarı çevirip diğer elinle nazikçe geriye it.',
    seconds: 20,
  },
  {
    id: 'torso-twist',
    icon: '🔄',
    title: 'Gövde Döndürme',
    instruction: 'Otururken belini sabit tutup gövdeni yavaşça sağa, sonra sola döndür.',
    seconds: 20,
  },
];

function initialSession() {
  return { stepIndex: 0, secondsLeft: MOVEMENTS[0].seconds, done: false };
}

export default function MovementsScreen({ onBack }) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(initialSession);

  // Her saniye tik atar; adımın süresi dolunca bir sonrakine geçer.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSession((prev) => {
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }
        const nextIndex = prev.stepIndex + 1;
        if (nextIndex >= MOVEMENTS.length) {
          return { ...prev, secondsLeft: 0, done: true };
        }
        return { stepIndex: nextIndex, secondsLeft: MOVEMENTS[nextIndex].seconds, done: false };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (session.done) {
      setRunning(false);
      setFinished(true);
    }
  }, [session.done]);

  function handleStart() {
    setFinished(false);
    setSession(initialSession());
    setRunning(true);
  }

  function handleStop() {
    setRunning(false);
    setSession(initialSession());
  }

  function handleSkip() {
    setSession((prev) => {
      const nextIndex = prev.stepIndex + 1;
      if (nextIndex >= MOVEMENTS.length) {
        return { ...prev, secondsLeft: 0, done: true };
      }
      return { stepIndex: nextIndex, secondsLeft: MOVEMENTS[nextIndex].seconds, done: false };
    });
  }

  const step = MOVEMENTS[session.stepIndex];
  const totalSeconds = MOVEMENTS.reduce((sum, m) => sum + m.seconds, 0);

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
        <Text style={styles.backText}>‹ Meditasyon</Text>
      </Pressable>

      <Text style={styles.title}>Masa Başı Hareketleri</Text>
      <Text style={styles.subtitle}>
        {MOVEMENTS.length} kısa hareket, toplam ~{Math.round(totalSeconds / 60) || 1} dakika.
      </Text>

      <View style={styles.body}>
        {running ? (
          <>
            <View style={styles.dots}>
              {MOVEMENTS.map((m, i) => (
                <View
                  key={m.id}
                  style={[
                    styles.dot,
                    i === session.stepIndex && styles.dotActive,
                    i < session.stepIndex && styles.dotDone,
                  ]}
                />
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardIcon}>{step.icon}</Text>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardInstruction}>{step.instruction}</Text>
              <Text style={styles.cardCount}>{session.secondsLeft}</Text>
            </View>

            <Pressable onPress={handleSkip} style={styles.skipButton} hitSlop={8}>
              <Text style={styles.skipText}>Sonraki hareket ›</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardIcon}>{finished ? '🎉' : '🧘'}</Text>
            <Text style={styles.cardTitle}>
              {finished ? 'Harika, tamamladın!' : 'Hazır mısın?'}
            </Text>
            <Text style={styles.cardInstruction}>
              {finished
                ? 'Duruşun için küçük ama etkili bir mola verdin.'
                : 'Sırayla gelecek hareketleri takip et, her biri kısa sürer.'}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={running ? handleStop : handleStart}
        style={[
          styles.actionButton,
          running ? styles.actionButtonStop : styles.actionButtonStart,
        ]}
      >
        <Text style={styles.actionButtonText}>
          {running ? 'Durdur' : finished ? 'Tekrar Başla' : 'Başla'}
        </Text>
      </Pressable>
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  body: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  dotActive: {
    backgroundColor: '#16a34a',
    width: 20,
  },
  dotDone: {
    backgroundColor: '#86efac',
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  cardInstruction: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
  },
  cardCount: {
    marginTop: 18,
    fontSize: 36,
    fontWeight: '800',
    color: '#16a34a',
  },
  skipButton: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  actionButton: {
    alignSelf: 'stretch',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  actionButtonStart: {
    backgroundColor: '#16a34a',
  },
  actionButtonStop: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
