import StepSession from '../components/StepSession';

const MOVEMENTS = [
  {
    id: 'shoulder-shrug',
    icon: '🤷',
    title: 'Omuz Silkme',
    instruction: 'Omuzlarını kulaklarına doğru kaldır, 2 saniye tut, sonra bırak. Tekrar et.',
    seconds: 20,
  },
  {
    id: 'neck-stretch',
    icon: '🙆',
    title: 'Boyun Gerdirme',
    instruction: 'Başını yavaşça sağa eğ, birkaç saniye tut, sonra sola geç.',
    seconds: 20,
  },
  {
    id: 'shoulder-blade',
    icon: '💪',
    title: 'Kürek Kemiği Sıkma',
    instruction: 'Omuzlarını geriye çek ve kürek kemiklerini birbirine yaklaştır.',
    seconds: 20,
  },
  {
    id: 'wrist-stretch',
    icon: '🖐️',
    title: 'Bilek Gerdirme',
    instruction: 'Kolunu öne uzat, avuç içini yukarı çevirip diğer elinle nazikçe geriye it.',
    seconds: 20,
  },
  {
    id: 'torso-twist',
    icon: '🔄',
    title: 'Gövde Döndürme',
    instruction: 'Otururken belini sabit tutup gövdeni yavaşça sağa, sonra sola döndür.',
    seconds: 20,
  },
];

export default function MovementsScreen({ onBack }) {
  return (
    <StepSession
      title="Masa Başı Hareketleri"
      subtitle={`${MOVEMENTS.length} kısa hareket`}
      steps={MOVEMENTS}
      onBack={onBack}
      idleIcon="🧘"
      type="movements"
    />
  );
}
