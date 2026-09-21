import StepSession from '../components/StepSession';
import { useTranslation } from '../lib/i18n';

// Görsel metinler (title/instruction) burada değil, lib/locales/{tr,en}.js
// içindeki exercises.items.<id> anahtarlarında tutulur.
const EXERCISE_META = [
  { id: 'wall-pushup', icon: '🧱', seconds: 25 },
  { id: 'chair-squat', icon: '🪑', seconds: 25 },
  { id: 'plank-hold', icon: '🏋️', seconds: 20 },
  { id: 'calf-raise', icon: '🦵', seconds: 20 },
  { id: 'seated-core', icon: '🔥', seconds: 20 },
];

export default function ExercisesScreen({ onBack }) {
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
    />
  );
}
