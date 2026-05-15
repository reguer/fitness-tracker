# FitTracker — Handoff Completo

## Qué es esto

Tracker personal de entrenamiento para seguir el programa personalizado basado en Anatoly Power System (APS), adaptado a:
- Lumbares post-operadas (5 meses): sin carga axial, sin peso adicional en calistenia
- 3 sesiones mínimas de gym por semana (máx 90 min)
- 3 sesiones mínimas de natación por semana (mín 25 min)
- Movilidad/flexibilidad 20 min diarios en casa
- Progresión a BJJ (julio 2026) + Box/MMA (junio 2026)

---

## Stack Técnico

```
GitHub Pages (hosting gratuito)
    └── HTML + CSS + JS (sin framework, sin build)
            ↓ fetch
Google Apps Script (API REST gratuita)
            ↓
Google Sheets (base de datos + historial)
            ↓
Google Drive (respaldo automático)
```

---

## Setup en 5 pasos (~25 minutos)

### Paso 1 — Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `fittracker` (o el que quieras)
3. Visibilidad: **Public** (GitHub Pages gratuito solo funciona en repos públicos)
4. No inicialices con README
5. Clic en **Create repository**

### Paso 2 — Subir los archivos desde VS Code

```bash
# En terminal de VS Code, dentro de la carpeta fitness-tracker:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/fittracker.git
git branch -M main
git push -u origin main
```

### Paso 3 — Activar GitHub Pages

1. En tu repo de GitHub → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Clic en **Save**
5. En ~2 minutos tu app estará en `https://TU_USUARIO.github.io/fittracker`

### Paso 4 — Configurar Google Apps Script

1. Ve a https://script.google.com
2. **Nuevo proyecto** → pega el contenido de `backend/Code.gs`
3. En el menú **Ejecutar** → selecciona `setupSheets` → ejecutar
4. Autoriza los permisos (es tu propia cuenta)
5. En el log verás la URL del nuevo Google Sheet → cópiala
6. **Implementar** → **Nueva implementación**
   - Tipo: **Web App**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona**
7. Copia la URL de implementación (termina en `/exec`)

### Paso 5 — Conectar la app con Sheets

1. Abre `js/config.js` en VS Code
2. Pega la URL en `APPS_SCRIPT_URL: 'https://script.google.com/...'`
3. Guarda, commit y push:

```bash
git add js/config.js
git commit -m "Connect Google Sheets"
git push
```

¡Listo! La app en GitHub Pages ahora sincroniza con Google Sheets.

---

## Estructura de Archivos

```
fitness-tracker/
├── index.html              ← Entrada de la app
├── css/
│   └── style.css           ← Estilos dark theme
├── js/
│   ├── config.js           ← ⚠️ Aquí va tu APPS_SCRIPT_URL
│   ├── schedule.js         ← Horarios por etapa (toda la lógica de rutinas)
│   ├── api.js              ← localStorage + sync a Sheets
│   └── app.js              ← Renderizado y eventos
├── backend/
│   └── Code.gs             ← Copia esto en Google Apps Script
├── README.md               ← Este archivo
└── notion-guide.md         ← Guía alternativa para Notion
```

**Para modificar el programa:** edita `js/schedule.js`
**Para cambiar fechas de etapas:** edita `js/config.js` → `CONFIG.STAGES`
**Para cambiar la variante de box (2→3 días):** en `config.js` → `STAGE_11_VARIANT: '3box'`

---

## Cómo usar la app

### Tab "Hoy"
- Muestra las actividades del día según la etapa activa
- Toca **✓ / ~ / ✕** en cada actividad para marcarla como hecha / parcial / saltada
- Las píldoras superiores muestran gym y swim de la semana en tiempo real
- El acordeón debajo de cada actividad muestra los ejercicios exactos
- El textarea inferior es para notas del día

### Tab "Semana"
- Vista de las 7 actividades de la semana con % de completitud
- Toca cualquier día para ir a él
- Resumen de conteos gym/swim/BJJ/box

### Tab "Progreso"
- Barra de consistencia (meta: 80%)
- Indica si aplica aumento de carga la próxima semana
- Tabla de progresión de pesos
- Timeline de etapas
- Configuración (variante 1.1: 2box vs 3box)

### Tab "Nutrición"
- Placeholder — se completará en Parte 2

---

## Timeline del Programa

| Etapa | Fechas | Contenido |
|-------|--------|-----------|
| **Etapa 0** | 13 may → 31 may 2026 | Sin artes marciales. Fundación. |
| **Etapa 1.1** | 1 jun → 30 jun 2026 | Box/MMA 2–3 días |
| **Etapa 2** | 1 jul 2026 → | BJJ ×3 + Box ×1 |

---

## Reglas de Progresión

| Situación | Acción |
|-----------|--------|
| ≥80% de consistencia semanal | +5% peso o +1 rep en todos los ejercicios |
| 4 semanas seguidas al 80%+ | +10% en compound lifts (bench, leg press, jalón) |
| Semana incompleta (<80%) | No aumentar; mantener carga |
| Cada 4 semanas (siempre) | Semana de descarga: −30% volumen y peso |
| Etapa 2 activa | Solo mantenimiento en gym; el volumen de MMAA es alto |

**Kettlebells:**
- Etapa 0: 8 kg general, 12 kg goblet squat desde sem 4
- Etapa 1.1: 12 kg press/remo, 16 kg goblet
- Etapa 2: 16 kg goblet y remo, 12 kg press

---

## Restricciones Médicas (recordatorio para el código)

❌ Sin sentadilla con barra en espalda → Leg Press / Goblet Squat
❌ Sin peso muerto convencional pesado → Hip Thrust / Cable Pull-Through / RDL ligero
❌ Sin dominadas/dips con peso adicional → solo bodyweight
❌ Sin Good Mornings, Jefferson Deadlift
⚠️ KB Swing: solo con aval médico explícito

---

## Actualizar la app después de cambios

```bash
# Después de editar cualquier archivo:
git add .
git commit -m "Descripción del cambio"
git push
# GitHub Pages se actualiza automáticamente en ~1-2 minutos
```

---

## Nutrición — Parte 2 (Pendiente)

Esta sección se completará cuando se proporcionen:
- Dieta existente actual
- Restricciones y alergias alimentarias
- Horarios de comida preferidos

La app ya tiene el tab "Nutrición" reservado para cuando esté lista.

---

## Contacto y Soporte

Si algo no funciona, revisa primero:
1. ¿Está bien pegada la URL en `js/config.js`?
2. ¿Se ejecutó `setupSheets()` en Apps Script?
3. ¿El repo de GitHub es público y Pages está activado?
