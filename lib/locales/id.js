export const id = {
  common: {
    back: '‹ Kembali',
  },
  tabBar: {
    home: 'Beranda',
    meditation: 'Meditasi',
    settings: 'Pengaturan',
  },
  home: {
    greeting: 'Halo, {name} 👋',
    statusActive: 'Aktif — setiap {minutes} menit',
    quietSuffix: ' (hening {start}–{end})',
    statusInactive: 'Mati — ketuk tombol untuk memulai',
    reminderCount: 'Hari ini kamu sudah menerima {count} pengingat 🎯',
    start: 'MULAI',
    stop: 'BERHENTI',
    intervalSectionLabel: 'Jeda pengingat',
    customPlaceholder: 'atur sendiri',
    minuteUnit: 'mnt',
    minutesWord: 'menit',
    sliderAccessibilityLabel: 'Penggeser jeda pengingat',
    customInputLabel: 'Masukkan jumlah menit sendiri',
    minutesLabel: '{minutes} menit',
  },
  settings: {
    header: 'Pengaturan',
    nameLabel: 'Namamu',
    namePlaceholder: 'Namamu',
    appearanceLabel: 'Tampilan',
    themeSystem: 'Sistem',
    themeLight: 'Terang',
    themeDark: 'Gelap',
    languageLabel: 'Bahasa',
    alertModeLabel: 'Mode peringatan',
    alertSilent: 'Senyap',
    alertVibrate: 'Getar',
    alertSound: 'Suara',
    vibrationIntensityLabel: 'Intensitas getaran',
    vibrationLight: 'Ringan',
    vibrationMedium: 'Sedang',
    vibrationStrong: 'Kuat',
    quietHoursLabel: 'Jam hening malam',
    quietStartLabel: 'Mulai',
    quietEndLabel: 'Selesai',
    eyeRestLabel: '👀 Istirahat mata',
    eyeRestHint: 'Aturan 20-20-20 — pengingat setiap 20 menit',
    testButton: 'Coba sekarang (2 dtk)',
    shareButton: '📤 Kirim ke teman',
    privacyLink: 'Kebijakan Privasi',
    privacyTitle: 'Kebijakan Privasi',
    privacyText:
      'Pengingat Postur hanya menyimpan namamu dan preferensimu di perangkatmu; ' +
      'data tersebut tidak pernah dikirim ke server mana pun.\n\n' +
      'Iklan di dalam aplikasi disediakan oleh Google AdMob. AdMob dapat ' +
      'memproses sebagian data, seperti pengenal perangkat, untuk menampilkan iklan. ' +
      'Lihat kebijakan privasi Google untuk informasi lebih lanjut.',
  },
  meditation: {
    header: 'Meditasi',
    subtitle: 'Gerakan singkat, latihan, dan pelajaran pernapasan untuk menunjang postur tubuhmu.',
    statsStreak: 'hari berturut-turut',
    statsSessions: 'sesi selesai',
    badgeReady: 'Mulai',
    badgeSoon: 'Segera',
    comingSoonBody: 'Bagian ini segera hadir. Nantikan ya! 🌱',
    categories: {
      movements: {
        title: 'Gerakan',
        description: '5 peregangan singkat di meja kerja untuk melemaskan dan merilekskan tubuh.',
      },
      exercises: {
        title: 'Latihan',
        description: '5 latihan singkat tanpa alat untuk memperkuat postur.',
      },
      breathing: {
        title: 'Pelajaran Pernapasan',
        description: 'Latihan pernapasan terpandu dengan 3 teknik berbeda.',
      },
    },
  },
  breathing: {
    header: 'Pelajaran Pernapasan',
    subtitle: 'Pilih satu teknik, lalu ikuti panduannya.',
    backToMeditation: '‹ Meditasi',
    backToTechniques: '‹ Teknik',
    readyTitle: 'Siap?',
    doneTitle: 'Selesai 🌿',
    start: 'Mulai',
    stop: 'Berhenti',
    restart: 'Ulangi',
    cycleLabel: 'Siklus {current} / {total}',
    cyclesCount: '{count} siklus.',
    phaseInhale: 'Tarik napas',
    phaseHold: 'Tahan',
    phaseExhale: 'Embuskan',
    techniques: {
      '478': {
        title: 'Pernapasan 4-7-8',
        description: 'Tarik 4 dtk, tahan 7 dtk, embuskan 8 dtk. Menenangkan dan membantu tidur.',
      },
      box: {
        title: 'Pernapasan Kotak',
        description: '4-4-4-4: tarik, tahan, embuskan, tahan. Meningkatkan fokus dan ketenangan.',
      },
      coherent: {
        title: 'Pernapasan Koheren',
        description: '5-5: tarik dan embuskan sama panjang. Teknik yang banyak dipakai untuk menyeimbangkan detak jantung.',
      },
    },
  },
  stepSession: {
    backToMeditation: '‹ Meditasi',
    approxMinutes: '· total sekitar {minutes} menit.',
    readyTitle: 'Siap?',
    readyBody: 'Ikuti langkah-langkahnya satu per satu, setiap langkah singkat saja.',
    doneTitle: 'Kerja bagus!',
    doneBody: 'Kamu baru saja istirahat sejenak yang singkat tapi bermanfaat untuk posturmu.',
    nextButton: 'Lanjut ›',
    start: 'Mulai',
    stop: 'Berhenti',
    restart: 'Ulangi',
  },
  movements: {
    title: 'Peregangan di Meja Kerja',
    subtitleSuffix: 'gerakan singkat',
    items: {
      'shoulder-shrug': {
        title: 'Angkat Bahu',
        instruction: 'Angkat bahu ke arah telinga, tahan 2 detik, lalu lepaskan. Ulangi.',
      },
      'neck-stretch': {
        title: 'Peregangan Leher',
        instruction: 'Miringkan kepala perlahan ke kanan, tahan beberapa detik, lalu ke kiri.',
      },
      'shoulder-blade': {
        title: 'Rapatkan Tulang Belikat',
        instruction: 'Tarik bahu ke belakang dan rapatkan kedua tulang belikat.',
      },
      'wrist-stretch': {
        title: 'Peregangan Pergelangan Tangan',
        instruction: 'Luruskan lengan dengan telapak menghadap atas, lalu tarik jari-jari perlahan ke belakang dengan tangan lainnya.',
      },
      'torso-twist': {
        title: 'Putar Badan',
        instruction: 'Sambil duduk, jaga pinggul tetap diam dan putar badan perlahan ke kanan, lalu ke kiri.',
      },
    },
  },
  exercises: {
    title: 'Penguatan Postur',
    subtitleSuffix: 'latihan tanpa alat',
    items: {
      'wall-pushup': {
        title: 'Push-up Dinding',
        instruction: 'Letakkan kedua tangan di dinding dan lakukan 10 kali push-up untuk melatih dada dan bahu.',
      },
      'chair-squat': {
        title: 'Squat Kursi',
        instruction: 'Turun perlahan seolah hendak duduk, lalu naik tanpa menyentuh kursi. 10 kali.',
      },
      'plank-hold': {
        title: 'Plank',
        instruction: 'Tahan posisi plank bertumpu pada meja, dinding, atau lantai, dengan perut dikencangkan.',
      },
      'calf-raise': {
        title: 'Angkat Betis',
        instruction: 'Berjinjit setinggi mungkin, lalu turun perlahan. 15 kali.',
      },
      'seated-core': {
        title: 'Kencangkan Perut Saat Duduk',
        instruction: 'Sambil duduk, kencangkan perut dan tahan 5 detik, lalu lepaskan. Ulangi.',
      },
    },
  },
  stats: {
    header: 'Statistikmu',
    backToMeditation: '‹ Meditasi',
    streakLabel: 'hari berturut-turut',
    sessionsLabel: 'total sesi',
    weekSectionLabel: '7 hari terakhir',
    typeSectionLabel: 'Menurut jenis',
    shareButton: '📤 Bagikan Kemajuanmu',
    typeBreathing: 'Pelajaran Pernapasan',
    typeMovements: 'Gerakan',
    typeExercises: 'Latihan',
    weekdays: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  },
  onboarding: {
    next: 'Lanjut',
    start: 'Mulai',
    skip: 'Lewati',
    slides: [
      {
        emoji: '🧘',
        title: 'Selamat datang!',
        description:
          'Aplikasi ini dengan lembut mengingatkanmu untuk duduk tegak dan mengistirahatkan mata secara berkala.',
      },
      {
        emoji: '⏱️',
        title: 'Pilih jedamu',
        description:
          'Geser penggeser di layar beranda atau ketuk pilihan yang tersedia, lalu tekan MULAI. Begitu saja.',
      },
      {
        emoji: '🌿',
        title: 'Ada meditasi juga',
        description:
          'Perkaya waktu istirahatmu dengan latihan pernapasan, peregangan di meja kerja, dan latihan penguat postur.',
      },
    ],
  },
  name: {
    emoji: '🧘',
    title: 'Selamat datang!',
    subtitle: 'Kami harus memanggilmu apa, supaya pengingatmu terasa lebih personal?',
    placeholder: 'Namamu',
    continueButton: 'Lanjutkan',
  },
  notifications: {
    title: 'Pengingat Postur',
    snoozeButton: 'Tunda ({minutes} mnt)',
    doneButton: 'Selesai',
    messages: [
      'Putar lehermu perlahan ke kanan, lalu ke kiri 🙆',
      'Dekatkan dagu ke dada untuk meregangkan leher 🦢',
      'Kamu terlalu dekat dengan layar, tarik lehermu ke belakang 📱',
      'Angkat bahu ke arah telinga, lalu lepaskan 🤷',
      'Tarik bahu ke belakang dan buka dadamu 💪',
      'Rapatkan tulang belikatmu 🔙',
      'Duduk tegak, sandarkan punggung ke kursi 🪑',
      'Panjangkan tulang belakang, bayangkan ditarik ke atas dari ubun-ubun 🧍',
      'Luruskan punggung dan tarik perut perlahan ke dalam 🎯',
      'Pejamkan mata kuat-kuat beberapa kali, lalu rilekskan 😌',
      'Alihkan pandangan dari layar dan istirahatkan matamu sejenak 🖥️',
      'Tarik napas dalam-dalam dan turunkan bahumu 🌬️',
      'Pejamkan mata beberapa detik dan fokus pada napasmu saja 🧘',
    ],
    eyeRestMessage: 'Tatap sesuatu yang jauh selama 20 detik (aturan 20-20-20) 👀',
  },
  sharing: {
    appMessage:
      'Aku pakai Pengingat Postur supaya ingat duduk tegak dan mengistirahatkan mata 🧘 Mau coba juga?',
    achievementMessage:
      '🔥 Aku sudah menjaga postur {streak} hari berturut-turut! {totalSessions} sesi selesai sejauh ini. Coba Pengingat Postur juga 🧘',
    milestoneAlertTitle: '🎉 Pencapaian beruntun baru!',
    milestone7: '7 hari berturut-turut! Awal yang hebat 🔥',
    milestone30: '30 hari berturut-turut! Sekarang sudah jadi kebiasaan 🎉',
    milestone100: '100 hari berturut-turut! Rekor yang luar biasa 🏆',
    shareCta: 'Bagikan',
    closeCta: 'Tutup',
  },
};
