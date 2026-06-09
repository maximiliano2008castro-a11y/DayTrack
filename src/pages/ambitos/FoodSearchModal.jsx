import { useState, useRef, useEffect } from 'react'
import { X, Plus, MagnifyingGlass, Star, BookmarkSimple, PencilSimple, ClockCounterClockwise, ChefHat } from '@phosphor-icons/react'
import { searchFoods, calcMacros } from '../../data/foodDb'
import { getFoodLibrary, addFoodToLibrary, getMeals, getRecipes } from '../../store'

const MACRO_COLORS = { calories: '#e07c4a', protein: '#5b84e8', carbs: '#c9a227', fat: '#4cae8a' }

// ── FoodCard ──────────────────────────────────────────────────────────────────
function FoodCard({ food, isCustom, ambito, onSelect }) {
  return (
    <button onClick={() => onSelect(food)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-white/5 active:scale-[0.99]"
      style={{ border:'1px solid #1a1a1a', backgroundColor:'#0d0d0d' }}>
      <span className="text-[22px] shrink-0 w-8 text-center leading-none">
        {food.emoji || '🍽'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-hi truncate">{food.name}</p>
          {isCustom && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor:ambito.color+'20', color:ambito.color }}>
              Mío
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px]" style={{ color:MACRO_COLORS.calories }}>{food.per100.calories}kcal</span>
          <span className="text-[10px]" style={{ color:MACRO_COLORS.protein }}>P:{food.per100.protein}g</span>
          <span className="text-[10px]" style={{ color:MACRO_COLORS.carbs }}>C:{food.per100.carbs}g</span>
          <span className="text-[10px]" style={{ color:MACRO_COLORS.fat }}>G:{food.per100.fat}g</span>
          {food.servingUnit && food.servingGrams > 0 ? (
            <span className="text-[10px] text-lo">· 1 {food.servingUnit} = {food.servingGrams}g</span>
          ) : (
            <span className="text-[10px] text-lo">por 100g</span>
          )}
        </div>
      </div>
      <Plus size={14} style={{ color: ambito.color, opacity: 0.6 }} className="shrink-0"/>
    </button>
  )
}

// ── PortionScreen ─────────────────────────────────────────────────────────────
function PortionScreen({ food, ambito, onBack, onConfirm }) {
  const hasServing = food.custom && food.servingUnit && food.servingGrams > 0
  const [mode,  setMode]  = useState(hasServing ? 'serving' : 'grams') // 'grams' | 'serving'
  const [grams, setGrams] = useState(hasServing ? food.servingGrams : 100)
  const [units, setUnits] = useState(1)
  // Editable macros for new (unsaved) foods
  const [editedPer100, setEditedPer100] = useState({ ...food.per100 })
  const [editedEmoji,  setEditedEmoji]  = useState(food.emoji || '🍽')
  const activePer100 = food.isNew ? editedPer100 : food.per100
  const activeFood   = food.isNew ? { ...food, emoji: editedEmoji, per100: activePer100 } : food

  // Total grams based on mode
  const totalGrams = mode === 'grams' ? grams : Math.round(units * food.servingGrams)
  const macros     = calcMacros(activeFood, totalGrams)

  const changeGrams = val => setGrams(Math.max(1, val))
  const changeUnits = val => setUnits(Math.max(0.5, val))

  const GRAM_STEPS    = [50, 100, 150, 200, 250, 300]
  const SERVING_STEPS = [0.5, 1, 1.5, 2, 3, 4]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border shrink-0">
        <button onClick={onBack}
          className="p-2 rounded-xl text-lo hover:text-mid hover:bg-white/5 transition-all text-[16px]">←</button>
        <div className="flex-1">
          {food.isNew ? (
            <div className="flex items-center gap-2">
              <input
                className="w-9 text-center bg-transparent text-[20px] outline-none"
                value={editedEmoji}
                onChange={e => setEditedEmoji(e.target.value)}
              />
              <p className="text-[15px] font-bold text-hi">{food.name}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: ambito.color+'20', color: ambito.color }}>Nuevo</span>
            </div>
          ) : (
            <p className="text-[15px] font-bold text-hi">{activeFood.emoji} {food.name}</p>
          )}
          <p className="text-[11px] text-lo">¿Cuánto vas a comer?</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Editar macros — solo para alimentos nuevos */}
        {food.isNew && (
          <div className="rounded-xl overflow-hidden"
            style={{ border:`1px solid ${ambito.color}40`, backgroundColor: ambito.color+'08' }}>
            <div className="px-3 py-2 border-b border-border flex items-center gap-1.5">
              <PencilSimple size={10} style={{ color: ambito.color }}/>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: ambito.color }}>
                Macros por 100g
              </p>
            </div>
            <div className="grid grid-cols-4 divide-x divide-border">
              {[
                { k:'calories', l:'Kcal',    color: MACRO_COLORS.calories },
                { k:'protein',  l:'Prot',    color: MACRO_COLORS.protein  },
                { k:'carbs',    l:'Carbs',   color: MACRO_COLORS.carbs    },
                { k:'fat',      l:'Grasas',  color: MACRO_COLORS.fat      },
              ].map(({ k, l, color }) => (
                <div key={k} className="flex flex-col items-center py-2 px-1 gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>{l}</span>
                  <input
                    type="number" min={0}
                    className="w-full text-center bg-transparent text-[13px] font-mono font-bold outline-none"
                    placeholder="0"
                    value={editedPer100[k] || ''}
                    onChange={e => setEditedPer100(p => ({ ...p, [k]: Number(e.target.value) || 0 }))}
                    style={{ color }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode toggle — solo si tiene porción personalizada */}
        {hasServing && (
          <div className="flex gap-1 bg-[#111] rounded-xl p-1">
            {[
              { key:'serving', label:`Por ${food.servingUnit}` },
              { key:'grams',   label:'Por gramos' },
            ].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={mode===m.key
                  ? { backgroundColor:ambito.color, color:'#000' }
                  : { color:'#555' }}>
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div>
          {mode === 'serving' && hasServing ? (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => changeUnits(units - 0.5)}
                  className="w-11 h-11 rounded-xl text-[20px] font-bold flex items-center justify-center"
                  style={{ backgroundColor:'#1a1a1a', border:'1px solid #2a2a2a', color:'#666' }}>−</button>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <input type="number" min={0.5} step={0.5}
                    className="field-input w-full text-center text-[28px] font-black font-mono h-14"
                    value={units}
                    onChange={e => changeUnits(Number(e.target.value)||0.5)}
                    style={{ color:ambito.color }}/>
                  <p className="text-[11px] font-semibold" style={{ color:ambito.color+'99' }}>
                    {food.servingUnit}{units !== 1 ? 's' : ''} = {totalGrams}g
                  </p>
                </div>
                <button onClick={() => changeUnits(units + 0.5)}
                  className="w-11 h-11 rounded-xl text-[20px] font-bold flex items-center justify-center"
                  style={{ backgroundColor:'#1a1a1a', border:'1px solid #2a2a2a', color:'#666' }}>+</button>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {SERVING_STEPS.map(u => (
                  <button key={u} onClick={() => setUnits(u)}
                    className="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                    style={units===u
                      ? { backgroundColor:ambito.color+'22', color:ambito.color, border:`1px solid ${ambito.color}44` }
                      : { backgroundColor:'#111', border:'1px solid #1e1e1e', color:'#555' }}>
                    {u} {food.servingUnit}{u!==1?'s':''}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => changeGrams(grams - 10)}
                  className="w-11 h-11 rounded-xl text-[20px] font-bold flex items-center justify-center"
                  style={{ backgroundColor:'#1a1a1a', border:'1px solid #2a2a2a', color:'#666' }}>−</button>
                <div className="flex-1 flex items-center gap-2">
                  <input type="number" min={1} max={2000}
                    className="field-input flex-1 text-center text-[28px] font-black font-mono h-14"
                    value={grams}
                    onChange={e => changeGrams(Number(e.target.value)||1)}
                    style={{ color:ambito.color }}/>
                  <span className="text-[14px] font-bold text-lo shrink-0">g</span>
                </div>
                <button onClick={() => changeGrams(grams + 10)}
                  className="w-11 h-11 rounded-xl text-[20px] font-bold flex items-center justify-center"
                  style={{ backgroundColor:'#1a1a1a', border:'1px solid #2a2a2a', color:'#666' }}>+</button>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {GRAM_STEPS.map(g => (
                  <button key={g} onClick={() => setGrams(g)}
                    className="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                    style={grams===g
                      ? { backgroundColor:ambito.color+'22', color:ambito.color, border:`1px solid ${ambito.color}44` }
                      : { backgroundColor:'#111', border:'1px solid #1e1e1e', color:'#555' }}>
                    {g}g
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Macro preview */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border:`1px solid ${ambito.color}25`, backgroundColor:ambito.color+'06' }}>
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-[11px] font-semibold text-lo uppercase tracking-wider">
              Macros para {totalGrams}g
              {mode==='serving' && hasServing && ` (${units} ${food.servingUnit}${units!==1?'s':''})`}
            </p>
          </div>
          <div className="grid grid-cols-4 divide-x divide-border">
            {[
              { label:'Calorías', val:macros.calories, unit:'kcal', color:MACRO_COLORS.calories },
              { label:'Proteína', val:macros.protein,  unit:'g',    color:MACRO_COLORS.protein  },
              { label:'Carbos',   val:macros.carbs,    unit:'g',    color:MACRO_COLORS.carbs    },
              { label:'Grasas',   val:macros.fat,      unit:'g',    color:MACRO_COLORS.fat      },
            ].map(m => (
              <div key={m.label} className="flex flex-col items-center py-3 px-1">
                <span className="text-[9px] text-lo uppercase tracking-wider text-center leading-tight">{m.label}</span>
                <span className="text-[20px] font-black font-mono leading-none mt-1" style={{ color:m.color }}>{m.val}</span>
                <span className="text-[9px] text-lo">{m.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm */}
      <div className="px-5 py-4 border-t border-border shrink-0 space-y-2">
        {food.isNew && (
          <p className="text-[11px] text-center" style={{ color: ambito.color+'99' }}>
            Se guardará en tu biblioteca con estos macros
          </p>
        )}
        <button onClick={() => onConfirm(activeFood, totalGrams, macros)}
          className="w-full py-4 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ backgroundColor:ambito.color, color:'#000', boxShadow:`0 4px 20px ${ambito.color}50` }}>
          <Plus size={16} weight="bold"/> Agregar a la comida
        </button>
      </div>
    </div>
  )
}

// ── FoodSearchModal ───────────────────────────────────────────────────────────
export default function FoodSearchModal({ planMeal, ambito, onClose, onAdd }) {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState(null)
  const [myFoods,  setMyFoods]  = useState(getFoodLibrary)
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  // Recent foods (last 7 unique by name)
  const recentFoods = (() => {
    const meals = getMeals()
    const seen = new Set(); const list = []
    for (const m of [...meals].reverse()) {
      const key = m.foodId || m.name
      if (!seen.has(key)) { seen.add(key); list.push(m) }
      if (list.length >= 7) break
    }
    return list
  })()

  // Recipes as searchable foods
  const recipes = getRecipes().map(r => ({ ...r, isRecipe: true }))

  const { personal, db } = searchFoods(query, myFoods)
  const matchedRecipes = query.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
    : []
  const hasResults = personal.length > 0 || db.length > 0 || matchedRecipes.length > 0

  const handleConfirm = (food, grams, macros) => {
    let savedFood = food
    if (food.isNew) {
      const { isNew, ...foodData } = food
      const lib = addFoodToLibrary(foodData)
      setMyFoods(lib)
      savedFood = lib[lib.length - 1]
    }
    onAdd({
      name:     `${savedFood.name} (${grams}g)`,
      foodId:   savedFood.id,
      quantity: grams,
      ...macros,
      planId:   planMeal?.id,
      slot:     planMeal?.name,
    })
    onClose()
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/75 z-50 flex items-end backdrop-blur-sm"
      onClick={onClose}>
      <div className="modal-sheet bg-card border border-border-2 rounded-t-3xl w-full max-h-[82vh] flex flex-col"
        style={{ borderTop:`3px solid ${ambito.color}` }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/10"/>
        </div>

        {selected ? (
          <PortionScreen
            food={selected}
            ambito={ambito}
            onBack={() => setSelected(null)}
            onConfirm={handleConfirm}
          />
        ) : (
          <>
            {/* Header */}
            <div className="px-5 pt-2 pb-3 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-[15px] font-bold text-hi">Agregar alimento</h3>
                  {planMeal && (
                    <p className="text-[11px]" style={{ color:ambito.color }}>
                      → {planMeal.name}
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="p-1.5 text-lo hover:text-mid transition-colors">
                  <X size={16}/>
                </button>
              </div>
              {/* Search */}
              <div className="relative">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo pointer-events-none"/>
                <input
                  ref={inputRef}
                  className="field-input pl-9 text-[14px]"
                  placeholder="Buscar alimento... (avena, pollo, huevo...)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}/>
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">

              {/* Recientes — solo cuando no hay búsqueda */}
              {!query.trim() && recentFoods.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-2 flex items-center gap-1.5">
                    <ClockCounterClockwise size={10} style={{ color:ambito.color }}/> Recientes
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {recentFoods.map((m, i) => (
                      <button key={i}
                        onClick={() => {
                          const food = myFoods.find(f => f.id === m.foodId) ||
                            recipes.find(r => r.id === m.foodId) ||
                            { id: m.foodId||m.name, name: m.name.replace(/\s*\(\d+g\)$/,''), emoji:'🍽', per100:{ calories: m.calories||0, protein: m.protein||0, carbs: m.carbs||0, fat: m.fat||0 } }
                          setSelected(food)
                        }}
                        className="text-[11px] px-3 py-1.5 rounded-xl transition-all"
                        style={{ backgroundColor:'#111', border:'1px solid #1e1e1e', color:'#888' }}>
                        {m.name.replace(/\s*\(\d+g\)$/,'')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recetas coincidentes */}
              {matchedRecipes.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-2 flex items-center gap-1.5">
                    <ChefHat size={10} style={{ color:ambito.color }}/> Recetas
                  </p>
                  <div className="space-y-1.5">
                    {matchedRecipes.map(r => (
                      <FoodCard key={r.id} food={r} isCustom ambito={ambito} onSelect={setSelected}/>
                    ))}
                  </div>
                </div>
              )}

              {/* Biblioteca personal */}
              {personal.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-2 flex items-center gap-1.5">
                    <Star size={10} weight="fill" style={{ color:ambito.color }}/> Tu biblioteca
                  </p>
                  <div className="space-y-1.5">
                    {personal.map(f => (
                      <FoodCard key={f.id} food={f} isCustom ambito={ambito} onSelect={setSelected}/>
                    ))}
                  </div>
                </div>
              )}

              {/* Base de datos */}
              {db.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-2 flex items-center gap-1.5">
                    <BookmarkSimple size={10} weight="fill"/> Base de alimentos
                  </p>
                  <div className="space-y-1.5">
                    {db.map(f => (
                      <FoodCard key={f.id} food={f} isCustom={false} ambito={ambito} onSelect={setSelected}/>
                    ))}
                  </div>
                </div>
              )}

              {/* No results + crear nuevo */}
              {!hasResults && query.trim() && (
                <div className="text-center py-6">
                  <p className="text-[13px] text-lo mb-1">No encontramos "{query}"</p>
                  <p className="text-[12px] text-lo mb-4">¿Lo agregamos a tu biblioteca?</p>
                  <button
                    onClick={() => setSelected({
                      id: `custom-${Date.now()}`,
                      name: query.trim(),
                      emoji: '🍽',
                      per100: { calories:0, protein:0, carbs:0, fat:0 },
                      isNew: true,
                    })}
                    className="btn-primary text-[12px] flex items-center gap-1.5 mx-auto">
                    <Plus size={13} weight="bold"/> Crear "{query.trim()}"
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!query.trim() && (
                <div className="text-center py-4">
                  <p className="text-[12px] text-lo">Escribe para buscar entre {'>'}60 alimentos comunes</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
