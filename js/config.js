// ─────────────────────────────────────────────
//  FitTracker — config.js
//  ⚠️  Edita APPS_SCRIPT_URL después del setup
// ─────────────────────────────────────────────

const CONFIG = {

  // ⚠️ Pega aquí tu URL de Google Apps Script después del paso 3 del README
  APPS_SCRIPT_URL: '',

  // Firebase es opcional: la app funciona localmente si estos campos quedan vacíos.
  FIREBASE_CONFIG: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: ''
  },

  // Fechas de cada etapa (YYYY-MM-DD)
  STAGES: {
    '0': {
      id: '0',
      name: 'Etapa 0 — Fundación',
      short: 'Etapa 0',
      startDate: '2026-05-13',
      endDate:   '2026-05-31',
      color: '#22c55e',
      desc: 'Sin artes marciales. Movilidad, fuerza base, cardio cardiovascular.'
    },
    '1.1': {
      id: '1.1',
      name: 'Etapa 1.1 — Introducción Box / MMA',
      short: 'Etapa 1.1',
      startDate: '2026-06-01',
      endDate:   '2026-06-30',
      color: '#f59e0b',
      desc: '2–3 días de Box/MMA. Volumen gym se ajusta según días de combate.'
    },
    '2': {
      id: '2',
      name: 'Etapa 2 — BJJ Full',
      short: 'Etapa 2',
      startDate: '2026-07-01',
      endDate:   null,           // sin fin definido
      color: '#6366f1',
      desc: 'BJJ ×3 (L/M/J) + Box ×1 (V). Gym como soporte de fuerza.'
    }
  },

  // Mínimos semanales obligatorios
  MINIMUMS: {
    gym:   3,
    swim:  3
  },

  // Umbrales de consistencia
  CONSISTENCY: {
    GOOD:  0.80,   // → aplicar progresión
    GREAT: 0.95    // → semana perfecta
  },

  // Variante de Etapa 1.1: '2box' | '3box'
  // Cámbialo cuando añadas el tercer día de box
  STAGE_11_VARIANT: '2box',

  // Número de semana de descarga (cada 4 semanas)
  DELOAD_EVERY: 4,

  // Porcentajes de progresión (aplicados si consistencia >= GOOD)
  PROGRESSION: {
    base:     0.05,   // 5% base
    compound: 0.10,   // 10% en lifts principales tras 4 semanas seguidas
    deload:   0.70    // semana de descarga = 70% del volumen/peso habitual
  }
};

const DEFAULT_STAGES = JSON.parse(JSON.stringify(CONFIG.STAGES));
const DEFAULT_PROGRESSION = JSON.parse(JSON.stringify(CONFIG.PROGRESSION));
const DIET_TEMPLATES = {
  hepatic: {
    id: 'hepatic',
    label: 'Plan hepático actual',
    note: 'Prioriza hígado graso, triglicéridos y digestión ligera.',
    focus: 'Verduras, fruta sola, pescado graso, nopal, betabel y té hepático.'
  },
  recomposition: {
    id: 'recomposition',
    label: 'Recomposición',
    note: 'Mantiene el enfoque hepático con proteína moderada y suficiente energía para gym.',
    focus: 'Proteína + verdura en días de fuerza; fruta sola en días suaves.'
  },
  fat_loss: {
    id: 'fat_loss',
    label: 'Pérdida de grasa',
    note: 'Reduce densidad calórica sin saltarse hidratación ni recuperación.',
    focus: 'Verduras, legumbres, cenas ligeras y control de guarniciones.'
  },
  performance: {
    id: 'performance',
    label: 'Rendimiento BJJ/Box',
    note: 'Sube carbohidrato limpio alrededor del entrenamiento intenso.',
    focus: 'Plátano, camote, fruta separada y electrolitos naturales.'
  },
  vegetarian_light: {
    id: 'vegetarian_light',
    label: 'Vegetariana ligera',
    note: 'Baja proteína animal sin caer en harinas ni ultraprocesados.',
    focus: 'Lentejas, frijol negro, hongos, huevo moderado y verduras.'
  }
};

// Convierte 'YYYY-MM-DD' a objeto Date en hora local
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Devuelve el id de etapa activo para una fecha dada
function getStageForDate(date) {
  const d = date instanceof Date ? date : parseDate(date);
  const stages = Object.values(getEffectiveStages());
  for (let i = stages.length - 1; i >= 0; i--) {
    const s = stages[i];
    if (d >= parseDate(s.startDate)) {
      if (!s.endDate || d <= parseDate(s.endDate)) return s.id;
    }
  }
  return '0'; // fallback
}

// Semana dentro de la etapa actual (1-based)
function getWeekInStage(date) {
  const d = date instanceof Date ? date : parseDate(date);
  const stageId = getStageForDate(d);
  const start = parseDate(getEffectiveStages()[stageId].startDate);
  const diffMs = d - start;
  return Math.floor(diffMs / (7 * 86400000)) + 1;
}

function getEffectiveStages() {
  if (typeof getProgramSettings === 'function') {
    const settings = getProgramSettings();
    if (settings && settings.stages) {
      const merged = JSON.parse(JSON.stringify(DEFAULT_STAGES));
      Object.keys(settings.stages).forEach(id => {
        if (merged[id]) {
          merged[id].startDate = settings.stages[id].startDate || merged[id].startDate;
          merged[id].endDate = settings.stages[id].endDate === undefined ? merged[id].endDate : settings.stages[id].endDate;
        }
      });
      return merged;
    }
  }
  return CONFIG.STAGES;
}

function getEffectiveProgression() {
  if (typeof getProgramSettings === 'function') {
    const settings = getProgramSettings();
    if (settings && settings.progression) {
      return Object.assign({}, DEFAULT_PROGRESSION, settings.progression);
    }
  }
  return CONFIG.PROGRESSION;
}

// Número de semana del año (ISO-like, Lunes = inicio)
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Lunes de la semana a la que pertenece una fecha
function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay() || 7; // 1=Mon … 7=Sun
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// YYYY-MM-DD de una fecha
function toDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}
