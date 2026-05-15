// ─────────────────────────────────────────────
//  FitTracker — schedule.js
//  Catálogo de actividades y horarios por etapa
// ─────────────────────────────────────────────

// ── Catálogo de actividades ──────────────────
const ACTIVITIES = {
  mob_am: {
    id: 'mob_am', name: 'Movilidad AM', emoji: '🧘',
    type: 'mobility', intensity: 'low', duration: 20,
    notes: 'Cat-cow · 90/90 cadera · Hip CARs · Movilidad torácica · Rotaciones hombro · Neck CARs'
  },
  flex_am: {
    id: 'flex_am', name: 'Flexibilidad AM', emoji: '🧘',
    type: 'flexibility', intensity: 'low', duration: 20,
    notes: 'Posición del niño · Psoas lunge · Piriforme · Isquios con banda · Lat stretch · Pectoral en marco · Pigeon suave'
  },
  flex_soft: {
    id: 'flex_soft', name: 'Flexibilidad Suave', emoji: '🧘',
    type: 'flexibility', intensity: 'low', duration: 20,
    notes: 'Bloque B suave / yoga / respiración'
  },
  mob_post: {
    id: 'mob_post', name: 'Movilidad Post-Gym', emoji: '🧘',
    type: 'mobility', intensity: 'low', duration: 15,
    notes: 'Torácica en rodillo · Cadera 90/90 · Hombros cat-cow'
  },
  gym_a: {
    id: 'gym_a', name: 'Gym A — Empuje', emoji: '🏋️',
    type: 'gym', intensity: 'high', duration: 60,
    notes: [
      'CALENTAMIENTO: Bicicleta 3min + rodillo torácico + band pull-aparts ×15',
      'Press de Banca Plano 4×6-8',
      'Press Banca Inclinado 30° 3×8-10',
      'Press Hombros Sentado Mancuernas 3×8-10',
      'Elevaciones Laterales 3×12-15',
      'Extensión Tríceps Polea (cuerda) 3×12-15',
      'Skull Crushers Mancuernas 2×10-12',
      'CORE: Dead Bug 3×10 · Pallof Press 3×12 · Plank Lateral 3×20seg'
    ].join('\n')
  },
  gym_b: {
    id: 'gym_b', name: 'Gym B — Tirón', emoji: '🏋️',
    type: 'gym', intensity: 'high', duration: 65,
    notes: [
      'CALENTAMIENTO: Remo ergómetro 3min + band pull-aparts ×20 + face pulls banda ×20',
      'Jalón al Pecho (agarre ancho) 4×8-10',
      'Remo Mancuerna en Banco 3×8-10 c/lado',
      'Remo Polea Baja 3×10-12',
      'Face Pulls con polea 3×15-20',
      'Curl de Bíceps con Barra 3×10-12',
      'Curl de Martillo 2×12-15',
      'CORE: Bird Dog 3×10 · Hollow Body 3×20seg · Plank 3×30seg'
    ].join('\n')
  },
  gym_c: {
    id: 'gym_c', name: 'Gym C — Piernas + Core', emoji: '🏋️',
    type: 'gym', intensity: 'high', duration: 80,
    notes: [
      'CALENTAMIENTO: Bici 3min + 90/90 cadera + clamshells banda 2×15 + puente glúteos 2×15 + sentadillas aire 2×15',
      'Leg Press 4×8-10 (pie alto y abierto)',
      'Goblet Squat 3×10-12 (KB o mancuerna)',
      'Bulgarian Split Squat mancuernas 3×8-10 c/pierna',
      'Hip Thrust (barra o mancuerna) 4×10-12',
      'Curl Isquiotibiales máquina tumbado 3×12-15',
      'Extensión Cuádriceps máquina 2×15',
      'Elevaciones Gemelo 3×15-20',
      'CORE 15min: Ab Wheel 3×8 · Leg Raises colgado 3×12 · Pallof 3×12 · Plank 3×40seg · McGill Side 2×30seg c/lado'
    ].join('\n')
  },
  swim_soft: {
    id: 'swim_soft', name: 'Nado Suave', emoji: '🏊',
    type: 'swim', intensity: 'low', duration: 20,
    notes: 'Libre o espalda · Ritmo cómodo · Recuperación activa post-gym · Sem 1-3: 20min · Sem 4+: 25min'
  },
  swim_intense: {
    id: 'swim_intense', name: 'Natación Intensa', emoji: '🏊',
    type: 'swim', intensity: 'high', duration: 35,
    notes: 'Calentamiento 200m · Sem 1-4: 6×100m c/30-40seg desc · Sem 5+: 8×100m ó 4×200m · Enfriamiento 150m · Evitar mariposa y braza'
  },
  swim_medium: {
    id: 'swim_medium', name: 'Natación Media', emoji: '🏊',
    type: 'swim', intensity: 'medium', duration: 30,
    notes: 'Calentamiento 200m · 4×50m c/20seg desc · 200m ritmo sostenido · 4×50m · Enfriamiento 100m'
  },
  kb: {
    id: 'kb', name: 'KB + Calistenia', emoji: '🔔',
    type: 'kb', intensity: 'medium', duration: 45,
    notes: [
      'SEM IMPAR (Fuerza): Turkish Get-Up 3×3-4c/lado (8kg) · Goblet Squat 3×10-12 (12kg) · KB Clean & Press 3×6-8c/brazo (8-12kg) · KB Remo 3×8-10c/lado · Anillos Row 3×10-12 · Anillos Push-up 3×8-12',
      'SEM PAR (Circuito): 5 rondas 40/20 → KB Goblet · Push-up pausa · Anillo Row · KB Halo 8kg · Plank to Shoulder Tap | 90seg entre rondas',
      '⚠️ KB Swing: solo con aval médico (bisagra de cadera, no flexión lumbar)'
    ].join('\n')
  },
  hiking: {
    id: 'hiking', name: 'Hiking', emoji: '🥾',
    type: 'hiking', intensity: 'medium', duration: 90,
    notes: 'Sem 1-4: 50-70min terreno plano · mochila máx 2kg · Sem 5-8: 70-100min desnivel suave · mochila máx 4kg · 5min movilidad dinámica antes · 8min estiramientos después'
  },
  sauna: {
    id: 'sauna', name: 'Sauna + Vapor', emoji: '🧖',
    type: 'sauna', intensity: 'low', duration: 30,
    notes: 'Recuperación activa · Hidratarse bien antes y después'
  },
  bjj: {
    id: 'bjj', name: 'Jiu-Jitsu', emoji: '🥋',
    type: 'bjj', intensity: 'high', duration: 120,
    notes: 'Clase BJJ 2h · Bloqueo de horario tarde'
  },
  box: {
    id: 'box', name: 'Box / MMA', emoji: '🥊',
    type: 'box', intensity: 'high', duration: 90,
    notes: 'Clase Box o MMA 60-90min'
  },
  rest: {
    id: 'rest', name: 'Descanso Activo', emoji: '😴',
    type: 'rest', intensity: 'low', duration: 0,
    notes: 'Caminata ligera, stretching suave, sin carga'
  }
};

// Alias corto para el catálogo
const A = id => ({ ...ACTIVITIES[id] });

// ── Horarios por etapa ────────────────────────
// Claves de días: 1=Lunes … 7=Domingo (JS day % 7 + corrección)
// Cada día es un array de actividades en orden de ejecución

const SCHEDULES = {

  // ── ETAPA 0: Sin artes marciales ─────────────
  '0': {
    1: [A('mob_am'),   A('gym_a'), A('swim_soft')],                 // Lunes
    2: [A('flex_am'),  A('swim_intense')],                          // Martes
    3: [A('mob_am'),   A('gym_b'), A('mob_post'), A('sauna')],      // Miércoles
    4: [A('flex_am'),  A('swim_medium')],                           // Jueves
    5: [A('mob_am'),   A('gym_c')],                                 // Viernes
    6: [A('flex_am'),  A('kb')],                                    // Sábado (impar=KB · par=Hiking)
    7: [A('flex_soft'), A('hiking'), A('sauna')]                    // Domingo
  },

  // ── ETAPA 1.1 con 2 días Box (L + J) ─────────
  '1.1_2box': {
    1: [A('mob_am'),   A('box')],                                   // Lunes
    2: [A('flex_am'),  A('gym_a'), A('swim_soft')],                 // Martes
    3: [A('mob_am'),   A('swim_intense'), A('sauna')],              // Miércoles
    4: [A('flex_am'),  A('box')],                                   // Jueves
    5: [A('mob_am'),   A('gym_b'), A('swim_medium')],              // Viernes
    6: [A('flex_am'),  A('gym_c')],                                 // Sábado
    7: [A('flex_soft'), A('hiking'), A('sauna')]                    // Domingo
  },

  // ── ETAPA 1.1 con 3 días Box (L + J + S) ─────
  '1.1_3box': {
    1: [A('mob_am'),   A('box')],                                   // Lunes
    2: [A('flex_am'),  A('gym_a'), A('swim_soft')],                 // Martes
    3: [A('mob_am'),   A('swim_intense'), A('sauna')],              // Miércoles
    4: [A('flex_am'),  A('box')],                                   // Jueves
    5: [A('mob_am'),   A('gym_b'), A('swim_medium')],              // Viernes
    6: [A('flex_am'),  A('box')],                                   // Sábado
    7: [A('flex_soft'), A('gym_c'), A('sauna')]                     // Domingo
  },

  // ── ETAPA 2: BJJ ×3 + Box ×1 ─────────────────
  '2': {
    1: [A('mob_am'),   A('swim_intense'), A('bjj')],                // Lunes
    2: [A('flex_am'),  A('gym_a'), A('swim_soft'), A('bjj')],      // Martes (gym vol -15% este día)
    3: [A('mob_am'),   A('gym_b'), A('mob_post'), A('sauna')],      // Miércoles
    4: [A('flex_am'),  A('swim_medium'), A('bjj')],                 // Jueves
    5: [A('mob_am'),   A('box')],                                   // Viernes
    6: [A('flex_am'),  A('gym_c')],                                 // Sábado (o Hiking)
    7: [A('flex_soft'), A('hiking'), A('sauna')]                    // Domingo
  }
};

// ── Variantes de fin de semana ────────────────
// El sábado alterna KB (sem impar) / Hiking (sem par) en Etapa 0
// El domingo lleva hiking si el sábado fue KB, y sauna siempre
const WEEKEND_VARIANTS = {
  '0': {
    sat_odd:  [A('flex_am'), A('kb')],
    sat_even: [A('flex_am'), A('hiking')],
    sun_after_kb:     [A('flex_soft'), A('hiking'), A('sauna')],
    sun_after_hiking: [A('flex_soft'), A('rest'),   A('sauna')]
  }
};

// ── Función principal de consulta ────────────
/**
 * Devuelve el array de actividades para una fecha dada.
 * @param {Date|string} date
 * @param {string} stageId  - '0' | '1.1' | '2'
 * @param {string} variant  - '2box' | '3box' (solo para etapa 1.1)
 * @param {boolean} satWasKB - si el sábado de esa semana fue KB
 */
function getSchedule(date, stageId, variant, satWasKB) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00');
  const jsDay = d.getDay();           // 0=Sun … 6=Sat
  const dayKey = jsDay === 0 ? 7 : jsDay; // convertir a 1=Mon … 7=Sun

  // Resolver clave del horario
  let scheduleKey = stageId;
  if (stageId === '1.1') {
    scheduleKey = '1.1_' + (variant || CONFIG.STAGE_11_VARIANT || '2box');
  }

  // Variantes de fin de semana en Etapa 0
  if (stageId === '0') {
    const weekNum = getISOWeek(d);
    const isOddWeek = weekNum % 2 === 1;
    if (dayKey === 6) {
      return isOddWeek
        ? WEEKEND_VARIANTS['0'].sat_odd
        : WEEKEND_VARIANTS['0'].sat_even;
    }
    if (dayKey === 7) {
      return satWasKB
        ? WEEKEND_VARIANTS['0'].sun_after_kb
        : WEEKEND_VARIANTS['0'].sun_after_hiking;
    }
  }

  const sched = SCHEDULES[scheduleKey];
  return (sched && sched[dayKey]) ? sched[dayKey] : [];
}

// ── Conteos mínimos de la semana ─────────────
/**
 * Calcula cuántos gym / swim hay programados en una semana completa.
 * Útil para mostrar los mínimos requeridos vs. el horario real.
 */
function getWeeklyMinimums(stageId, variant) {
  let gym = 0, swim = 0;
  for (let day = 1; day <= 7; day++) {
    const acts = (() => {
      let key = stageId === '1.1' ? '1.1_' + (variant || '2box') : stageId;
      return SCHEDULES[key]?.[day] || [];
    })();
    acts.forEach(a => {
      if (a.type === 'gym')  gym++;
      if (a.type === 'swim') swim++;
    });
  }
  return { gym, swim };
}
