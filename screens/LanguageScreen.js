import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../lib/theme';
import { LANGUAGES, detectDeviceLocale, useTranslation } from '../lib/i18n';

// İlk açılışta gösterilen dil seçim ekranı. Bir dile dokununca ekranın
// kendisi o dile geçer (canlı önizleme); "Devam" ile seçim kalıcı olur.
export default function LanguageScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t, previewLocale, setLocale } = useTranslation();
  const [selected, setSelected] = useState(() => detectDeviceLocale() || 'en');

  useEffect(() => {
    previewLocale(selected);
  }, []);

  function handleSelect(code) {
    setSelected(code);
    previewLocale(code);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>{t('language.title')}</Text>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

        <View style={styles.list}>
          {LANGUAGES.map((language) => {
            const isSelected = language.code === selected;
            return (
              <Pressable
                key={language.code}
                onPress={() => handleSelect(language.code)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={language.nativeName}
                style={({ pressed }) => [
                  styles.row,
                  isSelected && styles.rowSelected,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.flag}>{language.flag}</Text>
                <Text style={[styles.name, isSelected && styles.nameSelected]}>
                  {language.nativeName}
                </Text>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <Text style={styles.check}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => setLocale(selected)}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{t('language.continueButton')}</Text>
        </Pressable>
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
    content: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 16,
      alignItems: 'center',
    },
    emoji: {
      fontSize: 44,
      marginBottom: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 20,
    },
    list: {
      alignSelf: 'stretch',
      marginTop: 24,
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSofter,
    },
    rowPressed: {
      opacity: 0.8,
    },
    flag: {
      fontSize: 26,
      marginRight: 14,
    },
    name: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    nameSelected: {
      color: colors.accentText,
      fontWeight: '700',
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    check: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      paddingTop: 8,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
