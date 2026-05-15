# FitTracker — Epics & Stories
## Backlog completo del producto

**Convenciones de estado:**
- `✅ Done` — implementado y funcionando
- `🔲 To Do` — pendiente
- `🔄 In Progress` — en desarrollo
- `⏸ Blocked` — bloqueado por dependencia
- `🍽️ Part 2` — requiere datos de nutrición del usuario

---

---

## EPIC 1 — Configuración Inicial y Onboarding

> El usuario puede configurar la app por primera vez con sus datos personales y conectar el almacenamiento en la nube.

---

### Story 1.1 — Setup de perfil de usuario
**Estado:** 🔲 To Do
**Prioridad:** Alta

**Como** usuario,
**quiero** ingresar mis datos personales al abrir la app por primera vez,
**para** tener una referencia de inicio y poder medir el progreso.

**Criterios de aceptación:**
- Pantalla de bienvenida al primer uso (localStorage vacío)
- Campos obligatorios: nombre, peso (kg), altura (cm), edad
- Campos opcionales: objetivo (select), cintura, cadera, pecho, bíceps D, muslo D, cuello, % grasa
- Selección de unidades: kg/cm (default) o lb/in
- Datos guardados en localStorage bajo clave `fittracker_profile`
- Sincronizados a hoja "Profile" en Google Sheets
- Accesible y editable desde Tab "Progreso" → sección Perfil

**Notas técnicas:**
- Crear función `renderProfileSetup()` en app.js
- Crear estructura `PROFILE` en api.js con get/set
- No bloquear la app si el perfil está incompleto; mostrar banner de invitación

---

### Story 1.2 — Detección automática de etapa ✅
**Estado:** ✅ Done
**Archivo:** `js/config.js` → `getStageForDate()`

---

### Story 1.3 — Conexión con Google Sheets
**Estado:** ✅ Done (manual — requiere configurar URL)
**Archivo:** `js/config.js` → `APPS_SCRIPT_URL`, `backend/Code.gs`

---

### Story 1.4 — Selección de variante de Etapa 1.1
**Estado:** ✅ Done
**Archivo:** `js/app.js` → `saveVariant()`

---

---

## EPIC 2 — Registro Diario de Actividades

> El usuario puede ver y registrar lo que hizo cada día de entrenamiento.

---

### Story 2.1 — Ver actividades programadas del día ✅
**Estado:** ✅ Done
**Archivo:** `js/app.js` → `renderToday()`, `renderActivityCard()`

---

### Story 2.2 — Marcar actividades como done / partial / skip ✅
**Estado:** ✅ Done
**Archivo:** `js/app.js` → `setStatus()`

---

### Story 2.3 — Notas del día ✅
**Estado:** ✅ Done
**Archivo:** `js/app.js` → `saveDayNote()`

---

### Story 2.4 — Marcar día completo como cumplido
**Estado:** 🔲 To Do
**Prioridad:** Alta

**Como** usuario,
**quiero** poder marcar un día entero como "cumplido" o "descansado" con un solo toque,
**para** registrar rápidamente sin entrar actividad por actividad.

**Criterios de aceptación:**
- Botón "✓ Día completo" en la vista de Hoy → marca todas las actividades del día como `done`
- Botón "🛌 Día de descanso" → marca el día como descanso intencional (no penaliza consistencia)
- Botón "⚡ Día parcial" → abre modal para seleccionar rápido qué sí y qué no
- Estado del día reflejado en la vista Semana con icono diferenciado
- El estado de "día descansado" intencional cuenta como 70% a efectos de consistencia (no 0%)

**Notas técnicas:**
- Añadir campo `dayStatus: 'normal' | 'complete' | 'rest' | 'sick'` a la estructura del log diario
- Actualizar `getWeekStats()` en api.js para manejar `dayStatus === 'rest'`
- Actualizar `renderWeek()` para mostrar iconos diferenciados por estado de día

---

### Story 2.5 — Compensación de actividad saltada
**Estado:** 🔲 To Do
**Prioridad:** Media

**Como** usuario,
**quiero** que cuando salte una actividad la app me sugiera cuándo recuperarla,
**para** no perder el mínimo semanal de gym o nado.

**Criterios de aceptación:**
- Al marcar una actividad como `skip`, si esa actividad es gym o swim, mostrar toast: "¿Cuándo la recuperas?"
- Opciones: Mañana / Pasado mañana / Esta semana (sin fecha fija) / No recupero
- Si elige fecha, crear un "bloque de compensación" en ese día
- El bloque de compensación aparece destacado en la vista de ese día
- Si al final de la semana siguen sin cumplirse los mínimos, mostrar alerta en Tab Semana

**Notas técnicas:**
- Añadir campo `compensationFor: string | null` en la estructura de actividad
- Función `suggestCompensation(dateStr, activityId)` en api.js
- No afecta el horario fijo, solo añade bloques extra

---

---

## EPIC 3 — Gestión del Horario Semanal

> El usuario puede reorganizar sus sesiones de entrenamiento de forma flexible.

---

### Story 3.1 — Ver horario de la semana completo ✅
**Estado:** ✅ Done
**Archivo:** `js/app.js` → `renderWeek()`

---

### Story 3.2 — Mover una sesión (solo semana actual)
**Estado:** 🔲 To Do
**Prioridad:** Alta

**Como** usuario,
**quiero** poder mover una sesión de entrenamiento a otro día de esta semana,
**para** adaptarme a imprevistos sin perder la sesión.

**Criterios de aceptación:**
- En la vista de Hoy o Semana, long-press o menú contextual en una actividad → "Mover a otro día"
- Selector de día destino (solo días de la semana actual con actividades disponibles)
- La actividad desaparece del día origen y aparece en el día destino
- Opción visible: "Solo esta semana"
- El horario base de la siguiente semana no cambia
- El cambio queda reflejado en Google Sheets

**Notas técnicas:**
- Añadir campo `movedFrom: { date, originalDayOfWeek } | null` a la actividad
- Función `moveActivity(fromDate, actId, toDate, scope)` en api.js
- `scope`: `'week'` | `'forward'` | `'alternating'`
- Para scope `'week'`: modificar solo el log del día origen y destino
- Actualizar `getSchedule()` en schedule.js para que consulte overrides antes del schedule base

---

### Story 3.3 — Mover una sesión (de ahora en adelante)
**Estado:** 🔲 To Do
**Prioridad:** Media
**Depende de:** Story 3.2

**Como** usuario,
**quiero** poder cambiar permanentemente el día en que hago una sesión,
**para** adaptar el programa a un cambio de agenda que se vuelve fijo.

**Criterios de aceptación:**
- Misma UI que 3.2, opción: "De ahora en adelante"
- Guarda un override en `fittracker_schedule_overrides` en localStorage
- La app consulta overrides antes del schedule base en cada render
- El override es por tipo de actividad + día original → día nuevo
- Puede ser revertido desde Tab Progreso → Configuración

**Notas técnicas:**
- Estructura: `scheduleOverrides: [ { actType, fromDay, toDay, fromDate, scope } ]`
- Función `applyScheduleOverride(override)` en schedule.js
- Función `clearOverride(actType, fromDay)` para revertir

---

### Story 3.4 — Mover una sesión (semanas alternadas)
**Estado:** 🔲 To Do
**Prioridad:** Baja
**Depende de:** Story 3.3

**Como** usuario,
**quiero** poder alternar el día de una sesión cada dos semanas,
**para** tener variedad cuando tengo compromisos en semanas alternas.

**Criterios de aceptación:**
- Opción: "Alternado (semanas impares → Lunes, semanas pares → Miércoles)"
- Aplica la lógica de paridad usando `getISOWeek(date) % 2`
- Visible en Tab Progreso → Configuración como override activo
- Puede ser revertido

---

### Story 3.5 — Intercambiar dos días completos
**Estado:** 🔲 To Do
**Prioridad:** Media

**Como** usuario,
**quiero** poder intercambiar todo el contenido de dos días de la semana,
**para** reorganizar el bloque completo cuando se cambia el día de una clase.

**Criterios de aceptación:**
- En Tab Semana: seleccionar dos tarjetas de días → botón "Intercambiar"
- Confirmación con preview de qué actividades se moverán
- Opciones: "Solo esta semana" o "De ahora en adelante"
- Reflejo inmediato en la vista y en Sheets

---

---

## EPIC 4 — Métricas de Progreso Corporal

> El usuario puede registrar y visualizar la evolución de su composición corporal.

---

### Story 4.1 — Registro semanal de peso
**Estado:** 🔲 To Do
**Prioridad:** Alta

**Como** usuario,
**quiero** poder registrar mi peso una vez por semana,
**para** tener una curva de progreso a lo largo del programa.

**Criterios de aceptación:**
- En Tab Progreso → sección "Métricas", campo de peso con fecha
- Frecuencia sugerida: lunes en ayunas
- Recordatorio visual si llevan +10 días sin registrar
- Historial de los últimos 12 registros en tabla
- Mini-gráfica de línea (sparkline) de las últimas 8 semanas
- Guardado en localStorage y sincronizado a hoja "BodyMetrics" en Sheets

**Notas técnicas:**
- Crear hoja "BodyMetrics" en Code.gs con columnas: date, weight, waist, hip, chest, bicepR, thighR, neck, bodyFat, notes
- Función `saveBodyMetric(data)` y `getBodyMetrics()` en api.js
- Sparkline: librería nativa SVG o canvas simple, sin dependencias externas

---

### Story 4.2 — Registro de medidas corporales (opcional)
**Estado:** 🔲 To Do
**Prioridad:** Media
**Depende de:** Story 4.1

**Como** usuario,
**quiero** poder registrar opcionalmente mis medidas corporales,
**para** tener un indicador de composición corporal más completo que solo el peso.

**Criterios de aceptación:**
- Medidas disponibles (todas opcionales): cintura, cadera, pecho, bíceps derecho, muslo derecho, cuello
- El usuario activa/desactiva cuáles quiere rastrear desde Configuración
- Se registran con la misma frecuencia que el peso (o independiente si se prefiere)
- Tabla de evolución con columna de delta (cambio vs. registro anterior)
- Las medidas se guardan junto al registro de peso en la misma entrada de "BodyMetrics"

**Notas técnicas:**
- Las medidas desactivadas no aparecen en el formulario ni en la tabla
- Preferencias guardadas en `fittracker_meta` → `trackedMeasurements: string[]`

---

### Story 4.3 — Registro de % de grasa corporal
**Estado:** 🔲 To Do
**Prioridad:** Baja
**Depende de:** Story 4.1

**Como** usuario,
**quiero** poder registrar mi % de grasa corporal cuando lo mida,
**para** complementar el seguimiento de composición con datos más precisos.

**Criterios de aceptación:**
- Campo opcional en el registro de métricas
- Aceptar valores entre 3% y 50%
- Si se tienen medidas de cuello + cintura (+ cadera para mujeres), mostrar estimación con fórmula de la Marina de EE.UU.
- Fórmula: para hombre → `495 / (1.0324 − 0.19077 * log10(cintura − cuello) + 0.15456 * log10(altura)) − 450`
- Mostrar siempre como estimación, nunca como valor médico

---

### Story 4.4 — Cálculo de consistencia semanal ✅
**Estado:** ✅ Done
**Archivo:** `js/api.js` → `getWeekStats()`

---

### Story 4.5 — Recomendación de progresión ✅
**Estado:** ✅ Done
**Archivo:** `js/app.js` → `renderProgress()`

---

### Story 4.6 — Gráficas de progreso (peso + consistencia)
**Estado:** 🔲 To Do
**Prioridad:** Media
**Depende de:** Story 4.1

**Como** usuario,
**quiero** ver gráficas de mi evolución en peso y consistencia semanal,
**para** tener feedback visual motivador de mi progreso a lo largo del tiempo.

**Criterios de aceptación:**
- Gráfica de línea de peso (últimas 8 semanas)
- Gráfica de barras de consistencia % por semana (últimas 8 semanas)
- Línea de referencia en 80% en la gráfica de consistencia
- Implementadas sin librerías externas (SVG nativo o canvas)
- Visibles en Tab Progreso → sección Gráficas
- Responsive, funcionan bien en móvil

**Notas técnicas:**
- Función `renderSparkline(data, options)` reutilizable en app.js
- Los datos vienen de `getBodyMetrics()` y del historial de `getWeekStats()`
- El historial de stats semanales se guarda acumulado en localStorage

---

---

## EPIC 5 — Plan Nutricional

> El usuario tiene un plan de alimentación personalizado integrado en la app.
> **⚠️ Requiere datos del usuario: dieta actual, restricciones, objetivos. Parte 2.**

---

### Story 5.1 — Perfil nutricional
**Estado:** 🍽️ Part 2
**Prioridad:** Alta (cuando se active)

**Como** usuario,
**quiero** configurar mis preferencias y restricciones alimentarias,
**para** recibir un plan adaptado a mí.

**Criterios de aceptación:**
- Objetivo calórico calculado a partir de peso, altura, edad, actividad (TDEE)
- Distribución de macros según objetivo (volumen / definición / mantenimiento)
- Restricciones: alergias, intolerancias, preferencias (sin gluten, sin lactosa, etc.)
- Variación por tipo de día: gym / BJJ / descanso / hiking

---

### Story 5.2 — Plan de comidas por etapa
**Estado:** 🍽️ Part 2

---

### Story 5.3 — Registro diario de alimentación (simplificado)
**Estado:** 🍽️ Part 2

---

### Story 5.4 — Pre y post-entreno por tipo de sesión
**Estado:** 🍽️ Part 2

---

---

## EPIC 6 — Almacenamiento y Sincronización

> Los datos del usuario están seguros y accesibles desde cualquier dispositivo.

---

### Story 6.1 — localStorage como almacenamiento primario ✅
**Estado:** ✅ Done
**Archivo:** `js/api.js`

---

### Story 6.2 — Sync a Google Sheets ✅
**Estado:** ✅ Done
**Archivo:** `js/api.js` → `syncToSheets()`, `backend/Code.gs`

---

### Story 6.3 — Sync manual con botón ✅
**Estado:** ✅ Done
**Archivo:** `js/app.js` → `handleManualSync()`

---

### Story 6.4 — Resolución de conflictos offline/online
**Estado:** 🔲 To Do
**Prioridad:** Baja

**Como** usuario,
**quiero** que si entrené sin internet y luego me conecto, mis datos no se pierdan,
**para** no tener que volver a registrar nada.

**Criterios de aceptación:**
- Al abrir la app con conexión, comparar `updatedAt` de localStorage vs Sheets
- Siempre gana el más reciente
- Si hay conflicto en el mismo día, mostrar banner "Conflicto detectado → Guardar local / Guardar nube"
- Sin conflicto: merge silencioso

---

### Story 6.5 — Exportar datos a CSV
**Estado:** 🔲 To Do
**Prioridad:** Baja

**Como** usuario,
**quiero** poder exportar mi historial de entrenamientos y métricas a CSV,
**para** tener una copia de seguridad independiente y poder analizarlo en Excel.

**Criterios de aceptación:**
- Botón "Exportar CSV" en Tab Progreso → Configuración
- Exporta: Training Log (todos los días) + BodyMetrics (todas las mediciones)
- Dos archivos separados o uno combinado (a definir)
- Descarga directa desde el navegador

---

---

## EPIC 7 — UX y Accesibilidad

> La app es cómoda de usar en el gimnasio, en la alberca y en casa.

---

### Story 7.1 — Modo offline funcional ✅
**Estado:** ✅ Done (via localStorage)

---

### Story 7.2 — PWA instalable (icono en pantalla de inicio)
**Estado:** 🔲 To Do
**Prioridad:** Media

**Como** usuario,
**quiero** poder instalar la app en mi teléfono como si fuera una app nativa,
**para** abrirla rápido sin buscar en el navegador.

**Criterios de aceptación:**
- Archivo `manifest.json` con nombre, icono y colores de tema
- Service Worker básico para cache de assets (no de datos)
- Aparece el banner "Añadir a pantalla de inicio" en Chrome/Safari
- Abre en fullscreen sin barra del navegador

**Notas técnicas:**
- Crear `manifest.json` en raíz
- Crear `sw.js` con cache de: index.html, css/style.css, todos los js/
- No cachear las llamadas a Apps Script

---

### Story 7.3 — Pantalla de carga y estados vacíos
**Estado:** 🔲 To Do
**Prioridad:** Baja

**Criterios de aceptación:**
- Spinner mientras se carga el primer render
- Mensaje amigable si no hay datos para una semana
- Estado vacío en gráficas cuando no hay suficientes datos (mínimo 2 puntos)

---

---

## Resumen de Estado

| Epic | Stories totales | Done | To Do | Part 2 |
|------|----------------|------|-------|--------|
| 1 — Onboarding | 4 | 3 | 1 | 0 |
| 2 — Registro Diario | 5 | 3 | 2 | 0 |
| 3 — Gestión Horario | 5 | 1 | 4 | 0 |
| 4 — Métricas Corporales | 6 | 2 | 4 | 0 |
| 5 — Nutrición | 4 | 0 | 0 | 4 |
| 6 — Almacenamiento | 5 | 3 | 2 | 0 |
| 7 — UX / PWA | 3 | 1 | 2 | 0 |
| **Total** | **32** | **13** | **15** | **4** |

---

## Orden de Implementación Recomendado

### Sprint 1 (próxima sesión)
1. Story 1.1 — Perfil de usuario (peso, medidas, objetivo)
2. Story 4.1 — Registro semanal de peso
3. Story 4.2 — Medidas corporales opcionales
4. Story 2.4 — Marcar día completo

### Sprint 2
5. Story 3.2 — Mover sesión (semana actual)
6. Story 3.3 — Mover sesión (de ahora en adelante)
7. Story 3.5 — Intercambiar dos días
8. Story 4.6 — Gráficas

### Sprint 3
9. Story 5.x — Plan nutricional (cuando el usuario tenga lista la info)
10. Story 7.2 — PWA instalable
11. Story 2.5 — Compensación de saltados
12. Story 3.4 — Semanas alternadas

---

## Sprint Nutrición (Datos del usuario disponibles — implementar ahora)

### Story 5.1 — Checklist nutricional diario
**Estado:** 🔲 To Do → **PRIORIDAD ALTA**

Implementar Tab "Nutrición" funcional con:
- Checklist de rituales diarios (agua limón, jugo apio, verduras, té, hidratación)
- Selector de categoría de desayuno (proteína+verdura / fruta sola / jugo verde)
- Metas semanales (pescado graso 3x, fruta sola 3x, alimento hepático 5x)
- Marcadores de laboratorio (línea base de enero 2026 precargada)

**Archivos a leer antes de implementar:**
- `docs/NUTRICION_GUIA_APP.md` — tiene los datos y funciones completos listos para copiar
- `docs/NUTRICION_REPORTE.md` — contexto médico

### Story 5.2 — Módulo de marcadores de laboratorio
**Estado:** 🔲 To Do

- Precarga línea base: ALT 99, TGC 205, VLDL 41, HDL 48, IgE 252, LDL 107
- Campo para registrar nuevos estudios con fecha
- Comparación visual baseline → actual → meta
- Recordatorio en Tab Progreso si llevan >90 días sin actualizar estudios

### Story 5.3 — Ajuste nutricional por día de entrenamiento
**Estado:** 🔲 To Do

- Si el día tiene gym o BJJ → mostrar sugerencia pre y post entreno
- Si el día es descanso → recordar protocolo de comida ligera (hepático)
- Si es semana de descarga → recordar que la cena también se reduce

### Story 5.4 — Hidratación guiada
**Estado:** 🔲 To Do

- Contador de vasos bebidos (en Tab Nutrición)
- Meta: 2.5L
- Indicador de agua de sandía (sem 1-4) vs jamaica/piña (sem 5+)
- Alerta suave si no se han registrado 6 vasos a las 4 PM
