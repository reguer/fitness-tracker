// ─────────────────────────────────────────────
//  FitTracker — Code.gs
//  Google Apps Script · Despliega como Web App
//
//  INSTRUCCIONES:
//  1. Abre script.google.com → Nuevo proyecto
//  2. Pega este código completo
//  3. Ejecuta setupSheets() una vez (menú Run)
//  4. Desplegar → Nueva implementación → Web App
//     · Ejecutar como: Yo mismo
//     · Acceso: Cualquier persona
//  5. Copia la URL y pégala en js/config.js → APPS_SCRIPT_URL
// ─────────────────────────────────────────────

const SPREADSHEET_ID = ''; // ⚠️ Déjalo vacío; el script crea un Sheets nuevo

// ── Setup inicial ─────────────────────────────
function setupSheets() {
  let ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.create('FitTracker — Datos');
    Logger.log('NUEVO SPREADSHEET: ' + ss.getUrl());
    // ⚠️ Copia el ID del URL y pégalo en SPREADSHEET_ID arriba
  }

  // Hoja: DayLogs
  let sh = ss.getSheetByName('DayLogs');
  if (!sh) {
    sh = ss.insertSheet('DayLogs');
    sh.appendRow(['date','stage','weekInStage','satWasKB','activitiesJson','dayNote','updatedAt']);
    sh.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 110);
    sh.setColumnWidth(5, 300);
  }

  // Hoja: WeeklyStats (solo lectura, generada por el script)
  let ws = ss.getSheetByName('WeeklyStats');
  if (!ws) {
    ws = ss.insertSheet('WeeklyStats');
    ws.appendRow(['weekStart','stage','gym','swim','bjj','box','mob','consistency','applyProgression','updatedAt']);
    ws.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#1a2e1a').setFontColor('#ffffff');
    ws.setFrozenRows(1);
  }

  Logger.log('Setup completo. URL: ' + ss.getUrl());
}

// ── GET: leer datos ───────────────────────────
function doGet(e) {
  const action = e.parameter.action;
  const date   = e.parameter.date;

  try {
    if (action === 'getDayLog' && date) {
      const data = getDayLogFromSheet(date);
      return jsonResponse(data || { error: 'not_found', date });
    }

    if (action === 'getWeekLogs' && date) {
      const data = getWeekLogsFromSheet(date);
      return jsonResponse(data);
    }

    return jsonResponse({ error: 'unknown_action', action });

  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── POST: guardar datos ───────────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    const data   = body.data;

    if (action === 'saveDayLog' && data) {
      saveDayLogToSheet(data);
      updateWeeklyStats(data.date);
      return jsonResponse({ ok: true, date: data.date });
    }

    return jsonResponse({ error: 'unknown_action' });

  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── Helpers de Sheet ──────────────────────────

function getSheet() {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('DayLogs');
}

function getWeekStatsSheet() {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('WeeklyStats');
}

function getDayLogFromSheet(date) {
  const sh   = getSheet();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === date) {
      return {
        date:          data[i][0],
        stage:         data[i][1],
        weekInStage:   data[i][2],
        satWasKB:      data[i][3],
        activities:    JSON.parse(data[i][4] || '[]'),
        dayNote:       data[i][5],
        updatedAt:     data[i][6]
      };
    }
  }
  return null;
}

function getWeekLogsFromSheet(date) {
  // Devuelve los 7 logs de la semana
  const monday = getMondayStr(date);
  const logs   = [];
  for (let i = 0; i < 7; i++) {
    const d  = addDays(monday, i);
    const log = getDayLogFromSheet(d);
    if (log) logs.push(log);
  }
  return logs;
}

function saveDayLogToSheet(log) {
  const sh   = getSheet();
  const data = sh.getDataRange().getValues();
  const row  = [
    log.date,
    log.stage,
    log.weekInStage,
    log.satWasKB,
    JSON.stringify(log.activities || []),
    log.dayNote || '',
    log.updatedAt || new Date().toISOString()
  ];

  // Buscar fila existente
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === log.date) {
      sh.getRange(i + 1, 1, 1, 7).setValues([row]);
      return;
    }
  }
  // Nueva fila
  sh.appendRow(row);
}

function updateWeeklyStats(date) {
  // Calcula stats de la semana y los guarda en WeeklyStats
  const monday = getMondayStr(date);
  const logs   = getWeekLogsFromSheet(monday) || [];

  let gym = 0, swim = 0, bjj = 0, box = 0, mob = 0;
  let totalDone = 0, totalScheduled = 0;

  logs.forEach(log => {
    (log.activities || []).forEach(act => {
      totalScheduled++;
      if (act.status === 'done' || act.status === 'partial') {
        const w = act.status === 'done' ? 1 : 0.5;
        totalDone += w;
        const id = act.id;
        if (id.startsWith('gym'))   gym++;
        if (id.startsWith('swim'))  swim++;
        if (id === 'bjj')           bjj++;
        if (id === 'box')           box++;
        if (id === 'mob_am' || id === 'flex_am' || id === 'mob_post' || id === 'flex_soft') mob++;
      }
    });
  });

  const consistency       = totalScheduled > 0 ? totalDone / totalScheduled : 0;
  const applyProgression  = consistency >= 0.80;

  const sh   = getWeekStatsSheet();
  const data = sh.getDataRange().getValues();
  const stage = logs[0]?.stage || '';
  const row = [monday, stage, gym, swim, bjj, box, mob,
               Math.round(consistency * 100) + '%', applyProgression ? 'Sí' : 'No',
               new Date().toISOString()];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === monday) {
      sh.getRange(i + 1, 1, 1, 10).setValues([row]);
      return;
    }
  }
  sh.appendRow(row);
}

// ── Date utils (Apps Script no tiene las del front) ──
function getMondayStr(dateStr) {
  const d    = new Date(dateStr + 'T00:00:00');
  const day  = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
