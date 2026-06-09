import { useState, useMemo } from 'react'
import { Plus, X, PencilSimple, Check, CaretDown, CaretRight, CalendarBlank,
         ListChecks, LinkSimple, ChartLine, Trophy, Trash } from '@phosphor-icons/react'
import {
  getObjectives, addObjective, updateObjective, deleteObjective,
  AMBITOS, getAmbito, getHabits, getHealthLog, addAchievement,
} from '../store'
import { getAmbitoIcon } from '../ambitoIcons'

const PLAZOS = {
  corto:   { label: 'Corto plazo',   desc: '< 3 meses' },
  mediano: { label: 'Mediano plazo', desc: '3-12 meses' },
  largo:   { label: 'Largo plazo',   desc: '> 1 año'   },
}

const METRIC_TYPES = [
  { k: 'weight', label: 'Peso (kg)',       field: 'weight' },
  { k: 'water',  label: 'Agua (vasos/día)',field: 'water'  },
  { k: 'sleep',  label: 'Sueño (hrs/día)', field: 'sleep'  },
  { k: 'steps',  label: 'Pasos/día',       field: 'steps'  },
]

// ── Calcula el progreso real de un objetivo ────────────────────────────────
function calcProgress(obj, habits, healthLog) {
  // 1. Sub-tareas: si tiene checklist → progress = % completadas
  if (obj.tasks?.length) {
    const done = obj.tasks.filter(t => t.done).length
    return Math.round((done / obj.tasks.length) * 100)
  }
  // 2. Vinculado a hábito: % de días completados desde creación hasta hoy
  if (obj.linkedHabitId) {
    const habit = habits.find(h => h.id === obj.linkedHabitId)
    if (habit && obj.habitTarget) {
      const count = habit.completedDays?.length || 0
      return Math.min(100, Math.round((count / obj.habitTarget) * 100))
    }
  }
  // 3. Vinculado a métrica de salud
  if (obj.metric?.type && obj.metric?.target) {
    const mt = METRIC_TYPES.find(m => m.k === obj.metric.type)
    if (mt) {
      const recent = healthLog.slice(-7)
      const avg = recent.length
        ? recent.reduce((s, e) => s + (Number(e[mt.field]) || 0), 0) / recent.length
        : 0
      // Para peso: progreso = qué tan cerca está del objetivo
      if (obj.metric.type === 'weight' && obj.metric.start) {
        const total = Math.abs(obj.metric.start - obj.metric.target)
        const current = Math.abs(avg - obj.metric.target)
        return total > 0 ? Math.min(100, Math.round(((total - current) / total) * 100)) : 0
      }
      return Math.min(100, Math.round((avg / obj.metric.target) * 100))
    }
  }
  // 4. Manual
  return obj.progress || 0
}

// ── Ring de progreso ───────────────────────────────────────────────────────
function Ring({ pct, color, size = 44 }) {
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#242424" strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s', opacity: 0.85 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold"
        style={{ color }}>{pct}%</span>
    </div>
  )
}

// ── Fila de objetivo ───────────────────────────────────────────────────────
function ObjectiveRow({ obj, ambito, habits, healthLog, onUpdate, onDelete, onComplete }) {
  const [expanded, setExpanded] = useState(false)
  const [editingManual, setEditingManual] = useState(false)
  const [manualVal, setManualVal] = useState(obj.progress)
  const [newTask, setNewTask] = useState('')

  const isAuto = !!(obj.tasks?.length || obj.linkedHabitId || obj.metric?.type)
  const pct = calcProgress(obj, habits, healthLog)

  const daysLeft = obj.dueDate
    ? Math.ceil((new Date(obj.dueDate) - new Date()) / 86400000)
    : null
  const isOverdue = daysLeft !== null && daysLeft < 0

  // Auto-detectar si llegó al 100%
  const isComplete = pct >= 100

  const toggleTask = (tid) => {
    const tasks = obj.tasks.map(t => t.id === tid ? { ...t, done: !t.done } : t)
    onUpdate(obj.id, { tasks })
  }

  const addTask = () => {
    if (!newTask.trim()) return
    const tasks = [...(obj.tasks || []), { id: Date.now().toString(), text: newTask.trim(), done: false }]
    onUpdate(obj.id, { tasks })
    setNewTask('')
  }

  const removeTask = (tid) => {
    const tasks = obj.tasks.filter(t => t.id !== tid)
    onUpdate(obj.id, { tasks })
  }

  const saveManual = () => {
    onUpdate(obj.id, { progress: Number(manualVal) })
    setEditingManual(false)
  }

  // Badge del tipo de tracking
  const trackBadge = obj.tasks?.length
    ? { icon: ListChecks, label: `${obj.tasks.filter(t=>t.done).length}/${obj.tasks.length} tareas` }
    : obj.linkedHabitId
    ? { icon: LinkSimple, label: habits.find(h=>h.id===obj.linkedHabitId)?.name || 'Hábito' }
    : obj.metric?.type
    ? { icon: ChartLine, label: METRIC_TYPES.find(m=>m.k===obj.metric.type)?.label || 'Métrica' }
    : null

  return (
    <div className={`border rounded-xl transition-colors relative ${isComplete ? 'border-green-500/30' : 'border-border hover:border-border-2'}`}
      style={isComplete ? { backgroundColor: '#0d1a0f' } : {}}>

      {/* Header de la fila */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Ring pct={pct} color={isComplete ? '#4ade80' : ambito.color}/>

          <div className="flex-1 min-w-0">
            {/* Tags */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="tag" style={{ backgroundColor: ambito.color+'18', color: ambito.color+'cc' }}>{ambito.name}</span>
              <span className="tag bg-white/4 text-lo">{PLAZOS[obj.plazo]?.label || 'Mediano'}</span>
              {trackBadge && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor:'#2cb99a15', color:'#2cb99a' }}>
                  <trackBadge.icon size={8}/>{trackBadge.label}
                </span>
              )}
              {daysLeft !== null && (
                <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-500/70' : daysLeft < 14 ? 'text-amber-500/70' : 'text-lo'}`}>
                  <CalendarBlank size={9}/>
                  {isOverdue ? 'Vencido' : daysLeft === 0 ? 'Hoy' : `${daysLeft}d`}
                </span>
              )}
              {isComplete && (
                <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                  <Check size={9} weight="bold"/> Completado
                </span>
              )}
            </div>

            <h3 className="text-[14px] font-medium text-hi mb-1 leading-snug">{obj.title}</h3>
            {obj.description && <p className="text-[12px] text-lo leading-relaxed mb-2">{obj.description}</p>}

            {/* Barra de progreso + acciones */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[2px] bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${pct}%`, backgroundColor: isComplete ? '#4ade80' : ambito.color, opacity:0.75 }}/>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isAuto && (
                  <button onClick={()=>setEditingManual(v=>!v)}
                    className="text-[11px] text-lo hover:text-mid flex items-center gap-1 transition-colors">
                    <PencilSimple size={10}/> editar
                  </button>
                )}
                <button onClick={()=>setExpanded(v=>!v)}
                  className="text-[11px] text-lo hover:text-mid flex items-center gap-1 transition-colors">
                  {expanded ? <CaretDown size={10}/> : <CaretRight size={10}/>} detalle
                </button>
                {isComplete && (
                  <button onClick={()=>onComplete(obj)}
                    className="text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all"
                    style={{ backgroundColor:'#4ade8020', color:'#4ade80', border:'1px solid #4ade8040' }}>
                    <Trophy size={10} weight="fill"/> Logro
                  </button>
                )}
                <button onClick={()=>onDelete(obj.id)}
                  className="text-lo hover:text-red-400 transition-colors ml-1">
                  <X size={12}/>
                </button>
              </div>
            </div>

            {/* Editor manual */}
            {editingManual && !isAuto && (
              <div className="flex items-center gap-2 mt-2">
                <input type="range" min={0} max={100} value={manualVal}
                  onChange={e=>setManualVal(e.target.value)} className="flex-1"/>
                <span className="text-[11px] font-mono text-accent w-8">{manualVal}%</span>
                <button onClick={saveManual} className="btn-primary py-1 px-2 text-[10px]">OK</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">

          {/* ── Checklist de tareas ── */}
          {(obj.tasks?.length > 0 || true) && (
            <div>
              <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-2">Sub-tareas</p>
              <div className="space-y-1.5">
                {(obj.tasks || []).map(t => (
                  <div key={t.id} className="flex items-center gap-2 group">
                    <button onClick={()=>toggleTask(t.id)}
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                      style={{ backgroundColor: t.done ? ambito.color : 'transparent',
                               border: `1.5px solid ${t.done ? ambito.color : '#333'}` }}>
                      {t.done && <Check size={9} weight="bold" color="#000"/>}
                    </button>
                    <span className={`flex-1 text-[12px] ${t.done ? 'line-through text-lo' : 'text-mid'}`}>{t.text}</span>
                    <button onClick={()=>removeTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                      <Trash size={10}/>
                    </button>
                  </div>
                ))}
                {/* Input nueva tarea */}
                <div className="flex gap-2 mt-2">
                  <input
                    className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] outline-none"
                    style={{ backgroundColor:'#111', border:'1px solid #242424', color:'#ccc' }}
                    placeholder="Nueva sub-tarea..."
                    value={newTask} onChange={e=>setNewTask(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&addTask()}
                  />
                  <button onClick={addTask}
                    className="px-2 py-1.5 rounded-lg text-[11px] transition-all"
                    style={{ backgroundColor: newTask.trim() ? ambito.color+'22':'#111',
                             border:`1px solid ${newTask.trim()?ambito.color+'40':'#242424'}`,
                             color: newTask.trim() ? ambito.color : '#444' }}>
                    <Plus size={11} weight="bold"/>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Info hábito vinculado ── */}
          {obj.linkedHabitId && (() => {
            const h = habits.find(x=>x.id===obj.linkedHabitId)
            if (!h) return null
            const count = h.completedDays?.length || 0
            return (
              <div className="rounded-xl p-3" style={{ backgroundColor: ambito.color+'0a', border:`1px solid ${ambito.color}20` }}>
                <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-1.5">Hábito vinculado</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-hi">{h.emoji} {h.name}</span>
                  <span className="text-[12px] font-mono" style={{ color: ambito.color }}>
                    {count} / {obj.habitTarget} días
                  </span>
                </div>
              </div>
            )
          })()}

          {/* ── Info métrica ── */}
          {obj.metric?.type && (() => {
            const mt = METRIC_TYPES.find(m=>m.k===obj.metric.type)
            if (!mt) return null
            const recent = healthLog.slice(-7)
            const avg = recent.length
              ? (recent.reduce((s,e)=>s+(Number(e[mt.field])||0),0)/recent.length).toFixed(1)
              : '—'
            return (
              <div className="rounded-xl p-3" style={{ backgroundColor:'#2cb99a0a', border:'1px solid #2cb99a20' }}>
                <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-1.5">Métrica vinculada</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-hi">{mt.label}</span>
                  <span className="text-[12px] font-mono text-accent">
                    Promedio 7d: {avg} → meta: {obj.metric.target}
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ── Sección por ámbito ─────────────────────────────────────────────────────
function AmbitoSection({ ambito, objectives, habits, healthLog, onUpdate, onDelete, onComplete }) {
  const [open, setOpen] = useState(true)
  const avgPct = objectives.length
    ? Math.round(objectives.reduce((a,o)=>a+calcProgress(o,habits,healthLog),0)/objectives.length)
    : 0
  const Ic = getAmbitoIcon(ambito.id)
  return (
    <div className="card mb-3">
      <button onClick={()=>setOpen(v=>!v)} className="w-full flex items-center gap-3 text-left">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: ambito.color+'18' }}>
          <Ic size={14} style={{ color: ambito.color }}/>
        </div>
        <span className="text-[13px] font-medium text-hi flex-1">{ambito.name}</span>
        <span className="text-[11px] text-lo font-mono">{objectives.length} obj.</span>
        <div className="w-20 flex items-center gap-1.5">
          <div className="flex-1 h-[2px] bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${avgPct}%`, backgroundColor:ambito.color, opacity:0.75 }}/>
          </div>
          <span className="text-[10px] font-mono text-lo w-7">{avgPct}%</span>
        </div>
        {open ? <CaretDown size={13} className="text-lo shrink-0"/> : <CaretRight size={13} className="text-lo shrink-0"/>}
      </button>
      {open && (
        <div className="mt-3 border-t border-border pt-3 space-y-2">
          {objectives.map(o => (
            <ObjectiveRow key={o.id} obj={o} ambito={ambito} habits={habits} healthLog={healthLog}
              onUpdate={onUpdate} onDelete={onDelete} onComplete={onComplete}/>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal nuevo objetivo ───────────────────────────────────────────────────
function AddModal({ onSave, onClose }) {
  const habits = getHabits()
  const [step, setStep]     = useState(0) // 0=básico, 1=tracking
  const [showDesc, setShowDesc] = useState(false)
  const [form, setForm] = useState({
    title:'', ambitoId: AMBITOS[0].id, plazo:'mediano', dueDate:'', description:'',
    trackType: 'manual', // 'manual'|'tasks'|'habit'|'metric'
    linkedHabitId:'', habitTarget:30,
    metric:{ type:'water', target:8, start:'' },
    tasks:[],
  })
  const [newTask, setNewTask] = useState('')

  const addTask = () => {
    if (!newTask.trim()) return
    setForm(f=>({...f, tasks:[...f.tasks,{id:Date.now().toString(),text:newTask.trim(),done:false}]}))
    setNewTask('')
  }
  const removeTask = id => setForm(f=>({...f, tasks:f.tasks.filter(t=>t.id!==id)}))

  const handleSave = () => {
    if (!form.title.trim()) return
    const obj = {
      title: form.title, ambitoId: form.ambitoId, plazo: form.plazo,
      dueDate: form.dueDate, description: form.description,
    }
    if (form.trackType === 'tasks' && form.tasks.length) obj.tasks = form.tasks
    if (form.trackType === 'habit' && form.linkedHabitId) {
      obj.linkedHabitId = form.linkedHabitId
      obj.habitTarget   = Number(form.habitTarget)
    }
    if (form.trackType === 'metric') {
      obj.metric = { type: form.metric.type, target: Number(form.metric.target), start: form.metric.start }
    }
    onSave(obj)
  }

  const selAmb = AMBITOS.find(a=>a.id===form.ambitoId)

  return (
    <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}>
      <div className="bg-card border border-border-2 rounded-2xl w-[460px] shadow-2xl flex flex-col"
        style={{maxHeight:'88vh'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-hi">Nueva meta</h2>
            <div className="flex gap-1">
              {['Info','Tracking'].map((l,i)=>(
                <button key={i} onClick={()=>setStep(i)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${step===i?'bg-accent/20 text-accent':'text-lo'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={15}/></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">

          {step === 0 && <>
            {/* Título */}
            <div>
              <span className="field-label">Título</span>
              <input className="field-input" autoFocus placeholder="Ej: Aprobar el examen final"
                value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                onKeyDown={e=>e.key==='Enter'&&setStep(1)}/>
            </div>

            {/* Descripción toggle */}
            {showDesc ? (
              <div>
                <span className="field-label">Descripción</span>
                <textarea className="field-input resize-none" rows={2} placeholder="Contexto o pasos..."
                  value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              </div>
            ) : (
              <button onClick={()=>setShowDesc(true)}
                className="text-[11px] text-lo hover:text-mid flex items-center gap-1">
                <Plus size={10}/> Agregar descripción
              </button>
            )}

            {/* Ámbito */}
            <div>
              <span className="field-label">Ámbito</span>
              <div className="grid grid-cols-5 gap-1 mt-1">
                {AMBITOS.map(a=>{
                  const Ic=getAmbitoIcon(a.id); const sel=form.ambitoId===a.id
                  return (
                    <button key={a.id} onClick={()=>setForm(f=>({...f,ambitoId:a.id}))}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] transition-all"
                      style={sel?{backgroundColor:a.color+'22',color:a.color,border:`1px solid ${a.color}44`}
                               :{backgroundColor:'#111',border:'1px solid #1e1e1e',color:'#666'}}>
                      <Ic size={14} weight={sel?'fill':'regular'} style={{color:sel?a.color:'#555'}}/>
                      <span className="leading-tight text-center">{a.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Plazo + Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="field-label">Plazo</span>
                <div className="flex gap-1 mt-1">
                  {Object.entries(PLAZOS).map(([k,v])=>(
                    <button key={k} onClick={()=>setForm(f=>({...f,plazo:k}))}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] transition-all ${form.plazo===k?'bg-white/10 text-hi font-medium':'text-lo hover:bg-white/5'}`}>
                      {v.desc}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="field-label">Fecha límite</span>
                <input type="date" className="field-input" value={form.dueDate}
                  onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
              </div>
            </div>
          </>}

          {step === 1 && <>
            {/* Tipo de tracking */}
            <div>
              <span className="field-label">¿Cómo medir el progreso?</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { k:'manual',  icon:PencilSimple, label:'Manual',        desc:'Tú actualizas el %' },
                  { k:'tasks',   icon:ListChecks,   label:'Sub-tareas',     desc:'Checklist automático' },
                  { k:'habit',   icon:LinkSimple,   label:'Hábito',         desc:'Vincula a un hábito' },
                  { k:'metric',  icon:ChartLine,    label:'Métrica salud',  desc:'Agua, peso, sueño...' },
                ].map(({k,icon:Icon,label,desc})=>(
                  <button key={k} onClick={()=>setForm(f=>({...f,trackType:k}))}
                    className="flex items-start gap-2 p-3 rounded-xl text-left transition-all"
                    style={form.trackType===k
                      ?{backgroundColor:selAmb.color+'18',border:`1px solid ${selAmb.color}40`}
                      :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a'}}>
                    <Icon size={14} weight={form.trackType===k?'fill':'regular'}
                      style={{color:form.trackType===k?selAmb.color:'#555',marginTop:1}}/>
                    <div>
                      <p className="text-[12px] font-semibold" style={{color:form.trackType===k?selAmb.color:'#aaa'}}>{label}</p>
                      <p className="text-[10px] text-lo">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tareas */}
            {form.trackType === 'tasks' && (
              <div>
                <span className="field-label">Sub-tareas</span>
                <div className="space-y-1.5 mt-1">
                  {form.tasks.map(t=>(
                    <div key={t.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded border border-border shrink-0"/>
                      <span className="flex-1 text-[12px] text-mid">{t.text}</span>
                      <button onClick={()=>removeTask(t.id)} className="text-lo hover:text-red-400"><Trash size={11}/></button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    <input className="flex-1 field-input py-1.5 text-[12px]" placeholder="Nueva tarea..."
                      value={newTask} onChange={e=>setNewTask(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&addTask()}/>
                    <button onClick={addTask} className="btn-primary px-3 py-1.5 text-[11px]">
                      <Plus size={11} weight="bold"/>
                    </button>
                  </div>
                </div>
                {form.tasks.length > 0 && (
                  <p className="text-[11px] text-lo mt-1">El progreso se calculará automáticamente ({form.tasks.length} tareas)</p>
                )}
              </div>
            )}

            {/* Hábito */}
            {form.trackType === 'habit' && (
              <div className="space-y-3">
                <div>
                  <span className="field-label">Hábito</span>
                  <select className="field-input mt-1"
                    value={form.linkedHabitId}
                    onChange={e=>setForm(f=>({...f,linkedHabitId:e.target.value}))}>
                    <option value="">— Selecciona un hábito —</option>
                    {habits.map(h=>(
                      <option key={h.id} value={h.id}>{h.emoji} {h.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="field-label">Meta de días a completar</span>
                  <input type="number" className="field-input mt-1" min={1} max={365}
                    value={form.habitTarget}
                    onChange={e=>setForm(f=>({...f,habitTarget:e.target.value}))}
                    placeholder="30"/>
                  <p className="text-[11px] text-lo mt-1">
                    Progreso = días completados / {form.habitTarget} días
                  </p>
                </div>
              </div>
            )}

            {/* Métrica */}
            {form.trackType === 'metric' && (
              <div className="space-y-3">
                <div>
                  <span className="field-label">Métrica</span>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {METRIC_TYPES.map(m=>(
                      <button key={m.k} onClick={()=>setForm(f=>({...f,metric:{...f.metric,type:m.k}}))}
                        className="px-3 py-2 rounded-lg text-[12px] text-left transition-all"
                        style={form.metric.type===m.k
                          ?{backgroundColor:'#2cb99a18',color:'#2cb99a',border:'1px solid #2cb99a40'}
                          :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#666'}}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                {form.metric.type === 'weight' && (
                  <div>
                    <span className="field-label">Peso actual (kg)</span>
                    <input type="number" className="field-input mt-1" placeholder="Ej: 85"
                      value={form.metric.start}
                      onChange={e=>setForm(f=>({...f,metric:{...f.metric,start:e.target.value}}))}/>
                  </div>
                )}
                <div>
                  <span className="field-label">
                    {form.metric.type === 'weight' ? 'Peso objetivo (kg)' : 'Meta diaria'}
                  </span>
                  <input type="number" className="field-input mt-1"
                    placeholder={form.metric.type==='weight'?'Ej: 75':'Ej: 8'}
                    value={form.metric.target}
                    onChange={e=>setForm(f=>({...f,metric:{...f.metric,target:e.target.value}}))}/>
                  <p className="text-[11px] text-lo mt-1">
                    Progreso basado en promedio de los últimos 7 días vs meta
                  </p>
                </div>
              </div>
            )}
          </>}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3.5 border-t border-border shrink-0">
          {step === 0
            ? <><button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
                <button className="btn-primary flex-1" onClick={()=>form.title.trim()&&setStep(1)}>Siguiente →</button></>
            : <><button className="btn-ghost flex-1" onClick={()=>setStep(0)}>← Volver</button>
                <button className="btn-primary flex-1" onClick={handleSave}>Guardar objetivo</button></>
          }
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────
export default function Objetivos() {
  const [objectives, setObjectives] = useState(getObjectives)
  const [showAdd,    setShowAdd]    = useState(false)
  const habits    = useMemo(() => getHabits(),    [])
  const healthLog = useMemo(() => getHealthLog(), [])

  const handleSave   = (data) => { setObjectives(addObjective(data)); setShowAdd(false) }
  const handleUpdate = (id, changes) => setObjectives(updateObjective(id, changes))
  const handleDelete = id => setObjectives(deleteObjective(id))

  // Al completar → guardar en Logros automáticamente
  const handleComplete = (obj) => {
    const ambito = getAmbito(obj.ambitoId)
    addAchievement({
      title:       obj.title,
      description: obj.description || `Objetivo completado al 100%`,
      ambitoId:    obj.ambitoId,
      icon:        'trophy',
    })
    handleDelete(obj.id)
    alert(``)
  }

  const groups = AMBITOS
    .map(a => ({ ambito: a, objectives: objectives.filter(o => o.ambitoId === a.id) }))
    .filter(g => g.objectives.length > 0)

  const avgAll = objectives.length
    ? Math.round(objectives.reduce((s,o)=>s+calcProgress(o,habits,healthLog),0)/objectives.length)
    : 0

  return (
    <div className="p-3 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-hi">Objetivos</h1>
          <p className="text-[13px] text-lo mt-0.5">Metas organizadas por ámbito de vida</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={()=>setShowAdd(true)}>
          <Plus size={14} weight="bold"/> Nueva meta
        </button>
      </div>

      {/* Resumen */}
      {objectives.length > 0 && (
        <div className="card mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] text-lo">{objectives.length} objetivos activos</span>
              <span className="text-[13px] font-mono text-accent">{avgAll}%</span>
            </div>
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width:`${avgAll}%`, opacity:0.8 }}/>
            </div>
          </div>
          <div className="flex gap-3 shrink-0 text-[11px] text-lo">
            {['corto','mediano','largo'].map(p=>(
              <span key={p}>
                <span className="text-mid font-medium">{objectives.filter(o=>o.plazo===p).length}</span> {PLAZOS[p].label.split(' ')[0].toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-lo text-[13px] mb-3">Crea tu primer objetivo.</p>
          <button className="btn-primary" onClick={()=>setShowAdd(true)}>
            <Plus size={14} weight="bold" className="inline mr-1"/> Agregar objetivo
          </button>
        </div>
      ) : (
        groups.map(({ambito, objectives:ao})=>(
          <AmbitoSection key={ambito.id} ambito={ambito} objectives={ao}
            habits={habits} healthLog={healthLog}
            onUpdate={handleUpdate} onDelete={handleDelete} onComplete={handleComplete}/>
        ))
      )}

      {showAdd && <AddModal onSave={handleSave} onClose={()=>setShowAdd(false)}/>}
    </div>
  )
}
