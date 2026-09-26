export const es = {
  common: {
    back: '‹ Atrás',
  },
  tabBar: {
    home: 'Inicio',
    meditation: 'Meditación',
    settings: 'Ajustes',
  },
  home: {
    greeting: 'Hola, {name} 👋',
    statusActive: 'Activo: cada {minutes} minutos',
    quietSuffix: ' (silencio {start}–{end})',
    statusInactive: 'Desactivado: toca el botón para empezar',
    reminderCount: 'Hoy has recibido {count} recordatorios 🎯',
    start: 'INICIAR',
    stop: 'DETENER',
    intervalSectionLabel: 'Intervalo del recordatorio',
    customPlaceholder: 'otro',
    minuteUnit: 'min',
    minutesWord: 'minutos',
    sliderAccessibilityLabel: 'Control deslizante del intervalo',
    customInputLabel: 'Introduce los minutos deseados',
    minutesLabel: '{minutes} minutos',
  },
  settings: {
    header: 'Ajustes',
    nameLabel: 'Tu nombre',
    namePlaceholder: 'Tu nombre',
    appearanceLabel: 'Apariencia',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    languageLabel: 'Idioma',
    alertModeLabel: 'Tipo de aviso',
    alertSilent: 'Silencio',
    alertVibrate: 'Vibración',
    alertSound: 'Sonido',
    vibrationIntensityLabel: 'Intensidad de vibración',
    vibrationLight: 'Suave',
    vibrationMedium: 'Media',
    vibrationStrong: 'Fuerte',
    quietHoursLabel: 'Horas de silencio nocturno',
    quietStartLabel: 'Inicio',
    quietEndLabel: 'Fin',
    eyeRestLabel: '👀 Descanso visual',
    eyeRestHint: 'Regla 20-20-20: un recordatorio cada 20 minutos',
    testButton: 'Probar ahora (en 2 s)',
    shareButton: '📤 Enviar a un amigo',
    privacyLink: 'Política de privacidad',
    privacyTitle: 'Política de privacidad',
    privacyText:
      'Recordatorio de Postura guarda tu nombre y tus preferencias únicamente en tu dispositivo; ' +
      'nunca los envía a ningún servidor.\n\n' +
      'Los anuncios que se muestran en la app los proporciona Google AdMob. AdMob puede ' +
      'procesar algunos datos, como identificadores del dispositivo, para mostrar anuncios. ' +
      'Consulta la política de privacidad de Google para más información.',
  },
  meditation: {
    header: 'Meditación',
    subtitle: 'Movimientos cortos, ejercicios y lecciones de respiración para cuidar tu postura.',
    statsStreak: 'días seguidos',
    statsSessions: 'sesiones completadas',
    badgeReady: 'Empezar',
    badgeSoon: 'Pronto',
    comingSoonBody: 'Esta sección llegará pronto. ¡Estate atento! 🌱',
    categories: {
      movements: {
        title: 'Movimientos',
        description: '5 estiramientos breves de escritorio para soltar y relajar el cuerpo.',
      },
      exercises: {
        title: 'Ejercicios',
        description: '5 ejercicios cortos, sin material, para fortalecer la postura.',
      },
      breathing: {
        title: 'Lecciones de respiración',
        description: 'Ejercicios de respiración guiados con 3 técnicas diferentes.',
      },
    },
  },
  breathing: {
    header: 'Lecciones de respiración',
    subtitle: 'Elige una técnica y síguela.',
    backToMeditation: '‹ Meditación',
    backToTechniques: '‹ Técnicas',
    readyTitle: '¿Listo?',
    doneTitle: 'Hecho 🌿',
    start: 'Empezar',
    stop: 'Parar',
    restart: 'Repetir',
    cycleLabel: 'Ciclo {current} / {total}',
    cyclesCount: '{count} ciclos.',
    phaseInhale: 'Inhala',
    phaseHold: 'Mantén',
    phaseExhale: 'Exhala',
    techniques: {
      '478': {
        title: 'Respiración 4-7-8',
        description: 'Inhala 4 s, mantén 7 s, exhala 8 s. Calma y ayuda a conciliar el sueño.',
      },
      box: {
        title: 'Respiración cuadrada',
        description: '4-4-4-4: inhala, mantén, exhala, mantén. Mejora la concentración y la calma.',
      },
      coherent: {
        title: 'Respiración coherente',
        description: '5-5: inhalación y exhalación iguales. Técnica muy usada para equilibrar el ritmo cardíaco.',
      },
    },
  },
  stepSession: {
    backToMeditation: '‹ Meditación',
    approxMinutes: '· ~{minutes} min en total.',
    readyTitle: '¿Listo?',
    readyBody: 'Sigue los pasos a medida que aparecen; cada uno es rápido.',
    doneTitle: '¡Buen trabajo!',
    doneBody: 'Acabas de hacer una pausa pequeña pero eficaz por tu postura.',
    nextButton: 'Siguiente ›',
    start: 'Empezar',
    stop: 'Parar',
    restart: 'Repetir',
  },
  movements: {
    title: 'Estiramientos de escritorio',
    subtitleSuffix: 'movimientos cortos',
    items: {
      'shoulder-shrug': {
        title: 'Encogimiento de hombros',
        instruction: 'Sube los hombros hacia las orejas, mantén 2 segundos y suelta. Repite.',
      },
      'neck-stretch': {
        title: 'Estiramiento de cuello',
        instruction: 'Inclina despacio la cabeza hacia la derecha, mantén unos segundos y luego hacia la izquierda.',
      },
      'shoulder-blade': {
        title: 'Apretar los omóplatos',
        instruction: 'Lleva los hombros hacia atrás y junta los omóplatos.',
      },
      'wrist-stretch': {
        title: 'Estiramiento de muñeca',
        instruction: 'Estira el brazo con la palma hacia arriba y tira suavemente de los dedos hacia atrás con la otra mano.',
      },
      'torso-twist': {
        title: 'Giro de torso',
        instruction: 'Sentado, mantén las caderas quietas y gira despacio el torso a la derecha y luego a la izquierda.',
      },
    },
  },
  exercises: {
    title: 'Fortalecimiento de la postura',
    subtitleSuffix: 'ejercicios sin material',
    items: {
      'wall-pushup': {
        title: 'Flexión en la pared',
        instruction: 'Apoya las manos en una pared y haz 10 flexiones para trabajar pecho y hombros.',
      },
      'chair-squat': {
        title: 'Sentadilla con silla',
        instruction: 'Baja despacio como si te sentaras y vuelve a subir sin tocar la silla. 10 repeticiones.',
      },
      'plank-hold': {
        title: 'Plancha',
        instruction: 'Mantén una plancha apoyado en el escritorio, la pared o el suelo, con el abdomen firme.',
      },
      'calf-raise': {
        title: 'Elevación de talones',
        instruction: 'Ponte de puntillas y baja despacio. 15 repeticiones.',
      },
      'seated-core': {
        title: 'Contracción abdominal sentado',
        instruction: 'Sentado, aprieta el abdomen y mantén 5 segundos; suelta. Repite.',
      },
    },
  },
  stats: {
    header: 'Tus estadísticas',
    backToMeditation: '‹ Meditación',
    streakLabel: 'días seguidos',
    sessionsLabel: 'sesiones en total',
    weekSectionLabel: 'Últimos 7 días',
    typeSectionLabel: 'Por tipo',
    shareButton: '📤 Comparte tu progreso',
    typeBreathing: 'Lecciones de respiración',
    typeMovements: 'Movimientos',
    typeExercises: 'Ejercicios',
    weekdays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  },
  onboarding: {
    next: 'Siguiente',
    start: 'Empezar',
    skip: 'Omitir',
    slides: [
      {
        emoji: '🧘',
        title: '¡Bienvenido!',
        description:
          'Esta app te recuerda con suavidad que te sientes derecho y descanses la vista a intervalos regulares.',
      },
      {
        emoji: '⏱️',
        title: 'Elige tu intervalo',
        description:
          'Mueve el control de la pantalla de inicio o toca un valor predefinido y pulsa INICIAR. Eso es todo.',
      },
      {
        emoji: '🌿',
        title: 'También hay meditación',
        description:
          'Enriquece tus pausas con ejercicios de respiración, estiramientos de escritorio y trabajo de fortalecimiento postural.',
      },
    ],
  },
  name: {
    emoji: '🧘',
    title: '¡Bienvenido!',
    subtitle: '¿Cómo quieres que te llamemos para personalizar tus recordatorios?',
    placeholder: 'Tu nombre',
    continueButton: 'Continuar',
  },
  notifications: {
    title: 'Recordatorio de postura',
    snoozeButton: 'Posponer ({minutes} min)',
    doneButton: 'Hecho',
    messages: [
      'Gira el cuello con suavidad hacia la derecha y luego hacia la izquierda 🙆',
      'Acerca la barbilla al pecho para estirar el cuello 🦢',
      'Estás muy cerca de la pantalla, echa el cuello hacia atrás 📱',
      'Sube los hombros hacia las orejas y luego suéltalos 🤷',
      'Lleva los hombros hacia atrás y abre el pecho 💪',
      'Junta los omóplatos 🔙',
      'Siéntate derecho y apoya la espalda en el respaldo 🪑',
      'Alarga la columna, imagina que te tiran hacia arriba desde la coronilla 🧍',
      'Endereza la espalda y mete suavemente el abdomen 🎯',
      'Cierra los ojos con fuerza unas cuantas veces y luego relájalos 😌',
      'Aparta la vista de la pantalla y descansa los ojos un momento 🖥️',
      'Respira hondo y relaja los hombros 🌬️',
      'Cierra los ojos unos segundos y concéntrate solo en tu respiración 🧘',
    ],
    eyeRestMessage: 'Mira algo lejano durante 20 segundos (regla 20-20-20) 👀',
  },
  sharing: {
    appMessage:
      'Uso Recordatorio de Postura para acordarme de sentarme derecho y descansar la vista 🧘 ¿Quieres probarla?',
    achievementMessage:
      '🔥 ¡Llevo {streak} días seguidos cuidando mi postura! {totalSessions} sesiones completadas hasta ahora. Prueba Recordatorio de Postura 🧘',
    milestoneAlertTitle: '🎉 ¡Nuevo hito de racha!',
    milestone7: '¡7 días seguidos! Gran comienzo 🔥',
    milestone30: '¡30 días seguidos! Ya es un hábito 🎉',
    milestone100: '¡100 días seguidos! Una racha increíble 🏆',
    shareCta: 'Compartir',
    closeCta: 'Cerrar',
  },
};
