export const fr = {
  common: {
    back: '‹ Retour',
  },
  tabBar: {
    home: 'Accueil',
    meditation: 'Méditation',
    settings: 'Réglages',
  },
  home: {
    greeting: 'Salut, {name} 👋',
    statusActive: 'Actif : toutes les {minutes} minutes',
    quietSuffix: ' (silence {start}–{end})',
    statusInactive: 'Désactivé : appuyez sur le bouton pour démarrer',
    reminderCount: "Vous avez reçu {count} rappels aujourd'hui 🎯",
    start: 'DÉMARRER',
    stop: 'ARRÊTER',
    intervalSectionLabel: 'Intervalle du rappel',
    customPlaceholder: 'autre',
    minuteUnit: 'min',
    minutesWord: 'minutes',
    sliderAccessibilityLabel: "Curseur de l'intervalle de rappel",
    customInputLabel: 'Saisir un nombre de minutes',
    minutesLabel: '{minutes} minutes',
  },
  settings: {
    header: 'Réglages',
    nameLabel: 'Votre prénom',
    namePlaceholder: 'Votre prénom',
    appearanceLabel: 'Apparence',
    themeSystem: 'Système',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    languageLabel: 'Langue',
    alertModeLabel: "Type d'alerte",
    alertSilent: 'Silencieux',
    alertVibrate: 'Vibration',
    alertSound: 'Son',
    vibrationIntensityLabel: 'Intensité de vibration',
    vibrationLight: 'Légère',
    vibrationMedium: 'Moyenne',
    vibrationStrong: 'Forte',
    quietHoursLabel: 'Silence nocturne',
    quietStartLabel: 'Début',
    quietEndLabel: 'Fin',
    eyeRestLabel: '👀 Repos des yeux',
    eyeRestHint: 'Règle des 20-20-20 : un rappel toutes les 20 minutes',
    testButton: 'Tester maintenant (dans 2 s)',
    shareButton: '📤 Envoyer à un ami',
    privacyLink: 'Politique de confidentialité',
    privacyTitle: 'Politique de confidentialité',
    privacyText:
      'Rappel de Posture enregistre votre prénom et vos préférences uniquement sur votre appareil ; ' +
      'ils ne sont jamais envoyés à un serveur.\n\n' +
      "Les publicités affichées dans l'application sont fournies par Google AdMob. AdMob peut " +
      "traiter certaines données, comme les identifiants de l'appareil, pour afficher des publicités. " +
      'Consultez la politique de confidentialité de Google pour en savoir plus.',
  },
  meditation: {
    header: 'Méditation',
    subtitle: 'Mouvements courts, exercices et leçons de respiration pour soutenir votre posture.',
    statsStreak: "jours d'affilée",
    statsSessions: 'séances terminées',
    badgeReady: 'Démarrer',
    badgeSoon: 'Bientôt',
    comingSoonBody: "Cette section arrive bientôt. Restez à l'écoute ! 🌱",
    categories: {
      movements: {
        title: 'Mouvements',
        description: '5 courts étirements de bureau pour se délier et se détendre.',
      },
      exercises: {
        title: 'Exercices',
        description: '5 exercices courts, sans matériel, pour renforcer la posture.',
      },
      breathing: {
        title: 'Leçons de respiration',
        description: 'Exercices de respiration guidés avec 3 techniques différentes.',
      },
    },
  },
  breathing: {
    header: 'Leçons de respiration',
    subtitle: 'Choisissez une technique, puis suivez le guide.',
    backToMeditation: '‹ Méditation',
    backToTechniques: '‹ Techniques',
    readyTitle: 'Prêt ?',
    doneTitle: 'Terminé 🌿',
    start: 'Démarrer',
    stop: 'Arrêter',
    restart: 'Recommencer',
    cycleLabel: 'Cycle {current} / {total}',
    cyclesCount: '{count} cycles.',
    phaseInhale: 'Inspirez',
    phaseHold: 'Retenez',
    phaseExhale: 'Expirez',
    techniques: {
      '478': {
        title: 'Respiration 4-7-8',
        description: "Inspirez 4 s, retenez 7 s, expirez 8 s. Apaise et aide à s'endormir.",
      },
      box: {
        title: 'Respiration carrée',
        description: '4-4-4-4 : inspirez, retenez, expirez, retenez. Favorise la concentration et le calme.',
      },
      coherent: {
        title: 'Cohérence cardiaque',
        description: '5-5 : inspiration et expiration égales. Une technique courante pour équilibrer le rythme cardiaque.',
      },
    },
  },
  stepSession: {
    backToMeditation: '‹ Méditation',
    approxMinutes: '· ~{minutes} min au total.',
    readyTitle: 'Prêt ?',
    readyBody: 'Suivez les étapes au fur et à mesure, chacune est rapide.',
    doneTitle: 'Bravo !',
    doneBody: 'Vous venez de faire une petite pause, mais efficace, pour votre posture.',
    nextButton: 'Suivant ›',
    start: 'Démarrer',
    stop: 'Arrêter',
    restart: 'Recommencer',
  },
  movements: {
    title: 'Étirements de bureau',
    subtitleSuffix: 'mouvements courts',
    items: {
      'shoulder-shrug': {
        title: "Haussements d'épaules",
        instruction: 'Montez les épaules vers les oreilles, maintenez 2 secondes, relâchez. Répétez.',
      },
      'neck-stretch': {
        title: 'Étirement de la nuque',
        instruction: 'Inclinez lentement la tête vers la droite, maintenez quelques secondes, puis vers la gauche.',
      },
      'shoulder-blade': {
        title: 'Rapprochement des omoplates',
        instruction: "Ramenez les épaules en arrière et serrez les omoplates l'une contre l'autre.",
      },
      'wrist-stretch': {
        title: 'Étirement du poignet',
        instruction: "Tendez le bras, paume vers le haut, et tirez doucement les doigts vers l'arrière avec l'autre main.",
      },
      'torso-twist': {
        title: 'Rotation du buste',
        instruction: 'Assis, gardez les hanches immobiles et tournez lentement le buste vers la droite, puis vers la gauche.',
      },
    },
  },
  exercises: {
    title: 'Renforcement de la posture',
    subtitleSuffix: 'exercices sans matériel',
    items: {
      'wall-pushup': {
        title: 'Pompes au mur',
        instruction: 'Posez les mains contre un mur et faites 10 pompes pour travailler les pectoraux et les épaules.',
      },
      'chair-squat': {
        title: 'Squat à la chaise',
        instruction: 'Descendez lentement comme pour vous asseoir, puis remontez sans toucher la chaise. 10 répétitions.',
      },
      'plank-hold': {
        title: 'Gainage',
        instruction: 'Tenez la planche appuyé sur un bureau, un mur ou au sol, abdominaux serrés.',
      },
      'calf-raise': {
        title: 'Montées sur pointes',
        instruction: 'Montez sur la pointe des pieds, puis redescendez lentement. 15 répétitions.',
      },
      'seated-core': {
        title: 'Contraction abdominale assis',
        instruction: 'Assis, contractez les abdominaux et maintenez 5 secondes, puis relâchez. Répétez.',
      },
    },
  },
  stats: {
    header: 'Vos statistiques',
    backToMeditation: '‹ Méditation',
    streakLabel: "jours d'affilée",
    sessionsLabel: 'séances au total',
    weekSectionLabel: '7 derniers jours',
    typeSectionLabel: 'Par type',
    shareButton: '📤 Partager vos progrès',
    typeBreathing: 'Leçons de respiration',
    typeMovements: 'Mouvements',
    typeExercises: 'Exercices',
    weekdays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  },
  onboarding: {
    next: 'Suivant',
    start: 'Commencer',
    skip: 'Passer',
    slides: [
      {
        emoji: '🧘',
        title: 'Bienvenue !',
        description:
          'Cette application vous rappelle en douceur de vous tenir droit et de reposer vos yeux à intervalles réguliers.',
      },
      {
        emoji: '⏱️',
        title: 'Choisissez votre intervalle',
        description:
          "Faites glisser le curseur de l'écran d'accueil ou touchez un préréglage, puis appuyez sur DÉMARRER. C'est tout.",
      },
      {
        emoji: '🌿',
        title: 'Il y a aussi de la méditation',
        description:
          'Enrichissez vos pauses avec des exercices de respiration, des étirements de bureau et du renforcement postural.',
      },
    ],
  },
  name: {
    emoji: '🧘',
    title: 'Bienvenue !',
    subtitle: 'Comment devons-nous vous appeler pour personnaliser vos rappels ?',
    placeholder: 'Votre prénom',
    continueButton: 'Continuer',
  },
  notifications: {
    title: 'Rappel de posture',
    snoozeButton: 'Reporter ({minutes} min)',
    doneButton: 'Fait',
    messages: [
      'Tournez doucement la nuque vers la droite, puis vers la gauche 🙆',
      'Rapprochez le menton de la poitrine pour étirer la nuque 🦢',
      "Vous êtes trop près de l'écran, reculez la nuque 📱",
      'Montez les épaules vers les oreilles, puis relâchez 🤷',
      'Ramenez les épaules en arrière et ouvrez la poitrine 💪',
      "Serrez les omoplates l'une contre l'autre 🔙",
      'Asseyez-vous droit, le dos contre le dossier 🪑',
      "Allongez la colonne, imaginez qu'on vous tire vers le haut par le sommet du crâne 🧍",
      'Redressez le dos et rentrez doucement le ventre 🎯',
      'Fermez fort les yeux plusieurs fois, puis détendez-les 😌',
      "Éloignez-vous de l'écran et reposez un peu vos yeux 🖥️",
      'Inspirez profondément et relâchez les épaules 🌬️',
      'Fermez les yeux quelques secondes et concentrez-vous sur votre respiration 🧘',
    ],
    eyeRestMessage: 'Fixez un point éloigné pendant 20 secondes (règle des 20-20-20) 👀',
  },
  sharing: {
    appMessage:
      "J'utilise Rappel de Posture pour penser à me tenir droit et à reposer mes yeux 🧘 Tu veux l'essayer aussi ?",
    achievementMessage:
      "🔥 Je prends soin de ma posture depuis {streak} jours d'affilée ! {totalSessions} séances terminées jusqu'ici. Essaie Rappel de Posture 🧘",
    milestoneAlertTitle: '🎉 Nouveau palier de série !',
    milestone7: "7 jours d'affilée ! Beau début 🔥",
    milestone30: "30 jours d'affilée ! C'est devenu une habitude 🎉",
    milestone100: "100 jours d'affilée ! Une série incroyable 🏆",
    shareCta: 'Partager',
    closeCta: 'Fermer',
  },
};
