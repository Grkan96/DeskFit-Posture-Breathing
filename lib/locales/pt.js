export const pt = {
  common: {
    back: '‹ Voltar',
  },
  tabBar: {
    home: 'Início',
    meditation: 'Meditação',
    settings: 'Ajustes',
  },
  home: {
    greeting: 'Oi, {name} 👋',
    statusActive: 'Ativo — a cada {minutes} minutos',
    quietSuffix: ' ({start}–{end} em silêncio)',
    statusInactive: 'Desligado — toque no botão para começar',
    reminderCount: 'Você recebeu {count} lembretes hoje 🎯',
    start: 'INICIAR',
    stop: 'PARAR',
    intervalSectionLabel: 'Intervalo dos lembretes',
    customPlaceholder: 'outro',
    minuteUnit: 'min',
    minutesWord: 'minutos',
    sliderAccessibilityLabel: 'Controle deslizante do intervalo dos lembretes',
    customInputLabel: 'Digite os minutos que quiser',
    minutesLabel: '{minutes} minutos',
  },
  settings: {
    header: 'Ajustes',
    nameLabel: 'Seu nome',
    namePlaceholder: 'Seu nome',
    appearanceLabel: 'Aparência',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    languageLabel: 'Idioma',
    alertModeLabel: 'Modo de alerta',
    alertSilent: 'Silencioso',
    alertVibrate: 'Vibrar',
    alertSound: 'Som',
    vibrationIntensityLabel: 'Intensidade da vibração',
    vibrationLight: 'Leve',
    vibrationMedium: 'Média',
    vibrationStrong: 'Forte',
    quietHoursLabel: 'Horário de silêncio noturno',
    quietStartLabel: 'Início',
    quietEndLabel: 'Fim',
    eyeRestLabel: '👀 Descanso para os olhos',
    eyeRestHint: 'Regra 20-20-20 — um lembrete a cada 20 minutos',
    testButton: 'Testar agora (em 2 s)',
    shareButton: '📤 Enviar para um amigo',
    privacyLink: 'Política de Privacidade',
    privacyTitle: 'Política de Privacidade',
    privacyText:
      'O Lembrete de Postura guarda seu nome e suas preferências apenas no seu ' +
      'aparelho; eles nunca são enviados para nenhum servidor.\n\n' +
      'Os anúncios exibidos no app são fornecidos pelo Google AdMob. O AdMob pode ' +
      'processar alguns dados, como identificadores do dispositivo, para exibir ' +
      'anúncios. Veja a política de privacidade do Google para mais informações.',
  },
  meditation: {
    header: 'Meditação',
    subtitle: 'Movimentos rápidos, exercícios e aulas de respiração para cuidar da sua postura.',
    statsStreak: 'dias seguidos',
    statsSessions: 'sessões feitas',
    badgeReady: 'Começar',
    badgeSoon: 'Em breve',
    comingSoonBody: 'Esta seção chega em breve. Fique de olho! 🌱',
    categories: {
      movements: {
        title: 'Movimentos',
        description: '5 alongamentos rápidos na mesa para soltar o corpo e relaxar.',
      },
      exercises: {
        title: 'Exercícios',
        description: '5 exercícios rápidos, sem equipamento, para fortalecer a postura.',
      },
      breathing: {
        title: 'Aulas de respiração',
        description: 'Exercícios de respiração guiados com 3 técnicas diferentes.',
      },
    },
  },
  breathing: {
    header: 'Aulas de respiração',
    subtitle: 'Escolha uma técnica e acompanhe.',
    backToMeditation: '‹ Meditação',
    backToTechniques: '‹ Técnicas',
    readyTitle: 'Pronto?',
    doneTitle: 'Concluído 🌿',
    start: 'Começar',
    stop: 'Parar',
    restart: 'Começar de novo',
    cycleLabel: 'Ciclo {current} / {total}',
    cyclesCount: '{count} ciclos.',
    phaseInhale: 'Inspire',
    phaseHold: 'Segure',
    phaseExhale: 'Expire',
    techniques: {
      '478': {
        title: 'Respiração 4-7-8',
        description: 'Inspire 4 s, segure 7 s, expire 8 s. Acalma e ajuda você a relaxar para dormir.',
      },
      box: {
        title: 'Box Breathing',
        description: '4-4-4-4: inspire, segure, expire, segure. Aumenta o foco e a calma.',
      },
      coherent: {
        title: 'Respiração coerente',
        description: '5-5: inspire e expire no mesmo tempo. Uma técnica bem conhecida para equilibrar os batimentos cardíacos.',
      },
    },
  },
  stepSession: {
    backToMeditation: '‹ Meditação',
    approxMinutes: '· ~{minutes} min no total.',
    readyTitle: 'Pronto?',
    readyBody: 'Siga os passos conforme aparecem, cada um é rapidinho.',
    doneTitle: 'Mandou bem!',
    doneBody: 'Você acabou de fazer uma pausa pequena, mas eficaz, pela sua postura.',
    nextButton: 'Próximo ›',
    start: 'Começar',
    stop: 'Parar',
    restart: 'Começar de novo',
  },
  movements: {
    title: 'Alongamentos na mesa',
    subtitleSuffix: 'movimentos rápidos',
    items: {
      'shoulder-shrug': {
        title: 'Elevação dos ombros',
        instruction: 'Levante os ombros em direção às orelhas, segure 2 segundos e solte. Repita.',
      },
      'neck-stretch': {
        title: 'Alongamento do pescoço',
        instruction: 'Incline a cabeça devagar para a direita, segure alguns segundos e depois para a esquerda.',
      },
      'shoulder-blade': {
        title: 'Aperto das escápulas',
        instruction: 'Leve os ombros para trás e aperte as escápulas uma contra a outra.',
      },
      'wrist-stretch': {
        title: 'Alongamento do punho',
        instruction: 'Estique o braço com a palma para cima e puxe os dedos para trás com a outra mão, com cuidado.',
      },
      'torso-twist': {
        title: 'Rotação do tronco',
        instruction: 'Sentado, mantenha o quadril parado e gire o tronco devagar para a direita e depois para a esquerda.',
      },
    },
  },
  exercises: {
    title: 'Fortalecimento da postura',
    subtitleSuffix: 'exercícios sem equipamento',
    items: {
      'wall-pushup': {
        title: 'Flexão na parede',
        instruction: 'Apoie as mãos na parede e faça 10 flexões para trabalhar peito e ombros.',
      },
      'chair-squat': {
        title: 'Agachamento na cadeira',
        instruction: 'Desça devagar como se fosse sentar e suba sem encostar na cadeira. 10 repetições.',
      },
      'plank-hold': {
        title: 'Prancha',
        instruction: 'Faça uma prancha apoiado na mesa/parede ou no chão, com o abdômen firme.',
      },
      'calf-raise': {
        title: 'Elevação de panturrilha',
        instruction: 'Fique na ponta dos pés e desça devagar. 15 repetições.',
      },
      'seated-core': {
        title: 'Contração abdominal sentado',
        instruction: 'Sentado, contraia o abdômen, segure 5 segundos e solte. Repita.',
      },
    },
  },
  stats: {
    header: 'Suas estatísticas',
    backToMeditation: '‹ Meditação',
    streakLabel: 'dias seguidos',
    sessionsLabel: 'sessões no total',
    weekSectionLabel: 'Últimos 7 dias',
    typeSectionLabel: 'Por tipo',
    shareButton: '📤 Compartilhe seu progresso',
    typeBreathing: 'Aulas de respiração',
    typeMovements: 'Movimentos',
    typeExercises: 'Exercícios',
    weekdays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  },
  onboarding: {
    next: 'Próximo',
    start: 'Vamos começar',
    skip: 'Pular',
    slides: [
      {
        emoji: '🧘',
        title: 'Boas-vindas!',
        description:
          'Este app lembra você, com carinho e em intervalos regulares, de sentar direito e descansar os olhos.',
      },
      {
        emoji: '⏱️',
        title: 'Escolha seu intervalo',
        description:
          'Gire o seletor na tela inicial ou toque em uma opção pronta e aperte INICIAR. Só isso.',
      },
      {
        emoji: '🌿',
        title: 'Também tem meditação',
        description:
          'Deixe suas pausas mais completas com exercícios de respiração, alongamentos na mesa e exercícios para fortalecer a postura.',
      },
    ],
  },
  name: {
    emoji: '🧘',
    title: 'Boas-vindas!',
    subtitle: 'Como podemos chamar você, para deixar seus lembretes mais pessoais?',
    placeholder: 'Seu nome',
    continueButton: 'Continuar',
  },
  notifications: {
    title: 'Lembrete de Postura',
    snoozeButton: 'Adiar ({minutes} min)',
    doneButton: 'Feito',
    messages: [
      'Vire o pescoço devagar para a direita e depois para a esquerda 🙆',
      'Leve o queixo em direção ao peito para alongar o pescoço 🦢',
      'Você está muito perto da tela, afaste a cabeça 📱',
      'Levante os ombros até as orelhas e depois solte 🤷',
      'Leve os ombros para trás e abra o peito 💪',
      'Aperte as escápulas uma contra a outra 🔙',
      'Sente direito e apoie as costas na cadeira 🪑',
      'Alongue a coluna, imagine um fio puxando o topo da sua cabeça para cima 🧍',
      'Endireite as costas e encolha a barriga de leve 🎯',
      'Feche bem os olhos algumas vezes e depois relaxe 😌',
      'Afaste-se um pouco da tela e descanse os olhos 🖥️',
      'Respire fundo e solte os ombros 🌬️',
      'Feche os olhos por alguns segundos e foque só na sua respiração 🧘',
    ],
    eyeRestMessage: 'Olhe para algo distante por 20 segundos (a regra 20-20-20) 👀',
  },
  sharing: {
    appMessage:
      'Eu uso o Lembrete de Postura para lembrar de sentar direito e descansar os olhos 🧘 Bora experimentar também?',
    achievementMessage:
      '🔥 Estou cuidando da minha postura há {streak} dias seguidos! Já são {totalSessions} sessões concluídas. Experimente o Lembrete de Postura você também 🧘',
    milestoneAlertTitle: '🎉 Nova marca na sequência!',
    milestone7: '7 dias seguidos! Ótimo começo 🔥',
    milestone30: '30 dias seguidos! Agora virou hábito 🎉',
    milestone100: '100 dias seguidos! Uma sequência incrível 🏆',
    shareCta: 'Compartilhar',
    closeCta: 'Fechar',
  },
};
