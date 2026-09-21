import { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable onPress={handleNext} style={styles.button}>
          <Text style={styles.buttonText}>{isLast ? t('onboarding.start') : t('onboarding.next')}</Text>
        </Pressable>

        {!isLast && (
          <Pressable onPress={onFinish} hitSlop={8} style={styles.skipButton}>
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
    emoji: {
      fontSize: 64,
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      marginTop: 10,
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 21,
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
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.accent,
      width: 20,
    },
    button: {
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
    skipButton: {
      marginTop: 14,
      paddingVertical: 4,
    },
    skipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.faint,
    },
  });
}
