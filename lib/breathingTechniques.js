// Görsel metinler (başlık, açıklama, faz etiketleri) burada değil,
// lib/locales/{tr,en}.js içindeki breathing.techniques.<id> ve
// breathing.phase<Key> anahtarlarında tutulur — bu dosya sadece yapıyı içerir.
export const TECHNIQUES = [
  {
    id: '478',
    icon: '🌙',
    cycles: 4,
    phases: [
      { phaseKey: 'phaseInhale', seconds: 4, scale: 1.35 },
      { phaseKey: 'phaseHold', seconds: 7, scale: 1.35 },
      { phaseKey: 'phaseExhale', seconds: 8, scale: 0.75 },
    ],
  },
  {
    id: 'box',
    icon: '🔲',
    cycles: 4,
    phases: [
      { phaseKey: 'phaseInhale', seconds: 4, scale: 1.35 },
      { phaseKey: 'phaseHold', seconds: 4, scale: 1.35 },
      { phaseKey: 'phaseExhale', seconds: 4, scale: 0.75 },
      { phaseKey: 'phaseHold', seconds: 4, scale: 0.75 },
    ],
  },
  {
    id: 'coherent',
    icon: '🌊',
    cycles: 5,
    phases: [
      { phaseKey: 'phaseInhale', seconds: 5, scale: 1.35 },
      { phaseKey: 'phaseExhale', seconds: 5, scale: 0.75 },
    ],
  },
  {
    // Fizyolojik iç çekiş: burundan iki aşamalı nefes al (2 sn + 1 sn),
    // ağızdan uzun ver (6 sn). Stresi hızla azaltmaya yardımcı olur.
    id: 'sigh',
    icon: '😮‍💨',
    cycles: 5,
    phases: [
      { phaseKey: 'phaseInhale', seconds: 2, scale: 1.2 },
      { phaseKey: 'phaseInhaleMore', seconds: 1, scale: 1.35 },
      { phaseKey: 'phaseExhale', seconds: 6, scale: 0.75 },
    ],
  },
];
