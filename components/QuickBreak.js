import { useState } from 'react';
import BreathingSession from './BreathingSession';
import StepSession from './StepSession';
import { QUICK_BREATH } from '../lib/breathingTechniques';
import { MOVEMENT_META, QUICK_BREAK_MOVEMENT_IDS } from '../lib/sessionContent';
import { useTranslation } from '../lib/i18n';

// 60 saniyelik tek dokunuş rutini: kısa nefes (~20 sn) + 2 hareket (40 sn).
// Mevcut BreathingSession/StepSession'ı yeniden kullanır; seans sayacına
// sadece akışın sonunda (StepSession içinde) bir kez yazılır.
export default function QuickBreak({ onBack }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState('breath');

  if (phase === 'breath') {
    return (
      <BreathingSession
        technique={QUICK_BREATH}
        onBack={onBack}
        autoStart
        backLabel={t('stepSession.backToMeditation')}
        onComplete={() => setPhase('moves')}
      />
    );
  }

  const steps = QUICK_BREAK_MOVEMENT_IDS.map((id) => {
    const meta = MOVEMENT_META.find((m) => m.id === id);
    return {
      ...meta,
      title: t(`movements.items.${id}.title`),
      instruction: t(`movements.items.${id}.instruction`),
    };
  });

  return (
    <StepSession
      title={t('meditation.quickBreakTitle')}
      subtitle={`${steps.length} ${t('movements.subtitleSuffix')}`}
      steps={steps}
      onBack={onBack}
      idleIcon="⚡"
      type="movements"
      autoStart
    />
  );
}
