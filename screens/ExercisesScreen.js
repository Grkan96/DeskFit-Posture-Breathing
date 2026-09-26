import StepSession from '../components/StepSession';
import { EXERCISE_META } from '../lib/sessionContent';
import { useTranslation } from '../lib/i18n';

// Görsel metinler (title/instruction) lib/locales/{tr,en}.js içindeki
// exercises.items.<id> anahtarlarında, meta veri lib/sessionContent.js'de tutulur.
export default function ExercisesScreen({ onBack, autoStart = false }) {
  const { t } = useTranslation();
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
      autoStart={autoStart}
    />
  );
}
