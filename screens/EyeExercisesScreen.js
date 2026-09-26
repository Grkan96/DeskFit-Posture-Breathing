import StepSession from '../components/StepSession';
import { useTranslation } from '../lib/i18n';

// Göz egzersizleri (göz yogası): ekran başında yorulan gözler için kısa adımlar.
// Görsel metinler (title/instruction) burada değil, lib/locales/{tr,en}.js
// içindeki eyes.items.<id> anahtarlarında tutulur.
const EYE_EXERCISE_META = [
  { id: 'far-look', icon: '🔭', seconds: 20 },
  { id: 'palming', icon: '🤲', seconds: 20 },
  { id: 'figure-eight', icon: '♾️', seconds: 20 },
  { id: 'near-far', icon: '🎯', seconds: 20 },
  { id: 'blinking', icon: '😉', seconds: 15 },
  { id: 'eye-rolls', icon: '🔄', seconds: 20 },
];

export default function EyeExercisesScreen({ onBack }) {
  const { t } = useTranslation();
  const steps = EYE_EXERCISE_META.map((m) => ({
    ...m,
    title: t(`eyes.items.${m.id}.title`),
    instruction: t(`eyes.items.${m.id}.instruction`),
  }));

  return (
    <StepSession
      title={t('eyes.title')}
      subtitle={`${steps.length} ${t('eyes.subtitleSuffix')}`}
      steps={steps}
      onBack={onBack}
      idleIcon="👀"
      type="eyes"
    />
  );
}
