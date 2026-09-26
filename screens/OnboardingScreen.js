import { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ onFinish }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const slides = t('onboarding.slides');
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);
  const isLast = index === slides.length - 1;

  function goToIndex(next) {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  }

  function handleNext() {
    if (isLast) {
      onFinish();
    } else {
      goToIndex(index + 1);
    }
  }

  function handleScrollEnd(event) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(next);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.scroll}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.emojiCircle}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {slide.title}
            </Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View
          style={styles.dots}
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: slides.length, now: index + 1 }}
        >
          {slides.map((slide, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            handleNext();
          }}
          accessibilityRole="button"
          accessibilityLabel={isLast ? t('onboarding.start') : t('onboarding.next')}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{isLast ? t('onboarding.start') : t('onboarding.next')}</Text>
        </Pressable>

        {!isLast && (
          <Pressable
            onPress={onFinish}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.skip')}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flex: 1,
    },
    slide: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emojiCircle: {
      width: 132,
      height: 132,
      borderRadius: 66,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      backgroundColor: colors.accentSofter,
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    emoji: {
      fontSize: 64,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      marginTop: 10,
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 24,
    },
    footer: {
      paddingHorizontal: 32,
      paddingBottom: 32,
      alignItems: 'center',
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
      backgroundColor: colors.borderStrong,
    },
    dotActive: {
      backgroundColor: colors.accent,
      width: 20,
    },
    button: {
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderRadius: 16,
      minHeight: 52,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    buttonText: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '700',
    },
    skipButton: {
      marginTop: 8,
      minHeight: 44,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.muted,
    },
  });
}
