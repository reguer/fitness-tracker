# FitTracker — Guía de Implementación: Módulo Nutrición
## Datos estructurados + integración en la app

---

## Contexto médico (para el agente de Claude)

**Diagnóstico relevante:**
- Hígado graso (ALT 99 U/L, AST 58 — confirmados en estudios enero 2026)
- Alcalosis pancreática (Amilasa 111)
- Triglicéridos altos (205 mg/dL, VLDL 41)
- IgE elevada (252 — posibles sensibilidades)
- Todo lo demás en rango normal o bueno

**Lo que el usuario YA evita (no sugerir):**
azúcar refinada, harina de trigo, refrescos, alcohol, café, grasas trans, ultra-procesados,
exceso de proteína animal

**Tipo sanguíneo:** O+
**Preferencia:** México — alimentos locales

---

## Estructura de datos para `js/schedule.js` / `js/api.js`

### Plan nutricional por etapa

```javascript
// Añadir en config.js o en un nuevo archivo js/nutrition.js

const NUTRITION_PLAN = {

  // Rituales diarios (aplican todas las etapas)
  daily_rituals: [
    { id: 'water_lemon',  name: 'Agua con limón en ayunas', emoji: '🍋', timing: 'morning',  mandatory: true  },
    { id: 'apio_juice',   name: 'Jugo de apio pre-comida (100ml)', emoji: '🥬', timing: 'pre_lunch', mandatory: false, days_per_week: 5 },
    { id: 'hepatic_tea',  name: 'Té hepático en cena',    emoji: '🫖', timing: 'evening',  mandatory: false, alternating: true },
    { id: 'hydration',    name: '2.5L de agua cumplidos', emoji: '💧', timing: 'end_of_day', mandatory: true  },
  ],

  // Estructura de comidas por etapa
  meals: {
    '0': {
      protein_target_g:    115,   // gramos/día
      meal_timing: { breakfast: '10:00', lunch: '14:00', dinner: '19:30' },
      notes: 'Recuperación lumbar activa. Proteína moderada. Priorizar digestión.',
      pre_workout_snack:   'Fruta + nueces (90 min antes)',
      post_workout_snack:  'Yogurt griego + plátano (30-45 min después)',
    },
    '1.1': {
      protein_target_g:    140,
      meal_timing: { breakfast: '10:00', lunch: '14:00', dinner: '19:30' },
      notes: 'Box añadido. Subir proteína. Pre-entreno con carbohidrato simple.',
      pre_workout_snack:   'Plátano + 2 nueces (60-90 min antes de box)',
      post_workout_snack:  'Licuado vegetal o yogurt griego + plátano',
      extra_hydration_ml:  500,   // días de box
    },
    '2': {
      protein_target_g:    155,
      meal_timing: { breakfast: '10:00', lunch: '14:00', dinner: '19:00' },
      notes: 'BJJ 3x/sem. Cena muy ligera post-BJJ. Día de descanso = día de comida ligera.',
      pre_workout_snack:   'Plátano + 2 huevos cocidos (BJJ) / Tostada aguacate (Box)',
      post_workout_snack:  'Caldo + fruta o yogurt (post-BJJ noche)',
      rest_day_protocol:   'Solo frutas + caldos en días de descanso (recuperación hepática)',
      extra_hydration_ml:  500,
    },
  },

  // Categorías de desayuno
  breakfast_categories: {
    protein_veg: {
      label: 'Proteína + Verdura',
      emoji: '🥚',
      best_for: ['gym_a', 'gym_b', 'gym_c', 'bjj', 'box'],
      options: [
        'Omelette de espinaca + queso panela + aguacate',
        '2 huevos + nopales + aguacate (sin tortilla)',
        'Espinacas salteadas + queso panela + 2 huevos',
      ],
      rule: 'Sin tortilla a menos que el entrenamiento sea intenso.',
    },
    fruit_only: {
      label: 'Fruta Sola',
      emoji: '🍉',
      best_for: ['swim_soft', 'rest', 'flex_am', 'mob_am'],
      options: [
        'Papaya madura (enzimas digestivas)',
        'Sandía o melón',
        'Mango natural',
        'Piña natural sola',
      ],
      rule: 'NUNCA combinar con proteína. ≥2h de separación.',
    },
    green_juice: {
      label: 'Jugo Verde + Snack Ligero',
      emoji: '🥗',
      best_for: ['swim_medium', 'hiking', 'kb'],
      options: [
        'Jugo (espinaca+apio+nopal+pepino+limón) + nueces',
        'Jugo verde + 1 tostada con aguacate',
      ],
      rule: 'No añadir piña/mango al jugo verde (fermenta con verduras).',
    },
  },

  // Proteínas permitidas con frecuencia
  protein_rotation: [
    { name: 'Pescado graso (sardinas, tilapia, salmón)', times_per_week: 3, priority: 'HIGH', notes: 'Mejor para triglicéridos — omega-3' },
    { name: 'Pollo sin piel', times_per_week: 2, priority: 'NORMAL' },
    { name: 'Huevo', times_per_week: 3, priority: 'NORMAL', notes: 'Max 1/día si se sospecha sensibilidad' },
    { name: 'Hongos / setas / champiñones', times_per_week: 1, priority: 'NORMAL', notes: 'Ideal para cortar animal' },
    { name: 'Carne roja magra', times_per_week: 1, priority: 'LOW', notes: 'Máximo 1x/semana' },
    { name: 'Frijoles negros / lentejas', times_per_week: 4, priority: 'HIGH', notes: 'Proteína vegetal + fibra — ideal para hígado' },
  ],

  // Alimentos hepáticos prioritarios
  liver_foods: [
    { name: 'Betabel', frequency: '4-5x/semana', how: 'Rostizado, ensalada o jugo' },
    { name: 'Nopal', frequency: 'Diario', how: 'Asado, ensalada o en jugo verde' },
    { name: 'Alcachofa', frequency: '2-3x/semana', how: 'Cocida o infusión' },
    { name: 'Ajo', frequency: 'Diario', how: 'Crudo o cocido' },
    { name: 'Cúrcuma + pimienta negra', frequency: 'Diario', how: 'En todo lo cocinado' },
    { name: 'Limón', frequency: 'Diario', how: 'Agua en ayunas, aliño' },
    { name: 'Papaya', frequency: '3-4x/semana', how: 'Sola, en ayunas' },
    { name: 'Diente de león', frequency: '3x/semana', how: 'Té o ensalada (quelite)' },
  ],

  // Checklist diario de nutrición (para la app)
  daily_checklist: [
    { id: 'nc_lemon_water', label: 'Agua con limón al despertar', emoji: '🍋' },
    { id: 'nc_veggies',     label: '½ plato de verduras en comida', emoji: '🥦' },
    { id: 'nc_apio',        label: 'Jugo de apio pre-comida', emoji: '🥬' },
    { id: 'nc_hepatic_food',label: 'Alimento hepático incluido', emoji: '🫀' },
    { id: 'nc_tea',         label: 'Té hepático en cena', emoji: '🫖' },
    { id: 'nc_hydration',   label: '2.5L de agua completados', emoji: '💧' },
    { id: 'nc_no_refined',  label: 'Sin azúcar/harina refinada', emoji: '✅' },
  ],

  // Metas semanales de nutrición
  weekly_targets: {
    fatty_fish_portions: { target: 3, label: 'Porciones de pescado graso' },
    fruit_alone_times:   { target: 3, label: 'Veces con fruta sola' },
    liver_food_days:     { target: 5, label: 'Días con alimento hepático' },
    max_refined_carbs:   { target: 2, label: 'Veces con tortilla+proteína' },
  },

  // Estudios a monitorear
  biomarkers_to_track: [
    { name: 'ALT/TGP',        baseline: 99,  goal: 50,  unit: 'U/L',    direction: 'down' },
    { name: 'Triglicéridos',  baseline: 205, goal: 150, unit: 'mg/dL',  direction: 'down' },
    { name: 'VLDL',           baseline: 41,  goal: 30,  unit: 'mg/dL',  direction: 'down' },
    { name: 'HDL',            baseline: 48,  goal: 60,  unit: 'mg/dL',  direction: 'up'   },
    { name: 'IgE',            baseline: 252, goal: 120, unit: 'UI/mL',  direction: 'down' },
    { name: 'LDL',            baseline: 107, goal: 100, unit: 'mg/dL',  direction: 'down' },
  ],
};
```

---

## Funciones a implementar en `api.js`

```javascript
// ── Checklist de nutrición diaria ─────────────

function getNutritionLog(dateStr) {
  return lsGet('nutrition_' + dateStr) || {
    date: dateStr,
    checklist: {},   // { nc_lemon_water: true, nc_veggies: false, ... }
    breakfast_category: null,  // 'protein_veg' | 'fruit_only' | 'green_juice'
    protein_type: null,
    notes: '',
    updatedAt: null
  };
}

function saveNutritionLog(log) {
  log.updatedAt = new Date().toISOString();
  lsSet('nutrition_' + log.date, log);
  syncNutritionToSheets(log).catch(() => {});
}

function toggleNutritionCheck(dateStr, checkId) {
  const log = getNutritionLog(dateStr);
  log.checklist[checkId] = !log.checklist[checkId];
  saveNutritionLog(log);
  return log;
}

// ── Metas semanales de nutrición ──────────────

function getWeeklyNutritionStats(dateStr) {
  const monday = getMondayOfWeek(new Date(dateStr + 'T00:00:00'));
  let fishPortions = 0, fruitAlone = 0, liverFoodDays = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const log = getNutritionLog(toDateStr(d));
    if (log.protein_type === 'fish') fishPortions++;
    if (log.breakfast_category === 'fruit_only') fruitAlone++;
    if (log.checklist?.nc_hepatic_food) liverFoodDays++;
  }

  return { fishPortions, fruitAlone, liverFoodDays };
}

// ── Marcadores de laboratorio ─────────────────

function getBiomarkers() {
  return lsGet('biomarkers') || [];
}

function saveBiomarkerEntry(entry) {
  // entry: { date, alt, triglycerides, vldl, hdl, ige, ldl, notes }
  const all = getBiomarkers();
  const idx = all.findIndex(e => e.date === entry.date);
  entry.savedAt = new Date().toISOString();
  if (idx >= 0) all[idx] = entry;
  else all.unshift(entry);
  all.sort((a, b) => b.date.localeCompare(a.date));
  lsSet('biomarkers', all);
}
```

---

## Vista "Nutrición" — Componentes UI a implementar

### Tab Nutrición → 3 secciones

```
📋 Checklist Hoy
   [ ] Agua con limón
   [ ] Verduras ½ plato
   [ ] Jugo de apio
   [X] Alimento hepático
   [ ] Té hepático
   [ ] 2.5L agua
   [ ] Sin refinados

🗓️ Semana
   Pescado graso: 1/3 ●○○
   Fruta sola:    2/3 ●●○
   Alimentos hepáticos: 3/5 ●●●○○

🔬 Marcadores (editable)
   ALT: 99 → [    ] (meta: <50)
   TGC: 205 → [    ] (meta: <150)
   HDL: 48 → [    ] (meta: >60)
   + botón "Registrar nuevos estudios"
```

### Función `renderNutrition()` en `app.js`

```javascript
function renderNutrition() {
  const dateStr   = STATE.today;
  const nutLog    = getNutritionLog(dateStr);
  const weekStats = getWeeklyNutritionStats(dateStr);
  const stageId   = getStageForDate(dateStr);
  const mealPlan  = NUTRITION_PLAN.meals[stageId] || NUTRITION_PLAN.meals['0'];
  const biomarks  = getBiomarkers();
  const latest    = biomarks[0] || null;

  document.getElementById('tab-nutrition').innerHTML = `
    <div class="nut-header">
      <h2>Nutrición</h2>
      <span class="stage-label">${CONFIG.STAGES[stageId].short} · ${mealPlan.protein_target_g}g proteína/día</span>
    </div>

    <!-- Checklist diario -->
    <div class="prog-card">
      <h3>Checklist de hoy</h3>
      <div class="nut-checklist">
        ${NUTRITION_PLAN.daily_checklist.map(item => {
          const checked = nutLog.checklist?.[item.id] || false;
          return `
            <label class="nut-check-item ${checked ? 'checked' : ''}"
                   onclick="toggleNutritionCheck('${dateStr}','${item.id}'); renderNutrition();">
              <span class="nc-emoji">${item.emoji}</span>
              <span class="nc-label">${item.label}</span>
              <span class="nc-box">${checked ? '✓' : ''}</span>
            </label>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Desayuno de hoy -->
    <div class="prog-card">
      <h3>Desayuno de hoy</h3>
      <div class="breakfast-cats">
        ${Object.entries(NUTRITION_PLAN.breakfast_categories).map(([key, cat]) => `
          <button
            class="bcat-btn ${nutLog.breakfast_category === key ? 'active' : ''}"
            onclick="setBreakfastCategory('${dateStr}','${key}')">
            ${cat.emoji} ${cat.label}
          </button>
        `).join('')}
      </div>
      ${nutLog.breakfast_category ? `
        <div class="breakfast-options">
          ${NUTRITION_PLAN.breakfast_categories[nutLog.breakfast_category].options.map(o =>
            `<div class="bopt">${o}</div>`
          ).join('')}
          <p class="nut-rule">💡 ${NUTRITION_PLAN.breakfast_categories[nutLog.breakfast_category].rule}</p>
        </div>
      ` : '<p class="muted" style="font-size:13px">Elige la categoría de desayuno de hoy</p>'}
    </div>

    <!-- Semana -->
    <div class="prog-card">
      <h3>Meta semanal</h3>
      ${renderNutWeekBar('🐟 Pescado graso', weekStats.fishPortions, NUTRITION_PLAN.weekly_targets.fatty_fish_portions.target)}
      ${renderNutWeekBar('🍉 Fruta sola', weekStats.fruitAlone, NUTRITION_PLAN.weekly_targets.fruit_alone_times.target)}
      ${renderNutWeekBar('🫀 Alimento hepático', weekStats.liverFoodDays, NUTRITION_PLAN.weekly_targets.liver_food_days.target)}
    </div>

    <!-- Marcadores de laboratorio -->
    <div class="prog-card">
      <h3>Marcadores de laboratorio</h3>
      <p class="muted" style="font-size:12px;margin-bottom:10px">
        Línea base: enero 2026. Registra tus próximos estudios para ver progreso.
      </p>
      <div class="biomarker-list">
        ${NUTRITION_PLAN.biomarkers_to_track.map(bm => {
          const currentVal = latest?.[bm.name.toLowerCase().replace('/', '_')] || null;
          const improved = currentVal && (bm.direction === 'down' ? currentVal < bm.baseline : currentVal > bm.baseline);
          return `
            <div class="bm-row">
              <span class="bm-name">${bm.name}</span>
              <span class="bm-baseline">${bm.baseline}</span>
              <span class="bm-arrow">${bm.direction === 'down' ? '↓' : '↑'}</span>
              <span class="bm-goal">${bm.goal} ${bm.unit}</span>
              ${currentVal ? `<span class="bm-current ${improved ? 'improved' : 'regressed'}">${currentVal}</span>` : '<span class="bm-current muted">—</span>'}
            </div>
          `;
        }).join('')}
      </div>
      <button class="btn-outline mt-8" onclick="showBiomarkerEntry()">
        + Registrar nuevos estudios
      </button>
    </div>

    <!-- Notas del plan -->
    <div class="prog-card">
      <h3>Indicaciones de esta etapa</h3>
      <p style="font-size:13px;color:var(--text-muted);line-height:1.6">${mealPlan.notes}</p>
      <div class="nut-rule mt-8">🏃 Pre-entreno: ${mealPlan.pre_workout_snack}</div>
      <div class="nut-rule">💪 Post-entreno: ${mealPlan.post_workout_snack}</div>
    </div>
  `;
}

function renderNutWeekBar(label, done, target) {
  const dots = Array.from({length: target}, (_, i) =>
    `<span class="nut-dot ${i < done ? 'filled' : ''}">●</span>`
  ).join('');
  return `
    <div class="nut-target-row">
      <span class="nt-label">${label}</span>
      <span class="nt-dots">${dots} <span class="muted">${done}/${target}</span></span>
    </div>
  `;
}

function setBreakfastCategory(dateStr, category) {
  const log = getNutritionLog(dateStr);
  log.breakfast_category = log.breakfast_category === category ? null : category;
  saveNutritionLog(log);
  renderNutrition();
}
```

---

## CSS adicional para módulo nutrición

```css
/* Añadir a style.css */

/* ── Nutrición checklist ─────────────── */
.nut-checklist { display: flex; flex-direction: column; gap: 6px; }
.nut-check-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: var(--surface-2);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  cursor: pointer; transition: all .15s;
}
.nut-check-item.checked { border-color: var(--success); opacity: .75; }
.nc-emoji  { font-size: 18px; min-width: 22px; }
.nc-label  { flex: 1; font-size: 13px; }
.nc-box {
  width: 22px; height: 22px; border: 1px solid var(--border);
  border-radius: 4px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--success);
}
.nut-check-item.checked .nc-box { background: var(--success); border-color: var(--success); color: #000; }

/* ── Categorías de desayuno ──────────── */
.breakfast-cats { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.bcat-btn {
  flex: 1; min-width: 90px; padding: 8px 6px; font-size: 12px; font-weight: 600;
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); cursor: pointer; color: var(--text-muted); text-align: center;
}
.bcat-btn.active { border-color: var(--success); color: var(--success); background: rgba(34,197,94,.08); }

.breakfast-options { display: flex; flex-direction: column; gap: 4px; }
.bopt { font-size: 13px; color: var(--text-muted); padding: 4px 0; border-bottom: 1px solid var(--border); }
.bopt:last-of-type { border-bottom: none; }
.nut-rule { font-size: 12px; color: var(--text-dim); padding: 6px 8px; background: var(--surface-2); border-radius: 4px; margin-top: 4px; }

/* ── Metas semanales nutrición ───────── */
.nut-target-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.nut-target-row:last-child { border-bottom: none; }
.nt-label { color: var(--text-muted); }
.nt-dots  { display: flex; align-items: center; gap: 3px; }
.nut-dot  { font-size: 14px; color: var(--border); }
.nut-dot.filled { color: var(--success); }

/* ── Marcadores de laboratorio ───────── */
.biomarker-list { display: flex; flex-direction: column; gap: 6px; }
.bm-row { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 0; border-bottom: 1px solid var(--border); }
.bm-row:last-child { border-bottom: none; }
.bm-name     { flex: 1; color: var(--text-muted); }
.bm-baseline { color: var(--text-dim); min-width: 30px; text-align: right; }
.bm-arrow    { font-size: 14px; color: var(--text-dim); }
.bm-goal     { color: var(--success); min-width: 60px; font-weight: 600; }
.bm-current  { min-width: 40px; text-align: right; font-weight: 700; }
.bm-current.improved  { color: var(--success); }
.bm-current.regressed { color: var(--danger); }

/* ── Header nutrición ────────────────── */
.nut-header { margin-bottom: 12px; }
.nut-header h2 { font-size: 18px; font-weight: 700; }
```

---

## Nuevo en `backend/Code.gs`

```javascript
// Añadir en setupSheets():
let nutSheet = ss.getSheetByName('NutritionLog');
if (!nutSheet) {
  nutSheet = ss.insertSheet('NutritionLog');
  nutSheet.appendRow(['date','checklist_json','breakfast_category','protein_type','notes','updatedAt']);
}

let bioSheet = ss.getSheetByName('Biomarkers');
if (!bioSheet) {
  bioSheet = ss.insertSheet('Biomarkers');
  bioSheet.appendRow(['date','alt','triglycerides','vldl','hdl','ige','ldl','weight','notes','savedAt']);
}

// Añadir en doPost():
if (action === 'saveNutritionLog') {
  saveNutritionLogToSheet(data);
  return jsonResponse({ ok: true });
}
if (action === 'saveBiomarkerEntry') {
  saveBiomarkerToSheet(data);
  return jsonResponse({ ok: true });
}
```

---

## Archivos a crear / modificar en esta sprint

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `js/nutrition.js` | **CREAR** — constante NUTRITION_PLAN | 🔴 Alta |
| `js/api.js` | **MODIFICAR** — añadir funciones getNutritionLog, saveNutritionLog, etc. | 🔴 Alta |
| `js/app.js` | **MODIFICAR** — reemplazar renderNutrition() con la versión funcional | 🔴 Alta |
| `css/style.css` | **MODIFICAR** — añadir CSS de nutrición al final | 🟡 Media |
| `backend/Code.gs` | **MODIFICAR** — añadir hojas NutritionLog y Biomarkers | 🟡 Media |
| `index.html` | **MODIFICAR** — añadir `<script src="js/nutrition.js"></script>` | 🟡 Media |

---

## Agente sugerido para Claude Code

Al iniciar en VS Code, solicitar crear un agente con este rol:

```
Eres un desarrollador especializado en aplicaciones web de salud y fitness.
Tienes acceso al proyecto FitTracker en la carpeta actual.
Tu tarea es implementar el módulo de nutrición siguiendo exactamente
las especificaciones de docs/FEATURES_VSCODE.md y docs/NUTRICION_GUIA_APP.md.

Reglas:
1. No usar frameworks ni librerías externas
2. Mobile-first, CSS variables del sistema
3. localStorage primero, Google Sheets como sync
4. Antes de modificar cualquier archivo existente, leerlo completo
5. Un commit por cada función nueva que funcione
6. Preguntar si no está claro algún comportamiento de la UI
```
