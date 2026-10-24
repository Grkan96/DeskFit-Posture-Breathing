import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import OnboardingStep from '../components/OnboardingStep';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { saveProfile } from '../lib/onboardingProfile';

// Onboarding'in ikinci yarısı (isim alındıktan sonra App.js bunu gösterir):
// 4) bildirim izni ön-ekranı  5) ilk hatırlatmayı başlatma teklifi.
// onFinish() sözleşmesi korunur; teklif kabul edilirse onFinish({ startReminder: true })
// çağrılır (mevcut App.js fazladan argümanı yok sayar) ve profile de yazılır.
export default function OnboardingScreen({ onFinish }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [step, setStep] = useState(4);
  // 'idle' | 'asking' | 'denied'
  const [permState, setPermState] = useState('idle');
  const [granted, setGranted] = useState(false);

  // İzin zaten verilmişse ön-ekranı gösterme, doğrudan teklife geç.
  useEffect(() => {
    let mounted = true;
    Notifications.getPermissionsAsync()
      .then((p) => {
        if (mounted && p.granted) {
          setGranted(true);
          setStep(5);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  function finish(startReminder) {
    saveProfile({
      notificationsGranted: granted,
      reminderOffered: startReminder,
      completedAt: Date.now(),
    }).catch(() => {});
    onFinish(startReminder ? { startReminder: true } : undefined);
  }

  async function askPermission() {
    setPermState('asking');
    let ok = false;
    try {
      const res = await Notifications.requestPermissionsAsync();
      ok = !!res.granted;
    } catch {
      ok = false;
    }
    setGranted(ok);
    saveProfile({ notificationsGranted: ok }).catch(() => {});
    if (ok) {
      setStep(5);
    } else {
      setPermState('denied');
    }
  }

  if (step === 4 && permState === 'denied') {
    return (
      <OnboardingStep
        step={4}
        emoji="🔕"
        title={t('onboardingFlow.permission.deniedTitle')}
        subtitle={t('onboardingFlow.permission.deniedBody')}
        onBack={() => setPermState('idle')}
        primaryLabel={t('onboardingFlow.permission.continueAnyway')}
        onPrimary={() => finish(false)}
        secondaryLabel={t('onboardingFlow.permission.openSettings')}
        onSecondary={() => Linking.openSettings().catch(() => {})}
      >
        <Text style={styles.hint}>{t('onboardingFlow.permission.settingsHint')}</Text>
      </OnboardingStep>
    );
  }

  if (step === 4) {
    return (
      <OnboardingStep
        step={4}
        emoji="🔔"
        title={t('onboardingFlow.permission.title')}
        subtitle={t('onboardingFlow.permission.body')}
        onSkip={() => finish(false)}
        primaryLabel={t('onboardingFlow.permission.allow')}
        primaryDisabled={permState === 'asking'}
        onPrimary={askPermission}
      >
        <Text style={styles.hint}>{t('onboardingFlow.permission.note')}</Text>
      </OnboardingStep>
    );
  }

  return (
    <OnboardingStep
      step={5}
      emoji="🚀"
      title={t('onboardingFlow.start.title')}
      subtitle={t('onboardingFlow.start.body')}
      onBack={granted ? undefined : () => setStep(4)}
      primaryLabel={t('onboardingFlow.start.startNow')}
      onPrimary={() => finish(true)}
      secondaryLabel={t('onboardingFlow.start.later')}
      onSecondary={() => finish(false)}
    />
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    // Yumuşak ipucu bandı: kartın içinde ayrı bir bento hücresi gibi durur.
    hint: {
      marginTop: 18,
      alignSelf: 'stretch',
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      lineHeight: 20,
      color: colors.muted,
      textAlign: 'center',
    },
  });
}
