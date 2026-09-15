export const TECHNIQUES = [
  {
    id: '478',
    icon: '🌙',
    title: '4-7-8 Nefes Tekniği',
    description: '4 sn al, 7 sn tut, 8 sn ver. Sakinleştirici, uykuya geçişe yardımcı.',
    cycles: 4,
    phases: [
      { label: 'Nefes Al', seconds: 4, scale: 1.35 },
      { label: 'Tut', seconds: 7, scale: 1.35 },
      { label: 'Nefes Ver', seconds: 8, scale: 0.75 },
    ],
  },
  {
    id: 'box',
    icon: '🔲',
    title: 'Box Breathing',
    description: '4-4-4-4: al, tut, ver, tut. Odaklanmayı ve sakinliği artırır.',
    cycles: 4,
    phases: [
      { label: 'Nefes Al', seconds: 4, scale: 1.35 },
      { label: 'Tut', seconds: 4, scale: 1.35 },
      { label: 'Nefes Ver', seconds: 4, scale: 0.75 },
      { label: 'Tut', seconds: 4, scale: 0.75 },
    ],
  },
  {
    id: 'coherent',
    icon: '🌊',
    title: 'Sakinleştirici Nefes',
    description: '5-5: eşit al-ver. Kalp atış hızını dengeleyen, yaygın kullanılan bir teknik.',
    cycles: 5,
    phases: [
      { label: 'Nefes Al', seconds: 5, scale: 1.35 },
      { label: 'Nefes Ver', seconds: 5, scale: 0.75 },
    ],
  },
];
