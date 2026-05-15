# PROMPT DE CONTEXTO — FitTracker
## Copia y pega esto al inicio de una nueva sesión de trabajo

---

Estoy trabajando en una app de seguimiento de entrenamiento personal llamada **FitTracker**, construida en **HTML + CSS + JS vanilla**, alojada en **GitHub Pages**, con sincronización a **Google Sheets via Google Apps Script**.

## Contexto del Programa

El programa está basado en una versión modificada del sistema APS (Anatoly Power System), adaptado a mis condiciones y objetivos personales. Aquí el resumen completo:

### Restricciones médicas
- Lumbares recién operadas (5 meses post-op)
- **Eliminados:** sentadilla con barra, peso muerto convencional pesado, dominadas/dips con peso extra, Good Mornings, Deficit Deadlift
- **Reemplazos:** Leg Press, Goblet Squat, Hip Thrust, Cable Pull-Through, RDL ligero con mancuernas, dominadas bodyweight
- KB Swing: solo con aval médico explícito

### Estructura semanal (varía por etapa)
- **Gym:** mínimo 3 sesiones/semana, máximo 90 min por sesión
- **Natación:** mínimo 3 sesiones/semana, mínimo 25 min (intensidades: suave, media, intensa)
- **Movilidad/Flexibilidad AM:** 20 min en casa, todos los días, alterna Bloque A (articular) y Bloque B (flexibilidad)
- **KB + Calistenia:** 1 día/semana (semanas impares=fuerza, pares=circuito), kettlebells disponibles: 8, 12 y 16 kg
- **Hiking:** 1 día/semana (sábado o domingo, alterna según semana)
- **Sauna:** 2 veces/semana (miércoles post-gym + domingo)
- **BJJ:** 3 veces/semana, tardes (Etapa 2, desde julio 2026)
- **Box/MMA:** 2–3 veces/semana (Etapa 1.1, desde junio 2026)

### Timeline de etapas
| Etapa | Fechas | Contenido |
|-------|--------|-----------|
| Etapa 0 — Fundación | 13 may → 31 may 2026 | Sin artes marciales |
| Etapa 1.1 — Box/MMA | 1 jun → 30 jun 2026 | 2–3 días Box/MMA |
| Etapa 2 — BJJ Full | 1 jul 2026 → indefinido | BJJ ×3 + Box ×1 |

### Progresión
- ≥80% consistencia semanal → +5% peso o +1 rep
- 4 semanas seguidas al 80%+ → +10% en compound lifts
- Cada 4 semanas → semana de descarga (−30%)
- Etapa 2 → solo mantenimiento en gym

---

## Stack Técnico

```
GitHub Pages (hosting)
    ├── index.html
    ├── css/style.css          (dark theme, mobile-first)
    └── js/
        ├── config.js          (fechas de etapas, URLs, constantes)
        ├── schedule.js        (horarios completos por etapa)
        ├── api.js             (localStorage + sync Google Sheets)
        └── app.js             (renderizado, eventos, lógica UI)

Google Apps Script (backend/Code.gs)
    └── Google Sheets (base de datos)
```

Los archivos ya existen. El proyecto está en la carpeta `fitness-tracker/`.

---

## Documento de Referencia del Producto

Existe un archivo `docs/EPICS_AND_STORIES.md` con el backlog completo organizado en Epics y User Stories. Úsalo como referencia para priorizar y no perder el hilo entre sesiones.

También existe `docs/FEATURES_VSCODE.md` con las especificaciones técnicas de las funciones pendientes de implementar.

---

## Estado Actual del Proyecto

### ✅ Implementado
- Estructura completa de archivos y carpetas
- Detección automática de etapa según fecha
- Horarios por etapa (0, 1.1 en 2box y 3box, 2)
- Vista "Hoy": actividades del día con status done/partial/skip
- Vista "Semana": grid 7 días con % completitud
- Vista "Progreso": barra de consistencia, tabla de progresión, timeline de etapas
- localStorage como almacenamiento primario
- Sincronización con Google Sheets via Apps Script
- Tab "Nutrición" reservado (Parte 2)
- Navegación entre días
- Notas del día
- Píldoras de mínimos (gym ≥3, swim ≥3)
- Configuración de variante box (2box / 3box)

### 🔲 Pendiente (ver EPICS_AND_STORIES.md)
- Perfil de usuario con peso, medidas corporales, % grasa
- Marcar días completos como cumplidos (nivel día, no solo actividad)
- Reagendar sesiones (solo semana actual / de ahora en adelante / alternado)
- Gráficas de progreso (peso, medidas, consistencia)
- Plan nutricional (Parte 2, pendiente de restricciones del usuario)

---

## Antes de Empezar a Codificar

Necesito que me hagas las siguientes preguntas para completar el perfil de usuario y poder personalizar la app (especialmente la parte de nutrición y métricas de progreso):

1. **Peso actual** (kg) — referencia de inicio para seguimiento
2. **Altura** (cm) — para cálculo de IMC y calorías
3. **Edad** — para ajuste de TDEE y zonas de frecuencia cardíaca
4. **Objetivo principal:** perder grasa / ganar músculo / recomposición / rendimiento / salud general
5. **Medidas corporales** (opcional, puedes marcar cuáles quieres rastrear):
   - Cintura (cm)
   - Cadera (cm)
   - Pecho (cm)
   - Bíceps derecho (cm)
   - Muslo derecho (cm)
   - Cuello (cm)
   - % de grasa corporal estimado (si lo sabes)
6. **Frecuencia de medición:** semanal / quincenal / mensual
7. **¿Tienes una dieta actual?** Si sí, descríbela brevemente para adaptarla (esta info es para la Parte 2 — Nutrición)
8. **Restricciones o alergias alimentarias** (para Parte 2)
9. **¿Tienes pulsómetro o reloj con GPS?** Esto afecta cómo medimos las zonas de cardio en natación e hiking

Una vez que respondas estas preguntas, continuamos con las stories pendientes empezando por el perfil de usuario y las métricas de progreso.

---

## Reglas de Trabajo para Esta Sesión

- Siempre revisa `docs/EPICS_AND_STORIES.md` antes de implementar algo para marcar la story correcta
- Modifica solo los archivos necesarios para cada story
- Cuando termines una story, actualiza su estado en el documento de epics
- No cambies la arquitectura de archivos sin consultarme
- El plan nutricional (Epics 5) se trabaja por separado cuando yo confirme que tengo listas las restricciones

---

## Archivos del Proyecto

Todos los archivos están en la carpeta `fitness-tracker/`. Si necesitas ver alguno, pídelo y te lo muestro.

---

## Perfil Nutricional (Parte 2 — Completada)

### Diagnóstico médico nutricional
- **Hígado graso** (esteatosis hepática) — ALT 99 U/L (normal <50), AST 58 U/L
- **Alcalosis pancreática** — Amilasa 111 U/L (ligeramente fuera de rango)
- **Triglicéridos altos** — 205 mg/dL (normal <150)
- **VLDL alto** — 41 mg/dL (normal 6-30)
- **IgE alta** — 252 UI/mL (normal <87) — posibles sensibilidades alimentarias
- **Grupo sanguíneo O+**

### Lo que el usuario EVITA (no sugerir nunca)
Azúcar refinada · Harina de trigo · Refrescos · Alcohol · Café · Grasas trans · Ultra-procesados · Exceso de proteína animal

### Marco del plan nutricional
Basado en: **Antidieta (Harvey Diamond) + Medicina Natural (Lezaeta) + estudios de enero 2026**
Adaptado a: ingredientes de México, cocina local

### Reglas de combinación (Antidieta)
- Fruta SIEMPRE sola, nunca con proteína ni almidón
- No mezclar proteína animal + almidón en la misma comida
- Verduras van con todo
- Última comida antes de las 8 PM

### Estructura diaria simplificada
1. Al despertar: agua con limón (obligatorio)
2. Desayuno 9:30-11 AM: proteína+verdura / fruta sola / jugo verde+snack
3. Comida 2 PM: 100ml jugo de apio antes → proteína 150g + ½ plato verduras + guarnición hepática
4. Cena 7-8 PM: ligera, sin proteína animal si ya hubo en comida
5. Té hepático en cena (alternando): orégano / manzanilla con jengibre / jamaica

### Hidratación
- 2.5L agua natural diario
- Sem 1-4: 1L agua de sandía
- Sem 5-8: 500ml jamaica + 500ml piña
- Durante ejercicio: agua natural + pizca sal + miel + betabel

### Archivos de referencia
- `docs/NUTRICION_REPORTE.md` — análisis completo con justificación médica
- `docs/NUTRICION_GUIA_APP.md` — estructuras de datos e implementación
- `js/nutrition.js` (PENDIENTE) — constante NUTRITION_PLAN
