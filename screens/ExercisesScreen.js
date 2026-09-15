import StepSession from '../components/StepSession';

const EXERCISES = [
  {
    id: 'wall-pushup',
    icon: '🧱',
    title: 'Duvar Şınavı',
    instruction: 'Duvara ellerini dayayıp 10 tekrar şınav çek, göğüs ve omuzları çalıştırır.',
    seconds: 25,
  },
  {
    id: 'chair-squat',
    icon: '🪑',
    title: 'Sandalye Squat',
    instruction: 'Sandalyeye oturur gibi yavaşça çök, dokunmadan tekrar kalk. 10 tekrar.',
    seconds: 25,
  },
  {
    id: 'plank-hold',
    icon: '🏋️',
    title: 'Plank',
    instruction: 'Masaya/duvara dayanarak ya da yerde plank pozisyonunu koru, karnını sık.',
    seconds: 20,
  },
  {
    id: 'calf-raise',
    icon: '🦵',
    title: 'Baldır Kaldırma',
    instruction: 'Ayak parmaklarının ucunda yükselip yavaşça in. 15 tekrar.',
    seconds: 20,
  },
  {
    id: 'seated-core',
    icon: '🔥',
    title: 'Oturarak Karın Sıkma',
    instruction: 'Otururken karın kaslarını sıkıp 5 saniye tut, gevşet. Tekrar et.',
    seconds: 20,
  },
];

export default function ExercisesScreen({ onBack }) {
  return (
    <StepSession
      title="Duruş Güçlendirme"
      subtitle={`${EXERCISES.length} ekipmansız egzersiz`}
      steps={EXERCISES}
      onBack={onBack}
      idleIcon="💪"
      type="exercises"
    />
  );
}
