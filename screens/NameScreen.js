import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';
import OnboardingStep, { OptionGroup } from '../components/OnboardingStep';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { DESK_HOURS, PAIN_AREAS, saveProfile } from '../lib/onboardingProfile';

// Onboarding'in ilk yarısı (App.js isim yoksa bu ekranı gösterir):
// 1) değer ekranı  2) profil soruları  3) isim -> onSubmit(name).
// Sonraki adımlar (bildirim ön-ekranı, ilk hatırlatma) OnboardingScreen'de.
export default function NameScreen({ onSubmit }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [deskHours, setDeskHours] = useState(null);
  const [painArea, setPainArea] = useState(null);
  const trimmed = name.trim();

  function submitName() {
    if (trimmed) onSubmit(trimmed);
  }

  function leaveQuestions(answers) {
    // Boş cevap yazma; atlanınca profil boş kalır.
    if (answers) saveProfile({ deskHours, painArea }).catch(() => {});
    setStep(3);
  }

  const hoursOptions = DESK_HOURS.map((v) => ({ value: v, label: t(`onboardingFlow.questions.hours.${v}`) }));
  const painOptions = PAIN_AREAS.map((v) => ({ value: v, label: t(`onboardingFlow.questions.pain.${v}`) }));

  let content;
  if (step === 1) {
    content = (
      <OnboardingStep
        step={1}
        emoji="🪑 🔔 🧘"
        title={t('onboardingFlow.value.title')}
        subtitle={t('onboardingFlow.value.description')}
        onSkip={() => setStep(3)}
        primaryLabel={t('onboardingFlow.next')}
        onPrimary={() => setStep(2)}
      />
    );
  } else if (step === 2) {
    content = (
      <OnboardingStep
        step={2}
        title={t('onboardingFlow.questions.title')}
        subtitle={t('onboardingFlow.questions.subtitle')}
        onBack={() => setStep(1)}
        onSkip={() => leaveQuestions(false)}
        primaryLabel={t('onboardingFlow.next')}
        primaryDisabled={!deskHours || !painArea}
        onPrimary={() => leaveQuestions(true)}
      >
        <OptionGroup
          label={t('onboardingFlow.questions.hoursLabel')}
          options={hoursOptions}
          value={deskHours}
          onChange={setDeskHours}
        />
        <OptionGroup
          label={t('onboardingFlow.questions.painLabel')}
          options={painOptions}
          value={painArea}
          onChange={setPainArea}
        />
      </OnboardingStep>
    );
  } else {
    content = (
      <OnboardingStep
        step={3}
        emoji={t('name.emoji')}
        title={t('name.title')}
        subtitle={t('name.subtitle')}
        onBack={() => setStep(2)}
        primaryLabel={t('name.continueButton')}
        primaryDisabled={!trimmed}
        onPrimary={submitName}
      >
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('name.placeholder')}
          placeholderTextColor={colors.faint}
          style={styles.input}
          accessibilityLabel={t('name.placeholder')}
          autoFocus
          maxLength={24}
          returnKeyType="done"
          onSubmitEditing={submitName}
        />
      </OnboardingStep>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    input: {
      marginTop: 28,
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      minHeight: 52,
      paddingHorizontal: 18,
      paddingVertical: 14,
      fontSize: 17,
      color: colors.text,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
  });
}
