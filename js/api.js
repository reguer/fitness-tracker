// ─────────────────────────────────────────────
//  FitTracker — api.js
//  Almacenamiento: localStorage primario + Google Sheets sync
// ─────────────────────────────────────────────

const LS_PREFIX = 'fittracker_';
const LS_META   = 'fittracker_meta';
const LS_ACTIVE_USER = 'fittracker_active_user';

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
  try { return JSON.parse(localStorage.getItem(getScopedLSKey(key))); }
  catch { return null; }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(getScopedLSKey(key), JSON.stringify(value));
    queueCloudSave(key, value);
    return true;
  }
  catch { return false; }
}

function lsDel(key) {
  localStorage.removeItem(getScopedLSKey(key));
}

function getStorageUserId() {
  return localStorage.getItem(LS_ACTIVE_USER) || 'local';
}

function setStorageUserId(uid) {
  localStorage.setItem(LS_ACTIVE_USER, uid || 'local');
}

function getScopedLSKey(key) {
  const uid = getStorageUserId();
  if (uid === 'local') return LS_PREFIX + key;
  return LS_PREFIX + 'u_' + uid + '_' + key;
}

function getActiveUser() {
  return lsGet('active_user') || { uid: getStorageUserId(), name: 'Local', email: '', provider: 'local' };
}

function saveActiveUser(user) {
  const clean = user || { uid: 'local', name: 'Local', email: '', provider: 'local' };
  setStorageUserId(clean.uid || 'local');
  lsSet('active_user', clean);
}

function migrateLocalDataToUser(uid) {
  if (!uid || uid === 'local') return 0;
  const migratedFlag = LS_PREFIX + 'migrated_' + uid;
  if (localStorage.getItem(migratedFlag)) return 0;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf(LS_PREFIX) === 0 && k.indexOf(LS_PREFIX + 'u_') !== 0 && k !== LS_ACTIVE_USER && k.indexOf(LS_PREFIX + 'migrated_') !== 0) {
      keys.push(k);
    }
  }
  keys.forEach(k => {
    const shortKey = k.slice(LS_PREFIX.length);
    const scoped = LS_PREFIX + 'u_' + uid + '_' + shortKey;
    if (!localStorage.getItem(scoped)) localStorage.setItem(scoped, localStorage.getItem(k));
  });
  localStorage.setItem(migratedFlag, new Date().toISOString());
  return keys.length;
}

function hasFirebaseConfig() {
  return !!(CONFIG.FIREBASE_CONFIG && CONFIG.FIREBASE_CONFIG.apiKey && CONFIG.FIREBASE_CONFIG.projectId);
}

function queueCloudSave(key, value) {
  if (getStorageUserId() === 'local') return;
  if (!window.FitFirebase || !window.FitFirebase.saveUserDoc) return;
  window.FitFirebase.saveUserDoc(key, value).catch(err => console.warn('[FitTracker] Firebase save failed:', err.message));
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

// ── Configuración editable del programa ───────

function getDefaultProgramSettings() {
  return {
    stages: JSON.parse(JSON.stringify(DEFAULT_STAGES)),
    progression: {
      base: DEFAULT_PROGRESSION.base,
      min: 0.025,
      recommended: 0.05,
      max: 0.10,
      compound: DEFAULT_PROGRESSION.compound,
      deload: DEFAULT_PROGRESSION.deload,
      deloadEvery: CONFIG.DELOAD_EVERY
    },
    stage11Variant: getMeta().stage11Variant || CONFIG.STAGE_11_VARIANT,
    dietTemplate: 'hepatic',
    updatedAt: null
  };
}

function getProgramSettings() {
  const saved = lsGet('program_settings') || {};
  const defaults = getDefaultProgramSettings();
  return {
    stages: Object.assign({}, defaults.stages, saved.stages || {}),
    progression: Object.assign({}, defaults.progression, saved.progression || {}),
    stage11Variant: saved.stage11Variant || defaults.stage11Variant,
    dietTemplate: saved.dietTemplate || defaults.dietTemplate,
    updatedAt: saved.updatedAt || null
  };
}

function saveProgramSettings(settings) {
  const merged = Object.assign({}, getProgramSettings(), settings || {});
  if (merged.progression) {
    merged.progression.base = clampProgression(parseFloat(merged.progression.base || DEFAULT_PROGRESSION.base));
    merged.progression.compound = clampProgression(parseFloat(merged.progression.compound || DEFAULT_PROGRESSION.compound));
    merged.progression.max = 0.10;
    merged.progression.min = 0.025;
    merged.progression.recommended = 0.05;
  }
  merged.updatedAt = new Date().toISOString();
  lsSet('program_settings', merged);
  saveMeta({ stage11Variant: merged.stage11Variant });
  return merged;
}

function resetProgramSettings() {
  lsSet('program_settings', getDefaultProgramSettings());
  return getProgramSettings();
}

function clampProgression(value) {
  if (!value || value < 0.025) return 0.025;
  if (value > 0.10) return 0.10;
  return Math.round(value * 1000) / 1000;
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
    dayStatus: 'normal',
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

    if (log.dayStatus === 'rest') {
      totalScheduled += scheduled.length;
      totalDone      += scheduled.length * 0.7;
      return;
    }

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

  const progression = getEffectiveProgression();
  const applyProgression = consistency >= CONFIG.CONSISTENCY.GOOD;
  const stageId = getStageForDate(dateStr);
  const weekNum  = getWeekInStage(dateStr);
  const settings = getProgramSettings();
  const deloadEvery = settings.progression.deloadEvery || CONFIG.DELOAD_EVERY;
  const isDeload = weekNum % deloadEvery === 0;

  return {
    totalScheduled, totalDone, totalPartial,
    consistency, applyProgression, isDeload, progression,
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

// ── Perfil de usuario ─────────────────────────
function getProfile() { return lsGet('profile') || null; }
function saveProfile(p) { lsSet('profile', Object.assign({}, p, { updatedAt: new Date().toISOString() })); }
function isProfileComplete() { var p = getProfile(); return !!(p && p.weight && p.height && p.age); }

// ── Nutrición diaria ──────────────────────────
function getNutritionLog(dateStr) {
  return lsGet('nutrition_' + dateStr) || { date: dateStr, checklist: {}, breakfast_category: null, protein_type: null, updatedAt: null };
}
function saveNutritionLog(log) {
  log.updatedAt = new Date().toISOString();
  lsSet('nutrition_' + log.date, log);
}
function toggleNutritionCheck(dateStr, checkId) {
  var log = getNutritionLog(dateStr);
  log.checklist[checkId] = !log.checklist[checkId];
  saveNutritionLog(log);
  return log;
}
function setBreakfastCategory(dateStr, category) {
  var log = getNutritionLog(dateStr);
  log.breakfast_category = log.breakfast_category === category ? null : category;
  saveNutritionLog(log);
}
function getWeeklyNutritionStats(dateStr) {
  var monday = getMondayOfWeek(new Date(dateStr + 'T00:00:00'));
  var fish = 0, fruit = 0, liver = 0;
  for (var i = 0; i < 7; i++) {
    var d = new Date(monday); d.setDate(d.getDate() + i);
    var log = getNutritionLog(toDateStr(d));
    if (log.protein_type === 'fish') fish++;
    if (log.breakfast_category === 'fruit_only') fruit++;
    if (log.checklist && log.checklist.nc_hepatic_food) liver++;
  }
  return { fish: fish, fruit: fruit, liver: liver };
}

// ── Medidas corporales ────────────────────────
function getBodyMetrics(limit) {
  return (lsGet('metrics') || []).slice(0, limit || 52);
}
function saveBodyMetric(entry) {
  var all = lsGet('metrics') || [];
  var idx = all.findIndex(function(e) { return e.date === entry.date; });
  entry.savedAt = new Date().toISOString();
  if (idx >= 0) all[idx] = entry; else all.unshift(entry);
  all.sort(function(a, b) { return b.date.localeCompare(a.date); });
  lsSet('metrics', all);
}
function getLatestMetric() { return getBodyMetrics(1)[0] || null; }

function getMeasurementFields() {
  return lsGet('measurement_fields') || [
    { id: 'weight', label: 'Peso', unit: 'kg', core: true },
    { id: 'waist', label: 'Cintura', unit: 'cm', core: true },
    { id: 'hip', label: 'Cadera', unit: 'cm', core: true },
    { id: 'chest', label: 'Pecho', unit: 'cm', core: true },
    { id: 'bicepR', label: 'Bíceps D', unit: 'cm', core: true },
    { id: 'thighR', label: 'Muslo D', unit: 'cm', core: true }
  ];
}

function saveMeasurementFields(fields) {
  lsSet('measurement_fields', fields);
}

function addCustomMeasurementField(label, unit) {
  const fields = getMeasurementFields();
  const id = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now().toString(36);
  fields.push({ id: id, label: label, unit: unit || 'cm', core: false });
  saveMeasurementFields(fields);
  return fields;
}

// ── Marcadores de laboratorio ─────────────────
function getBiomarkers() { return lsGet('biomarkers') || []; }
function saveBiomarkerEntry(entry) {
  var all = getBiomarkers();
  var idx = all.findIndex(function(e) { return e.date === entry.date; });
  entry.savedAt = new Date().toISOString();
  if (idx >= 0) all[idx] = entry; else all.unshift(entry);
  all.sort(function(a, b) { return b.date.localeCompare(a.date); });
  lsSet('biomarkers', all);
}

// ── Overrides de horario ──────────────────────
function getScheduleOverrides() { return lsGet('schedule_overrides') || []; }
function addScheduleOverride(ov) {
  var all = getScheduleOverrides();
  ov.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  ov.createdAt = new Date().toISOString();
  all.push(ov);
  lsSet('schedule_overrides', all);
}
function removeScheduleOverride(id) {
  lsSet('schedule_overrides', getScheduleOverrides().filter(function(o) { return o.id !== id; }));
}

function addProgramOverride(ov) {
  var all = lsGet('program_overrides') || [];
  ov.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  ov.createdAt = new Date().toISOString();
  all.push(ov);
  lsSet('program_overrides', all);
}

function getProgramOverrides() {
  return lsGet('program_overrides') || [];
}

function clearProgramOverrides() {
  lsSet('program_overrides', []);
  lsSet('schedule_overrides', []);
}
