const NUTRITION_PLAN = {
  daily_rituals: [
    { id: 'nc_lemon_water',  name: 'Agua con limón en ayunas',         emoji: '🍋', mandatory: true  },
    { id: 'nc_apio',         name: 'Jugo de apio pre-comida (100ml)',   emoji: '🥬', mandatory: false },
    { id: 'nc_veggies',      name: '½ plato de verduras en comida',     emoji: '🥦', mandatory: true  },
    { id: 'nc_hepatic_food', name: 'Alimento hepático incluido',        emoji: '🫀', mandatory: false },
    { id: 'nc_tea',          name: 'Té hepático en cena',               emoji: '🫖', mandatory: false },
    { id: 'nc_hydration',    name: '2.5L de agua completados',          emoji: '💧', mandatory: true  },
    { id: 'nc_no_refined',   name: 'Sin azúcar/harina refinada',        emoji: '✅', mandatory: true  }
  ],
  meals: {
    '0':   { protein_g: 115, notes: 'Recuperación lumbar. Digestión prioritaria.',
              pre: 'Fruta + nueces (90 min antes)', post: 'Yogurt griego + plátano (45 min después)' },
    '1.1': { protein_g: 140, notes: 'Box añadido. Pre-entreno con carbohidrato simple.',
              pre: 'Plátano + 2 nueces (60 min antes de box)', post: 'Licuado vegetal o yogurt + plátano' },
    '2':   { protein_g: 155, notes: 'BJJ 3x/sem. Cena muy ligera post-BJJ.',
              pre: 'Plátano + 2 huevos (BJJ) / Tostada aguacate (Box)', post: 'Caldo + fruta o yogurt (post-BJJ)' }
  },
  breakfast_categories: {
    protein_veg: {
      label: 'Proteína + Verdura', emoji: '🥚',
      best_for: ['gym_a','gym_b','gym_c','bjj','box'],
      options: [
        'Omelette de espinaca + queso panela + aguacate',
        '2 huevos + nopales + aguacate',
        'Espinacas salteadas + queso panela + 2 huevos'
      ],
      rule: 'Sin tortilla a menos que el entrenamiento sea intenso.'
    },
    fruit_only: {
      label: 'Fruta Sola', emoji: '🍉',
      best_for: ['swim_soft','rest','flex_am','mob_am'],
      options: ['Papaya madura (enzimas digestivas)','Sandía o melón','Mango natural','Piña natural sola'],
      rule: 'NUNCA combinar con proteína. ≥2h de separación.'
    },
    green_juice: {
      label: 'Jugo Verde + Snack', emoji: '🥗',
      best_for: ['swim_medium','hiking','kb'],
      options: [
        'Jugo (espinaca+apio+nopal+pepino+limón) + nueces',
        'Jugo verde + 1 tostada con aguacate'
      ],
      rule: 'No añadir piña/mango al jugo verde.'
    }
  },
  weekly_targets: {
    fish:  { target: 3, label: '🐟 Pescado graso' },
    fruit: { target: 3, label: '🍉 Fruta sola'    },
    liver: { target: 5, label: '🫀 Alimento hepático' }
  },
  biomarkers_baseline: [
    { id: 'alt',          name: 'ALT/TGP',       baseline: 99,  goal: 50,  unit: 'U/L',   dir: 'down' },
    { id: 'triglycerides',name: 'Triglicéridos',  baseline: 205, goal: 150, unit: 'mg/dL', dir: 'down' },
    { id: 'vldl',         name: 'VLDL',           baseline: 41,  goal: 30,  unit: 'mg/dL', dir: 'down' },
    { id: 'hdl',          name: 'HDL',            baseline: 48,  goal: 60,  unit: 'mg/dL', dir: 'up'   },
    { id: 'ige',          name: 'IgE',            baseline: 252, goal: 120, unit: 'UI/mL', dir: 'down' },
    { id: 'ldl',          name: 'LDL',            baseline: 107, goal: 100, unit: 'mg/dL', dir: 'down' }
  ]
};

function getBreakfastSuggestion(dayActivities) {
  if (!dayActivities || dayActivities.length === 0) return 'green_juice';
  var types = dayActivities.map(function(a) { return a.type; });
  if (types.indexOf('gym') >= 0 || types.indexOf('bjj') >= 0 || types.indexOf('box') >= 0) return 'protein_veg';
  if (types.indexOf('swim') >= 0 || types.indexOf('kb') >= 0 || types.indexOf('hiking') >= 0) return 'green_juice';
  return 'fruit_only';
}
