import StepSession from '../components/StepSession';
import { EXERCISE_META } from '../lib/sessionContent';
import { useThemeColors, darkColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

// Görsel metinler (title/instruction) lib/locales/{tr,en}.js içindeki
// exercises.items.<id> anahtarlarında, meta veri lib/sessionContent.js'de tutulur.
export default function ExercisesScreen({ onBack, autoStart = false }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const isDark = colors === darkColors;
  // Egzersizler, hareketlerden ayırt edilsin diye hafif mavi-mor bir ton
  // kullanır (theme.js'e dokunmadan, sadece bu ekrana özel bir sabit).
  const tint = isDark
    ? { from: '#1e3a5f', to: '#2a2350' }
    : { from: '#dbeafe', to: '#ede9fe' };
  const steps = EXERCISE_META.map((e) => ({
    ...e,
    title: t(`exercises.items.${e.id}.title`),
    instruction: t(`exercises.items.${e.id}.instruction`),
  }));

  return (
    <StepSession
      title={t('exercises.title')}
      subtitle={`${steps.length} ${t('exercises.subtitleSuffix')}`}
      steps={steps}
      onBack={onBack}
      idleIcon="💪"
      type="exercises"
      tint={tint}
      autoStart={autoStart}
    />
  );
}
