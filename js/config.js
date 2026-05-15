// ─────────────────────────────────────────────
//  FitTracker — config.js
//  ⚠️  Edita APPS_SCRIPT_URL después del setup
// ─────────────────────────────────────────────

const CONFIG = {

  // ⚠️ Pega aquí tu URL de Google Apps Script después del paso 3 del README
  APPS_SCRIPT_URL: '',

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

// Convierte 'YYYY-MM-DD' a objeto Date en hora local
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Devuelve el id de etapa activo para una fecha dada
function getStageForDate(date) {
  const d = date instanceof Date ? date : parseDate(date);
  const stages = Object.values(CONFIG.STAGES);
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
  const start = parseDate(CONFIG.STAGES[stageId].startDate);
  const diffMs = d - start;
  return Math.floor(diffMs / (7 * 86400000)) + 1;
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
