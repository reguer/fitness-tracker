# FitTracker — Especificaciones Técnicas de Funciones Pendientes
## Referencia para implementación en VS Code

> Este archivo complementa `EPICS_AND_STORIES.md` con el "cómo" técnico
> de cada función nueva. Úsalo cuando vayas a codificar una story nueva.

---

## 1. Perfil de Usuario (Story 1.1)

### Estructura de datos

```javascript
// localStorage key: 'fittracker_profile'
const PROFILE_SCHEMA = {
  name:       '',           // string
  weight:     null,         // kg, número
  height:     null,         // cm, número
  age:        null,         // años, número
  goal:       '',           // 'fat_loss' | 'muscle_gain' | 'recomposition' | 'performance' | 'health'
  units:      'metric',     // 'metric' | 'imperial'
  trackedMeasurements: [],  // ['waist','hip','chest','bicepR','thighR','neck','bodyFat']
  measureFrequency: 'weekly', // 'weekly' | 'biweekly' | 'monthly'
  createdAt:  null,
  updatedAt:  null
};
```

### Funciones nuevas en `api.js`

```javascript
function getProfile() { return lsGet('profile') || null; }
function saveProfile(profile) {
  lsSet('profile', { ...profile, updatedAt: new Date().toISOString() });
  syncProfileToSheets(profile).catch(() => {});
}
function isProfileComplete() {
  const p = getProfile();
  return p && p.weight && p.height && p.age;
}
```

### Función nueva en `app.js`

```javascript
// Llama en DOMContentLoaded, antes de renderAll()
function checkOnboarding() {
  if (!isProfileComplete()) {
    showProfileSetupModal();
  }
}

function showProfileSetupModal() {
  // Inyectar overlay con formulario
  // Al guardar: saveProfile() → cerrar modal → renderAll()
}

function renderProfileSection() {
  // Para Tab Progreso → bloque editable de perfil
}
```

### Nuevo en `Code.gs` (Apps Script)

```javascript
// Añadir a setupSheets():
let profileSheet = ss.getSheetByName('Profile');
if (!profileSheet) {
  profileSheet = ss.insertSheet('Profile');
  profileSheet.appendRow(['name','weight','height','age','goal','units',
    'trackedMeasurements','measureFrequency','updatedAt']);
}

// Añadir a doPost():
if (action === 'saveProfile') {
  saveProfileToSheet(data);
  return jsonResponse({ ok: true });
}
```

---

## 2. Métricas Corporales (Stories 4.1, 4.2, 4.3)

### Estructura de datos

```javascript
// localStorage key: 'fittracker_metrics'
// Array de registros, ordenado por fecha DESC
const METRIC_ENTRY = {
  date:      'YYYY-MM-DD',
  weight:    null,     // kg
  waist:     null,     // cm (opcional)
  hip:       null,     // cm (opcional)
  chest:     null,     // cm (opcional)
  bicepR:    null,     // cm (opcional)
  thighR:    null,     // cm (opcional)
  neck:      null,     // cm (opcional)
  bodyFat:   null,     // % (opcional)
  method:    '',       // 'manual' | 'navy_formula' | 'device'
  notes:     '',
  createdAt: ''
};
```

### Funciones nuevas en `api.js`

```javascript
function getBodyMetrics(limit = 52) {
  const all = lsGet('metrics') || [];
  return all.slice(0, limit);
}

function saveBodyMetric(entry) {
  const all = lsGet('metrics') || [];
  const idx = all.findIndex(e => e.date === entry.date);
  entry.createdAt = entry.createdAt || new Date().toISOString();
  if (idx >= 0) all[idx] = entry;
  else all.unshift(entry);
  all.sort((a, b) => b.date.localeCompare(a.date));
  lsSet('metrics', all);
  syncMetricToSheets(entry).catch(() => {});
}

// Fórmula Navy para % grasa (hombre)
function estimateBodyFat(waist, neck, height) {
  if (!waist || !neck || !height) return null;
  const bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  return Math.round(bf * 10) / 10;
}

// Última métrica registrada
function getLatestMetric() {
  return getBodyMetrics(1)[0] || null;
}

// Delta entre dos registros
function getMetricDelta(field, currentEntry, previousEntry) {
  if (!currentEntry?.[field] || !previousEntry?.[field]) return null;
  return Math.round((currentEntry[field] - previousEntry[field]) * 10) / 10;
}
```

### Nuevo en `Code.gs`

```javascript
// Añadir a setupSheets():
let metricSheet = ss.getSheetByName('BodyMetrics');
if (!metricSheet) {
  metricSheet = ss.insertSheet('BodyMetrics');
  metricSheet.appendRow(['date','weight','waist','hip','chest','bicepR','thighR','neck','bodyFat','method','notes','createdAt']);
}
```

---

## 3. Marcar Día Completo (Story 2.4)

### Cambio en estructura de log diario

```javascript
// Añadir campo a initDayLog():
{
  ...logActual,
  dayStatus: 'normal',  // 'normal' | 'complete' | 'rest' | 'sick'
}
```

### Cambio en `getWeekStats()` en `api.js`

```javascript
// Dentro del forEach de logs:
if (log.dayStatus === 'rest') {
  totalScheduled += scheduled.length;
  totalDone      += scheduled.length * 0.7; // descansa pero no penaliza completo
}
```

### Funciones nuevas en `app.js`

```javascript
function setDayStatus(dateStr, status) {
  const log = getDayLog(dateStr) || initDayLog(dateStr);
  log.dayStatus = status;
  if (status === 'complete') {
    log.activities.forEach(a => { if (!a.status) a.status = 'done'; });
  }
  saveDayLog(log);
  renderToday();
  renderHeader();
}
```

### Cambio en `renderToday()` en `app.js`

```javascript
// Añadir botones de estado de día antes de la lista de actividades:
`<div class="day-status-btns">
  <button onclick="setDayStatus('${dateStr}','complete')" class="dsb ${log.dayStatus==='complete'?'active':''}">
    ✅ Día completo
  </button>
  <button onclick="setDayStatus('${dateStr}','rest')" class="dsb ${log.dayStatus==='rest'?'active':''}">
    🛌 Descanso
  </button>
</div>`
```

---

## 4. Mover Sesiones (Stories 3.2, 3.3, 3.4)

### Estructura de override en localStorage

```javascript
// localStorage key: 'fittracker_schedule_overrides'
const OVERRIDE_SCHEMA = {
  id:          'uuid-v4',     // para poder borrar/editar
  activityId:  'gym_a',       // id de la actividad
  actType:     'gym',         // tipo (para mover "todo el gym" si se necesita)
  fromDay:     3,             // 1=Mon ... 7=Sun (día original)
  toDay:       4,             // día destino
  scope:       'week',        // 'week' | 'forward' | 'alternating'
  fromDate:    '2026-05-20',  // fecha desde la cual aplica
  toDate:      '2026-05-26',  // solo para scope='week'
  parity:      null,          // 0=even, 1=odd weeks, null=ambas (solo scope='alternating')
  createdAt:   ''
};
```

### Funciones nuevas en `api.js`

```javascript
function getScheduleOverrides() {
  return lsGet('schedule_overrides') || [];
}

function addScheduleOverride(override) {
  const all = getScheduleOverrides();
  override.id = Date.now().toString(36);
  override.createdAt = new Date().toISOString();
  all.push(override);
  lsSet('schedule_overrides', all);
}

function removeScheduleOverride(id) {
  const all = getScheduleOverrides().filter(o => o.id !== id);
  lsSet('schedule_overrides', all);
}

function applyOverridesToSchedule(date, activities) {
  const overrides = getScheduleOverrides();
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay() || 7;
  const weekParity = getISOWeek(d) % 2;

  let result = [...activities];

  overrides.forEach(ov => {
    // ¿Aplica a esta fecha?
    const afterFrom  = date >= ov.fromDate;
    const scopeOk = ov.scope === 'week'
      ? date >= ov.fromDate && date <= ov.toDate
      : afterFrom;
    const parityOk = ov.parity === null || ov.parity === weekParity;

    if (!scopeOk || !parityOk) return;

    // Quitar del día origen si este es el día original
    if (dayOfWeek === ov.fromDay) {
      result = result.filter(a => a.id !== ov.activityId);
    }
    // Añadir en el día destino
    if (dayOfWeek === ov.toDay) {
      const actDef = Object.values(ACTIVITIES).find(a => a.id === ov.activityId);
      if (actDef && !result.find(a => a.id === ov.activityId)) {
        result.push({ ...actDef, movedFrom: ov.fromDay });
      }
    }
  });

  return result;
}
```

### Cambio en `getSchedule()` en `schedule.js`

```javascript
// Al final de la función getSchedule(), antes del return:
let finalSchedule = (sched && sched[dayKey]) ? sched[dayKey] : [];
return applyOverridesToSchedule(date, finalSchedule); // ← nuevo
```

### UI del menú de mover en `app.js`

```javascript
// Añadir a renderActivityCard() un botón "⋯" (menú contextual)
// Al tocarlo: showMoveModal(dateStr, activityId)

function showMoveModal(dateStr, activityId) {
  // Modal con:
  // 1. Selector de día destino (días de la semana actual)
  // 2. Radio: "Solo esta semana" / "De ahora en adelante" / "Semanas alternadas"
  // 3. Botón confirmar → addScheduleOverride() → cerrar → renderAll()
}
```

---

## 5. Gráficas SVG Nativas (Story 4.6)

```javascript
// Función genérica de sparkline (línea)
function renderSparkline(containerId, data, options = {}) {
  const {
    width = 280, height = 60,
    color = '#22c55e',
    refLine = null,    // valor de línea de referencia (ej: 80 para consistencia)
    refColor = 'rgba(245,158,11,.4)'
  } = options;

  if (data.length < 2) {
    document.getElementById(containerId).innerHTML =
      '<p class="chart-empty">Necesitas al menos 2 registros para ver la gráfica.</p>';
    return;
  }

  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const range = max - min || 1;
  const padX = 10, padY = 8;
  const w = width - padX * 2, h = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * w;
    const y = padY + (1 - (d.value - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  let refLineHTML = '';
  if (refLine !== null) {
    const ry = padY + (1 - (refLine - min) / range) * h;
    refLineHTML = `<line x1="${padX}" y1="${ry}" x2="${padX+w}" y2="${ry}"
      stroke="${refColor}" stroke-width="1" stroke-dasharray="4,3"/>`;
  }

  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:${height}px">
      ${refLineHTML}
      <polyline fill="none" stroke="${color}" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" points="${points}"/>
      ${data.map((d, i) => {
        const x = padX + (i / (data.length - 1)) * w;
        const y = padY + (1 - (d.value - min) / range) * h;
        return `<circle cx="${x}" cy="${y}" r="3" fill="${color}">
          <title>${d.label}: ${d.value}</title>
        </circle>`;
      }).join('')}
    </svg>
  `;
}

// Función de barras (para consistencia)
function renderBarChart(containerId, data, options = {}) {
  const {
    width = 280, height = 80,
    color = '#6366f1',
    refLine = 80,
    refColor = 'rgba(245,158,11,.5)'
  } = options;

  const max = Math.max(...data.map(d => d.value), refLine || 0, 100);
  const barW = (width - 20) / data.length - 4;

  const bars = data.map((d, i) => {
    const x  = 10 + i * ((width - 20) / data.length);
    const bh = (d.value / max) * (height - 20);
    const y  = height - 10 - bh;
    const c  = d.value >= (refLine || 0) ? color : '#ef4444';
    return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}"
      fill="${c}" rx="2"><title>${d.label}: ${d.value}%</title></rect>`;
  }).join('');

  const ry = height - 10 - (refLine / max) * (height - 20);
  const refHTML = refLine
    ? `<line x1="10" y1="${ry}" x2="${width-10}" y2="${ry}"
        stroke="${refColor}" stroke-width="1" stroke-dasharray="3,3"/>`
    : '';

  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:${height}px">
      ${refHTML}
      ${bars}
    </svg>
  `;
}
```

---

## 6. PWA (Story 7.2)

### `manifest.json` (crear en raíz del proyecto)

```json
{
  "name": "FitTracker",
  "short_name": "FitTracker",
  "description": "Tu programa de entrenamiento personalizado",
  "start_url": "/fittracker/",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#6366f1",
  "orientation": "portrait",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### `sw.js` (crear en raíz)

```javascript
const CACHE_NAME = 'fittracker-v1';
const ASSETS = ['/', '/index.html', '/css/style.css',
  '/js/config.js', '/js/schedule.js', '/js/api.js', '/js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  // No cachear llamadas a Apps Script
  if (e.request.url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

### Añadir en `index.html` (dentro de `<head>`)

```html
<link rel="manifest" href="manifest.json">
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
</script>
```

---

## 7. CSS Adicional para Nuevos Componentes

```css
/* ── Perfil / Onboarding ────────────────── */
.onboarding-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: var(--bg);
  display: flex; flex-direction: column;
  padding: 24px 20px 40px;
  overflow-y: auto;
}
.profile-form { display: flex; flex-direction: column; gap: 14px; }
.form-group   { display: flex; flex-direction: column; gap: 4px; }
.form-label   { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
.form-input {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text);
  padding: 10px 12px; font-size: 15px; font-family: inherit;
}
.form-input:focus { outline: none; border-color: var(--primary); }
.form-optional { font-size: 11px; color: var(--text-dim); }

/* ── Estado de día ──────────────────────── */
.day-status-btns { display: flex; gap: 8px; margin-bottom: 12px; }
.dsb {
  flex: 1; padding: 8px; font-size: 13px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-muted); cursor: pointer;
  transition: all .15s;
}
.dsb.active { border-color: var(--success); color: var(--success); background: rgba(34,197,94,.08); }

/* ── Métricas corporales ─────────────────── */
.metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.metric-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 10px 8px; text-align: center;
}
.metric-val   { font-size: 20px; font-weight: 700; }
.metric-label { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
.metric-delta { font-size: 11px; margin-top: 2px; }
.delta-pos { color: var(--success); }
.delta-neg { color: var(--danger); }
.delta-neu { color: var(--text-dim); }

/* ── Gráficas ───────────────────────────── */
.chart-wrap    { margin: 10px 0 4px; }
.chart-empty   { font-size: 12px; color: var(--text-dim); padding: 16px 0; text-align: center; }
.chart-label   { font-size: 11px; color: var(--text-dim); margin-bottom: 4px; }

/* ── Mover sesión modal ─────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 400;
  background: rgba(0,0,0,.7);
  display: flex; align-items: flex-end;
}
.modal-sheet {
  background: var(--surface); border-top: 1px solid var(--border);
  border-radius: 16px 16px 0 0;
  width: 100%; padding: 20px 16px 32px;
}
.modal-title  { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
.modal-opts   { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.modal-opt {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); cursor: pointer; font-size: 14px;
}
.modal-opt.active { border-color: var(--primary); color: var(--primary); }
.btn-primary {
  width: 100%; padding: 12px; background: var(--primary);
  border: none; border-radius: var(--radius-sm); color: #fff;
  font-size: 15px; font-weight: 600; cursor: pointer;
}
.btn-primary:active { background: var(--primary-dim); }
```

---

## Notas de Implementación Generales

- **Sin librerías externas.** Todo debe funcionar con HTML/CSS/JS vanilla.
- **Mobile-first.** Cada nuevo componente debe estar probado en 375px de ancho.
- **localStorage primero.** Toda función nueva guarda en local antes de intentar Sheets.
- **No romper las funciones existentes.** Los cambios a `getSchedule()` y `getWeekStats()` son los más sensibles — probar bien antes de hacer commit.
- **Convención de nombres:** funciones de render → `render*()`, funciones de datos → verbos (`get`, `save`, `update`, `remove`).
- **Commit por story.** Un commit por cada story completada con mensaje descriptivo.

---

## Checklist Pre-Deploy

Antes de cada `git push`:

- [ ] ¿Funciona offline (sin URL de Apps Script)?
- [ ] ¿Se ve bien en 375px?
- [ ] ¿Los botones tienen área táctil suficiente (≥44px)?
- [ ] ¿Los nuevos datos se guardan en localStorage?
- [ ] ¿No hay errores en la consola del navegador?
- [ ] ¿Se actualizó el estado de la story en EPICS_AND_STORIES.md?
