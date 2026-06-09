import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Trophy, Star, Rocket, Medal, Lightning, Heart,
         Fire, MagnifyingGlass, Target, Sparkle, Clock } from '@phosphor-icons/react'
import { getAchievements, addAchievement, deleteAchievement,
         AMBITOS, getAmbito, getHabits } from '../store'
import { getAmbitoIcon } from '../ambitoIcons'

// ── Constantes ────────────────────────────────────────────────────────────
const ICONS = { trophy: Trophy, star: Star, rocket: Rocket, medal: Medal, lightning: Lightning, heart: Heart, fire: Fire, sparkle: Sparkle }

const CATS = {
  racha:    { label: 'Racha',    color: '#f97316', icon: Fire,    desc: 'Días consecutivos' },
  objetivo: { label: 'Objetivo', color: '#2cb99a', icon: Target,  desc: 'Meta completada'   },
  hito:     { label: 'Hito',     color: '#a78bfa', icon: Trophy,  desc: 'Momento especial'  },
  personal: { label: 'Personal', color: '#f59e0b', icon: Star,    desc: 'Logro personal'    },
  primero:  { label: 'Primero',  color: '#38bdf8', icon: Rocket,  desc: 'Primera vez'       },
}

// Umbrales de racha para auto-logros
const STREAK_MILESTONES = [
  { days: 3,   icon: 'fire',    label: '3 días seguidos',   cat: 'racha' },
  { days: 7,   icon: 'fire',    label: 'Semana perfecta',   cat: 'racha' },
  { days: 21,  icon: 'medal',   label: '21 días de racha',  cat: 'racha' },
  { days: 30,  icon: 'trophy',  label: '1 mes de racha',    cat: 'racha' },
  { days: 60,  icon: 'trophy',  label: '2 meses de racha',  cat: 'racha' },
  { days: 100, icon: 'sparkle', label: '100 días de racha', cat: 'racha' },
  { days: 365, icon: 'sparkle', label: '1 año de racha',    cat: 'racha' },
]

// ── Calcular racha actual de un hábito ────────────────────────────────────
function calcStreak(habit) {
  const days = [...(habit.completedDays || [])].sort()
  if (!days.length) return 0
  const today = new Date(); today.setHours(0,0,0,0)
  let streak = 0, cur = new Date(today)
  while (true) {
    const ds = cur.toISOString().slice(0,10)
    if (days.includes(ds)) { streak++; cur.setDate(cur.getDate()-1) }
    else break
  }
  return streak
}

// ── Auto-detectar logros de racha nuevos ──────────────────────────────────
function detectStreakAchievements(habits, existing) {
  const newOnes = []
  const existingKeys = new Set(existing.map(a => a.autoKey).filter(Boolean))

  habits.forEach(h => {
    const streak = calcStreak(h)
    STREAK_MILESTONES.forEach(m => {
      const key = `streak_${h.id}_${m.days}`
      if (streak >= m.days && !existingKeys.has(key)) {
        newOnes.push({
          title:       `${h.emoji || '✅'} ${h.name}: ${m.label}`,
          description: `Llevas ${streak} días consecutivos con este hábito.`,
          ambitoId:    h.ambitoId,
          icon:        m.icon,
          cat:         m.cat,
          autoKey:     key,
        })
      }
    })
  })
  return newOnes
}

// ── Tarjeta de logro ──────────────────────────────────────────────────────
function AchCard({ a, onDelete }) {
  const amb   = getAmbito(a.ambitoId)
  const Icon  = ICONS[a.icon] || Star
  const cat   = CATS[a.cat]
  const CatIcon = cat?.icon || Star

  return (
    <div className="group flex items-start gap-3 rounded-2xl p-4 transition-all relative overflow-hidden"
      style={{ backgroundColor: amb.color+'08', border:`1px solid ${amb.color}20` }}>

      {/* Glow de fondo */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background:`radial-gradient(circle at 10% 50%, ${amb.color}08 0%, transparent 70%)` }}/>

      {/* Icono */}
      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center relative z-10"
        style={{ backgroundColor: amb.color+'18', border:`1px solid ${amb.color}30` }}>
        <Icon size={18} style={{ color: amb.color }} weight="fill"/>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: amb.color+'18', color: amb.color+'dd' }}>{amb.name}</span>
          {cat && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: cat.color+'15', color: cat.color }}>
              <CatIcon size={8} weight="fill"/>{cat.label}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-lo ml-auto">
            <Clock size={9}/>{a.date}
          </span>
        </div>
        <h3 className="text-[13px] font-semibold text-hi mb-0.5 leading-snug">{a.title}</h3>
        {a.description && <p className="text-[12px] text-lo leading-relaxed">{a.description}</p>}
      </div>

      {/* Borrar */}
      <button onClick={()=>onDelete(a.id)}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-lo hover:text-red-400 transition-all z-10">
        <X size={11}/>
      </button>
    </div>
  )
}

// ── Modal agregar logro ───────────────────────────────────────────────────
function AddModal({ onSave, onClose }) {
  const [form, setForm] = useState({ title:'', ambitoId: AMBITOS[0].id, description:'', icon:'star', cat:'personal' })

  return (
    <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-card border border-border-2 rounded-2xl w-[440px] shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-hi">Registrar logro</h2>
          <button className="btn-icon" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <span className="field-label">Título</span>
            <input className="field-input" autoFocus placeholder="Ej: Primera app publicada"
              value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&form.title.trim()&&onSave(form)}/>
          </div>
          <div>
            <span className="field-label">Descripción (opcional)</span>
            <textarea className="field-input resize-none" rows={2}
              value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          </div>

          {/* Categoría */}
          <div>
            <span className="field-label">Categoría</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.entries(CATS).map(([k,v])=>{
                const CIcon = v.icon; const sel = form.cat===k
                return (
                  <button key={k} onClick={()=>setForm(f=>({...f,cat:k}))}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                    style={sel?{backgroundColor:v.color+'20',color:v.color,border:`1px solid ${v.color}40`}
                              :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                    <CIcon size={10} weight={sel?'fill':'regular'}/>{v.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ámbito */}
            <div>
              <span className="field-label">Ámbito</span>
              <select className="field-input mt-1" value={form.ambitoId}
                onChange={e=>setForm(f=>({...f,ambitoId:e.target.value}))}>
                {AMBITOS.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            {/* Icono */}
            <div>
              <span className="field-label">Icono</span>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {Object.entries(ICONS).map(([k,Icon])=>(
                  <button key={k} onClick={()=>setForm(f=>({...f,icon:k}))}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${form.icon===k?'bg-accent/20 text-accent':'text-lo hover:bg-white/5'}`}>
                    <Icon size={14} weight="fill"/>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1" onClick={()=>onSave(form)}>Guardar logro</button>
        </div>
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────
export default function Logros() {
  const [achievements, setAchievements] = useState(getAchievements)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter]   = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch]   = useState('')
  const [newBadges, setNewBadges] = useState([])

  // Auto-detectar logros de racha al cargar
  useEffect(() => {
    const habits  = getHabits()
    const current = getAchievements()
    const detected = detectStreakAchievements(habits, current)
    if (detected.length) {
      let updated = current
      detected.forEach(a => { updated = addAchievement(a) })
      setAchievements(updated)
      setNewBadges(detected.map(a => a.title))
      setTimeout(() => setNewBadges([]), 5000)
    }
  }, [])

  const handleSave = (form) => {
    if (!form.title.trim()) return
    setAchievements(addAchievement(form))
    setShowAdd(false)
  }
  const handleDelete = id => setAchievements(deleteAchievement(id))

  // Filtrado
  const filtered = useMemo(() => {
    let list = achievements
    if (filter !== 'all')    list = list.filter(a => a.ambitoId === filter)
    if (catFilter !== 'all') list = list.filter(a => (a.cat||'personal') === catFilter)
    if (search.trim())       list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [achievements, filter, catFilter, search])

  const ambitoCount = AMBITOS
    .map(a => ({ ...a, count: achievements.filter(x => x.ambitoId === a.id).length }))
    .filter(a => a.count > 0)

  const catCount = Object.keys(CATS).map(k => ({
    k, count: achievements.filter(a=>(a.cat||'personal')===k).length
  })).filter(c=>c.count>0)

  // Stats
  const thisMonth = achievements.filter(a => a.date?.slice(0,7) === new Date().toISOString().slice(0,7)).length
  const streak7   = achievements.filter(a => {
    const d = new Date(a.date); const now = new Date()
    return (now - d) / 86400000 <= 7
  }).length

  return (
    <div className="p-3 md:p-6">

      {/* Notificación auto-logros */}
      {newBadges.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {newBadges.map((b,i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
              style={{ backgroundColor:'#1a1a0a', border:'1px solid #f97316aa' }}>
              <Fire size={16} weight="fill" color="#f97316"/>
              <div>
                <p className="text-[11px] font-bold text-amber-400">¡Logro desbloqueado!</p>
                <p className="text-[12px] text-hi">{b}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-hi">Logros</h1>
          <p className="text-[13px] text-lo mt-0.5">Historial de hitos cumplidos</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={()=>setShowAdd(true)}>
          <Plus size={14} weight="bold"/> Registrar logro
        </button>
      </div>

      <div className="grid grid-cols-[1fr_220px] gap-5 items-start">
        <div>

          {/* Búsqueda */}
          <div className="relative mb-3">
            <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
            <input className="field-input pl-8 text-[13px]" placeholder="Buscar logro..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* Filtros por ámbito */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button onClick={()=>setFilter('all')}
              className={`text-[12px] px-3 py-1.5 rounded-lg transition-colors ${filter==='all'?'bg-white/8 text-hi font-medium':'text-lo hover:bg-white/5 hover:text-mid'}`}>
              Todos ({achievements.length})
            </button>
            {ambitoCount.map(a=>(
              <button key={a.id} onClick={()=>setFilter(a.id)}
                className={`text-[12px] px-3 py-1.5 rounded-lg transition-colors`}
                style={filter===a.id?{backgroundColor:a.color+'20',color:a.color}:{color:'#666'}}>
                {a.name} ({a.count})
              </button>
            ))}
          </div>

          {/* Filtros por categoría */}
          {catCount.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button onClick={()=>setCatFilter('all')}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-all ${catFilter==='all'?'bg-white/8 text-mid font-medium':'text-lo'}`}>
                Todas categorías
              </button>
              {catCount.map(({k,count})=>{
                const cat=CATS[k]; const CIcon=cat.icon
                return (
                  <button key={k} onClick={()=>setCatFilter(k)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-all"
                    style={catFilter===k?{backgroundColor:cat.color+'20',color:cat.color,border:`1px solid ${cat.color}30`}
                                        :{color:'#555',border:'1px solid transparent'}}>
                    <CIcon size={9} weight="fill"/>{cat.label} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Lista */}
          {filtered.length === 0 ? (
            <div className="card py-12 text-center">
              <Trophy size={28} className="mx-auto mb-3 text-lo"/>
              <p className="text-lo text-[13px]">
                {search ? 'Sin resultados para esa búsqueda.' : 'Aún no hay logros aquí.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(a=>(
                <AchCard key={a.id} a={a} onDelete={handleDelete}/>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Contador grande */}
          <div className="card text-center py-5">
            <p className="text-[48px] font-bold text-hi leading-none">{achievements.length}</p>
            <p className="text-[12px] text-lo mt-1">logros totales</p>
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-border">
              <div className="text-center">
                <p className="text-[18px] font-bold text-accent">{thisMonth}</p>
                <p className="text-[10px] text-lo">este mes</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold" style={{color:'#f97316'}}>{streak7}</p>
                <p className="text-[10px] text-lo">últimos 7d</p>
              </div>
            </div>
          </div>

          {/* Por categoría */}
          {catCount.length > 0 && (
            <div className="card">
              <p className="section-title mb-3">Por categoría</p>
              <div className="space-y-2">
                {catCount.sort((a,b)=>b.count-a.count).map(({k,count})=>{
                  const cat=CATS[k]; const CIcon=cat.icon
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <CIcon size={11} weight="fill" style={{color:cat.color}}/>
                      <span className="text-[12px] flex-1 text-mid">{cat.label}</span>
                      <div className="w-10 h-[2px] bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{width:`${(count/achievements.length)*100}%`,backgroundColor:cat.color}}/>
                      </div>
                      <span className="text-[11px] font-mono text-lo w-4 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Por ámbito */}
          {ambitoCount.length > 0 && (
            <div className="card">
              <p className="section-title mb-3">Por ámbito</p>
              <div className="space-y-2">
                {ambitoCount.sort((a,b)=>b.count-a.count).map(a=>(
                  <div key={a.id} className="flex items-center gap-2">
                    <span className="text-[12px] flex-1 text-mid">{a.name}</span>
                    <div className="w-12 h-[2px] bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{width:`${(a.count/achievements.length)*100}%`,backgroundColor:a.color,opacity:0.75}}/>
                    </div>
                    <span className="text-[11px] font-mono text-lo w-4 text-right">{a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximos hitos de racha */}
          <div className="card">
            <p className="section-title mb-3">Próximas rachas</p>
            <div className="space-y-2">
              {getHabits().slice(0,4).map(h=>{
                const streak = calcStreak(h)
                if (!streak) return null
                const next = STREAK_MILESTONES.find(m=>m.days>streak)
                if (!next) return null
                const amb = getAmbito(h.ambitoId)
                return (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="text-sm">{h.emoji||'✅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-mid truncate">{h.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex-1 h-[2px] bg-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{width:`${(streak/next.days)*100}%`,backgroundColor:amb.color}}/>
                        </div>
                        <span className="text-[9px] text-lo font-mono shrink-0">
                          {streak}/{next.days}d
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }).filter(Boolean)}
              {getHabits().every(h=>!calcStreak(h)) && (
                <p className="text-[11px] text-lo text-center py-2">Empieza hábitos para ver tus rachas</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAdd && <AddModal onSave={handleSave} onClose={()=>setShowAdd(false)}/>}
    </div>
  )
}
