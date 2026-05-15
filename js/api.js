// ─────────────────────────────────────────────
//  FitTracker — api.js
//  Almacenamiento: localStorage primario + Google Sheets sync
// ─────────────────────────────────────────────

const LS_PREFIX = 'fittracker_';
const LS_META   = 'fittracker_meta';

// ── Estructura de un log diario ───────────────
// {
//   date: 'YYYY-MM-DD',
//   stage: '0' | '1.1' | '2',
//   weekInStage: Number,
//   satWasKB: Boolean,       // para resolver variante dominical
//   activities: [
//     { id: String, status: 'done'|'partial'|'skip'|null, note: String }
//   ],
//   dayNote: String,
//   updatedAt: ISO timestamp
// }

// ── Helpers de localStorage ───────────────────

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(LS_PREFIX + key)); }
  catch { return null; }
}

function lsSet(key, value) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); return true; }
  catch { return false; }
}

function lsDel(key) {
  localStorage.removeItem(LS_PREFIX + key);
}

// ── Meta (config persistida del usuario) ──────

function getMeta() {
  return lsGet('meta') || {
    stage11Variant: '2box',
    lastSync: null,
    satWasKB: {}   // { 'YYYY-Www': true/false }
  };
}

function saveMeta(meta) {
  lsSet('meta', { ...getMeta(), ...meta, savedAt: new Date().toISOString() });
}

// ── CRUD de logs diarios ──────────────────────

function getDayLog(dateStr) {
  return lsGet('day_' + dateStr) || null;
}

function saveDayLog(log) {
  log.updatedAt = new Date().toISOString();
  lsSet('day_' + log.date, log);
  // Disparar sync async
  syncToSheets(log).catch(() => {});
  return log;
}

/**
 * Inicializa o devuelve el log del día con las actividades programadas.
 */
function initDayLog(dateStr) {
  const existing = getDayLog(dateStr);
  if (existing) return existing;

  const stageId = getStageForDate(dateStr);
  const meta = getMeta();
  const weekKey = 'Y' + getISOWeek(new Date(dateStr + 'T00:00:00'));
  const satWasKB = meta.satWasKB?.[weekKey] ?? true; // default: odd weeks = KB

  const scheduled = getSchedule(dateStr, stageId, meta.stage11Variant, satWasKB);

  const log = {
    date: dateStr,
    stage: stageId,
    weekInStage: getWeekInStage(dateStr),
    satWasKB,
    activities: scheduled.map(act => ({
      id: act.id,
      status: null,
      note: ''
    })),
    dayNote: '',
    updatedAt: new Date().toISOString()
  };

  lsSet('day_' + dateStr, log);
  return log;
}

/**
 * Actualiza el status de una actividad en un log existente.
 */
function updateActivityStatus(dateStr, activityId, status) {
  const log = getDayLog(dateStr) || initDayLog(dateStr);
  const act = log.activities.find(a => a.id === activityId);
  if (act) {
    act.status = status;
    saveDayLog(log);
  }
  return log;
}

// ── Consultas semanales ───────────────────────

/**
 * Devuelve los 7 logs de la semana que contiene la fecha dada.
 */
function getWeekLogs(dateStr) {
  const monday = getMondayOfWeek(new Date(dateStr + 'T00:00:00'));
  const logs = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const ds = toDateStr(d);
    logs.push(getDayLog(ds) || initDayLog(ds));
  }
  return logs;
}

/**
 * Calcula estadísticas de la semana: gym, swim, consistency%, etc.
 */
function getWeekStats(dateStr) {
  const logs = getWeekLogs(dateStr);
  let totalScheduled = 0, totalDone = 0, totalPartial = 0;
  let gym = 0, swim = 0, bjj = 0, box = 0, mob = 0;

  logs.forEach(log => {
    const stageId = log.stage;
    const meta = getMeta();
    const scheduled = getSchedule(
      log.date, stageId, meta.stage11Variant, log.satWasKB
    );

    scheduled.forEach(act => {
      totalScheduled++;
      const found = log.activities.find(a => a.id === act.id);
      const status = found?.status;
      if (status === 'done')    { totalDone++;    }
      if (status === 'partial') { totalPartial++; }

      if (status === 'done' || status === 'partial') {
        if (act.type === 'gym')         gym++;
        if (act.type === 'swim')        swim++;
        if (act.type === 'bjj')         bjj++;
        if (act.type === 'box')         box++;
        if (act.type === 'mobility' || act.type === 'flexibility') mob++;
      }
    });
  });

  const consistency = totalScheduled > 0
    ? (totalDone + totalPartial * 0.5) / totalScheduled
    : 0;

  const applyProgression = consistency >= CONFIG.CONSISTENCY.GOOD;
  const stageId = getStageForDate(dateStr);
  const weekNum  = getWeekInStage(dateStr);
  const isDeload = weekNum % CONFIG.DELOAD_EVERY === 0;

  return {
    totalScheduled, totalDone, totalPartial,
    consistency, applyProgression, isDeload,
    counts: { gym, swim, bjj, box, mob },
    minimums: {
      gym:  { req: CONFIG.MINIMUMS.gym,  done: gym,  ok: gym  >= CONFIG.MINIMUMS.gym  },
      swim: { req: CONFIG.MINIMUMS.swim, done: swim, ok: swim >= CONFIG.MINIMUMS.swim }
    }
  };
}

// ── Google Sheets Sync ────────────────────────

let _syncQueue = [];
let _syncing   = false;

async function syncToSheets(log) {
  if (!CONFIG.APPS_SCRIPT_URL) return; // no configurado aún
  _syncQueue.push(log);
  if (_syncing) return;
  _syncing = true;

  while (_syncQueue.length > 0) {
    const item = _syncQueue.shift();
    try {
      await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveDayLog', data: item })
      });
      saveMeta({ lastSync: new Date().toISOString() });
    } catch (err) {
      console.warn('[FitTracker] Sync failed, queued for retry:', err.message);
    }
  }
  _syncing = false;
}

async function loadFromSheets(dateStr) {
  if (!CONFIG.APPS_SCRIPT_URL) return null;
  try {
    const url = `${CONFIG.APPS_SCRIPT_URL}?action=getDayLog&date=${dateStr}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data?.date) {
      lsSet('day_' + dateStr, data);
      return data;
    }
  } catch (err) {
    console.warn('[FitTracker] Load from Sheets failed:', err.message);
  }
  return null;
}

async function fullSync(weeksBack = 2) {
  if (!CONFIG.APPS_SCRIPT_URL) return { synced: 0, error: 'URL no configurada' };
  const today = new Date();
  let synced = 0;
  for (let w = 0; w <= weeksBack; w++) {
    const d = new Date(today);
    d.setDate(d.getDate() - w * 7);
    const weekLogs = getWeekLogs(toDateStr(d));
    for (const log of weekLogs) {
      await syncToSheets(log);
      synced++;
    }
  }
  return { synced };
}
