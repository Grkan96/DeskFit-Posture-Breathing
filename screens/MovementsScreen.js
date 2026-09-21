import StepSession from '../components/StepSession';
import { useTranslation } from '../lib/i18n';

// Görsel metinler (title/instruction) burada değil, lib/locales/{tr,en}.js
// içindeki movements.items.<id> anahtarlarında tutulur.
const MOVEMENT_META = [
  { id: 'shoulder-shrug', icon: '🤷', seconds: 20 },
  { id: 'neck-stretch', icon: '🙆', seconds: 20 },
  { id: 'shoulder-blade', icon: '💪', seconds: 20 },
  { id: 'wrist-stretch', icon: '🖐️', seconds: 20 },
  { id: 'torso-twist', icon: '🔄', seconds: 20 },
];

export default function MovementsScreen({ onBack }) {
  const { t } = useTranslation();
  const steps = MOVEMENT_META.map((m) => ({
    ...m,
    title: t(`movements.items.${m.id}.title`),
    instruction: t(`movements.items.${m.id}.instruction`),
  }));

  return (
    <StepSession
      title={t('movements.title')}
      subtitle={`${steps.length} ${t('movements.subtitleSuffix')}`}
      steps={steps}
      onBack={onBack}
      idleIcon="🧘"
      type="movements"
    />
  );
}
