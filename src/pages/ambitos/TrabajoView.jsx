import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus, X, Check, Play, Pause, ArrowCounterClockwise, Timer,
  Kanban, CalendarBlank, Clock, NotePencil, Tag, Briefcase,
  CaretLeft, CaretRight, ArrowRight, Trash, Coffee,
} from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits, getWorkTasks, addWorkTask, updateWorkTask, toggleWorkTask, deleteWorkTask,
  getWorkSessions, startWorkSession, endWorkSession,
  getPomHistory, addPomEntry,
  getMeetingNotes, addMeetingNote, deleteMeetingNote,
} from '../../store'

// ── Constantes ────────────────────────────────────────────────────────────
const PRIORITIES = { alta: '#e05c5c', media: '#c9a227', baja: '#4cae8a' }
const COLUMNS = [
  { k: 'todo',       label: 'Por hacer',  color: '#555'    },
  { k: 'inprogress', label: 'En progreso',color: '#c9a227' },
  { k: 'review',     label: 'Revisión',   color: '#38bdf8' },
  { k: 'done',       label: 'Listo',      color: '#4cae8a' },
]
const TASK_TAGS = ['#código','#reunión','#email','#diseño','#docs','#bug','#revisión','#planificación']
const POMODORO_SECS  = 25 * 60
const BREAK_SHORT    =  5 * 60
const BREAK_LONG     = 15 * 60

// ── Utilidades ────────────────────────────────────────────────────────────
const ds = d => d.toISOString().slice(0,10)
const today = () => ds(new Date())
const weekDays = () => {
  const d = new Date(); d.setHours(0,0,0,0)
  const dow = (d.getDay()+6)%7
  d.setDate(d.getDate()-dow)
  return Array.from({length:7},(_,i)=>{ const x=new Date(d); x.setDate(d.getDate()+i); return ds(x) })
}

// ── Componente Kanban ─────────────────────────────────────────────────────
function KanbanBoard({ tasks, ambito, onUpdate, onDelete, onSelect }) {
  const cols = COLUMNS.map(col => ({
    ...col,
    items: tasks.filter(t => (t.status||'todo') === col.k)
  }))

  const drag = useRef(null)

  const onDragStart = (e, taskId) => { drag.current = taskId }
  const onDrop = (e, colKey) => {
    e.preventDefault()
    if (!drag.current) return
    onUpdate(drag.current, { status: colKey, done: colKey === 'done' })
    drag.current = null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cols.map(col => (
        <div key={col.k}
          className="rounded-xl p-2 min-h-[200px]"
          style={{ backgroundColor: col.color+'0a', border:`1px solid ${col.color}20` }}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>onDrop(e,col.k)}>

          {/* Header columna */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{color:col.color}}>{col.label}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
              style={{backgroundColor:col.color+'20',color:col.color}}>{col.items.length}</span>
          </div>

          {/* Tarjetas */}
          <div className="space-y-2">
            {col.items.map(t=>(
              <div key={t.id}
                draggable
                onDragStart={e=>onDragStart(e,t.id)}
                className="rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]"
                style={{backgroundColor:'#0d0d0d',border:`1px solid ${PRIORITIES[t.priority]||'#1a1a1a'}22`}}>

                {/* Proyecto */}
                {t.project && <p className="text-[9px] text-lo mb-1 font-semibold uppercase tracking-wider">{t.project}</p>}

                {/* Título */}
                <p className="text-[12px] text-hi leading-snug mb-2">{t.title}</p>

                {/* Tags */}
                {t.tags?.length>0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.tags.map(tg=>(
                      <span key={tg} className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{backgroundColor:'#2cb99a12',color:'#2cb99a99'}}>{tg}</span>
                    ))}
                  </div>
                )}

                {/* Footer tarjeta */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md"
                    style={{backgroundColor:PRIORITIES[t.priority]+'18',color:PRIORITIES[t.priority]}}>{t.priority}</span>
                  <div className="flex items-center gap-1.5">
                    {t.estimatedHours>0 && (
                      <span className="text-[9px] text-lo flex items-center gap-0.5">
                        <Clock size={8}/>{t.estimatedHours}h
                      </span>
                    )}
                    {t.dueDate && (
                      <span className="text-[9px] text-lo flex items-center gap-0.5">
                        <CalendarBlank size={8}/>{t.dueDate.slice(5)}
                      </span>
                    )}
                    <button onClick={()=>onDelete(t.id)} className="text-lo hover:text-red-400 transition-colors">
                      <X size={10}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Vista Lista ───────────────────────────────────────────────────────────
function ListView({ tasks, ambito, onUpdate, onDelete }) {
  const [filterProject, setFilterProject] = useState('all')
  const [filterTag, setFilterTag] = useState('all')

  const projects = [...new Set(tasks.map(t=>t.project).filter(Boolean))]
  const allTags  = [...new Set(tasks.flatMap(t=>t.tags||[]))]

  let filtered = tasks
  if (filterProject !== 'all') filtered = filtered.filter(t=>t.project===filterProject)
  if (filterTag !== 'all')     filtered = filtered.filter(t=>(t.tags||[]).includes(filterTag))

  const pending = filtered.filter(t=>t.status!=='done')
  const done    = filtered.filter(t=>t.status==='done')

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={()=>setFilterProject('all')}
          className="text-[12px] px-3 py-1 rounded-lg transition-all"
          style={filterProject==='all'?{backgroundColor:ambito.color+'20',color:ambito.color}:{color:'#555'}}>
          Todos ({tasks.length})
        </button>
        {projects.map(p=>(
          <button key={p} onClick={()=>setFilterProject(p)}
            className="text-[12px] px-3 py-1 rounded-lg transition-all"
            style={filterProject===p?{backgroundColor:ambito.color+'20',color:ambito.color}:{color:'#555'}}>
            {p}
          </button>
        ))}
        {allTags.map(tg=>(
          <button key={tg} onClick={()=>setFilterTag(filterTag===tg?'all':tg)}
            className="text-[11px] px-2 py-1 rounded-full transition-all"
            style={filterTag===tg?{backgroundColor:'#2cb99a20',color:'#2cb99a',border:'1px solid #2cb99a30'}:{color:'#444'}}>
            {tg}
          </button>
        ))}
      </div>

      {filtered.length===0 && <div className="card py-10 text-center text-lo text-[13px]">Sin tareas.</div>}

      {/* Pendientes */}
      {pending.length>0 && (
        <div className="space-y-1.5 mb-4">
          {pending.map(t=>{
            const col = COLUMNS.find(c=>c.k===(t.status||'todo'))
            return (
              <div key={t.id} className="card flex items-center gap-3 group py-2.5 hover:border-border-2 transition-colors">
                <button onClick={()=>onUpdate(t.id,{status:'done',done:true})}
                  className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
                  style={{border:`1.5px solid ${PRIORITIES[t.priority]}66`}}/>
                <div className="flex-1 min-w-0">
                  {t.project && <p className="text-[10px] text-lo mb-0.5">{t.project}</p>}
                  <p className="text-[13px] text-hi truncate">{t.title}</p>
                  {t.tags?.length>0 && (
                    <div className="flex gap-1 mt-0.5">
                      {t.tags.map(tg=><span key={tg} className="text-[9px] text-lo">{tg}</span>)}
                    </div>
                  )}
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{backgroundColor:col?.color+'20',color:col?.color}}>{col?.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md"
                  style={{backgroundColor:PRIORITIES[t.priority]+'22',color:PRIORITIES[t.priority]}}>{t.priority}</span>
                {t.estimatedHours>0 && <span className="text-[10px] text-lo flex items-center gap-1"><Clock size={9}/>{t.estimatedHours}h</span>}
                {t.dueDate && <span className="text-[10px] text-lo font-mono">{t.dueDate.slice(5)}</span>}
                <button onClick={()=>onDelete(t.id)} className="btn-icon opacity-0 group-hover:opacity-100"><X size={12}/></button>
              </div>
            )
          })}
        </div>
      )}

      {/* Completadas */}
      {done.length>0 && (
        <div>
          <p className="text-[11px] text-lo mb-2">Completadas ({done.length})</p>
          <div className="space-y-1 opacity-50">
            {done.map(t=>(
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 group">
                <button onClick={()=>onUpdate(t.id,{status:'todo',done:false})}
                  className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
                  style={{backgroundColor:ambito.color+'33',border:`1px solid ${ambito.color}66`}}>
                  <Check size={11} color={ambito.color} weight="bold"/>
                </button>
                <p className="text-[12px] text-lo line-through flex-1">{t.title}</p>
                <button onClick={()=>onDelete(t.id)} className="btn-icon opacity-0 group-hover:opacity-100"><X size={11}/></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Vista Semanal ─────────────────────────────────────────────────────────
function WeeklyView({ tasks, ambito }) {
  const [offset, setOffset] = useState(0)
  const days = useMemo(()=>{
    const base = weekDays()
    return base.map(d=>{
      const date = new Date(d+'T12:00')
      date.setDate(date.getDate() + offset*7)
      return ds(date)
    })
  },[offset])

  const DAY_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
  const projects = [...new Set(tasks.map(t=>t.project).filter(Boolean))]
  const PROJ_COLORS = ['#2cb99a','#e05c5c','#c9a227','#38bdf8','#a78bfa','#f97316','#ec4899']

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={()=>setOffset(o=>o-1)} className="btn-icon"><CaretLeft size={13}/></button>
        <span className="text-[13px] text-mid flex-1 text-center font-semibold">
          {offset===0?'Esta semana':offset===-1?'Semana pasada':`Hace ${Math.abs(offset)} semanas`}
        </span>
        <button onClick={()=>setOffset(o=>Math.min(0,o+1))} className="btn-icon" disabled={offset===0}>
          <CaretRight size={13}/>
        </button>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(7, minmax(80px, 1fr))', minWidth: 560 }}>
        {days.map((d,i)=>{
          const dayTasks = tasks.filter(t=>t.dueDate===d)
          const isToday  = d===today()
          return (
            <div key={d} className="rounded-xl p-2 min-h-[120px]"
              style={{backgroundColor:isToday?ambito.color+'10':'#0a0a0a',
                      border:`1px solid ${isToday?ambito.color+'40':'#1a1a1a'}`}}>
              <p className="text-[10px] font-bold mb-1" style={{color:isToday?ambito.color:'#555'}}>
                {DAY_LABELS[i]}<br/>
                <span className="font-mono text-[9px]">{d.slice(5)}</span>
              </p>
              <div className="space-y-1">
                {dayTasks.map(t=>{
                  const pi = projects.indexOf(t.project)
                  const c  = pi>=0 ? PROJ_COLORS[pi%PROJ_COLORS.length] : '#555'
                  return (
                    <div key={t.id} className="text-[9px] px-1.5 py-1 rounded-lg leading-tight truncate"
                      style={{backgroundColor:c+'18',color:c,border:`1px solid ${c}25`}}>
                      {t.title}
                    </div>
                  )
                })}
                {dayTasks.length===0 && <p className="text-[9px] text-lo/40 text-center mt-3">—</p>}
              </div>
            </div>
          )
        })}
      </div>
      </div>{/* overflow-x-auto */}

      {/* Leyenda proyectos */}
      {projects.length>0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {projects.map((p,i)=>(
            <span key={p} className="flex items-center gap-1 text-[10px]"
              style={{color:PROJ_COLORS[i%PROJ_COLORS.length]}}>
              <span className="w-2 h-2 rounded-full inline-block"
                style={{backgroundColor:PROJ_COLORS[i%PROJ_COLORS.length]}}/>
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pomodoro mejorado ─────────────────────────────────────────────────────
function PomodoroWidget({ tasks, ambito }) {
  const [secs, setSecs]         = useState(POMODORO_SECS)
  const [running, setRunning]   = useState(false)
  const [mode, setMode]         = useState('work') // 'work'|'short'|'long'
  const [count, setCount]       = useState(0)
  const [selTask, setSelTask]   = useState('')
  const [history, setHistory]   = useState(getPomHistory)
  const intervalRef = useRef(null)
  const audioRef    = useRef(null)

  const MODES = {
    work:  { label: 'Trabajo',        secs: POMODORO_SECS, color: ambito.color },
    short: { label: 'Descanso corto', secs: BREAK_SHORT,   color: '#38bdf8'   },
    long:  { label: 'Descanso largo', secs: BREAK_LONG,    color: '#a78bfa'   },
  }

  const totalSecs = MODES[mode].secs

  useEffect(()=>{
    if (running) {
      intervalRef.current = setInterval(()=>{
        setSecs(s=>{
          if (s<=1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode==='work') {
              const nc = count+1
              setCount(nc)
              const task = tasks.find(t=>t.id===selTask)
              const updated = addPomEntry(selTask, task?.title||'Sin tarea')
              setHistory(updated)
              // auto siguiente modo
              setMode(nc%4===0?'long':'short')
              setSecs(nc%4===0?BREAK_LONG:BREAK_SHORT)
            } else {
              setMode('work'); setSecs(POMODORO_SECS)
            }
            return 0
          }
          return s-1
        })
      },1000)
    } else clearInterval(intervalRef.current)
    return ()=>clearInterval(intervalRef.current)
  },[running, mode, count, selTask, tasks])

  const reset = () => { setRunning(false); setSecs(MODES[mode].secs) }
  const switchMode = (m) => { setRunning(false); setMode(m); setSecs(MODES[m].secs) }

  const mins = Math.floor(secs/60)
  const sec2 = secs%60
  const pct  = ((totalSecs-secs)/totalSecs)*100
  const modeColor = MODES[mode].color
  const circ = 2*Math.PI*48

  const todayPoms = history.filter(p=>p.date===today())

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="section-title">Pomodoro</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{backgroundColor:modeColor+'20',color:modeColor}}>{MODES[mode].label}</span>
      </div>

      {/* Selector modo */}
      <div className="flex gap-1">
        {Object.entries(MODES).map(([k,v])=>(
          <button key={k} onClick={()=>switchMode(k)}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
            style={mode===k?{backgroundColor:v.color+'20',color:v.color}:{color:'#444'}}>
            {k==='work'?'🍅':k==='short'?'☕':'🌙'} {v.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="relative w-28 h-28 mx-auto">
        <svg width={112} height={112} className="-rotate-90">
          <circle cx={56} cy={56} r={48} fill="none" stroke="#242424" strokeWidth={6}/>
          <circle cx={56} cy={56} r={48} fill="none" stroke={modeColor} strokeWidth={6}
            strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
            strokeLinecap="round" style={{transition:'stroke-dashoffset 1s linear'}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-bold font-mono text-hi leading-none">
            {String(mins).padStart(2,'0')}:{String(sec2).padStart(2,'0')}
          </span>
          {count>0 && <span className="text-[10px] text-lo mt-0.5">{count} 🍅</span>}
        </div>
      </div>

      {/* Tarea activa */}
      <select className="field-input text-[11px] py-1.5"
        value={selTask} onChange={e=>setSelTask(e.target.value)}>
        <option value="">Sin tarea asignada</option>
        {tasks.filter(t=>t.status!=='done').map(t=>(
          <option key={t.id} value={t.id}>{t.title}</option>
        ))}
      </select>

      {/* Controles */}
      <div className="flex gap-2 justify-center">
        <button onClick={()=>setRunning(r=>!r)}
          className="btn-primary flex items-center gap-1.5 text-[12px] flex-1">
          {running?<Pause size={13} weight="bold"/>:<Play size={13} weight="bold"/>}
          {running?'Pausar':'Iniciar'}
        </button>
        <button onClick={reset} className="btn-icon"><ArrowCounterClockwise size={15}/></button>
      </div>

      {/* Historial hoy */}
      {todayPoms.length>0 && (
        <div>
          <p className="text-[10px] text-lo mb-1.5">{todayPoms.length} pomodoros hoy</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {todayPoms.map(p=>(
              <div key={p.id} className="flex items-center gap-2 text-[10px]">
                <span>🍅</span>
                <span className="flex-1 text-lo truncate">{p.taskTitle||'Sin tarea'}</span>
                <span className="text-lo font-mono">{p.completedAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Jornada laboral ───────────────────────────────────────────────────────
function JornadaWidget({ ambito }) {
  const [sessions, setSessions] = useState(getWorkSessions)

  const todaySession = sessions.find(s=>s.date===today())
  const isActive     = todaySession && !todaySession.end

  const weekSessions = useMemo(()=>{
    const days = weekDays()
    return days.map(d=>{
      const s = sessions.find(x=>x.date===d)
      return { date:d, duration: s?.duration||0 }
    })
  },[sessions])

  const maxDur = Math.max(...weekSessions.map(s=>s.duration),1)
  const DAY_LABELS = ['L','M','X','J','V','S','D']

  return (
    <div className="card space-y-3">
      <p className="section-title">Jornada laboral</p>

      {/* Estado actual */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          {isActive ? (
            <div>
              <p className="text-[12px] text-hi font-semibold">🟢 Trabajando desde {todaySession.start}</p>
              <p className="text-[11px] text-lo">Haz click en "Terminar" cuando acabes</p>
            </div>
          ) : todaySession?.end ? (
            <div>
              <p className="text-[12px] text-hi">{todaySession.start} – {todaySession.end}</p>
              <p className="text-[12px] font-semibold" style={{color:ambito.color}}>
                {Math.floor(todaySession.duration/60)}h {todaySession.duration%60}min hoy
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-lo">Sin jornada registrada hoy</p>
          )}
        </div>
        <button
          onClick={()=>setSessions(isActive ? endWorkSession() : startWorkSession())}
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
          style={{backgroundColor:isActive?'#e05c5c18':'#2cb99a18',
                  color:isActive?'#e05c5c':'#2cb99a',
                  border:`1px solid ${isActive?'#e05c5c40':'#2cb99a40'}`}}>
          {isActive?'Terminar':'Iniciar'}
        </button>
      </div>

      {/* Gráfica semanal */}
      <div>
        <p className="text-[10px] text-lo mb-2">Horas esta semana</p>
        <div className="flex items-end gap-1 h-12">
          {weekSessions.map((s,i)=>(
            <div key={s.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm transition-all"
                style={{
                  height:`${Math.max(2,(s.duration/maxDur)*40)}px`,
                  backgroundColor: s.date===today() ? ambito.color : ambito.color+'44',
                }}/>
              <span className="text-[9px] text-lo">{DAY_LABELS[i]}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-lo mt-1 text-right">
          Total: {Math.floor(weekSessions.reduce((a,s)=>a+s.duration,0)/60)}h esta semana
        </p>
      </div>
    </div>
  )
}

// ── Notas de reunión ──────────────────────────────────────────────────────
function MeetingNotes({ tasks }) {
  const [notes, setNotes]     = useState(getMeetingNotes)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({ project:'', title:'', content:'' })
  const projects = [...new Set(tasks.map(t=>t.project).filter(Boolean))]

  const handleAdd = () => {
    if (!form.title.trim()) return
    setNotes(addMeetingNote(form))
    setForm({ project:'', title:'', content:'' })
    setShowAdd(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-hi">Notas de reunión</h3>
        <button onClick={()=>setShowAdd(v=>!v)} className="btn-primary flex items-center gap-1 py-1.5 text-[12px]">
          <Plus size={12} weight="bold"/> Nueva nota
        </button>
      </div>

      {showAdd && (
        <div className="card mb-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="field-label">Proyecto</span>
              <input className="field-input" placeholder="Proyecto" list="proj-list"
                value={form.project} onChange={e=>setForm(f=>({...f,project:e.target.value}))}/>
              <datalist id="proj-list">
                {projects.map(p=><option key={p} value={p}/>)}
              </datalist>
            </div>
            <div>
              <span className="field-label">Título de reunión</span>
              <input className="field-input" placeholder="Daily, Planning..." autoFocus
                value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            </div>
          </div>
          <div>
            <span className="field-label">Puntos / notas</span>
            <textarea className="field-input resize-none" rows={3}
              placeholder="- Punto 1&#10;- Punto 2&#10;- Acuerdos..."
              value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))}/>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-[12px]" onClick={()=>setShowAdd(false)}>Cancelar</button>
            <button className="btn-primary flex-1 text-[12px]" onClick={handleAdd}>Guardar</button>
          </div>
        </div>
      )}

      {notes.length===0 ? (
        <div className="card py-8 text-center text-lo text-[13px]">Sin notas de reunión aún.</div>
      ) : (
        <div className="space-y-2">
          {notes.map(n=>(
            <div key={n.id} className="card group hover:border-border-2 transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div>
                  {n.project && <span className="text-[10px] text-lo font-semibold">{n.project} · </span>}
                  <span className="text-[10px] text-lo">{n.date}</span>
                </div>
                <button onClick={()=>setNotes(deleteMeetingNote(n.id))}
                  className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                  <Trash size={11}/>
                </button>
              </div>
              <p className="text-[13px] font-semibold text-hi mb-1">{n.title}</p>
              {n.content && <p className="text-[12px] text-lo leading-relaxed whitespace-pre-wrap">{n.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal nueva tarea ─────────────────────────────────────────────────────
function AddTaskModal({ onAdd, onClose, projects }) {
  const [form, setForm] = useState({
    project:'', title:'', priority:'media', status:'todo',
    dueDate:'', estimatedHours:'', tags:[]
  })

  const toggleTag = (tg) => setForm(f=>({
    ...f, tags: f.tags.includes(tg) ? f.tags.filter(t=>t!==tg) : [...f.tags,tg]
  }))

  return (
    <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-card border border-border-2 rounded-2xl w-[440px] shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-hi text-[15px]">Nueva tarea</h3>
          <button className="btn-icon" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="field-label">Proyecto</span>
              <input className="field-input" placeholder="Ej: App personal" list="proj-list2"
                value={form.project} onChange={e=>setForm(f=>({...f,project:e.target.value}))}/>
              <datalist id="proj-list2">
                {projects.map(p=><option key={p} value={p}/>)}
              </datalist>
            </div>
            <div>
              <span className="field-label">Estado inicial</span>
              <select className="field-input" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {COLUMNS.map(c=><option key={c.k} value={c.k}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <span className="field-label">Tarea</span>
            <input className="field-input" autoFocus placeholder="¿Qué hay que hacer?"
              value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&form.title.trim()&&onAdd(form)}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <span className="field-label">Prioridad</span>
              <select className="field-input" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                {['alta','media','baja'].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <span className="field-label">Estimado (h)</span>
              <input type="number" className="field-input" placeholder="1.5" min={0} step={0.5}
                value={form.estimatedHours} onChange={e=>setForm(f=>({...f,estimatedHours:e.target.value}))}/>
            </div>
            <div>
              <span className="field-label">Fecha</span>
              <input type="date" className="field-input"
                value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
            </div>
          </div>
          <div>
            <span className="field-label">Etiquetas</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {TASK_TAGS.map(tg=>(
                <button key={tg} onClick={()=>toggleTag(tg)}
                  className="text-[11px] px-2 py-1 rounded-full transition-all"
                  style={form.tags.includes(tg)
                    ?{backgroundColor:'#2cb99a20',color:'#2cb99a',border:'1px solid #2cb99a40'}
                    :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                  {tg}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1" onClick={()=>onAdd(form)}>Agregar tarea</button>
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────
const VIEWS = ['Lista','Kanban','Semana','Reuniones']
const VIEW_ICONS = { Lista: Briefcase, Kanban: Kanban, Semana: CalendarBlank, Reuniones: NotePencil }

export default function TrabajoView({ ambito }) {
  const habits = getHabits()
  const [tasks,   setTasks]   = useState(getWorkTasks)
  const [view,    setView]    = useState('Lista')
  const [showAdd, setShowAdd] = useState(false)

  const projects = [...new Set(tasks.map(t=>t.project).filter(Boolean))]

  const handleAdd    = (form) => {
    if (!form.title.trim()) return
    setTasks(addWorkTask({ ...form, estimatedHours: Number(form.estimatedHours)||0 }))
    setShowAdd(false)
  }
  const handleUpdate = (id, changes) => setTasks(updateWorkTask(id, changes))
  const handleDelete = id => setTasks(deleteWorkTask(id))

  // Métricas resumen
  const pending  = tasks.filter(t=>t.status!=='done').length
  const done     = tasks.filter(t=>t.status==='done').length
  const totalEst = tasks.filter(t=>t.status!=='done').reduce((a,t)=>a+(t.estimatedHours||0),0)

  return (
    <div className="min-h-screen">
      <AmbitoHeader ambito={ambito} habits={habits}/>

      <div className="p-3 md:p-6">
        {/* Nav vistas */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
            <div className="flex gap-1 bg-black/30 rounded-xl p-1 w-max min-w-full">
              {VIEWS.map(v=>{
                const Icon = VIEW_ICONS[v]
                return (
                  <button key={v} onClick={()=>setView(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap"
                    style={view===v?{backgroundColor:ambito.color+'20',color:ambito.color}:{color:'#555'}}>
                    <Icon size={12}/>{v}
                  </button>
                )
              })}
            </div>
          </div>
          {view!=='Reuniones' && (
            <button onClick={()=>setShowAdd(true)} className="btn-primary shrink-0 flex items-center gap-1 py-1.5 px-3 text-[12px]">
              <Plus size={13} weight="bold"/> Tarea
            </button>
          )}
        </div>

        <div className="flex flex-col md:grid md:grid-cols-[1fr_220px] gap-4 md:gap-5 items-start">
          {/* Vista principal */}
          <div className="w-full min-w-0">
            {view==='Lista'     && <ListView     tasks={tasks} ambito={ambito} onUpdate={handleUpdate} onDelete={handleDelete}/>}
            {view==='Kanban'    && <KanbanBoard  tasks={tasks} ambito={ambito} onUpdate={handleUpdate} onDelete={handleDelete}/>}
            {view==='Semana'    && <WeeklyView   tasks={tasks} ambito={ambito}/>}
            {view==='Reuniones' && <MeetingNotes tasks={tasks}/>}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 w-full md:w-auto">
            {/* Resumen */}
            <div className="card">
              <p className="section-title">Resumen</p>
              <div className="space-y-2">
                {[
                  ['Pendientes',  pending,           '#c9a227'],
                  ['Completadas', done,               ambito.color],
                  ['Proyectos',   projects.length,    '#aaa'],
                  ['Horas est.',  `${totalEst}h`,     '#38bdf8'],
                ].map(([l,v,c])=>(
                  <div key={l} className="flex justify-between text-[12px]">
                    <span className="text-lo">{l}</span>
                    <span className="font-mono font-semibold" style={{color:c}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pomodoro */}
            <PomodoroWidget tasks={tasks} ambito={ambito}/>

            {/* Jornada */}
            <JornadaWidget ambito={ambito}/>
          </div>
        </div>
      </div>

      {showAdd && <AddTaskModal onAdd={handleAdd} onClose={()=>setShowAdd(false)} projects={projects}/>}
    </div>
  )
}
