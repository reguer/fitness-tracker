const EXERCISE_LIBRARY = {
  press_banca: {
    name: 'Press banca',
    activity: 'gym_a',
    prescription: '4 x 6-8',
    technique: 'Escápulas retraídas, pies firmes, barra baja con control y sin arquear lumbar en exceso.',
    caution: 'Evita puente agresivo. Si molesta la espalda, reduce arco y carga.',
    alternatives: 'Press con mancuernas o máquina convergente.',
    image: 'assets/exercises/press_banca.svg'
  },
  press_inclinado: {
    name: 'Press inclinado',
    activity: 'gym_a',
    prescription: '3 x 8-10',
    technique: 'Banco a 30 grados, muñecas neutras y descenso controlado al pecho alto.',
    caution: 'No hiperextender lumbar para completar repeticiones.',
    alternatives: 'Press inclinado con mancuernas ligeras.',
    image: 'assets/exercises/press_inclinado.svg'
  },
  press_hombro_sentado: {
    name: 'Press hombro sentado',
    activity: 'gym_a',
    prescription: '3 x 8-10',
    technique: 'Espalda apoyada, costillas abajo, empuje vertical sin balanceo.',
    caution: 'Evita compensar con extensión lumbar.',
    alternatives: 'Press en máquina con respaldo.',
    image: 'assets/exercises/press_hombro_sentado.svg'
  },
  jalon_pecho: {
    name: 'Jalón al pecho',
    activity: 'gym_b',
    prescription: '4 x 8-10',
    technique: 'Pecho alto, codos hacia costillas, barra al pecho sin tirar con lumbar.',
    caution: 'No jalar detrás de la nuca.',
    alternatives: 'Jalón agarre neutro.',
    image: 'assets/exercises/jalon_pecho.svg'
  },
  remo_mancuerna: {
    name: 'Remo mancuerna',
    activity: 'gym_b',
    prescription: '3 x 8-10 por lado',
    technique: 'Apoya rodilla/mano en banco, columna neutral y tracción al bolsillo.',
    caution: 'No rotar ni encorvar la zona lumbar.',
    alternatives: 'Remo pecho apoyado.',
    image: 'assets/exercises/remo_mancuerna.svg'
  },
  remo_polea: {
    name: 'Remo polea baja',
    activity: 'gym_b',
    prescription: '3 x 10-12',
    technique: 'Torso estable, hombros lejos de orejas, pausa corta al cerrar.',
    caution: 'No balancear el tronco.',
    alternatives: 'Remo máquina con pecho apoyado.',
    image: 'assets/exercises/remo_polea.svg'
  },
  leg_press: {
    name: 'Leg press',
    activity: 'gym_c',
    prescription: '4 x 8-10',
    technique: 'Pies altos y abiertos, rango controlado, pelvis pegada al respaldo.',
    caution: 'No despegar cadera ni bloquear rodillas.',
    alternatives: 'Prensa horizontal ligera.',
    image: 'assets/exercises/leg_press.svg'
  },
  goblet_squat: {
    name: 'Goblet squat',
    activity: 'gym_c',
    prescription: '3 x 10-12',
    technique: 'Carga al pecho, torso alto, rodillas siguen línea del pie.',
    caution: 'Mantén columna neutral; corta rango si hay molestia lumbar.',
    alternatives: 'Box squat con mancuerna ligera.',
    image: 'assets/exercises/goblet_squat.svg'
  },
  bulgarian_split: {
    name: 'Bulgarian split squat',
    activity: 'gym_c',
    prescription: '3 x 8-10 por pierna',
    technique: 'Paso largo, torso estable, baja vertical y empuja con pierna frontal.',
    caution: 'Usa apoyo si pierdes balance.',
    alternatives: 'Split squat sin banco.',
    image: 'assets/exercises/bulgarian_split.svg'
  },
  hip_thrust: {
    name: 'Hip thrust',
    activity: 'gym_c',
    prescription: '4 x 10-12',
    technique: 'Barbilla ligeramente metida, pelvis neutra, pausa arriba con glúteos.',
    caution: 'No hiperextender lumbar arriba.',
    alternatives: 'Puente de glúteos en piso.',
    image: 'assets/exercises/hip_thrust.svg'
  },
  pallof_press: {
    name: 'Pallof press',
    activity: 'gym_a',
    prescription: '3 x 12 por lado',
    technique: 'Cadera cuadrada, abdomen activo, presiona al frente sin rotar.',
    caution: 'Elige tensión que no te haga girar.',
    alternatives: 'Pallof hold isométrico.',
    image: 'assets/exercises/pallof_press.svg'
  },
  dead_bug: {
    name: 'Dead bug',
    activity: 'gym_a',
    prescription: '3 x 10',
    technique: 'Lumbar neutra contra el piso, mueve lento brazo y pierna opuesta.',
    caution: 'Detén si pierdes control de pelvis.',
    alternatives: 'Heel taps.',
    image: 'assets/exercises/dead_bug.svg'
  }
};

function getExercisesForActivity(activityId) {
  return Object.keys(EXERCISE_LIBRARY)
    .map(id => Object.assign({ id: id }, EXERCISE_LIBRARY[id]))
    .filter(ex => ex.activity === activityId);
}
