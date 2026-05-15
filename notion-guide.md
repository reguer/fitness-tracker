# FitTracker — Guía de Notion
## Plantilla con fórmulas y automatizaciones nativas

> **Nota:** Esta guía es el plan B / referencia comparativa.
> El stack principal es GitHub Pages + Google Sheets (ver README.md).
> Notion funciona bien para visualización y registro rápido desde móvil,
> pero la progresión automática y el horario inteligente por etapa
> son más limitados que en la app custom.

---

## Estructura de Bases de Datos

Necesitarás crear **3 bases de datos** en Notion:

### 1. 📋 Training Log (Base principal)

Una entrada por día de entrenamiento.

**Propiedades:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| Fecha | Date | Fecha del registro |
| Etapa | Select | Etapa 0 / Etapa 1.1 / Etapa 2 |
| Semana en etapa | Number | Número de semana dentro de la etapa |
| 🏋️ Gym | Checkbox | ¿Hiciste gym? |
| Tipo Gym | Select | A-Empuje / B-Tirón / C-Piernas+Core |
| 🏊 Natación | Checkbox | ¿Nadaste? |
| Intensidad Nado | Select | Suave / Media / Intensa |
| 🧘 Movilidad AM | Checkbox | 20 min en casa |
| 🧘 Flexibilidad AM | Checkbox | 20 min en casa |
| 🥋 BJJ | Checkbox | Clase de jiujitsu |
| 🥊 Box/MMA | Checkbox | Clase de box |
| 🔔 KB/Calistenia | Checkbox | Sesión kettlebell |
| 🥾 Hiking | Checkbox | Caminata en trail |
| 🧖 Sauna | Checkbox | Sesión sauna/vapor |
| Actividades hechas | Formula | Cuenta de checkboxes activos |
| Actividades programadas | Number | Llénalo manualmente según el día |
| % Completitud | Formula | `round(prop("Actividades hechas") / prop("Actividades programadas") * 100)` |
| Notas | Text | Observaciones del día |
| Estado | Formula | Emoji de estado general |
| Semana ISO | Formula | Número de semana del año |

**Fórmulas clave:**

```notion
// Actividades hechas (cuenta todos los checkboxes marcados)
toNumber(prop("🏋️ Gym")) +
toNumber(prop("🏊 Natación")) +
toNumber(prop("🧘 Movilidad AM")) +
toNumber(prop("🧘 Flexibilidad AM")) +
toNumber(prop("🥋 BJJ")) +
toNumber(prop("🥊 Box/MMA")) +
toNumber(prop("🔔 KB/Calistenia")) +
toNumber(prop("🥾 Hiking")) +
toNumber(prop("🧖 Sauna"))

// Estado del día (emoji)
if(prop("% Completitud") >= 90, "✅",
  if(prop("% Completitud") >= 60, "🟡",
  if(prop("% Completitud") > 0, "🔴", "⬜")))

// Semana ISO (número de semana del año)
ceil(dateBetween(prop("Fecha"), dateSubtract(start(prop("Fecha")), day(start(prop("Fecha"))) - 1, "days"), "days") / 7)
```

---

### 2. 📅 Resumen Semanal

Una entrada por semana. Se alimenta de **rollups** desde Training Log.

**Cómo crear la relación:**
1. En Training Log, añade propiedad Relación → apunta a "Resumen Semanal"
2. En Resumen Semanal, añade propiedades Rollup para cada actividad

**Propiedades:**

| Propiedad | Tipo | Configuración |
|-----------|------|---------------|
| Semana | Title | Ej: "Sem 3 — Etapa 0" |
| Fecha inicio | Date | Lunes de esa semana |
| Días | Relation | → Training Log |
| 🏋️ Gym total | Rollup | Cuenta de "🏋️ Gym" marcados |
| 🏊 Nado total | Rollup | Cuenta de "🏊 Natación" marcados |
| 🧘 Movilidad total | Rollup | Suma de Movilidad + Flexibilidad |
| Días completados | Rollup | Suma de "Actividades hechas" |
| Días programados | Rollup | Suma de "Actividades programadas" |
| % Consistencia | Formula | Ver abajo |
| ✅ Gym mínimo | Formula | `prop("🏋️ Gym total") >= 3` |
| ✅ Nado mínimo | Formula | `prop("🏊 Nado total") >= 3` |
| Aplicar progresión | Formula | Ver abajo |
| Semana de descarga | Formula | Ver abajo |
| Notas semana | Text | Resumen y ajustes |

**Fórmulas de Resumen Semanal:**

```notion
// % Consistencia
if(prop("Días programados") > 0,
  round(prop("Días completados") / prop("Días programados") * 100),
  0)

// Aplicar progresión
prop("% Consistencia") >= 80 and
prop("✅ Gym mínimo") and
prop("✅ Nado mínimo")

// Semana de descarga (cada 4 semanas)
// Requiere campo "Número semana en etapa" llenado manualmente
mod(prop("Semana en etapa"), 4) == 0

// Resumen visual
if(prop("Aplicar progresión"),
  "📈 Subir carga",
  if(prop("Semana de descarga"), "🔄 Descarga", "⏸ Mantener"))
```

---

### 3. 🍽️ Plan Nutricional (Pendiente — Parte 2)

Se creará en la segunda sesión cuando se definan:
- Dieta base actual
- Restricciones alimentarias
- Macros por etapa y por tipo de día (gym / BJJ / descanso)

**Estructura anticipada:**
- Comidas por día (Desayuno / Pre-entreno / Post-entreno / Cena)
- Macros target por etapa
- Variación según carga del día

---

## Vistas Recomendadas para Training Log

### Vista 1 — Calendario (principal)
- Tipo: **Calendar**
- Mostrar por: Fecha
- Filtro: Sin filtro
- Agrupar por día
- **Ideal para ver qué días entrenaste de un vistazo**

### Vista 2 — Semana actual
- Tipo: **Table**
- Filtro: Fecha → Esta semana
- Ordenar: Fecha → Ascendente
- Columnas visibles: Fecha, Gym, Natación, Movilidad AM, Estado, % Completitud

### Vista 3 — Por etapa
- Tipo: **Gallery**
- Filtro: Etapa → Etapa activa
- Ordenar: Fecha → Descendente

### Vista 4 — Solo gym
- Tipo: **Table**
- Filtro: 🏋️ Gym = true
- Columnas: Fecha, Tipo Gym, Notas

---

## Automatizaciones Nativas de Notion

Las siguientes automatizaciones están disponibles en el plan de pago (Notion Plus o superior):

### 1. Crear entrada diaria automática
**Trigger:** Cada día a las 6:00 AM
**Acción:** Crear nueva página en Training Log con:
- Fecha = Hoy
- Etapa = valor fijo (actualizar al cambiar de etapa)
- Actividades programadas = valor por defecto según día de semana

> ⚠️ Notion no tiene lógica condicional avanzada en triggers. Tendrías que
> crear una automatización por día de semana y actualizarla al cambiar de etapa.

### 2. Notificación de mínimos no cumplidos
**Trigger:** Cada domingo a las 8:00 PM
**Acción:** Si gym < 3 o nado < 3 en Resumen Semanal → Enviar notificación

### 3. Crear entrada de Resumen Semanal
**Trigger:** Cada lunes a las 6:00 AM
**Acción:** Crear nueva página en Resumen Semanal con la fecha del lunes

---

## Limitaciones de Notion vs la App Custom

| Función | Notion | App GitHub Pages |
|---------|--------|-----------------|
| Horario automático por etapa | ❌ Manual | ✅ Automático |
| Ejercicios del día con notas | ❌ No integrado | ✅ Acordeón por actividad |
| Sync entre dispositivos | ✅ Nativo | ✅ Via Google Sheets |
| Modo offline | ⚠️ Limitado | ✅ localStorage |
| Progresión calculada auto | ⚠️ Fórmulas básicas | ✅ Lógica completa |
| Detección de etapa por fecha | ❌ Manual | ✅ Automático |
| Setup inicial | ✅ ~30 min | ⚠️ ~25 min + código |
| Mantenimiento | ✅ Cero | ⚠️ Mínimo |
| Móvil | ✅ App nativa | ✅ PWA en navegador |

---

## Cómo usar Notion en paralelo (recomendado)

Si quieres ambos:
1. **App GitHub Pages** → registro diario detallado (ejercicios, status)
2. **Notion** → visión semanal y mensual de alto nivel, notas de reflexión

Los datos clave también quedan en Google Sheets para análisis futuro.

---

## Templates de Páginas para Notion

### Template: Día de Gym

```
🏋️ [GYM A — EMPUJE]   📅 [Fecha]

CALENTAMIENTO (8-10 min)
☐ Bicicleta estática 3 min
☐ Rodillo torácico + cat-cow
☐ Band pull-aparts ×15
☐ Rotadores con banda ×15

EJERCICIOS
☐ Press de Banca Plano         4×6-8  ___kg
☐ Press Banca Inclinado 30°    3×8-10 ___kg
☐ Press Hombros Sentado        3×8-10 ___kg
☐ Elevaciones Laterales        3×12-15 ___kg
☐ Extensión Tríceps Polea      3×12-15
☐ Skull Crushers               2×10-12 ___kg

CORE (8 min)
☐ Dead Bug 3×10 c/lado
☐ Pallof Press 3×12 c/lado
☐ Plank Lateral 3×20 seg c/lado

Notas: ___________________________
Energía hoy (1-10): ___
```

### Template: Día de Natación

```
🏊 [NATACIÓN — INTENSA]   📅 [Fecha]

☐ Calentamiento 200m (suave)
☐ 6×100m con 30-40 seg descanso
  Tiempos: ___  ___  ___  ___  ___  ___
☐ Enfriamiento 150m (suave)
Total: ~35 min

Estilo: Crol  ☐  /  Espalda  ☐
Notas: ___________________________
```

---

## Próximos Pasos para Notion

1. Duplicar la plantilla de Training Log
2. Llenar las primeras 2 semanas de Etapa 0 con las actividades de cada día
3. Crear el Resumen Semanal para la semana actual
4. Conectar la relación Training Log → Resumen Semanal
5. Configurar las automatizaciones de creación diaria
6. Esperar la Parte 2 para añadir el plan nutricional
