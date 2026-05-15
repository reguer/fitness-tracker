// ─────────────────────────────────────────────
//  FitTracker — app.js
//  Lógica principal, renderizado y eventos
// ─────────────────────────────────────────────

// Estado global de la app
const STATE = {
  today:        toDateStr(new Date()),
  viewDate:     toDateStr(new Date()),  // fecha activa en "Hoy"
  activeTab:    'today',
  syncStatus:   'idle'   // idle | syncing | ok | error
};

// ── Inicialización ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  bindTabs();
  renderAll();
  checkOnboarding();
  document.getElementById('sync-btn').addEventListener('click', handleManualSync);
});

function renderAll() {
  renderHeader();
  if (STATE.activeTab === 'today')     renderToday();
  if (STATE.activeTab === 'week')      renderWeek();
  if (STATE.activeTab === 'progress')  renderProgress();
  if (STATE.activeTab === 'nutrition') renderNutrition();
}

// ── Header ────────────────────────────────────
function renderHeader() {
  const stageId  = getStageForDate(STATE.today);
  const stage    = CONFIG.STAGES[stageId];
  const weekNum  = getWeekInStage(STATE.today);

  const badge = document.getElementById('stage-badge');
  badge.textContent = stage.short;
  badge.style.backgroundColor = stage.color;

  document.getElementById('current-date').textContent = formatDateLong(new Date(STATE.today + 'T00:00:00'));
  document.getElementById('week-info').textContent    = `Semana ${weekNum} — ${stage.short}`;
}

// ── Tabs ──────────────────────────────────────
function bindTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('tab-' + tab).classList.add('active');
      STATE.activeTab = tab;
      renderAll();
    });
  });
}

// ── Vista: HOY ────────────────────────────────
function renderToday() {
  const container = document.getElementById('tab-today');
  const dateStr   = STATE.viewDate;
  const log       = initDayLog(dateStr);
  const stageId   = getStageForDate(dateStr);
  const meta      = getMeta();
  const scheduled = getSchedule(dateStr, stageId, meta.stage11Variant, log.satWasKB);
  const stats     = getWeekStats(dateStr);

  // Navegación de día
  const prevDate = offsetDate(dateStr, -1);
  const nextDate = offsetDate(dateStr,  1);
  const dayStatusBtns = '<div class="day-status-btns">' +
    '<button class="dsb ' + (log.dayStatus === 'complete' ? 'active' : '') + '" onclick="setDayStatus(\'' + dateStr + '\',\'complete\')">✅ Día completo</button>' +
    '<button class="dsb ' + (log.dayStatus === 'rest'     ? 'active' : '') + '" onclick="setDayStatus(\'' + dateStr + '\',\'rest\')">🛌 Descanso</button>' +
    '</div>';

  container.innerHTML = `
    <div class="day-nav">
      <button class="nav-btn" onclick="goToDate('${prevDate}')">‹</button>
      <span class="day-label">${formatDateShort(new Date(dateStr + 'T00:00:00'))}</span>
      <button class="nav-btn" onclick="goToDate('${nextDate}')">›</button>
    </div>

    <div class="week-pills">
      ${renderWeekPills(dateStr)}
    </div>

    <div class="minimums-bar">
      ${renderMiniBar(stats)}
    </div>

    ${dayStatusBtns}

    <div class="activity-list">
      ${scheduled.length === 0
        ? '<p class="empty-msg">🌙 Sin actividades programadas hoy</p>'
        : scheduled.map(act => renderActivityCard(act, log, dateStr)).join('')
      }
    </div>

    <div class="day-note-section">
      <textarea
        class="day-note"
        placeholder="Nota del día (lesiones, energía, ajustes…)"
        onchange="saveDayNote('${dateStr}', this.value)"
      >${log.dayNote || ''}</textarea>
    </div>

    <div class="day-actions">
      ${dateStr === STATE.today
        ? `<button class="btn-outline" onclick="markAllDone('${dateStr}')">✓ Marcar todo hecho</button>`
        : ''
      }
    </div>
  `;
}

function renderActivityCard(act, log, dateStr) {
  const found  = log.activities.find(a => a.id === act.id);
  const status = found?.status || null;
  const colors = { gym: '#6366f1', swim: '#0ea5e9', mobility: '#a78bfa', flexibility: '#c084fc',
                   bjj: '#f43f5e', box: '#f97316', kb: '#10b981', hiking: '#84cc16',
                   sauna: '#fb923c', rest: '#64748b' };
  const color  = colors[act.type] || '#64748b';

  const statusClass = status ? `status-${status}` : '';

  return `
    <div class="activity-card ${statusClass}" style="--act-color: ${color}">
      <div class="act-left">
        <span class="act-emoji">${act.emoji}</span>
        <div class="act-info">
          <span class="act-name">${act.name}</span>
          <span class="act-meta">${act.duration > 0 ? act.duration + ' min' : 'Descanso'} · ${intensityLabel(act.intensity)}</span>
        </div>
      </div>
      <div class="act-right">
        <div class="status-btns">
          ${['done','partial','skip'].map(s => `
            <button
              class="status-btn ${status === s ? 'active' : ''} s-${s}"
              onclick="setStatus('${dateStr}','${act.id}','${s}')"
              title="${statusLabel(s)}"
            >${statusIcon(s)}</button>
          `).join('')}
        </div>
        <button class="move-btn" onclick="showMoveModal('${dateStr}','${act.id}','${act.name}')" title="Mover">⇄</button>
      </div>
    </div>
    <details class="act-details">
      <summary>Ver notas del ejercicio</summary>
      <pre class="act-notes">${act.notes || 'Sin notas adicionales.'}</pre>
    </details>
  `;
}

function renderWeekPills(activeDate) {
  const monday = getMondayOfWeek(new Date(activeDate + 'T00:00:00'));
  const days   = ['L','M','X','J','V','S','D'];
  return days.map((d, i) => {
    const date  = new Date(monday);
    date.setDate(date.getDate() + i);
    const ds    = toDateStr(date);
    const log   = getDayLog(ds);
    const done  = log?.activities?.filter(a => a.status === 'done').length || 0;
    const total = log?.activities?.length || 0;
    const isToday  = ds === STATE.today;
    const isActive = ds === activeDate;
    const pct      = total > 0 ? Math.round(done / total * 100) : 0;
    return `
      <button
        class="day-pill ${isToday ? 'is-today' : ''} ${isActive ? 'is-active' : ''}"
        onclick="goToDate('${ds}')"
        title="${ds} — ${pct}%"
      >
        <span class="pill-day">${d}</span>
        <span class="pill-dot" style="opacity: ${total > 0 ? 0.3 + pct/100*0.7 : 0.15}">●</span>
      </button>
    `;
  }).join('');
}

function renderMiniBar(stats) {
  const g = stats.minimums.gym;
  const s = stats.minimums.swim;
  const pct = Math.round(stats.consistency * 100);
  return `
    <div class="mini-pill ${g.ok ? 'ok' : 'warn'}">🏋️ ${g.done}/${g.req} gym</div>
    <div class="mini-pill ${s.ok ? 'ok' : 'warn'}">🏊 ${s.done}/${s.req} nado</div>
    <div class="mini-pill ${stats.applyProgression ? 'ok' : 'neutral'}">📈 ${pct}% semana</div>
  `;
}

// ── Vista: SEMANA ─────────────────────────────
function renderWeek() {
  const container = document.getElementById('tab-week');
  const logs  = getWeekLogs(STATE.today);
  const stats = getWeekStats(STATE.today);
  const stageId = getStageForDate(STATE.today);
  const meta    = getMeta();
  const days    = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  container.innerHTML = `
    <div class="week-header">
      <h2>Semana actual</h2>
      <p class="stage-label">${CONFIG.STAGES[stageId].name}</p>
    </div>

    <div class="week-grid">
      ${logs.map((log, i) => {
        const scheduled = getSchedule(log.date, log.stage, meta.stage11Variant, log.satWasKB);
        const done      = log.activities.filter(a => a.status === 'done').length;
        const total     = scheduled.length;
        const partial   = log.activities.filter(a => a.status === 'partial').length;
        const isToday   = log.date === STATE.today;
        const pct       = total > 0 ? Math.round((done + partial * 0.5) / total * 100) : 0;

        return `
          <div class="week-day-card ${isToday ? 'is-today' : ''}" onclick="goToDateTab('${log.date}')">
            <div class="wdc-header">
              <span class="wdc-day">${days[i]}</span>
              <span class="wdc-date">${formatDayNum(new Date(log.date + 'T00:00:00'))}</span>
            </div>
            <div class="wdc-acts">
              ${scheduled.map(act => {
                const found  = log.activities.find(a => a.id === act.id);
                const status = found?.status;
                return `<span class="act-dot act-dot-${status || 'none'}" title="${act.name}">${act.emoji}</span>`;
              }).join('')}
            </div>
            <div class="wdc-bar">
              <div class="wdc-fill" style="width: ${pct}%"></div>
            </div>
            <span class="wdc-pct">${pct}%</span>
          </div>
        `;
      }).join('')}
    </div>

    <div class="week-summary-card">
      <h3>Resumen semanal</h3>
      <div class="summary-grid">
        ${summaryRow('🏋️ Gym',    stats.counts.gym,  CONFIG.MINIMUMS.gym,  true)}
        ${summaryRow('🏊 Natación', stats.counts.swim, CONFIG.MINIMUMS.swim, true)}
        ${summaryRow('🥋 BJJ',    stats.counts.bjj,  0, false)}
        ${summaryRow('🥊 Box/MMA', stats.counts.box,  0, false)}
        ${summaryRow('🧘 Movilidad/Flex', stats.counts.mob, 6, false)}
      </div>
    </div>

    ${stats.isDeload ? `
      <div class="alert alert-info">
        🔄 <strong>Semana de descarga:</strong> Reduce volumen e intensidad un 30%. El cuerpo lo necesita.
      </div>
    ` : ''}
  `;
}

function summaryRow(label, done, min, showMin) {
  const ok = showMin ? done >= min : true;
  return `
    <div class="summary-row ${showMin && !ok ? 'warn' : ''}">
      <span>${label}</span>
      <span class="summary-val">${done}${showMin ? `<span class="summary-min">/${min} mín</span>` : ''}</span>
    </div>
  `;
}

// ── Vista: PROGRESO ────────────────────────────
function renderProgress() {
  const container  = document.getElementById('tab-progress');
  const stats      = getWeekStats(STATE.today);
  const stageId    = getStageForDate(STATE.today);
  const weekNum    = getWeekInStage(STATE.today);
  const pct        = Math.round(stats.consistency * 100);
  const isDeload   = stats.isDeload;

  container.innerHTML = `
    <div class="progress-header">
      <h2>Progreso</h2>
    </div>

    <div class="prog-card">
      <div class="prog-stage">${CONFIG.STAGES[stageId].name}</div>
      <div class="prog-week">Semana ${weekNum}</div>
      <div class="prog-bar-wrap">
        <div class="prog-bar-track">
          <div class="prog-bar-fill ${pct >= 80 ? 'great' : pct >= 60 ? 'ok' : 'low'}"
               style="width: ${pct}%"></div>
          <div class="prog-bar-mark" style="left: 80%"></div>
        </div>
        <div class="prog-bar-labels">
          <span>${pct}% completado</span>
          <span class="muted">80% para subir carga</span>
        </div>
      </div>

      <div class="prog-verdict ${stats.applyProgression ? 'verdict-yes' : 'verdict-no'}">
        ${stats.applyProgression
          ? '✅ Puedes aumentar carga la próxima semana'
          : `⏸ Mantén carga actual (faltan ${Math.ceil((CONFIG.CONSISTENCY.GOOD - stats.consistency) * 100)}% de consistencia)`
        }
      </div>
    </div>

    ${isDeload ? `
      <div class="alert alert-deload">
        🔄 <strong>Esta es semana de descarga (cada 4 semanas).</strong>
        Usa 70% del peso y volumen habituales. Es obligatoria para recuperación nerviosa y muscular.
      </div>
    ` : ''}

    <div class="prog-card">
      <h3>Guía de progresión</h3>
      <table class="prog-table">
        <thead>
          <tr><th>Ejercicio</th><th>Aumento si 80%+</th><th>Notas</th></tr>
        </thead>
        <tbody>
          <tr><td>Lifts compuestos (gym)</td><td>+5–10%</td><td>Depende de etapa</td></tr>
          <tr><td>Ejercicios accesorios</td><td>+1 rep ó +2.5kg</td><td>Cuando llega al límite de reps</td></tr>
          <tr><td>KB Goblet/Remo</td><td>8 → 12 → 16 kg</td><td>Cuando 3 sets se sienten ligeros</td></tr>
          <tr><td>Nado intenso</td><td>+1 intervalo 100m</td><td>O pasar a 4×200m</td></tr>
          <tr><td>Hiking</td><td>+10–15 min</td><td>O +0.5kg mochila</td></tr>
          <tr><td>Semana descarga</td><td colspan="2">−30% de todo, siempre cada 4 semanas</td></tr>
        </tbody>
      </table>
    </div>

    <div class="prog-card">
      <h3>Etapas del programa</h3>
      ${Object.values(CONFIG.STAGES).map(s => {
        const current  = s.id === stageId;
        const startD   = new Date(s.startDate + 'T00:00:00');
        const today    = new Date(STATE.today  + 'T00:00:00');
        const past     = today > (s.endDate ? new Date(s.endDate + 'T00:00:00') : new Date('2099-01-01'));
        return `
          <div class="stage-row ${current ? 'current' : past ? 'past' : 'future'}">
            <div class="sr-dot" style="background:${s.color}"></div>
            <div class="sr-info">
              <strong>${s.name}</strong>
              <span class="muted">${formatDateShort(startD)}${s.endDate ? ' → ' + formatDateShort(new Date(s.endDate + 'T00:00:00')) : ' → en curso'}</span>
              <span class="sr-desc">${s.desc}</span>
            </div>
            ${current ? '<span class="badge-current">← ahora</span>' : ''}
          </div>
        `;
      }).join('')}
    </div>

    <div class="prog-card meta-card">
      <h3>Configuración</h3>
      <div class="config-row">
        <label>Variante Etapa 1.1:</label>
        <select onchange="saveVariant(this.value)">
          <option value="2box" ${getMeta().stage11Variant === '2box' ? 'selected' : ''}>2 días Box (L + J)</option>
          <option value="3box" ${getMeta().stage11Variant === '3box' ? 'selected' : ''}>3 días Box (L + J + S)</option>
        </select>
      </div>
      <div class="config-row">
        <label>Último sync:</label>
        <span class="muted">${getMeta().lastSync ? new Date(getMeta().lastSync).toLocaleString('es-MX') : 'Nunca'}</span>
      </div>
      <button class="btn-outline mt-8" onclick="handleManualSync()">🔄 Sincronizar con Sheets</button>
    </div>
  `;
}

// ── Vista: NUTRICIÓN (Parte 2) ─────────────────
function renderNutrition() {
  var dateStr  = STATE.today;
  var nutLog   = getNutritionLog(dateStr);
  var weekStats = getWeeklyNutritionStats(dateStr);
  var stageId  = getStageForDate(dateStr);
  var meal     = NUTRITION_PLAN.meals[stageId] || NUTRITION_PLAN.meals['0'];
  var biomarks = getBiomarkers();
  var latest   = biomarks[0] || null;

  var checklistHTML = NUTRITION_PLAN.daily_rituals.map(function(item) {
    var checked = !!(nutLog.checklist && nutLog.checklist[item.id]);
    return '<label class="nut-check-item ' + (checked ? 'checked' : '') + '" onclick="handleNutCheck(\'' + dateStr + '\',\'' + item.id + '\')">' +
      '<span class="nc-emoji">' + item.emoji + '</span>' +
      '<span class="nc-label">' + item.name + '</span>' +
      '<span class="nc-box">' + (checked ? '✓' : '') + '</span>' +
      '</label>';
  }).join('');

  var bkCats = Object.keys(NUTRITION_PLAN.breakfast_categories).map(function(key) {
    var cat = NUTRITION_PLAN.breakfast_categories[key];
    var active = nutLog.breakfast_category === key;
    return '<button class="bcat-btn ' + (active ? 'active' : '') + '" onclick="handleBkCat(\'' + dateStr + '\',\'' + key + '\')">' +
      cat.emoji + ' ' + cat.label + '</button>';
  }).join('');

  var bkDetail = '';
  if (nutLog.breakfast_category) {
    var cat = NUTRITION_PLAN.breakfast_categories[nutLog.breakfast_category];
    bkDetail = cat.options.map(function(o) { return '<div class="bopt">' + o + '</div>'; }).join('') +
      '<p class="nut-rule">💡 ' + cat.rule + '</p>';
  }

  var targetsHTML = Object.keys(NUTRITION_PLAN.weekly_targets).map(function(key) {
    var t = NUTRITION_PLAN.weekly_targets[key];
    var done = weekStats[key] || 0;
    var dots = '';
    for (var i = 0; i < t.target; i++) {
      dots += '<span class="nut-dot ' + (i < done ? 'filled' : '') + '">●</span>';
    }
    return '<div class="nut-target-row"><span class="nt-label">' + t.label + '</span>' +
      '<span class="nt-dots">' + dots + ' <span class="muted">' + done + '/' + t.target + '</span></span></div>';
  }).join('');

  var bmarkHTML = NUTRITION_PLAN.biomarkers_baseline.map(function(bm) {
    var cur = latest ? latest[bm.id] : null;
    var improved = cur ? (bm.dir === 'down' ? cur < bm.baseline : cur > bm.baseline) : false;
    var curStr = cur ? '<span class="bm-current ' + (improved ? 'improved' : 'regressed') + '">' + cur + '</span>' : '<span class="bm-current muted">—</span>';
    return '<div class="bm-row"><span class="bm-name">' + bm.name + '</span>' +
      '<span class="bm-baseline muted">' + bm.baseline + '</span>' +
      '<span class="bm-arrow muted">' + (bm.dir === 'down' ? '↓' : '↑') + '</span>' +
      '<span class="bm-goal">' + bm.goal + ' ' + bm.unit + '</span>' + curStr + '</div>';
  }).join('');

  var prof = getProfile();
  var profStr = prof ? (prof.weight + 'kg · ' + prof.height + 'cm · ' + prof.age + ' años · ' + (prof.goal || '')) : 'Sin configurar';

  document.getElementById('tab-nutrition').innerHTML =
    '<div class="nut-header"><h2>Nutrición</h2>' +
    '<span class="stage-label">' + CONFIG.STAGES[stageId].short + ' · ' + meal.protein_g + 'g proteína/día</span></div>' +

    '<div class="prog-card"><h3>Checklist de hoy</h3>' +
    '<div class="nut-checklist">' + checklistHTML + '</div></div>' +

    '<div class="prog-card"><h3>Desayuno de hoy</h3>' +
    '<div class="breakfast-cats">' + bkCats + '</div>' +
    (bkDetail ? '<div class="breakfast-options">' + bkDetail + '</div>' : '<p class="muted" style="font-size:13px">Elige la categoría de desayuno</p>') +
    '</div>' +

    '<div class="prog-card"><h3>Meta semanal</h3>' + targetsHTML + '</div>' +

    '<div class="prog-card"><h3>Marcadores de laboratorio</h3>' +
    '<p class="muted" style="font-size:12px;margin-bottom:10px">Línea base: enero 2026</p>' +
    '<div class="biomarker-list">' + bmarkHTML + '</div>' +
    '<button class="btn-outline mt-8" onclick="showBiomarkerModal()">+ Registrar nuevos estudios</button></div>' +

    '<div class="prog-card"><h3>Tu perfil</h3>' +
    '<p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">' + profStr + '</p>' +
    '<button class="btn-outline" onclick="showProfileModal(true)">Editar perfil</button></div>' +

    '<div class="prog-card"><h3>Indicaciones de esta etapa</h3>' +
    '<p style="font-size:13px;color:var(--text-muted);line-height:1.6">' + meal.notes + '</p>' +
    '<div class="nut-rule mt-8">🏃 Pre-entreno: ' + meal.pre + '</div>' +
    '<div class="nut-rule" style="margin-top:6px">💪 Post-entreno: ' + meal.post + '</div></div>';
}

// ── Handlers de eventos ───────────────────────

function goToDate(dateStr) {
  STATE.viewDate = dateStr;
  renderToday();
}

function goToDateTab(dateStr) {
  STATE.viewDate = dateStr;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="today"]').classList.add('active');
  document.getElementById('tab-today').classList.add('active');
  STATE.activeTab = 'today';
  renderToday();
}

function setStatus(dateStr, activityId, newStatus) {
  const log = getDayLog(dateStr) || initDayLog(dateStr);
  const act = log.activities.find(a => a.id === activityId);
  if (act) {
    // Toggle: si ya está activo, lo quita
    act.status = act.status === newStatus ? null : newStatus;
    saveDayLog(log);
  }
  renderToday();
  renderHeader();
}

function markAllDone(dateStr) {
  const log = getDayLog(dateStr) || initDayLog(dateStr);
  log.activities.forEach(a => { if (!a.status) a.status = 'done'; });
  saveDayLog(log);
  renderToday();
  renderHeader();
}

function saveDayNote(dateStr, text) {
  const log = getDayLog(dateStr) || initDayLog(dateStr);
  log.dayNote = text;
  saveDayLog(log);
}

function saveVariant(variant) {
  saveMeta({ stage11Variant: variant });
  renderAll();
}

async function handleManualSync() {
  const btn = document.getElementById('sync-btn');
  btn.textContent = '⟳';
  btn.disabled = true;
  showSyncStatus('syncing', 'Sincronizando…');

  try {
    const result = await fullSync(3);
    showSyncStatus('ok', `✓ ${result.synced} registros sincronizados`);
  } catch (e) {
    showSyncStatus('error', '✗ Error de conexión');
  } finally {
    btn.textContent = '⟳';
    btn.disabled = false;
  }
}

function showSyncStatus(state, msg) {
  const el = document.getElementById('sync-status');
  el.textContent = msg;
  el.className   = `sync-status sync-${state}`;
  el.classList.remove('hidden');
  if (state !== 'syncing') {
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
}

// ── Utilidades de UI ──────────────────────────

function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

const DAYS_ES  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatDateLong(d) {
  return `${DAYS_ES[d.getDay()]}, ${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(d) {
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

function formatDayNum(d) {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function intensityLabel(i) {
  return { low: 'Suave', medium: 'Moderado', high: 'Intenso' }[i] || i;
}

function statusLabel(s) {
  return { done: 'Hecho', partial: 'Parcial', skip: 'Saltado' }[s] || s;
}

function statusIcon(s) {
  return { done: '✓', partial: '~', skip: '✕' }[s] || s;
}

// ── Handlers de nutrición ─────────────────────
function handleNutCheck(dateStr, checkId) {
  toggleNutritionCheck(dateStr, checkId);
  renderNutrition();
}
function handleBkCat(dateStr, category) {
  setBreakfastCategory(dateStr, category);
  renderNutrition();
}

// ── Modal de marcadores ───────────────────────
function showBiomarkerModal() {
  var fields = [
    { id:'alt',          label:'ALT/TGP (U/L)',     ph:'99'  },
    { id:'triglycerides',label:'Triglicéridos mg/dL',ph:'205' },
    { id:'vldl',         label:'VLDL mg/dL',         ph:'41'  },
    { id:'hdl',          label:'HDL mg/dL',           ph:'48'  },
    { id:'ige',          label:'IgE UI/mL',           ph:'252' },
    { id:'ldl',          label:'LDL mg/dL',           ph:'107' }
  ];
  var rows = fields.map(function(f) {
    return '<div class="config-row"><label class="muted">' + f.label + '</label>' +
      '<input type="number" id="bm-' + f.id + '" class="form-input" style="width:80px;padding:4px 8px" placeholder="' + f.ph + '"></div>';
  }).join('');
  var html = '<div class="modal-overlay" id="bm-modal"><div class="modal-sheet">' +
    '<h3 class="modal-title">Registrar estudios</h3>' + rows +
    '<button class="btn-primary mt-8" onclick="saveBmModal()">Guardar</button>' +
    '<button class="btn-outline mt-8" style="width:100%;margin-top:8px" onclick="document.getElementById(\'bm-modal\').remove()">Cancelar</button>' +
    '</div></div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
}
function saveBmModal() {
  var entry = { date: STATE.today };
  ['alt','triglycerides','vldl','hdl','ige','ldl'].forEach(function(id) {
    var el = document.getElementById('bm-' + id);
    if (el && el.value) entry[id] = parseFloat(el.value);
  });
  saveBiomarkerEntry(entry);
  document.getElementById('bm-modal').remove();
  renderNutrition();
}

// ── Perfil de usuario ─────────────────────────
function checkOnboarding() {
  if (!isProfileComplete()) showProfileModal(false);
}
function showProfileModal(dismissible) {
  var prof = getProfile() || {};
  var goals = [
    {v:'recomposition', l:'Recomposición (músculo + definición)'},
    {v:'fat_loss',      l:'Perder grasa'},
    {v:'muscle_gain',   l:'Ganar músculo'},
    {v:'performance',   l:'Rendimiento deportivo (BJJ/Box)'},
    {v:'health',        l:'Salud general'}
  ];
  var goalOpts = goals.map(function(g) {
    return '<option value="' + g.v + '"' + (prof.goal === g.v ? ' selected' : '') + '>' + g.l + '</option>';
  }).join('');
  var measures = [
    {id:'waist', ph:'Cintura (cm)'},{id:'hip',   ph:'Cadera (cm)'},
    {id:'chest', ph:'Pecho (cm)'}, {id:'bicepR', ph:'Bíceps D (cm)'},{id:'thighR',ph:'Muslo D (cm)'}
  ];
  var measInputs = measures.map(function(m) {
    return '<input id="pf-' + m.id + '" type="number" class="form-input" style="margin-top:6px" placeholder="' + m.ph + '"' +
      (prof[m.id] ? ' value="' + prof[m.id] + '"' : '') + '>';
  }).join('');
  var html = '<div class="onboarding-overlay" id="profile-modal">' +
    '<h2 style="font-size:22px;font-weight:700;margin-bottom:4px">Tu perfil</h2>' +
    '<p style="font-size:13px;color:var(--text-muted);margin-bottom:20px">Peso, altura y edad son obligatorios.</p>' +
    '<div class="profile-form">' +
    '<div class="form-group"><label class="form-label">Peso actual (kg)</label><input id="pf-weight" type="number" class="form-input" placeholder="ej: 80"' + (prof.weight ? ' value="'+prof.weight+'"' : '') + '></div>' +
    '<div class="form-group"><label class="form-label">Altura (cm)</label><input id="pf-height" type="number" class="form-input" placeholder="ej: 178"' + (prof.height ? ' value="'+prof.height+'"' : '') + '></div>' +
    '<div class="form-group"><label class="form-label">Edad</label><input id="pf-age" type="number" class="form-input" placeholder="ej: 36"' + (prof.age ? ' value="'+prof.age+'"' : '') + '></div>' +
    '<div class="form-group"><label class="form-label">Objetivo</label><select id="pf-goal" class="form-input">' + goalOpts + '</select></div>' +
    '<div class="form-group"><label class="form-label">Medidas opcionales</label>' + measInputs + '</div>' +
    '<button class="btn-primary" onclick="saveProfileModal()">Guardar perfil</button>' +
    (dismissible ? '<button class="btn-outline mt-8" style="width:100%;margin-top:8px" onclick="document.getElementById(\'profile-modal\').remove()">Cerrar</button>' : '') +
    '</div></div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
}
function saveProfileModal() {
  var w = parseFloat(document.getElementById('pf-weight').value);
  var h = parseFloat(document.getElementById('pf-height').value);
  var a = parseInt(document.getElementById('pf-age').value);
  if (!w || !h || !a) { alert('Peso, altura y edad son obligatorios.'); return; }
  var p = { weight:w, height:h, age:a, goal: document.getElementById('pf-goal').value };
  ['waist','hip','chest','bicepR','thighR'].forEach(function(id) {
    var el = document.getElementById('pf-' + id);
    if (el && el.value) p[id] = parseFloat(el.value);
  });
  saveProfile(p);
  document.getElementById('profile-modal').remove();
  renderAll();
}

// ── Estado de día completo ────────────────────
function setDayStatus(dateStr, newStatus) {
  var log = getDayLog(dateStr) || initDayLog(dateStr);
  log.dayStatus = log.dayStatus === newStatus ? 'normal' : newStatus;
  if (log.dayStatus === 'complete') {
    log.activities.forEach(function(a) { if (!a.status) a.status = 'done'; });
  }
  saveDayLog(log);
  renderToday();
  renderHeader();
}

// ── Mover sesiones ────────────────────────────
function showMoveModal(dateStr, activityId, actName) {
  var monday = getMondayOfWeek(new Date(dateStr + 'T00:00:00'));
  var dayNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  var opts = '';
  for (var i = 0; i < 7; i++) {
    var d = new Date(monday); d.setDate(d.getDate() + i);
    var ds = toDateStr(d);
    if (ds === dateStr) continue;
    opts += '<button class="modal-opt" onclick="applyMoveDay(\'' + dateStr + '\',\'' + activityId + '\',\'' + ds + '\')">' +
      dayNames[i] + ' ' + formatDayNum(d) + '</button>';
  }
  var html = '<div class="modal-overlay" id="move-modal"><div class="modal-sheet">' +
    '<h3 class="modal-title">Mover: ' + actName + '</h3>' +
    '<p class="muted" style="font-size:12px;margin-bottom:10px">Solo esta semana</p>' +
    '<div class="modal-opts">' + opts + '</div>' +
    '<button class="btn-outline mt-8" style="width:100%;margin-top:8px" onclick="document.getElementById(\'move-modal\').remove()">Cancelar</button>' +
    '</div></div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
}
function applyMoveDay(fromDate, activityId, toDate) {
  var fromD  = new Date(fromDate + 'T00:00:00');
  var toD    = new Date(toDate   + 'T00:00:00');
  var monday = getMondayOfWeek(fromD);
  var sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  addScheduleOverride({
    activityId: activityId,
    fromDay:    fromD.getDay() || 7,
    toDay:      toD.getDay()   || 7,
    scope:      'week',
    fromDate:   fromDate,
    toDate:     toDateStr(sunday)
  });
  document.getElementById('move-modal').remove();
  renderAll();
}
