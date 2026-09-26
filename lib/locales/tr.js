export const tr = {
  common: {
    back: '‹ Geri',
  },
  tabBar: {
    home: 'Ana Ekran',
    meditation: 'Meditasyon',
    settings: 'Ayarlar',
  },
  home: {
    greeting: 'Merhaba, {name} 👋',
    statusActive: 'Aktif — her {minutes} dakikada bir',
    quietSuffix: ' ({start}–{end} sessiz)',
    statusInactive: 'Kapalı — başlatmak için butona dokun',
    reminderCount: 'Bugün {count} hatırlatma aldın 🎯',
    start: 'BAŞLAT',
    stop: 'DURDUR',
    intervalSectionLabel: 'Hatırlatma aralığı',
    customPlaceholder: 'özel',
    minuteUnit: 'dk',
    minutesWord: 'dakika',
    sliderAccessibilityLabel: 'Hatırlatma aralığı kaydırıcısı',
    customInputLabel: 'Özel dakika gir',
    minutesLabel: '{minutes} dakika',
  },
  settings: {
    header: 'Ayarlar',
    nameLabel: 'İsmin',
    namePlaceholder: 'İsmin',
    appearanceLabel: 'Görünüm',
    themeSystem: 'Sistem',
    themeLight: 'Açık',
    themeDark: 'Koyu',
    languageLabel: 'Dil',
    alertModeLabel: 'Uyarı modu',
    alertSilent: 'Sessiz',
    alertVibrate: 'Titreşim',
    alertSound: 'Sesli',
    vibrationIntensityLabel: 'Titreşim şiddeti',
    vibrationLight: 'Hafif',
    vibrationMedium: 'Orta',
    vibrationStrong: 'Güçlü',
    quietHoursLabel: 'Gece sessiz saatleri',
    quietStartLabel: 'Başlangıç',
    quietEndLabel: 'Bitiş',
    eyeRestLabel: '👀 Göz dinlendirme',
    eyeRestHint: '20-20-20 kuralı — her 20 dakikada bir hatırlatma',
    testButton: 'Şimdi Test Et (2 sn sonra)',
    shareButton: '📤 Arkadaşına Gönder',
    privacyLink: 'Gizlilik Politikası',
    privacyTitle: 'Gizlilik Politikası',
    privacyText:
      'Duruş Hatırlatıcı, adını ve tercihlerini yalnızca cihazında saklar; ' +
      'bunları hiçbir sunucuya göndermez.\n\n' +
      'Uygulama içindeki reklamlar Google AdMob tarafından sağlanır. AdMob, ' +
      'reklamları göstermek için cihaz tanımlayıcıları gibi bazı verileri ' +
      "işleyebilir. Daha fazla bilgi için Google'ın gizlilik politikasına " +
      'bakabilirsin.',
  },
  meditation: {
    header: 'Meditasyon',
    subtitle: 'Duruşunu desteklemek için kısa hareketler, egzersizler ve nefes dersleri.',
    statsStreak: 'gün üst üste',
    statsSessions: 'seans tamamlandı',
    badgeReady: 'Başla',
    badgeSoon: 'Yakında',
    comingSoonBody: 'Bu bölüm yakında eklenecek. Takipte kal! 🌱',
    categories: {
      movements: {
        title: 'Hareketler',
        description: '5 kısa masa başı gerinme ve gevşeme hareketi.',
      },
      exercises: {
        title: 'Egzersizler',
        description: '5 kısa, ekipmansız duruş güçlendirme egzersizi.',
      },
      breathing: {
        title: 'Nefes Dersleri',
        description: '3 farklı teknikle rehberli nefes egzersizleri.',
      },
    },
  },
  breathing: {
    header: 'Nefes Dersleri',
    subtitle: 'Bir teknik seç, adımları takip et.',
    backToMeditation: '‹ Meditasyon',
    backToTechniques: '‹ Teknikler',
    readyTitle: 'Hazır mısın?',
    doneTitle: 'Tamamlandı 🌿',
    start: 'Başla',
    stop: 'Durdur',
    restart: 'Tekrar Başla',
    cycleLabel: 'Tur {current} / {total}',
    cyclesCount: '{count} tur.',
    phaseInhale: 'Nefes Al',
    phaseHold: 'Tut',
    phaseExhale: 'Nefes Ver',
    techniques: {
      '478': {
        title: '4-7-8 Nefes Tekniği',
        description: '4 sn al, 7 sn tut, 8 sn ver. Sakinleştirici, uykuya geçişe yardımcı.',
      },
      box: {
        title: 'Box Breathing',
        description: '4-4-4-4: al, tut, ver, tut. Odaklanmayı ve sakinliği artırır.',
      },
      coherent: {
        title: 'Sakinleştirici Nefes',
        description: '5-5: eşit al-ver. Kalp atış hızını dengeleyen, yaygın kullanılan bir teknik.',
      },
    },
  },
  stepSession: {
    backToMeditation: '‹ Meditasyon',
    approxMinutes: '· toplam ~{minutes} dakika.',
    readyTitle: 'Hazır mısın?',
    readyBody: 'Sırayla gelecek adımları takip et, her biri kısa sürer.',
    doneTitle: 'Harika, tamamladın!',
    doneBody: 'Duruşun için küçük ama etkili bir mola verdin.',
    nextButton: 'Sonraki ›',
    start: 'Başla',
    stop: 'Durdur',
    restart: 'Tekrar Başla',
  },
  movements: {
    title: 'Masa Başı Hareketleri',
    subtitleSuffix: 'kısa hareket',
    items: {
      'shoulder-shrug': {
        title: 'Omuz Silkme',
        instruction: 'Omuzlarını kulaklarına doğru kaldır, 2 saniye tut, sonra bırak. Tekrar et.',
      },
      'neck-stretch': {
        title: 'Boyun Gerdirme',
        instruction: 'Başını yavaşça sağa eğ, birkaç saniye tut, sonra sola geç.',
      },
      'shoulder-blade': {
        title: 'Kürek Kemiği Sıkma',
        instruction: 'Omuzlarını geriye çek ve kürek kemiklerini birbirine yaklaştır.',
      },
      'wrist-stretch': {
        title: 'Bilek Gerdirme',
        instruction: 'Kolunu öne uzat, avuç içini yukarı çevirip diğer elinle nazikçe geriye it.',
      },
      'torso-twist': {
        title: 'Gövde Döndürme',
        instruction: 'Otururken belini sabit tutup gövdeni yavaşça sağa, sonra sola döndür.',
      },
    },
  },
  exercises: {
    title: 'Duruş Güçlendirme',
    subtitleSuffix: 'ekipmansız egzersiz',
    items: {
      'wall-pushup': {
        title: 'Duvar Şınavı',
        instruction: 'Duvara ellerini dayayıp 10 tekrar şınav çek, göğüs ve omuzları çalıştırır.',
      },
      'chair-squat': {
        title: 'Sandalye Squat',
        instruction: 'Sandalyeye oturur gibi yavaşça çök, dokunmadan tekrar kalk. 10 tekrar.',
      },
      'plank-hold': {
        title: 'Plank',
        instruction: 'Masaya/duvara dayanarak ya da yerde plank pozisyonunu koru, karnını sık.',
      },
      'calf-raise': {
        title: 'Baldır Kaldırma',
        instruction: 'Ayak parmaklarının ucunda yükselip yavaşça in. 15 tekrar.',
      },
      'seated-core': {
        title: 'Oturarak Karın Sıkma',
        instruction: 'Otururken karın kaslarını sıkıp 5 saniye tut, gevşet. Tekrar et.',
      },
    },
  },
  stats: {
    header: 'İstatistiklerin',
    backToMeditation: '‹ Meditasyon',
    streakLabel: 'gün üst üste',
    sessionsLabel: 'toplam seans',
    weekSectionLabel: 'Son 7 gün',
    typeSectionLabel: 'Türe göre',
    shareButton: '📤 Sonucunu Paylaş',
    typeBreathing: 'Nefes Dersleri',
    typeMovements: 'Hareketler',
    typeExercises: 'Egzersizler',
    weekdays: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  },
  onboarding: {
    next: 'İleri',
    start: 'Başla',
    skip: 'Geç',
    slides: [
      {
        emoji: '🧘',
        title: 'Hoş geldin!',
        description:
          'Bu uygulama, düzenli aralıklarla dik oturman ve gözlerini dinlendirmen için seni nazikçe hatırlatır.',
      },
      {
        emoji: '⏱️',
        title: 'Aralığını seç',
        description:
          "Ana ekrandaki cetveli kaydır ya da hazır seçeneklerden birine dokun, sonra BAŞLAT'a bas. Hepsi bu kadar.",
      },
      {
        emoji: '🌿',
        title: 'Meditasyon da var',
        description:
          'Nefes egzersizleri, masa başı hareketleri ve duruş güçlendirme çalışmalarıyla molalarını zenginleştirebilirsin.',
      },
    ],
  },
  name: {
    emoji: '🧘',
    title: 'Hoş geldin!',
    subtitle: 'Hatırlatmaları kişiselleştirebilmemiz için sana nasıl seslenelim?',
    placeholder: 'İsmin',
    continueButton: 'Devam Et',
  },
  notifications: {
    title: 'Duruş Hatırlatıcı',
    snoozeButton: 'Ertele ({minutes} dk)',
    doneButton: 'Yaptım',
    messages: [
      'Boynunu hafifçe sağa, sonra sola çevir 🙆',
      'Çeneni göğsüne yaklaştırıp boynunu gerdir 🦢',
      'Ekrana çok yakınsın, boynunu geriye al 📱',
      'Omuzlarını kulaklarına doğru kaldır, sonra bırak 🤷',
      'Omuzlarını geriye at, göğsünü aç 💪',
      'Kürek kemiklerini birbirine yaklaştır 🔙',
      'Dik otur, belini sandalyenin arkasına yasla 🪑',
      'Omurganı uzat, tepe noktandan yukarı çekiliyormuş gibi düşün 🧍',
      'Sırtını dikleştir, karnını hafifçe içeri çek 🎯',
      'Gözlerini birkaç kez sıkıca kapat, gevşet 😌',
      'Ekrandan uzaklaş, gözlerini biraz dinlendir 🖥️',
      'Derin bir nefes al, omuzlarını indir 🌬️',
      'Birkaç saniye gözlerini kapatıp sadece nefesine odaklan 🧘',
    ],
    eyeRestMessage: 'Gözlerini 20 saniyeliğine uzağa odakla (20-20-20 kuralı) 👀',
  },
  sharing: {
    appMessage:
      'Duruş Hatırlatıcı ile düzenli aralıklarla dik oturmayı ve gözlerimi dinlendirmeyi hatırlıyorum 🧘 Sen de dener misin?',
    achievementMessage:
      '🔥 {streak} gün üst üste duruşuma dikkat ettim! Toplamda {totalSessions} seans tamamladım. Duruş Hatırlatıcı ile sen de dene 🧘',
    milestoneAlertTitle: '🎉 Yeni bir seri rekoru!',
    milestone7: '7 gün üst üste! Harika bir başlangıç 🔥',
    milestone30: '30 gün üst üste! Artık bir alışkanlık haline geldi 🎉',
    milestone100: '100 gün üst üste! İnanılmaz bir seri 🏆',
    shareCta: 'Paylaş',
    closeCta: 'Kapat',
  },
  shareCard: {
    appName: 'Duruş Hatırlatıcı',
    previewTitle: 'İlerlemeni paylaş',
    shareButton: '📤 Paylaş',
    dialogTitle: 'İlerlemeni paylaş',
    motivationStart: 'Her güzel gün dik bir duruşla başlar 💪',
    motivationWeek: 'Bir haftadır duruşuma dikkat ediyorum — devam! 🌱',
    motivationMonth: 'Dik duruş artık bir alışkanlık 🏆',
    footerCta: "📲 Google Play'den ücretsiz indir",
  },
};
