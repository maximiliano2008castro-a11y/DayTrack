// Base de alimentos con macros por 100g
// { id, name, emoji, per100: { calories, protein, carbs, fat } }

export const FOOD_DB = [
  // ── Cereales y granos ───────────────────────────────────────────────────────
  { id:'g01', name:'Avena',              emoji:'🌾', per100:{ calories:389, protein:17,  carbs:66,  fat:7   }},
  { id:'g02', name:'Arroz blanco cocido',emoji:'🍚', per100:{ calories:130, protein:2.7, carbs:28,  fat:0.3 }},
  { id:'g03', name:'Arroz integral cocido',emoji:'🍚',per100:{calories:123, protein:2.7, carbs:26,  fat:1   }},
  { id:'g04', name:'Tortilla de maíz',   emoji:'🫓', per100:{ calories:218, protein:5.7, carbs:46,  fat:2.5 }},
  { id:'g05', name:'Tortilla de harina', emoji:'🫓', per100:{ calories:306, protein:8,   carbs:54,  fat:7   }},
  { id:'g06', name:'Pan blanco',         emoji:'🍞', per100:{ calories:265, protein:9,   carbs:49,  fat:3.2 }},
  { id:'g07', name:'Pan integral',       emoji:'🍞', per100:{ calories:247, protein:13,  carbs:41,  fat:4.2 }},
  { id:'g08', name:'Pasta cocida',       emoji:'🍝', per100:{ calories:131, protein:5,   carbs:25,  fat:1.1 }},
  { id:'g09', name:'Quinoa cocida',      emoji:'🌾', per100:{ calories:120, protein:4.4, carbs:21,  fat:1.9 }},
  { id:'g10', name:'Papa cocida',        emoji:'🥔', per100:{ calories:87,  protein:1.9, carbs:20,  fat:0.1 }},
  { id:'g11', name:'Camote cocido',      emoji:'🍠', per100:{ calories:90,  protein:2,   carbs:21,  fat:0.1 }},
  { id:'g12', name:'Maíz',              emoji:'🌽', per100:{ calories:86,  protein:3.2, carbs:19,  fat:1.2 }},

  // ── Proteínas animales ──────────────────────────────────────────────────────
  { id:'p01', name:'Pechuga de pollo cocida', emoji:'🍗', per100:{ calories:165, protein:31,  carbs:0,   fat:3.6 }},
  { id:'p02', name:'Muslo de pollo cocido',   emoji:'🍗', per100:{ calories:209, protein:26,  carbs:0,   fat:11  }},
  { id:'p03', name:'Carne molida 80/20',      emoji:'🥩', per100:{ calories:215, protein:26,  carbs:0,   fat:15  }},
  { id:'p04', name:'Bistec de res',           emoji:'🥩', per100:{ calories:271, protein:26,  carbs:0,   fat:17  }},
  { id:'p05', name:'Atún en agua',            emoji:'🐟', per100:{ calories:116, protein:26,  carbs:0,   fat:1   }},
  { id:'p06', name:'Salmón',                  emoji:'🐟', per100:{ calories:208, protein:20,  carbs:0,   fat:13  }},
  { id:'p07', name:'Tilapia',                 emoji:'🐟', per100:{ calories:96,  protein:20,  carbs:0,   fat:2   }},
  { id:'p08', name:'Camarón',                 emoji:'🦐', per100:{ calories:99,  protein:24,  carbs:0,   fat:0.3 }},
  { id:'p09', name:'Huevo entero',            emoji:'🥚', per100:{ calories:155, protein:13,  carbs:1.1, fat:11  }},
  { id:'p10', name:'Clara de huevo',          emoji:'🥚', per100:{ calories:52,  protein:11,  carbs:0.7, fat:0.2 }},
  { id:'p11', name:'Proteína whey (polvo)',   emoji:'💪', per100:{ calories:400, protein:80,  carbs:10,  fat:5   }},

  // ── Leguminosas ─────────────────────────────────────────────────────────────
  { id:'l01', name:'Frijoles negros cocidos', emoji:'🫘', per100:{ calories:132, protein:8.9, carbs:24,  fat:0.5 }},
  { id:'l02', name:'Frijoles pintos cocidos', emoji:'🫘', per100:{ calories:143, protein:9,   carbs:27,  fat:0.5 }},
  { id:'l03', name:'Lentejas cocidas',        emoji:'🫘', per100:{ calories:116, protein:9,   carbs:20,  fat:0.4 }},
  { id:'l04', name:'Garbanzo cocido',         emoji:'🫘', per100:{ calories:164, protein:8.9, carbs:27,  fat:2.6 }},

  // ── Lácteos ─────────────────────────────────────────────────────────────────
  { id:'d01', name:'Leche entera',     emoji:'🥛', per100:{ calories:61,  protein:3.2, carbs:4.8, fat:3.3 }},
  { id:'d02', name:'Leche descremada', emoji:'🥛', per100:{ calories:34,  protein:3.4, carbs:5,   fat:0.1 }},
  { id:'d03', name:'Yogur griego',     emoji:'🥛', per100:{ calories:97,  protein:9,   carbs:3.6, fat:5   }},
  { id:'d04', name:'Yogur natural',    emoji:'🥛', per100:{ calories:59,  protein:3.5, carbs:4.7, fat:3.3 }},
  { id:'d05', name:'Queso cottage',    emoji:'🧀', per100:{ calories:98,  protein:11,  carbs:3.4, fat:4.3 }},
  { id:'d06', name:'Queso Oaxaca',     emoji:'🧀', per100:{ calories:300, protein:22,  carbs:1,   fat:23  }},
  { id:'d07', name:'Queso panela',     emoji:'🧀', per100:{ calories:260, protein:18,  carbs:2,   fat:20  }},

  // ── Frutas ──────────────────────────────────────────────────────────────────
  { id:'fr01', name:'Plátano',   emoji:'🍌', per100:{ calories:89,  protein:1.1, carbs:23,  fat:0.3 }},
  { id:'fr02', name:'Manzana',   emoji:'🍎', per100:{ calories:52,  protein:0.3, carbs:14,  fat:0.2 }},
  { id:'fr03', name:'Naranja',   emoji:'🍊', per100:{ calories:47,  protein:0.9, carbs:12,  fat:0.1 }},
  { id:'fr04', name:'Fresa',     emoji:'🍓', per100:{ calories:32,  protein:0.7, carbs:7.7, fat:0.3 }},
  { id:'fr05', name:'Mango',     emoji:'🥭', per100:{ calories:60,  protein:0.8, carbs:15,  fat:0.4 }},
  { id:'fr06', name:'Sandía',    emoji:'🍉', per100:{ calories:30,  protein:0.6, carbs:7.6, fat:0.2 }},
  { id:'fr07', name:'Aguacate',  emoji:'🥑', per100:{ calories:160, protein:2,   carbs:9,   fat:15  }},
  { id:'fr08', name:'Uvas',      emoji:'🍇', per100:{ calories:69,  protein:0.7, carbs:18,  fat:0.2 }},

  // ── Verduras ────────────────────────────────────────────────────────────────
  { id:'v01', name:'Brócoli',    emoji:'🥦', per100:{ calories:34,  protein:2.8, carbs:7,   fat:0.4 }},
  { id:'v02', name:'Espinaca',   emoji:'🥬', per100:{ calories:23,  protein:2.9, carbs:3.6, fat:0.4 }},
  { id:'v03', name:'Jitomate',   emoji:'🍅', per100:{ calories:18,  protein:0.9, carbs:3.9, fat:0.2 }},
  { id:'v04', name:'Zanahoria',  emoji:'🥕', per100:{ calories:41,  protein:0.9, carbs:10,  fat:0.2 }},
  { id:'v05', name:'Pepino',     emoji:'🥒', per100:{ calories:16,  protein:0.7, carbs:3.6, fat:0.1 }},
  { id:'v06', name:'Cebolla',    emoji:'🧅', per100:{ calories:40,  protein:1.1, carbs:9.3, fat:0.1 }},
  { id:'v07', name:'Calabacita', emoji:'🥬', per100:{ calories:17,  protein:1.2, carbs:3.1, fat:0.3 }},

  // ── Grasas y frutos secos ───────────────────────────────────────────────────
  { id:'fat01', name:'Aceite de oliva',  emoji:'🫒', per100:{ calories:884, protein:0,   carbs:0,   fat:100 }},
  { id:'fat02', name:'Aceite vegetal',   emoji:'🫙', per100:{ calories:884, protein:0,   carbs:0,   fat:100 }},
  { id:'fat03', name:'Mantequilla',      emoji:'🧈', per100:{ calories:717, protein:0.9, carbs:0.1, fat:81  }},
  { id:'fat04', name:'Almendras',        emoji:'🌰', per100:{ calories:579, protein:21,  carbs:22,  fat:50  }},
  { id:'fat05', name:'Nuez de castilla', emoji:'🌰', per100:{ calories:654, protein:15,  carbs:14,  fat:65  }},
  { id:'fat06', name:'Cacahuate',        emoji:'🥜', per100:{ calories:567, protein:26,  carbs:16,  fat:49  }},
  { id:'fat07', name:'Crema de cacahuate', emoji:'🥜', per100:{ calories:588, protein:25, carbs:20, fat:50  }},

  // ── Otros ───────────────────────────────────────────────────────────────────
  { id:'o01', name:'Miel',         emoji:'🍯', per100:{ calories:304, protein:0.3, carbs:82,  fat:0   }},
  { id:'o02', name:'Azúcar',       emoji:'🍬', per100:{ calories:387, protein:0,   carbs:100, fat:0   }},
  { id:'o03', name:'Granola',      emoji:'🥣', per100:{ calories:471, protein:10,  carbs:64,  fat:20  }},
  { id:'o04', name:'Barra proteína',emoji:'🍫',per100:{ calories:200, protein:20,  carbs:22,  fat:6   }},
  { id:'o05', name:'Leche de almendras',emoji:'🥛',per100:{ calories:15, protein:0.6, carbs:0.6, fat:1 }},
  { id:'o06', name:'Jugo de naranja',emoji:'🍊',per100:{ calories:45,  protein:0.7, carbs:10,  fat:0.2 }},
]

// Función de búsqueda
export const searchFoods = (query, personalLib = []) => {
  if (!query.trim()) return { personal: personalLib.slice(0,5), db: FOOD_DB.slice(0,8) }
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const match = f => f.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)
  return {
    personal: personalLib.filter(match),
    db: FOOD_DB.filter(match),
  }
}

// Calcula macros para una cantidad dada
export const calcMacros = (food, grams) => ({
  calories: Math.round(food.per100.calories * grams / 100),
  protein:  Math.round(food.per100.protein  * grams / 100 * 10) / 10,
  carbs:    Math.round(food.per100.carbs    * grams / 100 * 10) / 10,
  fat:      Math.round(food.per100.fat      * grams / 100 * 10) / 10,
})
