import StepSession from '../components/StepSession';
import { MOVEMENT_META } from '../lib/sessionContent';
import { useTranslation } from '../lib/i18n';

// Görsel metinler (title/instruction) lib/locales/{tr,en}.js içindeki
// movements.items.<id> anahtarlarında, meta veri lib/sessionContent.js'de tutulur.
export default function MovementsScreen({ onBack, autoStart = false }) {
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
      autoStart={autoStart}
    />
  );
}
