import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip, Cell, PieChart, Pie, XAxis, CartesianGrid,
} from 'recharts'
import {
  getHabits, toggleHabitDay, addHabit, getObjectives, AMBITOS, getAmbito, getSelectedAmbitos,
  getMeals, addMeal, getDietGoals, getMealPlanWeekly,
  getTodayHealth, saveTodayHealth, getHealthLog,
  getGymSessions, addGymSession, getRutinas, saveWorkout, getTodayWorkout,
  habitDueOn, getTasks, getSocialEvents, getWorkTasks, getTodayMente, getFinanceEntries,
  getQuickNotes, addQuickNote, updateQuickNote, deleteQuickNote,
} from '../store'
import { getAmbitoIcon } from '../ambitoIcons'
import {
  Drop, Barbell, ForkKnife, BookOpen, Users, Brain, Briefcase,
  PiggyBank, ArrowRight, Plus, Fire, Moon, Check, X,
  ChartLine, ChartPie, CaretLeft, CaretRight, ArrowCounterClockwise,
  NotePencil, PushPin, Trash, PencilSimple,
} from '@phosphor-icons/react'
import FoodSearchModal from './ambitos/FoodSearchModal'

// ── helpers ──────────────────────────────────────────────────────────────────
const pad   = n => String(n).padStart(2,'0')
const today = () => { const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const nowT  = () => { const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
const toMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m }
const fmt12 = t => { const [h,m]=t.split(':').map(Number); return `${h%12||12}:${pad(m)} ${h>=12?'PM':'AM'}` }
const DOW   = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']

function habitStreak(habit) {
  let c=0; const d=new Date()
  while(true){
    const ds=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    if(habit.completedDays.includes(ds)){c++;d.setDate(d.getDate()-1)}else break
    if(c>365)break
  }
  return c
}
function hScore(habit,days){ return days.length?Math.round(days.filter(d=>habit.completedDays.includes(d)).length/days.length*100):0 }
function last7(){ return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}) }
function last30(){ return Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}) }

// ── SVG Ring ─────────────────────────────────────────────────────────────────
function Ring({ pct, size=110, stroke=9, color='#2cb99a', label, sublabel, glow=true }) {
  const r = (size-stroke)/2
  const circ = 2*Math.PI*r
  const offset = circ*(1-pct/100)
  return (
    <div className="relative flex items-center justify-center" style={{width:size,height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{transition:'stroke-dashoffset 1s ease'}}/>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-black font-mono leading-none" style={{fontSize:size>90?22:16,color}}>{pct}%</span>
        {label && <span className="text-[9px] font-bold text-mid mt-0.5 text-center leading-tight">{label}</span>}
        {sublabel && <span className="text-[8px] text-lo text-center leading-tight">{sublabel}</span>}
      </div>
    </div>
  )
}

// ── Shared: NoteCard + NoteForm (reutilizados en modal y página) ──────────────
export function NoteCard({ n, onPin, onEdit, onDelete }) {
  const amb = n.ambitoId ? AMBITOS.find(a=>a.id===n.ambitoId) : null
  const AmbIcon = amb ? getAmbitoIcon(amb.id) : null
  const pad = x => String(x).padStart(2,'0')
  const todayDs = (() => { const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` })()
  const dateLabel = n.createdAt===todayDs ? 'Hoy' : n.createdAt

  return (
    <div className="group rounded-2xl px-4 py-3 transition-all"
      style={{
        backgroundColor: n.color+'0a',
        border:`1px solid ${n.pinned ? n.color+'45' : n.color+'22'}`,
      }}>
      <div className="flex items-start gap-2">
        {n.pinned && <PushPin size={10} weight="fill" className="shrink-0 mt-1" style={{color:n.color}}/>}
        <p className="flex-1 text-[13px] leading-relaxed" style={{color:'#d8d8d8', whiteSpace:'pre-wrap'}}>{n.text}</p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {amb && AmbIcon && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
              style={{backgroundColor:amb.color+'15'}}>
              <AmbIcon size={9} weight="fill" style={{color:amb.color}}/>
              <span className="text-[9px] font-semibold" style={{color:amb.color+'cc'}}>{amb.name}</span>
            </div>
          )}
          <span className="text-[10px]" style={{color:n.color+'55'}}>{dateLabel}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={()=>onPin(n.id)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
            style={{backgroundColor:'#1a1a1a', color: n.pinned ? n.color : '#444'}}>
            <PushPin size={10} weight={n.pinned?'fill':'regular'}/>
          </button>
          <button onClick={()=>onEdit(n)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:text-mid"
            style={{backgroundColor:'#1a1a1a', color:'#444'}}>
            <PencilSimple size={10}/>
          </button>
          <button onClick={()=>onDelete(n.id)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:text-red-400"
            style={{backgroundColor:'#1a1a1a', color:'#444'}}>
            <Trash size={10}/>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de Notas Rápidas ────────────────────────────────────────────────────
function NotesModal({ onClose, defaultAmbitoId=null }) {
  const [notes,    setNotes]    = useState(getQuickNotes)
  const [text,     setText]     = useState('')
  const [ambitoId, setAmbitoId] = useState(defaultAmbitoId)
  const [filter,   setFilter]   = useState(defaultAmbitoId || 'all')
  const [editing,  setEditing]  = useState(null)
  const textareaRef = useRef(null)

  const activeAmb = ambitoId ? AMBITOS.find(a=>a.id===ambitoId) : null
  const noteColor = activeAmb ? activeAmb.color : '#c9a227'

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleAdd = () => {
    if (!text.trim()) return
    setNotes(addQuickNote({ text, color: noteColor, ambitoId }))
    setText('')
  }

  const handlePin    = id => { const n=notes.find(x=>x.id===id); setNotes(updateQuickNote(id,{pinned:!n.pinned})) }
  const handleDelete = id => setNotes(deleteQuickNote(id))
  const handleSaveEdit = () => {
    if (!editing?.text.trim()) return
    setNotes(updateQuickNote(editing.id, { text:editing.text, color:editing.color, ambitoId:editing.ambitoId }))
    setEditing(null)
  }

  const filtered = notes
    .filter(n => filter==='all' ? true : filter==='general' ? !n.ambitoId : n.ambitoId===filter)
    .sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0))

  const counts = { all: notes.length, general: notes.filter(n=>!n.ambitoId).length }
  AMBITOS.forEach(a => { counts[a.id] = notes.filter(n=>n.ambitoId===a.id).length })

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-end justify-center z-50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="modal-sheet w-full max-h-[90vh] flex flex-col rounded-t-3xl"
        style={{backgroundColor:'#0d0d0d', border:'1px solid #1e1e1e', borderTop:`3px solid ${noteColor}`}}
        onClick={e=>e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/10"/>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <NotePencil size={16} weight="fill" style={{color:noteColor}}/>
            <h2 className="text-[15px] font-bold text-hi">Notas rápidas</h2>
            {notes.length>0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{backgroundColor:noteColor+'18', color:noteColor}}>{notes.length}</span>}
          </div>
          <button className="btn-icon" onClick={onClose}><X size={14}/></button>
        </div>

        {/* Input nueva nota */}
        <div className="px-5 pt-4 pb-3 border-b border-border shrink-0 space-y-3">
          <textarea ref={textareaRef}
            className="w-full rounded-xl px-3 py-2.5 text-[13px] resize-none outline-none"
            style={{
              backgroundColor:'#111', border:`1px solid ${noteColor}40`,
              color:'#e2e2e2', minHeight:66, transition:'border-color 0.2s',
            }}
            placeholder="Escribe una nota rápida... (Ctrl+Enter para guardar)"
            value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey) handleAdd() }}
          />

          {/* Selector de ámbito */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{color:'#404040'}}>
              Ámbito (opcional)
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={()=>setAmbitoId(null)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={!ambitoId
                  ?{backgroundColor:'#c9a22722',color:'#c9a227',border:'1px solid #c9a22740'}
                  :{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
                Sin ámbito
              </button>
              {AMBITOS.filter(a=>activeAmbitoIds.has(a.id)).map(a=>{
                const Icon=getAmbitoIcon(a.id)
                const active=ambitoId===a.id
                return(
                  <button key={a.id} onClick={()=>setAmbitoId(active?null:a.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={active
                      ?{backgroundColor:a.color+'22',color:a.color,border:`1px solid ${a.color}40`}
                      :{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
                    <Icon size={9} weight={active?'fill':'regular'} style={{color:active?a.color:'#444'}}/>
                    {a.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95"
              style={{
                backgroundColor: text.trim() ? noteColor+'22' : '#111',
                color: text.trim() ? noteColor : '#333',
                border:`1px solid ${text.trim() ? noteColor+'40' : '#1a1a1a'}`,
              }}>
              <Plus size={12} weight="bold"/> Agregar nota
            </button>
          </div>
        </div>

        {/* Filtros */}
        {notes.length>0 && (
          <div className="px-5 py-2 border-b border-border shrink-0">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {[['all','Todas'],['general','Sin ámbito'],...AMBITOS.map(a=>[a.id,a.name])].map(([k,l])=>{
                const cnt=counts[k]||0
                if(k!=='all'&&k!=='general'&&cnt===0) return null
                const amb=AMBITOS.find(a=>a.id===k)
                return(
                  <button key={k} onClick={()=>setFilter(k)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 transition-all"
                    style={filter===k
                      ?{backgroundColor:(amb?.color||'#2cb99a')+'22',color:amb?.color||'#2cb99a',border:`1px solid ${(amb?.color||'#2cb99a')}40`}
                      :{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
                    {l}
                    {cnt>0&&<span className="ml-0.5 font-mono">{cnt}</span>}
                  </button>
                )
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {filtered.length===0 ? (
            <div className="text-center py-10">
              <p className="text-[28px] mb-2">📝</p>
              <p className="text-[13px] text-lo">{notes.length===0?'Sin notas aún':'Sin notas en este filtro'}</p>
              {notes.length===0&&<p className="text-[11px] text-lo mt-1">Escribe algo arriba para empezar</p>}
            </div>
          ) : filtered.map(n=>(
            <div key={n.id}>
              {editing?.id===n.id ? (
                <div className="rounded-2xl p-3 space-y-2"
                  style={{backgroundColor:editing.color+'0d',border:`1px solid ${editing.color}30`}}>
                  <textarea autoFocus
                    className="w-full rounded-lg px-2.5 py-2 text-[13px] resize-none outline-none"
                    style={{backgroundColor:'#111',border:`1px solid ${editing.color}40`,color:'#e2e2e2',minHeight:60}}
                    value={editing.text}
                    onChange={e=>setEditing(ed=>({...ed,text:e.target.value}))}
                  />
                  {/* Ámbito en edición */}
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={()=>setEditing(ed=>({...ed,ambitoId:null,color:'#c9a227'}))}
                      className="px-2 py-0.5 rounded-lg text-[9px] font-semibold transition-all"
                      style={!editing.ambitoId?{backgroundColor:'#c9a22722',color:'#c9a227',border:'1px solid #c9a22740'}:{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
                      Sin ámbito
                    </button>
                    {AMBITOS.filter(a=>activeAmbitoIds.has(a.id)).map(a=>{
                      const Icon=getAmbitoIcon(a.id)
                      const active=editing.ambitoId===a.id
                      return(
                        <button key={a.id} onClick={()=>setEditing(ed=>({...ed,ambitoId:active?null:a.id,color:active?'#c9a227':a.color}))}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-semibold transition-all"
                          style={active?{backgroundColor:a.color+'22',color:a.color,border:`1px solid ${a.color}40`}:{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
                          <Icon size={8} weight={active?'fill':'regular'}/>{a.name}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={()=>setEditing(null)} className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      style={{backgroundColor:'#1a1a1a',color:'#666'}}>Cancelar</button>
                    <button onClick={handleSaveEdit} className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      style={{backgroundColor:editing.color+'22',color:editing.color,border:`1px solid ${editing.color}40`}}>Guardar</button>
                  </div>
                </div>
              ) : (
                <NoteCard n={n}
                  onPin={handlePin} onDelete={handleDelete}
                  onEdit={n=>setEditing({id:n.id,text:n.text,color:n.color,ambitoId:n.ambitoId})}/>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Quick Action Modal ────────────────────────────────────────────────────────
function SleepModal({ onClose, onSave }) {
  const [hours, setHours] = useState(7)
  return (
    <div className="modal-backdrop fixed inset-0 bg-black/80 z-50 flex items-end backdrop-blur-sm" onClick={onClose}>
      <div className="modal-sheet bg-card border border-border-2 rounded-t-3xl w-full p-6"
        style={{borderTop:'3px solid #9575cd'}} onClick={e=>e.stopPropagation()}>
        <div className="flex justify-center mb-1"><div className="w-10 h-1 rounded-full bg-white/10"/></div>
        <p className="text-[15px] font-bold text-hi mt-3 mb-5">¿Cuántas horas dormiste?</p>
        <div className="flex items-center justify-center gap-5 mb-6">
          <button onClick={()=>setHours(h=>Math.max(1,h-0.5))}
            className="w-12 h-12 rounded-xl text-[24px] font-bold flex items-center justify-center"
            style={{backgroundColor:'#1a1a1a',color:'#666'}}>−</button>
          <span className="text-[48px] font-black font-mono" style={{color:'#9575cd'}}>{hours}</span>
          <button onClick={()=>setHours(h=>Math.min(24,h+0.5))}
            className="w-12 h-12 rounded-xl text-[24px] font-bold flex items-center justify-center"
            style={{backgroundColor:'#1a1a1a',color:'#666'}}>+</button>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="flex-1 py-3 rounded-xl font-bold text-[14px]"
            style={{backgroundColor:'#9575cd',color:'#000'}} onClick={()=>onSave(hours)}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Agua ────────────────────────────────────────────────────────────────
function AguaModal({ health, onUpdate, onClose }) {
  const [glasses, setGlasses] = useState(health.water || 0)
  const max = 8
  const pct = Math.round(glasses / max * 100)

  const save = v => {
    const clamped = Math.max(0, Math.min(max, v))
    setGlasses(clamped)
    const h = getTodayHealth()
    onUpdate(saveTodayHealth({ ...h, water: clamped }))
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-end justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="modal-sheet w-full rounded-t-3xl pb-6"
        style={{ backgroundColor:'#0d0d0d', border:'1px solid #1e1e1e', borderTop:'3px solid #4cae8a' }}
        onClick={e=>e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/10"/></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Drop size={16} weight="fill" style={{color:'#4cae8a'}}/>
            <h2 className="text-[15px] font-bold text-hi">Hidratación</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={14}/></button>
        </div>

        <div className="px-6 pt-5 pb-2 space-y-5">
          {/* Vasos visuales */}
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({length:max},(_,i)=>(
              <button key={i} onClick={()=>save(i+1)}
                className="flex flex-col items-center gap-1 transition-all active:scale-90"
                title={`${i+1} vaso${i+1>1?'s':''}`}>
                <div className="w-9 h-11 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: i<glasses ? '#4cae8a20' : '#111',
                    border: `1.5px solid ${i<glasses ? '#4cae8a50' : '#1e1e1e'}`,
                    transform: i<glasses ? 'scale(1.05)' : 'scale(1)',
                  }}>
                  <Drop size={18} weight={i<glasses?'fill':'regular'}
                    style={{color: i<glasses ? '#4cae8a' : '#252525'}}/>
                </div>
              </button>
            ))}
          </div>

          {/* Número grande */}
          <div className="text-center">
            <p className="text-[48px] font-black font-mono leading-none" style={{color:'#4cae8a'}}>{glasses}</p>
            <p className="text-[12px] text-lo mt-1">de {max} vasos</p>
            {glasses>=max && <p className="text-[12px] font-bold mt-1" style={{color:'#4cae8a'}}>¡Meta cumplida!</p>}
          </div>

          {/* Barra progreso */}
          <div className="h-2 rounded-full overflow-hidden" style={{backgroundColor:'#1a1a1a'}}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{width:`${pct}%`, backgroundColor:'#4cae8a'}}/>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-4">
            <button onClick={()=>save(glasses-1)}
              className="w-12 h-12 rounded-2xl text-[26px] font-bold flex items-center justify-center transition-all active:scale-90"
              style={{backgroundColor:'#111', color:glasses>0?'#4cae8a':'#222', border:'1px solid #1e1e1e'}}>−</button>
            <div className="flex gap-2">
              {[1,2,3].map(n=>(
                <button key={n} onClick={()=>save(glasses+n)}
                  className="px-3 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-90"
                  style={{backgroundColor:'#4cae8a18', color:'#4cae8a', border:'1px solid #4cae8a30'}}>
                  +{n}
                </button>
              ))}
            </div>
            <button onClick={()=>save(glasses+1)}
              className="w-12 h-12 rounded-2xl text-[26px] font-bold flex items-center justify-center transition-all active:scale-90"
              style={{backgroundColor:'#4cae8a18', color:'#4cae8a', border:'1px solid #4cae8a35'}}>+</button>
          </div>
        </div>

        <div className="px-5 pt-3 flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Listo</button>
          <Link to="/ambito/salud" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5"
            style={{backgroundColor:'#4cae8a18', color:'#4cae8a', border:'1px solid #4cae8a30'}}>
            Ver Salud <ArrowRight size={12}/>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Modal Gym ─────────────────────────────────────────────────────────────────
function GymModal({ gymToday, onSaved, onClose }) {
  const rutinas  = getRutinas()
  const sessions = getGymSessions()
  const last7Sess= sessions.slice(0,7)
  const [name, setName]   = useState(gymToday?.name || '')
  const [dur,  setDur]    = useState(gymToday?.duration || 0)
  const [saved, setSaved] = useState(!!gymToday)

  const handleSave = (sessionName) => {
    const sName = sessionName || name.trim() || 'Entrenamiento'
    addGymSession({ date: today(), name: sName, exercises: [], duration: dur })
    onSaved(); setSaved(true); setName(sName)
  }

  const handleDelete = () => {
    // Remove today's session
    const list = getGymSessions().filter(s => s.date !== today())
    localStorage.setItem('dt_gym_sessions', JSON.stringify(list))
    onSaved(); setSaved(false); setName('')
  }

  const today_d = today()

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-end justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="modal-sheet w-full max-h-[88vh] flex flex-col rounded-t-3xl"
        style={{ backgroundColor:'#0d0d0d', border:'1px solid #1e1e1e', borderTop:'3px solid #e05c5c' }}
        onClick={e=>e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-white/10"/></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Barbell size={16} weight="fill" style={{color:'#e05c5c'}}/>
            <h2 className="text-[15px] font-bold text-hi">Gym — hoy</h2>
            {saved && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{backgroundColor:'#e05c5c18', color:'#e05c5c'}}>✓ Registrado</span>}
          </div>
          <button className="btn-icon" onClick={onClose}><X size={14}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {saved ? (
            /* Sesión registrada */
            <div className="space-y-4">
              <div className="rounded-2xl p-4 text-center"
                style={{backgroundColor:'#e05c5c10', border:'1px solid #e05c5c25'}}>
                <Barbell size={28} className="mx-auto mb-1" weight="fill" style={{color:'#e05c5c'}}/>
                <p className="text-[15px] font-black" style={{color:'#e05c5c'}}>{name || gymToday?.name || 'Entrenamiento'}</p>
                {dur>0 && <p className="text-[11px] text-lo mt-0.5">{dur} minutos</p>}
              </div>
              {/* Duración rápida */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'#404040'}}>Duración (min)</p>
                <div className="flex gap-2 flex-wrap">
                  {[30,45,60,75,90].map(m=>(
                    <button key={m} onClick={()=>{ setDur(m); const s=getGymSessions(); const i=s.findIndex(x=>x.date===today_d); if(i>=0){s[i].duration=m; localStorage.setItem('dt_gym_sessions',JSON.stringify(s)); onSaved()} }}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                      style={dur===m?{backgroundColor:'#e05c5c22',color:'#e05c5c',border:'1px solid #e05c5c40'}:{backgroundColor:'#111',color:'#555',border:'1px solid #1a1a1a'}}>
                      {m}min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Sin sesión */
            <div className="space-y-4">
              {/* Nombre del entrenamiento */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'#404040'}}>Nombre</p>
                <input className="field-input" placeholder="Ej: Pecho, Piernas, Full body..."
                  value={name} onChange={e=>setName(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleSave()}/>
              </div>

              {/* Rutinas guardadas */}
              {rutinas.length>0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'#404040'}}>Rutinas guardadas</p>
                  <div className="flex flex-wrap gap-2">
                    {rutinas.map(r=>(
                      <button key={r.id} onClick={()=>handleSave(r.name)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
                        style={{backgroundColor:'#e05c5c12',color:'#e05c5c',border:'1px solid #e05c5c30'}}>
                        {r.name}
                        <ArrowRight size={10}/>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Entrenamientos rápidos */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'#404040'}}>Acceso rápido</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Pecho y Tríceps','Espalda y Bíceps','Piernas','Hombros','Full Body','Cardio'].map(n=>(
                    <button key={n} onClick={()=>handleSave(n)}
                      className="px-3 py-2.5 rounded-xl text-[12px] font-semibold text-left transition-all active:scale-95"
                      style={{backgroundColor:'#111',color:'#888',border:'1px solid #1a1a1a'}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Historial reciente */}
          {last7Sess.filter(s=>s.date!==today_d).slice(0,3).length>0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'#303030'}}>Últimas sesiones</p>
              <div className="space-y-1.5">
                {last7Sess.filter(s=>s.date!==today_d).slice(0,3).map(s=>(
                  <div key={s.date} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{backgroundColor:'#0d0d0d',border:'1px solid #161616'}}>
                    <span className="text-[12px] font-medium" style={{color:'#555'}}>{s.name||'Entrenamiento'}</span>
                    <span className="text-[10px] font-mono" style={{color:'#333'}}>{s.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
          {saved ? (
            <>
              <button onClick={handleDelete}
                className="px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                style={{backgroundColor:'#e05c5c12',color:'#e05c5c',border:'1px solid #e05c5c30'}}>
                Eliminar sesión
              </button>
              <Link to="/ambito/gym" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5"
                style={{backgroundColor:'#e05c5c',color:'#fff'}}>
                Ver Gym completo <ArrowRight size={12}/>
              </Link>
            </>
          ) : (
            <>
              <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
              <button onClick={()=>handleSave()}
                className="flex-1 py-2.5 rounded-xl font-bold text-[13px]"
                style={{backgroundColor:'#e05c5c',color:'#fff'}}>
                Registrar entrenamiento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ComidaModal({ planToday, todayMeals, todayCals, goals, calPct, onAddFood, onClose }) {
  const nowMins = toMin(nowT())

  const mealStatus = slot => {
    const slotMins = toMin(slot.time)
    const diff = nowMins - slotMins
    if (diff >= 0 && diff <= 45) return 'ahora'
    if (slotMins > nowMins) return 'próxima'
    return 'pasada'
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-end justify-center z-50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="modal-sheet w-full max-h-[88vh] flex flex-col rounded-t-3xl"
        style={{backgroundColor:'#0d0d0d', border:'1px solid #1e1e1e', borderTop:'3px solid #e07c4a'}}
        onClick={e=>e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/10"/>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ForkKnife size={16} weight="fill" style={{color:'#e07c4a'}}/>
            <h2 className="text-[15px] font-bold text-hi">Plan de comidas</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={14}/></button>
        </div>

        {/* Resumen calorías */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-lo">Calorías del día</span>
            <span className="text-[13px] font-black font-mono" style={{color:'#e07c4a'}}>
              {todayCals}
              {goals.calories>0 && <span className="text-[10px] font-normal text-lo"> / {goals.calories} kcal</span>}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{backgroundColor:'#1a1a1a'}}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${Math.min(100,calPct)}%`, backgroundColor:'#e07c4a'+(calPct>=100?'':'cc')}}/>
          </div>
          {calPct>=100 && <p className="text-[10px] mt-1" style={{color:'#e07c4a'}}>¡Meta calórica alcanzada!</p>}
        </div>

        {/* Plan del día */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {planToday.length===0 ? (
            <div className="text-center py-8">
              <p className="text-[28px] mb-2">🗓️</p>
              <p className="text-[13px] text-lo mb-1">Sin plan configurado para hoy</p>
              <Link to="/ambito/alimentacion" onClick={onClose}
                className="text-[11px] underline" style={{color:'#e07c4a'}}>
                Ir a Alimentación →
              </Link>
            </div>
          ) : planToday.map((slot,i) => {
            const status = mealStatus(slot)
            const isAhora = status==='ahora'
            const isPasada = status==='pasada'
            return (
              <div key={slot.id||i}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  backgroundColor: isAhora ? '#e07c4a12' : '#0d0d0d',
                  border:`1px solid ${isAhora ? '#e07c4a35' : isPasada ? '#1a1a1a' : '#1e1e1e'}`,
                  opacity: isPasada ? 0.55 : 1,
                }}>
                {/* Hora */}
                <div className="w-14 shrink-0 text-center">
                  <p className="text-[12px] font-black font-mono"
                    style={{color: isAhora ? '#e07c4a' : isPasada ? '#333' : '#555'}}>
                    {fmt12(slot.time)}
                  </p>
                  {isAhora && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{backgroundColor:'#e07c4a20', color:'#e07c4a'}}>
                      AHORA
                    </span>
                  )}
                </div>
                {/* Separador */}
                <div className="w-px h-8 shrink-0" style={{backgroundColor: isAhora ? '#e07c4a30' : '#1e1e1e'}}/>
                {/* Info comida */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate"
                    style={{color: isPasada ? '#444' : '#ddd'}}>
                    {slot.name}
                  </p>
                  {slot.foods?.length>0 && (
                    <p className="text-[10px] text-lo truncate mt-0.5">
                      {slot.foods.map(f=>f.name).join(', ')}
                    </p>
                  )}
                </div>
                {/* Badge estado */}
                {isPasada && (
                  <span className="text-[9px] shrink-0" style={{color:'#333'}}>Pasada</span>
                )}
                {!isPasada && !isAhora && (
                  <span className="text-[9px] shrink-0" style={{color:'#404040'}}>Próxima</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Cerrar</button>
          <button className="flex-1 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5"
            style={{backgroundColor:'#e07c4a22', color:'#e07c4a', border:'1px solid #e07c4a40'}}
            onClick={onAddFood}>
            <Plus size={13} weight="bold"/> Registrar comida
          </button>
          <Link to="/ambito/alimentacion" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5"
            style={{backgroundColor:'#e07c4a', color:'#000'}}>
            Ver plan completo
          </Link>
        </div>
      </div>
    </div>
  )
}

const EMOJIS = ['✅','🏃','📚','💪','🧘','🥗','💧','😴','🎯','🔥','⭐','🎨','💡','📝','🚀','🎵']

function HabitPicker({ habits, todayStr, onToggle, onClose, onHabitAdded }) {
  const [view, setView]       = useState('list') // 'list' | 'add'
  const [name, setName]       = useState('')
  const [emoji, setEmoji]     = useState('✅')
  const [ambitoId, setAmbitoId] = useState(AMBITOS[0]?.id || '')

  const pending = habits.filter(h => !h.completedDays.includes(todayStr))

  const handleSave = () => {
    if (!name.trim()) return
    addHabit({ name: name.trim(), emoji, ambitoId, frequency:{ type:'diario', days:[], count:1 }, goal:'' })
    setName(''); setEmoji('✅'); setView('list')
    if (onHabitAdded) onHabitAdded()
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/80 z-50 flex items-end backdrop-blur-sm" onClick={onClose}>
      <div className="modal-sheet bg-card border border-border-2 rounded-t-3xl w-full max-h-[80vh] flex flex-col"
        style={{borderTop:'3px solid #2cb99a'}} onClick={e=>e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full bg-white/10"/></div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          {view === 'list' ? (
            <>
              <p className="text-[15px] font-bold text-hi">Marcar hábito</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setView('add')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                  style={{backgroundColor:'#2cb99a18', color:'#2cb99a', border:'1px solid #2cb99a30'}}>
                  <Plus size={11} weight="bold"/> Nuevo
                </button>
                <button onClick={onClose} className="text-lo"><X size={15}/></button>
              </div>
            </>
          ) : (
            <>
              <button onClick={()=>setView('list')} className="text-lo flex items-center gap-1 text-[12px]">
                <CaretLeft size={13}/> Volver
              </button>
              <p className="text-[15px] font-bold text-hi">Nuevo hábito</p>
              <button onClick={onClose} className="text-lo"><X size={15}/></button>
            </>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4">

          {view === 'list' ? (
            <div className="space-y-2">
              {pending.length === 0
                ? <p className="text-center text-lo py-8 text-[13px]">¡Todos los hábitos completados hoy!</p>
                : pending.map(h => {
                  const amb = getAmbito(h.ambitoId)
                  return (
                    <button key={h.id} onClick={()=>{ onToggle(h.id,todayStr) }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98]"
                      style={{backgroundColor:'#0d0d0d', border:'1px solid #1a1a1a'}}>
                      <span className="text-base leading-none">{h.emoji||'✅'}</span>
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{borderColor:amb.color+'60'}}/>
                      <span className="text-[13px] text-hi flex-1">{h.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{backgroundColor:amb.color+'18',color:amb.color}}>{amb.name}</span>
                    </button>
                  )
                })
              }
            </div>
          ) : (
            <div className="space-y-4">
              {/* Emoji selector */}
              <div>
                <p className="text-[11px] text-lo mb-2 font-semibold uppercase tracking-wider">Emoji</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={()=>setEmoji(e)}
                      className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all active:scale-90"
                      style={{
                        backgroundColor: emoji===e ? '#2cb99a22' : '#0d0d0d',
                        border: `1px solid ${emoji===e ? '#2cb99a50' : '#1a1a1a'}`,
                        transform: emoji===e ? 'scale(1.12)' : 'scale(1)',
                      }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <p className="text-[11px] text-lo mb-1.5 font-semibold uppercase tracking-wider">Nombre del hábito</p>
                <input autoFocus
                  className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none"
                  style={{backgroundColor:'#0d0d0d', border:'1px solid #1e1e1e', color:'#e2e2e2'}}
                  placeholder="Ej: Meditar 10 minutos..."
                  value={name} onChange={e=>setName(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleSave()}
                />
              </div>

              {/* Ámbito */}
              <div>
                <p className="text-[11px] text-lo mb-2 font-semibold uppercase tracking-wider">Ámbito</p>
                <div className="flex flex-wrap gap-1.5">
                  {AMBITOS.filter(a=>activeAmbitoIds.has(a.id)).map(a => (
                    <button key={a.id} onClick={()=>setAmbitoId(a.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                      style={{
                        backgroundColor: ambitoId===a.id ? a.color+'22' : '#0d0d0d',
                        border: `1px solid ${ambitoId===a.id ? a.color+'50' : '#1a1a1a'}`,
                        color: ambitoId===a.id ? a.color : '#555',
                      }}>
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              <button onClick={handleSave}
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: name.trim() ? '#2cb99a' : '#111',
                  color: name.trim() ? '#000' : '#333',
                  border: name.trim() ? 'none' : '1px solid #1a1a1a',
                }}>
                Guardar hábito
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Ámbito status card ────────────────────────────────────────────────────────
function ACard({ color, icon: Icon, label, metric, sub, to, done, sparkData }) {
  return (
    <Link to={to}
      className="card-hover rounded-2xl p-3 flex flex-col gap-2"
      style={{
        backgroundColor: done ? color+'0e' : '#0a0a0a',
        border:`1px solid ${done ? color+'30' : '#1a1a1a'}`,
      }}>
      <div className="flex items-center justify-between">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{backgroundColor:color+'20'}}>
          <Icon size={14} weight="fill" style={{color}}/>
        </div>
        {done
          ? <Check size={13} weight="bold" style={{color,opacity:0.7}}/>
          : <ArrowRight size={11} style={{color:'#2a2a2a'}}/>
        }
      </div>
      <div>
        <p className="text-[11px] font-semibold" style={{color:done?'#aaa':'#444'}}>{label}</p>
        {metric && <p className="text-[12px] font-bold leading-tight mt-0.5" style={{color}}>{metric}</p>}
        {sub && <p className="text-[9px] text-lo leading-tight mt-0.5 truncate">{sub}</p>}
      </div>
      {sparkData && sparkData.length > 1 && (
        <ResponsiveContainer width="100%" height={24}>
          <AreaChart data={sparkData} margin={{top:0,right:0,bottom:0,left:0}}>
            <Area type="monotone" dataKey="v" stroke={color} fill={color}
              strokeWidth={1.5} fillOpacity={0.15} dot={false} isAnimationActive={false}/>
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Link>
  )
}

// ── ChartCard ─────────────────────────────────────────────────────────────────
// El header es un link al ámbito; el chart conserva sus tooltips
function ChartCard({ to, icon: Icon, iconColor, title, badge, right, children, style, className }) {
  return (
    <div className={`card overflow-hidden ${className||''}`} style={style}>
      <Link to={to}
        className="flex items-center justify-between mb-3 group cursor-pointer rounded-xl px-0 py-0 -mx-0 -mt-0 transition-all"
        style={{textDecoration:'none'}}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
            style={{backgroundColor: iconColor+'20'}}>
            <Icon size={12} weight="fill" style={{color: iconColor}}/>
          </div>
          <p className="text-[12px] font-bold text-hi group-hover:text-white transition-colors">{title}</p>
          {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{backgroundColor: iconColor+'20', color: iconColor}}>{badge}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {right && <span className="text-[10px] font-mono font-bold" style={{color: iconColor}}>{right}</span>}
          <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
            style={{color: iconColor}}/>
        </div>
      </Link>
      {/* Chart area — stopPropagation para que los tooltips sigan funcionando */}
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const location = useLocation()

  const selIds = getSelectedAmbitos()
  const activeAmbitoIds = new Set(selIds)

  const [habits,      setHabits]      = useState(getHabits)
  const [tick,        setTick]        = useState(0)
  const [modal,       setModal]       = useState(null)
  const [chartMode,   setChartMode]   = useState('14d')
  const [chartOffset, setChartOffset] = useState(0)

  // Refresca habits y fuerza re-render al montar, al volver (location cambia) y al enfocar ventana
  useEffect(() => {
    setHabits(getHabits())
    setTick(x => x + 1)
  }, [location])

  useEffect(() => {
    const onFocus = () => { setHabits(getHabits()); setTick(x => x + 1) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // health se lee directo en cada render — siempre fresco del localStorage
  const health = getTodayHealth()

  useEffect(()=>{ const id=setInterval(()=>setTick(x=>x+1),60000); return()=>clearInterval(id) },[])

  const t = today()
  const toggle = useCallback((id,date)=>setHabits(toggleHabitDay(id,date)),[])

  const addWater = () => {
    const h = getTodayHealth()
    saveTodayHealth({...h, water:Math.min((h.water||0)+1,8)})
    setTick(x => x + 1)
  }
  const logSleep = hours => {
    const h = getTodayHealth()
    saveTodayHealth({...h, sleep:hours})
    setTick(x => x + 1)
    setModal(null)
  }
  const logGym = () => {
    if(getGymSessions().find(s=>s.date===t)) return
    addGymSession({date:t, name:'Entrenamiento rápido', exercises:[], duration:0})
    setTick(x=>x+1)
    setModal(null)
  }

  // ── Data — leído fresco en cada mount (location.key garantiza re-mount) ──
  const meals      = getMeals()
  const goals      = getDietGoals()
  const weekPlan   = getMealPlanWeekly()
  const tasks      = getTasks()
  const workTasks  = getWorkTasks()
  const social     = getSocialEvents()
  const mente      = getTodayMente()
  const finances   = getFinanceEntries()
  const gymSess    = getGymSessions()
  const objectives = getObjectives()
  const l7         = useMemo(last7,[])
  const l30        = useMemo(last30,[])

  const todayMeals   = meals.filter(m=>m.date===t)
  const todayCals    = todayMeals.reduce((a,m)=>a+(Number(m.calories)||0),0)
  const todayProt    = todayMeals.reduce((a,m)=>a+(Number(m.protein)||0),0)
  const gymToday     = gymSess.find(s=>s.date===t)
  const pendingTasks = tasks.filter(tx=>!tx.done)
  const pendingWork  = workTasks.filter(tx=>!tx.done)
  const nextEvent    = social.find(e=>e.date>=t)
  const todayFin     = finances.filter(f=>f.date===t)
  const todayExp     = todayFin.filter(f=>f.type==='gasto').reduce((a,f)=>a+(Number(f.amount)||0),0)
  const todayInc     = todayFin.filter(f=>f.type==='ingreso').reduce((a,f)=>a+(Number(f.amount)||0),0)
  const nowMins      = toMin(nowT())
  const dowKey       = DOW[new Date().getDay()]
  const planToday    = (weekPlan[dowKey]||[]).sort((a,b)=>a.time.localeCompare(b.time))
  const heroMeal     = planToday.find(p=>{const d=nowMins-toMin(p.time);return d>=0&&d<=30}) || planToday.find(p=>toMin(p.time)>nowMins)

  // ── Habits stats ─────────────────────────────────────────────────────────
  const todayDone  = habits.filter(h=>h.completedDays.includes(t)).length
  const todayTotal = habits.length
  const todayPct   = todayTotal>0?Math.round(todayDone/todayTotal*100):0

  // ── Sleep 7-day data ─────────────────────────────────────────────────────
  const sleepData = useMemo(()=>{
    const log = getHealthLog()
    return l7.map(ds=>{
      const entry = log.find(e=>e.date===ds)
      const d = new Date(ds+'T12:00')
      return { label:['D','L','M','X','J','V','S'][d.getDay()], sleep: entry?.sleep||0, date:ds }
    })
  },[l7])

  // ── 7-day activity data ───────────────────────────────────────────────────
  const actData = useMemo(()=> l7.map(ds=>{
    const done=habits.filter(h=>h.completedDays.includes(ds)).length
    const cals=meals.filter(m=>m.date===ds).reduce((a,m)=>a+(Number(m.calories)||0),0)
    const d=new Date(ds+'T12:00'); const label=['D','L','M','X','J','V','S'][d.getDay()]
    return { label, habits:todayTotal>0?Math.round(done/todayTotal*100):0, cals, date:ds }
  }),[habits,meals,l7])

  // ── Ámbito radar ──────────────────────────────────────────────────────────
  const radarData = useMemo(()=>
    AMBITOS.map(a=>{
      const ah=habits.filter(h=>h.ambitoId===a.id)
      if(!ah.length)return null
      return{subject:a.name,score:Math.round(ah.reduce((acc,h)=>acc+hScore(h,l30),0)/ah.length),color:a.color,fullMark:100}
    }).filter(Boolean)
  ,[habits,l30])

  // ── Ámbito multi-line data ────────────────────────────────────────────────────
  const activeAmbitos = useMemo(()=>
    AMBITOS.filter(a=>habits.some(h=>h.ambitoId===a.id))
  ,[habits])

  // Modos: k=clave, l=label, total=nº días del período, group=días por punto
  const CHART_MODES = [
    { k:'7d',  l:'7D',  total:7,  group:1 },
    { k:'14d', l:'14D', total:14, group:1 },
    { k:'1m',  l:'1M',  total:28, group:7 },
    { k:'3m',  l:'3M',  total:84, group:7 },
  ]

  const ambitoLineData = useMemo(()=>{
    const cfg = CHART_MODES.find(m=>m.k===chartMode) || CHART_MODES[1]
    const { total, group } = cfg
    const MONTH = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const allDays = Array.from({length:total},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(total-1-i)+chartOffset*total)
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    })

    if(group===1){
      return allDays.map(ds=>{
        const d=new Date(ds+'T12:00')
        const isToday=ds===t
        const row={date:ds,label:['D','L','M','X','J','V','S'][d.getDay()],dayNum:d.getDate(),isToday}
        activeAmbitos.forEach(a=>{
          const ah=habits.filter(h=>h.ambitoId===a.id)
          const done=ah.filter(h=>h.completedDays.includes(ds)).length
          row[a.name]=ah.length>0?Math.round(done/ah.length*100):0
        })
        return row
      })
    }

    // Agrupado por semana
    const chunks=[]
    for(let i=0;i<allDays.length;i+=group){
      const chunk=allDays.slice(i,i+group)
      const first=new Date(chunk[0]+'T12:00')
      const row={
        label:`${first.getDate()} ${MONTH[first.getMonth()]}`,
        date:chunk[0],
        isToday:chunk.includes(t),
      }
      activeAmbitos.forEach(a=>{
        const ah=habits.filter(h=>h.ambitoId===a.id)
        const scores=chunk.map(ds=>{
          const done=ah.filter(h=>h.completedDays.includes(ds)).length
          return ah.length>0?Math.round(done/ah.length*100):0
        })
        row[a.name]=Math.round(scores.reduce((s,v)=>s+v,0)/scores.length)
      })
      chunks.push(row)
    }
    return chunks
  },[habits,activeAmbitos,chartMode,chartOffset,t])

  // Label del período actual en la gráfica
  const chartPeriodLabel = useMemo(()=>{
    if(!ambitoLineData.length) return ''
    const cfg=CHART_MODES.find(m=>m.k===chartMode)||CHART_MODES[1]
    const {total}=cfg
    const MONTH=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const first=new Date(ambitoLineData[0].date+'T12:00')
    const last=new Date(ambitoLineData[ambitoLineData.length-1].date+'T12:00')
    if(chartOffset===0) return 'Período actual'
    if(first.getFullYear()===last.getFullYear()&&first.getMonth()===last.getMonth())
      return `${first.getDate()}–${last.getDate()} ${MONTH[last.getMonth()]} ${last.getFullYear()}`
    return `${first.getDate()} ${MONTH[first.getMonth()]} – ${last.getDate()} ${MONTH[last.getMonth()]} ${last.getFullYear()}`
  },[ambitoLineData,chartMode,chartOffset])

  // ── Macros pie ─────────────────────────────────────────────────────────────
  const macroPie = [
    {name:'Proteína', value:todayProt||1, color:'#5b84e8'},
    {name:'Carbos',   value:todayMeals.reduce((a,m)=>a+(Number(m.carbs)||0),0)||1, color:'#c9a227'},
    {name:'Grasas',   value:todayMeals.reduce((a,m)=>a+(Number(m.fat)||0),0)||1,  color:'#e07c4a'},
  ]

  // ── Calorie goal pct ──────────────────────────────────────────────────────
  const calPct = goals.calories>0?Math.min(100,Math.round(todayCals/goals.calories*100)):0
  const habitSparkForAmbito = id => l7.map(ds=>({v:habits.filter(h=>h.ambitoId===id&&h.completedDays.includes(ds)).length}))

  const dateLabel = new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})
  const hour = new Date().getHours()
  const greeting = hour<12?'Buenos días':'hour'<18?'Buenas tardes':'Buenas noches'

  return (
    <div className="p-5 space-y-5 pb-10">

      {/* ── HERO ── */}
      <div className="rounded-3xl overflow-hidden relative"
        style={{backgroundColor:'#111',border:'1px solid #1e1e1e'}}>
        <div/>
        <div className="relative px-5 pt-5 pb-4 flex items-center gap-5">
          <Ring pct={todayPct} size={110} stroke={9} color="#2cb99a" label="hábitos" sublabel={`${todayDone}/${todayTotal}`}/>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{color:'#2cb99a80'}}>
              {dateLabel}
            </p>
            <h1 className="text-[24px] font-black text-hi leading-tight mt-0.5">
              {hour<12?'Buenos días 🌅':hour<18?'Buenas tardes ☀️':'Buenas noches 🌙'}
            </h1>
            <div className="flex gap-3 mt-2">
              <div>
                <p className="text-[10px] text-lo">Calorías</p>
                <p className="text-[16px] font-black font-mono" style={{color:'#e07c4a'}}>{todayCals}<span className="text-[10px] text-lo font-normal">/{goals.calories}</span></p>
              </div>
              <div>
                <p className="text-[10px] text-lo">Agua</p>
                <p className="text-[16px] font-black font-mono" style={{color:'#4cae8a'}}>{health.water||0}<span className="text-[10px] text-lo font-normal">/8</span></p>
              </div>
              {health.sleep>0 && <div>
                <p className="text-[10px] text-lo">Sueño</p>
                <p className="text-[16px] font-black font-mono" style={{color:'#9575cd'}}>{health.sleep}<span className="text-[10px] text-lo font-normal">h</span></p>
              </div>}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-5 pb-5 grid grid-cols-6 gap-2">
          {[
            { icon:Drop,       label:'Agua',   color:'#4cae8a', action:()=>setModal('agua'),   done: (health.water||0)>=8 },
            { icon:Barbell,    label:'Gym',    color:'#e05c5c', action:()=>setModal('gym'),    done: !!gymToday },
            { icon:ForkKnife,  label:'Comida', color:'#e07c4a', action:()=>setModal('comida'), done: todayMeals.length>0 },
            { icon:Check,      label:'Hábito', color:'#2cb99a', action:()=>setModal('habit'),  done: todayDone===todayTotal&&todayTotal>0 },
            { icon:Moon,       label:'Sueño',  color:'#9575cd', action:()=>setModal('sleep'),  done: health.sleep>0 },
            { icon:NotePencil, label:'Notas',  color:'#c9a227', action:()=>setModal('notes'),  done: getQuickNotes().length>0 },
          ].map(({icon:Icon,label,color,action,done})=>(
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-90"
              style={{
                backgroundColor: done ? color+'15' : '#111',
                border:`1px solid ${done ? color+'35' : '#1e1e1e'}`,
              }}>
              <Icon size={18} weight="fill" style={{color:done?color:'#444'}}/>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{color:done?color:'#444'}}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* ── Widget hábitos rápido ── */}
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{backgroundColor:'#2cb99a18'}}>
                <Check size={12} weight="bold" style={{color:'#2cb99a'}}/>
              </div>
              <p className="text-[12px] font-bold text-hi">Hábitos de hoy</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold" style={{color:'#2cb99a'}}>{todayDone}/{todayTotal}</span>
              <Link to="/habitos" className="text-[10px] text-lo hover:text-accent flex items-center gap-0.5 transition-colors">
                Ver todos <ArrowRight size={10}/>
              </Link>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="h-1 bg-border rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${todayPct}%`, backgroundColor:'#2cb99a'}}/>
          </div>

          {habits.length === 0 ? (
            <Link to="/habitos" className="flex items-center justify-center gap-2 py-4 text-[12px] text-lo hover:text-mid transition-colors">
              <Plus size={12}/> Crear primer hábito
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {habits.filter(h => habitDueOn(h, t)).map(h => {
                const done = h.completedDays.includes(t)
                const amb  = getAmbito(h.ambitoId)
                const Icon = getAmbitoIcon(h.ambitoId)
                const streak = (() => {
                  let c=0,d=new Date()
                  while(true){const ds=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;if(h.completedDays.includes(ds)){c++;d.setDate(d.getDate()-1)}else break;if(c>365)break}
                  return c
                })()
                return (
                  <button key={h.id} onClick={() => { toggle(h.id, t); setHabits(prev => prev.map(x => x.id===h.id ? {...x, completedDays: x.completedDays.includes(t) ? x.completedDays.filter(d=>d!==t) : [...x.completedDays,t]} : x)) }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all active:scale-[0.97]"
                    style={done
                      ? {backgroundColor:amb.color+'0d', border:`1px solid ${amb.color}28`}
                      : {backgroundColor:'#111', border:'1px solid #1a1a1a'}
                    }>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={done
                        ? {backgroundColor:amb.color+'30', border:`1px solid ${amb.color}50`}
                        : {border:'1.5px solid #333'}}>
                      {done && <Check size={10} weight="bold" style={{color:amb.color}}/>}
                    </div>
                    <span className="text-[11px] flex-1 truncate font-medium"
                      style={{color: done ? '#555' : '#ccc', textDecoration: done ? 'line-through' : 'none'}}>
                      {h.emoji || ''} {h.name}
                    </span>
                    {streak > 1 && !done && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Fire size={9} weight="fill" style={{color:'#e07c4a'}}/>
                        <span className="text-[9px] font-mono font-bold" style={{color:'#e07c4a'}}>{streak}</span>
                      </div>
                    )}
                    <div className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{backgroundColor:amb.color+'15'}}>
                      <Icon size={8} weight="fill" style={{color:amb.color}}/>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Ámbito multi-line chart — col-span-2 */}
        <div className="card col-span-2">

          {/* Header: título + modo + navegación */}
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-2">
              <ChartLine size={13} style={{color:'#fff'}}/>
              <p className="text-[13px] font-black text-hi tracking-tight">Hábitos por ámbito</p>
            </div>
            {/* Selector de frecuencia */}
            <div className="flex gap-0.5 p-0.5 rounded-lg" style={{backgroundColor:'#111'}}>
              {CHART_MODES.map(m=>(
                <button key={m.k} onClick={()=>{setChartMode(m.k);setChartOffset(0)}}
                  className="px-2 py-1 rounded-md text-[10px] font-bold transition-all"
                  style={chartMode===m.k
                    ?{backgroundColor:'#1e1e1e',color:'#e2e2e2'}
                    :{color:'#404040'}}>
                  {m.l}
                </button>
              ))}
            </div>
          </div>

          {/* Navegación período */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <button onClick={()=>setChartOffset(o=>o-1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:text-mid"
              style={{backgroundColor:'#111',border:'1px solid #1a1a1a',color:'#505050'}}>
              <CaretLeft size={11}/>
            </button>
            <div className="flex-1 text-center">
              <p className="text-[11px] font-semibold" style={{color:chartOffset===0?'#2cb99a':'#666'}}>
                {chartPeriodLabel}
              </p>
            </div>
            <button onClick={()=>setChartOffset(o=>Math.min(0,o+1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{
                backgroundColor:'#111',border:'1px solid #1a1a1a',
                color:chartOffset>=0?'#1a1a1a':'#505050',
                pointerEvents:chartOffset>=0?'none':'auto',
              }}>
              <CaretRight size={11}/>
            </button>
            {chartOffset!==0&&(
              <button onClick={()=>setChartOffset(0)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:text-accent"
                style={{backgroundColor:'#111',border:'1px solid #1a1a1a',color:'#404040'}}
                title="Volver al período actual">
                <ArrowCounterClockwise size={11}/>
              </button>
            )}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            {activeAmbitos.map(a=>(
              <Link key={a.id} to={`/ambito/${a.id}`}
                className="flex items-center gap-1.5 hover:opacity-100 transition-opacity"
                style={{opacity:0.7}}>
                <span className="w-4 h-[2px] rounded-full inline-block" style={{backgroundColor:a.color}}/>
                <span className="text-[9px] font-semibold" style={{color:a.color+'cc'}}>{a.name}</span>
              </Link>
            ))}
          </div>

          {activeAmbitos.length===0
            ?<p className="text-[12px] text-lo text-center py-10">Sin hábitos aún</p>
            :<div onClick={e=>e.stopPropagation()}>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={ambitoLineData} margin={{top:8,right:8,bottom:0,left:-20}}>
                  <CartesianGrid stroke="#131313" vertical={false}/>
                  <XAxis dataKey={chartMode==='14d'||chartMode==='7d'?'dayNum':'label'}
                    tick={({x,y,payload,index})=>{
                      const d=ambitoLineData[index]
                      const isToday=d?.isToday
                      return(
                        <g transform={`translate(${x},${y})`}>
                          {isToday&&<rect x={-8} y={2} width={16} height={14} rx={3}
                            fill="#2cb99a20" stroke="#2cb99a40" strokeWidth={0.5}/>}
                          <text x={0} y={12} textAnchor="middle"
                            fill={isToday?'#2cb99a':'#2e2e2e'}
                            fontSize={9} fontWeight={isToday?700:500}>
                            {payload.value}
                          </text>
                        </g>
                      )
                    }}
                    axisLine={false} tickLine={false}
                    interval={chartMode==='3m'?1:0}/>
                  <Tooltip
                    content={({active,payload,label})=>active&&payload?.length?(
                      <div style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:10,padding:'8px 12px',fontSize:11}}>
                        <p className="text-[10px] mb-1.5" style={{color:'#555'}}>
                          {chartMode==='7d'||chartMode==='14d'?`Día ${label}`:label}
                        </p>
                        {payload.map(p=>(
                          <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:p.color}}/>
                            <span style={{color:p.color,fontWeight:700}}>{p.dataKey}:</span>
                            <span style={{color:'#ccc',fontWeight:800}}>{p.value}%</span>
                          </div>
                        ))}
                      </div>
                    ):null}
                    cursor={{stroke:'#ffffff10',strokeWidth:1}}
                  />
                  {activeAmbitos.map(a=>(
                    <Line key={a.id} type="monotone" dataKey={a.name}
                      stroke={a.color} strokeWidth={1.8}
                      dot={false}
                      activeDot={{r:4,fill:a.color,stroke:'#0e0e0e',strokeWidth:2}}
                      isAnimationActive={true} animationDuration={500} animationEasing="ease-out"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          }

          <Link to="/habitos"
            className="flex items-center justify-end gap-1 mt-3 pt-2 border-t text-[10px] font-semibold transition-opacity opacity-30 hover:opacity-80"
            style={{borderColor:'#ffffff08',color:'#fff'}}>
            Ver todos los hábitos <ArrowRight size={10}/>
          </Link>
        </div>

        {/* Macros pie */}
        <ChartCard to="/ambito/alimentacion" icon={ChartPie} iconColor="#e07c4a"
          title="Macros hoy" right={todayCals>0?`${todayCals}kcal`:undefined}>
          <div className="flex items-center gap-3">
            <div onClick={e=>e.stopPropagation()}>
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={macroPie} cx="50%" cy="50%" innerRadius={24} outerRadius={38}
                    dataKey="value" strokeWidth={0} paddingAngle={2}>
                    {macroPie.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              {macroPie.map(m=>(
                <div key={m.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:m.color}}/>
                  <span className="text-[10px] text-lo flex-1">{m.name}</span>
                  <span className="text-[10px] font-mono font-bold" style={{color:m.color}}>{todayCals>0?m.value:0}g</span>
                </div>
              ))}
              <div className="mt-1 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-lo">Total</span>
                  <span className="text-[11px] font-black font-mono" style={{color:'#e07c4a'}}>{todayCals} kcal</span>
                </div>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Sueño 7 días */}
        <ChartCard to="/ambito/salud" icon={Moon} iconColor="#9575cd"
          title="Sueño 7 días" right={health.sleep>0?`${health.sleep}h hoy`:'Sin registrar'}>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={sleepData} barSize={20} margin={{top:4,right:0,bottom:0,left:0}}>
              <defs>
                <linearGradient id="gSleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#9575cd" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#9575cd" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <Tooltip content={({active,payload})=>active&&payload?.[0]?(
                <div style={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:8,padding:'5px 9px',fontSize:11,color:'#ccc'}}>
                  {payload[0]?.value>0
                    ? <><div style={{color:'#9575cd',fontWeight:700}}>{payload[0].value}h de sueño</div>
                        <div style={{color: payload[0].value>=7?'#4cae8a':'#e05c5c',fontSize:10}}>
                          {payload[0].value>=8?'Excelente 😴':payload[0].value>=7?'Bien 🙂':payload[0].value>=6?'Regular 😐':'Poco 😓'}
                        </div></>
                    : <div style={{color:'#555'}}>Sin registrar</div>
                  }
                </div>
              ):null}/>
              <Bar dataKey="sleep" radius={[5,5,0,0]}>
                {sleepData.map((d,i)=>(
                  <Cell key={i}
                    fill={d.sleep===0 ? '#1a1a1a'
                      : d.date===t    ? '#9575cd'
                      : d.sleep>=8   ? '#4cae8a'
                      : d.sleep>=7   ? '#9575cd'
                      : d.sleep>=6   ? '#9575cd88'
                      : '#e05c5c88'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between mt-1 px-0.5">
            {sleepData.map((d,i)=>(
              <span key={i} className="text-[9px] font-bold w-6 text-center"
                style={{color:d.date===t?'#9575cd':'#333'}}>{d.label}</span>
            ))}
          </div>
          {/* Promedio */}
          <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
            <span className="text-[10px] text-lo">Promedio semana</span>
            <span className="text-[11px] font-black font-mono" style={{color:'#9575cd'}}>
              {sleepData.filter(d=>d.sleep>0).length>0
                ? `${(sleepData.filter(d=>d.sleep>0).reduce((a,d)=>a+d.sleep,0)/sleepData.filter(d=>d.sleep>0).length).toFixed(1)}h`
                : '—'}
            </span>
          </div>
        </ChartCard>
      </div>

      {/* ── ÁMBITO STATUS GRID ── */}
      <div>
        <p className="text-[11px] font-bold text-lo uppercase tracking-wider mb-2">Estado de hoy</p>
        <div className="grid grid-cols-2 gap-2 stagger-children">
          {activeAmbitoIds.has('salud') && <ACard color="#4cae8a" icon={Drop} label="Agua" to="/ambito/salud"
            done={(health.water||0)>0}
            metric={`${health.water||0}/8 vasos`}
            sub={health.sleep>0?`Dormiste ${health.sleep}h`:undefined}
            sparkData={[]}/>}

          {activeAmbitoIds.has('gym') && <ACard color="#e05c5c" icon={Barbell} label="Gym" to="/ambito/gym"
            done={!!gymToday}
            metric={gymToday?gymToday.name||'Entrenamiento':'Sin entrenar'}
            sub={gymToday?`${(gymToday.exercises||[]).length} ejercicios`:`${gymSess.filter(s=>s.date>=l7[0]).length} sesiones esta semana`}
            sparkData={l7.map(ds=>({v:gymSess.filter(s=>s.date===ds).length}))}/>}

          {activeAmbitoIds.has('alimentacion') && <ACard color="#e07c4a" icon={ForkKnife} label="Alimentación" to="/ambito/alimentacion"
            done={todayMeals.length>0}
            metric={calPct>0?`${calPct}% meta calórica`:heroMeal?heroMeal.name:'Sin registrar'}
            sub={todayMeals.length>0?`${todayMeals.length} comidas · ${todayCals}kcal`:heroMeal?`${fmt12(heroMeal.time)}`:''}
            sparkData={l7.map(ds=>({v:meals.filter(m=>m.date===ds).reduce((a,m)=>a+(Number(m.calories)||0),0)}))}/>}

          {activeAmbitoIds.has('escolar') && <ACard color="#5b84e8" icon={BookOpen} label="Escolar" to="/ambito/escolar"
            done={tasks.length>0&&pendingTasks.length===0}
            metric={pendingTasks.length>0?`${pendingTasks.length} pendientes`:'Todo al día ✓'}
            sub={`${tasks.filter(tx=>tx.done).length} completadas en total`}
            sparkData={[]}/>}

          {activeAmbitoIds.has('mente') && <ACard color="#7ec45a" icon={Brain} label="Mente" to="/ambito/mente"
            done={mente.meditation>0||!!mente.journal}
            metric={mente.meditation>0?`${mente.meditation}min`:mente.journal?'Diario escrito':'Sin registrar'}
            sub={mente.gratitude?'Gratitud registrada':undefined}
            sparkData={[]}/>}

          {activeAmbitoIds.has('social') && <ACard color="#d4608a" icon={Users} label="Social" to="/ambito/social"
            done={nextEvent?.date===t}
            metric={nextEvent?nextEvent.title||nextEvent.name:'Sin eventos'}
            sub={nextEvent&&nextEvent.date!==t?`${nextEvent.date}`:undefined}
            sparkData={[]}/>}

          {activeAmbitoIds.has('trabajo') && <ACard color="#9575cd" icon={Briefcase} label="Trabajo" to="/ambito/trabajo"
            done={workTasks.length>0&&pendingWork.length===0}
            metric={pendingWork.length>0?`${pendingWork.length} pendientes`:'¡Todo listo!'}
            sub={undefined} sparkData={[]}/>}

          {activeAmbitoIds.has('finanzas') && <ACard color="#c9a227" icon={PiggyBank} label="Finanzas" to="/ambito/finanzas"
            done={todayFin.length>0}
            metric={todayFin.length>0
              ? `${todayInc>0?`+$${todayInc} `:''}${todayExp>0?`-$${todayExp}`:''}`
              : 'Sin movimientos'}
            sub={todayFin.length>0?`${todayFin.length} registros hoy`:undefined}
            sparkData={[]}/>}
        </div>
      </div>

      {/* ── HÁBITOS HOY ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Hábitos de hoy</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-lo font-mono">{todayDone}/{todayTotal}</span>
            <Link to="/habitos" className="text-[10px] text-lo hover:text-accent transition-colors flex items-center gap-0.5">
              Ver todos <ArrowRight size={10}/>
            </Link>
          </div>
        </div>
        {habits.length === 0
          ? <p className="text-lo text-[13px]">No hay hábitos. <Link to="/habitos" className="text-accent underline">Crea el primero.</Link></p>
          : <div className="grid grid-cols-2 gap-1.5">
              {habits.map(h=>{
                const done=h.completedDays.includes(t)
                const amb=getAmbito(h.ambitoId)
                const s=habitStreak(h)
                return (
                  <button key={h.id} onClick={()=>toggle(h.id,t)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all w-full text-left active:scale-[0.97]"
                    style={done?{backgroundColor:amb.color+'0d',border:`1px solid ${amb.color}28`}:{backgroundColor:'#111',border:'1px solid #1e1e1e'}}>
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all"
                      style={done?{backgroundColor:amb.color}:{border:'1.5px solid #333'}}>
                      {done&&<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4.5,7.5 8,3" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </div>
                    <span className="text-[12px] flex-1 truncate" style={{color:done?amb.color:'#666'}}>{h.name}</span>
                    {s>1&&<div className="flex items-center gap-0.5 shrink-0">
                      <Fire size={9} weight="fill" style={{color:amb.color}}/>
                      <span className="text-[9px] font-mono font-bold" style={{color:amb.color}}>{s}</span>
                    </div>}
                  </button>
                )
              })}
            </div>
        }
      </div>

      {/* ── OBJETIVOS ── */}
      {objectives.length>0&&(
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Objetivos</p>
            <Link to="/objetivos" className="text-[11px] text-lo hover:text-accent flex items-center gap-0.5">
              Ver todos <ArrowRight size={10}/>
            </Link>
          </div>
          <div className="space-y-3">
            {objectives.slice(0,4).map(o=>{
              const amb=getAmbito(o.ambitoId)
              return(
                <div key={o.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-hi flex-1 pr-2 truncate">{o.title}</span>
                    <span className="text-[11px] font-black font-mono shrink-0" style={{color:amb.color}}>{o.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{backgroundColor:'#111',border:'1px solid #1a1a1a'}}>
                    <div className="h-full rounded-full transition-all"
                      style={{width:`${o.progress}%`,backgroundColor:amb.color}}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── RADAR ── */}
      {radarData.length>=3&&(
        <ChartCard to="/habitos" icon={ChartLine} iconColor="#2cb99a" title="Radar de ámbitos" badge="30 días">

          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{top:16,right:44,bottom:16,left:44}}>
              <PolarGrid stroke="#1e1e1e" strokeWidth={1}/>
              <PolarAngleAxis dataKey="subject"
                tick={({x,y,payload,index})=>{
                  const a=AMBITOS.find(a=>a.name===payload.value)
                  return(
                    <g>
                      <text x={x} y={y+4} textAnchor="middle" fill={a?.color||'#666'} fontSize={9} fontWeight={600}>{payload.value}</text>
                      <text x={x} y={y+15} textAnchor="middle" fill={a?.color||'#666'} fontSize={10} fontFamily="monospace" fontWeight={700}>{radarData[index]?.score??0}%</text>
                    </g>
                  )
                }}
              />
              <Radar dataKey="fullMark" stroke="#2a2a2a" fill="#1a1a1a" fillOpacity={0.4} dot={false} isAnimationActive={false}/>
              <Radar dataKey="score" stroke="#2cb99a" fill="#2cb99a" fillOpacity={0.15} strokeWidth={2}
                dot={({cx,cy,index})=>{
                  const c=AMBITOS.find(a=>a.name===radarData[index]?.subject)?.color||'#2cb99a'
                  return<circle key={index} cx={cx} cy={cy} r={4} fill={c} stroke="#0e0e0e" strokeWidth={2}/>
                }}
                animationDuration={600} animationEasing="ease-out"
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Modals ── */}
      {modal==='agua' && (
        <AguaModal health={health}
          onUpdate={()=>setTick(x=>x+1)}
          onClose={()=>setModal(null)}/>
      )}
      {modal==='gym' && (
        <GymModal gymToday={gymToday}
          onSaved={()=>setTick(x=>x+1)}
          onClose={()=>setModal(null)}/>
      )}
      {modal==='sleep'  && <SleepModal onClose={()=>setModal(null)} onSave={logSleep}/>}
      {modal==='habit'  && <HabitPicker habits={habits} todayStr={t} onToggle={(id,d)=>{toggle(id,d)}} onClose={()=>setModal(null)} onHabitAdded={()=>setHabits(getHabits())}/>}
      {modal==='notes'  && <NotesModal onClose={()=>setModal(null)}/>}
      {modal==='comida' && (
        <ComidaModal
          planToday={planToday} todayMeals={todayMeals}
          todayCals={todayCals} goals={goals} calPct={calPct}
          onAddFood={()=>setModal('food')}
          onClose={()=>setModal(null)}
        />
      )}
      {modal==='food' && (
        <FoodSearchModal
          ambito={AMBITOS.find(a=>a.id==='alimentacion')}
          onClose={()=>setModal(null)}
          onAdd={data=>{ addMeal(data); setModal(null) }}
        />
      )}

    </div>
  )
}
