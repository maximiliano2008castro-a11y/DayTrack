import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus, X, Clock, Play, Pause, ArrowCounterClockwise, FloppyDisk,
  PencilSimple, Check, MagnifyingGlass, Link, Note, Trash, Fire,
  Star, ListChecks, ChartPie, Target, Sparkle, Palette, Timer, Trophy,
} from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits,
  getHobbyProjects, addHobbyProject, updateHobbyProject, deleteHobbyProject,
  getHobbyLog, addHobbySession,
  getHobbyWishlist, addHobbyWish, updateHobbyWish, deleteHobbyWish,
  getHobbyGoals, addHobbyGoal, deleteHobbyGoal,
} from '../../store'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, Legend,
} from 'recharts'

// ── Constantes ─────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)

const STATUSES = [
  { k:'idea',       label:'Idea',        color:'#888'    },
  { k:'activo',     label:'En progreso', color:'#c9a227' },
  { k:'terminado',  label:'Terminado',   color:'#4cae8a' },
  { k:'pausado',    label:'Pausado',     color:'#5b84e8' },
]

const HOBBY_EMOJIS = ['🎨','🎸','🎮','📚','🏋️','🎯','🎭','📷','🎵','🌱','🍳','✍️','🧩','🏊','🚴','🎲','🎻','🖥️','🎬','🧶','🏄','🎤','🎹','🦾']

const PRIORITIES = [
  { k:'alta',  label:'Alta',  color:'#e05c5c' },
  { k:'media', label:'Media', color:'#c9a227' },
  { k:'baja',  label:'Baja',  color:'#888'    },
]

const HOBBY_COLORS = ['#a07fcf','#2cb99a','#c9a227','#5b84e8','#d4608a','#e05c5c','#4cae8a','#f97316']

function fmtTime(mins) {
  if (!mins) return '0h'
  const h = Math.floor(mins/60)
  const m = mins%60
  if (h===0) return `${m}m`
  if (m===0) return `${h}h`
  return `${h}h ${m}m`
}

// Racha de práctica de un proyecto
function calcStreak(projectId, log) {
  const sessions = [...log.filter(s=>s.projectId===projectId)]
    .sort((a,b)=>b.date.localeCompare(a.date))
  if (!sessions.length) return 0
  let streak = 0
  let cur    = new Date(todayStr()+'T12:00')
  for (const s of sessions) {
    const d = new Date(s.date+'T12:00')
    const diff = Math.round((cur-d)/86400000)
    if (diff === streak) streak++
    else if (diff > streak+1) break
  }
  return streak
}

// ── Modal proyecto ─────────────────────────────────────────────────────────
function ProjectModal({ project, onSave, onClose, ambito }) {
  const [form, setForm] = useState(project || {
    name:'', emoji:'🎨', status:'activo', hobby:'', color:ambito.color,
    description:'', phases:[], resources:[], progress:0,
  })
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [newPhase,  setNewPhase]  = useState('')
  const [newRes,    setNewRes]    = useState({ label:'', url:'' })
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  const addPhase = () => {
    if (!newPhase.trim()) return
    upd('phases',[...(form.phases||[]),{ id:Date.now().toString(), label:newPhase.trim(), done:false }])
    setNewPhase('')
  }
  const togglePhase = (id) => upd('phases',form.phases.map(p=>p.id===id?{...p,done:!p.done}:p))
  const removePhase = (id) => upd('phases',form.phases.filter(p=>p.id!==id))
  const addRes = () => {
    if (!newRes.label.trim()) return
    upd('resources',[...(form.resources||[]),{ id:Date.now().toString(),...newRes }])
    setNewRes({ label:'', url:'' })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-lg border border-border flex flex-col"
        style={{maxHeight:'88vh'}}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="font-semibold text-hi">{project?'Editar proyecto':'Nuevo proyecto'}</p>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X size={14}/></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Emoji + nombre + hobby */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={()=>setEmojiOpen(v=>!v)}
                className="w-14 h-14 rounded-2xl text-[26px] flex items-center justify-center"
                style={{backgroundColor:ambito.color+'15',border:`1px solid ${ambito.color}30`}}>
                {form.emoji}
              </button>
              {emojiOpen && (
                <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl p-2
                  grid grid-cols-6 gap-1 z-10 shadow-xl w-48">
                  {HOBBY_EMOJIS.map(e=>(
                    <button key={e} onClick={()=>{upd('emoji',e);setEmojiOpen(false)}}
                      className="w-7 h-7 text-[16px] rounded-lg hover:bg-white/5 flex items-center justify-center">
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input className="field-input text-[13px] font-semibold w-full"
                placeholder="Nombre del proyecto *"
                value={form.name} onChange={e=>upd('name',e.target.value)}/>
              <input className="field-input text-[12px] w-full"
                placeholder="Hobby (ej: Guitarra, Pintura...)"
                value={form.hobby||''} onChange={e=>upd('hobby',e.target.value)}/>
            </div>
          </div>

          {/* Color */}
          <div>
            <span className="field-label">Color</span>
            <div className="flex gap-2 mt-1">
              {HOBBY_COLORS.map(c=>(
                <button key={c} onClick={()=>upd('color',c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{backgroundColor:c,
                          border:form.color===c?`2px solid white`:`2px solid transparent`}}/>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <span className="field-label">Estado</span>
            <div className="flex gap-2 mt-1">
              {STATUSES.map(s=>(
                <button key={s.k} onClick={()=>upd('status',s.k)}
                  className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                  style={form.status===s.k
                    ?{backgroundColor:s.color+'22',color:s.color,border:`1px solid ${s.color}44`}
                    :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progreso manual */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="field-label">Progreso</span>
              <span className="text-[12px] font-mono font-bold" style={{color:form.color||ambito.color}}>
                {form.progress||0}%
              </span>
            </div>
            <input type="range" min={0} max={100} step={5}
              value={form.progress||0} onChange={e=>upd('progress',Number(e.target.value))}
              className="w-full accent-violet-500 h-1.5"/>
          </div>

          {/* Descripción */}
          <div>
            <span className="field-label">Descripción / notas</span>
            <textarea className="field-input mt-1 resize-none text-[12px]" rows={2}
              placeholder="Qué es este proyecto, qué quieres lograr..."
              value={form.description||''} onChange={e=>upd('description',e.target.value)}/>
          </div>

          {/* Fases */}
          <div>
            <span className="field-label">Fases / etapas</span>
            <div className="space-y-1.5 mt-1 mb-2">
              {(form.phases||[]).map(p=>(
                <div key={p.id} className="flex items-center gap-2">
                  <button onClick={()=>togglePhase(p.id)}
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                    style={p.done?{backgroundColor:ambito.color,border:`1px solid ${ambito.color}`}
                               :{border:'1px solid #333',backgroundColor:'transparent'}}>
                    {p.done && <Check size={9} color="white" weight="bold"/>}
                  </button>
                  <span className={`flex-1 text-[12px] ${p.done?'line-through text-lo':'text-mid'}`}>{p.label}</span>
                  <button onClick={()=>removePhase(p.id)} className="text-lo hover:text-red-400">
                    <X size={10}/>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 field-input text-[11px] py-1.5" placeholder="Nueva etapa..."
                value={newPhase} onChange={e=>setNewPhase(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addPhase()}/>
              <button onClick={addPhase} className="btn-icon w-8 h-8"><Plus size={11}/></button>
            </div>
          </div>

          {/* Recursos */}
          <div>
            <span className="field-label">Recursos / links</span>
            <div className="space-y-1.5 mt-1 mb-2">
              {(form.resources||[]).map(r=>(
                <div key={r.id} className="flex items-center gap-2">
                  <Link size={10} className="text-lo shrink-0"/>
                  <span className="flex-1 text-[11px] text-mid truncate">{r.label}</span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-lo hover:text-mid transition-colors">↗</a>
                  )}
                  <button onClick={()=>upd('resources',form.resources.filter(x=>x.id!==r.id))}
                    className="text-lo hover:text-red-400"><X size={10}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 field-input text-[11px] py-1.5" placeholder="Nombre del recurso"
                value={newRes.label} onChange={e=>setNewRes(r=>({...r,label:e.target.value}))}/>
              <input className="w-28 field-input text-[11px] py-1.5" placeholder="URL (opcional)"
                value={newRes.url} onChange={e=>setNewRes(r=>({...r,url:e.target.value}))}/>
              <button onClick={addRes} className="btn-icon w-8 h-8"><Plus size={11}/></button>
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 shrink-0">
          <button onClick={()=>form.name.trim()&&onSave(form)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <FloppyDisk size={15}/> Guardar proyecto
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Proyectos ─────────────────────────────────────────────────────────
function ProyectosTab({ ambito }) {
  const [projects,  setProjects]  = useState(getHobbyProjects)
  const [log,       setLog]       = useState(getHobbyLog)
  const [modal,     setModal]     = useState(null)
  const [statusF,   setStatusF]   = useState('all')
  const [hobbyF,    setHobbyF]    = useState('all')
  const [timerPid,  setTimerPid]  = useState(null)
  const [timerSecs, setTimerSecs] = useState(0)
  const [running,   setRunning]   = useState(false)
  const [timerNote, setTimerNote] = useState('')
  const intervalRef = useRef(null)

  // Timer
  useEffect(()=>{
    if (running) {
      intervalRef.current = setInterval(()=>setTimerSecs(s=>s+1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return ()=>clearInterval(intervalRef.current)
  },[running])

  const startTimer = (pid) => {
    if (timerPid && timerPid!==pid && running) stopTimer()
    setTimerPid(pid); setRunning(true)
  }
  const pauseTimer = () => setRunning(false)
  const stopTimer  = () => {
    setRunning(false)
    const mins = Math.round(timerSecs/60)
    if (mins>0 && timerPid) {
      const newLog = addHobbySession(timerPid, mins, timerNote)
      setLog(newLog)
      setProjects(getHobbyProjects())
    }
    setTimerSecs(0); setTimerPid(null); setTimerNote('')
  }

  const hobbies = [...new Set(projects.map(p=>p.hobby).filter(Boolean))]
  const filtered = projects.filter(p=>{
    const matchS = statusF==='all' || p.status===statusF
    const matchH = hobbyF==='all' || p.hobby===hobbyF
    return matchS && matchH
  })

  const handleSave = (form) => {
    if (modal && modal.id) setProjects(updateHobbyProject(modal.id, form))
    else setProjects(addHobbyProject(form))
    setModal(null)
  }

  const timerMins = Math.floor(timerSecs/60)
  const timerSec2 = timerSecs%60

  return (
    <div className="space-y-4">
      {/* Timer activo */}
      {timerPid && (
        <div className="rounded-2xl px-5 py-3 flex items-center gap-4"
          style={{background:`linear-gradient(135deg,${ambito.color}18,${ambito.color}08)`,
                  border:`1px solid ${ambito.color}30`}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]"
            style={{backgroundColor:ambito.color+'15'}}>
            <Timer size={16}/>
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-lo">Sesión activa — {projects.find(p=>p.id===timerPid)?.name}</p>
            <p className="text-[22px] font-bold font-mono text-hi">
              {String(timerMins).padStart(2,'0')}:{String(timerSec2).padStart(2,'0')}
            </p>
          </div>
          <input className="flex-1 field-input text-[11px] py-1.5 max-w-xs"
            placeholder="Nota de sesión (opcional)..."
            value={timerNote} onChange={e=>setTimerNote(e.target.value)}/>
          <div className="flex gap-2 shrink-0">
            <button onClick={running?pauseTimer:()=>setRunning(true)} className="btn-icon w-9 h-9">
              {running?<Pause size={15}/>:<Play size={15}/>}
            </button>
            <button onClick={stopTimer}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold"
              style={{backgroundColor:ambito.color+'20',color:ambito.color,border:`1px solid ${ambito.color}40`}}>
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={()=>setModal('new')}
          className="btn-primary flex items-center gap-2 px-4 text-[12px]">
          <Plus size={13} weight="bold"/> Nuevo proyecto
        </button>
        <select className="field-input text-[12px] w-40"
          value={statusF} onChange={e=>setStatusF(e.target.value)}>
          <option value="all">Todos los estados</option>
          {STATUSES.map(s=><option key={s.k} value={s.k}>{s.label}</option>)}
        </select>
        {hobbies.length>0 && (
          <select className="field-input text-[12px] w-40"
            value={hobbyF} onChange={e=>setHobbyF(e.target.value)}>
            <option value="all">Todos los hobbies</option>
            {hobbies.map(h=><option key={h} value={h}>{h}</option>)}
          </select>
        )}
      </div>

      {filtered.length===0
        ? <div className="card py-12 text-center text-lo text-[13px]">
            Sin proyectos aún. ¡Crea el primero!
          </div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(p=>{
              const status   = STATUSES.find(s=>s.k===p.status)||STATUSES[1]
              const streak   = calcStreak(p.id, log)
              const phases   = p.phases||[]
              const doneP    = phases.filter(x=>x.done).length
              const phasePct = phases.length ? Math.round((doneP/phases.length)*100) : (p.progress||0)
              const color    = p.color||ambito.color
              const isTimer  = timerPid===p.id

              return (
                <div key={p.id} className="card space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl text-[24px] flex items-center justify-center shrink-0"
                        style={{backgroundColor:color+'18'}}>
                        <Palette size={16}/>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-hi leading-tight">{p.name}</p>
                        {p.hobby && <p className="text-[11px] text-lo">{p.hobby}</p>}
                        <span className="text-[10px] px-2 py-0.5 rounded-full mt-0.5 inline-block"
                          style={{backgroundColor:status.color+'15',color:status.color}}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={()=>setModal(p)} className="btn-icon w-7 h-7">
                        <PencilSimple size={11} className="text-lo"/>
                      </button>
                      <button onClick={()=>setProjects(deleteHobbyProject(p.id))}
                        className="btn-icon w-7 h-7 hover:bg-red-500/10">
                        <X size={11} className="text-lo"/>
                      </button>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-lo">
                        {phases.length ? `${doneP}/${phases.length} fases` : 'Progreso'}
                      </span>
                      <span className="text-[10px] font-mono font-bold" style={{color}}>{phasePct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{backgroundColor:color+'18'}}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{width:`${phasePct}%`,backgroundColor:color}}/>
                    </div>
                  </div>

                  {/* Fases mini */}
                  {phases.length>0 && (
                    <div className="space-y-1">
                      {phases.slice(0,4).map(ph=>(
                        <div key={ph.id} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded flex items-center justify-center shrink-0"
                            style={ph.done?{backgroundColor:color}:{border:'1px solid #333'}}>
                            {ph.done && <Check size={7} color="white" weight="bold"/>}
                          </div>
                          <span className={`text-[11px] ${ph.done?'line-through text-lo':'text-mid'}`}>{ph.label}</span>
                        </div>
                      ))}
                      {phases.length>4 && (
                        <p className="text-[10px] text-lo pl-4">+{phases.length-4} más...</p>
                      )}
                    </div>
                  )}

                  {/* Stats + timer */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="flex-1">
                      <p className="text-[11px] font-mono font-bold text-hi">{fmtTime(p.totalMinutes||0)}</p>
                      <p className="text-[9px] text-lo">tiempo total</p>
                    </div>
                    {streak>0 && (
                      <div className="flex items-center gap-1">
                        <Fire size={12} color="#f97316" weight="fill"/>
                        <span className="text-[11px] font-bold text-hi">{streak}</span>
                        <span className="text-[9px] text-lo">días</span>
                      </div>
                    )}
                    {p.resources?.length>0 && (
                      <div className="flex items-center gap-1 text-lo">
                        <Link size={11}/><span className="text-[10px]">{p.resources.length}</span>
                      </div>
                    )}
                    <button
                      onClick={()=> isTimer&&running ? pauseTimer() : isTimer ? setRunning(true) : startTimer(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                      style={isTimer
                        ?{backgroundColor:color+'22',color,border:`1px solid ${color}44`}
                        :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                      {isTimer&&running?<Pause size={11}/>:<Play size={11}/>}
                      {isTimer?(running?'Pausar':'Reanudar'):'Iniciar'}
                    </button>
                  </div>

                  {p.description && (
                    <p className="text-[11px] text-lo leading-snug line-clamp-2">{p.description}</p>
                  )}
                </div>
              )
            })}
          </div>
      }

      {modal && (
        <ProjectModal
          project={modal==='new'?null:modal}
          onSave={handleSave}
          onClose={()=>setModal(null)}
          ambito={ambito}/>
      )}
    </div>
  )
}

// ── Tab: Tiempo ────────────────────────────────────────────────────────────
function TiempoTab({ ambito }) {
  const projects = useMemo(()=>getHobbyProjects(),[])
  const log      = useMemo(()=>getHobbyLog(),[])

  // Distribución total por proyecto (PieChart)
  const pieData = projects
    .filter(p=>(p.totalMinutes||0)>0)
    .map((p,i)=>({ name:p.name, value:p.totalMinutes||0, color:p.color||HOBBY_COLORS[i%HOBBY_COLORS.length] }))

  // Últimas 4 semanas (BarChart)
  const weekData = useMemo(()=>{
    return Array.from({length:4},(_,i)=>{
      const end   = new Date(); end.setDate(end.getDate() - i*7)
      const start = new Date(end); start.setDate(end.getDate()-6)
      const endS  = end.toISOString().slice(0,10)
      const startS= start.toISOString().slice(0,10)
      const label = `S-${i===0?'actual':i}`
      const byProj = {}
      log.filter(s=>s.date>=startS&&s.date<=endS).forEach(s=>{
        byProj[s.projectId] = (byProj[s.projectId]||0) + s.minutes
      })
      const entry = { label }
      projects.forEach(p=>{ if ((byProj[p.id]||0)>0) entry[p.name]=Math.round((byProj[p.id]||0)/60*10)/10 })
      return entry
    }).reverse()
  },[log, projects])

  // Sesiones recientes
  const recent = log.slice(0,15)

  // Rachas
  const streaks = projects
    .map(p=>({ ...p, streak: calcStreak(p.id, log) }))
    .filter(p=>p.streak>0)
    .sort((a,b)=>b.streak-a.streak)

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      <div className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label:'Tiempo total',   val:fmtTime(projects.reduce((a,p)=>a+(p.totalMinutes||0),0)), color:ambito.color },
            { label:'Esta semana',    val:fmtTime(log.filter(s=>s.date>=new Date(Date.now()-6*864e5).toISOString().slice(0,10)).reduce((a,s)=>a+s.minutes,0)), color:'#c9a227' },
            { label:'Sesiones',       val:log.length, color:'#5b84e8' },
          ].map(s=>(
            <div key={s.label} className="card text-center py-4">
              <p className="text-[24px] font-bold font-mono" style={{color:s.color}}>{s.val}</p>
              <p className="text-[10px] text-lo mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Gráfica semanal */}
        {weekData.some(w=>Object.keys(w).length>1) && (
          <div className="card">
            <p className="section-title mb-3">Horas por hobby — últimas 4 semanas</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekData} barSize={16}>
                <XAxis dataKey="label" tick={{fill:'#555',fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
                  formatter={v=>[`${v}h`,'']}/>
                <Legend wrapperStyle={{fontSize:10,paddingTop:8}}/>
                {projects.filter(p=>(p.totalMinutes||0)>0).map((p,i)=>(
                  <Bar key={p.id} dataKey={p.name}
                    fill={p.color||HOBBY_COLORS[i%HOBBY_COLORS.length]}
                    fillOpacity={0.8} radius={[3,3,0,0]} stackId="a"/>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sesiones recientes */}
        <div className="card">
          <p className="section-title mb-3">Sesiones recientes</p>
          {recent.length===0
            ? <p className="text-[12px] text-lo text-center py-4">Sin sesiones registradas. Usa el temporizador en Proyectos.</p>
            : <div className="space-y-2">
                {recent.map(s=>{
                  const p = projects.find(x=>x.id===s.projectId)
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className="text-[18px]"><Timer size={18}/></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-hi truncate">{p?.name||'Proyecto eliminado'}</p>
                        {s.note && <p className="text-[10px] text-lo truncate">{s.note}</p>}
                      </div>
                      <span className="text-[11px] font-mono text-lo shrink-0">{s.date}</span>
                      <span className="text-[11px] font-mono font-bold shrink-0"
                        style={{color:p?.color||ambito.color}}>
                        {fmtTime(s.minutes)}
                      </span>
                    </div>
                  )
                })}
              </div>
          }
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* PieChart */}
        {pieData.length>0 && (
          <div className="card">
            <p className="section-title mb-2">Distribución total</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.color} fillOpacity={0.85}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
                  formatter={v=>[fmtTime(v),'']}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {pieData.map(e=>(
                <div key={e.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor:e.color}}/>
                  <span className="text-[11px] text-mid flex-1 truncate">{e.name}</span>
                  <span className="text-[11px] font-mono text-lo shrink-0">{fmtTime(e.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rachas */}
        {streaks.length>0 && (
          <div className="card">
            <p className="section-title mb-3 flex items-center gap-1"><Fire size={13}/>Rachas activas</p>
            <div className="space-y-2">
              {streaks.map(p=>(
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-[16px]"><Palette size={16}/></span>
                  <p className="text-[12px] font-medium text-hi flex-1 truncate">{p.name}</p>
                  <span className="text-[12px] font-bold font-mono" style={{color:'#f97316'}}>
                    {p.streak}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Wishlist ──────────────────────────────────────────────────────────
function WishlistTab({ ambito }) {
  const [wishes, setWishes] = useState(getHobbyWishlist)
  const [form,   setForm]   = useState({ title:'', category:'', priority:'media', budget:'', notes:'' })
  const [showF,  setShowF]  = useState(false)
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  const pending = wishes.filter(w=>!w.done)
  const done    = wishes.filter(w=>w.done)

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="section-title mb-0">Wishlist de hobbies</p>
          <button onClick={()=>setShowF(v=>!v)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-[12px]">
            <Plus size={12} weight="bold"/> Añadir
          </button>
        </div>

        {showF && (
          <div className="card space-y-3">
            <input className="field-input text-[12px]" placeholder="¿Qué quieres aprender o hacer? *"
              value={form.title} onChange={e=>upd('title',e.target.value)}/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="field-input text-[12px]" placeholder="Categoría (ej: Música, Arte)"
                value={form.category} onChange={e=>upd('category',e.target.value)}/>
              <input className="field-input text-[12px]" placeholder="Presupuesto estimado"
                value={form.budget} onChange={e=>upd('budget',e.target.value)}/>
            </div>
            <div>
              <span className="field-label">Prioridad</span>
              <div className="flex gap-2 mt-1">
                {PRIORITIES.map(p=>(
                  <button key={p.k} onClick={()=>upd('priority',p.k)}
                    className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                    style={form.priority===p.k
                      ?{backgroundColor:p.color+'22',color:p.color,border:`1px solid ${p.color}44`}
                      :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea className="field-input resize-none text-[12px]" rows={2}
              placeholder="Notas adicionales..."
              value={form.notes} onChange={e=>upd('notes',e.target.value)}/>
            <button onClick={()=>{
              if(!form.title.trim()) return
              setWishes(addHobbyWish(form))
              setForm({ title:'', category:'', priority:'media', budget:'', notes:'' })
              setShowF(false)
            }} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              <FloppyDisk size={14}/> Guardar
            </button>
          </div>
        )}

        {/* Pendientes */}
        {pending.length===0&&!showF
          ? <div className="card py-10 text-center text-lo text-[13px]">
              Sin items en la wishlist. ¡Añade cosas que quieras aprender!
            </div>
          : pending.map(w=>{
            const pri = PRIORITIES.find(p=>p.k===w.priority)||PRIORITIES[1]
            return (
              <div key={w.id} className="card flex items-start gap-3">
                <button onClick={()=>setWishes(updateHobbyWish(w.id,{done:true}))}
                  className="w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition-all"
                  style={{border:`1.5px solid ${ambito.color}40`,backgroundColor:'transparent'}}>
                  <Check size={11} style={{color:ambito.color+'40'}}/>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-hi">{w.title}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {w.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{backgroundColor:ambito.color+'12',color:ambito.color}}>
                        {w.category}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{backgroundColor:pri.color+'15',color:pri.color}}>
                      {pri.label}
                    </span>
                    {w.budget && (
                      <span className="text-[10px] text-lo">💰 {w.budget}</span>
                    )}
                  </div>
                  {w.notes && <p className="text-[11px] text-lo mt-1">{w.notes}</p>}
                </div>
                <button onClick={()=>setWishes(deleteHobbyWish(w.id))}
                  className="text-lo hover:text-red-400 transition-colors shrink-0">
                  <X size={12}/>
                </button>
              </div>
            )
          })
        }

        {/* Completados */}
        {done.length>0 && (
          <div>
            <p className="text-[10px] text-lo uppercase tracking-wider font-semibold mb-2">✅ Completados</p>
            {done.map(w=>(
              <div key={w.id} className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1.5"
                style={{backgroundColor:'#4cae8a10'}}>
                <Check size={12} color="#4cae8a" weight="bold"/>
                <span className="text-[12px] line-through text-lo flex-1">{w.title}</span>
                <button onClick={()=>setWishes(deleteHobbyWish(w.id))}
                  className="text-lo hover:text-red-400">
                  <X size={10}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div className="card">
          <p className="section-title mb-3">Resumen</p>
          {[
            { label:'Pendientes', val:pending.length, color:ambito.color },
            { label:'Completados', val:done.length,   color:'#4cae8a'   },
            { label:'Alta prioridad', val:pending.filter(w=>w.priority==='alta').length, color:'#e05c5c' },
          ].map(s=>(
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-[12px] text-lo">{s.label}</span>
              <span className="text-[16px] font-bold font-mono" style={{color:s.color}}>{s.val}</span>
            </div>
          ))}
        </div>
        {/* Por categoría */}
        {(() => {
          const cats = [...new Set(wishes.filter(w=>w.category).map(w=>w.category))]
          if (!cats.length) return null
          return (
            <div className="card">
              <p className="section-title mb-3">Por categoría</p>
              {cats.map(c=>(
                <div key={c} className="flex items-center justify-between py-1.5">
                  <span className="text-[12px] text-mid">{c}</span>
                  <span className="text-[11px] font-mono text-lo">
                    {wishes.filter(w=>w.category===c&&!w.done).length} pendientes
                  </span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── Tab: Metas ─────────────────────────────────────────────────────────────
function MetasTab({ ambito }) {
  const [goals,   setGoals]   = useState(getHobbyGoals)
  const [showF,   setShowF]   = useState(false)
  const [form,    setForm]    = useState({ title:'', projectId:'', type:'horas', target:10, period:'mes', unit:'horas' })
  const projects = useMemo(()=>getHobbyProjects(),[])
  const log      = useMemo(()=>getHobbyLog(),[])
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  const calcGoalProgress = (g) => {
    const now = new Date()
    let since
    if (g.period==='semana')    { since=new Date(now); since.setDate(now.getDate()-7) }
    else if (g.period==='mes')  { since=new Date(now.getFullYear(),now.getMonth(),1) }
    else if (g.period==='año')  { since=new Date(now.getFullYear(),0,1) }
    else                        { since=new Date(0) }
    const sinceStr = since.toISOString().slice(0,10)

    const filtered = log.filter(s=>s.date>=sinceStr && (!g.projectId||s.projectId===g.projectId))
    let val = 0
    if (g.unit==='horas')   val = Math.round(filtered.reduce((a,s)=>a+s.minutes,0)/60*10)/10
    if (g.unit==='sesiones') val = filtered.length
    if (g.unit==='días')    val = new Set(filtered.map(s=>s.date)).size
    const pct = Math.min(100, Math.round((val/g.target)*100))
    return { val, pct }
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="section-title mb-0">Metas de hobby</p>
          <button onClick={()=>setShowF(v=>!v)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-[12px]">
            <Plus size={12} weight="bold"/> Nueva meta
          </button>
        </div>

        {showF && (
          <div className="card space-y-3">
            <input className="field-input text-[12px]" placeholder='Ej: "Practicar guitarra 30 min/día" *'
              value={form.title} onChange={e=>upd('title',e.target.value)}/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="field-label">Proyecto (opcional)</span>
                <select className="field-input mt-1 text-[12px]"
                  value={form.projectId} onChange={e=>upd('projectId',e.target.value)}>
                  <option value="">Todos los proyectos</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                </select>
              </div>
              <div>
                <span className="field-label">Período</span>
                <select className="field-input mt-1 text-[12px]"
                  value={form.period} onChange={e=>upd('period',e.target.value)}>
                  <option value="semana">Semana</option>
                  <option value="mes">Mes</option>
                  <option value="año">Año</option>
                  <option value="siempre">Total acumulado</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="field-label">Meta</span>
                <input type="number" min={1} className="field-input mt-1 text-[12px]"
                  value={form.target} onChange={e=>upd('target',Number(e.target.value))}/>
              </div>
              <div className="flex-1">
                <span className="field-label">Unidad</span>
                <select className="field-input mt-1 text-[12px]"
                  value={form.unit} onChange={e=>upd('unit',e.target.value)}>
                  <option value="horas">horas</option>
                  <option value="sesiones">sesiones</option>
                  <option value="días">días activos</option>
                </select>
              </div>
            </div>
            <button onClick={()=>{
              if(!form.title.trim()) return
              setGoals(addHobbyGoal(form))
              setForm({ title:'', projectId:'', type:'horas', target:10, period:'mes', unit:'horas' })
              setShowF(false)
            }} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              <Target size={14}/> Crear meta
            </button>
          </div>
        )}

        {goals.length===0&&!showF
          ? <div className="card py-12 text-center text-lo text-[13px]">
              <Target size={30} className="mx-auto mb-2 opacity-20"/>
              Sin metas de hobby. ¡Define una!
            </div>
          : goals.map(g=>{
            const { val, pct } = calcGoalProgress(g)
            const proj = g.projectId ? projects.find(p=>p.id===g.projectId) : null
            const color = proj?.color || ambito.color
            return (
              <div key={g.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[13px] font-semibold text-hi">{g.title}</p>
                    <p className="text-[10px] text-lo mt-0.5">
                      {proj?`${proj.emoji} ${proj.name} · `:'Todos · '}
                      {g.target} {g.unit} / {g.period}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] font-bold font-mono" style={{color}}>
                      {val}/{g.target}
                    </span>
                    <button onClick={()=>setGoals(deleteHobbyGoal(g.id))}
                      className="text-lo hover:text-red-400 transition-colors">
                      <X size={12}/>
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{backgroundColor:color+'18'}}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{width:`${pct}%`,backgroundColor:pct>=100?'#4cae8a':color}}/>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-lo">{pct}%</span>
                  {pct>=100 && <span className="text-[9px] flex items-center gap-0.5" style={{color:'#4cae8a'}}><Check size={9} weight="bold"/>Meta alcanzada</span>}
                </div>
              </div>
            )
          })
        }
      </div>

      {/* Sidebar: galería de logros */}
      <GaleriaWidget projects={projects} ambito={ambito}/>
    </div>
  )
}

// ── Widget Galería ─────────────────────────────────────────────────────────
function GaleriaWidget({ projects, ambito }) {
  const [items,   setItems]   = useState(()=>JSON.parse(localStorage.getItem('dt_hobby_gallery')||'[]'))
  const [showF,   setShowF]   = useState(false)
  const [form,    setForm]    = useState({ title:'', url:'', projectId:'', type:'link' })
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  const save = (list) => { localStorage.setItem('dt_hobby_gallery', JSON.stringify(list)); setItems([...list]) }

  const add = () => {
    if (!form.title.trim()) return
    save([{ id:Date.now().toString(), date:todayStr(), ...form }, ...items])
    setForm({ title:'', url:'', projectId:'', type:'link' })
    setShowF(false)
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0 flex items-center gap-1"><Trophy size={13}/>Galería de logros</p>
          <button onClick={()=>setShowF(v=>!v)}
            className="text-[10px] px-2.5 py-1.5 rounded-lg"
            style={{backgroundColor:ambito.color+'15',color:ambito.color}}>
            + Añadir
          </button>
        </div>
        {showF && (
          <div className="space-y-2 mb-3 p-3 rounded-xl"
            style={{backgroundColor:ambito.color+'08',border:`1px solid ${ambito.color}20`}}>
            <input className="field-input text-[11px] py-1.5 w-full" placeholder="Título del logro *"
              value={form.title} onChange={e=>upd('title',e.target.value)}/>
            <input className="field-input text-[11px] py-1.5 w-full" placeholder="URL / link (opcional)"
              value={form.url} onChange={e=>upd('url',e.target.value)}/>
            <select className="field-input text-[11px] py-1.5 w-full"
              value={form.projectId} onChange={e=>upd('projectId',e.target.value)}>
              <option value="">Sin proyecto específico</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
            <button onClick={add}
              className="btn-primary w-full py-1.5 text-[11px] flex items-center justify-center gap-1.5">
              <Check size={11} weight="bold"/> Guardar
            </button>
          </div>
        )}
        {items.length===0&&!showF
          ? <p className="text-[11px] text-lo text-center py-4">Registra tus creaciones y logros aquí</p>
          : <div className="space-y-2 max-h-80 overflow-y-auto">
              {items.map(item=>{
                const proj = item.projectId ? projects.find(p=>p.id===item.projectId) : null
                return (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <span className="text-[16px]"><Trophy size={16}/></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-hi truncate">{item.title}</p>
                      <p className="text-[9px] text-lo">{item.date}</p>
                    </div>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="text-lo hover:text-mid transition-colors">
                        <Link size={11}/>
                      </a>
                    )}
                    <button onClick={()=>save(items.filter(x=>x.id!==item.id))}
                      className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                      <X size={10}/>
                    </button>
                  </div>
                )
              })}
            </div>
        }
      </div>
    </div>
  )
}

// ── Vista principal ────────────────────────────────────────────────────────
const TABS      = ['Proyectos','Tiempo','Wishlist','Metas']
const TAB_ICONS = { 'Proyectos':Palette, 'Tiempo':Timer, 'Wishlist':Star, 'Metas':Target }

export default function HobbiesView({ ambito }) {
  const habits = getHabits()
  const [tab, setTab] = useState('Proyectos')

  return (
    <div className="min-h-screen">
      <AmbitoHeader ambito={ambito} habits={habits}/>

      <div className="px-6 pt-4 pb-1">
        <div className="flex gap-1 bg-black/30 rounded-xl p-1 overflow-x-auto scrollbar-none">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex-1 justify-center"
              style={tab===t?{backgroundColor:ambito.color+'20',color:ambito.color}:{color:'#555'}}>
              {(() => { const I = TAB_ICONS[t]; return I ? <I size={13}/> : null })()} {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 md:p-6">
        {tab==='Proyectos' && <ProyectosTab ambito={ambito}/>}
        {tab==='Tiempo'    && <TiempoTab    ambito={ambito}/>}
        {tab==='Wishlist'  && <WishlistTab  ambito={ambito}/>}
        {tab==='Metas'     && <MetasTab     ambito={ambito}/>}
      </div>
    </div>
  )
}
